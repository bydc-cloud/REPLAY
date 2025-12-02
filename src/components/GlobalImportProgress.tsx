import { useState } from "react";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";
import { ChevronUp, ChevronDown, X } from "lucide-react";

export const GlobalImportProgress = () => {
  const { isImporting, importProgress, importStats } = useMusicLibrary();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when a new import starts
  if (!isImporting && isDismissed) {
    setIsDismissed(false);
  }

  if (!isImporting || isDismissed) return null;

  // Minimized view - just a tiny indicator
  if (isMinimized) {
    return (
      <div className="fixed top-2 right-2 z-[9999] pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-3 py-1.5 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center gap-2 hover:border-purple-500/50 transition-colors"
        >
          {/* Mini progress circle */}
          <div className="relative w-5 h-5">
            <svg className="w-5 h-5 -rotate-90">
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="url(#progressGradient)"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${importProgress * 0.5} 50`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xs text-white/80 font-medium">
            {importStats.completed}/{importStats.total}
          </span>
          <ChevronDown className="w-3 h-3 text-white/60" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Full-width progress bar at very top */}
      <div className="h-1 bg-black/50">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] transition-all duration-300"
          style={{
            width: `${importProgress}%`,
            animation: 'shimmer 2s linear infinite',
          }}
        />
      </div>

      {/* Floating status pill */}
      <div className="flex justify-center mt-2 pointer-events-auto">
        <div className="px-4 py-2 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center gap-3">
          {/* Animated audio bars */}
          <div className="flex items-end gap-[2px] h-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-[3px] rounded-full"
                style={{
                  background: `linear-gradient(to top, hsl(${260 + i * 25}, 80%, 50%), hsl(${280 + i * 25}, 90%, 65%))`,
                  height: '100%',
                  animation: `audioLoading 1s ease-in-out ${i * 0.1}s infinite`,
                }}
              />
            ))}
          </div>

          <span className="text-sm text-[var(--replay-off-white)] font-medium">
            Importing {importStats.completed + importStats.failed}/{importStats.total}
          </span>

          <span className="text-sm font-bold text-[var(--replay-off-white)]">
            {importProgress}%
          </span>

          {/* Minimize button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors ml-1"
            title="Minimize"
          >
            <ChevronUp className="w-4 h-4 text-white/60" />
          </button>

          {/* Dismiss button - only show when >50% complete */}
          {importProgress > 50 && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
              title="Dismiss (import continues in background)"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes audioLoading {
          0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
