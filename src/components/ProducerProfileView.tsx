import { useState, useEffect, useCallback, useContext } from 'react';
import {
  Music, Package, Heart, Play, Pause, Share2, MoreHorizontal,
  Instagram, Twitter, Youtube, Globe, Loader2, UserPlus, UserMinus,
  MessageCircle, Shuffle, Edit2, Camera, Check, X, ListMusic, Clock,
  TrendingUp, Calendar, MapPin, Verified, PlayCircle, Repeat2, User
} from 'lucide-react';

// Instagram-style silhouette avatar (head + shoulders)
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
  const [likedTracks, setLikedTracks] = useState<ProducerTrack[]>([]);
  const [packs, setPacks] = useState<ProducerPack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'popular' | 'tracks' | 'likes' | 'packs' | 'playlists' | 'about'>('popular');
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
  const [showFollowersModal, setShowFollowersModal] = useState<'followers' | 'following' | null>(null);
  const [followersList, setFollowersList] = useState<Array<{ id: string; username: string; display_name?: string; avatar_url?: string; is_following?: boolean }>>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

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
      } else {
        // If producer profile not found, try to get basic user info and create a minimal profile
        console.log('Producer profile not found, trying user endpoint...');
        try {
          // Try to get user info from tracks or create minimal profile
          const tracksResponse = await fetch(`${API_URL}/api/discover/tracks?limit=100`);
          if (tracksResponse.ok) {
            const tracks = await tracksResponse.json();
            const userTrack = tracks.find((t: any) => t.user_id === targetUserId);
            if (userTrack) {
              // Create a minimal profile from track data
              setProfile({
                user_id: targetUserId,
                username: userTrack.artist || targetUserId.slice(0, 8),
                display_name: userTrack.artist,
                bio: '',
                avatar_url: userTrack.cover_url || '',
                banner_url: '',
                is_verified: false,
                is_producer: true,
                followers_count: 0,
                following_count: 0,
                tracks_count: tracks.filter((t: any) => t.user_id === targetUserId).length,
              });
              return;
            }
          }
        } catch (e) {
          console.error('Failed to fetch user from tracks:', e);
        }

        // Last resort: create a placeholder profile
        setProfile({
          user_id: targetUserId,
          username: targetUserId.slice(0, 8),
          display_name: 'User',
          bio: '',
          avatar_url: '',
          banner_url: '',
          is_verified: false,
          is_producer: false,
          followers_count: 0,
          following_count: 0,
          tracks_count: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // On error, still show a basic profile
      setProfile({
        user_id: targetUserId,
        username: targetUserId.slice(0, 8),
        display_name: 'User',
        bio: '',
        avatar_url: '',
        banner_url: '',
        is_verified: false,
        is_producer: false,
        followers_count: 0,
        following_count: 0,
        tracks_count: 0,
      });
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

  const fetchLikedTracks = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const response = await fetch(`${API_URL}/api/users/${targetUserId}/liked-tracks`);
      if (response.ok) {
        const data = await response.json();
        setLikedTracks(data);
      }
    } catch (err) {
      console.error('Failed to fetch liked tracks:', err);
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

  const fetchFollowersList = useCallback(async (type: 'followers' | 'following') => {
    if (!targetUserId) return;
    setFollowersLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/${targetUserId}/${type}`);
      if (response.ok) {
        const list = await response.json();
        // If user is logged in, check which ones they're following
        if (token && user?.id) {
          const myFollowingRes = await fetch(`${API_URL}/api/users/${user.id}/following`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (myFollowingRes.ok) {
            const myFollowing = await myFollowingRes.json();
            const myFollowingIds = new Set(myFollowing.map((f: { id: string }) => f.id));
            const enrichedList = list.map((u: { id: string }) => ({
              ...u,
              is_following: myFollowingIds.has(u.id)
            }));
            setFollowersList(enrichedList);
          } else {
            setFollowersList(list);
          }
        } else {
          setFollowersList(list);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
    } finally {
      setFollowersLoading(false);
    }
  }, [targetUserId, token, user?.id]);

  const handleOpenFollowersModal = (type: 'followers' | 'following') => {
    setShowFollowersModal(type);
    fetchFollowersList(type);
  };

  const handleFollowFromList = async (userId: string, currentlyFollowing: boolean) => {
    if (!token) return;
    try {
      if (currentlyFollowing) {
        await fetch(`${API_URL}/api/users/${userId}/follow`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await fetch(`${API_URL}/api/users/${userId}/follow`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      // Update the list
      setFollowersList(prev => prev.map(u =>
        u.id === userId ? { ...u, is_following: !currentlyFollowing } : u
      ));
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchTracks(), fetchPacks(), fetchLikedTracks(), checkFollowing()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProfile, fetchTracks, fetchPacks, fetchLikedTracks, checkFollowing]);

  const handleImageUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!token) {
      console.error('No auth token available');
      alert('Please log in to update your profile picture');
      return;
    }

    console.log(`Starting ${type} upload:`, file.name, file.type, file.size);

    if (type === 'avatar') setAvatarUploading(true);
    else setBannerUploading(true);

    try {
      // Convert file to base64 for more reliable upload
      const reader = new FileReader();

      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        alert('Failed to read the image file. Please try again.');
        if (type === 'avatar') setAvatarUploading(false);
        else setBannerUploading(false);
      };

      reader.onload = async () => {
        const base64Data = reader.result as string;
        console.log(`File read complete, uploading to ${API_URL}/api/me/profile-image`);

        try {
          const response = await fetch(`${API_URL}/api/me/profile-image?type=${type}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Data,
              filename: file.name,
              mimetype: file.type,
            }),
          });

          console.log('Upload response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('Upload successful:', data);
            // Update local profile state
            if (profile) {
              setProfile({
                ...profile,
                [type === 'avatar' ? 'avatar_url' : 'banner_url']: data.url
              });
            }
          } else {
            const errorText = await response.text();
            console.error('Upload failed:', response.status, errorText);
            alert(`Failed to upload ${type}: ${errorText || 'Unknown error'}`);
          }
        } catch (fetchErr) {
          console.error('Network error during upload:', fetchErr);
          alert('Network error. Please check your connection and try again.');
        }

        if (type === 'avatar') setAvatarUploading(false);
        else setBannerUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image upload error:', err);
      alert('An unexpected error occurred. Please try again.');
      if (type === 'avatar') setAvatarUploading(false);
      else setBannerUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;

    setSavingProfile(true);
    const payload = {
      display_name: editForm.display_name || null,
      bio: editForm.bio || null,
      location: editForm.location || null,
      website: editForm.website || null,
      social_links: {
        instagram: editForm.instagram || null,
        twitter: editForm.twitter || null,
        youtube: editForm.youtube || null,
      }
    };
    console.log('Saving profile with payload:', payload);

    try {
      const response = await fetch(`${API_URL}/api/me/producer-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Profile update response status:', response.status);

      if (response.ok) {
        const updated = await response.json();
        console.log('Profile update response:', updated);

        if (profile) {
          // Update profile with the new values, prioritizing form values for immediate feedback
          setProfile({
            ...profile,
            display_name: editForm.display_name || updated.display_name || profile.display_name,
            bio: editForm.bio || updated.bio,
            location: editForm.location || updated.location,
            website: editForm.website || updated.website,
            social_links: updated.social_links || {
              instagram: editForm.instagram,
              twitter: editForm.twitter,
              youtube: editForm.youtube,
            },
          });
        }
        setIsEditing(false);
        // Refetch profile to ensure sync with server
        fetchProfile();
      } else {
        const errorText = await response.text();
        console.error('Failed to update profile:', response.status, errorText);
        alert('Failed to save profile. Please try again.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setSavingProfile(false);
    }
  };

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
          text: `Check out ${profile?.display_name || profile?.username} on Rhythm`,
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

  // If no targetUserId (not logged in and no userId passed), show login prompt
  if (!targetUserId) {
    return (
      <div className="p-8 text-center">
        <User className="w-12 h-12 mx-auto text-white/20 mb-4" />
        <p className="text-white/60 mb-2">Please log in to view profiles</p>
        <button
          onClick={() => window.location.hash = '#/'}
          className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

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
    <div className="pb-8 md:pb-8">
      {/* Mobile Hero - Instagram/TikTok inspired compact design */}
      <div className="md:hidden">
        {/* Gradient Background with subtle animation */}
        <div className="relative h-36 overflow-hidden">
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-900/80 via-indigo-800/60 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        </div>

        {/* Mobile Profile Section - Centered like Instagram */}
        <div className="px-4 -mt-16 relative z-10">
          {/* Avatar - Centered with gradient ring */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-br from-violet-500 via-pink-500 to-indigo-500">
                <div className="w-full h-full rounded-full border-[3px] border-[#0a0a0a] overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name || profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
                      <SilhouetteAvatar className="w-12 h-12 text-zinc-500" />
                    </div>
                  )}
                </div>
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
              {isOwnProfile && (
                <label
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center cursor-pointer hover:bg-violet-400 active:scale-90 transition-all shadow-lg border-2 border-[#0a0a0a]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log('Avatar file selected:', file.name, file.type, file.size);
                        handleImageUpload(file, 'avatar');
                      }
                      // Reset input to allow re-selecting the same file
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Name & Verification - Centered */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h1 className="text-xl font-black text-white">
                {profile.display_name || profile.username}
              </h1>
              {profile.is_verified && (
                <Verified className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <p className="text-white/50 text-sm">@{profile.username}</p>
          </div>

          {/* Stats Row - Instagram style */}
          <div className="flex items-center justify-center gap-8 mb-4">
            <button
              onClick={() => handleOpenFollowersModal('followers')}
              className="text-center active:scale-95 transition-transform"
            >
              <div className="text-lg font-bold text-white">{formatNumber(profile.followers_count)}</div>
              <div className="text-xs text-white/50">Followers</div>
            </button>
            <button
              onClick={() => handleOpenFollowersModal('following')}
              className="text-center active:scale-95 transition-transform"
            >
              <div className="text-lg font-bold text-white">{formatNumber(profile.following_count)}</div>
              <div className="text-xs text-white/50">Following</div>
            </button>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{formatNumber(profile.tracks_count)}</div>
              <div className="text-xs text-white/50">Tracks</div>
            </div>
          </div>

          {/* Bio - Compact */}
          {profile.bio && (
            <p className="text-white/70 text-sm text-center mb-4 line-clamp-2 px-4">
              {profile.bio}
            </p>
          )}

          {/* Action Buttons - Centered on mobile */}
          <div className="flex gap-2 mb-2 justify-center">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 max-w-[200px] py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleFollow}
                  className={`flex-1 max-w-[140px] py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all ${
                    isFollowing
                      ? 'bg-white/10 text-white'
                      : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleMessage}
                  disabled={messageLoading}
                  className="flex-1 max-w-[140px] py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  {messageLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  Message
                </button>
              </>
            )}
            <button
              onClick={handleShare}
              className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Play Controls Row - Centered on mobile */}
          <div className="flex gap-2 pt-2 justify-center">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="flex-1 max-w-[200px] py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-500/20"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Play All
            </button>
            <button
              onClick={handleShuffle}
              disabled={tracks.length === 0}
              className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Hero Banner - Spotify/Apple Music style with gradient overlay */}
      <div className="relative hidden md:block">
        {/* Banner Image */}
        <div className="h-80 lg:h-96 relative overflow-hidden">
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-900 via-indigo-800 to-zinc-900" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/40 to-transparent" />
        </div>

        {/* Profile Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-6">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-48 h-48 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-2xl">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <SilhouetteAvatar className="w-24 h-24 text-zinc-500" />
                  </div>
                )}
                {/* Upload overlay */}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <label className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20 cursor-pointer hover:bg-black/80">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'avatar');
                    }}
                  />
                </label>
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
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-2">
                {profile.display_name || profile.username}
              </h1>

              {/* Monthly Listeners - Spotify style */}
              <div className="flex items-center gap-4 text-white/70">
                <span className="text-base">
                  {formatNumber(profile.monthly_listeners || profile.followers_count * 10)} monthly listeners
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar - Desktop only (mobile has buttons above) */}
      <div className="hidden md:flex px-8 py-6 flex-wrap items-center gap-3">
        {/* Play Button - Large gradient circle with Rhythm branding */}
        <button
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 hover:scale-105 transition-all flex items-center justify-center shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
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

      {/* Stats Row - Desktop only (mobile has stats above) */}
      <div className="hidden md:flex px-8 py-4 items-center gap-8 border-b border-white/10">
        <button
          onClick={() => handleOpenFollowersModal('followers')}
          className="text-center hover:opacity-80 transition-opacity"
        >
          <div className="text-2xl font-bold text-white">{formatNumber(profile.followers_count)}</div>
          <div className="text-sm text-white/50">Followers</div>
        </button>
        <button
          onClick={() => handleOpenFollowersModal('following')}
          className="text-center hover:opacity-80 transition-opacity"
        >
          <div className="text-2xl font-bold text-white">{formatNumber(profile.following_count)}</div>
          <div className="text-sm text-white/50">Following</div>
        </button>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{formatNumber(profile.tracks_count)}</div>
          <div className="text-sm text-white/50">Tracks</div>
        </div>
        {profile.total_plays && (
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatNumber(profile.total_plays)}</div>
            <div className="text-sm text-white/50">Plays</div>
          </div>
        )}
      </div>

      {/* Navigation Tabs - Sticky on mobile */}
      <div className="sticky top-[68px] md:static z-20 bg-[#0a0a0a]/95 backdrop-blur-xl md:backdrop-blur-none px-4 md:px-8 pt-4 pb-2 md:pb-0 border-b border-white/5 md:border-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['popular', 'tracks', 'likes', 'packs', 'playlists', 'about'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/10 text-white/70 active:bg-white/20'
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
                      <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-violet-400' : 'text-white'}`}>
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
                      <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-violet-400' : 'text-white'}`}>
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

        {/* Liked Tracks */}
        {activeTab === 'likes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">Liked Tracks</h2>
              <span className="text-white/50 text-sm">{likedTracks.length} tracks</span>
            </div>
            <div className="space-y-1">
              {likedTracks.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer"
                    onClick={() => {
                      const queueTracks = likedTracks.map(t => ({
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
                        isLiked: true,
                        addedAt: new Date()
                      }));
                      setQueue(queueTracks as any[], index);
                    }}
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
                      <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-violet-400' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-sm text-white/50 truncate">{track.artist}</p>
                    </div>

                    <div className="flex items-center gap-4 text-white/50">
                      <span className="flex items-center gap-1 text-sm">
                        <Heart className="w-3.5 h-3.5 text-pink-500" fill="currentColor" />
                        {track.likes_count || 0}
                      </span>
                      <span className="text-sm w-12 text-right">{formatDuration(track.duration)}</span>
                    </div>
                  </div>
                );
              })}

              {likedTracks.length === 0 && (
                <div className="text-center py-16">
                  <Heart className="w-16 h-16 mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">No liked tracks yet</p>
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
                      <button className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg shadow-violet-500/30">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
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

      {/* Edit Profile Modal - Full screen on mobile for easy scrolling */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black md:bg-black/80 md:backdrop-blur-sm md:flex md:items-center md:justify-center">
          {/* Desktop backdrop click to close */}
          <div className="hidden md:block absolute inset-0" onClick={() => setIsEditing(false)} />

          {/* Modal Content - Full screen on mobile, centered card on desktop */}
          <div className="relative bg-[#0a0a0a] md:bg-[#1a1a1a] w-full h-full md:h-auto md:max-h-[85vh] md:max-w-lg md:mx-4 md:rounded-2xl flex flex-col overflow-hidden">
            {/* Fixed Header with gradient */}
            <div className="flex-shrink-0 bg-gradient-to-b from-violet-900/30 to-transparent border-b border-white/10 px-4 py-4 flex items-center justify-between z-10">
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
              <h3 className="text-lg font-bold text-white">Edit Profile</h3>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save
              </button>
            </div>

            {/* Scrollable Content - Full height scroll */}
            <div className="flex-1 overflow-y-auto pb-safe" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* Profile Picture Section - Centered hero style */}
              <div className="flex flex-col items-center py-8 px-4 bg-gradient-to-b from-violet-900/20 to-transparent">
                <div className="relative mb-4">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 p-[3px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0a0a]">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                          <SilhouetteAvatar className="w-14 h-14 text-zinc-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                  {/* Camera button overlay */}
                  <label
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center cursor-pointer hover:bg-violet-400 active:scale-90 transition-all shadow-lg border-2 border-[#0a0a0a]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          console.log('Edit modal avatar selected:', file.name, file.type, file.size);
                          handleImageUpload(file, 'avatar');
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        console.log('Profile photo button clicked, file:', file.name);
                        handleImageUpload(file, 'avatar');
                      }
                    };
                    input.click();
                  }}
                  className="text-violet-400 text-sm font-medium hover:text-violet-300 transition-colors active:scale-95"
                >
                  Change Photo
                </button>
              </div>

              {/* Form Fields */}
              <div className="px-4 space-y-5 pb-8">

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
            </div>
          </div>
        </div>
      )}

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowFollowersModal(null)} />
          <div className="relative bg-[#1a1a1a] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 p-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-white capitalize">{showFollowersModal}</h3>
              <button
                onClick={() => setShowFollowersModal(null)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
              {followersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                </div>
              ) : followersList.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-12 h-12 mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">
                    {showFollowersModal === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {followersList.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {person.avatar_url ? (
                          <img src={person.avatar_url} alt={person.username} className="w-full h-full object-cover" />
                        ) : (
                          <SilhouetteAvatar className="w-7 h-7 text-zinc-500" />
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate">
                          {person.display_name || person.username}
                        </h4>
                        <p className="text-sm text-white/50 truncate">@{person.username}</p>
                      </div>

                      {/* Follow Button */}
                      {isAuthenticated && person.id !== user?.id && (
                        <button
                          onClick={() => handleFollowFromList(person.id, person.is_following || false)}
                          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                            person.is_following
                              ? 'border border-white/30 text-white hover:border-white/60'
                              : 'bg-white text-black hover:bg-white/90'
                          }`}
                        >
                          {person.is_following ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
