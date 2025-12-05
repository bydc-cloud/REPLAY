import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Repeat2, Play, Pause, UserPlus, Music, Loader2, Share2, Bookmark, X, Send, Volume2, VolumeX, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

// Animated heart burst component
const HeartBurst = ({ show, onComplete }: { show: boolean; onComplete: () => void }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <Heart
        className="w-32 h-32 text-red-500 fill-red-500 animate-ping"
        style={{ animationDuration: '0.6s' }}
      />
    </div>
  );
};

// Vinyl spinning record component
const SpinningVinyl = ({ coverUrl, isPlaying, size = 'normal' }: { coverUrl?: string; isPlaying: boolean; size?: 'normal' | 'small' }) => {
  const sizeClasses = size === 'small' ? 'w-12 h-12' : 'w-16 h-16 md:w-20 md:h-20';

  return (
    <div className={`${sizeClasses} rounded-full border-4 border-zinc-800 shadow-xl overflow-hidden ${isPlaying ? 'animate-spin' : ''}`}
      style={{ animationDuration: '3s' }}>
      <div className="w-full h-full relative">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-800" />
        )}
        {/* Vinyl center hole */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-zinc-900 border-2 border-zinc-700" />
        </div>
      </div>
    </div>
  );
};

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


type FeedTab = 'following' | 'foryou' | 'beats';

export function FeedView() {
  const { user, token, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause, setQueue } = useAudioPlayer();
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [discoverTracks, setDiscoverTracks] = useState<DiscoverTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [savedTracks, setSavedTracks] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DiscoverTrack | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postArtist, setPostArtist] = useState('');
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postCover, setPostCover] = useState<string | null>(null);
  const [postIsBeat, setPostIsBeat] = useState(false);
  const [posting, setPosting] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTapRef = useRef<{ time: number; trackId: string | null }>({ time: 0, trackId: null });
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
          return combined.filter((track) => {
            if (seen.has(track.id)) return false;
            seen.add(track.id);
            return true;
          });
        });
      } else {
        if (!append) setDiscoverTracks([]);
      }
    } catch (err) {
      console.error('Failed to fetch discover tracks:', err);
      if (!append) setDiscoverTracks([]);
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
        setComments(data);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setComments([]);
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
      if ((activeTab !== 'foryou' && activeTab !== 'beats') || showComments) return;
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

  const handleDoubleTap = (track: DiscoverTrack) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current.time;
    const sameTrack = lastTapRef.current.trackId === track.id;

    if (timeDiff < 300 && sameTrack) {
      // Double tap detected - like the track
      if (!likedTracks.has(track.id)) {
        handleLike(track);
      }
      setDoubleTapHeart(track.id);
      lastTapRef.current = { time: 0, trackId: null };
    } else {
      lastTapRef.current = { time: now, trackId: track.id };
    }
  };

  const handleFollow = async (userId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const wasFollowing = followedUsers.has(userId);
    setFollowedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });

    if (!token) return;
    try {
      await fetch(`${API_URL}/api/users/${userId}/follow`, {
        method: wasFollowing ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to follow user:', err);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMuted(prev => !prev);
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

  // Handle audio file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setPostFile(file);
      // Auto-fill title from filename if empty
      if (!postTitle) {
        const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setPostTitle(name);
      }
    }
  };

  // Handle cover image selection
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPostCover(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset post form
  const resetPostForm = () => {
    setPostTitle('');
    setPostArtist('');
    setPostFile(null);
    setPostCover(null);
    setPostIsBeat(false);
    setShowPostModal(false);
  };

  // Submit post to Discovery
  const handleSubmitPost = async () => {
    if (!token || !postFile || !postTitle.trim()) return;

    setPosting(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;

        const response = await fetch(`${API_URL}/api/discover/post`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: postTitle.trim(),
            artist: postArtist.trim() || user?.name || 'Unknown Artist',
            file_data: fileData,
            cover_url: postCover,
            is_beat: postIsBeat
          })
        });

        if (response.ok) {
          resetPostForm();
          // Refresh the feed
          fetchDiscoverTracks(false);
        } else {
          const error = await response.json();
          console.error('Post failed:', error);
          alert('Failed to post: ' + (error.error || 'Unknown error'));
        }
        setPosting(false);
      };
      reader.readAsDataURL(postFile);
    } catch (err) {
      console.error('Failed to post:', err);
      setPosting(false);
    }
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
    <div className="fixed inset-0 bg-black">
      {/* Top Tabs - Floating over content */}
      <div className="fixed top-0 left-0 right-0 z-30 px-4 pt-3 pb-2 pointer-events-none">
        <div className="flex items-center justify-center gap-6 pointer-events-auto">
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('following')}
              className={`text-sm font-bold transition-all drop-shadow-lg ${
                activeTab === 'following'
                  ? 'text-white'
                  : 'text-white/50'
              }`}
            >
              Following
            </button>
          )}

          <button
            onClick={() => setActiveTab('foryou')}
            className={`text-sm font-bold transition-all drop-shadow-lg ${
              activeTab === 'foryou'
                ? 'text-white'
                : 'text-white/50'
            }`}
          >
            For You
          </button>

          <button
            onClick={() => setActiveTab('beats')}
            className={`text-sm font-bold transition-all drop-shadow-lg ${
              activeTab === 'beats'
                ? 'text-white'
                : 'text-white/50'
            }`}
          >
            Beats
          </button>
        </div>
      </div>

      {/* Main Content - Full viewport */}
      {(activeTab === 'foryou' || activeTab === 'beats') ? (
        /* TikTok-style Full Screen Vertical Scroll */
        (() => {
          // Filter tracks based on active tab
          const filteredTracks = activeTab === 'beats'
            ? discoverTracks.filter(t => t.is_beat)
            : discoverTracks;

          return (
          <>
          {filteredTracks.length === 0 ? (
            <div className="fixed inset-0 flex flex-col items-center justify-center">
              <Music className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/60 text-lg font-medium mb-2 text-center">
                {activeTab === 'beats' ? 'No beats yet' : 'No tracks yet'}
              </p>
              <p className="text-white/40 text-sm text-center px-4">
                {activeTab === 'beats' ? 'Be the first to upload a beat!' : 'Be the first to share your music!'}
              </p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y'
              }}
              onScroll={handleScroll}
            >
                {filteredTracks.map((track, idx) => {
                  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
                  const isLiked = likedTracks.has(track.id);
                  const isSaved = savedTracks.has(track.id);
                  const isFollowing = followedUsers.has(track.user_id);

                  return (
                    <div
                      key={track.id}
                      ref={idx >= filteredTracks.length - 2 ? nearEndRef : undefined}
                      className="h-[100dvh] min-h-[100dvh] snap-start snap-always relative flex flex-col select-none"
                      onClick={() => handleDoubleTap(track)}
                    >
                      {/* Full-screen Background with parallax-like effect */}
                      <div className="absolute inset-0 overflow-hidden">
                        {track.cover_url ? (
                          <>
                            <img
                              src={track.cover_url}
                              alt=""
                              className="w-full h-full object-cover scale-110 blur-3xl opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-950 via-black to-indigo-950" />
                        )}
                      </div>

                      {/* Double-tap heart animation */}
                      <HeartBurst
                        show={doubleTapHeart === track.id}
                        onComplete={() => setDoubleTapHeart(null)}
                      />

                      {/* Mute button - top right */}
                      <button
                        onClick={toggleMute}
                        className="absolute top-16 right-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-white/80" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white/80" />
                        )}
                      </button>

                      {/* Main Content Area - Bottom aligned like TikTok */}
                      <div className="absolute inset-x-0 bottom-0 pb-24 md:pb-28 px-4 md:px-6">
                        <div className="flex items-end gap-3 md:gap-4">
                          {/* Left side - Track info */}
                          <div className="flex-1 min-w-0 mb-2">
                            {/* Producer info with follow button */}
                            <div className="flex items-center gap-3 mb-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.hash = `#/producer/${track.user_id}`;
                                }}
                                className="relative group"
                              >
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full ring-2 ring-white/20 overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 p-0.5 transition-transform group-active:scale-95">
                                  <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                    {track.avatar_url ? (
                                      <img src={track.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">
                                          {(track.display_name || track.username).charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Follow button overlay */}
                                {!isFollowing && (
                                  <button
                                    onClick={(e) => handleFollow(track.user_id, e)}
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shadow-lg border-2 border-black transition-transform hover:scale-110 active:scale-90"
                                  >
                                    <span className="text-white text-lg font-bold leading-none">+</span>
                                  </button>
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-base md:text-lg truncate">
                                  @{track.username}
                                </p>
                                {track.display_name && track.display_name !== track.username && (
                                  <p className="text-white/60 text-sm truncate">{track.display_name}</p>
                                )}
                              </div>
                            </div>

                            {/* Track title with marquee effect for long titles */}
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight line-clamp-2">
                              {track.title}
                            </h2>

                            {/* Artist name */}
                            <p className="text-white/70 text-base md:text-lg mb-3 truncate">
                              {track.artist}
                            </p>

                            {/* Track metadata tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              {track.genre && (
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs md:text-sm text-white/90 font-medium">
                                  #{track.genre}
                                </span>
                              )}
                              {track.bpm && (
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs md:text-sm text-white/70">
                                  {track.bpm} BPM
                                </span>
                              )}
                              {track.musical_key && (
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs md:text-sm text-white/70">
                                  {track.musical_key}
                                </span>
                              )}
                              {track.is_beat && (
                                <span className="px-3 py-1 bg-violet-500/30 backdrop-blur-sm rounded-full text-xs md:text-sm text-violet-300 font-medium">
                                  Beat for Sale
                                </span>
                              )}
                            </div>

                            {/* Spinning vinyl with play count - TikTok music disc style */}
                            <div className="flex items-center gap-3">
                              <div
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (currentTrack?.id === track.id) {
                                    togglePlayPause();
                                  } else {
                                    handlePlayTrack(track);
                                  }
                                }}
                              >
                                <SpinningVinyl
                                  coverUrl={track.cover_url}
                                  isPlaying={isCurrentlyPlaying}
                                  size="small"
                                />
                              </div>
                              <div className="flex items-center gap-1.5 text-white/60 text-sm">
                                <Music className="w-4 h-4" />
                                <span className="truncate max-w-[200px]">
                                  {track.title} · {track.artist}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Action buttons */}
                          <div className="flex flex-col items-center gap-4 md:gap-5 pb-2">
                            {/* Large centered album art - only on desktop */}
                            <div
                              className="hidden lg:flex w-16 h-16 rounded-xl overflow-hidden shadow-2xl cursor-pointer mb-2 ring-2 ring-white/10 hover:ring-white/30 transition-all hover:scale-105 active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (currentTrack?.id === track.id) {
                                  togglePlayPause();
                                } else {
                                  handlePlayTrack(track);
                                }
                              }}
                            >
                              {track.cover_url ? (
                                <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center">
                                  <Music className="w-6 h-6 text-white/50" />
                                </div>
                              )}
                            </div>

                            {/* Like button */}
                            <button
                              onClick={(e) => handleLike(track, e)}
                              className="flex flex-col items-center gap-1 group"
                            >
                              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-75 ${
                                isLiked
                                  ? 'bg-red-500/20 shadow-lg shadow-red-500/20'
                                  : 'bg-black/20 backdrop-blur-sm'
                              }`}>
                                <Heart
                                  className={`w-7 h-7 md:w-8 md:h-8 transition-all duration-200 ${
                                    isLiked
                                      ? 'text-red-500 fill-red-500 scale-110'
                                      : 'text-white group-hover:scale-110'
                                  }`}
                                />
                              </div>
                              <span className={`text-xs md:text-sm font-semibold ${isLiked ? 'text-red-400' : 'text-white'}`}>
                                {formatCount(track.likes_count + (isLiked ? 1 : 0))}
                              </span>
                            </button>

                            {/* Comments button */}
                            <button
                              onClick={(e) => openComments(track, e)}
                              className="flex flex-col items-center gap-1 group"
                            >
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center transition-transform group-active:scale-75 group-hover:bg-white/10">
                                <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white transition-transform group-hover:scale-110" />
                              </div>
                              <span className="text-xs md:text-sm font-semibold text-white">
                                {formatCount(track.comments_count)}
                              </span>
                            </button>

                            {/* Repost button */}
                            <button
                              onClick={(e) => handleRepost(track.id, e)}
                              className="flex flex-col items-center gap-1 group"
                            >
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center transition-transform group-active:scale-75 group-hover:bg-white/10">
                                <Repeat2 className="w-7 h-7 md:w-8 md:h-8 text-white transition-transform group-hover:scale-110" />
                              </div>
                              <span className="text-xs md:text-sm font-semibold text-white">
                                {formatCount(track.reposts_count)}
                              </span>
                            </button>

                            {/* Save/Bookmark button */}
                            <button
                              onClick={(e) => handleSave(track, e)}
                              className="flex flex-col items-center gap-1 group"
                            >
                              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-75 ${
                                isSaved
                                  ? 'bg-amber-500/20 shadow-lg shadow-amber-500/20'
                                  : 'bg-black/20 backdrop-blur-sm group-hover:bg-white/10'
                              }`}>
                                <Bookmark
                                  className={`w-7 h-7 md:w-8 md:h-8 transition-all duration-200 ${
                                    isSaved
                                      ? 'text-amber-400 fill-amber-400 scale-110'
                                      : 'text-white group-hover:scale-110'
                                  }`}
                                />
                              </div>
                              <span className={`text-xs md:text-sm font-semibold ${isSaved ? 'text-amber-400' : 'text-white'}`}>
                                Save
                              </span>
                            </button>

                            {/* Share button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (navigator.share) {
                                  navigator.share({
                                    title: track.title,
                                    text: `Check out "${track.title}" by ${track.artist}`,
                                    url: window.location.href
                                  });
                                }
                              }}
                              className="flex flex-col items-center gap-1 group"
                            >
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center transition-transform group-active:scale-75 group-hover:bg-white/10">
                                <Share2 className="w-7 h-7 md:w-8 md:h-8 text-white transition-transform group-hover:scale-110" />
                              </div>
                              <span className="text-xs md:text-sm font-semibold text-white">Share</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Center play button - appears on tap */}
                      <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ paddingBottom: '20vh' }}
                      >
                        <div
                          className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all duration-300 pointer-events-auto cursor-pointer hover:scale-110 active:scale-90 ${
                            isCurrentlyPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentTrack?.id === track.id) {
                              togglePlayPause();
                            } else {
                              handlePlayTrack(track);
                            }
                          }}
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="w-10 h-10 md:w-12 md:h-12 text-white" fill="currentColor" />
                          ) : (
                            <Play className="w-10 h-10 md:w-12 md:h-12 text-white ml-1" fill="currentColor" />
                          )}
                        </div>
                      </div>

                      {/* Progress bar at bottom */}
                      {isCurrentlyPlaying && (
                        <div className="absolute bottom-20 md:bottom-24 left-0 right-0 h-1 bg-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
                            style={{ width: '35%' }}
                          />
                        </div>
                      )}

                      {/* Scroll hint - only show on first item */}
                      {idx === 0 && currentIndex === 0 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce text-white/40">
                          <span className="text-xs">Scroll for more</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading more indicator */}
                {loadingMore && (
                  <div className="h-[50vh] flex items-center justify-center">
                    <div className="flex items-center gap-3 text-white/60">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm font-medium">Loading more...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
          );
        })()
      ) : (
          /* Following Feed */
          <div className="fixed inset-0 pt-14 overflow-y-auto px-3 py-4 sm:px-4">
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

      {/* Post Button - Floating */}
      {isAuthenticated && (
        <button
          onClick={() => setShowPostModal(true)}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Post Modal - Clean minimal design */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90"
            onClick={resetPostForm}
          />

          {/* Modal - Bottom sheet on mobile, centered on desktop */}
          <div className="relative bg-zinc-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border-t sm:border border-white/10 max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <button
                onClick={resetPostForm}
                className="text-white/60 text-sm font-medium"
              >
                Cancel
              </button>
              <h2 className="text-base font-semibold text-white">New Post</h2>
              <button
                onClick={handleSubmitPost}
                disabled={posting || !postFile || !postTitle.trim()}
                className="text-violet-400 text-sm font-semibold disabled:opacity-40"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-56px)]">
              {/* File Upload - Compact */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                  postFile ? 'bg-violet-500/10 border border-violet-500/30' : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${postFile ? 'bg-violet-500/20' : 'bg-white/10'}`}>
                  {postFile ? <Music className="w-5 h-5 text-violet-400" /> : <Upload className="w-5 h-5 text-white/40" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  {postFile ? (
                    <>
                      <p className="text-white text-sm font-medium truncate">{postFile.name}</p>
                      <p className="text-white/40 text-xs">{(postFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/60 text-sm">Select audio file</p>
                      <p className="text-white/30 text-xs">MP3, WAV, FLAC</p>
                    </>
                  )}
                </div>
              </button>

              {/* Title Input */}
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 text-sm"
              />

              {/* Cover + Options Row */}
              <div className="flex gap-3">
                {/* Cover Image - Small square */}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors flex-shrink-0"
                >
                  {postCover ? (
                    <img src={postCover} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white/30" />
                      <span className="text-white/30 text-[10px] mt-1">Cover</span>
                    </div>
                  )}
                </button>

                {/* Beat toggle */}
                <div className="flex-1 flex flex-col justify-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setPostIsBeat(!postIsBeat)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${postIsBeat ? 'bg-violet-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${postIsBeat ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-white/70 text-sm">Beat/Instrumental</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedView;
