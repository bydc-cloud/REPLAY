import { useEffect, useState, useRef, useCallback } from "react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

interface OptimizedVisualizerProps {
  isPlaying: boolean;
  variant?: "orb" | "spectrum" | "particles" | "galaxy" | "dna" | "radial";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  audioElement?: HTMLAudioElement | null;
}

export const OptimizedVisualizer = ({
  isPlaying,
  variant = "orb",
  size = "full",
  audioElement
}: OptimizedVisualizerProps) => {
  const { frequencyData } = useAudioAnalyzer(isPlaying ? audioElement : null);
  const [smoothedData, setSmoothedData] = useState<number[]>(Array(32).fill(0));
  const [hueOffset, setHueOffset] = useState(0);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  // Smooth animation loop for hue rotation
  useEffect(() => {
    let animating = true;

    const animate = (timestamp: number) => {
      if (!animating) return;

      // Update hue slowly and smoothly (one full rotation every 20 seconds)
      setHueOffset((timestamp / 20000) * 360 % 360);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      animating = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Process frequency data with smoothing
  useEffect(() => {
    if (!frequencyData || frequencyData.length === 0) {
      // When not playing, smoothly decay to zero
      setSmoothedData(prev => prev.map(v => v * 0.95));
      return;
    }

    const now = performance.now();
    // Throttle updates to ~30fps for performance
    if (now - lastUpdateRef.current < 33) return;
    lastUpdateRef.current = now;

    const sampleSize = variant === "spectrum" ? 32 : 16;
    const step = Math.floor(frequencyData.length / sampleSize);

    setSmoothedData(prev => {
      const newData = [];
      for (let i = 0; i < sampleSize; i++) {
        const index = Math.min(i * step, frequencyData.length - 1);
        const target = frequencyData[index] / 255;
        // Smooth interpolation (ease toward target)
        const current = prev[i] || 0;
        const smoothed = current + (target - current) * 0.3;
        newData.push(smoothed);
      }
      return newData;
    });
  }, [frequencyData, variant]);

  // Calculate audio metrics with safety checks
  const bass = smoothedData.length >= 4
    ? smoothedData.slice(0, 4).reduce((a, b) => a + b, 0) / 4
    : 0;
  const mid = smoothedData.length >= 12
    ? smoothedData.slice(4, 12).reduce((a, b) => a + b, 0) / 8
    : 0;
  const treble = smoothedData.length > 12
    ? smoothedData.slice(12).reduce((a, b) => a + b, 0) / Math.max(1, smoothedData.length - 12)
    : 0;
  const intensity = (bass + mid + treble) / 3;

  const containerClass = size === "full"
    ? "w-full h-full"
    : size === "xl"
    ? "w-96 h-96"
    : size === "lg"
    ? "w-64 h-64"
    : size === "md"
    ? "w-48 h-48"
    : "w-32 h-32";

  if (variant === "orb") {
    return (
      <div className={`${containerClass} relative flex items-center justify-center`}>
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle,
              hsla(${hueOffset}, 70%, 50%, ${0.1 + intensity * 0.3}),
              hsla(${(hueOffset + 120) % 360}, 70%, 50%, ${0.05 + intensity * 0.2}),
              transparent 70%
            )`,
            transform: `scale(${1 + intensity * 0.3})`,
            transition: 'transform 0.3s ease-out, background 0.5s ease-out',
          }}
        />

        {/* Rings */}
        {[0, 1, 2].map((ring) => (
          <div
            key={ring}
            className="absolute rounded-full border-2"
            style={{
              width: `${40 + ring * 30}%`,
              height: `${40 + ring * 30}%`,
              borderColor: `hsla(${(hueOffset + ring * 120) % 360}, 80%, 60%, ${0.6 - ring * 0.15})`,
              transform: `scale(${1 + (ring === 0 ? bass : ring === 1 ? mid : treble) * 0.5})`,
              boxShadow: `0 0 ${20 + intensity * 40}px hsla(${(hueOffset + ring * 120) % 360}, 80%, 60%, ${intensity * 0.5})`,
              transition: 'transform 0.15s ease-out, border-color 0.5s ease-out, box-shadow 0.3s ease-out',
            }}
          />
        ))}

        {/* Center core */}
        <div
          className="absolute rounded-full"
          style={{
            width: '20%',
            height: '20%',
            background: `radial-gradient(circle,
              hsla(${hueOffset}, 90%, 70%, 1),
              hsla(${(hueOffset + 60) % 360}, 80%, 60%, 0.8)
            )`,
            transform: `scale(${1 + bass * 0.5})`,
            boxShadow: `0 0 ${30 + bass * 50}px hsla(${hueOffset}, 90%, 70%, ${0.6 + bass * 0.4})`,
            transition: 'transform 0.1s ease-out, box-shadow 0.2s ease-out',
          }}
        />
      </div>
    );
  }

  if (variant === "spectrum") {
    return (
      <div className={`${containerClass} relative flex items-end justify-center gap-1 px-4`}>
        {smoothedData.map((value, i) => {
          const height = Math.max(5, value * 100);
          const hue = ((i / smoothedData.length * 300) + hueOffset) % 360;

          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${height}%`,
                minHeight: '4px',
                background: `linear-gradient(to top,
                  hsla(${hue}, 80%, 50%, 0.8),
                  hsla(${(hue + 30) % 360}, 90%, 70%, 1)
                )`,
                boxShadow: value > 0.5 ? `0 0 10px hsla(${hue}, 90%, 60%, ${value})` : 'none',
                transition: 'height 0.1s ease-out',
              }}
            />
          );
        })}
      </div>
    );
  }

  if (variant === "particles") {
    return (
      <div className={`${containerClass} relative flex items-center justify-center overflow-hidden`}>
        {/* Background pulse */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle,
              hsla(${hueOffset}, 70%, 50%, ${intensity * 0.3}),
              transparent 60%
            )`,
            transform: `scale(${1 + intensity * 0.5})`,
            transition: 'transform 0.3s ease-out, background 0.5s ease-out',
          }}
        />

        {/* Particles */}
        {smoothedData.slice(0, 12).map((value, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const distance = 30 + value * 40;
          const x = 50 + Math.cos(angle) * distance;
          const y = 50 + Math.sin(angle) * distance;
          const particleSize = 4 + value * 16;
          const particleHue = (i * 30 + hueOffset) % 360;

          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${particleSize}px`,
                height: `${particleSize}px`,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle,
                  hsla(${particleHue}, 90%, 70%, ${0.8 + value * 0.2}),
                  hsla(${particleHue}, 80%, 50%, 0)
                )`,
                boxShadow: `0 0 ${particleSize}px hsla(${particleHue}, 90%, 60%, ${value * 0.8})`,
                transition: 'all 0.15s ease-out',
              }}
            />
          );
        })}

        {/* Center */}
        <div
          className="absolute rounded-full"
          style={{
            width: '15%',
            height: '15%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
            transform: `scale(${1 + bass * 0.3})`,
            boxShadow: `0 0 30px rgba(255,255,255,${0.5 + bass * 0.5})`,
            transition: 'transform 0.1s ease-out, box-shadow 0.2s ease-out',
          }}
        />
      </div>
    );
  }

  if (variant === "galaxy") {
    return (
      <div className={`${containerClass} relative flex items-center justify-center`}>
        {/* Spiral arms */}
        {[0, 1, 2].map((arm) => (
          <div
            key={arm}
            className="absolute inset-0"
            style={{
              transform: `rotate(${arm * 120 + hueOffset}deg) scale(${1 + intensity * 0.2})`,
              transition: 'transform 0.5s ease-out',
            }}
          >
            <div
              className="absolute inset-[20%] rounded-full"
              style={{
                background: `conic-gradient(from ${arm * 120}deg,
                  transparent,
                  hsla(${(arm * 120 + hueOffset) % 360}, 80%, 60%, ${0.3 + intensity * 0.3}),
                  transparent,
                  hsla(${(arm * 120 + 180 + hueOffset) % 360}, 80%, 60%, ${0.3 + intensity * 0.3}),
                  transparent
                )`,
                filter: 'blur(2px)',
              }}
            />
          </div>
        ))}

        {/* Core */}
        <div
          className="absolute rounded-full"
          style={{
            width: '25%',
            height: '25%',
            background: `radial-gradient(circle,
              rgba(255,255,255,1),
              hsla(${hueOffset}, 90%, 70%, 0.9),
              hsla(${(hueOffset + 60) % 360}, 80%, 50%, 0.5)
            )`,
            transform: `scale(${1 + bass * 0.4})`,
            boxShadow: `0 0 ${40 + bass * 60}px hsla(${hueOffset}, 90%, 70%, ${0.7 + bass * 0.3})`,
            transition: 'transform 0.2s ease-out, box-shadow 0.3s ease-out',
          }}
        />
      </div>
    );
  }

  if (variant === "dna") {
    return (
      <div className={`${containerClass} relative flex items-center justify-center`}>
        {/* DNA strands */}
        <div className="absolute inset-0 flex flex-col justify-between py-8">
          {smoothedData.slice(0, 10).map((value, i) => {
            const offset = Math.sin((i / 10) * Math.PI * 2 + hueOffset / 60) * 40;
            const hue = ((i * 36) + hueOffset) % 360;

            return (
              <div key={i} className="relative h-2 flex items-center">
                {/* Left node */}
                <div
                  className="absolute rounded-full"
                  style={{
                    left: `${30 + offset}%`,
                    width: `${8 + value * 16}px`,
                    height: `${8 + value * 16}px`,
                    background: `hsla(${hue}, 90%, 60%, ${0.8 + value * 0.2})`,
                    boxShadow: `0 0 ${10 + value * 20}px hsla(${hue}, 90%, 60%, ${value})`,
                    transition: 'all 0.15s ease-out',
                  }}
                />

                {/* Connection */}
                {i % 2 === 0 && (
                  <div
                    className="absolute"
                    style={{
                      left: `${Math.min(30 + offset, 50)}%`,
                      width: `${Math.abs(40 - Math.abs(offset))}%`,
                      height: '2px',
                      background: `hsla(${hue}, 70%, 50%, ${0.3 + value * 0.4})`,
                      transition: 'all 0.15s ease-out',
                    }}
                  />
                )}

                {/* Right node */}
                <div
                  className="absolute rounded-full"
                  style={{
                    left: `${70 - offset}%`,
                    width: `${8 + value * 16}px`,
                    height: `${8 + value * 16}px`,
                    background: `hsla(${(hue + 180) % 360}, 90%, 60%, ${0.8 + value * 0.2})`,
                    boxShadow: `0 0 ${10 + value * 20}px hsla(${(hue + 180) % 360}, 90%, 60%, ${value})`,
                    transition: 'all 0.15s ease-out',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Radial variant
  return (
    <div className={`${containerClass} relative flex items-center justify-center`}>
      {/* Radial bars */}
      <div className="absolute inset-0">
        {smoothedData.map((value, i) => {
          const angle = (i / smoothedData.length) * 360;
          const length = 20 + value * 30;
          const hue = (angle + hueOffset) % 360;

          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 origin-bottom"
              style={{
                width: '3px',
                height: `${length}%`,
                transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                background: `linear-gradient(to top,
                  transparent,
                  hsla(${hue}, 90%, 60%, ${0.5 + value * 0.5})
                )`,
                boxShadow: value > 0.5 ? `0 0 10px hsla(${hue}, 100%, 70%, ${value})` : 'none',
                transition: 'height 0.1s ease-out',
              }}
            />
          );
        })}
      </div>

      {/* Center pulse */}
      <div
        className="absolute rounded-full"
        style={{
          width: '15%',
          height: '15%',
          background: `radial-gradient(circle,
            hsla(${hueOffset}, 100%, 80%, 1),
            hsla(${(hueOffset + 45) % 360}, 90%, 60%, 0.5)
          )`,
          transform: `scale(${1 + intensity * 0.5})`,
          boxShadow: `0 0 ${20 + intensity * 40}px hsla(${hueOffset}, 100%, 70%, ${intensity})`,
          transition: 'transform 0.1s ease-out, box-shadow 0.2s ease-out',
        }}
      />
    </div>
  );
};
