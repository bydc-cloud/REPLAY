import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Repeat2, Play, Pause, UserPlus, Music, Loader2, RefreshCw } from 'lucide-react';
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
}

export function FeedView() {
  const { token, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause, setQueue } = useAudioPlayer();
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [discoverTracks, setDiscoverTracks] = useState<DiscoverTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'discover'>('discover');

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
        setDiscoverTracks(data);
      }
    } catch (err) {
      console.error('Failed to fetch discover tracks:', err);
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

  const handleLike = async (track: DiscoverTrack) => {
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/tracks/${track.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh discover tracks to update counts
      fetchDiscoverTracks();
      // Auto-play the track when liking it
      handlePlayTrack(track);
    } catch (err) {
      console.error('Failed to like track:', err);
    }
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
    // Convert to queue format - cast as any to satisfy Track type for social playback
    const queueTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: '',
      duration: track.duration,
      coverUrl: track.cover_url || '',
      fileUrl: '', // Social tracks stream from API
      fileData: null,
      fileKey: null,
      playCount: 0,
      isLiked: false,
      addedAt: new Date()
    };
    setQueue([queueTrack as any], 0);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventDescription = (event: FeedEvent) => {
    const name = event.display_name || event.username;
    switch (event.event_type) {
      case 'like':
        return `${name} liked a track`;
      case 'repost':
        return `${name} reposted a track`;
      case 'comment':
        return `${name} commented on a track`;
      case 'follow':
        return `${name} followed someone`;
      case 'upload':
        return `${name} uploaded a new track`;
      default:
        return `${name} did something`;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'like':
        return <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />;
      case 'repost':
        return <Repeat2 className="w-4 h-4 text-green-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      default:
        return <Music className="w-4 h-4 text-white/60" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {activeTab === 'feed' ? 'Your Feed' : 'Discover'}
        </h1>
        <button
          onClick={() => {
            setLoading(true);
            Promise.all([fetchFeed(), fetchDiscoverTracks()]).then(() => setLoading(false));
          }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'discover'
              ? 'bg-white text-black'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Discover
        </button>
        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'feed'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Following
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'discover' ? (
        <div className="space-y-3">
          {discoverTracks.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-12 h-12 mx-auto text-white/20 mb-4" />
              <p className="text-white/60">No public tracks yet</p>
              <p className="text-white/40 text-sm mt-1">Be the first to share your music!</p>
            </div>
          ) : (
            discoverTracks.map((track) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Cover Art */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                      {track.cover_url ? (
                        <img
                          src={track.cover_url}
                          alt={track.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg flex items-center justify-center">
                          <Music className="w-8 h-8 text-white/40" />
                        </div>
                      )}
                      <button
                        onClick={() => isCurrentTrack ? togglePlayPause() : handlePlayTrack(track)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      >
                        {isCurrentTrack && isPlaying ? (
                          <Pause className="w-8 h-8 text-white" fill="currentColor" />
                        ) : (
                          <Play className="w-8 h-8 text-white" fill="currentColor" />
                        )}
                      </button>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{track.title}</h3>
                      <p className="text-sm text-white/60 truncate">{track.artist}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/40">
                          {track.display_name || track.username}
                        </span>
                        {track.bpm && (
                          <span className="text-xs text-white/40">{track.bpm} BPM</span>
                        )}
                        {track.genre && (
                          <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60">
                            {track.genre}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Duration */}
                    <span className="text-sm text-white/40 hidden md:block">
                      {formatDuration(track.duration)}
                    </span>

                    {/* Social Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLike(track)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-white/60" />
                        <span className="text-xs text-white/60">{track.likes_count}</span>
                      </button>
                      <button
                        onClick={() => handleRepost(track.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Repeat2 className="w-4 h-4 text-white/60" />
                        <span className="text-xs text-white/60">{track.reposts_count}</span>
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <MessageCircle className="w-4 h-4 text-white/60" />
                        <span className="text-xs text-white/60">{track.comments_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {feed.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 mx-auto text-white/20 mb-4" />
              <p className="text-white/60">Your feed is empty</p>
              <p className="text-white/40 text-sm mt-1">Follow producers to see their activity</p>
            </div>
          ) : (
            feed.map((event) => (
              <div
                key={event.id}
                className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {event.avatar_url ? (
                      <img
                        src={event.avatar_url}
                        alt={event.username}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {(event.display_name || event.username).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.event_type)}
                      <p className="text-sm text-white/80">{getEventDescription(event)}</p>
                    </div>
                    <span className="text-xs text-white/40">{formatTimeAgo(event.created_at)}</span>

                    {/* Target Track Preview */}
                    {event.target_data && event.target_type === 'track' && (
                      <div className="mt-3 flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        {event.target_data.cover_url ? (
                          <img
                            src={event.target_data.cover_url}
                            alt={event.target_data.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                            <Music className="w-5 h-5 text-white/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{event.target_data.title}</p>
                          <p className="text-xs text-white/60 truncate">{event.target_data.artist}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default FeedView;
