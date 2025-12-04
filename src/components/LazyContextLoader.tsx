import React, { Suspense, lazy, ReactNode } from 'react';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

// Loading placeholder for lazy-loaded contexts
function ContextLoadingFallback({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Lazy load future social/marketplace contexts
// These will be created when we implement those features
const LazyFeedContext = lazy(() =>
  import('../contexts/FeedContext').then(module => ({
    default: module.FeedProvider
  })).catch(() => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>
  }))
);

const LazyMessagingContext = lazy(() =>
  import('../contexts/MessagingContext').then(module => ({
    default: module.MessagingProvider
  })).catch(() => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>
  }))
);

const LazySocialContext = lazy(() =>
  import('../contexts/SocialContext').then(module => ({
    default: module.SocialProvider
  })).catch(() => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>
  }))
);

interface LazyContextLoaderProps {
  children: ReactNode;
}

/**
 * LazyContextLoader - Conditionally loads contexts based on feature flags
 *
 * This component wraps children with context providers that are only loaded
 * when the corresponding feature flags are enabled. This improves initial
 * load time by not loading social/marketplace contexts for users who don't
 * have those features enabled.
 *
 * Pattern:
 * - Contexts are lazy loaded using React.lazy()
 * - If the context module doesn't exist yet, the import fails gracefully
 * - Feature flags determine which contexts to load
 */
export function LazyContextLoader({ children }: LazyContextLoaderProps) {
  const { flags, loading } = useFeatureFlags();

  // While flags are loading, just render children without extra contexts
  if (loading) {
    return <>{children}</>;
  }

  let content = children;

  // Wrap with feed context if enabled
  if (flags.feed_enabled) {
    content = (
      <Suspense fallback={<ContextLoadingFallback>{content}</ContextLoadingFallback>}>
        <LazyFeedContext>{content}</LazyFeedContext>
      </Suspense>
    );
  }

  // Wrap with messaging context if enabled
  if (flags.messaging_enabled) {
    content = (
      <Suspense fallback={<ContextLoadingFallback>{content}</ContextLoadingFallback>}>
        <LazyMessagingContext>{content}</LazyMessagingContext>
      </Suspense>
    );
  }

  // Wrap with social context if enabled
  if (flags.social_enabled) {
    content = (
      <Suspense fallback={<ContextLoadingFallback>{content}</ContextLoadingFallback>}>
        <LazySocialContext>{content}</LazySocialContext>
      </Suspense>
    );
  }

  return <>{content}</>;
}

export default LazyContextLoader;
