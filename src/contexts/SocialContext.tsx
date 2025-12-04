import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './PostgresAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

// Social Context - Handles follows, likes, reposts, and social interactions

export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  followers_count: number;
  following_count: number;
  tracks_count: number;
  is_following?: boolean;
  is_producer: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  track_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  created_at: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  likes_count: number;
  replies_count: number;
  is_liked?: boolean;
  replies?: Comment[];
}

interface SocialContextType {
  // Follow system
  followUser: (userId: string) => Promise<boolean>;
  unfollowUser: (userId: string) => Promise<boolean>;
  getFollowers: (userId: string) => Promise<UserProfile[]>;
  getFollowing: (userId: string) => Promise<UserProfile[]>;
  checkIsFollowing: (userId: string) => Promise<boolean>;

  // Like system
  likeTrack: (trackId: string) => Promise<boolean>;
  unlikeTrack: (trackId: string) => Promise<boolean>;
  getLikedTracks: () => Promise<string[]>;
  isTrackLiked: (trackId: string) => boolean;

  // Repost system
  repostTrack: (trackId: string) => Promise<boolean>;
  unrepostTrack: (trackId: string) => Promise<boolean>;
  isTrackReposted: (trackId: string) => boolean;

  // Comments
  addComment: (trackId: string, content: string, parentId?: string) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<boolean>;
  getComments: (trackId: string) => Promise<Comment[]>;
  likeComment: (commentId: string) => Promise<boolean>;
  unlikeComment: (commentId: string) => Promise<boolean>;

  // Profile
  getUserProfile: (userId: string) => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;

  // State
  likedTrackIds: Set<string>;
  repostedTrackIds: Set<string>;
  loading: boolean;
  error: string | null;
}

const SocialContext = createContext<SocialContextType | null>(null);

interface SocialProviderProps {
  children: ReactNode;
}

export function SocialProvider({ children }: SocialProviderProps) {
  const { token, isAuthenticated } = useAuth();
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [repostedTrackIds, setRepostedTrackIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper for authenticated API calls
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Not authenticated');

    return fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }, [token]);

  // ============ FOLLOW SYSTEM ============

  const followUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await authFetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to follow user:', err);
      setError('Failed to follow user');
      return false;
    }
  }, [isAuthenticated, authFetch]);

  const unfollowUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await authFetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to unfollow user:', err);
      setError('Failed to unfollow user');
      return false;
    }
  }, [isAuthenticated, authFetch]);

  const getFollowers = useCallback(async (userId: string): Promise<UserProfile[]> => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/followers`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (err) {
      console.error('Failed to get followers:', err);
      return [];
    }
  }, []);

  const getFollowing = useCallback(async (userId: string): Promise<UserProfile[]> => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/users/${userId}/following`, {
        headers,
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (err) {
      console.error('Failed to get following:', err);
      return [];
    }
  }, [token]);

  const checkIsFollowing = useCallback(async (userId: string): Promise<boolean> => {
    if (!isAuthenticated || !token) return false;

    try {
      const response = await authFetch(`/api/users/${userId}/is-following`);
      if (response.ok) {
        const data = await response.json();
        return data.isFollowing;
      }
      return false;
    } catch (err) {
      console.error('Failed to check following status:', err);
      return false;
    }
  }, [isAuthenticated, token, authFetch]);

  // ============ LIKE SYSTEM ============

  const likeTrack = useCallback(async (trackId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await authFetch(`/api/tracks/${trackId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        setLikedTrackIds(prev => new Set(prev).add(trackId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to like track:', err);
      setError('Failed to like track');
      return false;
    }
  }, [isAuthenticated, authFetch]);

  const unlikeTrack = useCallback(async (trackId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await authFetch(`/api/tracks/${trackId}/like`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLikedTrackIds(prev => {
          const next = new Set(prev);
          next.delete(trackId);
          return next;
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to unlike track:', err);
      setError('Failed to unlike track');
      return false;
    }
  }, [isAuthenticated, authFetch]);

  const getLikedTracks = useCallback(async (): Promise<string[]> => {
    if (!isAuthenticated) return [];

    try {
      const response = await authFetch('/api/me/liked-tracks');
      if (response.ok) {
        const tracks = await response.json();
        const ids = tracks.map((t: { id: string }) => t.id);
        setLikedTrackIds(new Set(ids));
        return ids;
      }
      return [];
    } catch (err) {
      console.error('Failed to get liked tracks:', err);
      return [];
    }
  }, [isAuthenticated, authFetch]);

  const isTrackLiked = useCallback((trackId: string): boolean => {
    return likedTrackIds.has(trackId);
  }, [likedTrackIds]);

  // ============ REPOST SYSTEM ============

  const repostTrack = useCallback(async (trackId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await authFetch(`/api/tracks/${trackId}/repost`, {
        method: 'POST',
      });

      if (response.ok) {
        setRepostedTrackIds(prev => new Set(prev).add(trackId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to repost track:', err);
      setError('Failed to repost track');
      return false;
    }
  }, [isAuthenticated, authFetch]);

  const unrepostTrack = useCallback(async (trackId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await authFetch(`/api/tracks/${trackId}/repost`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRepostedTrackIds(prev => {
          const next = new Set(prev);
          next.delete(trackId);
          return next;
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to unrepost track:', err);
      setError('Failed to unrepost track');
      return false;
    }
  }, [isAuthenticated, authFetch]);

  const isTrackReposted = useCallback((trackId: string): boolean => {
    return repostedTrackIds.has(trackId);
  }, [repostedTrackIds]);

  // ============ COMMENTS ============

  const addComment = useCallback(async (trackId: string, content: string, parentId?: string): Promise<Comment | null> => {
    if (!isAuthenticated) return null;

    try {
      const response = await authFetch(`/api/tracks/${trackId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parent_id: parentId }),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment');
      return null;
    }
  }, [isAuthenticated, authFetch]);

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await authFetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment');
      return false;
    }
  }, [isAuthenticated, authFetch]);

  const getComments = useCallback(async (trackId: string): Promise<Comment[]> => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/tracks/${trackId}/comments`, {
        headers,
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (err) {
      console.error('Failed to get comments:', err);
      return [];
    }
  }, [token]);

  const likeComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await authFetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to like comment:', err);
      return false;
    }
  }, [isAuthenticated, authFetch]);

  const unlikeComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await authFetch(`/api/comments/${commentId}/like`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to unlike comment:', err);
      return false;
    }
  }, [isAuthenticated, authFetch]);

  // ============ PROFILE ============

  const getUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/producers/${userId}`, {
        headers,
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Failed to get user profile:', err);
      return null;
    }
  }, [token]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!isAuthenticated) return false;

    setLoading(true);
    try {
      const response = await authFetch('/api/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      setLoading(false);
      return response.ok;
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
      setLoading(false);
      return false;
    }
  }, [isAuthenticated, authFetch]);

  const value: SocialContextType = {
    // Follow
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkIsFollowing,

    // Likes
    likeTrack,
    unlikeTrack,
    getLikedTracks,
    isTrackLiked,

    // Reposts
    repostTrack,
    unrepostTrack,
    isTrackReposted,

    // Comments
    addComment,
    deleteComment,
    getComments,
    likeComment,
    unlikeComment,

    // Profile
    getUserProfile,
    updateProfile,

    // State
    likedTrackIds,
    repostedTrackIds,
    loading,
    error,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial(): SocialContextType {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}

export default SocialContext;
