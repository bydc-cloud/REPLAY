import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
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
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { PostgresAuthProvider, useAuth } from "./contexts/PostgresAuthContext";
import { MusicLibraryProvider } from "./contexts/MusicLibraryContext";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { DragDropOverlay } from "./components/DragDropOverlay";
import { MiniPlayer } from "./components/MiniPlayer";

type AppView = "landing" | "auth" | "app" | "about";
type AuthMode = "signin" | "signup";

function AppContent() {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [miniPlayerOpen, setMiniPlayerOpen] = useState(false);
  const { visualizerVariant, setVisualizerVariant } = useSettings();
  const { isAuthenticated, isLoading } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  // Handle authentication state changes
  useEffect(() => {
    // Only auto-switch to app if user just logged in (not if viewing about page)
    if (isAuthenticated && currentView !== "app" && currentView !== "about") {
      setCurrentView("app");
    }
  }, [isAuthenticated, currentView]);

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
            <div className="relative">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="url(#loading-logo-gradient)"
                  stroke="url(#loading-logo-stroke)"
                  strokeWidth="1.5"
                />
                <path
                  d="M13 11L21 16L13 21V11Z"
                  fill="url(#loading-play-gradient)"
                />
                <defs>
                  <linearGradient id="loading-logo-gradient" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#e8e8e8" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#e8e8e8" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="loading-logo-stroke" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#e8e8e8" />
                    <stop offset="100%" stopColor="#999999" />
                  </linearGradient>
                  <linearGradient id="loading-play-gradient" x1="14" y1="11.5" x2="21" y2="20.5">
                    <stop offset="0%" stopColor="#e8e8e8" />
                    <stop offset="100%" stopColor="#cccccc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-[var(--replay-off-white)]">
              REPLAY
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

  // Landing page for unauthenticated users OR when viewing about page
  if ((!isAuthenticated && currentView === "landing") || currentView === "about") {
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
        onAboutClick={() => setCurrentView("about")}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32 md:pb-28 pt-[60px] md:pt-0 relative scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>

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
              <div className="flex items-center gap-2 flex-1">
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
            </div>
          </div>
        </div>

        {/* View Content */}
        {renderView()}
      </main>

      {/* Player Bar */}
      <PlayerBar
        onQueueClick={() => setQueueDrawerOpen(true)}
        onMiniPlayerToggle={() => setMiniPlayerOpen(true)}
      />

      {/* Queue Drawer */}
      <QueueDrawer isOpen={queueDrawerOpen} onClose={() => setQueueDrawerOpen(false)} />

      {/* Mini Player */}
      <MiniPlayer
        isOpen={miniPlayerOpen}
        onClose={() => setMiniPlayerOpen(false)}
        onExpand={() => setMiniPlayerOpen(false)}
      />
    </div>
  );
}

// Wrapper that provides AudioPlayer context (needs MusicLibrary)
function AppWithAudioPlayer() {
  return (
    <AudioPlayerProvider>
      <DragDropOverlay>
        <AppContent />
      </DragDropOverlay>
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