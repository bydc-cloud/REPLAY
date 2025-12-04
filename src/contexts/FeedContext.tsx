import React, { createContext, useContext, ReactNode } from 'react';

// Feed Context - Will be expanded in Phase 2 (Social Layer)
// For now, this is a stub that provides basic structure

interface FeedItem {
  id: string;
  type: 'track_upload' | 'track_like' | 'follow' | 'comment' | 'repost';
  userId: string;
  targetId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface FeedContextType {
  feed: FeedItem[];
  loading: boolean;
  error: string | null;
  refreshFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

const FeedContext = createContext<FeedContextType | null>(null);

interface FeedProviderProps {
  children: ReactNode;
}

export function FeedProvider({ children }: FeedProviderProps) {
  // Stub implementation - will be expanded in Phase 2
  const value: FeedContextType = {
    feed: [],
    loading: false,
    error: null,
    refreshFeed: async () => {
      // TODO: Implement in Phase 2
    },
    loadMore: async () => {
      // TODO: Implement in Phase 2
    },
    hasMore: false
  };

  return (
    <FeedContext.Provider value={value}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed(): FeedContextType {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
}

export default FeedContext;
