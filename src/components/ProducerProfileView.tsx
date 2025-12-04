import { useState, useEffect, useCallback, useContext } from 'react';
import {
  User, Music, Package, Heart, Play, Pause, Share2, MoreHorizontal,
  Instagram, Twitter, Youtube, Globe, Loader2, UserPlus, UserMinus,
  MessageCircle, Shuffle, Edit2, Camera, Check, X, ListMusic, Clock,
  TrendingUp, Calendar, MapPin, Verified, PlayCircle, Repeat2
} from 'lucide-react';
import { useAuth } from '../contexts/PostgresAuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import MessagingContext from '../contexts/MessagingContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

interface ProducerProfile {
  user_id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  website?: string;
  location?: string;
  joined_at?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    soundcloud?: string;
    spotify?: string;
    tiktok?: string;
  };
  is_verified: boolean;
  is_producer: boolean;
  followers_count: number;
  following_count: number;
  tracks_count: number;
  monthly_listeners?: number;
  total_plays?: number;
}

interface ProducerTrack {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
  duration: number;
  bpm?: number;
  musical_key?: string;
  genre?: string;
  likes_count: number;
  reposts_count: number;
  play_count?: number;
  created_at?: string;
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

interface Playlist {
  id: string;
  title: string;
  cover_url?: string;
  track_count: number;
  is_public: boolean;
}

interface ProducerProfileViewProps {
  userId?: string;
  onBack?: () => void;
  onNavigate?: (tab: string) => void;
}

export function ProducerProfileView({ userId, onBack, onNavigate }: ProducerProfileViewProps) {
  const { user, token, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause, setQueue } = useAudioPlayer();
  const messagingContext = useContext(MessagingContext);

  // If no userId provided, show current user's profile
  const targetUserId = userId || user?.id;

  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [tracks, setTracks] = useState<ProducerTrack[]>([]);
  const [packs, setPacks] = useState<ProducerPack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'popular' | 'tracks' | 'packs' | 'playlists' | 'about'>('popular');
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: '',
    instagram: '',
    twitter: '',
    youtube: ''
  });
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  const isOwnProfile = user?.id === targetUserId;

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const response = await fetch(`${API_URL}/api/producers/${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm({
          display_name: data.display_name || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          instagram: data.social_links?.instagram || '',
          twitter: data.social_links?.twitter || '',
          youtube: data.social_links?.youtube || ''
        });
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
        // Filter to this producer's tracks and sort by play count
        const producerTracks = data
          .filter((t: ProducerTrack & { user_id: string }) => t.user_id === targetUserId)
          .sort((a: ProducerTrack, b: ProducerTrack) => (b.play_count || b.likes_count) - (a.play_count || a.likes_count));
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

  const handleMessage = async () => {
    if (!messagingContext || !targetUserId || messageLoading) return;

    setMessageLoading(true);
    try {
      const conversationId = await messagingContext.startConversation(targetUserId);
      if (conversationId && onNavigate) {
        onNavigate('messages');
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setMessageLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    const queueTracks = tracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: '',
      duration: t.duration,
      coverUrl: t.cover_url || '',
      fileUrl: '',
      fileData: null,
      fileKey: null,
      playCount: 0,
      isLiked: false,
      addedAt: new Date()
    }));
    setQueue(queueTracks as any[], 0);
  };

  const handleShuffle = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const queueTracks = shuffled.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: '',
      duration: t.duration,
      coverUrl: t.cover_url || '',
      fileUrl: '',
      fileData: null,
      fileKey: null,
      playCount: 0,
      isLiked: false,
      addedAt: new Date()
    }));
    setQueue(queueTracks as any[], 0);
  };

  const handlePlayTrack = (track: ProducerTrack, index: number) => {
    const queueTracks = tracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: '',
      duration: t.duration,
      coverUrl: t.cover_url || '',
      fileUrl: '',
      fileData: null,
      fileKey: null,
      playCount: 0,
      isLiked: false,
      addedAt: new Date()
    }));
    setQueue(queueTracks as any[], index);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/#/producer/${targetUserId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.display_name || profile?.username,
          text: `Check out ${profile?.display_name || profile?.username} on RHYTHM`,
          url: shareUrl
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Popular tracks (top 5 by plays/likes)
  const popularTracks = tracks.slice(0, showAllTracks ? tracks.length : 5);

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
        <p className="text-white/60">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Hero Banner - Spotify/Apple Music style with gradient overlay */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-64 md:h-80 lg:h-96 relative overflow-hidden">
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 via-indigo-800 to-pink-900" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/40 to-transparent" />
        </div>

        {/* Profile Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl md:text-6xl font-bold text-white">
                      {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            {/* Name & Verification */}
            <div className="flex-1">
              {profile.is_verified && (
                <div className="flex items-center gap-1.5 text-blue-400 text-sm font-medium mb-1">
                  <Verified className="w-4 h-4" />
                  Verified Artist
                </div>
              )}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2">
                {profile.display_name || profile.username}
              </h1>

              {/* Monthly Listeners - Spotify style */}
              <div className="flex items-center gap-4 text-white/70">
                <span className="text-sm md:text-base">
                  {formatNumber(profile.monthly_listeners || profile.followers_count * 10)} monthly listeners
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="px-4 md:px-8 py-6 flex flex-wrap items-center gap-3">
        {/* Play Button - Large green circle like Spotify */}
        <button
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
        </button>

        {/* Shuffle */}
        <button
          onClick={handleShuffle}
          disabled={tracks.length === 0}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center disabled:opacity-50"
        >
          <Shuffle className="w-5 h-5 text-white" />
        </button>

        {/* Follow/Following */}
        {!isOwnProfile && isAuthenticated && (
          <button
            onClick={handleFollow}
            className={`px-6 py-2.5 rounded-full font-semibold transition-all ${
              isFollowing
                ? 'border border-white/30 text-white hover:border-white/60'
                : 'bg-white text-black hover:scale-105'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}

        {/* Message Button */}
        {!isOwnProfile && isAuthenticated && (
          <button
            onClick={handleMessage}
            disabled={messageLoading}
            className="px-5 py-2.5 rounded-full border border-white/30 text-white hover:border-white/60 transition-colors flex items-center gap-2 font-medium"
          >
            {messageLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            Message
          </button>
        )}

        {/* Edit Profile - Own profile */}
        {isOwnProfile && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 rounded-full border border-white/30 text-white hover:border-white/60 transition-colors flex items-center gap-2 font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}

        {/* More Options */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-10 h-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <MoreHorizontal className="w-5 h-5 text-white/70" />
          </button>

          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#282828] rounded-lg shadow-xl z-50 py-1 border border-white/10">
                <button
                  onClick={() => { handleShare(); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Row - Instagram/Twitter style */}
      <div className="px-4 md:px-8 py-4 flex items-center gap-8 border-b border-white/10">
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-white">{formatNumber(profile.followers_count)}</div>
          <div className="text-xs md:text-sm text-white/50">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-white">{formatNumber(profile.following_count)}</div>
          <div className="text-xs md:text-sm text-white/50">Following</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-white">{formatNumber(profile.tracks_count)}</div>
          <div className="text-xs md:text-sm text-white/50">Tracks</div>
        </div>
        {profile.total_plays && (
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white">{formatNumber(profile.total_plays)}</div>
            <div className="text-xs md:text-sm text-white/50">Plays</div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 md:px-8 pt-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {['popular', 'tracks', 'packs', 'playlists', 'about'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 mt-6">
        {/* Popular Tracks */}
        {activeTab === 'popular' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Popular</h2>
            <div className="space-y-1">
              {popularTracks.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer"
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    {/* Track Number / Play Icon */}
                    <div className="w-6 text-center">
                      <span className="text-white/50 group-hover:hidden">{index + 1}</span>
                      <Play className="w-4 h-4 text-white hidden group-hover:block mx-auto" fill="currentColor" />
                    </div>

                    {/* Cover */}
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                      {track.cover_url ? (
                        <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <Music className="w-5 h-5 text-white/40" />
                        </div>
                      )}
                    </div>

                    {/* Title & Artist */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-green-500' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-sm text-white/50 truncate">{track.artist}</p>
                    </div>

                    {/* Play Count */}
                    <div className="text-white/50 text-sm hidden md:block">
                      {formatNumber(track.play_count || track.likes_count * 100)}
                    </div>

                    {/* Duration */}
                    <div className="text-white/50 text-sm w-12 text-right">
                      {formatDuration(track.duration)}
                    </div>

                    {/* Like Button */}
                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-4 h-4 text-white/50 hover:text-white" />
                    </button>
                  </div>
                );
              })}
            </div>

            {tracks.length > 5 && (
              <button
                onClick={() => setShowAllTracks(!showAllTracks)}
                className="mt-4 text-sm text-white/60 hover:text-white font-medium"
              >
                {showAllTracks ? 'Show less' : `See all ${tracks.length} tracks`}
              </button>
            )}
          </div>
        )}

        {/* All Tracks */}
        {activeTab === 'tracks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">All Tracks</h2>
              <span className="text-white/50 text-sm">{tracks.length} tracks</span>
            </div>
            <div className="space-y-1">
              {tracks.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer"
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 relative">
                      {track.cover_url ? (
                        <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <Music className="w-5 h-5 text-white/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isCurrentTrack && isPlaying ? (
                          <Pause className="w-5 h-5 text-white" fill="currentColor" />
                        ) : (
                          <Play className="w-5 h-5 text-white" fill="currentColor" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-green-500' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        {track.bpm && <span>{track.bpm} BPM</span>}
                        {track.musical_key && <span>{track.musical_key}</span>}
                        {track.genre && (
                          <span className="px-2 py-0.5 bg-white/10 rounded">{track.genre}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-white/50">
                      <span className="flex items-center gap-1 text-sm">
                        <Heart className="w-3.5 h-3.5" />
                        {track.likes_count}
                      </span>
                      <span className="flex items-center gap-1 text-sm hidden md:flex">
                        <Repeat2 className="w-3.5 h-3.5" />
                        {track.reposts_count}
                      </span>
                      <span className="text-sm w-12 text-right">{formatDuration(track.duration)}</span>
                    </div>
                  </div>
                );
              })}

              {tracks.length === 0 && (
                <div className="text-center py-16">
                  <Music className="w-16 h-16 mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">No tracks yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Packs */}
        {activeTab === 'packs' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Sound Packs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <div className="aspect-square relative">
                    {pack.cover_url ? (
                      <img src={pack.cover_url} alt={pack.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                        <Package className="w-12 h-12 text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="px-4 py-2 bg-white text-black rounded-full font-medium text-sm">
                        View Pack
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-white truncate">{pack.title}</h4>
                    <p className="text-sm text-white/50 mt-1">{pack.track_count} sounds</p>
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
              ))}

              {packs.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Package className="w-16 h-16 mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">No packs available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Playlists */}
        {activeTab === 'playlists' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Playlists</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {playlists.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <ListMusic className="w-16 h-16 mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">No public playlists</p>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <div key={playlist.id} className="group cursor-pointer">
                    <div className="aspect-square rounded-lg overflow-hidden bg-white/10 mb-3 relative">
                      {playlist.cover_url ? (
                        <img src={playlist.cover_url} alt={playlist.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ListMusic className="w-12 h-12 text-white/40" />
                        </div>
                      )}
                      <button className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                        <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                      </button>
                    </div>
                    <h4 className="font-medium text-white truncate">{playlist.title}</h4>
                    <p className="text-sm text-white/50">{playlist.track_count} tracks</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* About */}
        {activeTab === 'about' && (
          <div className="max-w-2xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">About</h2>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-8">
                <p className="text-white/80 text-lg leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-white/5 rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Monthly Listeners
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatNumber(profile.monthly_listeners || profile.followers_count * 10)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                    <PlayCircle className="w-4 h-4" />
                    Total Plays
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatNumber(profile.total_plays || tracks.reduce((sum, t) => sum + (t.play_count || 0), 0))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                    <Music className="w-4 h-4" />
                    Tracks
                  </div>
                  <div className="text-2xl font-bold text-white">{profile.tracks_count}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                    <Heart className="w-4 h-4" />
                    Followers
                  </div>
                  <div className="text-2xl font-bold text-white">{formatNumber(profile.followers_count)}</div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-4">
              {profile.location && (
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-5 h-5 text-white/50" />
                  {profile.location}
                </div>
              )}
              {profile.joined_at && (
                <div className="flex items-center gap-3 text-white/70">
                  <Calendar className="w-5 h-5 text-white/50" />
                  Joined {formatDate(profile.joined_at)}
                </div>
              )}
            </div>

            {/* Social Links */}
            {(profile.website || profile.social_links) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
                <div className="flex flex-wrap gap-3">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 transition-colors"
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
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </a>
                  )}
                  {profile.social_links?.twitter && (
                    <a
                      href={`https://twitter.com/${profile.social_links.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                  {profile.social_links?.youtube && (
                    <a
                      href={`https://youtube.com/${profile.social_links.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 transition-colors"
                    >
                      <Youtube className="w-4 h-4" />
                      YouTube
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="relative bg-[#1a1a1a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Profile</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Display Name</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={4}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                  placeholder="Tell your story..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-white/70 mb-3">Social Links</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Instagram className="w-5 h-5 text-white/50" />
                    <input
                      type="text"
                      value={editForm.instagram}
                      onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                      className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                      placeholder="Instagram username"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Twitter className="w-5 h-5 text-white/50" />
                    <input
                      type="text"
                      value={editForm.twitter}
                      onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                      className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                      placeholder="Twitter username"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Youtube className="w-5 h-5 text-white/50" />
                    <input
                      type="text"
                      value={editForm.youtube}
                      onChange={(e) => setEditForm({ ...editForm, youtube: e.target.value })}
                      className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                      placeholder="YouTube channel"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 p-4 flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-full text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                className="px-6 py-2.5 rounded-full bg-green-500 text-black font-semibold hover:bg-green-400 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default ProducerProfileView;
