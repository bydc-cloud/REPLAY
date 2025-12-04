import { Home, Search, Library, Heart, Disc, ListMusic, Plus, X, Folder, Settings, Info, Store, Check, Compass, MessageCircle, User, Upload, Bell } from "lucide-react";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";
import { useState, useRef, useEffect } from "react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

const NavItem = ({ icon, label, active, onClick, badge }: NavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-200 relative ${
        active
          ? "text-[var(--replay-off-white)] bg-gradient-to-r from-white/10 to-transparent border-l-4 border-[var(--replay-off-white)]"
          : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/5"
      }`}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-[var(--replay-accent-blue)] text-white rounded-full flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
};

interface ProjectItemProps {
  name: string;
  songCount: number;
}

const ProjectItem = ({ name, songCount }: ProjectItemProps) => {
  return (
    <button className="w-full text-left px-6 py-2 group hover:bg-white/5 transition-all rounded-md">
      <div className="flex items-center gap-3">
        <Folder size={16} className="text-[var(--replay-mid-grey)] group-hover:text-[var(--replay-off-white)] transition-colors" />
        <div className="flex-1 min-w-0">
          <p className="text-[var(--replay-off-white)] truncate">{name}</p>
          <p className="text-xs text-[var(--replay-mid-grey)]">{songCount} songs</p>
        </div>
      </div>
    </button>
  );
};

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onAboutClick?: () => void;
  onUploadClick?: () => void;
  notificationCount?: number;
  messageCount?: number;
}

export const Sidebar = ({ activeTab = "home", onTabChange, isOpen = true, onClose, onAboutClick, onUploadClick, notificationCount = 0, messageCount = 0 }: SidebarProps) => {
  // Load playlists from MusicLibrary context
  const { playlists, createPlaylist } = useMusicLibrary();

  // State for project creation
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when creating project
  useEffect(() => {
    if (isCreatingProject && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingProject]);

  // Handle project creation
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createPlaylist(newProjectName.trim());
      setNewProjectName("");
      setIsCreatingProject(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateProject();
    } else if (e.key === "Escape") {
      setIsCreatingProject(false);
      setNewProjectName("");
    }
  };

  // Map playlists to projects format
  const projects = playlists.map(playlist => ({
    name: playlist.name,
    songCount: playlist.trackIds.length
  }));

  const handleNavClick = (tab: string) => {
    onTabChange?.(tab);
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay - GPU accelerated */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-40 will-change-[opacity] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          backfaceVisibility: 'hidden',
        }}
        onClick={onClose}
      />

      {/* Sidebar - GPU accelerated with translate3d */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-[280px] md:w-[250px] h-screen
          bg-[var(--replay-elevated)]/95 backdrop-blur-xl border-r border-[var(--replay-border)]
          flex flex-col will-change-transform
          md:!translate-x-0 md:!opacity-100
          ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
        `}
        style={{
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-out',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {/* Logo Header - Fixed at top */}
        <div className="p-6 flex items-center justify-between border-b border-[var(--replay-border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Glassmorphism circle background */}
                <circle
                  cx="16"
                  cy="16"
                  r="15"
                  fill="currentColor"
                  fillOpacity="0.1"
                  className="text-[var(--replay-off-white)]"
                />
                {/* Outer glow ring */}
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeOpacity="0.8"
                  className="text-[var(--replay-off-white)]"
                />
                {/* Play icon */}
                <path
                  d="M21 16l-7-4.5v9z"
                  fill="currentColor"
                  className="text-[var(--replay-off-white)]"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--replay-off-white)]">
              RHYTHM
            </h1>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors p-1 rounded-lg hover:bg-white/10 active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content Area - with extra padding for mobile to ensure projects visible */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-safe" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Primary Navigation */}
          <nav className="pt-6">
            <NavItem
              icon={<Home size={20} />}
              label="Home"
              active={activeTab === "home"}
              onClick={() => handleNavClick("home")}
            />
            <NavItem
              icon={<Compass size={20} />}
              label="Discover"
              active={activeTab === "feed"}
              onClick={() => handleNavClick("feed")}
            />
            <NavItem
              icon={<Search size={20} />}
              label="Search"
              active={activeTab === "search"}
              onClick={() => handleNavClick("search")}
            />
            <NavItem
              icon={<Library size={20} />}
              label="Library"
              active={activeTab === "library"}
              onClick={() => handleNavClick("library")}
            />
            <NavItem
              icon={<Heart size={20} />}
              label="Liked Songs"
              active={activeTab === "liked"}
              onClick={() => handleNavClick("liked")}
            />
            <NavItem
              icon={<MessageCircle size={20} />}
              label="Messages"
              active={activeTab === "messages"}
              onClick={() => handleNavClick("messages")}
              badge={messageCount}
            />
            <NavItem
              icon={<Bell size={20} />}
              label="Notifications"
              active={activeTab === "notifications"}
              onClick={() => handleNavClick("notifications")}
              badge={notificationCount}
            />
            <NavItem
              icon={<User size={20} />}
              label="My Profile"
              active={activeTab === "profile"}
              onClick={() => handleNavClick("profile")}
            />
          </nav>

          {/* Secondary Navigation */}
          {/* Upload Button */}
          <div className="px-3 pt-6 border-t border-[var(--replay-border)] mt-6">
            <button
              onClick={() => {
                onUploadClick?.();
                onClose?.();
              }}
              className="w-full py-3 bg-gradient-to-r from-[var(--replay-accent-blue)] to-[var(--replay-accent-purple)] text-white hover:opacity-90 transition-all rounded-lg hover-lift active:scale-95 font-semibold flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              Upload Track
            </button>
          </div>

          <nav className="pt-4">
            <NavItem
              icon={<Disc size={20} />}
              label="Albums"
              active={activeTab === "albums"}
              onClick={() => handleNavClick("albums")}
            />
            <NavItem
              icon={<ListMusic size={20} />}
              label="Queue"
              active={activeTab === "queue"}
              onClick={() => handleNavClick("queue")}
            />
            <NavItem
              icon={<Settings size={20} />}
              label="Settings"
              active={activeTab === "settings"}
              onClick={() => handleNavClick("settings")}
            />
            <NavItem
              icon={<Store size={20} />}
              label="Marketplace"
              active={activeTab === "marketplace"}
              onClick={() => handleNavClick("marketplace")}
            />
            <NavItem
              icon={<Info size={20} />}
              label="About RHYTHM"
              active={activeTab === "about"}
              onClick={() => {
                onAboutClick?.();
                onClose?.();
              }}
            />
          </nav>

          {/* Projects Section */}
          <div className="pt-6 border-t border-[var(--replay-border)] mt-6">
            <div className="px-6 pb-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[var(--replay-mid-grey)]">
                Projects
              </span>
              <button
                onClick={() => setIsCreatingProject(true)}
                className="text-[var(--replay-off-white)] hover:opacity-70 transition-opacity p-1 rounded-md hover:bg-white/10"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Create Project Input */}
            {isCreatingProject && (
              <div className="px-6 pb-3">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <Folder size={16} className="text-[var(--replay-mid-grey)] flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Project name..."
                    className="flex-1 bg-transparent text-[var(--replay-off-white)] text-sm outline-none placeholder:text-[var(--replay-mid-grey)]/50"
                  />
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                    className="p-1 rounded-md text-[var(--replay-off-white)] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingProject(false);
                      setNewProjectName("");
                    }}
                    className="p-1 rounded-md text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/10 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1 pb-24 md:pb-6">
              {projects.length === 0 && !isCreatingProject ? (
                <div className="px-6 py-4 text-center">
                  <p className="text-sm text-[var(--replay-mid-grey)]">No projects yet</p>
                  <button
                    onClick={() => setIsCreatingProject(true)}
                    className="text-xs text-[var(--replay-off-white)]/70 mt-1 hover:text-[var(--replay-off-white)] transition-colors"
                  >
                    + Create your first project
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                  <ProjectItem key={project.name} name={project.name} songCount={project.songCount} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer spacer for mobile safe area */}
        <div className="h-4 flex-shrink-0" />
      </aside>
    </>
  );
};