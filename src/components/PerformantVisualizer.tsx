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
  // Always get audio data, but only animate when playing
  const { frequencyData } = useAudioAnalyzer(audioElement);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const barsRef = useRef<HTMLDivElement[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const smoothedDataRef = useRef<number[]>([]);
  const hueRotationRef = useRef<number>(0);

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
    if (variant === "bars") return isMobile ? 24 : 48;
    if (variant === "circle") return isMobile ? 36 : 72;
    if (variant === "dots") return isMobile ? 16 : 25;
    if (variant === "lines") return isMobile ? 12 : 20;
    if (variant === "wave") return isMobile ? 32 : 64;
    if (variant === "pulse") return 5;
    return 24;
  }, [variant]);

  // Initialize bars with refs
  useEffect(() => {
    setIsReady(true);
    smoothedDataRef.current = new Array(barCount).fill(0);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [barCount]);

  // Get average energy for dynamic effects
  const getAverageEnergy = (data: Uint8Array): number => {
    if (!data || data.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < Math.min(data.length, 32); i++) {
      sum += data[i];
    }
    return sum / 32 / 255;
  };

  // Get bass energy (low frequencies)
  const getBassEnergy = (data: Uint8Array): number => {
    if (!data || data.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < Math.min(data.length, 8); i++) {
      sum += data[i];
    }
    return sum / 8 / 255;
  };

  // Smooth data for fluid animations
  const smoothData = (newValue: number, oldValue: number, factor: number = 0.3): number => {
    return oldValue + (newValue - oldValue) * factor;
  };

  // High-performance update loop - runs even when paused to show dark state
  useEffect(() => {
    if (!isReady) return;

    const update = (timestamp: number) => {
      // Throttle to 60fps (16.67ms between frames)
      if (timestamp - lastUpdateRef.current < 16) {
        rafRef.current = requestAnimationFrame(update);
        return;
      }
      const delta = timestamp - lastUpdateRef.current;
      lastUpdateRef.current = timestamp;

      // Only update time if playing
      if (isPlaying) {
        timeRef.current += delta / 1000;
      }

      const step = frequencyData && frequencyData.length > 0 ? Math.floor(frequencyData.length / barCount) : 1;
      const avgEnergy = isPlaying && frequencyData ? getAverageEnergy(frequencyData) : 0;
      const bassEnergy = isPlaying && frequencyData ? getBassEnergy(frequencyData) : 0;

      // Rotate hue based on energy (only when playing)
      if (isPlaying) {
        hueRotationRef.current += avgEnergy * 0.5;
      }

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;

        // Get raw value from frequency data, or 0 if paused/no data
        const index = frequencyData && frequencyData.length > 0 ? Math.min(i * step, frequencyData.length - 1) : 0;
        const rawValue = isPlaying && frequencyData && frequencyData.length > 0 ? frequencyData[index] / 255 : 0;

        // Smooth the value - decay to 0 when paused
        const targetValue = isPlaying ? rawValue : 0;
        smoothedDataRef.current[i] = smoothData(targetValue, smoothedDataRef.current[i] || 0, isPlaying ? 0.4 : 0.1);
        const value = smoothedDataRef.current[i];

        // Dynamic hue based on position and energy
        const baseHue = (i / barCount) * 280 + hueRotationRef.current;
        const dynamicHue = baseHue + avgEnergy * 60;

        // When paused, use darker, desaturated colors
        const saturation = isPlaying ? (70 + value * 30) : 15;
        const lightness = isPlaying ? (45 + value * 25) : 20;

        if (variant === "bars") {
          // Enhanced bars with glow - minimum height when paused
          const scale = Math.max(0.05, value);
          bar.style.transform = `scaleY(${scale})`;
          bar.style.backgroundColor = `hsl(${dynamicHue % 360}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = isPlaying && value > 0.5
            ? `0 0 ${20 * value}px ${10 * value}px hsla(${dynamicHue % 360}, 90%, 60%, ${value * 0.6})`
            : 'none';
          bar.style.opacity = isPlaying ? `${0.6 + value * 0.4}` : '0.4';
        } else if (variant === "wave") {
          // Enhanced wave with flowing motion
          const wavePhase = (i / barCount) * Math.PI * 4 + timeRef.current * 3;
          const waveHeight = isPlaying ? Math.sin(wavePhase) * 30 * (0.3 + avgEnergy * 0.7) : 0;
          const scale = Math.max(0.15, value);
          bar.style.transform = `translateY(${waveHeight}px) scaleY(${scale})`;
          bar.style.backgroundColor = `hsl(${(dynamicHue + i * 3) % 360}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = isPlaying ? `0 0 ${15 * value}px ${5 * value}px hsla(${dynamicHue % 360}, 80%, 60%, ${value * 0.5})` : 'none';
        } else if (variant === "pulse") {
          // Enhanced pulse with breathing effect
          const breathe = isPlaying ? Math.sin(timeRef.current * 2 + i * 0.5) * 0.1 : 0;
          const scale = 0.8 + value * 0.6 + breathe + bassEnergy * 0.3;
          const ringHue = (dynamicHue + i * 60) % 360;
          bar.style.transform = `scale(${scale})`;
          bar.style.borderColor = `hsla(${ringHue}, ${saturation}%, ${isPlaying ? 50 + value * 30 : 25}%, ${isPlaying ? 0.3 + value * 0.5 : 0.2})`;
          bar.style.boxShadow = isPlaying
            ? `0 0 ${40 * value}px ${15 * value}px hsla(${ringHue}, 80%, 50%, ${value * 0.4}),
               inset 0 0 ${20 * value}px hsla(${ringHue}, 80%, 70%, ${value * 0.2})`
            : 'none';
        } else if (variant === "circle") {
          // Enhanced circular with orbital motion
          const angle = (i / barCount) * Math.PI * 2 + (isPlaying ? timeRef.current * 0.5 : 0);
          const baseRadius = 35 + (size === "sm" || size === "md" ? 20 : 45);
          const dynamicRadius = baseRadius + (isPlaying ? value * 50 + bassEnergy * 20 : 0);
          const x = Math.cos(angle) * dynamicRadius;
          const y = Math.sin(angle) * dynamicRadius;
          const particleScale = 0.3 + value * 1.2;
          const orbitHue = (dynamicHue + (i / barCount) * 120) % 360;
          bar.style.transform = `translate(${x}px, ${y}px) scale(${particleScale})`;
          bar.style.backgroundColor = `hsl(${orbitHue}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = isPlaying ? `0 0 ${20 * value}px ${8 * value}px hsla(${orbitHue}, 90%, 60%, ${value * 0.7})` : 'none';
        } else if (variant === "dots") {
          // Enhanced dots with pulsing grid
          const gridPulse = isPlaying ? Math.sin(timeRef.current * 4 + (i % 5) * 0.3 + Math.floor(i / 5) * 0.3) * 0.15 : 0;
          const scale = 0.4 + value * 1.8 + gridPulse + bassEnergy * 0.5;
          const dotHue = (dynamicHue + i * 15) % 360;
          bar.style.transform = `scale(${Math.max(0.3, scale)})`;
          bar.style.backgroundColor = `hsl(${dotHue}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = isPlaying ? `0 0 ${25 * value}px ${12 * value}px hsla(${dotHue}, 90%, 55%, ${value * 0.6})` : 'none';
          bar.style.opacity = isPlaying ? `${0.5 + value * 0.5}` : '0.3';
        } else if (variant === "lines") {
          // Enhanced lines with streaming effect
          const stream = isPlaying ? Math.sin(timeRef.current * 3 + i * 0.5) * 0.1 : 0;
          const scale = Math.max(0.08, value + stream);
          const lineHue = (dynamicHue + i * 20) % 360;
          bar.style.transform = `scaleX(${scale})`;
          bar.style.backgroundColor = `hsl(${lineHue}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = isPlaying ? `0 0 ${15 * value}px ${5 * value}px hsla(${lineHue}, 85%, 60%, ${value * 0.5})` : 'none';
          bar.style.opacity = isPlaying ? `${0.7 + value * 0.3}` : '0.3';
        }
      });

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [frequencyData, barCount, variant, isReady, size, isPlaying]);

  // Enhanced Bars Visualizer
  if (variant === "bars") {
    return (
      <div ref={containerRef} className={`${containerClass} flex items-end justify-center gap-[2px] px-2 relative`}>
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent opacity-50" />
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            ref={el => { if (el) barsRef.current[i] = el; }}
            className="flex-1 max-w-[8px] h-full rounded-t-full origin-bottom"
            style={{
              background: `linear-gradient(to top, hsl(${(i / barCount) * 280}, 80%, 50%), hsl(${(i / barCount) * 280 + 40}, 90%, 65%))`,
              transform: 'scaleY(0.05)',
              willChange: 'transform, opacity, box-shadow',
              transition: 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Enhanced Wave Visualizer
  if (variant === "wave") {
    return (
      <div ref={containerRef} className={`${containerClass} flex items-center justify-center gap-[1px] relative overflow-hidden`}>
        {/* Reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            ref={el => { if (el) barsRef.current[i] = el; }}
            className="w-[3px] md:w-1 h-16 md:h-24 rounded-full origin-center"
            style={{
              background: `linear-gradient(to top, hsl(${(i / barCount) * 360}, 85%, 45%), hsl(${(i / barCount) * 360 + 60}, 90%, 60%))`,
              transform: 'translateY(0) scaleY(0.15)',
              willChange: 'transform, box-shadow',
              transition: 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Enhanced Pulse Visualizer
  if (variant === "pulse") {
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        {/* Central glow */}
        <div className="absolute w-1/4 h-1/4 bg-white/30 rounded-full blur-xl animate-pulse" />
        {[0, 1, 2, 3, 4].map((ring) => (
          <div
            key={ring}
            ref={el => { if (el) barsRef.current[ring] = el; }}
            className="absolute rounded-full border-2"
            style={{
              width: `${20 + ring * 16}%`,
              height: `${20 + ring * 16}%`,
              borderColor: `hsla(${280 + ring * 35}, 80%, 60%, ${0.7 - ring * 0.12})`,
              background: ring === 0
                ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
                : 'transparent',
              transform: 'scale(1)',
              willChange: 'transform, box-shadow, border-color',
              transition: 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Enhanced Circle Visualizer
  if (variant === "circle") {
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        {/* Central core */}
        <div className="absolute w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-white/40 to-white/10 rounded-full blur-sm" />
        <div className="absolute w-4 h-4 md:w-6 md:h-6 bg-white/60 rounded-full" />
        <div className="absolute w-full h-full flex items-center justify-center">
          {Array.from({ length: barCount }).map((_, i) => (
            <div
              key={i}
              ref={el => { if (el) barsRef.current[i] = el; }}
              className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full origin-center"
              style={{
                background: `radial-gradient(circle, hsl(${(i / barCount) * 360}, 90%, 70%), hsl(${(i / barCount) * 360}, 80%, 50%))`,
                transform: 'translate(0, 0) scale(0.3)',
                willChange: 'transform, box-shadow',
                transition: 'none',
              }}
            />
          ))}
        </div>
        {/* Outer glow ring */}
        <div className="absolute w-[85%] h-[85%] rounded-full border border-white/10" />
      </div>
    );
  }

  // Enhanced Dots Visualizer
  if (variant === "dots") {
    const gridSize = Math.sqrt(barCount);
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        {/* Background grid glow */}
        <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-purple-500/5 to-transparent" />
        <div className={`grid gap-3 md:gap-4`} style={{ gridTemplateColumns: `repeat(${Math.ceil(gridSize)}, 1fr)` }}>
          {Array.from({ length: barCount }).map((_, i) => (
            <div
              key={i}
              ref={el => { if (el) barsRef.current[i] = el; }}
              className="w-3 h-3 md:w-4 md:h-4 rounded-full"
              style={{
                background: `radial-gradient(circle, hsl(${(i / barCount) * 300 + 180}, 85%, 65%), hsl(${(i / barCount) * 300 + 200}, 75%, 45%))`,
                transform: 'scale(0.4)',
                willChange: 'transform, opacity, box-shadow',
                transition: 'none',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Enhanced Lines Visualizer
  return (
    <div ref={containerRef} className={`${containerClass} flex flex-col items-center justify-center gap-1.5 md:gap-2 relative`}>
      {/* Horizontal glow lines */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent" />
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={el => { if (el) barsRef.current[i] = el; }}
          className="h-1 md:h-1.5 w-full rounded-full origin-left"
          style={{
            background: `linear-gradient(to right, hsl(${(i / barCount) * 240 + 200}, 80%, 55%), hsl(${(i / barCount) * 240 + 260}, 90%, 65%))`,
            transform: 'scaleX(0.08)',
            willChange: 'transform, opacity, box-shadow',
            transition: 'none',
          }}
        />
      ))}
    </div>
  );
};
