import { Home, Search, Store, Library, Settings } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "search", icon: Search, label: "Search" },
    { id: "marketplace", icon: Store, label: "Market" },
    { id: "library", icon: Library, label: "Library" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="md:hidden fixed bottom-[72px] left-0 right-0 z-50 bg-[var(--replay-elevated)]/95 backdrop-blur-md">
      {/* Subtle top divider - very thin to blend with PlayerBar */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-white/[0.06]" />

      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[56px] ${
                isActive
                  ? "text-[var(--replay-off-white)]"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[9px] ${isActive ? 'font-semibold' : 'font-medium opacity-80'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
