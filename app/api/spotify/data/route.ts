import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string }[];
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  const data = await response.json();
  
  // Update token in Supabase
  await supabase
    .from('spotify_tokens')
    .update({
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      last_updated: new Date().toISOString()
    })
    .eq('user_id', 'manuel'); // We only have one row for Manuel
  
  return data.access_token;
}

async function getValidAccessToken() {
  // Get Manuel's token
  const { data: tokenData, error } = await supabase
    .from('spotify_tokens')
    .select('*')
    .single(); // We only have one row

  if (error || !tokenData) {
    throw new Error('Failed to get token');
  }

  // Check if token needs refresh
  if (Date.now() >= tokenData.expires_at) {
    return await refreshAccessToken(tokenData.refresh_token);
  }
  
  return tokenData.access_token;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') || 'medium_term') as TimeRange;

    // Check if we have recent data
    const { data: cachedData } = await supabase
      .from('spotify_data')
      .select('*')
      .eq('time_range', timeRange)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If we have data less than 1 hour old, return it
    if (cachedData && Date.now() - new Date(cachedData.created_at).getTime() < 3600000) {
      return NextResponse.json({
        artists: cachedData.artists,
        tracks: cachedData.tracks,
        genres: cachedData.genres,
        timeRange
      });
    }

    const accessToken = await getValidAccessToken();

    // Fetch top items
    const [artistsRes, tracksRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/me/top/artists?limit=6&time_range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch(`https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ]);

    if (!artistsRes.ok || !tracksRes.ok) {
      throw new Error('Failed to fetch Spotify data');
    }

    const [artists, tracks] = await Promise.all([
      artistsRes.json(),
      tracksRes.json()
    ]);

    // Extract genres from artists
    const allGenres = artists.items.flatMap((artist: SpotifyArtist) => artist.genres);
    const uniqueGenres = [...new Set(allGenres)].slice(0, 6);

    // Store the new data
    const { error: insertError } = await supabase
      .from('spotify_data')
      .insert({
        time_range: timeRange,
        artists: artists.items,
        tracks: tracks.items,
        genres: uniqueGenres
      });

    if (insertError) {
      console.error('Error storing data:', insertError);
    }

    return NextResponse.json({
      artists: artists.items,
      tracks: tracks.items,
      genres: uniqueGenres,
      timeRange
    });
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    return NextResponse.json({ error: 'Failed to fetch Spotify data' }, { status: 500 });
  }
} 