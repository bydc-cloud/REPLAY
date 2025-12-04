import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Repeat2, Play, Pause, UserPlus, Music, Loader2, Share2, Bookmark, X, Send, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
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
  }
];

// Demo comments for testing
const DEMO_COMMENTS: Comment[] = [
  { id: 'c1', user_id: 'u1', content: 'This beat is fire! Need this in my playlist', created_at: new Date(Date.now() - 3600000).toISOString(), username: 'producer_vibes', display_name: 'Producer Vibes', likes_count: 24 },
  { id: 'c2', user_id: 'u2', content: 'The melody hits different at 0:45', created_at: new Date(Date.now() - 7200000).toISOString(), username: 'beatmaker_jay', display_name: 'Jay Beats', likes_count: 18 },
  { id: 'c3', user_id: 'u3', content: 'Collab?', created_at: new Date(Date.now() - 86400000).toISOString(), username: 'nova_sounds', display_name: 'Nova', likes_count: 5 },
  { id: 'c4', user_id: 'u4', content: 'Been listening to this on repeat all day', created_at: new Date(Date.now() - 172800000).toISOString(), username: 'music_lover22', display_name: 'Music Lover', likes_count: 32 },
];

type FeedTab = 'following' | 'discover' | 'beats';

export function FeedView() {
  const { user, token, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause, setQueue } = useAudioPlayer();
  const { developerMode } = useSettings();
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [discoverTracks, setDiscoverTracks] = useState<DiscoverTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>('discover');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [savedTracks, setSavedTracks] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

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

  // Simple scroll handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(container.scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredTracks.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, filteredTracks.length]);

  const handleLike = async (track: DiscoverTrack) => {
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
      // Revert on error
      setLikedTracks(prev => {
        const newSet = new Set(prev);
        if (wasLiked) newSet.add(track.id);
        else newSet.delete(track.id);
        return newSet;
      });
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

  const handleFollow = async (userId: string) => {
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

  const handleRepost = async (trackId: string) => {
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

  const handleShare = async (track: DiscoverTrack) => {
    const shareData = {
      title: track.title,
      text: `Check out "${track.title}" by ${track.artist} on RHYTHM`,
      url: window.location.origin + `/#/track/${track.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Copy to clipboard
      await navigator.clipboard.writeText(shareData.url);
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

  const openComments = (track: DiscoverTrack) => {
    setShowComments(true);
    fetchComments(track.id);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !token) return;

    const track = filteredTracks[currentIndex];
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
      await fetch(`${API_URL}/api/tracks/${track.id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: tempComment.content })
      });
      fetchComments(track.id);
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
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

  const currentTrackData = filteredTracks[currentIndex];

  return (
    <div className="h-full bg-black flex flex-col relative overflow-hidden">
      {/* Top Tabs - TikTok style */}
      <div className="absolute top-0 left-0 right-0 z-40 pt-4 pb-3 px-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center justify-center gap-6">
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('following')}
              className={`text-[15px] font-semibold transition-all ${
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
            className={`text-[15px] font-semibold transition-all ${
              activeTab === 'discover'
                ? 'text-white'
                : 'text-white/50'
            }`}
          >
            For You
          </button>

          {developerMode && (
            <button
              onClick={() => setActiveTab('beats')}
              className={`text-[15px] font-semibold transition-all ${
                activeTab === 'beats'
                  ? 'text-white'
                  : 'text-white/50'
              }`}
            >
              Beats
            </button>
          )}
        </div>
        {/* Active indicator */}
        <div className="flex justify-center mt-1">
          <div
            className={`h-0.5 bg-white rounded-full transition-all duration-300 ${
              activeTab === 'following' ? 'w-16 -ml-24' :
              activeTab === 'discover' ? 'w-12' :
              'w-12 ml-20'
            }`}
          />
        </div>
      </div>

      {/* Main Content - Full screen vertical scroll */}
      {activeTab !== 'following' ? (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
          style={{
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {filteredTracks.length === 0 ? (
            <div className="h-full min-h-screen flex items-center justify-center">
              <div className="text-center px-8">
                <Music className="w-16 h-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/60 text-lg font-medium mb-2">
                  {activeTab === 'beats' ? 'No beats found' : 'No tracks yet'}
                </p>
                <p className="text-white/40 text-sm">
                  {activeTab === 'beats'
                    ? 'Check back soon for new beats'
                    : 'Be the first to share your music!'}
                </p>
              </div>
            </div>
          ) : (
            filteredTracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              const isLiked = likedTracks.has(track.id);
              const isSaved = savedTracks.has(track.id);
              const isFollowing = followedUsers.has(track.user_id);

              return (
                <div
                  key={track.id}
                  className="h-screen w-full relative flex items-center justify-center"
                  style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                >
                  {/* Full screen background - Album art */}
                  <div className="absolute inset-0">
                    {track.cover_url ? (
                      <>
                        <img
                          src={track.cover_url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl brightness-50"
                        />
                        <div className="absolute inset-0 bg-black/40" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
                    )}
                  </div>

                  {/* Content Container */}
                  <div className="relative z-10 w-full h-full flex">
                    {/* Left side - Track Info (bottom aligned like TikTok) */}
                    <div className="flex-1 flex flex-col justify-end pb-24 pl-4 pr-20">
                      {/* Producer info with follow button */}
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          onClick={() => window.location.hash = `#/producer/${track.user_id}`}
                          className="flex items-center gap-2"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center overflow-hidden ring-2 ring-white/20">
                            {track.avatar_url ? (
                              <img src={track.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-sm font-bold">
                                {(track.display_name || track.username).charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-white font-semibold text-[15px]">
                            @{track.username}
                          </span>
                        </button>

                        {!isFollowing && isAuthenticated && (
                          <button
                            onClick={() => handleFollow(track.user_id)}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-white text-xs font-medium transition-colors"
                          >
                            Follow
                          </button>
                        )}
                      </div>

                      {/* Track title and description */}
                      <h2 className="text-white text-lg font-bold mb-1 line-clamp-2">
                        {track.title}
                      </h2>
                      <p className="text-white/70 text-sm mb-3 line-clamp-2">
                        {track.artist} {track.genre && `• ${track.genre}`}
                      </p>

                      {/* Music info bar - scrolling like TikTok */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <Music className="w-3.5 h-3.5 text-white" />
                          <div className="overflow-hidden max-w-[200px]">
                            <p className="text-white text-xs whitespace-nowrap animate-marquee">
                              {track.title} - {track.artist} {track.bpm && `• ${track.bpm} BPM`} {track.musical_key && `• ${track.musical_key}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Action buttons (TikTok style) */}
                    <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
                      {/* Album art / Play button */}
                      <button
                        onClick={() => isCurrentTrack ? togglePlayPause() : handlePlayTrack(track)}
                        className="relative mb-2"
                      >
                        <div className={`w-12 h-12 rounded-xl overflow-hidden shadow-lg ${isCurrentTrack && isPlaying ? 'animate-spin-slow' : ''}`}>
                          {track.cover_url ? (
                            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                              <Music className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                          {isCurrentTrack && isPlaying ? (
                            <Pause className="w-5 h-5 text-white" fill="currentColor" />
                          ) : (
                            <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                          )}
                        </div>
                      </button>

                      {/* Like */}
                      <button
                        onClick={() => handleLike(track)}
                        className="flex flex-col items-center"
                      >
                        <div className={`p-2 transition-transform active:scale-90 ${isLiked ? 'animate-heart-pop' : ''}`}>
                          <Heart
                            className={`w-8 h-8 transition-colors ${isLiked ? 'text-red-500' : 'text-white'}`}
                            fill={isLiked ? 'currentColor' : 'none'}
                            strokeWidth={2}
                          />
                        </div>
                        <span className="text-white text-xs font-medium">
                          {formatCount(track.likes_count + (isLiked ? 1 : 0))}
                        </span>
                      </button>

                      {/* Comments */}
                      <button
                        onClick={() => openComments(track)}
                        className="flex flex-col items-center"
                      >
                        <div className="p-2">
                          <MessageCircle className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <span className="text-white text-xs font-medium">
                          {formatCount(track.comments_count)}
                        </span>
                      </button>

                      {/* Repost */}
                      <button
                        onClick={() => handleRepost(track.id)}
                        className="flex flex-col items-center"
                      >
                        <div className="p-2">
                          <Repeat2 className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <span className="text-white text-xs font-medium">
                          {formatCount(track.reposts_count)}
                        </span>
                      </button>

                      {/* Save */}
                      <button
                        onClick={() => handleSave(track)}
                        className="flex flex-col items-center"
                      >
                        <div className="p-2">
                          <Bookmark
                            className={`w-8 h-8 transition-colors ${isSaved ? 'text-amber-400' : 'text-white'}`}
                            fill={isSaved ? 'currentColor' : 'none'}
                            strokeWidth={2}
                          />
                        </div>
                        <span className="text-white text-xs font-medium">Save</span>
                      </button>

                      {/* Share */}
                      <button
                        onClick={() => handleShare(track)}
                        className="flex flex-col items-center"
                      >
                        <div className="p-2">
                          <Share2 className="w-7 h-7 text-white" strokeWidth={2} />
                        </div>
                        <span className="text-white text-xs font-medium">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Following Feed - Activity style */
        <div className="flex-1 overflow-y-auto pt-16 pb-8 px-4">
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

      {/* Comments Modal */}
      {showComments && currentTrackData && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowComments(false)}
          />

          {/* Comments Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl max-h-[70vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-white font-semibold text-lg">
                {formatCount(currentTrackData.comments_count)} comments
              </span>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No comments yet</p>
                  <p className="text-white/30 text-xs">Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {comment.avatar_url ? (
                        <img src={comment.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {(comment.display_name || comment.username).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white/80 text-sm font-medium">
                          {comment.display_name || comment.username}
                        </span>
                        <span className="text-white/30 text-xs">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-white text-[15px] leading-relaxed">{comment.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button className="flex items-center gap-1 text-white/40 hover:text-white/60 transition-colors">
                          <Heart className="w-3.5 h-3.5" />
                          <span className="text-xs">{comment.likes_count > 0 ? formatCount(comment.likes_count) : 'Like'}</span>
                        </button>
                        <button className="text-white/40 hover:text-white/60 transition-colors text-xs">
                          Reply
                        </button>
                      </div>
                    </div>
                    <button className="p-1 text-white/30 hover:text-white/50 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            {isAuthenticated && (
              <div className="p-4 border-t border-white/10 bg-zinc-950">
                <div className="flex items-center gap-3">
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
                      placeholder="Add comment..."
                      className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500/50 pr-12"
                    />
                    {newComment.trim() && (
                      <button
                        onClick={handleSubmitComment}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-violet-500 hover:bg-violet-600 transition-colors"
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

      {/* Custom animations */}
      <style>{`
        @keyframes audioLoading {
          0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes heart-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .animate-heart-pop {
          animation: heart-pop 0.3s ease-out;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default FeedView;
