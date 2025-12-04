import React, { createContext, useContext, ReactNode } from 'react';

// Social Context - Will be expanded in Phase 2 (Social Layer)
// Handles follows, likes, reposts, and social interactions

interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  tracksCount: number;
  isFollowing: boolean;
  isProducer: boolean;
}

interface SocialContextType {
  // Follow system
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  getFollowers: (userId: string) => Promise<UserProfile[]>;
  getFollowing: (userId: string) => Promise<UserProfile[]>;

  // Like system
  likeTrack: (trackId: string) => Promise<void>;
  unlikeTrack: (trackId: string) => Promise<void>;
  getLikedTracks: () => Promise<string[]>;

  // Repost system
  repostTrack: (trackId: string) => Promise<void>;
  unrepostTrack: (trackId: string) => Promise<void>;

  // Comments
  addComment: (trackId: string, content: string, parentId?: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  getComments: (trackId: string) => Promise<unknown[]>;

  // Profile
  getUserProfile: (userId: string) => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // State
  loading: boolean;
  error: string | null;
}

const SocialContext = createContext<SocialContextType | null>(null);

interface SocialProviderProps {
  children: ReactNode;
}

export function SocialProvider({ children }: SocialProviderProps) {
  // Stub implementation - will be expanded in Phase 2
  const value: SocialContextType = {
    followUser: async () => {
      // TODO: Implement in Phase 2
    },
    unfollowUser: async () => {
      // TODO: Implement in Phase 2
    },
    getFollowers: async () => {
      // TODO: Implement in Phase 2
      return [];
    },
    getFollowing: async () => {
      // TODO: Implement in Phase 2
      return [];
    },
    likeTrack: async () => {
      // TODO: Implement in Phase 2
    },
    unlikeTrack: async () => {
      // TODO: Implement in Phase 2
    },
    getLikedTracks: async () => {
      // TODO: Implement in Phase 2
      return [];
    },
    repostTrack: async () => {
      // TODO: Implement in Phase 2
    },
    unrepostTrack: async () => {
      // TODO: Implement in Phase 2
    },
    addComment: async () => {
      // TODO: Implement in Phase 2
    },
    deleteComment: async () => {
      // TODO: Implement in Phase 2
    },
    getComments: async () => {
      // TODO: Implement in Phase 2
      return [];
    },
    getUserProfile: async () => {
      // TODO: Implement in Phase 2
      return null;
    },
    updateProfile: async () => {
      // TODO: Implement in Phase 2
    },
    loading: false,
    error: null
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
