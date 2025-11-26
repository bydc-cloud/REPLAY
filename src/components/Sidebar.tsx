import { Home, Search, Library, Heart, Disc, Users, ListMusic, Plus, X, Folder, Settings } from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-200 relative ${
        active
          ? "text-[var(--replay-off-white)] bg-gradient-to-r from-white/10 to-transparent border-l-4 border-[var(--replay-off-white)]"
          : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/5"
      }`}
    >
      {icon}
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
}

export const Sidebar = ({ activeTab = "home", onTabChange, isOpen = true, onClose }: SidebarProps) => {
  const projects = [
    { name: "Chill Vibes", songCount: 15 },
    { name: "Workout Mix", songCount: 20 },
    { name: "Focus Flow", songCount: 10 },
    { name: "Night Drive", songCount: 12 },
    { name: "Summer Hits", songCount: 18 },
  ];

  const handleNavClick = (tab: string) => {
    onTabChange?.(tab);
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[280px] md:w-[250px] h-screen 
        bg-[var(--replay-elevated)]/95 backdrop-blur-xl border-r border-[var(--replay-border)]
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Header */}
        <div className="p-6 flex items-center justify-between border-b border-[var(--replay-border)]">
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
              REPLAY
            </h1>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="pt-6">
          <NavItem 
            icon={<Home size={20} />} 
            label="Home" 
            active={activeTab === "home"} 
            onClick={() => handleNavClick("home")}
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
        </nav>

        {/* Secondary Navigation */}
        <nav className="pt-6 border-t border-[var(--replay-border)] mt-6">
          <NavItem 
            icon={<Disc size={20} />} 
            label="Albums" 
            active={activeTab === "albums"}
            onClick={() => handleNavClick("albums")}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Artists" 
            active={activeTab === "artists"}
            onClick={() => handleNavClick("artists")}
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
        </nav>

        {/* Projects Section */}
        <div className="pt-6 border-t border-[var(--replay-border)] mt-6 flex-1 overflow-y-auto">
          <div className="px-6 pb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[var(--replay-mid-grey)]">
              Projects
            </span>
            <button className="text-[var(--replay-off-white)] hover:opacity-70 transition-opacity">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-1">
            {projects.map((project) => (
              <ProjectItem key={project.name} name={project.name} songCount={project.songCount} />
            ))}
          </div>
        </div>

        {/* Import Button Footer */}
        <div className="p-6 border-t border-[var(--replay-border)]">
          <button className="w-full py-3 px-6 border border-[var(--replay-off-white)] text-[var(--replay-off-white)] hover:bg-[var(--replay-off-white)] hover:text-[var(--replay-black)] transition-all rounded-md hover-lift">
            Import Music
          </button>
        </div>
      </aside>
    </>
  );
};