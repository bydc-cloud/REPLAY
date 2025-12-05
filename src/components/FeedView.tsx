import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Repeat2, Play, Pause, UserPlus, Music, Loader2, Share2, Bookmark, X, Send, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

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

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  likes_count: number;
}

// Demo/seeded tracks for testing
const DEMO_TRACKS: DiscoverTrack[] = [
  {
    id: 'demo-1',
    title: 'Midnight Dreams',
    artist: 'CloudNine',
    cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop',
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
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=800&fit=crop',
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
    cover_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=800&fit=crop',
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
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=800&fit=crop',
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
    cover_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
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
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop',
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
  }
];

// Demo comments
const DEMO_COMMENTS: Comment[] = [
  { id: 'c1', user_id: 'u1', content: 'This beat is fire! Need this in my playlist', created_at: new Date(Date.now() - 3600000).toISOString(), username: 'producer_vibes', display_name: 'Producer Vibes', likes_count: 24 },
  { id: 'c2', user_id: 'u2', content: 'The melody hits different at 0:45', created_at: new Date(Date.now() - 7200000).toISOString(), username: 'beatmaker_jay', display_name: 'Jay Beats', likes_count: 18 },
  { id: 'c3', user_id: 'u3', content: 'Collab?', created_at: new Date(Date.now() - 86400000).toISOString(), username: 'nova_sounds', display_name: 'Nova', likes_count: 5 },
  { id: 'c4', user_id: 'u4', content: 'Been listening to this on repeat all day', created_at: new Date(Date.now() - 172800000).toISOString(), username: 'music_lover22', display_name: 'Music Lover', likes_count: 32 },
];

type FeedTab = 'following' | 'discover';

export function FeedView() {
  const { user, token, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause, setQueue } = useAudioPlayer();
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [discoverTracks, setDiscoverTracks] = useState<DiscoverTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('discover');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [savedTracks, setSavedTracks] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DiscoverTrack | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

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

  const fetchComments = useCallback(async (trackId: string) => {
    setCommentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tracks/${trackId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.length > 0 ? data : DEMO_COMMENTS);
      } else {
        setComments(DEMO_COMMENTS);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setComments(DEMO_COMMENTS);
    }
    setCommentsLoading(false);
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

  // Navigate to next/prev track
  const goToTrack = useCallback((direction: 'next' | 'prev') => {
    if (isScrolling) return;
    setIsScrolling(true);

    setCurrentIndex(prev => {
      if (direction === 'next' && prev < discoverTracks.length - 1) {
        return prev + 1;
      } else if (direction === 'prev' && prev > 0) {
        return prev - 1;
      }
      return prev;
    });

    setTimeout(() => setIsScrolling(false), 400);
  }, [discoverTracks.length, isScrolling]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const timeDiff = Date.now() - touchStartTime.current;

    // Require minimum swipe distance (50px) and maximum time (500ms) for quick swipes
    if (Math.abs(diff) > 50 && timeDiff < 500) {
      if (diff > 0) {
        goToTrack('next');
      } else {
        goToTrack('prev');
      }
    }
  }, [goToTrack]);

  // Wheel handler for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0) {
        goToTrack('next');
      } else {
        goToTrack('prev');
      }
    }
  }, [goToTrack]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'discover' || showComments) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToTrack('next');
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToTrack('prev');
      } else if (e.key === ' ') {
        e.preventDefault();
        const track = discoverTracks[currentIndex];
        if (track) {
          if (currentTrack?.id === track.id) {
            togglePlayPause();
          } else {
            handlePlayTrack(track);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, showComments, currentIndex, discoverTracks, currentTrack, togglePlayPause, goToTrack]);

  const handleLike = async (track: DiscoverTrack, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const wasLiked = likedTracks.has(track.id);
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
        method: wasLiked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to like track:', err);
    }
  };

  const handleSave = (track: DiscoverTrack, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  const handleRepost = async (trackId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/tracks/${trackId}/repost`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
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

  const openComments = (track: DiscoverTrack, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTrack(track);
    setShowComments(true);
    fetchComments(track.id);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !token || !selectedTrack) return;

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      user_id: user?.id || '',
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      username: user?.name || 'You',
      likes_count: 0
    };

    setComments(prev => [tempComment, ...prev]);
    setNewComment('');

    try {
      await fetch(`${API_URL}/api/tracks/${selectedTrack.id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: tempComment.content })
      });
      fetchComments(selectedTrack.id);
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh] bg-black">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Loading feed...</p>
        </div>
      </div>
    );
  }

  const currentTrackData = discoverTracks[currentIndex];

  return (
    <div className="h-full bg-black flex flex-col overflow-hidden relative">
      {/* Top Tabs - Floating over content for Discover only */}
      {activeTab === 'discover' && (
        <div className="absolute top-0 left-0 right-0 z-20 pt-2 pb-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-6">
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('following')}
                className="text-[15px] font-semibold transition-all px-1 py-1 text-white/50"
              >
                Following
              </button>
            )}

            <button
              onClick={() => setActiveTab('discover')}
              className="text-[15px] font-semibold transition-all px-1 py-1 text-white border-b-2 border-white"
            >
              For You
            </button>
          </div>
        </div>
      )}

      {/* Following Tab Header */}
      {activeTab === 'following' && (
        <div className="flex-shrink-0 px-4 pt-3 pb-2 bg-black border-b border-white/5">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setActiveTab('following')}
              className="text-[15px] font-semibold text-white border-b-2 border-white px-1 py-1"
            >
              Following
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className="text-[15px] font-semibold text-white/50 px-1 py-1"
            >
              For You
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative">
        {activeTab === 'discover' ? (
          /* TikTok-style Full Screen Vertical Scroll */
          <div
            ref={containerRef}
            className="h-full w-full relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {discoverTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-8">
                <Music className="w-16 h-16 text-white/20 mb-4" />
                <p className="text-white/60 text-lg font-medium mb-2 text-center">No tracks yet</p>
                <p className="text-white/40 text-sm text-center">
                  Be the first to share your music!
                </p>
              </div>
            ) : currentTrackData && (
              <div className="absolute inset-0 transition-opacity duration-300 ease-out">
                {/* Full Screen Track Card */}
                <div className="relative h-full w-full flex flex-col">
                  {/* Background - Album Art Blurred */}
                  <div className="absolute inset-0">
                    {currentTrackData.cover_url ? (
                      <>
                        <img
                          src={currentTrackData.cover_url}
                          alt=""
                          className="w-full h-full object-cover blur-3xl scale-125 opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-900/50 via-black to-indigo-900/50" />
                    )}
                  </div>

                  {/* Main Content Area - Properly Centered */}
                  <div className="relative flex-1 flex flex-col items-center justify-center px-4 pt-12 pb-24">
                    {/* Album Art - Responsive sizing */}
                    <div
                      className="relative w-[70vw] max-w-[280px] aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl cursor-pointer group mb-5"
                      onClick={() => currentTrack?.id === currentTrackData.id ? togglePlayPause() : handlePlayTrack(currentTrackData)}
                    >
                      {currentTrackData.cover_url ? (
                        <img
                          src={currentTrackData.cover_url}
                          alt={currentTrackData.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center">
                          <Music className="w-16 h-16 text-white/30" />
                        </div>
                      )}

                      {/* Play/Pause Overlay - Always show on mobile tap */}
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        currentTrack?.id === currentTrackData.id && isPlaying ? 'opacity-100' : 'opacity-0 active:opacity-100'
                      }`}>
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          {currentTrack?.id === currentTrackData.id && isPlaying ? (
                            <Pause className="w-8 h-8 text-white" fill="currentColor" />
                          ) : (
                            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                          )}
                        </div>
                      </div>

                      {/* Genre Badge */}
                      {currentTrackData.genre && (
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-[11px] text-white font-medium">
                          {currentTrackData.genre}
                        </div>
                      )}
                    </div>

                    {/* Track Info - Centered */}
                    <div className="text-center w-full max-w-[85vw] px-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 line-clamp-2">
                        {currentTrackData.title}
                      </h2>
                      <p className="text-white/60 text-base mb-3">
                        {currentTrackData.artist}
                      </p>

                      {/* Producer Link */}
                      <button
                        onClick={() => window.location.hash = `#/producer/${currentTrackData.user_id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 active:bg-white/20 transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                          {currentTrackData.avatar_url ? (
                            <img src={currentTrackData.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-[9px] font-bold">
                              {(currentTrackData.display_name || currentTrackData.username).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-white text-sm">@{currentTrackData.username}</span>
                      </button>

                      {/* BPM/Key - Smaller on mobile */}
                      {(currentTrackData.bpm || currentTrackData.musical_key) && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                          {currentTrackData.bpm && (
                            <span className="text-[11px] text-white/40 bg-white/10 px-2 py-0.5 rounded">
                              {currentTrackData.bpm} BPM
                            </span>
                          )}
                          {currentTrackData.musical_key && (
                            <span className="text-[11px] text-white/40 bg-white/10 px-2 py-0.5 rounded">
                              {currentTrackData.musical_key}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side Actions - Better positioned for mobile */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                    {/* Like */}
                    <button
                      onClick={(e) => handleLike(currentTrackData, e)}
                      className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm ${
                        likedTracks.has(currentTrackData.id) ? 'bg-red-500/30' : 'bg-black/30'
                      }`}>
                        <Heart
                          className={`w-5 h-5 ${likedTracks.has(currentTrackData.id) ? 'text-red-500 fill-red-500' : 'text-white'}`}
                        />
                      </div>
                      <span className="text-white text-[10px] font-medium">
                        {formatCount(currentTrackData.likes_count + (likedTracks.has(currentTrackData.id) ? 1 : 0))}
                      </span>
                    </button>

                    {/* Comment */}
                    <button
                      onClick={(e) => openComments(currentTrackData, e)}
                      className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
                    >
                      <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white text-[10px] font-medium">
                        {formatCount(currentTrackData.comments_count)}
                      </span>
                    </button>

                    {/* Repost */}
                    <button
                      onClick={(e) => handleRepost(currentTrackData.id, e)}
                      className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
                    >
                      <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        <Repeat2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white text-[10px] font-medium">
                        {formatCount(currentTrackData.reposts_count)}
                      </span>
                    </button>

                    {/* Save */}
                    <button
                      onClick={(e) => handleSave(currentTrackData, e)}
                      className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
                    >
                      <div className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center ${
                        savedTracks.has(currentTrackData.id) ? 'bg-amber-500/30' : 'bg-black/30'
                      }`}>
                        <Bookmark
                          className={`w-5 h-5 ${savedTracks.has(currentTrackData.id) ? 'text-amber-400 fill-amber-400' : 'text-white'}`}
                        />
                      </div>
                      <span className="text-white text-[10px] font-medium">Save</span>
                    </button>

                    {/* Share */}
                    <button className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
                      <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white text-[10px] font-medium">Share</span>
                    </button>
                  </div>

                  {/* Bottom Navigation - Swipe hint */}
                  <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-3 text-white/40">
                      {currentIndex > 0 && (
                        <button onClick={() => goToTrack('prev')} className="p-1.5 active:bg-white/10 rounded-full">
                          <ChevronUp className="w-5 h-5" />
                        </button>
                      )}
                      <span className="text-xs font-medium bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {currentIndex + 1} / {discoverTracks.length}
                      </span>
                      {currentIndex < discoverTracks.length - 1 && (
                        <button onClick={() => goToTrack('next')} className="p-1.5 active:bg-white/10 rounded-full">
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-white/30">Swipe to browse</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Following Feed */
          <div className="h-full overflow-y-auto pt-14 px-3 py-4 sm:px-4">
            {feed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <UserPlus className="w-14 h-14 sm:w-16 sm:h-16 text-white/20 mb-4" />
                <p className="text-white/60 text-base sm:text-lg font-medium mb-2 text-center">Your feed is empty</p>
                <p className="text-white/40 text-sm text-center max-w-xs">
                  Follow producers to see their activity and new releases here
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl mx-auto">
                {feed.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white/5 hover:bg-white/8 active:bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all"
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {event.avatar_url ? (
                          <img src={event.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-xs sm:text-sm">
                            {(event.display_name || event.username).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 text-xs sm:text-sm">
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
                          <div className="mt-2 flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl">
                            {event.target_data.cover_url ? (
                              <img
                                src={event.target_data.cover_url}
                                alt=""
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Music className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium truncate text-xs sm:text-sm">{event.target_data.title}</p>
                              <p className="text-white/50 text-[10px] sm:text-xs truncate">{event.target_data.artist}</p>
                            </div>
                            <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
                              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black ml-0.5" fill="currentColor" />
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
      </div>

      {/* Comments Modal */}
      {showComments && selectedTrack && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setShowComments(false);
              setSelectedTrack(null);
            }}
          />

          {/* Comments Sheet - mobile optimized */}
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl max-h-[80vh] sm:max-h-[70vh] flex flex-col safe-area-bottom">
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-white font-semibold text-sm sm:text-base">
                {formatCount(selectedTrack.comments_count)} comments
              </span>
              <button
                onClick={() => {
                  setShowComments(false);
                  setSelectedTrack(null);
                }}
                className="p-2 -mr-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No comments yet</p>
                  <p className="text-white/30 text-xs mt-1">Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {(comment.display_name || comment.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white/80 text-xs sm:text-sm font-medium">
                          {comment.display_name || comment.username}
                        </span>
                        <span className="text-white/30 text-[10px] sm:text-xs">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-white text-xs sm:text-sm leading-relaxed">{comment.content}</p>
                      <button className="flex items-center gap-1 mt-1.5 text-white/40 hover:text-white/60 active:scale-95 transition-all p-1 -ml-1">
                        <Heart className="w-3.5 h-3.5" />
                        <span className="text-[10px] sm:text-xs">{comment.likes_count > 0 ? formatCount(comment.likes_count) : 'Like'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input - mobile optimized */}
            {isAuthenticated && (
              <div className="p-3 sm:p-4 border-t border-white/10 bg-zinc-900">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                      placeholder="Add a comment..."
                      className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                    />
                    {newComment.trim() && (
                      <button
                        onClick={handleSubmitComment}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-violet-500 hover:bg-violet-600 active:scale-95 transition-all"
                      >
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedView;
