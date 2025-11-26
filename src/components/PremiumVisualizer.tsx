import { useEffect, useState } from "react";

interface PremiumVisualizerProps {
  isPlaying: boolean;
  variant?: "orb" | "spectrum" | "pulse" | "ripple";
  size?: "sm" | "md" | "lg" | "xl";
}

export const PremiumVisualizer = ({ 
  isPlaying, 
  variant = "orb",
  size = "md" 
}: PremiumVisualizerProps) => {
  const [bars, setBars] = useState<number[]>(Array(64).fill(30));
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(64).fill(30));
      return;
    }

    const interval = setInterval(() => {
      setBars(
        Array(64)
          .fill(0)
          .map((_, i) => {
            const time = Date.now() / 300;
            const wave1 = Math.sin(time + (i / 8)) * 35;
            const wave2 = Math.sin(time * 1.5 + (i / 4)) * 25;
            const wave3 = Math.cos(time * 0.8 + (i / 6)) * 20;
            return 50 + wave1 + wave2 + wave3;
          })
      );
    }, 50);

    const rotationInterval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360);
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(rotationInterval);
    };
  }, [isPlaying]);

  const sizeMap = {
    sm: { container: "w-16 h-16", orbit: 28, center: 12 },
    md: { container: "w-32 h-32", orbit: 56, center: 24 },
    lg: { container: "w-48 h-48", orbit: 84, center: 36 },
    xl: { container: "w-80 h-80", orbit: 140, center: 60 },
  };

  const { container, orbit, center } = sizeMap[size];

  // ORB - 3D Sphere Effect
  if (variant === "orb") {
    return (
      <div className={`${container} relative flex items-center justify-center`}>
        {/* Outer glow rings */}
        <div 
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{
            background: `radial-gradient(circle, 
              rgba(232, 232, 232, 0.4) 0%, 
              rgba(232, 232, 232, 0.2) 30%,
              transparent 70%
            )`,
            animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        />
        
        {/* Middle glow ring */}
        <div 
          className="absolute inset-[10%] rounded-full opacity-30 blur-lg"
          style={{
            background: `radial-gradient(circle, 
              rgba(232, 232, 232, 0.6) 0%, 
              transparent 70%
            )`,
            animation: isPlaying ? 'pulse 2s ease-in-out infinite 0.3s' : 'none',
          }}
        />

        {/* Circular spectrum bars */}
        <div className="absolute inset-0 flex items-center justify-center">
          {bars.map((height, i) => {
            const angle = (i / bars.length) * 360;
            const barHeight = (height / 100) * (orbit / 2);
            
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  width: '2px',
                  height: `${barHeight}px`,
                  transform: `rotate(${angle + rotation}deg) translateY(-${orbit / 2}px)`,
                  transformOrigin: 'bottom center',
                  background: `linear-gradient(to top, 
                    rgba(232, 232, 232, ${0.3 + (height / 200)}),
                    rgba(232, 232, 232, ${0.6 + (height / 150)})
                  )`,
                  boxShadow: `0 0 ${height / 20}px rgba(232, 232, 232, ${0.4 + (height / 200)})`,
                  transition: 'height 0.05s ease-out',
                  borderRadius: '1px',
                }}
              />
            );
          })}
        </div>

        {/* Center orb */}
        <div 
          className="absolute rounded-full backdrop-blur-sm border border-white/30"
          style={{
            width: `${center}px`,
            height: `${center}px`,
            background: `radial-gradient(circle at 30% 30%, 
              rgba(255, 255, 255, 0.3),
              rgba(232, 232, 232, 0.2),
              rgba(232, 232, 232, 0.1)
            )`,
            boxShadow: `
              0 0 ${center / 2}px rgba(232, 232, 232, 0.4),
              inset 0 0 ${center / 4}px rgba(255, 255, 255, 0.2)
            `,
            animation: isPlaying ? 'float 3s ease-in-out infinite' : 'none',
          }}
        />
      </div>
    );
  }

  // SPECTRUM - Full spectrum analyzer
  if (variant === "spectrum") {
    return (
      <div className={`${container} relative flex items-end justify-center gap-0.5 px-2`}>
        {/* Background gradient */}
        <div 
          className="absolute inset-0 opacity-20 blur-2xl rounded-lg"
          style={{
            background: `linear-gradient(to top, 
              rgba(232, 232, 232, 0.3) 0%, 
              transparent 60%
            )`,
          }}
        />

        {/* Spectrum bars */}
        {bars.map((height, i) => {
          const progress = i / bars.length;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-full transition-all duration-50 ease-out"
              style={{
                height: `${height}%`,
                minWidth: '2px',
                background: `linear-gradient(to top,
                  rgba(232, 232, 232, ${0.4 + progress * 0.2}),
                  rgba(232, 232, 232, ${0.7 + progress * 0.3})
                )`,
                boxShadow: `
                  0 0 ${height / 10}px rgba(232, 232, 232, ${0.3 + progress * 0.2}),
                  0 -${height / 20}px ${height / 8}px rgba(232, 232, 232, ${0.2 + progress * 0.1})
                `,
              }}
            />
          );
        })}

        {/* Reflection */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3 opacity-20"
          style={{
            background: 'linear-gradient(to bottom, rgba(232, 232, 232, 0.1), transparent)',
            transform: 'scaleY(-1)',
          }}
        />
      </div>
    );
  }

  // PULSE - Concentric pulsing rings
  if (variant === "pulse") {
    return (
      <div className={`${container} relative flex items-center justify-center`}>
        {/* Pulsing rings */}
        {[0, 1, 2, 3, 4].map((ring) => {
          const avgHeight = bars.slice(ring * 12, (ring + 1) * 12).reduce((a, b) => a + b, 0) / 12;
          const scale = 0.2 + (ring * 0.2);
          const opacity = 0.6 - (ring * 0.12);
          
          return (
            <div
              key={ring}
              className="absolute rounded-full border-2"
              style={{
                width: `${orbit * scale}px`,
                height: `${orbit * scale}px`,
                borderColor: `rgba(232, 232, 232, ${opacity})`,
                transform: `scale(${1 + (avgHeight / 500)})`,
                boxShadow: `0 0 ${avgHeight / 5}px rgba(232, 232, 232, ${opacity / 2})`,
                transition: 'transform 0.05s ease-out',
                animation: isPlaying ? `ripple ${2 + ring * 0.3}s ease-in-out infinite ${ring * 0.2}s` : 'none',
              }}
            />
          );
        })}

        {/* Center pulse dot */}
        <div 
          className="absolute rounded-full"
          style={{
            width: `${center}px`,
            height: `${center}px`,
            background: 'radial-gradient(circle, rgba(232, 232, 232, 0.8), rgba(232, 232, 232, 0.4))',
            boxShadow: `0 0 ${center}px rgba(232, 232, 232, 0.6)`,
            animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
      </div>
    );
  }

  // RIPPLE - Liquid ripple effect
  if (variant === "ripple") {
    return (
      <div className={`${container} relative flex items-center justify-center overflow-hidden rounded-full`}>
        {/* Liquid background */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, 
              rgba(232, 232, 232, 0.15) 0%,
              rgba(232, 232, 232, 0.05) 50%,
              transparent 100%
            )`,
          }}
        />

        {/* Animated ripples */}
        {bars.slice(0, 8).map((height, i) => {
          const size = (orbit / 8) * (i + 1) * (0.8 + height / 200);
          return (
            <div
              key={i}
              className="absolute rounded-full border"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderColor: `rgba(232, 232, 232, ${0.4 - (i * 0.05)})`,
                borderWidth: '2px',
                animation: isPlaying ? `ripple ${3 + i * 0.5}s ease-out infinite ${i * 0.3}s` : 'none',
                boxShadow: `0 0 ${height / 10}px rgba(232, 232, 232, ${0.3 - (i * 0.03)})`,
              }}
            />
          );
        })}

        {/* Center orb with particles */}
        <div 
          className="absolute rounded-full"
          style={{
            width: `${center}px`,
            height: `${center}px`,
            background: `radial-gradient(circle at 40% 40%, 
              rgba(255, 255, 255, 0.4),
              rgba(232, 232, 232, 0.3),
              rgba(232, 232, 232, 0.1)
            )`,
            boxShadow: `
              0 0 ${center}px rgba(232, 232, 232, 0.4),
              inset 0 0 ${center / 2}px rgba(255, 255, 255, 0.2)
            `,
          }}
        />
      </div>
    );
  }

  return null;
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const styleId = 'premium-visualizer-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-4px); }
      }
      
      @keyframes ripple {
        0% {
          transform: scale(0.8);
          opacity: 1;
        }
        100% {
          transform: scale(1.3);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
