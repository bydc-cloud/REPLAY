import { Search, X, Music, Disc, User, Settings as SettingsIcon, Command } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SearchResult {
  type: "song" | "album" | "artist" | "feature" | "setting";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface GlobalSearchBarProps {
  onNavigate?: (tab: string) => void;
}

export const GlobalSearchBar = ({ onNavigate }: GlobalSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock search results - in real app, this would be dynamic
  const allResults: SearchResult[] = [
    // Songs
    { type: "song", title: "Electric Dreams", subtitle: "Neon Lights", icon: <Music size={16} />, action: () => console.log("Play song") },
    { type: "song", title: "Midnight Drive", subtitle: "Synthwave Collective", icon: <Music size={16} />, action: () => console.log("Play song") },
    { type: "song", title: "Neon Sunset", subtitle: "Digital Horizons", icon: <Music size={16} />, action: () => console.log("Play song") },
    
    // Albums
    { type: "album", title: "Retro Future", subtitle: "12 songs", icon: <Disc size={16} />, action: () => console.log("Open album") },
    { type: "album", title: "Cyberpunk 2088", subtitle: "15 songs", icon: <Disc size={16} />, action: () => console.log("Open album") },
    
    // Artists
    { type: "artist", title: "Neon Lights", subtitle: "Artist", icon: <User size={16} />, action: () => console.log("Open artist") },
    { type: "artist", title: "Synthwave Collective", subtitle: "Artist", icon: <User size={16} />, action: () => console.log("Open artist") },
    
    // Features
    { type: "feature", title: "Queue", subtitle: "View current queue", icon: <Music size={16} />, action: () => onNavigate?.("queue") },
    { type: "feature", title: "Library", subtitle: "Browse your music", icon: <Disc size={16} />, action: () => onNavigate?.("library") },
    
    // Settings
    { type: "setting", title: "Audio Visualizer", subtitle: "Change visualizer style", icon: <SettingsIcon size={16} />, action: () => onNavigate?.("settings") },
    { type: "setting", title: "Settings", subtitle: "App preferences", icon: <SettingsIcon size={16} />, action: () => onNavigate?.("settings") },
  ];

  // Filter results based on query
  const filteredResults = query.trim() === "" 
    ? [] 
    : allResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.subtitle?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8); // Limit to 8 results

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
        e.preventDefault();
        filteredResults[selectedIndex].action();
        handleClose();
      } else if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex]);

  // CMD+K shortcut to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleClose = () => {
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(0);
    inputRef.current?.blur();
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "song": return "text-blue-400";
      case "album": return "text-purple-400";
      case "artist": return "text-pink-400";
      case "feature": return "text-green-400";
      case "setting": return "text-orange-400";
      default: return "text-[var(--replay-mid-grey)]";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--replay-mid-grey)]">
          <Search size={16} className="md:w-[18px] md:h-[18px]" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search..."
          className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-white/20 rounded-lg md:rounded-full pl-9 md:pl-10 pr-8 md:pr-20 py-1.5 md:py-2 text-xs md:text-sm text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] transition-all outline-none"
        />

        {/* Keyboard Hint - Desktop Only */}
        <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 text-[var(--replay-mid-grey)] text-xs">
          <div className="flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClose}
            className="absolute right-2 md:right-20 top-1/2 -translate-y-1/2 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X size={14} className="md:w-4 md:h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query && filteredResults.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1a]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {filteredResults.map((result, index) => (
            <button
              key={`${result.type}-${result.title}-${index}`}
              onClick={() => {
                result.action();
                handleClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left ${
                index === selectedIndex
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              }`}
            >
              <div className={`${getTypeColor(result.type)}`}>
                {result.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--replay-off-white)] truncate font-medium">
                  {result.title}
                </p>
                {result.subtitle && (
                  <p className="text-xs text-[var(--replay-mid-grey)] truncate">
                    {result.subtitle}
                  </p>
                )}
              </div>
              <div className="text-[10px] text-[var(--replay-mid-grey)] uppercase tracking-wider px-2 py-0.5 bg-white/5 rounded-full">
                {result.type}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query && filteredResults.length === 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1a]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
          <div className="text-center">
            <Search size={32} className="text-[var(--replay-mid-grey)] mx-auto mb-2" />
            <p className="text-sm text-[var(--replay-mid-grey)]">
              No results found for "{query}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};