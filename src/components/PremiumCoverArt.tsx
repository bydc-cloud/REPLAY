import { Music } from "lucide-react";
import { PerformantVisualizer } from "./PerformantVisualizer";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

interface PremiumCoverArtProps {
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "bars" | "wave" | "pulse" | "circle" | "dots" | "lines" | "lyrics";
  imageUrl?: string;
  audioElement?: HTMLAudioElement | null;
}

// Mini visualizer for small sizes
const MiniVisualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const { audioLevels } = useAudioPlayer();

  // Take just 5 bars for the mini view
  const bars = [0, 8, 16, 24, 32].map(i => audioLevels[i] || 0);

  return (
    <div className="w-full h-full flex items-end justify-center gap-[2px] p-1.5 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
      {bars.map((level, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{
            height: isPlaying ? `${Math.max(15, level * 85)}%` : '15%',
            background: `linear-gradient(to top,
              hsl(${260 + i * 20}, 80%, 50%),
              hsl(${280 + i * 20}, 90%, 65%))`,
            boxShadow: level > 0.4 ? `0 0 ${level * 6}px rgba(147, 51, 234, 0.6)` : 'none',
            transition: 'height 0.08s ease-out',
          }}
        />
      ))}
    </div>
  );
};

export const PremiumCoverArt = ({
  isPlaying = false,
  size = "md",
  variant = "bars",
  imageUrl,
  audioElement
}: PremiumCoverArtProps) => {
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

  // For small sizes (sm, md), use the optimized MiniVisualizer
  if (size === "sm" || size === "md") {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#0a0a12] to-[#15151f] rounded-xl overflow-hidden flex items-center justify-center relative border border-white/10 shadow-lg`}>
        {isPlaying ? (
          <MiniVisualizer isPlaying={isPlaying} />
        ) : (
          <div className="flex items-center justify-center opacity-50">
            <Music size={size === "sm" ? 18 : 24} className="text-[var(--replay-off-white)]" />
          </div>
        )}
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

      {/* Main visualizer - perfectly centered */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        {isPlaying ? (
          <PerformantVisualizer isPlaying={isPlaying} variant={variant === "lyrics" ? "bars" : variant} size={size} audioElement={audioElement} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 opacity-40">
            <div className="relative">
              <Music
                size={size === "lg" ? 64 : (size === "xl" || size === "full") ? 96 : 64}
                className="text-[var(--replay-off-white)]"
              />
              <div className="absolute inset-0 blur-lg opacity-30">
                <Music
                  size={size === "lg" ? 64 : (size === "xl" || size === "full") ? 96 : 64}
                  className="text-purple-400"
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-[var(--replay-mid-grey)]">No Cover Art</div>
            </div>
          </div>
        )}
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