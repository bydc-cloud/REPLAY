import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/PostgresAuthContext';

// Feature flag types
export interface FeatureFlags {
  feed_enabled: boolean;
  marketplace_sell_enabled: boolean;
  social_enabled: boolean;
  messaging_enabled: boolean;
  producer_dashboard_enabled: boolean;
}

// Default flags (all disabled)
const DEFAULT_FLAGS: FeatureFlags = {
  feed_enabled: false,
  marketplace_sell_enabled: false,
  social_enabled: false,
  messaging_enabled: false,
  producer_dashboard_enabled: false
};

interface UseFeatureFlagsReturn {
  flags: FeatureFlags;
  loading: boolean;
  error: string | null;
  refreshFlags: () => Promise<void>;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://replay-production-9240.up.railway.app';

export function useFeatureFlags(): UseFeatureFlagsReturn {
  const { token, isAuthenticated } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setFlags(DEFAULT_FLAGS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/me/features`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }

      const data = await response.json();
      setFlags({ ...DEFAULT_FLAGS, ...data });
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
      // Use defaults on error
      setFlags(DEFAULT_FLAGS);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isEnabled = useCallback((flag: keyof FeatureFlags): boolean => {
    return flags[flag] === true;
  }, [flags]);

  return {
    flags,
    loading,
    error,
    refreshFlags: fetchFlags,
    isEnabled
  };
}

// Convenience hook for checking a single flag
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flag);
}

export default useFeatureFlags;
