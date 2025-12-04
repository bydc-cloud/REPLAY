import { useEffect, useRef, useState, useMemo } from "react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { useSettings } from "../contexts/SettingsContext";

interface PerformantVisualizerProps {
  isPlaying: boolean;
  variant?: "bars" | "wave" | "pulse" | "circle" | "dots" | "lines";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  audioElement?: HTMLAudioElement | null;
}

/**
 * Ultra-smooth 60fps visualizer using GPU-accelerated transforms
 * Key optimizations:
 * 1. Only use transform and opacity (GPU composited properties)
 * 2. Pre-computed gradients (no recalculation per frame)
 * 3. Cubic interpolation for butter-smooth motion
 * 4. Minimal box-shadow (only on high values, simpler layers)
 */
export const PerformantVisualizer = ({
  isPlaying,
  variant = "bars",
  size = "full",
  audioElement
}: PerformantVisualizerProps) => {
  // Get audio data from real audio, or use demo mode if no audio element
  const { frequencyData: realFrequencyData } = useAudioAnalyzer(audioElement);
  const { themeMode } = useSettings();
  const isMP3Theme = themeMode === "mp3player";
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
  const targetDataRef = useRef<number[]>([]); // Target values for interpolation
  const hueRotationRef = useRef<number>(0);
  const velocityRef = useRef<number[]>([]); // For momentum-based smoothing
  const peakRef = useRef<number[]>([]); // Track peaks for more dynamic visuals

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
    if (variant === "bars") return isMobile ? 32 : 64;
    if (variant === "circle") return isMobile ? 48 : 96;
    if (variant === "dots") return isMobile ? 25 : 36;
    if (variant === "lines") return isMobile ? 16 : 24;
    if (variant === "wave") return isMobile ? 48 : 96;
    if (variant === "pulse") return 6;
    return 32;
  }, [variant]);

  // Initialize bars with refs
  useEffect(() => {
    setIsReady(true);
    smoothedDataRef.current = new Array(barCount).fill(0);
    targetDataRef.current = new Array(barCount).fill(0);
    velocityRef.current = new Array(barCount).fill(0);
    peakRef.current = new Array(barCount).fill(0);
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

  // Get bass energy (low frequencies) - drives the "punch"
  const getBassEnergy = (data: Uint8Array): number => {
    if (!data || data.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < Math.min(data.length, 6); i++) {
      sum += data[i];
    }
    return sum / 6 / 255;
  };

  // Get mid energy (vocals, melody)
  const getMidEnergy = (data: Uint8Array): number => {
    if (!data || data.length === 0) return 0;
    let sum = 0;
    for (let i = 8; i < Math.min(data.length, 24); i++) {
      sum += data[i];
    }
    return sum / 16 / 255;
  };

  // Get high energy (hi-hats, cymbals)
  const getHighEnergy = (data: Uint8Array): number => {
    if (!data || data.length === 0) return 0;
    let sum = 0;
    for (let i = 24; i < Math.min(data.length, 48); i++) {
      sum += data[i];
    }
    return sum / 24 / 255;
  };

  // Premium cubic easing for buttery smooth motion
  // Using spring physics for natural, responsive feel
  const smoothDataWithSpring = (
    targetValue: number,
    currentValue: number,
    velocity: number,
    deltaTime: number
  ): { value: number; velocity: number } => {
    // Spring physics constants - tuned for premium feel
    const stiffness = 180; // How quickly it responds (higher = snappier)
    const damping = 18; // How quickly oscillations die (higher = less bouncy)
    const mass = 1;

    // Calculate spring force
    const displacement = targetValue - currentValue;
    const springForce = stiffness * displacement;
    const dampingForce = damping * velocity;
    const acceleration = (springForce - dampingForce) / mass;

    // Integrate velocity and position
    const dt = Math.min(deltaTime / 1000, 0.033); // Cap at ~30fps worth of delta
    const newVelocity = velocity + acceleration * dt;
    const newValue = currentValue + newVelocity * dt;

    return {
      value: Math.max(0, Math.min(1, newValue)),
      velocity: newVelocity
    };
  };

  // Generate demo frequency data for preview mode - more dynamic
  const generateDemoData = (time: number): Uint8Array => {
    const data = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      // Create a more dynamic, music-like wave pattern
      const bass = i < 8 ? (Math.sin(time * 3) * 0.5 + 0.5) * (Math.sin(time * 6) * 0.3 + 0.7) : 0;
      const mid = i >= 8 && i < 24 ? Math.sin(time * 4 + i * 0.1) * 0.4 + 0.5 : 0;
      const high = i >= 24 ? Math.sin(time * 5 + i * 0.15) * 0.3 + 0.4 : 0;
      const wave = Math.sin(time * 2 + i * 0.2) * 0.3 + 0.5;
      const beat = Math.sin(time * 8) > 0.7 ? 0.3 : 0;
      const combined = (bass * 0.4 + mid * 0.25 + high * 0.15 + wave * 0.1 + beat * 0.1);
      data[i] = Math.floor(combined * 220 + Math.random() * 35);
    }
    return data;
  };

  // High-performance update loop - runs even when paused to show dark state
  useEffect(() => {
    if (!isReady) return;

    const update = (timestamp: number) => {
      // Let browser handle timing naturally - no manual throttling for smooth 60fps
      const delta = Math.min(timestamp - lastUpdateRef.current, 50); // Cap delta to prevent jumps
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
      const midEnergy = isPlaying && activeFrequencyData ? getMidEnergy(activeFrequencyData) : 0;
      const highEnergy = isPlaying && activeFrequencyData ? getHighEnergy(activeFrequencyData) : 0;

      // Rotate hue based on energy (only when playing) - faster rotation for more dynamic colors
      if (isPlaying) {
        hueRotationRef.current += (avgEnergy * 1.5 + bassEnergy * 0.8);
      }

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;

        // Get raw value from frequency data, or 0 if paused/no data
        const index = activeFrequencyData && activeFrequencyData.length > 0 ? Math.min(i * step, activeFrequencyData.length - 1) : 0;
        const rawValue = isPlaying && activeFrequencyData && activeFrequencyData.length > 0 ? activeFrequencyData[index] / 255 : 0;

        // Spring physics smoothing for buttery smooth, reactive animations
        const targetValue = isPlaying ? rawValue : 0;
        const currentValue = smoothedDataRef.current[i] || 0;
        const currentVelocity = velocityRef.current[i] || 0;

        const { value, velocity } = smoothDataWithSpring(
          targetValue,
          currentValue,
          currentVelocity,
          delta
        );

        smoothedDataRef.current[i] = value;
        velocityRef.current[i] = velocity;

        // Track peaks for extra visual punch
        if (value > peakRef.current[i]) {
          peakRef.current[i] = value;
        } else {
          peakRef.current[i] *= 0.98; // Slow decay of peak
        }

        // For MP3 player theme - use vibrant green palette
        if (isMP3Theme) {
          const greenIntensity = 136 + value * 40; // 136-176 range for green
          const brightness = 50 + value * 30;

          if (variant === "bars") {
            const scale = Math.max(0.03, value);
            bar.style.transform = `scaleY(${scale})`;
            bar.style.backgroundColor = `hsl(145, 100%, ${brightness}%)`;
            bar.style.boxShadow = isPlaying ? `0 0 ${4 + value * 8}px rgba(0, ${greenIntensity}, 100, 0.5)` : 'none';
            bar.style.opacity = isPlaying ? `${0.7 + value * 0.3}` : '0.3';
          } else {
            // Apply similar styling to other variants in MP3 theme
            bar.style.backgroundColor = `hsl(145, 100%, ${brightness}%)`;
          }
          return;
        }

        // WARM→COOL frequency spectrum: bass=red/orange, mids=yellow/green, highs=cyan/blue/purple
        const position = i / barCount;

        // Frequency-band based hue (warm to cool)
        // Bass (0-12.5%): Red (0°) to Orange (30°)
        // Low-mid (12.5-25%): Orange (30°) to Yellow (60°)
        // Mid (25-50%): Yellow (60°) to Green (120°)
        // High-mid (50-75%): Green (120°) to Cyan (180°) to Blue (240°)
        // High (75-100%): Blue (240°) to Purple (280°)
        let frequencyHue: number;
        if (position < 0.125) {
          // Sub-bass to bass: Red to Orange
          frequencyHue = position / 0.125 * 30;
        } else if (position < 0.25) {
          // Bass to low-mid: Orange to Yellow
          frequencyHue = 30 + (position - 0.125) / 0.125 * 30;
        } else if (position < 0.5) {
          // Low-mid to mid: Yellow to Green
          frequencyHue = 60 + (position - 0.25) / 0.25 * 60;
        } else if (position < 0.75) {
          // Mid to high-mid: Green to Blue
          frequencyHue = 120 + (position - 0.5) / 0.25 * 120;
        } else {
          // High-mid to high: Blue to Purple
          frequencyHue = 240 + (position - 0.75) / 0.25 * 40;
        }

        // Add subtle energy-reactive hue shift (±20° based on current value intensity)
        const energyHueShift = (value - 0.5) * 20;
        const dynamicHue = (frequencyHue + energyHueShift + hueRotationRef.current * 0.1) % 360;

        // FULL saturation on peaks (80-100%), higher lightness range
        const saturation = isPlaying ? Math.min(100, 80 + value * 25) : 15;
        const lightness = isPlaying ? (45 + value * 20 + avgEnergy * 8) : 20;

        if (variant === "bars") {
          // Premium bars with optimized GPU-accelerated glow
          const scale = Math.max(0.03, value * 1.15);
          const barHue = dynamicHue;
          // Only transform + opacity for GPU compositing (no layout thrashing)
          bar.style.transform = `translateZ(0) scaleY(${scale})`;
          bar.style.opacity = isPlaying ? `${0.7 + value * 0.3}` : '0.25';
          // Simplified 2-layer glow (much faster than 5-layer)
          // Only apply glow at higher thresholds to reduce paint operations
          if (isPlaying && value > 0.25) {
            const g = value * value; // Quadratic for more natural intensity
            bar.style.boxShadow = `0 0 ${8 + g * 12}px hsla(${barHue}, 100%, 60%, ${0.4 + g * 0.4}),
             0 0 ${16 + g * 20}px hsla(${barHue}, 90%, 50%, ${0.15 + g * 0.2})`;
          } else {
            bar.style.boxShadow = 'none';
          }
        } else if (variant === "wave") {
          // Silky smooth flowing wave - optimized for 60fps
          const wavePhase = position * Math.PI * 4 + timeRef.current * 2.5; // Slightly slower for smoother motion
          const waveHeight = isPlaying ? Math.sin(wavePhase) * 25 * (0.4 + avgEnergy * 0.6) : 0;
          const scale = Math.max(0.15, value * 1.1);
          const waveHue = (dynamicHue + position * 60) % 360;
          // GPU-accelerated transform only
          bar.style.transform = `translateZ(0) translateY(${waveHeight}px) scaleY(${scale})`;
          bar.style.opacity = isPlaying ? `${0.8 + value * 0.2}` : '0.25';
          // Simplified single-layer glow
          if (isPlaying && value > 0.3) {
            const g = value * value;
            bar.style.boxShadow = `0 0 ${10 + g * 15}px hsla(${waveHue}, 100%, 55%, ${0.35 + g * 0.35})`;
          } else {
            bar.style.boxShadow = 'none';
          }
        } else if (variant === "pulse") {
          // Smooth pulsing rings - optimized for buttery motion
          const breathe = isPlaying ? Math.sin(timeRef.current * 2 + i * 0.5) * 0.08 : 0;
          const scale = 0.85 + value * 0.5 + breathe + bassEnergy * 0.25;
          const ringHue = (dynamicHue + i * 50) % 360;
          // GPU-accelerated transform
          bar.style.transform = `translateZ(0) scale(${scale})`;
          bar.style.borderColor = `hsla(${ringHue}, ${saturation}%, ${isPlaying ? 55 + value * 25 : 25}%, ${isPlaying ? 0.6 + value * 0.4 : 0.2})`;
          // Simplified 2-layer glow
          if (isPlaying && value > 0.3) {
            const g = value * value;
            bar.style.boxShadow = `0 0 ${12 + g * 18}px hsla(${ringHue}, 100%, 60%, ${0.35 + g * 0.35}),
             inset 0 0 ${8 + g * 10}px hsla(${ringHue}, 100%, 70%, ${0.1 + g * 0.15})`;
          } else {
            bar.style.boxShadow = 'none';
          }
        } else if (variant === "circle") {
          // Silky smooth orbital particles
          const baseAngle = position * Math.PI * 2;
          const dynamicAngle = baseAngle + (isPlaying ? timeRef.current * 0.4 : 0); // Slower, smoother rotation
          const baseRadius = 35 + (size === "sm" || size === "md" ? 15 : 45);
          const dynamicRadius = baseRadius + (isPlaying ? value * 40 + bassEnergy * 15 : 0);
          const x = Math.cos(dynamicAngle) * dynamicRadius;
          const y = Math.sin(dynamicAngle) * dynamicRadius;
          const particleScale = 0.6 + value * 1.0;
          const orbitHue = (dynamicHue + position * 100) % 360;
          // GPU-accelerated transform
          bar.style.transform = `translateZ(0) translate(${x}px, ${y}px) scale(${particleScale})`;
          bar.style.opacity = isPlaying ? `${0.75 + value * 0.25}` : '0.2';
          // Single-layer glow for smooth performance
          if (isPlaying && value > 0.25) {
            const g = value * value;
            bar.style.boxShadow = `0 0 ${10 + g * 15}px hsla(${orbitHue}, 100%, 60%, ${0.4 + g * 0.4})`;
          } else {
            bar.style.boxShadow = 'none';
          }
        } else if (variant === "dots") {
          // Smooth reactive grid with gentle ripples
          const gridX = i % Math.ceil(Math.sqrt(barCount));
          const gridY = Math.floor(i / Math.ceil(Math.sqrt(barCount)));
          const distFromCenter = Math.sqrt(Math.pow(gridX - Math.sqrt(barCount)/2, 2) + Math.pow(gridY - Math.sqrt(barCount)/2, 2));
          const ripple = isPlaying ? Math.sin(timeRef.current * 3 - distFromCenter * 0.4) * 0.12 : 0;
          const scale = 0.5 + value * 1.5 + ripple + bassEnergy * 0.3;
          const dotHue = (dynamicHue + i * 8 + distFromCenter * 12) % 360;
          // GPU-accelerated transform
          bar.style.transform = `translateZ(0) scale(${Math.max(0.35, scale)})`;
          bar.style.opacity = isPlaying ? `${0.75 + value * 0.25}` : '0.2';
          // Single-layer glow
          if (isPlaying && value > 0.3) {
            const g = value * value;
            bar.style.boxShadow = `0 0 ${8 + g * 12}px hsla(${dotHue}, 100%, 60%, ${0.4 + g * 0.4})`;
          } else {
            bar.style.boxShadow = 'none';
          }
        } else if (variant === "lines") {
          // Silky smooth streaming lines (you like this one!)
          const stream = isPlaying ? Math.sin(timeRef.current * 2.5 + i * 0.6) * 0.08 : 0;
          const scale = Math.max(0.1, value * 1.05 + stream + highEnergy * 0.15);
          const lineHue = (dynamicHue + i * 12) % 360;
          // GPU-accelerated transform
          bar.style.transform = `translateZ(0) scaleX(${scale})`;
          bar.style.opacity = isPlaying ? `${0.8 + value * 0.2}` : '0.2';
          // Single-layer glow for smooth streaming
          if (isPlaying && value > 0.25) {
            const g = value * value;
            bar.style.boxShadow = `0 0 ${8 + g * 12}px hsla(${lineHue}, 100%, 60%, ${0.35 + g * 0.4})`;
          } else {
            bar.style.boxShadow = 'none';
          }
        }
      });

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [frequencyData, barCount, variant, isReady, size, isPlaying, demoMode, isMP3Theme]);

  // Enhanced Bars Visualizer - VIBRANT rainbow style
  if (variant === "bars") {
    return (
      <div ref={containerRef} className={`${containerClass} flex items-end justify-center gap-[2px] px-2 relative`}>
        {Array.from({ length: barCount }).map((_, i) => {
          const hue = (i / barCount) * 280; // Full rainbow spread
          return (
            <div
              key={i}
              ref={el => { if (el) barsRef.current[i] = el; }}
              className="flex-1 max-w-[5px] h-full rounded-t-sm origin-bottom"
              style={{
                background: `linear-gradient(to top,
                  hsl(${hue}, 85%, 45%),
                  hsl(${(hue + 30) % 360}, 90%, 55%),
                  hsl(${(hue + 50) % 360}, 85%, 65%))`,
                transform: 'scaleY(0.03)',
                willChange: 'transform, opacity, background, box-shadow',
                transition: 'none',
              }}
            />
          );
        })}
      </div>
    );
  }

  // Enhanced Wave Visualizer - Flowing rainbow
  if (variant === "wave") {
    return (
      <div ref={containerRef} className={`${containerClass} flex items-center justify-center gap-[1px] relative overflow-hidden`}>
        {Array.from({ length: barCount }).map((_, i) => {
          const hue = (i / barCount) * 300;
          return (
            <div
              key={i}
              ref={el => { if (el) barsRef.current[i] = el; }}
              className="w-[2px] md:w-[3px] h-20 md:h-28 rounded-sm origin-center"
              style={{
                background: `linear-gradient(to top,
                  hsl(${hue}, 80%, 45%),
                  hsl(${(hue + 40) % 360}, 85%, 60%))`,
                transform: 'translateY(0) scaleY(0.1)',
                willChange: 'transform, opacity, background',
                transition: 'none',
              }}
            />
          );
        })}
      </div>
    );
  }

  // Enhanced Pulse Visualizer - Vibrant concentric rings
  if (variant === "pulse") {
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        {/* Central glowing core */}
        <div className="absolute w-1/5 h-1/5 bg-gradient-to-br from-purple-400/40 to-pink-400/40 rounded-full blur-sm" />
        <div className="absolute w-1/8 h-1/8 bg-white/30 rounded-full" />
        {Array.from({ length: barCount }).map((_, ring) => {
          const ringHue = ring * 50;
          return (
            <div
              key={ring}
              ref={el => { if (el) barsRef.current[ring] = el; }}
              className="absolute rounded-full border-2"
              style={{
                width: `${15 + ring * 14}%`,
                height: `${15 + ring * 14}%`,
                borderColor: `hsla(${ringHue}, 80%, 60%, ${0.6 - ring * 0.08})`,
                background: 'transparent',
                transform: 'scale(1)',
                willChange: 'transform, border-color, box-shadow',
                transition: 'none',
              }}
            />
          );
        })}
      </div>
    );
  }

  // Enhanced Circle Visualizer - Orbital rainbow particles
  if (variant === "circle") {
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        {/* Glowing central core */}
        <div className="absolute w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-purple-400/50 to-cyan-400/50 rounded-full blur-sm" />
        <div className="absolute w-3 h-3 md:w-4 md:h-4 bg-white/50 rounded-full" />
        <div className="absolute w-full h-full flex items-center justify-center">
          {Array.from({ length: barCount }).map((_, i) => {
            const hue = (i / barCount) * 360;
            return (
              <div
                key={i}
                ref={el => { if (el) barsRef.current[i] = el; }}
                className="absolute w-2 h-2 md:w-2.5 md:h-2.5 rounded-full origin-center"
                style={{
                  background: `radial-gradient(circle, hsl(${hue}, 90%, 65%), hsl(${(hue + 30) % 360}, 85%, 50%))`,
                  transform: 'translate(0, 0) scale(0.4)',
                  willChange: 'transform, opacity, background, box-shadow',
                  transition: 'none',
                }}
              />
            );
          })}
        </div>
        {/* Subtle outer rings */}
        <div className="absolute w-[85%] h-[85%] rounded-full border border-white/10" />
        <div className="absolute w-[95%] h-[95%] rounded-full border border-white/5" />
      </div>
    );
  }

  // Enhanced Dots Visualizer - Reactive rainbow grid
  if (variant === "dots") {
    const gridSize = Math.sqrt(barCount);
    return (
      <div ref={containerRef} className={`${containerClass} relative flex items-center justify-center`}>
        <div className={`grid gap-2 md:gap-3`} style={{ gridTemplateColumns: `repeat(${Math.ceil(gridSize)}, 1fr)` }}>
          {Array.from({ length: barCount }).map((_, i) => {
            const hue = (i / barCount) * 320;
            return (
              <div
                key={i}
                ref={el => { if (el) barsRef.current[i] = el; }}
                className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                style={{
                  background: `radial-gradient(circle,
                    hsl(${hue}, 90%, 70%),
                    hsl(${(hue + 40) % 360}, 85%, 50%))`,
                  transform: 'scale(0.4)',
                  willChange: 'transform, opacity, background, box-shadow',
                  transition: 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Enhanced Lines Visualizer - Streaming spectrum
  return (
    <div ref={containerRef} className={`${containerClass} flex flex-col items-center justify-center gap-1 md:gap-1.5 relative`}>
      {Array.from({ length: barCount }).map((_, i) => {
        const hue = (i / barCount) * 280;
        return (
          <div
            key={i}
            ref={el => { if (el) barsRef.current[i] = el; }}
            className="h-1.5 md:h-2 w-full rounded-sm origin-left"
            style={{
              background: `linear-gradient(to right,
                hsla(${hue}, 85%, 45%, 0.8),
                hsl(${(hue + 30) % 360}, 90%, 55%),
                hsla(${(hue + 60) % 360}, 85%, 65%, 0.8))`,
              transform: 'scaleX(0.08)',
              willChange: 'transform, opacity, background',
              transition: 'none',
            }}
          />
        );
      })}
    </div>
  );
};
