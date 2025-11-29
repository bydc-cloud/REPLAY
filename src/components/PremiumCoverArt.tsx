import { PerformantVisualizer } from "./PerformantVisualizer";

interface PremiumCoverArtProps {
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "bars" | "wave" | "pulse" | "circle" | "dots" | "lines" | "lyrics";
  imageUrl?: string;
  audioElement?: HTMLAudioElement | null;
  demoMode?: boolean; // Force demo mode for settings previews
}

// Mini visualizer for small sizes - uses CSS animation like the loading screen
const MiniVisualizer = ({ isPlaying }: { isPlaying: boolean; demoMode?: boolean }) => {
  return (
    <div className="w-full h-full flex items-end justify-center gap-[3px] p-2 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1.5 rounded-full"
          style={{
            background: `linear-gradient(to top, hsl(${260 + i * 20}, 80%, 50%), hsl(${280 + i * 20}, 90%, 65%))`,
            height: isPlaying ? '100%' : '20%',
            animation: isPlaying ? `audioLoading 1s ease-in-out ${i * 0.1}s infinite` : 'none',
            boxShadow: isPlaying ? `0 0 8px hsla(${270 + i * 15}, 80%, 60%, 0.5)` : 'none',
            transition: 'height 0.3s ease, box-shadow 0.3s ease',
          }}
        />
      ))}
      <style>{`
        @keyframes audioLoading {
          0%, 100% { transform: scaleY(0.3); opacity: 0.6; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export const PremiumCoverArt = ({
  isPlaying = false,
  size = "md",
  variant = "bars",
  imageUrl,
  audioElement,
  demoMode = false
}: PremiumCoverArtProps) => {
  // Enable demo mode if no audioElement is provided (for settings previews)
  const effectiveDemoMode = demoMode || !audioElement;
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-48 h-48",
    xl: "w-full h-full",
    full: "w-full h-full",
  };

  // If image URL is provided, show the image
  if (imageUrl) {
    return (
      <div className={`${sizeClasses[size]} bg-[var(--replay-elevated)] rounded-xl overflow-hidden flex items-center justify-center relative border border-white/10 shadow-lg`}>
        <img
          src={imageUrl}
          alt="Album art"
          className="w-full h-full object-cover"
        />
        {isPlaying && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center p-3">
              <PerformantVisualizer isPlaying={isPlaying} variant={variant === "lyrics" ? "bars" : variant} size={size} audioElement={audioElement} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // For small sizes (sm, md), use the optimized MiniVisualizer - always visible, goes dark when paused
  if (size === "sm" || size === "md") {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#0a0a12] to-[#15151f] rounded-xl overflow-hidden flex items-center justify-center relative border border-white/10 shadow-lg`}>
        <MiniVisualizer isPlaying={isPlaying} demoMode={effectiveDemoMode} />
      </div>
    );
  }

  // No image - show premium visualizer for larger sizes
  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#050508] via-[#0f0f15] to-[#050508] rounded-xl overflow-hidden flex items-center justify-center relative border border-white/10 shadow-2xl shadow-black/50`}>
      {/* Dynamic ambient background glow */}
      <div
        className="absolute inset-0"
        style={{
          background: isPlaying
            ? `radial-gradient(circle at center,
                rgba(139, 92, 246, 0.15) 0%,
                rgba(59, 130, 246, 0.08) 40%,
                transparent 70%
              )`
            : `radial-gradient(circle at center,
                rgba(232, 232, 232, 0.05) 0%,
                transparent 70%
              )`,
          animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Animated gradient overlay */}
      {isPlaying && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              conic-gradient(
                from 0deg at 50% 50%,
                rgba(139, 92, 246, 0.3) 0deg,
                rgba(59, 130, 246, 0.2) 90deg,
                rgba(236, 72, 153, 0.2) 180deg,
                rgba(139, 92, 246, 0.3) 270deg,
                rgba(139, 92, 246, 0.3) 360deg
              )
            `,
            animation: 'spin 8s linear infinite',
            filter: 'blur(40px)',
          }}
        />
      )}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(232, 232, 232, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232, 232, 232, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Main visualizer - perfectly centered, always visible (goes dark when paused) */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <PerformantVisualizer isPlaying={isPlaying} variant={variant === "lyrics" ? "bars" : variant} size={size} audioElement={audioElement} />
      </div>

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.5) 100%)',
        }}
      />

      {/* Corner accents */}
      {(size === "lg" || size === "xl" || size === "full") && isPlaying && (
        <>
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white/20 rounded-tl" />
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white/20 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white/20 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white/20 rounded-br" />
        </>
      )}
    </div>
  );
};