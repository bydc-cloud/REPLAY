import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './PostgresAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

// Feed Context - Manages discover feed and following feed with pagination

export interface FeedTrack {
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
  plays_count: number;
  is_liked?: boolean;
  is_reposted?: boolean;
  created_at: string;
}

export interface FeedEvent {
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

interface FeedContextType {
  // Discover (public tracks)
  discoverTracks: FeedTrack[];
  discoverLoading: boolean;
  discoverError: string | null;
  refreshDiscover: () => Promise<void>;
  loadMoreDiscover: () => Promise<void>;
  hasMoreDiscover: boolean;

  // Following feed (activity from followed users)
  feedEvents: FeedEvent[];
  feedLoading: boolean;
  feedError: string | null;
  refreshFeed: () => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  hasMoreFeed: boolean;

  // Trending
  trendingTracks: FeedTrack[];
  loadTrending: () => Promise<void>;

  // Search
  searchTracks: (query: string) => Promise<FeedTrack[]>;
  searchUsers: (query: string) => Promise<unknown[]>;
}

const FeedContext = createContext<FeedContextType | null>(null);

interface FeedProviderProps {
  children: ReactNode;
}

const PAGE_SIZE = 20;

export function FeedProvider({ children }: FeedProviderProps) {
  const { token, isAuthenticated } = useAuth();

  // Discover state
  const [discoverTracks, setDiscoverTracks] = useState<FeedTrack[]>([]);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [hasMoreDiscover, setHasMoreDiscover] = useState(true);

  // Feed state
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);

  // Trending state
  const [trendingTracks, setTrendingTracks] = useState<FeedTrack[]>([]);

  // ============ DISCOVER ============

  const fetchDiscover = useCallback(async (page: number, append: boolean = false) => {
    setDiscoverLoading(true);
    setDiscoverError(null);

    try {
      const offset = (page - 1) * PAGE_SIZE;
      const response = await fetch(
        `${API_URL}/api/discover/tracks?limit=${PAGE_SIZE}&offset=${offset}`
      );

      if (response.ok) {
        const tracks = await response.json();

        if (append) {
          setDiscoverTracks(prev => [...prev, ...tracks]);
        } else {
          setDiscoverTracks(tracks);
        }

        setHasMoreDiscover(tracks.length === PAGE_SIZE);
        setDiscoverPage(page);
      } else {
        setDiscoverError('Failed to load tracks');
      }
    } catch (err) {
      console.error('Failed to fetch discover tracks:', err);
      setDiscoverError('Failed to load tracks');
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  const refreshDiscover = useCallback(async () => {
    await fetchDiscover(1, false);
  }, [fetchDiscover]);

  const loadMoreDiscover = useCallback(async () => {
    if (discoverLoading || !hasMoreDiscover) return;
    await fetchDiscover(discoverPage + 1, true);
  }, [discoverLoading, hasMoreDiscover, discoverPage, fetchDiscover]);

  // ============ FOLLOWING FEED ============

  const fetchFeed = useCallback(async (page: number, append: boolean = false) => {
    if (!token || !isAuthenticated) return;

    setFeedLoading(true);
    setFeedError(null);

    try {
      const offset = (page - 1) * PAGE_SIZE;
      const response = await fetch(
        `${API_URL}/api/feed?limit=${PAGE_SIZE}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const events = await response.json();

        if (append) {
          setFeedEvents(prev => [...prev, ...events]);
        } else {
          setFeedEvents(events);
        }

        setHasMoreFeed(events.length === PAGE_SIZE);
        setFeedPage(page);
      } else {
        setFeedError('Failed to load feed');
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setFeedError('Failed to load feed');
    } finally {
      setFeedLoading(false);
    }
  }, [token, isAuthenticated]);

  const refreshFeed = useCallback(async () => {
    await fetchFeed(1, false);
  }, [fetchFeed]);

  const loadMoreFeed = useCallback(async () => {
    if (feedLoading || !hasMoreFeed) return;
    await fetchFeed(feedPage + 1, true);
  }, [feedLoading, hasMoreFeed, feedPage, fetchFeed]);

  // ============ TRENDING ============

  const loadTrending = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/discover/trending?limit=10`);
      if (response.ok) {
        const tracks = await response.json();
        setTrendingTracks(tracks);
      }
    } catch (err) {
      console.error('Failed to fetch trending:', err);
    }
  }, []);

  // ============ SEARCH ============

  const searchTracks = useCallback(async (query: string): Promise<FeedTrack[]> => {
    if (!query.trim()) return [];

    try {
      const response = await fetch(
        `${API_URL}/api/search/tracks?q=${encodeURIComponent(query)}&limit=20`
      );
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (err) {
      console.error('Failed to search tracks:', err);
      return [];
    }
  }, []);

  const searchUsers = useCallback(async (query: string): Promise<unknown[]> => {
    if (!query.trim()) return [];

    try {
      const response = await fetch(
        `${API_URL}/api/search/users?q=${encodeURIComponent(query)}&limit=20`
      );
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (err) {
      console.error('Failed to search users:', err);
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshDiscover();
    if (isAuthenticated) {
      refreshFeed();
    }
  }, [isAuthenticated]);

  const value: FeedContextType = {
    // Discover
    discoverTracks,
    discoverLoading,
    discoverError,
    refreshDiscover,
    loadMoreDiscover,
    hasMoreDiscover,

    // Feed
    feedEvents,
    feedLoading,
    feedError,
    refreshFeed,
    loadMoreFeed,
    hasMoreFeed,

    // Trending
    trendingTracks,
    loadTrending,

    // Search
    searchTracks,
    searchUsers,
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
