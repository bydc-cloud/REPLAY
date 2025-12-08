import { useState, useRef, useEffect, useMemo } from "react";

interface WaveformProgressProps {
  progress: number; // 0-100
  duration: number; // seconds
  currentTime: number; // seconds
  onSeek: (progress: number) => void;
  audioUrl?: string;
  isPlaying?: boolean;
  compact?: boolean;
}

export const WaveformProgress = ({
  progress,
  duration,
  currentTime,
  onSeek,
  audioUrl,
  isPlaying = false,
  compact = false,
}: WaveformProgressProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Number of bars based on screen size and mode
  const barCount = compact ? 50 : (typeof window !== 'undefined' && window.innerWidth < 768) ? 60 : 120;

  // Generate waveform data
  useEffect(() => {
    if (!audioUrl) {
      // Generate placeholder waveform
      const placeholderPeaks = Array.from({ length: barCount }, (_, i) => {
        const position = i / barCount;
        const wave1 = Math.sin(position * Math.PI * 6) * 0.25;
        const wave2 = Math.sin(position * Math.PI * 12) * 0.15;
        const wave3 = Math.sin(position * Math.PI * 2.5) * 0.2;
        const base = 0.35;
        return Math.max(0.08, Math.min(1, base + wave1 + wave2 + wave3 + Math.random() * 0.12));
      });
      setPeaks(placeholderPeaks);
      return;
    }

    const generateWaveform = async () => {
      setIsLoading(true);
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0);
        const samplesPerBar = Math.floor(rawData.length / barCount);
        const newPeaks: number[] = [];

        for (let i = 0; i < barCount; i++) {
          const start = i * samplesPerBar;
          const end = start + samplesPerBar;
          let sum = 0;
          let max = 0;

          for (let j = start; j < end; j++) {
            const absolute = Math.abs(rawData[j]);
            sum += absolute;
            if (absolute > max) max = absolute;
          }

          const avg = sum / samplesPerBar;
          newPeaks.push(avg * 0.6 + max * 0.4);
        }

        const maxPeak = Math.max(...newPeaks);
        const normalizedPeaks = newPeaks.map(p => Math.max(0.08, p / maxPeak));
        setPeaks(normalizedPeaks);
        audioContext.close();
      } catch (err) {
        // Fallback to placeholder on error
        const placeholderPeaks = Array.from({ length: barCount }, () =>
          0.2 + Math.random() * 0.6
        );
        setPeaks(placeholderPeaks);
      } finally {
        setIsLoading(false);
      }
    };

    generateWaveform();
  }, [audioUrl, barCount]);

  // Handle mouse/touch interactions
  const calculateProgress = (clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const newProgress = calculateProgress(e.clientX);
    onSeek(newProgress);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const newHoverProgress = calculateProgress(e.clientX);
    setHoverProgress(newHoverProgress);

    if (isDragging) {
      onSeek(newHoverProgress);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoverProgress(null);
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const newProgress = calculateProgress(e.touches[0].clientX);
    onSeek(newProgress);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const newProgress = calculateProgress(e.touches[0].clientX);
      onSeek(newProgress);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate hover time
  const hoverTime = hoverProgress !== null ? (hoverProgress / 100) * duration : null;

  const height = compact ? "h-8" : "h-12 md:h-16";
  const barWidth = compact ? "w-[2px]" : "w-[2px] md:w-[3px]";
  const gap = compact ? "gap-[1px]" : "gap-[1px] md:gap-[2px]";

  return (
    <div className="w-full">
      {/* Waveform Container */}
      <div
        ref={containerRef}
        className={`relative ${height} cursor-pointer select-none group`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Hover time tooltip */}
        {hoverProgress !== null && hoverTime !== null && (
          <div
            className="absolute -top-8 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none z-10 border border-white/20"
            style={{ left: `${hoverProgress}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}

        {/* Waveform bars */}
        <div className={`flex items-end justify-center ${height} ${gap}`}>
          {peaks.map((peak, index) => {
            const barProgress = (index / peaks.length) * 100;
            const isPlayed = barProgress <= progress;
            const isHovered = hoverProgress !== null && barProgress <= hoverProgress;

            return (
              <div
                key={index}
                className={`${barWidth} rounded-full transition-all duration-75 origin-bottom`}
                style={{
                  height: `${Math.max(8, peak * 100)}%`,
                  backgroundColor: isPlayed
                    ? isPlaying
                      ? `hsl(${260 + (index / peaks.length) * 60}, 80%, 65%)`
                      : `hsl(${270 + (index / peaks.length) * 40}, 70%, 60%)`
                    : isHovered
                    ? 'rgba(168, 85, 247, 0.5)'
                    : 'rgba(139, 92, 246, 0.25)',
                  boxShadow: isPlayed
                    ? isPlaying
                      ? `0 0 ${4 + peak * 6}px hsla(${260 + (index / peaks.length) * 60}, 80%, 65%, 0.5)`
                      : `0 0 ${2 + peak * 3}px hsla(${270 + (index / peaks.length) * 40}, 70%, 60%, 0.3)`
                    : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Progress line indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-400 via-purple-500 to-fuchsia-500 shadow-lg shadow-purple-500/50 transition-none"
          style={{ left: `${progress}%` }}
        >
          {/* Playhead dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Hover line */}
        {hoverProgress !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none"
            style={{ left: `${hoverProgress}%` }}
          />
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Time display */}
      {!compact && (
        <div className="flex justify-between mt-2 text-xs text-[var(--replay-mid-grey)] tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
};
