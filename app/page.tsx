'use client'

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Youtube, Instagram, Music2, Clock, Disc } from 'lucide-react';

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
}

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
}

type TabType = 'artists' | 'tracks' | 'genres';
type TimeRange = 'short_term' | 'medium_term' | 'long_term';

const socialIcons = {
  youtube: { icon: Youtube, url: 'https://www.youtube.com/@Manuel_cx' },
  instagram: { icon: Instagram, url: 'https://www.instagram.com/manuel.cx__' },
  tiktok: { icon: Music2, url: 'https://www.tiktok.com/@manuel.cx_' },
};

const tabs: { id: TabType; label: string; icon: React.ReactElement }[] = [
  { id: 'artists', label: 'TOP ARTISTS', icon: <Disc size={16} strokeWidth={1} /> },
  { id: 'tracks', label: 'TOP TRACKS', icon: <Music2 size={16} strokeWidth={1} /> },
  { id: 'genres', label: 'GENRES', icon: <Clock size={16} strokeWidth={1} /> },
];

const timeRanges = [
  { id: 'short_term', label: 'LAST 4 WEEKS' },
  { id: 'medium_term', label: 'LAST 6 MONTHS' },
  { id: 'long_term', label: 'ALL TIME' }
] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('artists');
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topGenres, setTopGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpotifyData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/spotify/data?timeRange=${timeRange}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated, redirect to auth endpoint
            window.location.href = '/api/spotify/auth';
            return;
          }
          throw new Error('Failed to fetch Spotify data');
        }
        
        const data = await response.json();
        setTopArtists(data.artists);
        setTopTracks(data.tracks);
        setTopGenres(data.genres);
        setError(null);
      } catch (error) {
        console.error('Error fetching Spotify data:', error);
        setError('Failed to load Spotify data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpotifyData();
  }, [timeRange]);

  const renderTimeRangeSelector = () => (
    <div className="flex justify-center gap-4 mb-6">
      {timeRanges.map(({ id, label }) => (
        <motion.button
          key={id}
          onClick={() => setTimeRange(id)}
          className={`text-xs tracking-[0.1em] py-2 px-4 rounded-sm transition-colors ${
            timeRange === id 
              ? 'bg-white/10 text-white ' 
              : 'text-white/50 hover:text-white/70'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {label}
        </motion.button>
      ))}
    </div>
  );

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center p-8">
          <p className="text-white/70 mb-4">Failed to load Spotify data. Please try again later.</p>
        </div>
      );
    }

    if (isLoading) {
      return <div className="text-center text-white/50 p-8">...</div>;
    }

    switch (activeTab) {
      case 'artists':
        return (
          <div className="grid grid-cols-3 gap-8 p-4">
            {topArtists.map((artist) => (
              <motion.div
                key={artist.id}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <div className="relative aspect-square mb-3">
                  <Image
                    src={artist.images[0]?.url}
                    alt={artist.name}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    style={{
                      clipPath: 'polygon(0 10%, 10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%)'
                    }}
                  />
                </div>
                <p className="text-xs tracking-[0.2em] text-white/70 text-center uppercase">
                  {artist.name}
                </p>
              </motion.div>
            ))}
          </div>
        );
      case 'tracks':
        return (
          <div className="grid grid-cols-1 gap-4 p-4">
            {topTracks.map((track) => (
              <motion.div
                key={track.id}
                whileHover={{ scale: 1.01 }}
                className="group flex items-center gap-4 p-4 bg-black/40 backdrop-blur-sm"
                style={{
                  clipPath: 'polygon(0 0, 98% 0, 100% 50%, 98% 100%, 0 100%, 2% 50%)'
                }}
              >
                <div className="relative w-12 h-12 shrink-0">
                  <Image
                    src={track.album.images[0]?.url}
                    alt={track.name}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <div className="min-w-0 px-2">
                  <p className="text-sm tracking-wider text-white truncate">
                    {track.name}
                  </p>
                  <p className="text-xs tracking-wider text-white/70 truncate">
                    {track.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        );
      case 'genres':
        return (
          <div className="grid grid-cols-2 gap-4 p-4">
            {topGenres.map((genre) => (
              <motion.div
                key={genre}
                whileHover={{ scale: 1.02 }}
                className="relative p-6 bg-black/40 backdrop-blur-sm text-center"
                style={{
                  clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)'
                }}
              >
                <p className="text-lg tracking-[0.2em] text-white uppercase">
                  {genre}
                </p>
              </motion.div>
            ))}
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        <motion.div
          className="absolute inset-0 bg-[#1a1a1a]"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundSize: '200% 200%',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, black 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="text-center mb-16"
        >
          <div className="relative inline-block">
            <Image
              src="/manuel.jpg"
              alt="Manuel Troia"
              width={200}
              height={200}
              className="grayscale contrast-125 mx-auto"
              style={{
                clipPath: 'polygon(0 15%, 15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%)'
              }}
            />
            <motion.div
              className="absolute inset-0 border border-white/20"
              animate={{
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                clipPath: 'polygon(0 15%, 15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%)'
              }}
            />
          </div>
          
          <motion.h1
            className="mt-8 text-4xl tracking-[0.2em] font-light"
            animate={{ letterSpacing: ["0.2em", "0.3em", "0.2em"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            MANUEL TROIA
          </motion.h1>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-12 mb-16"
        >
          {Object.entries(socialIcons).map(([platform, { icon: Icon, url }]) => (
            <motion.a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className="opacity-50 hover:opacity-100 transition-opacity duration-300"
            >
              <Icon size={32} strokeWidth={1} />
            </motion.a>
          ))}
        </motion.div>

        {/* Snapcode */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-16 text-center"
        >
          <div className="relative inline-block">
            <Image
              src="/snapcode.jpg"
              alt="Snapcode"
              width={160}
              height={160}
              className="invert opacity-80"
            />
          </div>
        </motion.div>

        {/* Spotify Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="backdrop-blur-sm bg-white/[0.02] border border-white/[0.05]"
          style={{
            clipPath: 'polygon(0 5%, 5% 0, 95% 0, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0 95%)'
          }}
        >
          {/* Time Range Selector */}
          {renderTimeRangeSelector()}

          {/* Tabs */}
          <div className="flex justify-center gap-8 p-6 border-b border-white/[0.05]">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 text-xs tracking-[0.2em] transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white/70'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
