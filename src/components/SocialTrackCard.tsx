import { useState } from 'react';
import {
  Heart, MessageCircle, Repeat2, Play, Pause, MoreHorizontal,
  Share2, Music, Bookmark, Flag
} from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

interface SocialTrack {
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
  user_id: string;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  is_liked?: boolean;
  is_reposted?: boolean;
  created_at?: string;
}

interface SocialTrackCardProps {
  track: SocialTrack;
  onCommentClick?: (trackId: string) => void;
  onUserClick?: (userId: string) => void;
  onRefresh?: () => void;
  variant?: 'default' | 'compact' | 'expanded';
}

export function SocialTrackCard({
  track,
  onCommentClick,
  onUserClick,
  onRefresh,
  variant = 'default'
}: SocialTrackCardProps) {
  const { token, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause, setQueue } = useAudioPlayer();

  const [isLiked, setIsLiked] = useState(track.is_liked || false);
  const [isReposted, setIsReposted] = useState(track.is_reposted || false);
  const [likesCount, setLikesCount] = useState(track.likes_count);
  const [repostsCount, setRepostsCount] = useState(track.reposts_count);
  const [showMenu, setShowMenu] = useState(false);

  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlayPause();
    } else {
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
        isLiked: false,
        addedAt: new Date()
      };
      setQueue([queueTrack as any], 0);
    }
  };

  const handleLike = async () => {
    if (!token || !isAuthenticated) return;

    try {
      if (isLiked) {
        await fetch(`${API_URL}/api/tracks/${track.id}/like`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await fetch(`${API_URL}/api/tracks/${track.id}/like`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleRepost = async () => {
    if (!token || !isAuthenticated) return;

    try {
      if (isReposted) {
        await fetch(`${API_URL}/api/tracks/${track.id}/repost`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsReposted(false);
        setRepostsCount(prev => Math.max(0, prev - 1));
      } else {
        await fetch(`${API_URL}/api/tracks/${track.id}/repost`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsReposted(true);
        setRepostsCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to toggle repost:', err);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/#/track/${track.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `Check out "${track.title}" by ${track.artist} on RHYTHM`,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      // Could show toast here
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
        {/* Cover */}
        <div className="relative w-10 h-10 flex-shrink-0">
          {track.cover_url ? (
            <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover rounded" />
          ) : (
            <div className="w-full h-full bg-white/10 rounded flex items-center justify-center">
              <Music className="w-4 h-4 text-white/40" />
            </div>
          )}
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded"
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-4 h-4 text-white" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4 text-white" fill="currentColor" />
            )}
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
          <p className="text-xs text-white/60 truncate">{track.artist}</p>
        </div>

        {/* Quick Actions */}
        <button
          onClick={handleLike}
          className={`p-1.5 rounded-full transition-colors ${
            isLiked ? 'text-pink-500' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all group">
      <div className="flex items-start gap-4">
        {/* Cover Art with Play Button */}
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
            onClick={handlePlay}
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
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate">{track.title}</h3>
              <p className="text-sm text-white/60 truncate">{track.artist}</p>
            </div>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full text-white/40 hover:text-white/60 hover:bg-white/10 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 py-1">
                    <button
                      onClick={() => { handleShare(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                      Save to Playlist
                    </button>
                    {onUserClick && (
                      <button
                        onClick={() => { onUserClick(track.user_id); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                      >
                        <Music className="w-4 h-4" />
                        View Artist
                      </button>
                    )}
                    <div className="border-t border-white/10 my-1" />
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/40 hover:bg-white/10 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Producer */}
            <button
              onClick={() => onUserClick?.(track.user_id)}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              {track.display_name || track.username}
            </button>

            {/* BPM */}
            {track.bpm && (
              <span className="text-xs text-white/40">{track.bpm} BPM</span>
            )}

            {/* Key */}
            {track.musical_key && (
              <span className="text-xs text-white/40">{track.musical_key}</span>
            )}

            {/* Genre */}
            {track.genre && (
              <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60">
                {track.genre}
              </span>
            )}

            {/* Duration */}
            <span className="text-xs text-white/40 hidden md:inline">
              {formatDuration(track.duration)}
            </span>

            {/* Time ago */}
            {track.created_at && (
              <span className="text-xs text-white/40">
                {formatTimeAgo(track.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Social Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              isLiked
                ? 'bg-pink-500/20 text-pink-500'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-xs font-medium">{likesCount}</span>
          </button>

          {/* Repost */}
          <button
            onClick={handleRepost}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              isReposted
                ? 'bg-green-500/20 text-green-500'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Repeat2 className="w-4 h-4" />
            <span className="text-xs font-medium">{repostsCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => onCommentClick?.(track.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{track.comments_count}</span>
          </button>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="p-2 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default SocialTrackCard;
