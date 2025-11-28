import { useEffect, useRef, useState, useMemo } from "react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

interface PerformantVisualizerProps {
  isPlaying: boolean;
  variant?: "bars" | "wave" | "pulse" | "circle" | "dots" | "lines";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  audioElement?: HTMLAudioElement | null;
}

export const PerformantVisualizer = ({
  isPlaying,
  variant = "bars",
  size = "full",
  audioElement
}: PerformantVisualizerProps) => {
  const { frequencyData } = useAudioAnalyzer(isPlaying ? audioElement : null);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const barsRef = useRef<HTMLDivElement[]>([]);
  const lastUpdateRef = useRef<number>(0);

  // Container size classes
  const containerClass = size === "full" || size === "xl"
    ? "w-full h-full"
    : size === "lg"
    ? "w-64 h-64"
    : size === "md"
    ? "w-48 h-48"
    : "w-32 h-32";

  // Optimized bar count based on device and variant
  const barCount = useMemo(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (variant === "bars") return isMobile ? 16 : 32;
    if (variant === "circle") return isMobile ? 24 : 48;
    if (variant === "dots") return isMobile ? 12 : 20;
    if (variant === "lines") return isMobile ? 8 : 16;
    return 16;
  }, [variant]);

  // Initialize bars with refs
  useEffect(() => {
    setIsReady(true);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // High-performance update loop
  useEffect(() => {
    if (!frequencyData || frequencyData.length === 0 || !isReady) return;

    const update = (timestamp: number) => {
      // Throttle to 60fps (16.67ms between frames)
      if (timestamp - lastUpdateRef.current < 16) {
        rafRef.current = requestAnimationFrame(update);
        return;
      }
      lastUpdateRef.current = timestamp;

      const step = Math.floor(frequencyData.length / barCount);

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;

        const index = i * step;
        const value = frequencyData[index] / 255;

        if (variant === "bars") {
          // Use transform for height changes (GPU accelerated)
          bar.style.transform = `scaleY(${Math.max(0.1, value)})`;
          bar.style.opacity = `${0.5 + value * 0.5}`;
        } else if (variant === "wave") {
          const wave = Math.sin((i / barCount) * Math.PI * 2 + timestamp / 500) * 0.5 + 0.5;
          bar.style.transform = `translateY(${(1 - value) * wave * 50}px) scaleY(${Math.max(0.2, value)})`;
        } else if (variant === "pulse") {
          const scale = 1 + value * 0.5;
          bar.style.transform = `scale(${scale})`;
          bar.style.opacity = `${0.3 + value * 0.7}`;
        } else if (variant === "circle") {
          const angle = (i / barCount) * Math.PI * 2;
          const radius = 40 + value * 40;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          bar.style.transform = `translate(${x}px, ${y}px) scale(${0.5 + value})`;
        } else if (variant === "dots") {
          const scale = 0.5 + value * 1.5;
          bar.style.transform = `scale(${scale})`;
          bar.style.opacity = `${0.4 + value * 0.6}`;
        } else if (variant === "lines") {
          bar.style.transform = `scaleX(${Math.max(0.1, value)})`;
          bar.style.opacity = `${0.6 + value * 0.4}`;
        }
      });

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [frequencyData, barCount, variant, isReady]);

  // Render based on variant
  if (variant === "bars") {
    return (
      <div ref={containerRef} className={`${containerClass} flex items-end justify-center gap-[2px] px-2`}>
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            ref={el => { if (el) barsRef.current[i] = el; }}
            className="flex-1 max-w-[12px] h-full rounded-t-sm origin-bottom"
            style={{
              backgroundColor: `hsl(${(i / barCount) * 300}, 70%, 60%)`,
              transform: 'scaleY(0.1)',
              willChange: 'transform, opacity',
              transition: 'none',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "wave") {
    return (
      <div ref={containerRef} className={`${containerClass} flex items-center justify-center gap-1`}>
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            ref={el => { if (el) barsRef.current[i] = el; }}
            className="w-1 h-16 md:w-2 md:h-24 rounded-full"
            style={{
              backgroundColor: `hsl(${(i / barCount) * 360}, 80%, 60%)`,
              transform: 'translateY(0) scaleY(0.2)',
              willChange: 'transform',
              transition: 'none',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        {[0, 1, 2, 3].map((ring) => (
          <div
            key={ring}
            ref={el => { if (el) barsRef.current[ring] = el; }}
            className="absolute rounded-full border-2"
            style={{
              width: `${30 + ring * 20}%`,
              height: `${30 + ring * 20}%`,
              borderColor: `hsla(${ring * 90}, 70%, 60%, ${0.6 - ring * 0.15})`,
              transform: 'scale(1)',
              willChange: 'transform, opacity',
              transition: 'none',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        <div className="absolute w-full h-full flex items-center justify-center">
          {Array.from({ length: barCount }).map((_, i) => (
            <div
              key={i}
              ref={el => { if (el) barsRef.current[i] = el; }}
              className="absolute w-1 h-8 md:w-1.5 md:h-12 rounded-full origin-center"
              style={{
                backgroundColor: `hsl(${(i / barCount) * 360}, 80%, 60%)`,
                transform: 'translate(0, 0) scale(0.5)',
                willChange: 'transform',
                transition: 'none',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        <div className="grid grid-cols-4 md:grid-cols-5 gap-2 md:gap-4">
          {Array.from({ length: barCount }).map((_, i) => (
            <div
              key={i}
              ref={el => { if (el) barsRef.current[i] = el; }}
              className="w-3 h-3 md:w-4 md:h-4 rounded-full"
              style={{
                backgroundColor: `hsl(${(i / barCount) * 360}, 70%, 60%)`,
                transform: 'scale(0.5)',
                willChange: 'transform, opacity',
                transition: 'none',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Lines variant
  return (
    <div ref={containerRef} className={`${containerClass} flex flex-col items-center justify-center gap-1 md:gap-2`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={el => { if (el) barsRef.current[i] = el; }}
          className="h-0.5 md:h-1 w-full rounded-full origin-left"
          style={{
            backgroundColor: `hsl(${(i / barCount) * 300 + 180}, 70%, 60%)`,
            transform: 'scaleX(0.1)',
            willChange: 'transform, opacity',
            transition: 'none',
          }}
        />
      ))}
    </div>
  );
};