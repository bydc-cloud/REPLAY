import { Music } from "lucide-react";
import { PremiumVisualizer } from "./PremiumVisualizer";
import { ColorfulVisualizer } from "./ColorfulVisualizer";

interface PremiumCoverArtProps {
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "orb" | "spectrum" | "particles" | "galaxy" | "dna" | "radial";
  imageUrl?: string;
  audioElement?: HTMLAudioElement | null;
}

export const PremiumCoverArt = ({ 
  isPlaying = false, 
  size = "md",
  variant = "orb",
  imageUrl,
  audioElement
}: PremiumCoverArtProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-48 h-48",
    xl: "w-full aspect-square max-w-md",
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center p-4">
              <PremiumVisualizer isPlaying={isPlaying} variant="orb" size={size} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // No image - show premium visualizer
  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] rounded-xl overflow-hidden flex items-center justify-center relative border border-white/10 shadow-2xl shadow-black/50`}>
      {/* Ambient background glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, 
            rgba(232, 232, 232, 0.08) 0%,
            transparent 70%
          )`,
          animation: isPlaying ? 'pulse 3s ease-in-out infinite' : 'none',
        }}
      />

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(232, 232, 232, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232, 232, 232, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main visualizer - perfectly centered */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        {isPlaying ? (
          <ColorfulVisualizer isPlaying={isPlaying} variant={variant} size={size} audioElement={audioElement} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 opacity-30">
            <Music size={size === "sm" ? 20 : size === "md" ? 32 : size === "lg" ? 64 : 96} className="text-[var(--replay-off-white)]" />
            {size !== "sm" && (
              <div className="text-center">
                <div className="text-xs text-[var(--replay-mid-grey)]">No Cover Art</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />
    </div>
  );
};