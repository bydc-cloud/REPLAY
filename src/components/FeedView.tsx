import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Repeat2, Play, Pause, UserPlus, Music, Loader2, RefreshCw, Share2, Bookmark, ChevronDown, Sliders } from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useSettings } from '../contexts/SettingsContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

interface FeedEvent {
  id: string;
  user_id: string;
  event_type: 'like' | 'comment' | 'repost' | 'follow' | 'upload';
  target_type: 'track' | 'user';
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  target_data?: {
    id: string;
    title?: string;
    artist?: string;
    cover_url?: string;
    username?: string;
  };
}

interface DiscoverTrack {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  duration: number;
  bpm?: number;
  musical_key?: string;
  genre?: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  user_id: string;
  is_beat?: boolean;
  play_count?: number;
}

// Demo/seeded tracks for testing the TikTok-style feed
const DEMO_TRACKS: DiscoverTrack[] = [
  {
    id: 'demo-1',
    title: 'Midnight Dreams',
    artist: 'CloudNine',
    cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    duration: 195,
    bpm: 128,
    musical_key: 'Am',
    genre: 'Lo-Fi',
    username: 'cloudnine',
    display_name: 'CloudNine',
    likes_count: 1243,
    reposts_count: 89,
    comments_count: 45,
    user_id: 'demo-user-1',
    is_beat: false,
    play_count: 15420
  },
  {
    id: 'demo-2',
    title: 'Tokyo Drift',
    artist: 'BeatMaker808',
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    duration: 180,
    bpm: 140,
    musical_key: 'Cm',
    genre: 'Trap',
    username: 'beatmaker808',
    display_name: 'BeatMaker808',
    likes_count: 3521,
    reposts_count: 234,
    comments_count: 128,
    user_id: 'demo-user-2',
    is_beat: true,
    play_count: 45230
  },
  {
    id: 'demo-3',
    title: 'Summer Vibes',
    artist: 'MelodyMaster',
    cover_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
    duration: 210,
    bpm: 100,
    musical_key: 'F',
    genre: 'R&B',
    username: 'melodymaster',
    display_name: 'MelodyMaster',
    likes_count: 892,
    reposts_count: 56,
    comments_count: 23,
    user_id: 'demo-user-3',
    is_beat: false,
    play_count: 8920
  },
  {
    id: 'demo-4',
    title: 'Dark Matter',
    artist: 'ProdByNova',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
    duration: 165,
    bpm: 145,
    musical_key: 'Gm',
    genre: 'Drill',
    username: 'prodbynova',
    display_name: 'ProdByNova',
    likes_count: 5678,
    reposts_count: 412,
    comments_count: 234,
    user_id: 'demo-user-4',
    is_beat: true,
    play_count: 78900
  },
  {
    id: 'demo-5',
    title: 'Ocean Waves',
    artist: 'ChillBeats',
    cover_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    duration: 240,
    bpm: 85,
    musical_key: 'D',
    genre: 'Ambient',
    username: 'chillbeats',
    display_name: 'ChillBeats',
    likes_count: 2134,
    reposts_count: 167,
    comments_count: 89,
    user_id: 'demo-user-5',
    is_beat: false,
    play_count: 23450
  },
  {
    id: 'demo-6',
    title: 'Neon Streets',
    artist: 'SynthWave',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    duration: 200,
    bpm: 120,
    musical_key: 'Em',
    genre: 'Synthwave',
    username: 'synthwave',
    display_name: 'SynthWave',
    likes_count: 4521,
    reposts_count: 289,
    comments_count: 156,
    user_id: 'demo-user-6',
    is_beat: true,
    play_count: 56780
  },
  {
    id: 'demo-7',
    title: 'Purple Rain',
    artist: 'LoFiKing',
    cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    duration: 185,
    bpm: 90,
    musical_key: 'Bb',
    genre: 'Lo-Fi',
    username: 'lofiking',
    display_name: 'LoFiKing',
    likes_count: 1876,
    reposts_count: 123,
    comments_count: 67,
    user_id: 'demo-user-7',
    is_beat: false,
    play_count: 19870
  },
  {
    id: 'demo-8',
    title: 'Hard Knock',
    artist: 'TrapGod',
    cover_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop',
    duration: 175,
    bpm: 150,
    musical_key: 'Dm',
    genre: 'Trap',
    username: 'trapgod',
    display_name: 'TrapGod',
    likes_count: 8932,
    reposts_count: 567,
    comments_count: 345,
    user_id: 'demo-user-8',
    is_beat: true,
    play_count: 123400
  }
];

type FeedTab = 'following' | 'discover' | 'beats';

export function FeedView() {
  const { token, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause, setQueue } = useAudioPlayer();
  const { developerMode } = useSettings();
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [discoverTracks, setDiscoverTracks] = useState<DiscoverTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('discover');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [savedTracks, setSavedTracks] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFeed(data);
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    }
  }, [token]);

  const fetchDiscoverTracks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/discover/tracks?limit=20`);
      if (response.ok) {
        const data = await response.json();
        const merged = [...data, ...DEMO_TRACKS.filter(dt => !data.find((t: DiscoverTrack) => t.id === dt.id))];
        setDiscoverTracks(merged.length > 0 ? merged : DEMO_TRACKS);
      } else {
        setDiscoverTracks(DEMO_TRACKS);
      }
    } catch (err) {
      console.error('Failed to fetch discover tracks:', err);
      setDiscoverTracks(DEMO_TRACKS);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        isAuthenticated ? fetchFeed() : Promise.resolve(),
        fetchDiscoverTracks()
      ]);
      setLoading(false);
    };
    loadData();
  }, [isAuthenticated, fetchFeed, fetchDiscoverTracks]);

  // Get filtered tracks based on active tab
  const filteredTracks = activeTab === 'beats'
    ? discoverTracks.filter(t => t.is_beat)
    : discoverTracks;

  // Reset index when tab changes
  useEffect(() => {
    setCurrentIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Simple scroll handler - let CSS snap do the work
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(container.scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredTracks.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, filteredTracks.length]);

  const scrollToIndex = (index: number) => {
    if (!containerRef.current || index < 0 || index >= filteredTracks.length) return;
    const itemHeight = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    });
  };

  const handleLike = async (track: DiscoverTrack) => {
    setLikedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(track.id)) {
        newSet.delete(track.id);
      } else {
        newSet.add(track.id);
      }
      return newSet;
    });

    if (!token) return;

    try {
      await fetch(`${API_URL}/api/tracks/${track.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to like track:', err);
    }
  };

  const handleSave = (track: DiscoverTrack) => {
    setSavedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(track.id)) {
        newSet.delete(track.id);
      } else {
        newSet.add(track.id);
      }
      return newSet;
    });
  };

  const handleRepost = async (trackId: string) => {
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/tracks/${trackId}/repost`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDiscoverTracks();
    } catch (err) {
      console.error('Failed to repost track:', err);
    }
  };

  const handlePlayTrack = (track: DiscoverTrack) => {
    const queueTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: '',
      duration: track.duration,
      coverUrl: track.cover_url || '',
      fileUrl: '',
      fileData: null,
      fileKey: null,
      playCount: 0,
      isLiked: likedTracks.has(track.id),
      addedAt: new Date()
    };
    setQueue([queueTrack as any], 0);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh] bg-black">
        <div className="text-center">
          <div className="flex items-end justify-center gap-1 h-12 mb-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-white/60"
                style={{
                  height: '100%',
                  animation: `audioLoading 1s ease-in-out ${i * 0.1}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-white/40 text-sm">Loading your feed...</p>
        </div>
        <style>{`
          @keyframes audioLoading {
            0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
            50% { transform: scaleY(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-full bg-black flex flex-col relative">
      {/* Top Tabs - TikTok style - positioned below mobile header */}
      <div className="absolute top-[68px] md:top-0 left-0 right-0 z-40 pt-4 pb-3 px-4 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none">
        <div className="flex items-center justify-center gap-8 pointer-events-auto">
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('following')}
              className={`text-base font-semibold transition-all pb-1 border-b-2 ${
                activeTab === 'following'
                  ? 'text-white border-white'
                  : 'text-white/50 border-transparent hover:text-white/70'
              }`}
            >
              Following
            </button>
          )}

          <button
            onClick={() => setActiveTab('discover')}
            className={`text-base font-semibold transition-all pb-1 border-b-2 ${
              activeTab === 'discover'
                ? 'text-white border-white'
                : 'text-white/50 border-transparent hover:text-white/70'
            }`}
          >
            Discover
          </button>

          {developerMode && (
            <button
              onClick={() => setActiveTab('beats')}
              className={`text-base font-semibold transition-all pb-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'beats'
                  ? 'text-white border-white'
                  : 'text-white/50 border-transparent hover:text-white/70'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Beats
            </button>
          )}
        </div>
      </div>

      {/* Refresh button - positioned below mobile header */}
      <button
        onClick={() => {
          setLoading(true);
          Promise.all([fetchFeed(), fetchDiscoverTracks()]).then(() => setLoading(false));
        }}
        className="absolute top-[76px] md:top-4 right-4 z-40 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-sm"
      >
        <RefreshCw className="w-4 h-4 text-white/70" />
      </button>

      {/* Main Content */}
      {activeTab !== 'following' ? (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
          onScroll={handleScroll}
          style={{
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {filteredTracks.length === 0 ? (
            <div className="h-full min-h-[80vh] flex items-center justify-center">
              <div className="text-center px-8">
                <Music className="w-16 h-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/60 text-lg font-medium mb-2">
                  {activeTab === 'beats' ? 'No beats found' : 'No tracks yet'}
                </p>
                <p className="text-white/40 text-sm">
                  {activeTab === 'beats'
                    ? 'Check back soon for new beats from producers'
                    : 'Be the first to share your music!'}
                </p>
              </div>
            </div>
          ) : (
            filteredTracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              const isLiked = likedTracks.has(track.id);
              const isSaved = savedTracks.has(track.id);

              return (
                <div
                  key={track.id}
                  className="h-full min-h-[calc(100vh-120px)] w-full relative flex items-center justify-center"
                  style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                >
                  {/* Background - Cover art blurred */}
                  <div className="absolute inset-0 overflow-hidden">
                    {track.cover_url ? (
                      <>
                        <img
                          src={track.cover_url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-30"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 py-8">
                    {/* Album Art with Play Button */}
                    <button
                      className="relative mb-6 group cursor-pointer"
                      onClick={() => isCurrentTrack ? togglePlayPause() : handlePlayTrack(track)}
                    >
                      <div className="w-56 h-56 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                        {track.cover_url ? (
                          <img
                            src={track.cover_url}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                            <Music className="w-20 h-20 text-white/30" />
                          </div>
                        )}

                        {/* Play/Pause overlay */}
                        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-200 ${
                          isCurrentTrack && isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                        }`}>
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                            {isCurrentTrack && isPlaying ? (
                              <Pause className="w-8 h-8 text-white" fill="currentColor" />
                            ) : (
                              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Track Info */}
                    <div className="text-center mb-4 max-w-sm">
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-1 line-clamp-1">
                        {track.title}
                      </h2>
                      <p className="text-white/60 text-base mb-3">{track.artist}</p>

                      {/* Tags */}
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {track.genre && (
                          <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs text-white/70">
                            {track.genre}
                          </span>
                        )}
                        {track.bpm && (
                          <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs text-white/70">
                            {track.bpm} BPM
                          </span>
                        )}
                        {track.musical_key && (
                          <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs text-white/70">
                            {track.musical_key}
                          </span>
                        )}
                        <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs text-white/70">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Producer Info */}
                    <button
                      className="flex items-center gap-2.5 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-full transition-colors mb-3"
                      onClick={() => {
                        window.location.hash = `#/producer/${track.user_id}`;
                      }}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                        {track.avatar_url ? (
                          <img src={track.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xs font-bold">
                            {(track.display_name || track.username).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-white/80 text-sm font-medium">
                        @{track.username}
                      </span>
                    </button>

                    {/* Play count */}
                    {track.play_count !== undefined && (
                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <Play className="w-3 h-3" />
                        <span>{formatCount(track.play_count)} plays</span>
                      </div>
                    )}

                    {/* Action Buttons - Horizontal layout */}
                    <div className="flex items-center justify-center gap-3 mt-6">
                      {/* Like */}
                      <button
                        onClick={() => handleLike(track)}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                          isLiked
                            ? 'bg-red-500'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}>
                          <Heart
                            className={`w-5 h-5 ${isLiked ? 'text-white' : 'text-white'}`}
                            fill={isLiked ? 'currentColor' : 'none'}
                          />
                        </div>
                        <span className="text-white/60 text-[10px]">
                          {formatCount(track.likes_count + (isLiked ? 1 : 0))}
                        </span>
                      </button>

                      {/* Comment */}
                      <button className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white/60 text-[10px]">
                          {formatCount(track.comments_count)}
                        </span>
                      </button>

                      {/* Repost */}
                      <button
                        onClick={() => handleRepost(track.id)}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                          <Repeat2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white/60 text-[10px]">
                          {formatCount(track.reposts_count)}
                        </span>
                      </button>

                      {/* Save */}
                      <button
                        onClick={() => handleSave(track)}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                          isSaved ? 'bg-amber-500' : 'bg-white/10 hover:bg-white/20'
                        }`}>
                          <Bookmark
                            className={`w-5 h-5 ${isSaved ? 'text-white' : 'text-white'}`}
                            fill={isSaved ? 'currentColor' : 'none'}
                          />
                        </div>
                        <span className="text-white/60 text-[10px]">Save</span>
                      </button>

                      {/* Share */}
                      <button className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                          <Share2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white/60 text-[10px]">Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Scroll hint - only show on first item */}
                  {index === 0 && filteredTracks.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
                      <span className="text-white/30 text-xs">Swipe up</span>
                      <ChevronDown className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Following Feed - Activity style */
        <div className="flex-1 overflow-y-auto pt-28 md:pt-16 pb-8 px-4">
          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
              <UserPlus className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/60 text-lg font-medium mb-2">Your feed is empty</p>
              <p className="text-white/40 text-sm text-center max-w-xs">
                Follow producers to see their activity and new releases here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              {feed.map((event) => (
                <div
                  key={event.id}
                  className="bg-white/5 hover:bg-white/8 rounded-2xl p-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {event.avatar_url ? (
                        <img src={event.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {(event.display_name || event.username).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm">
                        <span className="font-semibold">{event.display_name || event.username}</span>
                        {' '}
                        <span className="text-white/50">
                          {event.event_type === 'like' && 'liked a track'}
                          {event.event_type === 'repost' && 'reposted a track'}
                          {event.event_type === 'comment' && 'commented on a track'}
                          {event.event_type === 'follow' && 'followed someone'}
                          {event.event_type === 'upload' && 'uploaded a new track'}
                        </span>
                      </p>
                      {event.target_data && event.target_type === 'track' && (
                        <div className="mt-2 flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                          {event.target_data.cover_url ? (
                            <img
                              src={event.target_data.cover_url}
                              alt=""
                              className="w-11 h-11 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-11 h-11 bg-white/10 rounded-lg flex items-center justify-center">
                              <Music className="w-5 h-5 text-white/40" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium truncate text-sm">{event.target_data.title}</p>
                            <p className="text-white/50 text-xs truncate">{event.target_data.artist}</p>
                          </div>
                          <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress dots - side indicator */}
      {activeTab !== 'following' && filteredTracks.length > 1 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-30">
          {filteredTracks.slice(0, Math.min(8, filteredTracks.length)).map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIndex(idx)}
              className={`w-1 rounded-full transition-all duration-200 ${
                idx === currentIndex
                  ? 'h-5 bg-white'
                  : 'h-1 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
          {filteredTracks.length > 8 && (
            <span className="text-white/30 text-[8px] text-center">+{filteredTracks.length - 8}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default FeedView;
