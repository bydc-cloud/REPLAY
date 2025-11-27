import { useEffect, useState } from "react";
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
  const [smoothedData, setSmoothedData] = useState<number[]>([]);

  // Process frequency data with smoothing for better performance
  useEffect(() => {
    if (!frequencyData || frequencyData.length === 0) return;

    // Sample fewer points for performance
    const sampleSize = variant === "spectrum" ? 32 : 16;
    const step = Math.floor(frequencyData.length / sampleSize);
    const sampled = [];

    for (let i = 0; i < sampleSize; i++) {
      const index = i * step;
      const value = frequencyData[index] / 255;
      // Apply smoothing
      sampled.push(value);
    }

    setSmoothedData(sampled);
  }, [frequencyData, variant]);

  // Calculate audio metrics
  const bass = smoothedData.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
  const mid = smoothedData.slice(4, 12).reduce((a, b) => a + b, 0) / 8;
  const treble = smoothedData.slice(12).reduce((a, b) => a + b, 0) / Math.max(1, smoothedData.length - 12);
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
          className="absolute inset-0 rounded-full blur-3xl transition-all duration-300 ease-out"
          style={{
            background: `radial-gradient(circle,
              hsla(${Date.now() / 100 % 360}, 70%, 50%, ${intensity * 0.4}),
              hsla(${(Date.now() / 100 + 120) % 360}, 70%, 50%, ${intensity * 0.3}),
              transparent 70%
            )`,
            transform: `scale(${1 + intensity * 0.3})`,
          }}
        />

        {/* Rings */}
        {[0, 1, 2].map((ring) => (
          <div
            key={ring}
            className="absolute rounded-full border-2 transition-all duration-100 ease-out"
            style={{
              width: `${40 + ring * 30}%`,
              height: `${40 + ring * 30}%`,
              borderColor: `hsla(${(Date.now() / 50 + ring * 120) % 360}, 80%, 60%, ${0.6 - ring * 0.15})`,
              transform: `scale(${1 + (ring === 0 ? bass : ring === 1 ? mid : treble) * 0.5})`,
              boxShadow: `0 0 ${20 + intensity * 40}px hsla(${(Date.now() / 50 + ring * 120) % 360}, 80%, 60%, ${intensity * 0.5})`
            }}
          />
        ))}

        {/* Center core */}
        <div
          className="absolute rounded-full transition-all duration-100 ease-out"
          style={{
            width: '20%',
            height: '20%',
            background: `radial-gradient(circle,
              hsla(${Date.now() / 80 % 360}, 90%, 70%, 1),
              hsla(${(Date.now() / 80 + 60) % 360}, 80%, 60%, 0.8)
            )`,
            transform: `scale(${1 + bass * 0.5})`,
            boxShadow: `0 0 ${30 + bass * 50}px hsla(${Date.now() / 80 % 360}, 90%, 70%, ${0.6 + bass * 0.4})`
          }}
        />
      </div>
    );
  }

  if (variant === "spectrum") {
    return (
      <div className={`${containerClass} relative flex items-end justify-center gap-1 px-4`}>
        {smoothedData.map((value, i) => {
          const height = Math.max(10, value * 100);
          const hue = (i / smoothedData.length * 300) % 360;

          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-75 ease-out"
              style={{
                height: `${height}%`,
                background: `linear-gradient(to top,
                  hsla(${hue}, 80%, 50%, 0.8),
                  hsla(${hue + 30}, 90%, 70%, 1)
                )`,
                boxShadow: value > 0.5 ? `0 0 10px hsla(${hue}, 90%, 60%, ${value})` : 'none',
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
          className="absolute inset-0 rounded-full blur-2xl transition-all duration-300"
          style={{
            background: `radial-gradient(circle,
              hsla(${Date.now() / 100 % 360}, 70%, 50%, ${intensity * 0.3}),
              transparent 60%
            )`,
            transform: `scale(${1 + intensity * 0.5})`,
          }}
        />

        {/* Particles */}
        {smoothedData.slice(0, 12).map((value, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const distance = 30 + value * 40;
          const x = 50 + Math.cos(angle) * distance;
          const y = 50 + Math.sin(angle) * distance;
          const size = 4 + value * 16;

          return (
            <div
              key={i}
              className="absolute rounded-full transition-all duration-150 ease-out"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle,
                  hsla(${(i * 30 + Date.now() / 50) % 360}, 90%, 70%, ${0.8 + value * 0.2}),
                  hsla(${(i * 30 + Date.now() / 50) % 360}, 80%, 50%, 0)
                )`,
                boxShadow: `0 0 ${size}px hsla(${(i * 30) % 360}, 90%, 60%, ${value * 0.8})`
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
            boxShadow: `0 0 30px rgba(255,255,255,${0.5 + bass * 0.5})`
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
            className="absolute inset-0 transition-all duration-500 ease-out"
            style={{
              transform: `rotate(${arm * 120 + Date.now() / 100}deg) scale(${1 + intensity * 0.2})`,
            }}
          >
            <div
              className="absolute inset-[20%] rounded-full"
              style={{
                background: `conic-gradient(from ${arm * 120}deg,
                  transparent,
                  hsla(${(arm * 120 + Date.now() / 80) % 360}, 80%, 60%, ${0.3 + intensity * 0.3}),
                  transparent,
                  hsla(${(arm * 120 + 180 + Date.now() / 80) % 360}, 80%, 60%, ${0.3 + intensity * 0.3}),
                  transparent
                )`,
                filter: 'blur(2px)',
              }}
            />
          </div>
        ))}

        {/* Core */}
        <div
          className="absolute rounded-full transition-all duration-200"
          style={{
            width: '25%',
            height: '25%',
            background: `radial-gradient(circle,
              rgba(255,255,255,1),
              hsla(${Date.now() / 60 % 360}, 90%, 70%, 0.9),
              hsla(${(Date.now() / 60 + 60) % 360}, 80%, 50%, 0.5)
            )`,
            transform: `scale(${1 + bass * 0.4})`,
            boxShadow: `0 0 ${40 + bass * 60}px hsla(${Date.now() / 60 % 360}, 90%, 70%, ${0.7 + bass * 0.3})`
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
            const offset = Math.sin((i / 10) * Math.PI * 2 + Date.now() / 500) * 40;
            const hue = (i * 36) % 360;

            return (
              <div key={i} className="relative h-2 flex items-center">
                {/* Left node */}
                <div
                  className="absolute rounded-full transition-all duration-100"
                  style={{
                    left: `${30 + offset}%`,
                    width: `${8 + value * 16}px`,
                    height: `${8 + value * 16}px`,
                    background: `hsla(${hue}, 90%, 60%, ${0.8 + value * 0.2})`,
                    boxShadow: `0 0 ${10 + value * 20}px hsla(${hue}, 90%, 60%, ${value})`
                  }}
                />

                {/* Connection */}
                {i % 2 === 0 && (
                  <div
                    className="absolute transition-all duration-100"
                    style={{
                      left: `${Math.min(30 + offset, 50)}%`,
                      width: `${Math.abs(40 - Math.abs(offset))}%`,
                      height: '2px',
                      background: `hsla(${hue}, 70%, 50%, ${0.3 + value * 0.4})`,
                    }}
                  />
                )}

                {/* Right node */}
                <div
                  className="absolute rounded-full transition-all duration-100"
                  style={{
                    left: `${70 - offset}%`,
                    width: `${8 + value * 16}px`,
                    height: `${8 + value * 16}px`,
                    background: `hsla(${hue + 180}, 90%, 60%, ${0.8 + value * 0.2})`,
                    boxShadow: `0 0 ${10 + value * 20}px hsla(${hue + 180}, 90%, 60%, ${value})`
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
          const hue = (angle + Date.now() / 50) % 360;

          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 origin-bottom transition-all duration-75"
              style={{
                width: '2px',
                height: `${length}%`,
                transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                background: `linear-gradient(to top,
                  transparent,
                  hsla(${hue}, 90%, 60%, ${0.5 + value * 0.5})
                )`,
                boxShadow: value > 0.5 ? `0 0 10px hsla(${hue}, 100%, 70%, ${value})` : 'none'
              }}
            />
          );
        })}
      </div>

      {/* Center pulse */}
      <div
        className="absolute rounded-full transition-all duration-100"
        style={{
          width: '15%',
          height: '15%',
          background: `radial-gradient(circle,
            hsla(${Date.now() / 70 % 360}, 100%, 80%, 1),
            hsla(${(Date.now() / 70 + 45) % 360}, 90%, 60%, 0.5)
          )`,
          transform: `scale(${1 + intensity * 0.5})`,
          boxShadow: `0 0 ${20 + intensity * 40}px hsla(${Date.now() / 70 % 360}, 100%, 70%, ${intensity})`
        }}
      />
    </div>
  );
};