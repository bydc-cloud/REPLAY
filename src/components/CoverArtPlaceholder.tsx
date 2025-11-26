import { Music } from "lucide-react";
import { EnhancedVisualizer } from "./EnhancedVisualizer";

interface CoverArtPlaceholderProps {
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
  variant?: "bars" | "circular" | "waveform";
}

export const CoverArtPlaceholder = ({ 
  isPlaying = false, 
  size = "md",
  showIcon = true,
  variant = "circular"
}: CoverArtPlaceholderProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-32 h-32",
    xl: "w-64 h-64",
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 48,
    xl: 96,
  };

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-lg overflow-hidden flex items-center justify-center relative border border-white/5 shadow-lg`}>
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 30% 50%, rgba(232, 232, 232, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(232, 232, 232, 0.1) 0%, transparent 50%)',
          animation: isPlaying ? 'gradient-shift 4s ease infinite' : 'none',
        }}
      />

      {/* Visualizer */}
      {isPlaying ? (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <EnhancedVisualizer 
            isPlaying={isPlaying} 
            variant={variant}
            barCount={variant === "circular" ? 24 : 16}
            size={size}
          />
        </div>
      ) : (
        showIcon && (
          <div className="relative z-10 text-[var(--replay-mid-grey)] opacity-40">
            <Music size={iconSizes[size]} />
          </div>
        )
      )}

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(232, 232, 232, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(232, 232, 232, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  );
};

// Add CSS animation keyframes - this would normally go in globals.css
// For now, we'll add it via a style tag
if (typeof document !== 'undefined') {
  const styleId = 'cover-art-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes gradient-shift {
        0%, 100% {
          transform: rotate(0deg) scale(1);
        }
        50% {
          transform: rotate(180deg) scale(1.1);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
