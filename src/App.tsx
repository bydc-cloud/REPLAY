import { Menu, Disc } from "lucide-react";
import { useState, useEffect, useCallback, useContext } from "react";
import { Sidebar } from "./components/Sidebar";
import { PlayerBar } from "./components/PlayerBar";
import { HomeView } from "./components/HomeView";
import { SearchView } from "./components/SearchView";
import { LibraryView } from "./components/LibraryView";
import { AlbumsView } from "./components/AlbumsView";
import { QueueView } from "./components/QueueView";
import { AlbumArtBackground } from "./components/AlbumArtBackground";
import { QueueDrawer } from "./components/QueueDrawer";
import { SettingsView } from "./components/SettingsView";
import { MarketplaceView } from "./components/MarketplaceView";
import { FeedView } from "./components/FeedView";
import { MessagesView } from "./components/MessagesView";
import { ProducerProfileView } from "./components/ProducerProfileView";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { PostgresAuthProvider, useAuth } from "./contexts/PostgresAuthContext";
import { MusicLibraryProvider } from "./contexts/MusicLibraryContext";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { AudioEffectsProvider } from "./contexts/AudioEffectsContext";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { DragDropOverlay } from "./components/DragDropOverlay";
import { MiniPlayer } from "./components/MiniPlayer";
import { ToastProvider } from "./contexts/ToastContext";
import { ToastContainer } from "./components/ToastContainer";
import { GlobalImportProgress } from "./components/GlobalImportProgress";
import { useHashRouter } from "./hooks/useHashRouter";
import { LazyContextLoader } from "./components/LazyContextLoader";
import { TrackUploadModal } from "./components/TrackUploadModal";
import { NotificationsView } from "./components/NotificationsView";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { DevDashboard } from "./components/DevDashboard";
import NotificationsContext from "./contexts/NotificationsContext";
import MessagingContext from "./contexts/MessagingContext";

// Safe hooks for lazy-loaded contexts - return defaults if context not available
function useSafeNotifications() {
  const context = useContext(NotificationsContext);
  return context || { unreadCount: 0 };
}

function useSafeMessaging() {
  const context = useContext(MessagingContext);
  return context || { unreadTotal: 0 };
}

type AppView = "landing" | "auth" | "app" | "about";
type AuthMode = "signin" | "signup";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [miniPlayerOpen, setMiniPlayerOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { visualizerVariant, setVisualizerVariant } = useSettings();
  const { isAuthenticated, isLoading } = useAuth();

  // Safe access to notification and message counts
  const { unreadCount: notificationCount } = useSafeNotifications();
  const { unreadTotal: messageCount } = useSafeMessaging();

  // Hash-based routing for shareable URLs
  const { route, navigate, getTabFromRoute } = useHashRouter();
  const activeTab = getTabFromRoute();

  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  // Navigate to tab via hash
  const setActiveTab = useCallback((tab: string) => {
    navigate(tab);
  }, [navigate]);

  // Handle authentication state changes
  useEffect(() => {
    // Only auto-switch to app if user just logged in (not if viewing about page)
    if (isAuthenticated && currentView !== "app" && currentView !== "about") {
      setCurrentView("app");
    }
  }, [isAuthenticated, currentView]);

  const producerRouteId = route.type === 'producer' ? route.id : undefined;

  // Redirect logged-in users to Discovery (feed) as default landing page
  useEffect(() => {
    if (isAuthenticated && currentView === "app") {
      // If on home or empty route, redirect to feed (Discovery)
      const hash = window.location.hash;
      if (!hash || hash === '#/' || hash === '#/home' || hash === '') {
        navigate('feed');
      }
    }
  }, [isAuthenticated, currentView, navigate]);

  // Ensure producer profile routes render the app shell instead of blank
  useEffect(() => {
    if (route.type === 'producer') {
      setCurrentView('app');
    }
  }, [route]);

  // Always render the app shell when navigating directly to a producer profile (prevents blank screen)
  useEffect(() => {
    if (route.type === 'producer' && currentView !== 'app') {
      setCurrentView('app');
    }
  }, [route, currentView]);

  // Show loading state with modern music-themed animation
  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--replay-black)] items-center justify-center">
        <div className="text-center">
          {/* Audio bars animation */}
          <div className="flex items-end justify-center gap-1 h-16 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 rounded-full"
                style={{
                  background: `linear-gradient(to top, hsl(${260 + i * 20}, 80%, 50%), hsl(${280 + i * 20}, 90%, 65%))`,
                  height: '100%',
                  animation: `audioLoading 1s ease-in-out ${i * 0.1}s infinite`,
                  boxShadow: `0 0 10px hsla(${270 + i * 15}, 80%, 60%, 0.5)`,
                }}
              />
            ))}
          </div>
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-sm flex items-center justify-center border border-purple-500/30">
              <Disc className="w-5 h-5 text-[var(--replay-off-white)]" />
            </div>
            <span className="text-xl font-black tracking-tight text-[var(--replay-off-white)]">
              Rhythm
            </span>
          </div>
          <p className="text-white/40 text-sm">Loading your music...</p>
        </div>
        <style>{`
          @keyframes audioLoading {
            0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
            50% { transform: scaleY(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Landing page for unauthenticated users (unless viewing a producer profile) OR when viewing about page
  // Allow unauthenticated users to view producer profiles publicly
  const isViewingProducerProfile = route.type === 'producer';

  if ((!isAuthenticated && currentView === "landing" && !isViewingProducerProfile) || currentView === "about") {
    return (
      <LandingPage
        onGetStarted={() => {
          setAuthMode("signup");
          setCurrentView("auth");
        }}
        onSignIn={() => {
          setAuthMode("signin");
          setCurrentView("auth");
        }}
        onBackToApp={isAuthenticated ? () => setCurrentView("app") : undefined}
        showBackButton={currentView === "about" && isAuthenticated}
      />
    );
  }

  // Auth page
  if (!isAuthenticated && currentView === "auth" && !isViewingProducerProfile) {
    return (
      <AuthPage
        onBack={() => setCurrentView("landing")}
        initialMode={authMode}
      />
    );
  }

  const renderView = () => {
    // Handle producer profile routes like /producer/user-id
    if (activeTab.startsWith('producer/')) {
      const userId = activeTab.replace('producer/', '');
      return <ProducerProfileView userId={userId} onBack={() => setActiveTab('feed')} />;
    }

    switch (activeTab) {
      case "home":
        return <HomeView onTabChange={setActiveTab} />;
      case "feed":
        return <FeedView />;
      case "search":
        return <SearchView />;
      case "library":
        return <LibraryView />;
      case "liked":
        return <LibraryView showLikedOnly={true} />;
      case "albums":
        return <AlbumsView />;
      case "queue":
        return <QueueView />;
      case "messages":
        return <MessagesView />;
      case "profile":
        return <ProducerProfileView onBack={() => setActiveTab('home')} />;
      case "settings":
        return (
          <SettingsView
            selectedVisualizer={visualizerVariant}
            onVisualizerChange={setVisualizerVariant}
          />
        );
      case "marketplace":
        return <MarketplaceView />;
      case "notifications":
        return <NotificationsView />;
      case "dev-dashboard":
        return <DevDashboard />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex h-screen bg-[var(--replay-black)] relative">
      {/* Animated Background */}
      <AlbumArtBackground imageUrl="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=1200&fit=crop" />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAboutClick={() => setCurrentView("about")}
        onUploadClick={() => setUploadModalOpen(true)}
        onDashboardClick={() => setDashboardOpen(true)}
        notificationCount={notificationCount}
        messageCount={messageCount}
      />

      {/* Main Content Area - adjusted for mobile bottom nav */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden ${activeTab === 'feed' ? 'pb-[72px] md:pb-0' : 'pb-[140px] md:pb-28'} pt-[68px] md:pt-0 relative scroll-smooth`} style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>

        {/* Mobile Header - Glass Effect */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0a0a0a]/90 via-[#111111]/85 to-[#1a1a1a]/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-[var(--replay-off-white)] flex-shrink-0"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-sm flex items-center justify-center border border-purple-500/30">
                  <Disc className="w-4 h-4 text-[var(--replay-off-white)]" />
                </div>
                <h1 className="text-lg font-black tracking-tight text-[var(--replay-off-white)]">
                  Rhythm
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* View Content */}
        {renderView()}
      </main>

      {/* Player Bar - hidden on Discovery feed, positioned above bottom nav on mobile */}
      {activeTab !== 'feed' && (
        <div className="md:block hidden">
          <PlayerBar
            onQueueClick={() => setQueueDrawerOpen(true)}
            onMiniPlayerToggle={() => setMiniPlayerOpen(true)}
          />
        </div>
      )}
      {/* Mobile: Player bar above bottom nav */}
      {activeTab !== 'feed' && (
        <div className="md:hidden fixed bottom-[72px] left-0 right-0 z-40">
          <PlayerBar
            onQueueClick={() => setQueueDrawerOpen(true)}
            onMiniPlayerToggle={() => setMiniPlayerOpen(true)}
          />
        </div>
      )}

      {/* Mobile Bottom Navigation - shown on all pages, hidden when mini player is open */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isHidden={miniPlayerOpen}
      />

      {/* Queue Drawer */}
      <QueueDrawer isOpen={queueDrawerOpen} onClose={() => setQueueDrawerOpen(false)} />

      {/* Mini Player */}
      <MiniPlayer
        isOpen={miniPlayerOpen}
        onClose={() => setMiniPlayerOpen(false)}
        onExpand={() => setMiniPlayerOpen(false)}
      />

      {/* Track Upload Modal */}
      <TrackUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      {/* Analytics Dashboard Modal */}
      <AnalyticsDashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
      />
    </div>
  );
}

// Wrapper that provides AudioPlayer context (needs MusicLibrary)
function AppWithAudioPlayer() {
  return (
    <AudioEffectsProvider>
      <AudioPlayerProvider>
        <LazyContextLoader>
          <DragDropOverlay>
            <GlobalImportProgress />
            <AppContent />
          </DragDropOverlay>
        </LazyContextLoader>
      </AudioPlayerProvider>
    </AudioEffectsProvider>
  );
}

// Wrapper that provides MusicLibrary context (needs Auth)
function AppWithMusicLibrary() {
  return (
    <MusicLibraryProvider>
      <AppWithAudioPlayer />
    </MusicLibraryProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <PostgresAuthProvider>
          <AppWithMusicLibrary />
          <ToastContainer />
        </PostgresAuthProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
