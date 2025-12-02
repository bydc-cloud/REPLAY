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
  // Get audio data from real audio, or use demo mode if no audio element
  const { frequencyData: realFrequencyData } = useAudioAnalyzer(audioElement);
  const demoMode = !audioElement;
  const demoTimeRef = useRef<number>(0);

  // Generate demo frequency data for settings preview
  const frequencyData = useMemo(() => {
    if (!demoMode || !isPlaying) return realFrequencyData;
    return null; // Will be generated in animation loop
  }, [demoMode, isPlaying, realFrequencyData]);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const barsRef = useRef<HTMLDivElement[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const smoothedDataRef = useRef<number[]>([]);
  const hueRotationRef = useRef<number>(0);
  const velocityRef = useRef<number[]>([]); // For momentum-based smoothing

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
    velocityRef.current = new Array(barCount).fill(0);
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

  // Enhanced smoothing with momentum for fluid, reactive animations
  const smoothDataWithMomentum = (
    newValue: number,
    oldValue: number,
    velocity: number,
    index: number,
    isRising: boolean
  ): { value: number; velocity: number } => {
    // Use faster response when rising, slower decay when falling
    const attackFactor = 0.5; // Quick response to increases
    const releaseFactor = 0.15; // Smooth decay
    const factor = isRising ? attackFactor : releaseFactor;

    // Add momentum for smoother motion
    const momentum = 0.3;
    const targetVelocity = (newValue - oldValue) * factor;
    const newVelocity = velocity * momentum + targetVelocity * (1 - momentum);
    const smoothedValue = oldValue + newVelocity;

    return {
      value: Math.max(0, Math.min(1, smoothedValue)),
      velocity: newVelocity
    };
  };

  // Generate demo frequency data for preview mode
  const generateDemoData = (time: number): Uint8Array => {
    const data = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      // Create a dynamic wave pattern
      const wave1 = Math.sin(time * 2 + i * 0.2) * 0.5 + 0.5;
      const wave2 = Math.sin(time * 1.5 + i * 0.15 + 1) * 0.3 + 0.5;
      const wave3 = Math.sin(time * 3 + i * 0.3 + 2) * 0.2 + 0.5;
      const bass = i < 10 ? Math.sin(time * 4) * 0.4 + 0.6 : 0.5;
      const combined = (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.2 + bass * 0.1);
      data[i] = Math.floor(combined * 180 + Math.random() * 30);
    }
    return data;
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
        demoTimeRef.current += delta / 1000;
      }

      // Use demo data if in demo mode and playing, otherwise use real data
      const activeFrequencyData = demoMode && isPlaying
        ? generateDemoData(demoTimeRef.current)
        : frequencyData;

      const step = activeFrequencyData && activeFrequencyData.length > 0 ? Math.floor(activeFrequencyData.length / barCount) : 1;
      const avgEnergy = isPlaying && activeFrequencyData ? getAverageEnergy(activeFrequencyData) : 0;
      const bassEnergy = isPlaying && activeFrequencyData ? getBassEnergy(activeFrequencyData) : 0;

      // Rotate hue based on energy (only when playing)
      if (isPlaying) {
        hueRotationRef.current += avgEnergy * 0.5;
      }

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;

        // Get raw value from frequency data, or 0 if paused/no data
        const index = activeFrequencyData && activeFrequencyData.length > 0 ? Math.min(i * step, activeFrequencyData.length - 1) : 0;
        const rawValue = isPlaying && activeFrequencyData && activeFrequencyData.length > 0 ? activeFrequencyData[index] / 255 : 0;

        // Enhanced momentum-based smoothing for fluid, reactive animations
        const targetValue = isPlaying ? rawValue : 0;
        const currentValue = smoothedDataRef.current[i] || 0;
        const currentVelocity = velocityRef.current[i] || 0;
        const isRising = targetValue > currentValue;

        const { value, velocity } = smoothDataWithMomentum(
          targetValue,
          currentValue,
          currentVelocity,
          i,
          isRising
        );

        smoothedDataRef.current[i] = value;
        velocityRef.current[i] = velocity;

        // Premium color palette - clean monochrome with subtle accent
        const baseHue = (i / barCount) * 60 + hueRotationRef.current * 0.3; // Subtle hue shift
        const dynamicHue = 220 + baseHue * 0.2 + avgEnergy * 20; // Cool blue-purple range

        // Premium muted colors - no harsh saturation
        const saturation = isPlaying ? (40 + value * 25) : 10;
        const lightness = isPlaying ? (55 + value * 20) : 25;

        if (variant === "bars") {
          // Clean bars without glow - premium minimal style
          const scale = Math.max(0.03, value);
          bar.style.transform = `scaleY(${scale})`;
          bar.style.backgroundColor = `hsl(${dynamicHue % 360}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = 'none'; // No glow
          bar.style.opacity = isPlaying ? `${0.7 + value * 0.3}` : '0.3';
        } else if (variant === "wave") {
          // Fluid wave with smooth motion
          const wavePhase = (i / barCount) * Math.PI * 4 + timeRef.current * 2.5;
          const waveHeight = isPlaying ? Math.sin(wavePhase) * 25 * (0.4 + avgEnergy * 0.6) : 0;
          const scale = Math.max(0.12, value);
          bar.style.transform = `translateY(${waveHeight}px) scaleY(${scale})`;
          bar.style.backgroundColor = `hsl(${(dynamicHue + i * 2) % 360}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = 'none'; // No glow
          bar.style.opacity = isPlaying ? `${0.7 + value * 0.3}` : '0.3';
        } else if (variant === "pulse") {
          // Clean pulsing rings without heavy glow
          const breathe = isPlaying ? Math.sin(timeRef.current * 2 + i * 0.5) * 0.08 : 0;
          const scale = 0.85 + value * 0.5 + breathe + bassEnergy * 0.25;
          const ringHue = (dynamicHue + i * 50) % 360;
          bar.style.transform = `scale(${scale})`;
          bar.style.borderColor = `hsla(${ringHue}, ${saturation}%, ${isPlaying ? 55 + value * 25 : 30}%, ${isPlaying ? 0.4 + value * 0.4 : 0.25})`;
          bar.style.boxShadow = 'none'; // No glow - clean look
        } else if (variant === "circle") {
          // Orbital particles with smooth motion
          const angle = (i / barCount) * Math.PI * 2 + (isPlaying ? timeRef.current * 0.4 : 0);
          const baseRadius = 35 + (size === "sm" || size === "md" ? 18 : 40);
          const dynamicRadius = baseRadius + (isPlaying ? value * 40 + bassEnergy * 15 : 0);
          const x = Math.cos(angle) * dynamicRadius;
          const y = Math.sin(angle) * dynamicRadius;
          const particleScale = 0.4 + value * 1.0;
          const orbitHue = (dynamicHue + (i / barCount) * 100) % 360;
          bar.style.transform = `translate(${x}px, ${y}px) scale(${particleScale})`;
          bar.style.backgroundColor = `hsl(${orbitHue}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = 'none'; // No glow
          bar.style.opacity = isPlaying ? `${0.6 + value * 0.4}` : '0.3';
        } else if (variant === "dots") {
          // Clean grid dots without heavy glow
          const gridPulse = isPlaying ? Math.sin(timeRef.current * 3.5 + (i % 5) * 0.4 + Math.floor(i / 5) * 0.4) * 0.12 : 0;
          const scale = 0.5 + value * 1.5 + gridPulse + bassEnergy * 0.4;
          const dotHue = (dynamicHue + i * 12) % 360;
          bar.style.transform = `scale(${Math.max(0.35, scale)})`;
          bar.style.backgroundColor = `hsl(${dotHue}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = 'none'; // No glow
          bar.style.opacity = isPlaying ? `${0.6 + value * 0.4}` : '0.3';
        } else if (variant === "lines") {
          // Streaming lines with fluid motion
          const stream = isPlaying ? Math.sin(timeRef.current * 2.5 + i * 0.6) * 0.08 : 0;
          const scale = Math.max(0.1, value + stream);
          const lineHue = (dynamicHue + i * 18) % 360;
          bar.style.transform = `scaleX(${scale})`;
          bar.style.backgroundColor = `hsl(${lineHue}, ${saturation}%, ${lightness}%)`;
          bar.style.boxShadow = 'none'; // No glow
          bar.style.opacity = isPlaying ? `${0.7 + value * 0.3}` : '0.3';
        }
      });

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [frequencyData, barCount, variant, isReady, size, isPlaying, demoMode]);

  // Enhanced Bars Visualizer - Premium minimal style
  if (variant === "bars") {
    return (
      <div ref={containerRef} className={`${containerClass} flex items-end justify-center gap-[2px] px-2 relative`}>
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            ref={el => { if (el) barsRef.current[i] = el; }}
            className="flex-1 max-w-[6px] h-full rounded-t-sm origin-bottom"
            style={{
              background: `linear-gradient(to top, hsl(${220 + (i / barCount) * 30}, 45%, 55%), hsl(${230 + (i / barCount) * 25}, 50%, 65%))`,
              transform: 'scaleY(0.03)',
              willChange: 'transform, opacity',
              transition: 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Enhanced Wave Visualizer - Smooth flowing motion
  if (variant === "wave") {
    return (
      <div ref={containerRef} className={`${containerClass} flex items-center justify-center gap-[1px] relative overflow-hidden`}>
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            ref={el => { if (el) barsRef.current[i] = el; }}
            className="w-[3px] md:w-1 h-16 md:h-24 rounded-sm origin-center"
            style={{
              background: `linear-gradient(to top, hsl(${220 + (i / barCount) * 25}, 40%, 50%), hsl(${230 + (i / barCount) * 20}, 45%, 60%))`,
              transform: 'translateY(0) scaleY(0.12)',
              willChange: 'transform, opacity',
              transition: 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Enhanced Pulse Visualizer - Clean concentric rings
  if (variant === "pulse") {
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        {/* Subtle central accent */}
        <div className="absolute w-1/6 h-1/6 bg-white/15 rounded-full" />
        {[0, 1, 2, 3, 4].map((ring) => (
          <div
            key={ring}
            ref={el => { if (el) barsRef.current[ring] = el; }}
            className="absolute rounded-full border"
            style={{
              width: `${20 + ring * 16}%`,
              height: `${20 + ring * 16}%`,
              borderColor: `hsla(${220 + ring * 25}, 40%, 55%, ${0.5 - ring * 0.08})`,
              borderWidth: '1.5px',
              background: 'transparent',
              transform: 'scale(1)',
              willChange: 'transform, border-color',
              transition: 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Enhanced Circle Visualizer - Orbital particles
  if (variant === "circle") {
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        {/* Clean central core */}
        <div className="absolute w-4 h-4 md:w-5 md:h-5 bg-white/40 rounded-full" />
        <div className="absolute w-full h-full flex items-center justify-center">
          {Array.from({ length: barCount }).map((_, i) => (
            <div
              key={i}
              ref={el => { if (el) barsRef.current[i] = el; }}
              className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full origin-center"
              style={{
                background: `hsl(${220 + (i / barCount) * 40}, 45%, 60%)`,
                transform: 'translate(0, 0) scale(0.4)',
                willChange: 'transform, opacity',
                transition: 'none',
              }}
            />
          ))}
        </div>
        {/* Subtle outer ring */}
        <div className="absolute w-[80%] h-[80%] rounded-full border border-white/8" />
      </div>
    );
  }

  // Enhanced Dots Visualizer - Clean grid
  if (variant === "dots") {
    const gridSize = Math.sqrt(barCount);
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        <div className={`grid gap-3 md:gap-4`} style={{ gridTemplateColumns: `repeat(${Math.ceil(gridSize)}, 1fr)` }}>
          {Array.from({ length: barCount }).map((_, i) => (
            <div
              key={i}
              ref={el => { if (el) barsRef.current[i] = el; }}
              className="w-3 h-3 md:w-4 md:h-4 rounded-full"
              style={{
                background: `hsl(${220 + (i / barCount) * 35}, 40%, 55%)`,
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

  // Enhanced Lines Visualizer - Streaming bars
  return (
    <div ref={containerRef} className={`${containerClass} flex flex-col items-center justify-center gap-1.5 md:gap-2 relative`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={el => { if (el) barsRef.current[i] = el; }}
          className="h-1 md:h-1.5 w-full rounded-sm origin-left"
          style={{
            background: `linear-gradient(to right, hsl(${220 + (i / barCount) * 30}, 40%, 50%), hsl(${230 + (i / barCount) * 25}, 45%, 60%))`,
            transform: 'scaleX(0.1)',
            willChange: 'transform, opacity',
            transition: 'none',
          }}
        />
      ))}
    </div>
  );
};
