import { useEffect, useRef, useState } from "react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

interface CanvasVisualizerProps {
  isPlaying: boolean;
  variant?: "orb" | "spectrum" | "particles" | "galaxy" | "dna" | "radial";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  audioElement?: HTMLAudioElement | null;
}

export const CanvasVisualizer = ({
  isPlaying,
  variant = "orb",
  size = "full",
  audioElement
}: CanvasVisualizerProps) => {
  const { frequencyData } = useAudioAnalyzer(isPlaying ? audioElement : null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const particlesRef = useRef<any[]>([]);

  // Get canvas dimensions based on size
  const getDimensions = () => {
    if (size === "full") {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }

    const sizes = {
      sm: 200,
      md: 400,
      lg: 600,
      xl: 800,
      full: Math.min(window.innerWidth, window.innerHeight)
    };

    const dim = sizes[size];
    return { width: dim, height: dim };
  };

  const [dimensions, setDimensions] = useState(getDimensions);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(getDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  // Initialize particles for particle-based visualizers
  useEffect(() => {
    if (variant === "particles" || variant === "galaxy") {
      const particles = [];
      for (let i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          color: Math.random() * 360,
          life: 1
        });
      }
      particlesRef.current = particles;
    }
  }, [variant, dimensions]);

  // Main animation loop
  useEffect(() => {
    if (!canvasRef.current || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas resolution
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const animate = () => {
      timeRef.current += 0.01;

      // Process audio data
      const avgFrequency = Array.from(frequencyData).reduce((a, b) => a + b, 0) / frequencyData.length;
      const bass = Array.from(frequencyData.slice(0, 16)).reduce((a, b) => a + b, 0) / 16;
      const mid = Array.from(frequencyData.slice(16, 128)).reduce((a, b) => a + b, 0) / 112;
      const treble = Array.from(frequencyData.slice(128)).reduce((a, b) => a + b, 0) / Math.max(1, frequencyData.length - 128);

      // Normalize values with exponential scaling for better reactivity
      const bassLevel = Math.pow(bass / 255, 0.7) * 2;
      const midLevel = Math.pow(mid / 255, 0.8) * 1.5;
      const trebleLevel = Math.pow(treble / 255, 0.9) * 1.2;
      const intensity = Math.pow(avgFrequency / 255, 0.6) * 1.8;

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw based on variant
      switch (variant) {
        case "orb":
          drawOrb(ctx, canvas.width, canvas.height, frequencyData, bassLevel, midLevel, trebleLevel, intensity);
          break;
        case "spectrum":
          drawSpectrum(ctx, canvas.width, canvas.height, frequencyData, bassLevel, intensity);
          break;
        case "particles":
          drawParticles(ctx, canvas.width, canvas.height, frequencyData, bassLevel, midLevel, intensity);
          break;
        case "galaxy":
          drawGalaxy(ctx, canvas.width, canvas.height, frequencyData, bassLevel, midLevel, trebleLevel, intensity);
          break;
        case "dna":
          drawDNA(ctx, canvas.width, canvas.height, frequencyData, bassLevel, midLevel, intensity);
          break;
        case "radial":
          drawRadial(ctx, canvas.width, canvas.height, frequencyData, bassLevel, midLevel, trebleLevel, intensity);
          break;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const drawOrb = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, bass: number, mid: number, treble: number, intensity: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.3;

      // Outer glow
      const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * (1 + bass * 0.5));
      glowGradient.addColorStop(0, `hsla(${timeRef.current * 50 % 360}, 100%, 60%, ${intensity * 0.2})`);
      glowGradient.addColorStop(0.5, `hsla(${(timeRef.current * 50 + 60) % 360}, 90%, 50%, ${intensity * 0.1})`);
      glowGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, w, h);

      // Draw frequency rings
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        const points = 64;

        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const dataIndex = Math.floor((i / points) * data.length);
          const amplitude = data[dataIndex] / 255;

          const radiusVariation = amplitude * 50 * (1 + ring * 0.5);
          const radius = baseRadius * (0.5 + ring * 0.3) + radiusVariation * (1 + bass * 0.5);

          const x = cx + Math.cos(angle + timeRef.current * (1 + ring * 0.2)) * radius;
          const y = cy + Math.sin(angle + timeRef.current * (1 + ring * 0.2)) * radius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();
        const hue = (timeRef.current * 30 + ring * 120) % 360;
        ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${0.8 - ring * 0.2})`;
        ctx.lineWidth = 2 + bass * 5;
        ctx.shadowBlur = 20 + bass * 30;
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${bass})`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Center core
      const coreRadius = baseRadius * 0.2 * (1 + bass * 0.5);
      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      coreGradient.addColorStop(0, `hsla(${timeRef.current * 60 % 360}, 100%, 90%, 1)`);
      coreGradient.addColorStop(0.5, `hsla(${(timeRef.current * 60 + 30) % 360}, 90%, 70%, 0.9)`);
      coreGradient.addColorStop(1, `hsla(${(timeRef.current * 60 + 60) % 360}, 80%, 50%, 0.6)`);

      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
    };

    const drawSpectrum = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, bass: number, intensity: number) => {
      const barWidth = w / data.length * 2;
      const centerY = h / 2;

      for (let i = 0; i < data.length; i++) {
        const value = data[i] / 255;
        const barHeight = value * h * 0.7 * (1 + bass * 0.3);
        const x = (i / data.length) * w;

        // Mirror effect - draw both up and down from center
        const hue = (i / data.length * 300 + timeRef.current * 50) % 360;
        const gradient = ctx.createLinearGradient(x, centerY - barHeight / 2, x, centerY + barHeight / 2);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.2)`);
        gradient.addColorStop(0.5, `hsla(${hue}, 90%, 70%, ${0.8 + value * 0.2})`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 60%, 0.2)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);

        // Add glow for peaks
        if (value > 0.7) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${value})`;
          ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, 2);
          ctx.fillRect(x, centerY + barHeight / 2 - 2, barWidth - 1, 2);
          ctx.shadowBlur = 0;
        }
      }
    };

    const drawParticles = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, bass: number, mid: number, intensity: number) => {
      const cx = w / 2;
      const cy = h / 2;

      particlesRef.current.forEach((particle, i) => {
        const dataIndex = Math.floor((i / particlesRef.current.length) * data.length);
        const amplitude = data[dataIndex] / 255;

        // Update particle physics
        particle.vx += (cx - particle.x) * 0.0001 * (1 + bass);
        particle.vy += (cy - particle.y) * 0.0001 * (1 + bass);
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Audio reactive movement
        const angle = Math.atan2(particle.y - cy, particle.x - cx);
        particle.x += particle.vx + Math.cos(angle) * amplitude * 10 * bass;
        particle.y += particle.vy + Math.sin(angle) * amplitude * 10 * bass;

        // Wrap around edges
        if (particle.x < 0) particle.x = w;
        if (particle.x > w) particle.x = 0;
        if (particle.y < 0) particle.y = h;
        if (particle.y > h) particle.y = 0;

        // Update color
        particle.color = (particle.color + amplitude * 5) % 360;
        particle.size = 1 + amplitude * 10;

        // Draw particle
        const particleGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        particleGradient.addColorStop(0, `hsla(${particle.color}, 100%, 70%, ${0.8 + amplitude * 0.2})`);
        particleGradient.addColorStop(1, `hsla(${particle.color}, 90%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particleGradient;
        ctx.fill();

        // Draw connections between nearby particles
        particlesRef.current.forEach((other, j) => {
          if (i < j) {
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100 * (1 + bass)) {
              const opacity = (1 - distance / (100 * (1 + bass))) * amplitude;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.strokeStyle = `hsla(${(particle.color + other.color) / 2}, 80%, 60%, ${opacity * 0.3})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      });
    };

    const drawGalaxy = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, bass: number, mid: number, treble: number, intensity: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(w, h) * 0.4;

      // Draw spiral arms
      for (let arm = 0; arm < 4; arm++) {
        ctx.beginPath();

        for (let i = 0; i < 100; i++) {
          const t = i / 100;
          const angle = t * Math.PI * 4 + arm * Math.PI / 2 + timeRef.current;
          const dataIndex = Math.floor(t * data.length);
          const amplitude = data[dataIndex] / 255;

          const spiralRadius = t * maxRadius * (1 + amplitude * 0.5 + bass * 0.3);
          const x = cx + Math.cos(angle) * spiralRadius;
          const y = cy + Math.sin(angle) * spiralRadius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          // Add stars along the spiral
          if (i % 5 === 0 && amplitude > 0.3) {
            ctx.save();
            const starSize = 1 + amplitude * 5;
            const starGradient = ctx.createRadialGradient(x, y, 0, x, y, starSize);
            starGradient.addColorStop(0, `hsla(${(arm * 90 + t * 360) % 360}, 100%, 90%, 1)`);
            starGradient.addColorStop(1, `hsla(${(arm * 90 + t * 360) % 360}, 90%, 70%, 0)`);

            ctx.beginPath();
            ctx.arc(x, y, starSize, 0, Math.PI * 2);
            ctx.fillStyle = starGradient;
            ctx.fill();
            ctx.restore();
          }
        }

        const armHue = (arm * 90 + timeRef.current * 30) % 360;
        ctx.strokeStyle = `hsla(${armHue}, 85%, 60%, ${0.4 + intensity * 0.3})`;
        ctx.lineWidth = 2 + mid * 5;
        ctx.shadowBlur = 10 + mid * 20;
        ctx.shadowColor = `hsla(${armHue}, 100%, 70%, ${mid})`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Galaxy core
      const coreSize = maxRadius * 0.2 * (1 + bass * 0.5);
      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      coreGradient.addColorStop(0.3, `hsla(${timeRef.current * 60 % 360}, 100%, 80%, 0.9)`);
      coreGradient.addColorStop(0.6, `hsla(${(timeRef.current * 60 + 60) % 360}, 90%, 60%, 0.5)`);
      coreGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
    };

    const drawDNA = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, bass: number, mid: number, intensity: number) => {
      const cx = w / 2;
      const points = 50;

      // Draw double helix
      for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath();

        for (let i = 0; i <= points; i++) {
          const t = i / points;
          const y = t * h;
          const dataIndex = Math.floor(t * data.length);
          const amplitude = data[dataIndex] / 255;

          const waveX = Math.sin(t * Math.PI * 4 + timeRef.current * 2 + strand * Math.PI) * 100 * (1 + amplitude + bass * 0.5);
          const x = cx + waveX;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          // Draw connections between strands
          if (i % 3 === 0 && strand === 0) {
            const x2 = cx - waveX;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y);
            const connectionHue = (t * 360 + timeRef.current * 100) % 360;
            ctx.strokeStyle = `hsla(${connectionHue}, 80%, 60%, ${0.3 + amplitude * 0.5})`;
            ctx.lineWidth = 2 + amplitude * 5;
            ctx.stroke();
            ctx.restore();
          }

          // Add nodes
          if (i % 2 === 0) {
            const nodeSize = 3 + amplitude * 10;
            const nodeHue = (strand * 180 + t * 360 + timeRef.current * 80) % 360;

            ctx.save();
            const nodeGradient = ctx.createRadialGradient(x, y, 0, x, y, nodeSize);
            nodeGradient.addColorStop(0, `hsla(${nodeHue}, 100%, 80%, 1)`);
            nodeGradient.addColorStop(1, `hsla(${nodeHue}, 90%, 60%, 0)`);

            ctx.beginPath();
            ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
            ctx.fillStyle = nodeGradient;
            ctx.fill();
            ctx.restore();
          }
        }

        const strandHue = (strand * 180 + timeRef.current * 60) % 360;
        ctx.strokeStyle = `hsla(${strandHue}, 90%, 60%, 0.8)`;
        ctx.lineWidth = 3 + mid * 4;
        ctx.stroke();
      }
    };

    const drawRadial = (ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array, bass: number, mid: number, treble: number, intensity: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(w, h) * 0.45;

      // Draw radial bars
      const barCount = data.length;
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
        const value = data[i] / 255;

        const innerRadius = maxRadius * 0.2;
        const barLength = value * maxRadius * 0.8 * (1 + bass * 0.3);

        const x1 = cx + Math.cos(angle) * innerRadius;
        const y1 = cy + Math.sin(angle) * innerRadius;
        const x2 = cx + Math.cos(angle) * (innerRadius + barLength);
        const y2 = cy + Math.sin(angle) * (innerRadius + barLength);

        const hue = (i / barCount * 360 + timeRef.current * 100) % 360;
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.9)`);
        gradient.addColorStop(0.7, `hsla(${hue + 30}, 90%, 60%, 0.7)`);
        gradient.addColorStop(1, `hsla(${hue + 60}, 80%, 50%, 0.2)`);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(1, (w / barCount) - 1);
        ctx.stroke();
      }

      // Draw concentric rings
      for (let ring = 0; ring < 5; ring++) {
        const ringRadius = maxRadius * (0.2 + ring * 0.2) * (1 + bass * 0.1);
        const ringData = data.slice(ring * 20, (ring + 1) * 20);
        const ringIntensity = ringData.reduce((a, b) => a + b, 0) / ringData.length / 255;

        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        const ringHue = (ring * 72 + timeRef.current * 60) % 360;
        ctx.strokeStyle = `hsla(${ringHue}, 90%, 60%, ${0.2 + ringIntensity * 0.6})`;
        ctx.lineWidth = 1 + ringIntensity * 5;

        if (ringIntensity > 0.5) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsla(${ringHue}, 100%, 70%, ${ringIntensity})`;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Center pulse
      const coreRadius = maxRadius * 0.15 * (1 + intensity);
      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      coreGradient.addColorStop(0, `hsla(${timeRef.current * 90 % 360}, 100%, 90%, 1)`);
      coreGradient.addColorStop(0.5, `hsla(${(timeRef.current * 90 + 45) % 360}, 90%, 70%, 0.7)`);
      coreGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [variant, isPlaying, dimensions, frequencyData]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          imageRendering: 'auto',
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
      />
    </div>
  );
};