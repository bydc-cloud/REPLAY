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
    <nav className="md:hidden fixed bottom-[72px] left-0 right-0 z-50 bg-gradient-to-t from-[#0a0a0a]/98 via-[#111111]/95 to-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/[0.08]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive
                  ? "text-[var(--replay-off-white)] bg-white/10"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
