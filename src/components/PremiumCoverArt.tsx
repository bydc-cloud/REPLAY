import { PerformantVisualizer } from "./PerformantVisualizer";

interface PremiumCoverArtProps {
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "none" | "bars" | "wave" | "pulse" | "circle" | "dots" | "lines" | "lyrics";
  imageUrl?: string;
  audioElement?: HTMLAudioElement | null;
  demoMode?: boolean; // Force demo mode for settings previews
}

// Mini visualizer for small sizes - clean premium style without glow
const MiniVisualizer = ({ isPlaying }: { isPlaying: boolean; demoMode?: boolean }) => {
  return (
    <div className="w-full h-full flex items-end justify-center gap-[3px] p-2 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm"
          style={{
            background: `linear-gradient(to top, hsl(${220 + i * 10}, 45%, 50%), hsl(${225 + i * 8}, 50%, 60%))`,
            height: isPlaying ? '100%' : '20%',
            animation: isPlaying ? `audioLoading 1s ease-in-out ${i * 0.1}s infinite` : 'none',
            transition: 'height 0.3s ease',
          }}
        />
      ))}
      <style>{`
        @keyframes audioLoading {
          0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
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

  // If variant is "none", just show a simple album art placeholder or nothing
  if (variant === "none") {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl overflow-hidden flex items-center justify-center relative border border-white/10 shadow-lg`}>
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-white/40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
      </div>
    );
  }

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

  // For small sizes (sm, md) WITHOUT demoMode, use the optimized MiniVisualizer - always visible, goes dark when paused
  // For demoMode (settings previews), use the actual PerformantVisualizer to show real visualizer styles
  if ((size === "sm" || size === "md") && !effectiveDemoMode) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#0a0a12] to-[#15151f] rounded-xl overflow-hidden flex items-center justify-center relative border border-white/10 shadow-lg`}>
        <MiniVisualizer isPlaying={isPlaying} demoMode={effectiveDemoMode} />
      </div>
    );
  }

  // For demoMode at small sizes, use scaled-down actual visualizer
  if ((size === "sm" || size === "md") && effectiveDemoMode) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#050508] via-[#0f0f15] to-[#050508] rounded-xl overflow-hidden flex items-center justify-center relative border border-white/10 shadow-lg`}>
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
        {/* Actual visualizer component for demo preview */}
        <div className="absolute inset-0 flex items-center justify-center p-1">
          <PerformantVisualizer isPlaying={isPlaying} variant={variant === "lyrics" ? "bars" : variant} size={size} audioElement={audioElement} />
        </div>
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