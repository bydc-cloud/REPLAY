import { useMusicLibrary } from "../contexts/MusicLibraryContext";

export const GlobalImportProgress = () => {
  const { isImporting, importProgress, importStats } = useMusicLibrary();

  if (!isImporting) return null;

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
