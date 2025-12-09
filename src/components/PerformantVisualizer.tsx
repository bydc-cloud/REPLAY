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
  const canvasRafRef = useRef<number>();
  const barsRef = useRef<HTMLDivElement[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const smoothedDataRef = useRef<number[]>([]);
  const targetDataRef = useRef<number[]>([]); // Target values for interpolation
  const hueRotationRef = useRef<number>(0);
  const velocityRef = useRef<number[]>([]); // For momentum-based smoothing
  const peakRef = useRef<number[]>([]); // Track peaks for more dynamic visuals
  const waveSmoothRef = useRef<number[]>([]);
  const orbTrailRef = useRef<Array<{ x: number; y: number; r: number; alpha: number }>>([]);

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

  const isCanvasVariant = variant === "wave" || variant === "dots" || variant === "circle";

  // Initialize bars with refs
  useEffect(() => {
    setIsReady(true);
    smoothedDataRef.current = new Array(barCount).fill(0);
    targetDataRef.current = new Array(barCount).fill(0);
    velocityRef.current = new Array(barCount).fill(0);
    peakRef.current = new Array(barCount).fill(0);
    waveSmoothRef.current = new Array(barCount).fill(0);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (canvasRafRef.current) cancelAnimationFrame(canvasRafRef.current);
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
    if (isCanvasVariant) return; // canvas variants handled separately

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
        } else if (variant === "pulse") {
          // Smooth pulsing rings - optimized for buttery motion
          const breathe = isPlaying ? Math.sin(timeRef.current * 2 + i * 0.5) * 0.08 : 0;
          const scale = 0.78 + value * 0.65 + breathe + bassEnergy * 0.3;
          const ringHue = (dynamicHue + i * 65) % 360;
          const borderWidth = 2 + i * 0.35;
          const ringLightness = isPlaying ? 48 + value * 18 : 32;
          // GPU-accelerated transform
          bar.style.transform = `translateZ(0) scale(${scale})`;
          bar.style.borderWidth = `${borderWidth}px`;
          bar.style.borderColor = `hsla(${ringHue}, 85%, ${ringLightness}%, ${isPlaying ? 0.58 + value * 0.3 : 0.25})`;
          bar.style.background = `radial-gradient(circle at 35% 35%, hsla(${(ringHue + 20) % 360}, 85%, 60%, ${0.18 + value * 0.25}), transparent 55%)`;
          // Enhanced multi-layer glow with softer core (no harsh white)
          if (isPlaying && value > 0.25) {
            const g = value * value;
            bar.style.boxShadow = `0 0 ${10 + g * 18}px hsla(${ringHue}, 90%, 58%, ${0.38 + g * 0.4}),
             0 0 ${20 + g * 22}px hsla(${(ringHue + 40) % 360}, 85%, 52%, ${0.16 + g * 0.22}),
             inset 0 0 ${8 + g * 14}px hsla(${(ringHue + 12) % 360}, 90%, 70%, ${0.1 + g * 0.16})`;
          } else {
            bar.style.boxShadow = 'none';
          }
        } else if (variant === "lines") {
          // Silky smooth streaming lines (you like this one!)
          const stream = isPlaying ? Math.sin(timeRef.current * 2.8 + i * 0.55) * 0.1 : 0;
          const scale = Math.max(0.12, value * 1.08 + stream + highEnergy * 0.18);
          const lineHue = (dynamicHue + i * 16) % 360;
          const translate = isPlaying ? Math.sin(timeRef.current * 1.4 + i * 0.25) * 4 : 0;
          // GPU-accelerated transform
          bar.style.transform = `translateZ(0) translateY(${translate}px) scaleX(${scale})`;
          bar.style.opacity = isPlaying ? `${0.78 + value * 0.25}` : '0.22';
          bar.style.background = `linear-gradient(to right,
            hsla(${lineHue}, 90%, 55%, 0.85),
            hsla(${(lineHue + 40) % 360}, 95%, 65%, 0.95),
            hsla(${(lineHue + 80) % 360}, 88%, 60%, 0.85))`;
          // Multi-layer glow for depth
          if (isPlaying && value > 0.22) {
            const g = value * value;
            bar.style.boxShadow = `0 0 ${7 + g * 11}px hsla(${lineHue}, 100%, 60%, ${0.32 + g * 0.35}),
             0 0 ${14 + g * 16}px hsla(${(lineHue + 50) % 360}, 90%, 55%, ${0.16 + g * 0.2})`;
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
  }, [frequencyData, barCount, variant, isReady, size, isPlaying, demoMode, isMP3Theme, isCanvasVariant]);

  // Canvas-based variants (wave, dots) for higher FPS and lower DOM cost
  useEffect(() => {
    if (!isCanvasVariant || !isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    const draw = (timestamp: number) => {
      const delta = Math.min(timestamp - lastUpdateRef.current, 50);
      lastUpdateRef.current = timestamp;
      if (isPlaying) {
        timeRef.current += delta / 1000;
        demoTimeRef.current += delta / 1000;
      }

      const activeFrequencyData = demoMode && isPlaying
        ? generateDemoData(demoTimeRef.current)
        : frequencyData;

      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      if (width === 0 || height === 0) {
        canvasRafRef.current = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      const step = activeFrequencyData && activeFrequencyData.length > 0 ? Math.max(1, Math.floor(activeFrequencyData.length / barCount)) : 1;
      const samples: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const idx = Math.min(i * step, activeFrequencyData ? activeFrequencyData.length - 1 : 0);
        const val = activeFrequencyData && activeFrequencyData.length > 0 ? activeFrequencyData[idx] / 255 : 0;
        samples.push(val);
      }

      // Compute band energies
      const avgEnergy = samples.reduce((a, b) => a + b, 0) / Math.max(1, samples.length);
      const bassEnergy = samples.slice(0, Math.max(4, Math.floor(samples.length * 0.15))).reduce((a, b) => a + b, 0) / Math.max(1, Math.max(4, Math.floor(samples.length * 0.15)));
      const midEnergy = samples.slice(Math.floor(samples.length * 0.2), Math.floor(samples.length * 0.6)).reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(samples.length * 0.4));
      const highEnergy = samples.slice(Math.floor(samples.length * 0.6)).reduce((a, b) => a + b, 0) / Math.max(1, samples.length - Math.floor(samples.length * 0.6));

      const hueBase = (timeRef.current * 60 + avgEnergy * 180) % 360;

      if (variant === "wave") {
        // Smooth samples for wave line
        const smooth = waveSmoothRef.current;
        for (let i = 0; i < samples.length; i++) {
          smooth[i] = smooth[i] * 0.78 + samples[i] * 0.22;
        }

        // Background wash to avoid harsh black
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, `hsla(${(hueBase + 20) % 360}, 60%, 18%, 0.22)`);
        bgGrad.addColorStop(1, `hsla(${(hueBase + 120) % 360}, 65%, 16%, 0.22)`);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = Math.max(1.6, height * 0.003);
        ctx.lineCap = "round";
        ctx.globalCompositeOperation = "lighter";

        const drawWave = (offset: number, opacity: number, freqMul: number, ampMul: number, colorHueShift: number) => {
          ctx.beginPath();
          const hue = (hueBase + colorHueShift) % 360;
          const strokeGrad = ctx.createLinearGradient(0, 0, width, 0);
          strokeGrad.addColorStop(0, `hsla(${(hue + 15) % 360}, 95%, ${55 + avgEnergy * 20}%, ${opacity})`);
          strokeGrad.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 90%, ${60 + avgEnergy * 25}%, ${opacity})`);
          strokeGrad.addColorStop(1, `hsla(${(hue + 120) % 360}, 85%, ${50 + avgEnergy * 20}%, ${opacity * 0.85})`);
          ctx.strokeStyle = strokeGrad;

          for (let i = 0; i < smooth.length; i++) {
            const t = i / (smooth.length - 1);
            const x = t * width;
            const sine = Math.sin(timeRef.current * freqMul + t * Math.PI * 5.2);
            const y =
              height * 0.5 +
              (sine * 0.18 + (smooth[i] - 0.5) * 0.9) * (height * 0.28 * ampMul) +
              offset;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };

        drawWave(0, 0.95, 1.35 + bassEnergy * 1.4, 1.25 + avgEnergy * 0.9, 0);
        drawWave(height * 0.028, 0.55, 1.85 + midEnergy * 1.2, 0.85 + midEnergy * 0.7, 70);
        drawWave(-height * 0.03, 0.35, 2.45 + highEnergy * 1.6, 0.6 + highEnergy * 0.6, 130);

        ctx.globalCompositeOperation = "source-over";
      } else if (variant === "dots") {
        const grid = Math.ceil(Math.sqrt(barCount));
        const cellW = width / grid;
        const cellH = height / grid;
        const maxRadius = Math.min(cellW, cellH) * 0.45;
        const cxAll = width / 2;
        const cyAll = height / 2;
        const rotate = (timeRef.current * 0.25 + avgEnergy * 0.6);
        ctx.save();
        ctx.translate(cxAll, cyAll);
        ctx.rotate(rotate * 0.05);
        ctx.translate(-cxAll, -cyAll);
        for (let y = 0; y < grid; y++) {
          for (let x = 0; x < grid; x++) {
            const idx = y * grid + x;
            if (idx >= samples.length) break;
            const val = samples[idx];
            const cx = x * cellW + cellW / 2;
            const cy = y * cellH + cellH / 2;
            const ripple = Math.sin(timeRef.current * 3 - (x + y) * 0.35) * 0.12;
            const radius = Math.max(maxRadius * 0.22, maxRadius * (0.32 + val * 1.0 + ripple + bassEnergy * 0.5));
            const hue = (hueBase + idx * 6 + (x + y) * 3) % 360;
            const alpha = isPlaying ? 0.38 + val * 0.62 : 0.18;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, `hsla(${hue}, 95%, 70%, ${alpha})`);
            gradient.addColorStop(0.55, `hsla(${(hue + 35) % 360}, 90%, 60%, ${alpha * 0.8})`);
            gradient.addColorStop(1, `hsla(${(hue + 70) % 360}, 85%, 48%, ${alpha * 0.6})`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      } else if (variant === "circle") {
        // Background wash
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, `hsla(${(hueBase + 40) % 360}, 65%, 16%, 0.22)`);
        bgGrad.addColorStop(1, `hsla(${(hueBase + 140) % 360}, 60%, 14%, 0.22)`);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const t = timeRef.current;
        const path = (Math.sin(t * 0.4 + avgEnergy * 2) + 1) / 2; // 0..1 progress left->right
        const depth = (Math.cos(t * 0.7 + bassEnergy * 3) + 1) / 2; // 0..1 depth

        const x = width * (0.08 + 0.84 * path);
        const yCenter = height * 0.55;
        const y = yCenter + Math.sin(t * 1.1 + midEnergy * 2) * height * 0.08;
        const baseRadius = Math.min(width, height) * 0.08;
        const r = baseRadius * (0.8 + depth * 0.6 + avgEnergy * 0.4);
        const hue = (hueBase + depth * 60) % 360;

        // Trail
        const trail = orbTrailRef.current;
        trail.push({ x, y, r, alpha: 0.7 + avgEnergy * 0.25 });
        if (trail.length > 18) trail.shift();

        for (let i = 0; i < trail.length; i++) {
          const seg = trail[i];
          const fade = i / trail.length;
          const grad = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, seg.r * (0.9 + fade * 0.3));
          grad.addColorStop(0, `hsla(${(hue + fade * 40) % 360}, 95%, 70%, ${(seg.alpha) * (1 - fade)})`);
          grad.addColorStop(0.5, `hsla(${(hue + 40 + fade * 30) % 360}, 90%, 60%, ${(seg.alpha * 0.8) * (1 - fade)})`);
          grad.addColorStop(1, `hsla(${(hue + 90) % 360}, 85%, 50%, ${(seg.alpha * 0.5) * (1 - fade)})`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, seg.r * (0.9 + fade * 0.2), 0, Math.PI * 2);
          ctx.fill();
        }

        // Main orb
        const orbGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.05);
        orbGrad.addColorStop(0, `hsla(${hue}, 100%, 72%, ${0.9})`);
        orbGrad.addColorStop(0.45, `hsla(${(hue + 35) % 360}, 95%, 65%, ${0.82})`);
        orbGrad.addColorStop(0.8, `hsla(${(hue + 80) % 360}, 85%, 50%, ${0.55})`);
        orbGrad.addColorStop(1, `hsla(${(hue + 120) % 360}, 75%, 45%, ${0.35})`);
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        const glow = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, 0, x - r * 0.25, y - r * 0.25, r * 0.9);
        glow.addColorStop(0, `hsla(${(hue + 20) % 360}, 100%, 85%, 0.6)`);
        glow.addColorStop(1, `hsla(${(hue + 20) % 360}, 100%, 85%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      canvasRafRef.current = requestAnimationFrame(draw);
    };

    canvasRafRef.current = requestAnimationFrame(draw);

    return () => {
      if (canvasRafRef.current) cancelAnimationFrame(canvasRafRef.current);
    };
  }, [isCanvasVariant, isReady, variant, frequencyData, barCount, isPlaying, demoMode]);

  // Enhanced Bars Visualizer - VIBRANT rainbow style - Full width edge-to-edge
  if (variant === "bars") {
    return (
      <div ref={containerRef} className={`${containerClass} flex items-end justify-between gap-[1px] px-0 relative`}>
        {Array.from({ length: barCount }).map((_, i) => {
          const hue = (i / barCount) * 280; // Full rainbow spread
          return (
            <div
              key={i}
              ref={el => { if (el) barsRef.current[i] = el; }}
              className="flex-1 h-full rounded-t-sm origin-bottom"
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

  // Enhanced Wave Visualizer - Flowing rainbow - Full width edge-to-edge
  if (variant === "wave") {
    return (
      <div ref={containerRef} className={`${containerClass} relative overflow-hidden rounded-lg`}>
        <canvas ref={canvasRef} className="w-full h-full block" />
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
      <div ref={containerRef} className={`${containerClass} relative overflow-hidden rounded-lg`}>
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    );
  }

  // Enhanced Dots Visualizer - Reactive rainbow grid
  if (variant === "dots") {
    return (
      <div ref={containerRef} className={`${containerClass} relative overflow-hidden rounded-lg`}>
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    );
  }

  // Enhanced Lines Visualizer - Streaming spectrum
  return (
    <div ref={containerRef} className={`${containerClass} flex flex-col items-center justify-center gap-1.5 md:gap-2 relative`}>
      {Array.from({ length: barCount }).map((_, i) => {
        const hue = (i / barCount) * 280;
        return (
          <div
            key={i}
            ref={el => { if (el) barsRef.current[i] = el; }}
            className="h-[6px] md:h-[8px] w-full rounded-sm origin-left"
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
