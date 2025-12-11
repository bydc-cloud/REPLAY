import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Heart, MessageCircle, Repeat2, Play, Pause, UserPlus, Music, Loader2, Bookmark, X, Send, Volume2, VolumeX, Plus, Upload, Image as ImageIcon, SendHorizontal, Activity, Type, User } from 'lucide-react';

// Instagram-style silhouette avatar (head + shoulders) - dark grey/black
const SilhouetteAvatar = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Head circle */}
    <circle cx="12" cy="8" r="4" />
    {/* Shoulders curve */}
    <path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);
import { useAuth } from '../contexts/PostgresAuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useMusicLibrary } from '../contexts/MusicLibraryContext';
import { EnhancedVisualizer } from './EnhancedVisualizer';
import { LyricsVisualizer } from './LyricsVisualizer';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

// Animated heart burst component - with animation iteration control
const HeartBurst = ({ show, onComplete }: { show: boolean; onComplete: () => void }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, 800); // Slightly shorter for snappier feel
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, isAnimating]);

  if (!show || !isAnimating) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <Heart
        className="w-32 h-32 text-red-500 fill-red-500"
        style={{
          animation: 'heartPop 0.8s ease-out forwards',
        }}
      />
      <style>{`
        @keyframes heartPop {
          0% { transform: scale(0); opacity: 0; }
          15% { transform: scale(1.3); opacity: 1; }
          30% { transform: scale(0.95); opacity: 1; }
          45% { transform: scale(1.1); opacity: 0.9; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// Audio Visualizer Overlay component - premium bar style with real audio data
const AudioVisualizerOverlay = ({ isPlaying, frequencyData, audioLevels }: { isPlaying: boolean; frequencyData: Uint8Array; audioLevels: number[] }) => {
  // Sample frequency bins for bars - 64 bars for smoother look
  const barCount = 64;
  const bars = Array.from({ length: barCount }).map((_, i) => {
    const freqIndex = Math.floor((i / barCount) * 128);
    const value = frequencyData[freqIndex] || 0;
    // Normalize to percentage with better scaling
    const normalized = value / 255;
    const height = Math.max(5, Math.pow(normalized, 0.8) * 100);
    return height;
  });

  // Calculate bass energy for glow effects
  const bassEnergy = (audioLevels?.slice(0, 8).reduce((a, b) => a + b, 0) / 8) || 0.3;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {/* Premium gradient background glow */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(139, 92, 246, ${0.1 + bassEnergy * 0.15}) 0%,
            rgba(236, 72, 153, ${0.05 + bassEnergy * 0.1}) 40%,
            transparent 70%)`,
          opacity: isPlaying ? 1 : 0.4,
        }}
      />

      {/* Main bar visualizer - centered with premium styling */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-lg h-40 md:h-52 flex items-end justify-center gap-[2px]">
          {bars.map((height, i) => {
            // Create mirror effect - bars grow from center outward
            const centerIndex = barCount / 2;
            const distanceFromCenter = Math.abs(i - centerIndex);
            const mirrorHeight = isPlaying ? height : 8 + Math.sin(i * 0.2 + Date.now() / 1000) * 5;

            return (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: `${mirrorHeight}%`,
                  background: `linear-gradient(to top,
                    rgba(139, 92, 246, ${0.8 - distanceFromCenter * 0.01}),
                    rgba(236, 72, 153, ${0.6 - distanceFromCenter * 0.01}))`,
                  opacity: isPlaying ? 0.8 + (height / 100) * 0.2 : 0.5,
                  boxShadow: isPlaying && height > 50
                    ? `0 0 ${height / 5}px rgba(139, 92, 246, 0.5)`
                    : 'none',
                  transition: 'height 0.05s ease-out',
                  minHeight: '3px',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom ambient glow - reacts to bass */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 transition-all duration-150"
        style={{
          background: `linear-gradient(to top,
            rgba(139, 92, 246, ${0.15 + bassEnergy * 0.15}) 0%,
            rgba(236, 72, 153, ${0.08 + bassEnergy * 0.08}) 50%,
            transparent 100%)`,
          opacity: isPlaying ? 1 : 0.5,
        }}
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
  album?: string;
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
  file_key?: string;
  file_data?: string;
  created_at?: string;
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
  const { currentTrack, isPlaying, togglePlayPause, setQueue, currentTime, duration } = useAudioPlayer();
  const { frequencyData, audioLevels } = useAudioAnalyzer();
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
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [showPostModal, setShowPostModal] = useState(false);
  // Segmented tabs for top control
  const tabOptions = isAuthenticated
    ? [
        { id: 'following', label: 'Following' },
        { id: 'foryou', label: 'Discover' },
        { id: 'beats', label: 'Beats' },
      ]
    : [
        { id: 'foryou', label: 'Discover' },
        { id: 'beats', label: 'Beats' },
      ];
  const tabCount = tabOptions.length;
  const activeTabIndex = Math.max(0, tabOptions.findIndex(t => t.id === activeTab));
  const sliderWidth = `${100 / tabCount}%`;
  const sliderLeft = `${(100 / tabCount) * activeTabIndex}%`;

  // Calculate slide transform based on tab position
  // For authenticated: Following (0) | Discover (1) | Beats (2)
  // For unauthenticated: Discover (0) | Beats (1)
  const slideTransform = `translateX(-${activeTabIndex * 100}%)`;

  // Listen for external events to open post modal (from MobileBottomNav)
  useEffect(() => {
    const handleOpenPost = () => setShowPostModal(true);
    window.addEventListener('openDiscoveryPost', handleOpenPost);
    return () => window.removeEventListener('openDiscoveryPost', handleOpenPost);
  }, []);
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

  // Fetch tracks from people you follow (Following tab)
  const [followingTracks, setFollowingTracks] = useState<DiscoverTrack[]>([]);

  const fetchFollowingTracks = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/following/tracks?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFollowingTracks(data);
      }
    } catch (err) {
      console.error('Failed to fetch following tracks:', err);
    }
  }, [token]);

  // Legacy feed for activity (not used for Following tab anymore)
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
        isAuthenticated ? fetchFollowingTracks() : Promise.resolve(),
        fetchDiscoverTracks(false)
      ]);
      setLoading(false);
    };
    loadData();
  }, [isAuthenticated, fetchFollowingTracks, fetchDiscoverTracks]);

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

  // Auto-play when scrolling to a new track (TikTok-style single track playback)
  const prevIndexRef = useRef<number>(currentIndex);
  useEffect(() => {
    if ((activeTab !== 'foryou' && activeTab !== 'beats') || discoverTracks.length === 0) return;

    const track = discoverTracks[currentIndex];
    if (!track) return;

    // Only auto-play if the index actually changed (scrolled to new track)
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;
      // Clear any ongoing double-tap animation when track changes
      setDoubleTapHeart(null);
      // Reset tap tracking to prevent accidental double-taps across track changes
      lastTapRef.current = { time: 0, trackId: null };
      // Small delay to let the scroll finish
      const timer = setTimeout(() => {
        // Play the new track (stops any previous track automatically)
        handlePlayTrack(track);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, activeTab, discoverTracks]);

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

    // Prevent spam - if animation is already showing, ignore taps
    if (doubleTapHeart !== null) {
      return;
    }

    if (timeDiff < 300 && sameTrack) {
      // Double tap detected - like the track
      if (!likedTracks.has(track.id)) {
        handleLike(track);
      }
      setDoubleTapHeart(track.id);
      // Reset with a longer cooldown to prevent re-triggering
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
      artworkUrl: track.cover_url || '',
      fileUrl: track.file_data || '', // Use file_data if available (base64)
      fileData: track.file_data || null,
      fileKey: track.file_key || null,
      hasAudio: true, // Tell AudioPlayer this track has audio to stream
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

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Log file info for debugging
    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Accept any file - the accept attribute on input already filters for audio
    // Mobile browsers are inconsistent with MIME types, so we trust the file picker
    setPostFile(file);

    // Auto-fill title from filename if empty
    if (!postTitle) {
      const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setPostTitle(name);
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

    // Check file size (max 50MB for practical upload)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (postFile.size > maxSize) {
      alert(`File is too large (${(postFile.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`);
      return;
    }

    setPosting(true);
    try {
      // Convert file to base64
      const reader = new FileReader();

      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        alert('Failed to read file. Please try again.');
        setPosting(false);
      };

      reader.onload = async (e) => {
        const fileData = e.target?.result as string;

        if (!fileData) {
          alert('Failed to read file data. Please try again.');
          setPosting(false);
          return;
        }

        try {
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
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            console.error('Post failed:', error);
            alert('Failed to post: ' + (error.error || 'Unknown error'));
          }
        } catch (fetchErr) {
          console.error('Network error:', fetchErr);
          alert('Network error. Please check your connection and try again.');
        }
        setPosting(false);
      };

      reader.readAsDataURL(postFile);
    } catch (err) {
      console.error('Failed to post:', err);
      alert('An unexpected error occurred. Please try again.');
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
      {/* Top Tabs - Premium pill design with sliding indicator */}
      <div className="fixed top-[72px] md:top-0 left-0 right-0 z-30 px-4 pt-1 pb-2 pointer-events-none">
        <div className="flex items-center justify-center pointer-events-auto">
          <div className="relative flex items-center w-full max-w-xs md:max-w-sm p-0.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.08] shadow-lg overflow-hidden">
            <div
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 shadow-md shadow-purple-500/30 transition-all duration-250"
              style={{ width: sliderWidth, left: sliderLeft }}
            />
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FeedTab)}
                className={`relative flex-1 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-colors ${
                  activeTab === tab.id ? 'text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Horizontal sliding container for smooth tab transitions */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            width: `${tabCount * 100}%`,
            transform: slideTransform
          }}
        >
          {/* Following Tab Panel */}
          {isAuthenticated && (
            <div className="h-full overflow-hidden relative" style={{ width: `${100 / tabCount}%` }}>
              <div className="absolute inset-0 pt-14 overflow-y-auto px-3 py-4 sm:px-4 pb-24">
                {followingTracks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4">
                    <UserPlus className="w-14 h-14 sm:w-16 sm:h-16 text-white/20 mb-4" />
                    <p className="text-white/60 text-base sm:text-lg font-medium mb-2 text-center">No tracks yet</p>
                    <p className="text-white/40 text-sm text-center max-w-xs">
                      Follow producers to see their latest releases here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-w-2xl mx-auto">
                    <p className="text-white/50 text-xs px-1 mb-3">Latest from artists you follow</p>
                    {followingTracks.map((track, index) => {
                      const isCurrentTrack = currentTrack?.id === track.id;
                      const isTrackPlaying = isCurrentTrack && isPlaying;
                      return (
                        <div
                          key={track.id}
                          className="bg-white/5 hover:bg-white/8 active:bg-white/10 rounded-xl p-3 transition-all cursor-pointer"
                          onClick={() => {
                            const queueTracks = followingTracks.map(t => ({
                              id: t.id,
                              title: t.title,
                              artist: t.artist,
                              album: t.album || '',
                              duration: t.duration,
                              coverUrl: t.cover_url || '',
                              fileUrl: '',
                              fileData: null,
                              fileKey: t.file_key,
                              playCount: t.play_count || 0,
                              isLiked: likedTracks.has(t.id),
                              addedAt: t.created_at ? new Date(t.created_at) : new Date()
                            }));
                            setQueue(queueTracks as any[], index);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {/* Album art */}
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                              {track.cover_url ? (
                                <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center">
                                  <Music className="w-6 h-6 text-white/40" />
                                </div>
                              )}
                              {/* Play overlay */}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                {isTrackPlaying ? (
                                  <Pause className="w-6 h-6 text-white" fill="currentColor" />
                                ) : (
                                  <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                                )}
                              </div>
                            </div>

                            {/* Track info */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold truncate text-sm ${isCurrentTrack ? 'text-violet-400' : 'text-white'}`}>
                                {track.title}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.hash = `#/producer/${track.user_id}`;
                                }}
                                className="text-white/60 text-xs truncate hover:text-white/80 transition-colors"
                              >
                                @{track.username}
                              </button>
                              <div className="flex items-center gap-2 mt-1 text-white/40 text-[10px]">
                                {track.genre && <span>#{track.genre}</span>}
                                {track.bpm && <span>{track.bpm} BPM</span>}
                              </div>
                            </div>

                            {/* Stats & actions */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-white/50 text-xs">
                                <Heart className="w-3.5 h-3.5" />
                                {formatCount(track.likes_count || 0)}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(track, e);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  likedTracks.has(track.id) ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white/70 hover:text-white'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${likedTracks.has(track.id) ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discover (For You) Tab Panel */}
          <div className="h-full overflow-hidden relative" style={{ width: `${100 / tabCount}%` }}>
            {(() => {
              const filteredTracks = discoverTracks;

          return (
          <>
          {filteredTracks.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Music className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/60 text-lg font-medium mb-2 text-center">
                No tracks yet
              </p>
              <p className="text-white/40 text-sm text-center px-4">
                Be the first to share your music!
              </p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
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
                      {/* Full-screen Background - Album cover on mobile, blurred on desktop */}
                      <div className="absolute inset-0 overflow-hidden">
                        {track.cover_url ? (
                          <>
                            {/* Mobile: Show actual album cover as background with subtle blur */}
                            <img
                              src={track.cover_url}
                              alt=""
                              className="w-full h-full object-cover md:scale-110 md:blur-3xl md:opacity-60 blur-sm opacity-90"
                            />
                            {/* Mobile gradient overlay - darker at bottom for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/90 md:from-black/40 md:via-transparent md:to-black/95" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 md:from-black/30 md:to-black/30" />
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

                      {/* Top right controls - mute, visualizer, lyrics */}
                      <div className="absolute top-20 md:top-16 right-4 z-20 flex flex-col gap-2">
                        {/* Mute button */}
                        <button
                          onClick={toggleMute}
                          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
                        >
                          {isMuted ? (
                            <VolumeX className="w-5 h-5 text-white/80" />
                          ) : (
                            <Volume2 className="w-5 h-5 text-white/80" />
                          )}
                        </button>

                        {/* Visualizer toggle */}
                        <button
                          onClick={() => setShowVisualizer(!showVisualizer)}
                          className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center border active:scale-90 transition-all ${
                            showVisualizer
                              ? 'bg-violet-500/40 border-violet-400/40 text-violet-300'
                              : 'bg-black/40 border-white/10 text-white/80'
                          }`}
                        >
                          <Activity className="w-5 h-5" />
                        </button>

                        {/* Lyrics toggle */}
                        <button
                          onClick={() => setShowLyrics(!showLyrics)}
                          className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center border active:scale-90 transition-all ${
                            showLyrics
                              ? 'bg-violet-500/40 border-violet-400/40 text-violet-300'
                              : 'bg-black/40 border-white/10 text-white/80'
                          }`}
                        >
                          <Type className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Audio Visualizer Overlay - Full screen reactive */}
                      {showVisualizer && (
                        <AudioVisualizerOverlay isPlaying={isCurrentlyPlaying} frequencyData={frequencyData} audioLevels={audioLevels} />
                      )}

                      {/* Lyrics Overlay - Semi-transparent, keeps UI visible */}
                      {showLyrics && (
                        <div
                          className="absolute inset-0 z-20 flex flex-col md:hidden"
                          onTouchStart={(e) => {
                            const touch = e.touches[0];
                            (e.currentTarget as any).touchStartY = touch.clientY;
                          }}
                          onTouchEnd={(e) => {
                            const touchStartY = (e.currentTarget as any).touchStartY;
                            if (touchStartY !== undefined) {
                              const touchEndY = e.changedTouches[0].clientY;
                              const deltaY = touchStartY - touchEndY;
                              if (Math.abs(deltaY) > 100) {
                                setShowLyrics(false);
                              }
                            }
                          }}
                        >
                          {/* Background overlay */}
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

                          {/* Close hint at top */}
                          <div className="relative z-10 pt-20 pb-4 text-center">
                            <p className="text-white/40 text-xs">Swipe up or down to close</p>
                          </div>

                          {/* Lyrics content - centered with proper height */}
                          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-32 min-h-0">
                            <div className="w-full h-full max-h-[60vh] flex flex-col">
                              <LyricsVisualizer
                                currentTime={currentTime}
                                duration={duration}
                                isPlaying={isCurrentlyPlaying}
                                trackId={track.id}
                                trackTitle={track.title}
                                trackArtist={track.artist}
                                audioLevels={audioLevels}
                              />
                            </div>
                          </div>

                          {/* Track info at bottom */}
                          <div className="relative z-10 px-6 pb-24">
                            <div className="text-center">
                              <h3 className="text-white font-bold text-lg truncate">{track.title}</h3>
                              <p className="text-white/60 text-sm">{track.artist}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mobile: Ultimate premium music player layout */}
                      <div className="absolute inset-0 md:hidden flex flex-col justify-end">
                        {/* Tap to play/pause - full screen */}
                        <div
                          className="absolute inset-0 z-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentTrack?.id === track.id) {
                              togglePlayPause();
                            } else {
                              handlePlayTrack(track);
                            }
                          }}
                        />

                        {/* Right side action buttons - Slightly larger for better tap targets */}
                        <div className="absolute right-3 bottom-[100px] z-20 flex flex-col items-center gap-2">
                          {/* Profile avatar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.hash = `#/producer/${track.user_id}`;
                            }}
                            className="relative mb-1"
                          >
                            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/30 shadow-lg shadow-black/50">
                              {track.avatar_url ? (
                                <img src={track.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                                  <SilhouetteAvatar className="w-6 h-6 text-zinc-500" />
                                </div>
                              )}
                            </div>
                            {!isFollowing && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFollow(track.user_id, e);
                                }}
                                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center shadow-md shadow-violet-500/40 border border-black"
                              >
                                <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                              </button>
                            )}
                          </button>

                          {/* Like */}
                          <button
                            onClick={(e) => handleLike(track, e)}
                            className="flex flex-col items-center"
                          >
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all ${
                              isLiked ? 'bg-red-500/20' : 'bg-black/30 backdrop-blur-sm'
                            }`}>
                              <Heart className={`w-5 h-5 transition-all ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} strokeWidth={2} />
                            </div>
                            <span className={`text-[10px] font-semibold drop-shadow-lg mt-0.5 ${isLiked ? 'text-red-400' : 'text-white/90'}`}>
                              {formatCount(track.likes_count || 0)}
                            </span>
                          </button>

                          {/* Comments */}
                          <button
                            onClick={(e) => openComments(track, e)}
                            className="flex flex-col items-center"
                          >
                            <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
                              <MessageCircle className="w-5 h-5 text-white" strokeWidth={2} />
                            </div>
                            <span className="text-[10px] font-semibold text-white/90 drop-shadow-lg mt-0.5">
                              {formatCount(track.comments_count || 0)}
                            </span>
                          </button>

                          {/* Save */}
                          <button
                            onClick={(e) => handleSave(track, e)}
                            className="flex flex-col items-center"
                          >
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all ${
                              isSaved ? 'bg-violet-500/20' : 'bg-black/30 backdrop-blur-sm'
                            }`}>
                              <Bookmark className={`w-5 h-5 transition-all ${isSaved ? 'text-violet-400 fill-violet-400' : 'text-white'}`} strokeWidth={2} />
                            </div>
                            <span className={`text-[10px] font-semibold drop-shadow-lg mt-0.5 ${isSaved ? 'text-violet-400' : 'text-white/90'}`}>
                              Save
                            </span>
                          </button>

                          {/* Share */}
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
                            className="flex flex-col items-center"
                          >
                            <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
                              <SendHorizontal className="w-5 h-5 text-white" strokeWidth={2} />
                            </div>
                            <span className="text-[10px] font-semibold text-white/90 drop-shadow-lg mt-0.5">Share</span>
                          </button>

                        </div>

                        {/* Center play button - Clean minimal design */}
                        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${
                          isCurrentlyPlaying ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                        }`} style={{ marginBottom: '5vh' }}>
                          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Play className="w-7 h-7 text-white ml-0.5" fill="currentColor" />
                          </div>
                        </div>

                        {/* Bottom content - Track info + Producer - sits above mobile nav bar */}
                        <div className="relative z-10 px-4 pb-[80px] pr-16">
                          {/* Track title - larger font, comes first */}
                          <h2 className="text-white font-bold text-lg leading-snug mb-1 line-clamp-2">
                            {track.title}
                          </h2>

                          {/* Producer @username - below title */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.hash = `#/producer/${track.user_id}`;
                            }}
                            className="flex items-center gap-1 mb-2"
                          >
                            <span className="text-white/70 font-medium text-sm">@{track.username}</span>
                          </button>

                          {/* Now playing row with spinning album art */}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg overflow-hidden shadow-lg flex-shrink-0 ${isCurrentlyPlaying ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '4s' }}>
                              {track.cover_url ? (
                                <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center">
                                  <Music className="w-4 h-4 text-white/60" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                                <Music className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{track.artist}</span>
                              </div>
                              {track.genre && (
                                <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white/60 flex-shrink-0">
                                  {track.genre}
                                </span>
                              )}
                              {track.is_beat && (
                                <span className="px-2 py-0.5 bg-violet-500/30 rounded text-[10px] text-violet-300 flex-shrink-0">
                                  Beat
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop layout - Full immersive experience */}
                      <div className="absolute inset-0 hidden md:flex flex-col">
                        {/* Full-screen visualizer/lyrics when enabled */}
                        {(showVisualizer || showLyrics) && (
                          <div className="absolute inset-0 z-10">
                            {/* Background blur of album art */}
                            <div className="absolute inset-0">
                              {track.cover_url ? (
                                <img src={track.cover_url} alt="" className="w-full h-full object-cover blur-3xl opacity-40 scale-110" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-900/50 via-purple-900/50 to-indigo-900/50" />
                              )}
                              <div className="absolute inset-0 bg-black/60" />
                            </div>

                            {/* Visualizer - Full screen */}
                            {showVisualizer && !showLyrics && (
                              <div className="absolute inset-0">
                                <AudioVisualizerOverlay isPlaying={isCurrentlyPlaying} frequencyData={frequencyData} audioLevels={audioLevels} />
                              </div>
                            )}

                            {/* Lyrics - Centered and prominent */}
                            {showLyrics && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center px-8 py-24">
                                {/* Lyrics container with explicit height */}
                                <div className="max-w-3xl w-full h-[50vh] flex flex-col bg-black/30 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
                                  <LyricsVisualizer
                                    currentTime={currentTime}
                                    duration={duration}
                                    isPlaying={isCurrentlyPlaying}
                                    trackId={track.id}
                                    trackTitle={track.title}
                                    trackArtist={track.artist}
                                    audioLevels={audioLevels}
                                  />
                                </div>
                                {/* Subtle visualizer in background when lyrics are showing */}
                                {showVisualizer && (
                                  <div className="absolute inset-0 opacity-30 pointer-events-none -z-10">
                                    <AudioVisualizerOverlay isPlaying={isCurrentlyPlaying} frequencyData={frequencyData} audioLevels={audioLevels} />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Floating controls when visualizer/lyrics are on */}
                            <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
                              {/* Visualizer toggle */}
                              <button
                                onClick={() => setShowVisualizer(!showVisualizer)}
                                className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border transition-all hover:scale-105 ${
                                  showVisualizer
                                    ? 'bg-violet-500/40 border-violet-400/50 text-violet-200'
                                    : 'bg-black/40 border-white/20 text-white/80 hover:bg-white/10'
                                }`}
                              >
                                <Activity className="w-5 h-5" />
                              </button>

                              {/* Lyrics toggle */}
                              <button
                                onClick={() => setShowLyrics(!showLyrics)}
                                className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border transition-all hover:scale-105 ${
                                  showLyrics
                                    ? 'bg-violet-500/40 border-violet-400/50 text-violet-200'
                                    : 'bg-black/40 border-white/20 text-white/80 hover:bg-white/10'
                                }`}
                              >
                                <Type className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Bottom overlay with track info and controls */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8 z-20">
                              <div className="max-w-5xl mx-auto flex items-end gap-8">
                                {/* Album art - smaller when visualizer is on */}
                                <div
                                  className="flex-shrink-0 cursor-pointer group"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (currentTrack?.id === track.id) {
                                      togglePlayPause();
                                    } else {
                                      handlePlayTrack(track);
                                    }
                                  }}
                                >
                                  <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-2xl">
                                    {track.cover_url ? (
                                      <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                                        <Music className="w-12 h-12 text-white/30" />
                                      </div>
                                    )}
                                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrentlyPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        {isCurrentlyPlaying ? (
                                          <Pause className="w-6 h-6 text-white" fill="currentColor" />
                                        ) : (
                                          <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Track info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.hash = `#/producer/${track.user_id}`;
                                      }}
                                      className="text-white/70 text-sm hover:text-white transition-colors"
                                    >
                                      @{track.username}
                                    </button>
                                    {!isFollowing && (
                                      <button
                                        onClick={(e) => handleFollow(track.user_id, e)}
                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs font-medium transition-all"
                                      >
                                        Follow
                                      </button>
                                    )}
                                  </div>
                                  <h2 className="text-2xl font-bold text-white mb-1 truncate">{track.title}</h2>
                                  <p className="text-white/50 mb-3">{track.artist}</p>

                                  {/* Progress bar */}
                                  <div className="w-full max-w-xl">
                                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-150"
                                        style={{
                                          width: currentTrack?.id === track.id && duration > 0
                                            ? `${Math.min(100, (currentTime / duration) * 100)}%`
                                            : '0%'
                                        }}
                                      />
                                    </div>
                                    <div className="flex justify-between mt-1 text-xs text-white/40">
                                      <span>{currentTrack?.id === track.id ? formatTime(currentTime) : '0:00'}</span>
                                      <span>{formatTime(track.duration)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => handleLike(track, e)}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                      isLiked ? 'bg-red-500/30 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                  >
                                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                  </button>
                                  <button
                                    onClick={(e) => openComments(track, e)}
                                    className="w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all"
                                  >
                                    <MessageCircle className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleSave(track, e)}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                      isSaved ? 'bg-violet-500/30 text-violet-400' : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                  >
                                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                                  </button>
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
                                    className="w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all"
                                  >
                                    <SendHorizontal className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Default desktop layout - Two column when no visualizer/lyrics */}
                        {!showVisualizer && !showLyrics && (
                          <div className="absolute inset-0 flex items-center justify-center px-8 lg:px-16 pb-24">
                            <div className="flex gap-8 lg:gap-12 max-w-5xl w-full items-center">
                              {/* Left side - Large album art with play button */}
                              <div className="flex-shrink-0">
                                <div
                                  className="relative w-72 h-72 lg:w-96 lg:h-96 rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
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
                                    <div className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex items-center justify-center">
                                      <Music className="w-24 h-24 text-white/30" />
                                    </div>
                                  )}
                                  {/* Play/Pause overlay */}
                                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrentlyPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-transform group-hover:scale-110">
                                      {isCurrentlyPlaying ? (
                                        <Pause className="w-10 h-10 text-white" fill="currentColor" />
                                      ) : (
                                        <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Progress bar under album art */}
                                <div className="mt-4 w-full">
                                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-150"
                                      style={{
                                        width: currentTrack?.id === track.id && duration > 0
                                          ? `${Math.min(100, (currentTime / duration) * 100)}%`
                                          : '0%'
                                      }}
                                    />
                                  </div>
                                  <div className="flex justify-between mt-1 text-xs text-white/50">
                                    <span>{currentTrack?.id === track.id ? formatTime(currentTime) : '0:00'}</span>
                                    <span>{formatTime(track.duration)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right side - Track info and actions */}
                              <div className="flex-1 min-w-0">
                                {/* Producer info */}
                                <div className="flex items-center gap-4 mb-6">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.hash = `#/producer/${track.user_id}`;
                                    }}
                                    className="relative group"
                                  >
                                    <div className="w-14 h-14 rounded-full ring-2 ring-white/20 overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 p-0.5 transition-transform group-hover:scale-105">
                                      <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                        {track.avatar_url ? (
                                          <img src={track.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                                            <SilhouetteAvatar className="w-8 h-8 text-zinc-500" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.hash = `#/producer/${track.user_id}`;
                                      }}
                                      className="text-white font-semibold text-lg hover:text-violet-300 transition-colors truncate block"
                                    >
                                      @{track.username}
                                    </button>
                                    {track.display_name && track.display_name !== track.username && (
                                      <p className="text-white/50 text-sm truncate">{track.display_name}</p>
                                    )}
                                  </div>
                                  {!isFollowing && (
                                    <button
                                      onClick={(e) => handleFollow(track.user_id, e)}
                                      className="px-5 py-2 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                      Follow
                                    </button>
                                  )}
                                </div>

                                {/* Track title */}
                                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight line-clamp-2">
                                  {track.title}
                                </h2>

                                {/* Artist name */}
                                <p className="text-white/60 text-xl mb-4">
                                  {track.artist}
                                </p>

                                {/* Track metadata tags */}
                                <div className="flex flex-wrap items-center gap-2 mb-6">
                                  {track.genre && (
                                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90 font-medium">
                                      #{track.genre}
                                    </span>
                                  )}
                                  {track.bpm && (
                                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/70">
                                      {track.bpm} BPM
                                    </span>
                                  )}
                                  {track.musical_key && (
                                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/70">
                                      {track.musical_key}
                                    </span>
                                  )}
                                  {track.is_beat && (
                                    <span className="px-4 py-1.5 bg-violet-500/30 backdrop-blur-sm rounded-full text-sm text-violet-300 font-medium">
                                      Beat for Sale
                                    </span>
                                  )}
                                </div>

                                {/* Action buttons - Horizontal row */}
                                <div className="flex items-center gap-3 mb-6">
                                  {/* Visualizer toggle */}
                                  <button
                                    onClick={() => setShowVisualizer(!showVisualizer)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
                                      showVisualizer
                                        ? 'bg-violet-500/30 text-violet-300'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                  >
                                    <Activity className="w-5 h-5" />
                                    <span className="font-medium text-sm">Visualizer</span>
                                  </button>

                                  {/* Lyrics toggle */}
                                  <button
                                    onClick={() => setShowLyrics(!showLyrics)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
                                      showLyrics
                                        ? 'bg-violet-500/30 text-violet-300'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                  >
                                    <Type className="w-5 h-5" />
                                    <span className="font-medium text-sm">Lyrics</span>
                                  </button>

                                  <div className="w-px h-6 bg-white/20" />

                                  {/* Like */}
                                  <button
                                    onClick={(e) => handleLike(track, e)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
                                      isLiked
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                  >
                                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                    <span className="font-semibold">{formatCount(track.likes_count || 0)}</span>
                                  </button>

                                  {/* Comments */}
                                  <button
                                    onClick={(e) => openComments(track, e)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                                  >
                                    <MessageCircle className="w-5 h-5" />
                                    <span className="font-semibold">{formatCount(track.comments_count || 0)}</span>
                                  </button>

                                  {/* Save */}
                                  <button
                                    onClick={(e) => handleSave(track, e)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
                                      isSaved
                                        ? 'bg-violet-500/20 text-violet-400'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                  >
                                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                                  </button>

                                  {/* Share */}
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
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                                  >
                                    <SendHorizontal className="w-5 h-5" />
                                  </button>
                                </div>

                                {/* Navigation hint */}
                                <p className="text-white/40 text-sm">
                                  Scroll or use arrow keys to browse tracks
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress bar - at very bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-white/10 z-20">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-150"
                          style={{
                            width: currentTrack?.id === track.id && duration > 0
                              ? `${Math.min(100, (currentTime / duration) * 100)}%`
                              : '0%'
                          }}
                        />
                      </div>

                      {/* Scroll hint - subtle, at bottom center */}
                      {idx === 0 && currentIndex === 0 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none z-10 md:hidden">
                          <div className="flex items-center gap-1.5 text-white/40 animate-bounce">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            <span className="text-[10px]">Swipe</span>
                          </div>
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
        })()}
          </div>

          {/* Beats Tab Panel */}
          <div className="h-full overflow-hidden relative" style={{ width: `${100 / tabCount}%` }}>
            {(() => {
              const filteredTracks = discoverTracks.filter(t => t.is_beat);

              return (
                <>
                  {filteredTracks.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Music className="w-16 h-16 text-white/20 mb-4" />
                      <p className="text-white/60 text-lg font-medium mb-2 text-center">No beats yet</p>
                      <p className="text-white/40 text-sm text-center px-4">Be the first to upload a beat!</p>
                    </div>
                  ) : (
                    <div
                      className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                      style={{
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-y'
                      }}
                    >
                      {filteredTracks.map((track, idx) => {
                        const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
                        const isLiked = likedTracks.has(track.id);
                        const isFollowingUser = followedUsers.has(track.user_id);

                        return (
                          <div
                            key={track.id}
                            className="h-[100dvh] min-h-[100dvh] snap-start snap-always relative flex flex-col select-none"
                            onClick={() => handleDoubleTap(track)}
                          >
                            {/* Full-screen Background */}
                            <div className="absolute inset-0 overflow-hidden">
                              {track.cover_url ? (
                                <img
                                  src={track.cover_url}
                                  alt=""
                                  className="w-full h-full object-cover blur-sm opacity-90 md:scale-110 md:blur-3xl md:opacity-60"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
                            </div>

                            {/* Track info overlay */}
                            <div className="absolute bottom-24 left-4 right-20 z-20">
                              <h2 className="text-white text-lg font-bold truncate">{track.title}</h2>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.hash = `#/producer/${track.user_id}`;
                                }}
                                className="text-white/70 text-sm"
                              >
                                @{track.username}
                              </button>
                              {track.genre && (
                                <span className="ml-2 px-2 py-0.5 bg-violet-500/30 text-violet-200 text-xs rounded-full">
                                  #{track.genre}
                                </span>
                              )}
                            </div>

                            {/* Top right controls - mute, visualizer, lyrics */}
                            <div className="absolute top-20 md:top-16 right-4 z-20 flex flex-col gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMute();
                                }}
                                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
                              >
                                {isMuted ? (
                                  <VolumeX className="w-5 h-5 text-white/80" />
                                ) : (
                                  <Volume2 className="w-5 h-5 text-white/80" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowVisualizer(!showVisualizer);
                                }}
                                className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center border active:scale-90 transition-all ${
                                  showVisualizer
                                    ? 'bg-violet-500/40 border-violet-400/40 text-violet-300'
                                    : 'bg-black/40 border-white/10 text-white/80'
                                }`}
                              >
                                <Activity className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowLyrics(!showLyrics);
                                }}
                                className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center border active:scale-90 transition-all ${
                                  showLyrics
                                    ? 'bg-violet-500/40 border-violet-400/40 text-violet-300'
                                    : 'bg-black/40 border-white/10 text-white/80'
                                }`}
                              >
                                <Type className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Right side actions */}
                            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(track, e);
                                }}
                                className="flex flex-col items-center"
                              >
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isLiked ? 'bg-red-500/20' : 'bg-black/40'}`}>
                                  <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-current' : 'text-white'}`} />
                                </div>
                                <span className="text-white text-xs mt-1">{formatCount(track.likes_count || 0)}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTrack(track);
                                  setShowComments(true);
                                }}
                                className="flex flex-col items-center"
                              >
                                <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                                  <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-white text-xs mt-1">{formatCount(track.comments_count || 0)}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && selectedTrack && (
        <div className="fixed inset-0 z-[60] md:left-0 md:right-0">
          {/* Backdrop with fade-in animation */}
          <div
            className="absolute inset-0 bg-black/70 animate-fade-in"
            onClick={() => {
              setShowComments(false);
              setSelectedTrack(null);
            }}
          />

          {/* Comments Sheet - mobile optimized with bottom nav clearance and slide-up animation */}
          <div className="absolute bottom-[72px] md:bottom-0 left-0 right-0 md:left-[250px] md:w-[calc(100%-250px)] bg-zinc-900 rounded-t-2xl max-h-[65vh] sm:max-h-[70vh] flex flex-col animate-slide-up">
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
                      <User className="w-4 h-4 text-white/80" />
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
                    <User className="w-4 h-4 text-white/80" />
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

      {/* Post Button - Desktop only (mobile has it in right sidebar) */}
      {isAuthenticated && (
        <button
          onClick={() => setShowPostModal(true)}
          className="hidden md:flex fixed right-6 bottom-24 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 items-center justify-center hover:scale-105 active:scale-95 transition-transform border border-white/20"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Post Modal - Clean minimal design optimized for mobile */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={resetPostForm}
          />

          {/* Modal - Bottom sheet on mobile, centered on desktop */}
          <div className="relative bg-zinc-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border-t sm:border border-white/10 max-h-[90vh] overflow-hidden animate-slide-up">
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <button
                onClick={resetPostForm}
                className="text-white/60 text-sm font-medium min-w-[60px] text-left active:opacity-70"
              >
                Cancel
              </button>
              <h2 className="text-base font-bold text-white">Share to Feed</h2>
              <button
                onClick={handleSubmitPost}
                disabled={posting || !postFile || !postTitle.trim()}
                className="bg-violet-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-40 disabled:bg-white/10 active:opacity-80 transition-all min-w-[60px]"
              >
                {posting ? '...' : 'Post'}
              </button>
            </div>

            {/* Content - with safe area padding for iPhone */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)] pb-safe">
              {/* File Upload - Larger touch target for mobile */}
              <label
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all cursor-pointer active:scale-[0.98] ${
                  postFile
                    ? 'bg-gradient-to-r from-violet-500/15 to-purple-500/10 border-2 border-violet-500/40'
                    : 'bg-white/5 border-2 border-dashed border-white/20 hover:border-white/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${postFile ? 'bg-violet-500/30' : 'bg-white/10'}`}>
                  {postFile ? <Music className="w-7 h-7 text-violet-400" /> : <Upload className="w-7 h-7 text-white/40" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  {postFile ? (
                    <>
                      <p className="text-white font-medium truncate">{postFile.name}</p>
                      <p className="text-violet-300/60 text-sm">{(postFile.size / 1024 / 1024).toFixed(1)} MB • Ready to upload</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/80 font-medium">Tap to select audio</p>
                      <p className="text-white/40 text-sm">MP3, WAV, FLAC, M4A, AAC</p>
                    </>
                  )}
                </div>
              </label>

              {/* Title Input - Larger for mobile */}
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Track title"
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white text-base placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
              />

              {/* Cover + Options Row */}
              <div className="flex gap-4">
                {/* Cover Image - Larger for mobile */}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 hover:border-white/20 active:scale-95 transition-all flex-shrink-0"
                >
                  {postCover ? (
                    <img src={postCover} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-1">
                      <ImageIcon className="w-6 h-6 text-white/30" />
                      <span className="text-white/30 text-xs">Add Cover</span>
                    </div>
                  )}
                </button>

                {/* Beat toggle - Better touch target */}
                <div className="flex-1 flex flex-col justify-center">
                  <button
                    onClick={() => setPostIsBeat(!postIsBeat)}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all active:scale-[0.98] ${
                      postIsBeat ? 'bg-violet-500/15 border border-violet-500/30' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div
                      className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${postIsBeat ? 'bg-violet-500' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${postIsBeat ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${postIsBeat ? 'text-violet-300' : 'text-white/70'}`}>Beat/Instrumental</p>
                      <p className="text-white/40 text-xs">Show in Beats section</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Helpful note */}
              <p className="text-center text-white/30 text-xs pt-2">
                Your music will be visible to everyone on the Discover feed
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedView;
