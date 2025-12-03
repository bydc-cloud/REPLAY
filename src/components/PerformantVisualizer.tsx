import { useEffect, useRef, useState, useMemo } from "react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { useSettings } from "../contexts/SettingsContext";

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

  // Ultra-smooth interpolation - fast attack for punch, slow release for smooth trails
  const smoothDataWithMomentum = (
    newValue: number,
    oldValue: number,
    velocity: number,
    index: number,
    isRising: boolean
  ): { value: number; velocity: number } => {
    // MUCH faster attack (0.25) for punchy response, slower release (0.04) for smooth trails
    const attackFactor = 0.25; // Fast response to audio peaks
    const releaseFactor = 0.04; // Very slow decay for smooth trailing effect
    const factor = isRising ? attackFactor : releaseFactor;

    // Simple linear interpolation for snappier response
    const diff = newValue - oldValue;
    const eased = diff * factor;

    // Reduced momentum for more direct response to audio
    const momentum = 0.2;
    const targetVelocity = eased;
    const newVelocity = velocity * momentum + targetVelocity * (1 - momentum);

    const smoothedValue = oldValue + newVelocity;

    return {
      value: Math.max(0, Math.min(1, smoothedValue)),
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
          // Vibrant bars with deep multi-layer glow
          const scale = Math.max(0.03, value * 1.15);
          const barHue = dynamicHue; // Use the frequency-based hue directly
          bar.style.transform = `translateZ(0) scaleY(${scale})`; // GPU accelerated
          bar.style.background = `linear-gradient(to top,
            hsl(${barHue}, ${saturation}%, ${lightness - 10}%),
            hsl(${barHue}, ${saturation}%, ${lightness + 5}%),
            hsl(${barHue}, ${Math.min(100, saturation + 10)}%, ${lightness + 15}%))`;
          // 5-layer glow with exponential opacity falloff for natural depth
          const g = value; // glow intensity base
          bar.style.boxShadow = isPlaying && value > 0.1 ?
            `0 0 ${g * 3}px hsla(${barHue}, 100%, 70%, ${0.9 * g}),
             0 0 ${g * 8}px hsla(${barHue}, 100%, 60%, ${0.6 * g}),
             0 0 ${g * 16}px hsla(${barHue}, 95%, 50%, ${0.35 * g}),
             0 0 ${g * 30}px hsla(${barHue}, 90%, 40%, ${0.15 * g}),
             0 ${g * 4}px ${g * 12}px hsla(${barHue}, 100%, 30%, ${0.25 * g})` : 'none';
          bar.style.opacity = isPlaying ? '1' : '0.25';
        } else if (variant === "wave") {
          // Flowing wave with color gradients and glow
          const wavePhase = position * Math.PI * 4 + timeRef.current * 3;
          const waveHeight = isPlaying ? Math.sin(wavePhase) * 30 * (0.3 + avgEnergy * 0.7 + bassEnergy * 0.5) : 0;
          const scale = Math.max(0.1, value * 1.2);
          const waveHue = (dynamicHue + position * 80 + Math.sin(timeRef.current + i * 0.1) * 30) % 360;
          bar.style.transform = `translateY(${waveHeight}px) scaleY(${scale})`;
          bar.style.background = `linear-gradient(to top,
            hsl(${waveHue}, ${saturation}%, ${lightness - 10}%),
            hsl(${(waveHue + 40) % 360}, ${saturation}%, ${lightness + 5}%))`;
          // Soft flowing glow for wave
          const waveGlow = value * value;
          bar.style.boxShadow = isPlaying && value > 0.2 ?
            `0 0 ${waveGlow * 8}px hsla(${waveHue}, 100%, 55%, ${0.4 + waveGlow * 0.2}),
             0 0 ${waveGlow * 15}px hsla(${(waveHue + 30) % 360}, 90%, 50%, ${0.2 + waveGlow * 0.1})` : 'none';
          bar.style.opacity = isPlaying ? `${0.85 + value * 0.15}` : '0.25';
        } else if (variant === "pulse") {
          // Vibrant pulsing rings with dramatic layered glow
          const breathe = isPlaying ? Math.sin(timeRef.current * 2.5 + i * 0.7) * 0.1 : 0;
          const scale = 0.8 + value * 0.6 + breathe + bassEnergy * 0.35;
          const ringHue = (dynamicHue + i * 60) % 360;
          const pulseGlow = value * value;
          bar.style.transform = `scale(${scale})`;
          bar.style.borderColor = `hsla(${ringHue}, ${saturation}%, ${isPlaying ? 55 + value * 30 : 25}%, ${isPlaying ? 0.5 + value * 0.5 : 0.2})`;
          // Multi-layer glow for dramatic pulsing effect
          bar.style.boxShadow = isPlaying && value > 0.15 ?
            `0 0 ${pulseGlow * 12}px hsla(${ringHue}, 100%, 60%, ${0.4 + pulseGlow * 0.3}),
             0 0 ${pulseGlow * 25}px hsla(${(ringHue + 30) % 360}, 95%, 55%, ${0.25 + pulseGlow * 0.15}),
             0 0 ${pulseGlow * 40}px hsla(${(ringHue + 60) % 360}, 90%, 50%, ${0.1 + pulseGlow * 0.1}),
             inset 0 0 ${pulseGlow * 15}px hsla(${ringHue}, 100%, 70%, ${0.15 + pulseGlow * 0.1})` : 'none';
        } else if (variant === "circle") {
          // Orbital particles with color trails and ethereal glow
          const baseAngle = position * Math.PI * 2;
          const dynamicAngle = baseAngle + (isPlaying ? timeRef.current * 0.5 + bassEnergy * 0.5 : 0);
          const baseRadius = 35 + (size === "sm" || size === "md" ? 15 : 45);
          const dynamicRadius = baseRadius + (isPlaying ? value * 50 + bassEnergy * 20 : 0);
          const x = Math.cos(dynamicAngle) * dynamicRadius;
          const y = Math.sin(dynamicAngle) * dynamicRadius;
          const particleScale = 0.5 + value * 1.2 + bassEnergy * 0.3;
          const orbitHue = (dynamicHue + position * 120) % 360;
          const orbitGlow = value * value;
          bar.style.transform = `translate(${x}px, ${y}px) scale(${particleScale})`;
          bar.style.background = `radial-gradient(circle,
            hsl(${orbitHue}, ${saturation}%, ${lightness + 15}%),
            hsl(${(orbitHue + 30) % 360}, ${saturation}%, ${lightness - 5}%))`;
          // Multi-layered glow for ethereal orbital effect
          bar.style.boxShadow = isPlaying && value > 0.1 ?
            `0 0 ${orbitGlow * 10}px hsla(${orbitHue}, 100%, 65%, ${0.5 + orbitGlow * 0.3}),
             0 0 ${orbitGlow * 18}px hsla(${(orbitHue + 25) % 360}, 95%, 55%, ${0.3 + orbitGlow * 0.2}),
             0 0 ${orbitGlow * 28}px hsla(${(orbitHue + 50) % 360}, 90%, 50%, ${0.15 + orbitGlow * 0.1})` : 'none';
          bar.style.opacity = isPlaying ? `${0.8 + value * 0.2}` : '0.2';
        } else if (variant === "dots") {
          // Reactive grid with ripple effects and pulsing glow
          const gridX = i % Math.ceil(Math.sqrt(barCount));
          const gridY = Math.floor(i / Math.ceil(Math.sqrt(barCount)));
          const distFromCenter = Math.sqrt(Math.pow(gridX - Math.sqrt(barCount)/2, 2) + Math.pow(gridY - Math.sqrt(barCount)/2, 2));
          const ripple = isPlaying ? Math.sin(timeRef.current * 4 - distFromCenter * 0.5) * 0.15 : 0;
          const scale = 0.4 + value * 1.8 + ripple + bassEnergy * 0.5;
          const dotHue = (dynamicHue + i * 10 + distFromCenter * 15) % 360;
          const dotGlow = value * value;
          bar.style.transform = `scale(${Math.max(0.3, scale)})`;
          bar.style.background = `radial-gradient(circle,
            hsl(${dotHue}, ${saturation}%, ${lightness + 20}%),
            hsl(${(dotHue + 40) % 360}, ${saturation}%, ${lightness}%))`;
          // Multi-layer glow for reactive grid
          bar.style.boxShadow = isPlaying && value > 0.2 ?
            `0 0 ${dotGlow * 8}px hsla(${dotHue}, 100%, 60%, ${0.5 + dotGlow * 0.3}),
             0 0 ${dotGlow * 15}px hsla(${(dotHue + 30) % 360}, 95%, 55%, ${0.25 + dotGlow * 0.15}),
             0 0 ${dotGlow * 22}px hsla(${(dotHue + 60) % 360}, 90%, 50%, ${0.1 + dotGlow * 0.1})` : 'none';
          bar.style.opacity = isPlaying ? `${0.8 + value * 0.2}` : '0.2';
        } else if (variant === "lines") {
          // Streaming spectrum lines with glowing trails
          const stream = isPlaying ? Math.sin(timeRef.current * 3 + i * 0.8) * 0.1 : 0;
          const scale = Math.max(0.08, value * 1.1 + stream + highEnergy * 0.2);
          const lineHue = (dynamicHue + i * 15) % 360;
          const lineGlow = value * value;
          bar.style.transform = `scaleX(${scale})`;
          bar.style.background = `linear-gradient(to right,
            hsla(${lineHue}, ${saturation}%, ${lightness - 10}%, 0.8),
            hsl(${(lineHue + 30) % 360}, ${saturation}%, ${lightness}%),
            hsla(${(lineHue + 60) % 360}, ${saturation}%, ${lightness + 10}%, 0.8))`;
          // Multi-layer glow for streaming effect
          bar.style.boxShadow = isPlaying && value > 0.2 ?
            `0 0 ${lineGlow * 6}px hsla(${lineHue}, 100%, 60%, ${0.4 + lineGlow * 0.3}),
             0 0 ${lineGlow * 12}px hsla(${(lineHue + 25) % 360}, 95%, 55%, ${0.2 + lineGlow * 0.15}),
             0 ${lineGlow * 3}px ${lineGlow * 8}px hsla(${lineHue}, 90%, 50%, ${0.15 + lineGlow * 0.1})` : 'none';
          bar.style.opacity = isPlaying ? `${0.85 + value * 0.15}` : '0.2';
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
