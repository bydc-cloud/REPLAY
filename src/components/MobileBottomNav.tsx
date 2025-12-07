import { useState, useRef } from "react";
import { Home, Compass, Disc, Library, User, Globe, X, FolderOpen } from "lucide-react";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isHidden?: boolean;
}

export const MobileBottomNav = ({ activeTab, onTabChange, isHidden = false }: MobileBottomNavProps) => {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importFiles } = useMusicLibrary();

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "feed", icon: Compass, label: "Discover" },
    { id: "create", icon: Disc, label: "", isCreate: true },
    { id: "library", icon: Library, label: "Library" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const handleCreateOption = (option: 'post' | 'import') => {
    setShowCreateMenu(false);
    if (option === 'post') {
      // Navigate to feed tab first, then dispatch event to open post modal
      onTabChange('feed');
      // Small delay to ensure FeedView is mounted before dispatching event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openDiscoveryPost'));
      }, 100);
    } else if (option === 'import') {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await importFiles(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Hidden file input for importing */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Create Menu Overlay */}
      {showCreateMenu && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCreateMenu(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-[280px] animate-slide-up">
            <div className="bg-[#1a1a1a]/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-white font-semibold text-sm">Add Music</span>
                <button
                  onClick={() => setShowCreateMenu(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Options */}
              <div className="p-2">
                {/* Post to Discovery */}
                <button
                  onClick={() => handleCreateOption('post')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium text-sm">Post to Discovery</p>
                    <p className="text-white/40 text-xs">Share your music publicly</p>
                  </div>
                </button>

                {/* Import to Library */}
                <button
                  onClick={() => handleCreateOption('import')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <FolderOpen className="w-5 h-5 text-white/80" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium text-sm">Import to Library</p>
                    <p className="text-white/40 text-xs">Add music to your collection</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - hidden when mini player is open */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom transition-transform duration-300 ease-out will-change-transform ${isHidden ? 'translate-y-full' : 'translate-y-0'}`} style={{ transform: isHidden ? 'translateY(100%)' : 'translateY(0)', WebkitTransform: isHidden ? 'translateY(100%)' : 'translateY(0)' }}>
        {/* Glass morphism background - GPU accelerated */}
        <div className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/[0.06]" style={{ WebkitBackdropFilter: 'blur(24px)' }} />

        <div className="relative flex items-end justify-around px-4 h-[60px]">
          {navItems.map(({ id, icon: Icon, label, isCreate }) => {
            const isActive = activeTab === id || (id === 'feed' && activeTab === 'feed');

            // Special create button in center - Matching actual Rhythm logo style
            if (isCreate) {
              return (
                <button
                  key={id}
                  onClick={() => setShowCreateMenu(true)}
                  className="relative flex flex-col items-center justify-center"
                  style={{ marginTop: '-28px', marginBottom: '4px' }}
                >
                  {/* Outer glow ring - more subtle purple/pink glow */}
                  <div className="absolute w-[52px] h-[52px] rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/15 blur-md" />
                  {/* Main button - matches header logo: glassmorphism with gradient border */}
                  <div className={`relative w-[52px] h-[52px] rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-md flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all border border-purple-500/30 ${showCreateMenu ? 'scale-105 shadow-purple-500/30 from-purple-500/40 to-pink-500/30' : ''}`}>
                    {/* Inner gradient ring for premium feel */}
                    <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-purple-600/15 to-pink-600/8" />
                    <Icon size={24} className="text-white relative z-10 drop-shadow-md" strokeWidth={2} />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`relative flex flex-col items-center gap-0.5 px-3 pb-1 pt-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-white/40 active:text-white/60"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={isActive ? 'text-white' : ''}
                />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute bottom-0 w-1 h-1 rounded-full bg-violet-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
