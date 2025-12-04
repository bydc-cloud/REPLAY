import { useState, useEffect, useCallback } from 'react';
import {
  User, Music, Package, Users, Heart, Play, Pause, ExternalLink,
  Instagram, Twitter, Youtube, Globe, Loader2, UserPlus, UserMinus, MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

interface ProducerProfile {
  user_id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  website?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    soundcloud?: string;
  };
  is_verified: boolean;
  is_producer: boolean;
  followers_count: number;
  following_count: number;
  tracks_count: number;
}

interface ProducerTrack {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  duration: number;
  bpm?: number;
  genre?: string;
  likes_count: number;
  reposts_count: number;
}

interface ProducerPack {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  price: number;
  sale_price?: number;
  track_count: number;
}

interface ProducerProfileViewProps {
  userId?: string;
  onBack?: () => void;
  onMessageClick?: (userId: string) => void;
}

export function ProducerProfileView({ userId, onBack, onMessageClick }: ProducerProfileViewProps) {
  const { user, token, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause, setQueue } = useAudioPlayer();

  // If no userId provided, show current user's profile
  const targetUserId = userId || user?.id;

  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [tracks, setTracks] = useState<ProducerTrack[]>([]);
  const [packs, setPacks] = useState<ProducerPack[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracks' | 'packs'>('tracks');

  const isOwnProfile = user?.id === targetUserId;

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const response = await fetch(`${API_URL}/api/producers/${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [targetUserId]);

  const fetchTracks = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const response = await fetch(`${API_URL}/api/discover/tracks?limit=50`);
      if (response.ok) {
        const data = await response.json();
        // Filter to this producer's tracks
        const producerTracks = data.filter((t: ProducerTrack & { user_id: string }) => t.user_id === targetUserId);
        setTracks(producerTracks);
      }
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
    }
  }, [targetUserId]);

  const fetchPacks = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const response = await fetch(`${API_URL}/api/discover/packs?limit=50`);
      if (response.ok) {
        const data = await response.json();
        // Filter to this producer's packs
        const producerPacks = data.filter((p: ProducerPack & { user_id: string }) => p.user_id === targetUserId);
        setPacks(producerPacks);
      }
    } catch (err) {
      console.error('Failed to fetch packs:', err);
    }
  }, [targetUserId]);

  const checkFollowing = useCallback(async () => {
    if (!token || !isAuthenticated || isOwnProfile || !targetUserId) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${user?.id}/following`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const following = await response.json();
        setIsFollowing(following.some((f: { id: string }) => f.id === targetUserId));
      }
    } catch (err) {
      console.error('Failed to check following:', err);
    }
  }, [token, isAuthenticated, isOwnProfile, user?.id, targetUserId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchTracks(), fetchPacks(), checkFollowing()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProfile, fetchTracks, fetchPacks, checkFollowing]);

  const handleFollow = async () => {
    if (!token || !targetUserId) return;

    try {
      if (isFollowing) {
        await fetch(`${API_URL}/api/users/${targetUserId}/follow`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        if (profile) {
          setProfile({ ...profile, followers_count: profile.followers_count - 1 });
        }
      } else {
        await fetch(`${API_URL}/api/users/${targetUserId}/follow`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(true);
        if (profile) {
          setProfile({ ...profile, followers_count: profile.followers_count + 1 });
        }
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handlePlayTrack = (track: ProducerTrack, index: number) => {
    // Convert to queue format - cast as any to satisfy Track type for social playback
    const queueTracks = tracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: '',
      duration: t.duration,
      coverUrl: t.cover_url || '',
      fileUrl: '', // Social tracks stream from API
      fileData: null,
      fileKey: null,
      playCount: 0,
      isLiked: false,
      addedAt: new Date()
    }));
    setQueue(queueTracks as any[], index);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <User className="w-12 h-12 mx-auto text-white/20 mb-4" />
        <p className="text-white/60">Producer not found</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Banner */}
      <div className="h-48 md:h-64 relative">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600/30 via-pink-500/20 to-blue-600/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--replay-black)] via-transparent to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="px-4 md:px-8 -mt-16 md:-mt-20 relative">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Avatar */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[var(--replay-black)] overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl md:text-5xl font-bold text-white">
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name & Stats */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {profile.display_name || profile.username}
              </h1>
              {profile.is_verified && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-white/60">@{profile.username}</p>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-3">
              <div>
                <span className="font-bold text-white">{profile.tracks_count}</span>
                <span className="text-white/60 text-sm ml-1">tracks</span>
              </div>
              <div>
                <span className="font-bold text-white">{profile.followers_count}</span>
                <span className="text-white/60 text-sm ml-1">followers</span>
              </div>
              <div>
                <span className="font-bold text-white">{profile.following_count}</span>
                <span className="text-white/60 text-sm ml-1">following</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && isAuthenticated && (
            <div className="flex gap-2">
              <button
                onClick={handleFollow}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-colors ${
                  isFollowing
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </button>
              {onMessageClick && targetUserId && (
                <button
                  onClick={() => onMessageClick(targetUserId)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-white/80 max-w-2xl">{profile.bio}</p>
        )}

        {/* Social Links */}
        {(profile.website || profile.social_links) && (
          <div className="flex items-center gap-4 mt-4">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
              >
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
            {profile.social_links?.instagram && (
              <a
                href={`https://instagram.com/${profile.social_links.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {profile.social_links?.twitter && (
              <a
                href={`https://twitter.com/${profile.social_links.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {profile.social_links?.youtube && (
              <a
                href={`https://youtube.com/${profile.social_links.youtube}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 mt-8">
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === 'tracks'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            Tracks ({tracks.length})
          </button>
          <button
            onClick={() => setActiveTab('packs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === 'packs'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Packs ({packs.length})
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {activeTab === 'tracks' ? (
            <div className="space-y-2">
              {tracks.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-12 h-12 mx-auto text-white/20 mb-4" />
                  <p className="text-white/60">No public tracks yet</p>
                </div>
              ) : (
                tracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      {/* Play Button / Cover */}
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {track.cover_url ? (
                          <img
                            src={track.cover_url}
                            alt={track.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 rounded flex items-center justify-center">
                            <Music className="w-5 h-5 text-white/40" />
                          </div>
                        )}
                        <button
                          onClick={() => isCurrentTrack ? togglePlayPause() : handlePlayTrack(track, index)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                        >
                          {isCurrentTrack && isPlaying ? (
                            <Pause className="w-5 h-5 text-white" fill="currentColor" />
                          ) : (
                            <Play className="w-5 h-5 text-white" fill="currentColor" />
                          )}
                        </button>
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{track.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          {track.bpm && <span>{track.bpm} BPM</span>}
                          {track.genre && <span className="px-2 py-0.5 bg-white/10 rounded">{track.genre}</span>}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-white/60">
                        <span className="flex items-center gap-1 text-sm">
                          <Heart className="w-4 h-4" />
                          {track.likes_count}
                        </span>
                        <span className="text-sm hidden md:block">{formatDuration(track.duration)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packs.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-white/20 mb-4" />
                  <p className="text-white/60">No packs available</p>
                </div>
              ) : (
                packs.map((pack) => (
                  <div
                    key={pack.id}
                    className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    {/* Pack Cover */}
                    <div className="aspect-square relative">
                      {pack.cover_url ? (
                        <img
                          src={pack.cover_url}
                          alt={pack.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                          <Package className="w-16 h-16 text-white/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="px-6 py-2 bg-white text-black rounded-full font-medium">
                          View Pack
                        </button>
                      </div>
                    </div>

                    {/* Pack Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-white truncate">{pack.title}</h4>
                      <p className="text-sm text-white/60 mt-1">{pack.track_count} tracks</p>
                      <div className="flex items-center gap-2 mt-2">
                        {pack.sale_price ? (
                          <>
                            <span className="font-bold text-green-400">${pack.sale_price}</span>
                            <span className="text-sm text-white/40 line-through">${pack.price}</span>
                          </>
                        ) : (
                          <span className="font-bold text-white">${pack.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProducerProfileView;
