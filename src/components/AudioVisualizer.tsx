import { useEffect, useRef, useMemo } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

/**
 * Modern 2025-style audio visualizer bars with smooth GPU-accelerated animations
 * Uses CSS transforms for 60fps performance instead of React state updates
 */
export const AudioVisualizer = ({ isPlaying, barCount = 5, className = "" }: AudioVisualizerProps) => {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animationRef = useRef<number | null>(null);
  const phasesRef = useRef<number[]>([]);

  // Initialize random phases for organic movement
  useMemo(() => {
    phasesRef.current = Array(barCount).fill(0).map(() => Math.random() * Math.PI * 2);
  }, [barCount]);

  useEffect(() => {
    if (!isPlaying) {
      // Smoothly animate bars to rest position
      barsRef.current.forEach((bar) => {
        if (bar) {
          bar.style.transform = 'scaleY(0.2)';
          bar.style.opacity = '0.5';
        }
      });
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000; // Convert to seconds

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;

        const phase = phasesRef.current[i];
        // Create organic, flowing movement with multiple sine waves
        // Main wave + secondary wave + subtle third wave for complexity
        const wave1 = Math.sin(elapsed * 3.5 + phase) * 0.35;
        const wave2 = Math.sin(elapsed * 5.7 + phase * 1.3) * 0.25;
        const wave3 = Math.sin(elapsed * 8.2 + phase * 0.7) * 0.1;

        // Combine waves with base height (0.3 to 1.0 range)
        const scale = 0.35 + wave1 + wave2 + wave3 + 0.35;

        // Clamp between 0.15 and 1.0
        const clampedScale = Math.max(0.15, Math.min(1.0, scale));

        // Apply transform (GPU-accelerated)
        bar.style.transform = `scaleY(${clampedScale})`;

        // Subtle opacity variation for extra depth
        bar.style.opacity = `${0.6 + clampedScale * 0.4}`;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying]);

  return (
    <div className={`flex items-end justify-center gap-[3px] h-4 ${className}`}>
      {Array(barCount).fill(0).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className="w-[3px] h-full rounded-full origin-bottom will-change-transform"
          style={{
            background: 'linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0.6))',
            transform: 'scaleY(0.2)',
            transition: isPlaying ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out',
            boxShadow: '0 0 8px rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </div>
  );
};
