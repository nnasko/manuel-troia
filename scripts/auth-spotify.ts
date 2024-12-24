import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
// Use a simple callback URL just for this script
const REDIRECT_URI = 'http://localhost:3000/callback';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('SPOTIFY_CLIENT_ID:', CLIENT_ID ? '✓' : '✗');
console.log('SPOTIFY_CLIENT_SECRET:', CLIENT_SECRET ? '✓' : '✗');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
console.log('SUPABASE_KEY:', SUPABASE_KEY ? '✓' : '✗');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing Spotify credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function authSpotify() {
  console.log('\nIMPORTANT: Make sure to add http://localhost:3000/callback to your Spotify App\'s Redirect URIs');
  console.log('You can do this at https://developer.spotify.com/dashboard/applications\n');
  
  // Step 1: Get the authorization URL
  const scope = 'user-top-read user-read-private user-read-email';
  const state = Math.random().toString(36).substring(7);
  
  const params = new URLSearchParams();
  params.append('response_type', 'code');
  params.append('client_id', CLIENT_ID!);
  params.append('scope', scope);
  params.append('redirect_uri', REDIRECT_URI);
  params.append('state', state);
  
  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  
  console.log('Visit this URL to authorize Spotify:');
  console.log(authUrl);
  
  // Step 2: Wait for the callback URL (you'll need to paste it)
  console.log('\nAfter authorizing, you will be redirected to a non-existent page.');
  console.log('Copy the URL from your browser and paste it here:');
  const callbackUrl = await new Promise<string>(resolve => {
    process.stdin.resume();
    process.stdin.once('data', data => {
      process.stdin.pause();
      resolve(data.toString().trim());
    });
  });
  
  // Step 3: Extract the code and verify state
  const url = new URL(callbackUrl);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  
  if (!code) {
    console.error('No code found in callback URL');
    process.exit(1);
  }

  if (returnedState !== state) {
    console.error('State mismatch. Expected:', state, 'Got:', returnedState);
    process.exit(1);
  }
  
  // Step 4: Exchange code for tokens directly with Spotify
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    },
    body: new URLSearchParams({
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  
  const tokens = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('Failed to exchange code for tokens:', tokens);
    process.exit(1);
  }
  
  // Step 5: Store tokens in Supabase
  const { error } = await supabase
    .from('spotify_tokens')
    .upsert({
      user_id: 'manuel',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000)
    });
  
  if (error) {
    console.error('Error storing tokens:', error);
    process.exit(1);
  }
  
  console.log('Successfully authenticated and stored tokens!');
  process.exit(0);
}

authSpotify().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 