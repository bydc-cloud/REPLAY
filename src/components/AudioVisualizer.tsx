import { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

export const AudioVisualizer = ({ isPlaying, barCount = 5, className = "" }: AudioVisualizerProps) => {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(20));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(barCount).fill(20));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array(barCount)
          .fill(0)
          .map(() => Math.random() * 80 + 20)
      );
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <div className={`flex items-center justify-center gap-0.5 h-4 ${className}`}>
      {heights.map((height, i) => (
        <div
          key={i}
          className="w-0.5 bg-[var(--replay-off-white)] rounded-full transition-all duration-150 ease-out"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
};
