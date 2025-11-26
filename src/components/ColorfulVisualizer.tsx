import { useEffect, useState } from "react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

interface ColorfulVisualizerProps {
  isPlaying: boolean;
  variant?: "orb" | "spectrum" | "particles" | "galaxy" | "dna" | "radial";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  audioElement?: HTMLAudioElement | null;
}

export const ColorfulVisualizer = ({ 
  isPlaying, 
  variant = "orb",
  size = "md",
  audioElement
}: ColorfulVisualizerProps) => {
  const { frequencyData } = useAudioAnalyzer(isPlaying ? audioElement : null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const sizeMap = {
    sm: { container: "w-16 h-16", orbit: 28, center: 12, barCount: 32 },
    md: { container: "w-32 h-32", orbit: 56, center: 24, barCount: 48 },
    lg: { container: "w-48 h-48", orbit: 84, center: 36, barCount: 64 },
    xl: { container: "w-80 h-80", orbit: 140, center: 60, barCount: 80 },
    full: { container: "w-full h-full", orbit: 280, center: 100, barCount: 120 },
  };

  const { container, orbit, center, barCount } = sizeMap[size];

  // Get average frequency for global effects - boosted for more reactivity
  const avgFrequency = Array.from(frequencyData).reduce((a, b) => a + b, 0) / frequencyData.length;
  const rawIntensity = avgFrequency / 255;
  // Apply exponential curve for more dramatic response
  const intensity = Math.pow(rawIntensity, 0.7) * 1.5;

  // Get bass, mid, treble frequencies - boosted with exponential scaling
  const rawBass = Array.from(frequencyData.slice(0, 10)).reduce((a, b) => a + b, 0) / 10 / 255;
  const rawMid = Array.from(frequencyData.slice(10, 50)).reduce((a, b) => a + b, 0) / 40 / 255;
  const rawTreble = Array.from(frequencyData.slice(50)).reduce((a, b) => a + b, 0) / (frequencyData.length - 50) / 255;

  // Apply exponential curves for more dramatic audio response
  const bass = Math.pow(rawBass, 0.6) * 1.8;
  const mid = Math.pow(rawMid, 0.7) * 1.5;
  const treble = Math.pow(rawTreble, 0.8) * 1.3;

  // ORB - Colorful 3D Sphere with rotating spectrum
  if (variant === "orb") {
    return (
      <div className={`${container} relative flex items-center justify-center`}>
        {/* Outer colorful glow */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl transition-all duration-100"
          style={{
            background: `radial-gradient(circle, 
              rgba(255, 100, 150, ${intensity * 0.4}) 0%, 
              rgba(100, 150, 255, ${intensity * 0.3}) 40%,
              rgba(150, 255, 100, ${intensity * 0.2}) 70%,
              transparent 100%
            )`,
            transform: `scale(${1 + intensity * 0.2})`,
          }}
        />
        
        {/* Middle glow ring */}
        <div 
          className="absolute inset-[15%] rounded-full blur-lg transition-all duration-100"
          style={{
            background: `radial-gradient(circle, 
              rgba(150, 100, 255, ${intensity * 0.6}) 0%,
              rgba(255, 200, 100, ${intensity * 0.4}) 50%,
              transparent 80%
            )`,
            transform: `scale(${1 + bass * 0.3})`,
          }}
        />

        {/* Rotating spectrum bars */}
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: barCount }).map((_, i) => {
            const dataIndex = Math.floor((i / barCount) * frequencyData.length);
            const height = (frequencyData[dataIndex] / 255) * (orbit / 1.5);
            const angle = (i / barCount) * 360;
            const hue = (i / barCount) * 360 + rotation;
            
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  width: '3px',
                  height: `${height}px`,
                  transform: `rotate(${angle + rotation}deg) translateY(-${orbit / 2}px)`,
                  transformOrigin: 'bottom center',
                  background: `linear-gradient(to top, 
                    hsla(${hue}, 80%, 60%, 0.6),
                    hsla(${hue + 30}, 90%, 70%, 0.9)
                  )`,
                  boxShadow: `0 0 ${height / 3}px hsla(${hue}, 90%, 70%, 0.8)`,
                  transition: 'height 0.05s ease-out',
                  borderRadius: '2px',
                }}
              />
            );
          })}
        </div>

        {/* Center orb with gradient */}
        <div 
          className="absolute rounded-full backdrop-blur-sm border transition-all duration-100"
          style={{
            width: `${center}px`,
            height: `${center}px`,
            borderColor: `rgba(255, 255, 255, ${0.3 + intensity * 0.4})`,
            background: `radial-gradient(circle at 35% 35%, 
              rgba(255, 255, 255, ${0.4 + intensity * 0.2}),
              hsla(${rotation}, 80%, 70%, ${0.3 + bass * 0.3}),
              hsla(${rotation + 60}, 80%, 60%, ${0.2 + mid * 0.2})
            )`,
            boxShadow: `
              0 0 ${center * (1 + intensity)}px hsla(${rotation}, 80%, 70%, ${0.6 + intensity * 0.4}),
              inset 0 0 ${center / 2}px rgba(255, 255, 255, 0.3)
            `,
            transform: `scale(${1 + bass * 0.2})`,
          }}
        />
      </div>
    );
  }

  // SPECTRUM - Full colorful frequency bars
  if (variant === "spectrum") {
    const displayBars = Array.from({ length: barCount }).map((_, i) => {
      const dataIndex = Math.floor((i / barCount) * frequencyData.length);
      return frequencyData[dataIndex] || 0;
    });

    return (
      <div className={`${container} relative flex items-end justify-center gap-0.5 px-2 overflow-hidden`}>
        {/* Colorful background glow */}
        <div 
          className="absolute inset-0 blur-3xl transition-opacity duration-300"
          style={{
            background: `linear-gradient(to top, 
              hsla(${rotation}, 70%, 50%, ${bass * 0.4}),
              hsla(${rotation + 120}, 70%, 50%, ${mid * 0.3}),
              hsla(${rotation + 240}, 70%, 50%, ${treble * 0.2})
            )`,
          }}
        />

        {/* Spectrum bars with rainbow gradient */}
        {displayBars.map((height, i) => {
          const normalizedHeight = Math.max(15, (height / 255) * 100);
          const hue = (i / displayBars.length) * 300 + rotation / 2;
          const saturation = 70 + (height / 255) * 30;
          const lightness = 50 + (height / 255) * 20;
          
          return (
            <div
              key={i}
              className="flex-1 rounded-t-full transition-all duration-75 ease-out"
              style={{
                height: `${normalizedHeight}%`,
                minWidth: '2px',
                maxWidth: '8px',
                background: `linear-gradient(to top,
                  hsla(${hue}, ${saturation}%, ${lightness}%, 0.7),
                  hsla(${hue + 20}, ${saturation + 10}%, ${lightness + 10}%, 0.95)
                )`,
                boxShadow: `
                  0 0 ${normalizedHeight / 5}px hsla(${hue}, 90%, 60%, 0.6),
                  0 -${normalizedHeight / 10}px ${normalizedHeight / 4}px hsla(${hue}, 80%, 50%, 0.4)
                `,
              }}
            />
          );
        })}
      </div>
    );
  }

  // PARTICLES - Floating particle field
  if (variant === "particles") {
    return (
      <div className={`${container} relative flex items-center justify-center overflow-hidden`}>
        {/* Background gradient */}
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: `radial-gradient(circle at center, 
              hsla(${rotation}, 60%, 40%, ${intensity * 0.3}),
              hsla(${rotation + 120}, 60%, 30%, ${intensity * 0.2}),
              transparent 70%
            )`,
          }}
        />

        {/* Particle system */}
        {Array.from({ length: Math.min(32, barCount / 2) }).map((_, i) => {
          const dataIndex = Math.floor((i / 32) * frequencyData.length);
          const particleSize = 2 + (frequencyData[dataIndex] / 255) * 12;
          const angle = (i / 32) * 360 + rotation;
          const distance = (orbit / 3) * (0.5 + (frequencyData[dataIndex] / 255) * 0.5);
          const hue = (i / 32) * 360 + rotation;
          
          return (
            <div
              key={i}
              className="absolute rounded-full transition-all duration-100"
              style={{
                width: `${particleSize}px`,
                height: `${particleSize}px`,
                transform: `rotate(${angle}deg) translateX(${distance}px)`,
                background: `radial-gradient(circle, 
                  hsla(${hue}, 90%, 70%, 0.9),
                  hsla(${hue + 30}, 80%, 60%, 0.6)
                )`,
                boxShadow: `
                  0 0 ${particleSize * 2}px hsla(${hue}, 90%, 70%, 0.8),
                  0 0 ${particleSize}px hsla(${hue}, 100%, 80%, 1)
                `,
                filter: 'blur(0.5px)',
              }}
            />
          );
        })}

        {/* Center core */}
        <div 
          className="absolute rounded-full transition-all duration-100"
          style={{
            width: `${center}px`,
            height: `${center}px`,
            background: `radial-gradient(circle, 
              rgba(255, 255, 255, ${0.6 + intensity * 0.4}),
              hsla(${rotation}, 80%, 70%, ${0.4 + bass * 0.4})
            )`,
            boxShadow: `0 0 ${center * 2}px hsla(${rotation}, 90%, 70%, ${0.6 + intensity * 0.4})`,
            transform: `scale(${1 + avgFrequency / 400})`,
          }}
        />
      </div>
    );
  }

  // GALAXY - Spiral galaxy effect
  if (variant === "galaxy") {
    return (
      <div className={`${container} relative flex items-center justify-center overflow-hidden`}>
        {/* Background nebula */}
        <div 
          className="absolute inset-0 blur-2xl transition-all duration-500"
          style={{
            background: `radial-gradient(ellipse at center, 
              hsla(${rotation}, 70%, 50%, ${bass * 0.4}),
              hsla(${rotation + 80}, 60%, 40%, ${mid * 0.3}),
              hsla(${rotation + 160}, 70%, 45%, ${treble * 0.2}),
              transparent 80%
            )`,
            transform: `rotate(${rotation}deg) scale(${1 + intensity * 0.3})`,
          }}
        />

        {/* Spiral arms */}
        {[0, 1, 2].map(arm => (
          <div key={arm} className="absolute inset-0">
            {Array.from({ length: 20 }).map((_, i) => {
              const dataIndex = Math.floor(((arm * 20 + i) / 60) * frequencyData.length);
              const size = 2 + (frequencyData[dataIndex] / 255) * 8;
              const spiralAngle = (i / 20) * 360 + (arm * 120) + rotation * 2;
              const spiralDistance = (i / 20) * (orbit / 2);
              const hue = spiralAngle + rotation;
              
              return (
                <div
                  key={i}
                  className="absolute rounded-full transition-all duration-100"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${spiralAngle}deg) translateX(${spiralDistance}px) translateY(-${size / 2}px)`,
                    background: `radial-gradient(circle,
                      hsla(${hue}, 90%, 70%, 0.9),
                      hsla(${hue + 40}, 80%, 60%, 0.5)
                    )`,
                    boxShadow: `0 0 ${size * 3}px hsla(${hue}, 90%, 70%, 0.7)`,
                    filter: 'blur(0.5px)',
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Galactic core */}
        <div 
          className="absolute rounded-full transition-all duration-100"
          style={{
            width: `${center * 1.5}px`,
            height: `${center * 1.5}px`,
            background: `radial-gradient(circle, 
              rgba(255, 255, 255, 0.9),
              hsla(${rotation + 60}, 100%, 80%, 0.7),
              hsla(${rotation}, 90%, 60%, 0.4)
            )`,
            boxShadow: `
              0 0 ${center * 3}px hsla(${rotation}, 100%, 80%, 0.8),
              0 0 ${center * 1.5}px rgba(255, 255, 255, 0.9)
            `,
            transform: `scale(${1 + bass * 0.3})`,
          }}
        />
      </div>
    );
  }

  // DNA - Double helix structure
  if (variant === "dna") {
    return (
      <div className={`${container} relative flex items-center justify-center`}>
        {/* Background glow */}
        <div 
          className="absolute inset-0 blur-2xl"
          style={{
            background: `linear-gradient(to bottom,
              hsla(${rotation}, 70%, 50%, ${treble * 0.3}),
              hsla(${rotation + 180}, 70%, 50%, ${bass * 0.3})
            )`,
          }}
        />

        {/* DNA helixes */}
        {[0, 1].map(helix => (
          <div key={helix} className="absolute inset-0">
            {Array.from({ length: 24 }).map((_, i) => {
              const dataIndex = Math.floor(((helix * 24 + i) / 48) * frequencyData.length);
              const size = 4 + (frequencyData[dataIndex] / 255) * 8;
              const yPos = (i / 24) * 100;
              const xOffset = Math.sin((i / 24) * Math.PI * 4 + rotation / 30 + helix * Math.PI) * (orbit / 3);
              const hue = helix === 0 ? rotation : rotation + 180;
              
              return (
                <div
                  key={i}
                  className="absolute rounded-full transition-all duration-100"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `calc(50% + ${xOffset}px)`,
                    top: `${yPos}%`,
                    transform: `translate(-50%, -50%)`,
                    background: `radial-gradient(circle,
                      hsla(${hue}, 90%, 70%, 0.9),
                      hsla(${hue + 30}, 80%, 60%, 0.6)
                    )`,
                    boxShadow: `0 0 ${size * 2}px hsla(${hue}, 90%, 70%, 0.7)`,
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Connecting bars */}
        {Array.from({ length: 12 }).map((_, i) => {
          const dataIndex = Math.floor((i / 12) * frequencyData.length);
          const width = 20 + (frequencyData[dataIndex] / 255) * 40;
          const yPos = (i / 12) * 100;
          const opacity = 0.3 + (frequencyData[dataIndex] / 255) * 0.5;
          
          return (
            <div
              key={i}
              className="absolute transition-all duration-100"
              style={{
                width: `${width}px`,
                height: '2px',
                left: '50%',
                top: `${yPos}%`,
                transform: 'translate(-50%, -50%)',
                background: `linear-gradient(to right,
                  hsla(${rotation}, 80%, 60%, ${opacity}),
                  hsla(${rotation + 180}, 80%, 60%, ${opacity})
                )`,
                boxShadow: `0 0 8px hsla(${rotation + 90}, 80%, 60%, ${opacity})`,
              }}
            />
          );
        })}
      </div>
    );
  }

  // RADIAL - Radial wave pulses
  if (variant === "radial") {
    return (
      <div className={`${container} relative flex items-center justify-center overflow-hidden`}>
        {/* Radial waves */}
        {Array.from({ length: 8 }).map((_, ring) => {
          const dataIndex = Math.floor((ring / 8) * frequencyData.length);
          const scale = 0.3 + ring * 0.12;
          const ringIntensity = frequencyData[dataIndex] / 255;
          const hue = (ring / 8) * 360 + rotation;
          
          return (
            <div
              key={ring}
              className="absolute rounded-full transition-all duration-100 border-2"
              style={{
                width: `${orbit * scale}px`,
                height: `${orbit * scale}px`,
                borderColor: `hsla(${hue}, 80%, 60%, ${0.4 + ringIntensity * 0.5})`,
                transform: `scale(${1 + ringIntensity * 0.3})`,
                boxShadow: `
                  0 0 ${20 * ringIntensity}px hsla(${hue}, 90%, 60%, ${ringIntensity * 0.8}),
                  inset 0 0 ${10 * ringIntensity}px hsla(${hue}, 90%, 70%, ${ringIntensity * 0.5})
                `,
              }}
            />
          );
        })}

        {/* Center gradient orb */}
        <div 
          className="absolute rounded-full transition-all duration-100"
          style={{
            width: `${center * 1.5}px`,
            height: `${center * 1.5}px`,
            background: `radial-gradient(circle,
              hsla(${rotation}, 100%, 80%, 0.9),
              hsla(${rotation + 60}, 90%, 70%, 0.7),
              hsla(${rotation + 120}, 80%, 60%, 0.5)
            )`,
            boxShadow: `
              0 0 ${center * 2}px hsla(${rotation}, 90%, 70%, ${0.8 + bass * 0.2}),
              0 0 ${center}px rgba(255, 255, 255, 0.9)
            `,
            transform: `scale(${1 + intensity * 0.3}) rotate(${rotation}deg)`,
          }}
        />
      </div>
    );
  }

  return null;
};
