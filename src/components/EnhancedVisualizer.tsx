import { useEffect, useState } from "react";

interface EnhancedVisualizerProps {
  isPlaying: boolean;
  variant?: "bars" | "circular" | "waveform";
  barCount?: number;
  size?: "sm" | "md" | "lg" | "xl";
}

export const EnhancedVisualizer = ({ 
  isPlaying, 
  variant = "bars",
  barCount = 32,
  size = "md" 
}: EnhancedVisualizerProps) => {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(30));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(barCount).fill(30));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array(barCount)
          .fill(0)
          .map((_, i) => {
            // Create wave-like pattern
            const wave = Math.sin((Date.now() / 500) + (i / 3)) * 30 + 50;
            const random = Math.random() * 40;
            return wave + random;
          })
      );
    }, 80);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  const sizeClasses = {
    sm: "h-12",
    md: "h-24",
    lg: "h-48",
    xl: "h-64",
  };

  if (variant === "circular") {
    return (
      <div className={`relative ${sizeClasses[size]} aspect-square`}>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Circular visualizer */}
          {heights.map((height, i) => {
            const angle = (i / barCount) * 360;
            const radius = 35;
            const barLength = height / 2;
            
            return (
              <div
                key={i}
                className="absolute origin-bottom"
                style={{
                  height: `${barLength}%`,
                  width: '2px',
                  transform: `rotate(${angle}deg) translateY(-50%)`,
                  top: '50%',
                  left: '50%',
                  background: `linear-gradient(to top, 
                    rgba(232, 232, 232, 0.2), 
                    rgba(232, 232, 232, ${0.4 + (height / 200)})
                  )`,
                  transition: 'height 0.08s ease-out',
                  borderRadius: '2px',
                }}
              />
            );
          })}
          
          {/* Center circle */}
          <div className="absolute w-8 h-8 rounded-full bg-[var(--replay-off-white)]/10 backdrop-blur-sm border border-white/20" />
        </div>
      </div>
    );
  }

  if (variant === "waveform") {
    return (
      <div className={`relative ${sizeClasses[size]} w-full flex items-center justify-center overflow-hidden`}>
        <div className="flex items-center justify-center gap-0.5 h-full w-full px-4">
          {heights.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-75 ease-out"
              style={{
                height: `${height}%`,
                background: `linear-gradient(to top, 
                  rgba(232, 232, 232, 0.3), 
                  rgba(232, 232, 232, ${0.6 + (height / 200)})
                )`,
                boxShadow: `0 0 ${height / 10}px rgba(232, 232, 232, 0.3)`,
              }}
            />
          ))}
        </div>
        
        {/* Animated glow overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(232, 232, 232, 0.1) 0%, transparent 70%)',
            animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        />
      </div>
    );
  }

  // Default: bars
  return (
    <div className={`relative ${sizeClasses[size]} w-full flex items-center justify-center`}>
      <div className="flex items-end justify-center gap-1 h-full w-full px-4">
        {heights.map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-full transition-all duration-75 ease-out"
            style={{
              height: `${height}%`,
              background: `linear-gradient(to top, 
                rgba(232, 232, 232, 0.3), 
                rgba(232, 232, 232, ${0.6 + (height / 200)})
              )`,
              boxShadow: `0 -2px ${height / 15}px rgba(232, 232, 232, 0.4)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
