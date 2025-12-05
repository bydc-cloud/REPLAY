import { useState, useEffect, useCallback } from 'react';

// Route patterns for Rhythm
export type RoutePattern =
  | { type: 'home' }
  | { type: 'feed' }
  | { type: 'search' }
  | { type: 'library' }
  | { type: 'liked' }
  | { type: 'albums' }
  | { type: 'queue' }
  | { type: 'settings' }
  | { type: 'marketplace' }
  | { type: 'messages' }
  | { type: 'producer-dashboard' }
  | { type: 'track'; id: string }
  | { type: 'playlist'; id: string }
  | { type: 'producer'; id: string }
  | { type: 'pack'; id: string }
  | { type: 'unknown'; path: string };

interface UseHashRouterReturn {
  hash: string;
  route: RoutePattern;
  navigate: (path: string) => void;
  getTabFromRoute: () => string;
}

// Parse hash into route pattern
function parseRoute(hash: string): RoutePattern {
  // Remove leading #/ or #
  const path = hash.replace(/^#\/?/, '');

  if (!path || path === '/') {
    return { type: 'home' };
  }

  // Simple routes
  const simpleRoutes = [
    'feed', 'search', 'library', 'liked', 'albums',
    'queue', 'settings', 'marketplace', 'messages', 'producer-dashboard'
  ] as const;

  for (const route of simpleRoutes) {
    if (path === route) {
      return { type: route };
    }
  }

  // Parameterized routes
  const trackMatch = path.match(/^track\/([a-zA-Z0-9-]+)$/);
  if (trackMatch) {
    return { type: 'track', id: trackMatch[1] };
  }

  const playlistMatch = path.match(/^playlist\/([a-zA-Z0-9-]+)$/);
  if (playlistMatch) {
    return { type: 'playlist', id: playlistMatch[1] };
  }

  const producerMatch = path.match(/^producer\/([a-zA-Z0-9-]+)$/);
  if (producerMatch) {
    return { type: 'producer', id: producerMatch[1] };
  }

  const packMatch = path.match(/^pack\/([a-zA-Z0-9-]+)$/);
  if (packMatch) {
    return { type: 'pack', id: packMatch[1] };
  }

  return { type: 'unknown', path };
}

// Map route to existing tab system
function routeToTab(route: RoutePattern): string {
  switch (route.type) {
    case 'home':
      return 'home';
    case 'feed':
      return 'feed';
    case 'search':
      return 'search';
    case 'library':
      return 'library';
    case 'liked':
      return 'liked';
    case 'albums':
      return 'albums';
    case 'queue':
      return 'queue';
    case 'settings':
      return 'settings';
    case 'marketplace':
      return 'marketplace';
    case 'messages':
      return 'messages';
    case 'producer-dashboard':
      return 'producer-dashboard';
    case 'track':
    case 'playlist':
    case 'producer':
    case 'pack':
      // These could open modals or specific views
      return 'home';
    case 'unknown':
    default:
      return 'home';
  }
}

export function useHashRouter(): UseHashRouterReturn {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    // Ensure path starts with #/
    const normalizedPath = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
    window.location.hash = normalizedPath;
  }, []);

  const route = parseRoute(hash);

  const getTabFromRoute = useCallback(() => {
    return routeToTab(route);
  }, [route]);

  return {
    hash,
    route,
    navigate,
    getTabFromRoute
  };
}

// Helper to generate shareable URLs
export function generateShareUrl(type: 'track' | 'playlist' | 'producer' | 'pack', id: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/#/${type}/${id}`;
}

// Helper to copy share URL to clipboard
export async function copyShareUrl(type: 'track' | 'playlist' | 'producer' | 'pack', id: string): Promise<boolean> {
  try {
    const url = generateShareUrl(type, id);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy URL:', err);
    return false;
  }
}

export default useHashRouter;
