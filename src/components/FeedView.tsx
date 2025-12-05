import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Repeat2, Play, Pause, UserPlus, Music, Loader2, Share2, Bookmark, X, Send } from 'lucide-react';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('discover');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [savedTracks, setSavedTracks] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DiscoverTrack | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const PAGE_SIZE = 12;

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

  const fetchDiscoverTracks = useCallback(async (append = false) => {
    // Avoid concurrent loads
    if (loadingMore && append) return;

    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const offset = append ? discoverTracks.length : 0;

    try {
      const response = await fetch(`${API_URL}/api/discover/tracks?limit=${PAGE_SIZE}&offset=${offset}`);
      if (response.ok) {
        const data: DiscoverTrack[] = await response.json();
        setHasMore(data.length >= PAGE_SIZE);

        setDiscoverTracks(prev => {
          const base = append ? prev : [];
          // Deduplicate by id while preserving order
          const combined = [...base, ...data];
          const seen = new Set<string>();
          return (combined.length > 0 ? combined : DEMO_TRACKS).filter((track) => {
            if (seen.has(track.id)) return false;
            seen.add(track.id);
            return true;
          });
        });
      } else {
        if (!append) setDiscoverTracks(DEMO_TRACKS);
      }
    } catch (err) {
      console.error('Failed to fetch discover tracks:', err);
      if (!append) setDiscoverTracks(DEMO_TRACKS);
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [discoverTracks.length, loadingMore, PAGE_SIZE]);

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
        fetchDiscoverTracks(false)
      ]);
      setLoading(false);
    };
    loadData();
  }, [isAuthenticated, fetchFeed, fetchDiscoverTracks]);

  // Track current index based on scroll position (one item per viewport)
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, clientHeight } = el;
    const idx = Math.round(scrollTop / clientHeight);
    if (idx !== currentIndex) {
      setCurrentIndex(Math.min(Math.max(idx, 0), Math.max(discoverTracks.length - 1, 0)));
    }
  }, [currentIndex, discoverTracks.length]);

  // Prefetch next page when near the end
  const nearEndRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (!node || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          fetchDiscoverTracks(true);
        }
      },
      { root: containerRef.current, rootMargin: '40% 0px', threshold: 0.25 }
    );
    observerRef.current.observe(node);
  }, [fetchDiscoverTracks, hasMore]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'discover' || showComments) return;
      if (e.key === ' ') {
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
  }, [activeTab, showComments, currentIndex, discoverTracks, currentTrack, togglePlayPause]);

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

  return (
    <div className="h-full bg-black flex flex-col overflow-hidden">
      {/* Top Tabs - Floating over content */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-3 pb-2">
        <div className="flex items-center justify-center gap-8">
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('following')}
              className={`text-base font-bold transition-all ${
                activeTab === 'following'
                  ? 'text-white'
                  : 'text-white/50'
              }`}
            >
              Following
            </button>
          )}

          <button
            onClick={() => setActiveTab('discover')}
            className={`text-base font-bold transition-all ${
              activeTab === 'discover'
                ? 'text-white'
                : 'text-white/50'
            }`}
          >
            For You
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {activeTab === 'discover' ? (
          /* TikTok-style Full Screen Vertical Scroll */
          <div className="h-full w-full relative">
            {discoverTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Music className="w-16 h-16 text-white/20 mb-4" />
                <p className="text-white/60 text-lg font-medium mb-2 text-center">No tracks yet</p>
                <p className="text-white/40 text-sm text-center px-4">
                  Be the first to share your music!
                </p>
              </div>
            ) : (
              <div
                ref={containerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory overscroll-y-contain"
                style={{ scrollSnapStop: 'always', WebkitOverflowScrolling: 'touch' }}
                onScroll={handleScroll}
              >
                {discoverTracks.map((track, idx) => (
                  <div
                    key={track.id}
                    ref={idx >= discoverTracks.length - 2 ? nearEndRef : undefined}
                    className="h-screen min-h-screen snap-start snap-always relative flex flex-col"
                  >
                    {/* Background */}
                    <div className="absolute inset-0">
                      {track.cover_url ? (
                        <>
                          <img
                            src={track.cover_url}
                            alt=""
                            className="w-full h-full object-cover blur-2xl scale-110 opacity-50"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-900 via-black to-indigo-900" />
                      )}
                    </div>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-32">
                      {/* Album Art */}
                      <div
                        className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl cursor-pointer group mb-6"
                        onClick={() => currentTrack?.id === track.id ? togglePlayPause() : handlePlayTrack(track)}
                      >
                        {track.cover_url ? (
                          <img
                            src={track.cover_url}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center">
                            <Music className="w-20 h-20 text-white/30" />
                          </div>
                        )}

                        {/* Play/Pause Overlay */}
                        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${
                          currentTrack?.id === track.id && isPlaying ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            {currentTrack?.id === track.id && isPlaying ? (
                              <Pause className="w-10 h-10 text-white" fill="currentColor" />
                            ) : (
                              <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
                            )}
                          </div>
                        </div>

                        {/* Genre Badge */}
                        {track.genre && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                            {track.genre}
                          </div>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="text-center max-w-sm">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 line-clamp-2">
                          {track.title}
                        </h2>
                        <p className="text-white/70 text-lg mb-3">
                          {track.artist}
                        </p>

                        {/* Producer Link */}
                        <button
                          onClick={() => window.location.hash = `#/producer/${track.user_id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                            {track.avatar_url ? (
                              <img src={track.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-[10px] font-bold">
                                {(track.display_name || track.username).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-white text-sm font-medium">@{track.username}</span>
                        </button>

                        {/* BPM/Key */}
                        {(track.bpm || track.musical_key) && (
                          <div className="flex items-center justify-center gap-3 mt-3">
                            {track.bpm && (
                              <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                                {track.bpm} BPM
                              </span>
                            )}
                            {track.musical_key && (
                              <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                                Key: {track.musical_key}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="absolute right-4 bottom-40 flex flex-col items-center gap-5">
                      <button
                        onClick={(e) => handleLike(track, e)}
                        className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          likedTracks.has(track.id) ? 'bg-red-500/20' : 'bg-white/10'
                        }`}>
                          <Heart
                            className={`w-6 h-6 ${likedTracks.has(track.id) ? 'text-red-500 fill-red-500' : 'text-white'}`}
                          />
                        </div>
                        <span className="text-white text-xs font-medium">
                          {formatCount(track.likes_count + (likedTracks.has(track.id) ? 1 : 0))}
                        </span>
                      </button>

                      <button
                        onClick={(e) => openComments(track, e)}
                        className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xs font-medium">
                          {formatCount(track.comments_count)}
                        </span>
                      </button>

                      <button
                        onClick={(e) => handleRepost(track.id, e)}
                        className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <Repeat2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xs font-medium">
                          {formatCount(track.reposts_count)}
                        </span>
                      </button>

                      <button
                        onClick={(e) => handleSave(track, e)}
                        className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          savedTracks.has(track.id) ? 'bg-amber-500/20' : 'bg-white/10'
                        }`}>
                          <Bookmark
                            className={`w-6 h-6 ${savedTracks.has(track.id) ? 'text-amber-400 fill-amber-400' : 'text-white'}`}
                          />
                        </div>
                        <span className="text-white text-xs font-medium">Save</span>
                      </button>

                      <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <Share2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xs font-medium">Share</span>
                      </button>
                    </div>

                    {/* Position Indicator */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex flex-col items-center gap-1 text-white/60">
                      <span className="text-xs bg-white/10 px-3 py-1 rounded-full backdrop-blur">
                        {idx + 1} / {discoverTracks.length}
                      </span>
                    </div>
                  </div>
                ))}

                {loadingMore && (
                  <div className="py-6 flex items-center justify-center text-white/50 text-sm">
                    Loading more...
                  </div>
                )}
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
