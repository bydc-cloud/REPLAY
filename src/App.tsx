import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { PlayerBar } from "./components/PlayerBar";
import { HomeView } from "./components/HomeView";
import { SearchView } from "./components/SearchView";
import { LibraryView } from "./components/LibraryView";
import { AlbumsView } from "./components/AlbumsView";
import { ArtistsView } from "./components/ArtistsView";
import { QueueView } from "./components/QueueView";
import { AlbumArtBackground } from "./components/AlbumArtBackground";
import { QueueDrawer } from "./components/QueueDrawer";
import { SettingsView } from "./components/SettingsView";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { GlobalSearchBar } from "./components/GlobalSearchBar";
import { PostgresAuthProvider, useAuth } from "./contexts/PostgresAuthContext";
import { MusicLibraryProvider } from "./contexts/MusicLibraryContext";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";

type AppView = "landing" | "auth" | "app";
type AuthMode = "signin" | "signup";

function AppContent() {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const { visualizerVariant, setVisualizerVariant } = useSettings();
  const { isAuthenticated, isLoading } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && currentView !== "app") {
      setCurrentView("app");
    }
  }, [isAuthenticated, currentView]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--replay-black)] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  if (!isAuthenticated && currentView === "landing") {
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
      />
    );
  }

  // Auth page
  if (!isAuthenticated && currentView === "auth") {
    return (
      <AuthPage
        onBack={() => setCurrentView("landing")}
        initialMode={authMode}
      />
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case "home":
        return <HomeView />;
      case "search":
        return <SearchView />;
      case "library":
        return <LibraryView />;
      case "liked":
        return <LibraryView />;
      case "albums":
        return <AlbumsView />;
      case "artists":
        return <ArtistsView />;
      case "queue":
        return <QueueView />;
      case "settings":
        return (
          <SettingsView 
            selectedVisualizer={visualizerVariant}
            onVisualizerChange={setVisualizerVariant}
          />
        );
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
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32 md:pb-28 pt-16 md:pt-0 relative" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Desktop Header with Search */}
        <div className="hidden md:block sticky top-0 z-30 bg-gradient-to-b from-[#0a0a0a]/95 via-[#1a1a1a]/95 to-transparent backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-end">
            <GlobalSearchBar onNavigate={setActiveTab} />
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-[var(--replay-off-white)] flex-shrink-0"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Glassmorphism circle background */}
                    <circle 
                      cx="16" 
                      cy="16" 
                      r="15" 
                      fill="url(#mobile-logo-gradient)"
                      fillOpacity="0.1"
                    />
                    {/* Outer glow ring */}
                    <circle 
                      cx="16" 
                      cy="16" 
                      r="14" 
                      stroke="url(#mobile-logo-stroke)" 
                      strokeWidth="1.5"
                      strokeOpacity="0.8"
                    />
                    {/* Play icon with gradient */}
                    <path
                      d="M21 16l-7-4.5v9z"
                      fill="url(#mobile-play-gradient)"
                    />
                    <defs>
                      <linearGradient id="mobile-logo-gradient" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stopColor="#e8e8e8" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#e8e8e8" stopOpacity="0.05" />
                      </linearGradient>
                      <linearGradient id="mobile-logo-stroke" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stopColor="#e8e8e8" />
                        <stop offset="100%" stopColor="#999999" />
                      </linearGradient>
                      <linearGradient id="mobile-play-gradient" x1="14" y1="11.5" x2="21" y2="20.5">
                        <stop offset="0%" stopColor="#e8e8e8" />
                        <stop offset="100%" stopColor="#cccccc" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h1 className="text-lg font-black tracking-tight text-[var(--replay-off-white)]">
                  REPLAY
                </h1>
              </div>
              {/* Mobile Search Bar - Inline */}
              <div className="flex-1 min-w-0">
                <GlobalSearchBar onNavigate={setActiveTab} />
              </div>
            </div>
          </div>
        </div>

        {/* View Content */}
        {renderView()}
      </main>

      {/* Player Bar */}
      <PlayerBar onQueueClick={() => setQueueDrawerOpen(true)} />

      {/* Queue Drawer */}
      <QueueDrawer isOpen={queueDrawerOpen} onClose={() => setQueueDrawerOpen(false)} />
    </div>
  );
}

// Wrapper that provides AudioPlayer context (needs MusicLibrary)
function AppWithAudioPlayer() {
  return (
    <AudioPlayerProvider>
      <AppContent />
    </AudioPlayerProvider>
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
      <PostgresAuthProvider>
        <AppWithMusicLibrary />
      </PostgresAuthProvider>
    </SettingsProvider>
  );
}