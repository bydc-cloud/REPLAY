import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  Repeat,
  Music,
  Gauge,
  Timer,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

interface ProducerModePanelProps {
  audioElement?: HTMLAudioElement | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ProducerModePanel = ({
  audioElement,
  isExpanded = false,
  onToggleExpand,
}: ProducerModePanelProps) => {
  const { developerMode } = useSettings();
  const { currentTrack, isPlaying, currentTime, duration, seek } = useAudioPlayer();

  // BPM state
  const [bpm, setBpm] = useState<number | null>(null);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [isAnalyzingBpm, setIsAnalyzingBpm] = useState(false);

  // Key detection state
  const [musicalKey, setMusicalKey] = useState<string | null>(null);
  const [isAnalyzingKey, setIsAnalyzingKey] = useState(false);

  // A/B Loop state
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // Pitch and Speed state
  const [pitch, setPitch] = useState(0); // -12 to +12 semitones
  const [speed, setSpeed] = useState(1); // 0.5x to 2x

  // Waveform state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const animationRef = useRef<number>();

  // Don't render if developer mode is off
  if (!developerMode) return null;

  // Tap tempo handler
  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].filter((t) => now - t < 3000); // Keep only taps from last 3 seconds

    if (newTapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 220) {
        setBpm(calculatedBpm);
      }
    }

    setTapTimes(newTapTimes);
  };

  // Reset tap tempo
  const resetTapTempo = () => {
    setTapTimes([]);
    setBpm(null);
  };

  // Set A point
  const setPointA = () => {
    setLoopA(currentTime);
    if (loopB !== null && currentTime >= loopB) {
      setLoopB(null);
    }
  };

  // Set B point
  const setPointB = () => {
    if (loopA !== null && currentTime > loopA) {
      setLoopB(currentTime);
      setIsLooping(true);
    }
  };

  // Clear loop
  const clearLoop = () => {
    setLoopA(null);
    setLoopB(null);
    setIsLooping(false);
  };

  // Handle loop playback
  useEffect(() => {
    if (isLooping && loopA !== null && loopB !== null && currentTime >= loopB) {
      seek(loopA);
    }
  }, [currentTime, isLooping, loopA, loopB, seek]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  // Draw waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, width, height);

      // Draw waveform placeholder with bars
      const barCount = 100;
      const barWidth = width / barCount;
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        // Generate pseudo-random heights based on position
        const seed = (i * 7 + Math.floor(currentTime * 10)) % 100;
        const amplitude = isPlaying
          ? (Math.sin(seed * 0.1) * 0.5 + 0.5) * 0.8 + 0.2
          : 0.3;
        const barHeight = amplitude * (height * 0.4);

        // Calculate position relative to playback
        const playbackPosition = duration > 0 ? (currentTime / duration) * barCount : 0;

        // Color based on position
        if (i < playbackPosition) {
          ctx.fillStyle = "rgba(168, 85, 247, 0.8)"; // Purple for played
        } else if (loopA !== null && loopB !== null) {
          const loopAPos = (loopA / duration) * barCount;
          const loopBPos = (loopB / duration) * barCount;
          if (i >= loopAPos && i <= loopBPos) {
            ctx.fillStyle = "rgba(236, 72, 153, 0.6)"; // Pink for loop region
          } else {
            ctx.fillStyle = "rgba(100, 100, 100, 0.5)"; // Grey for unplayed
          }
        } else {
          ctx.fillStyle = "rgba(100, 100, 100, 0.5)"; // Grey for unplayed
        }

        // Draw bar
        ctx.fillRect(
          i * barWidth + 1,
          centerY - barHeight,
          barWidth - 2,
          barHeight * 2
        );
      }

      // Draw playhead
      if (duration > 0) {
        const playheadX = (currentTime / duration) * width;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
      }

      // Draw A/B markers
      if (loopA !== null && duration > 0) {
        const aX = (loopA / duration) * width;
        ctx.strokeStyle = "#22c55e"; // Green
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(aX, 0);
        ctx.lineTo(aX, height);
        ctx.stroke();
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("A", aX + 4, 14);
      }

      if (loopB !== null && duration > 0) {
        const bX = (loopB / duration) * width;
        ctx.strokeStyle = "#ef4444"; // Red
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bX, 0);
        ctx.lineTo(bX, height);
        ctx.stroke();
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("B", bX + 4, 14);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentTime, duration, isPlaying, loopA, loopB]);

  // Reset states when track changes
  useEffect(() => {
    setBpm(null);
    setMusicalKey(null);
    clearLoop();
    setPitch(0);
    setSpeed(1);
    setTapTimes([]);
  }, [currentTrack?.id]);

  return (
    <div className="bg-[var(--replay-elevated)]/95 backdrop-blur-xl border-t border-[var(--replay-border)]">
      {/* Toggle Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[var(--replay-dark-grey)]/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
            <Music size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--replay-off-white)]">
            Producer Mode
          </span>
          {bpm && (
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
              {bpm} BPM
            </span>
          )}
          {musicalKey && (
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
              {musicalKey}
            </span>
          )}
          {isLooping && (
            <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">
              Loop Active
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown size={18} className="text-[var(--replay-mid-grey)]" />
        ) : (
          <ChevronUp size={18} className="text-[var(--replay-mid-grey)]" />
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Waveform Display */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={80}
              className="w-full h-20 rounded-lg bg-[var(--replay-dark-grey)]/60 border border-[var(--replay-border)] cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                seek(percentage * duration);
              }}
            />
            <div className="absolute bottom-1 left-2 text-xs text-[var(--replay-mid-grey)]">
              {formatTime(currentTime)}
            </div>
            <div className="absolute bottom-1 right-2 text-xs text-[var(--replay-mid-grey)]">
              {formatTime(duration)}
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* BPM / Tap Tempo */}
            <div className="p-3 bg-[var(--replay-dark-grey)]/60 rounded-xl border border-[var(--replay-border)]">
              <div className="flex items-center gap-2 mb-2">
                <Gauge size={14} className="text-purple-400" />
                <span className="text-xs font-semibold text-[var(--replay-off-white)]">BPM</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTapTempo}
                  className="flex-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  {bpm ? bpm : "Tap"}
                </button>
                <button
                  onClick={resetTapTempo}
                  className="p-2 bg-[var(--replay-dark-grey)] hover:bg-[var(--replay-border)] rounded-lg transition-colors"
                >
                  <RotateCcw size={14} className="text-[var(--replay-mid-grey)]" />
                </button>
              </div>
            </div>

            {/* Key Detection */}
            <div className="p-3 bg-[var(--replay-dark-grey)]/60 rounded-xl border border-[var(--replay-border)]">
              <div className="flex items-center gap-2 mb-2">
                <Music size={14} className="text-blue-400" />
                <span className="text-xs font-semibold text-[var(--replay-off-white)]">Key</span>
              </div>
              <div className="py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-semibold text-center">
                {musicalKey || "—"}
              </div>
            </div>

            {/* A/B Loop */}
            <div className="p-3 bg-[var(--replay-dark-grey)]/60 rounded-xl border border-[var(--replay-border)]">
              <div className="flex items-center gap-2 mb-2">
                <Repeat size={14} className="text-pink-400" />
                <span className="text-xs font-semibold text-[var(--replay-off-white)]">A/B Loop</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={setPointA}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    loopA !== null
                      ? "bg-green-500/30 text-green-300"
                      : "bg-[var(--replay-dark-grey)] text-[var(--replay-mid-grey)] hover:bg-[var(--replay-border)]"
                  }`}
                >
                  A
                </button>
                <button
                  onClick={setPointB}
                  disabled={loopA === null}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    loopB !== null
                      ? "bg-red-500/30 text-red-300"
                      : loopA !== null
                      ? "bg-[var(--replay-dark-grey)] text-[var(--replay-mid-grey)] hover:bg-[var(--replay-border)]"
                      : "bg-[var(--replay-dark-grey)]/50 text-[var(--replay-mid-grey)]/50 cursor-not-allowed"
                  }`}
                >
                  B
                </button>
                <button
                  onClick={clearLoop}
                  disabled={loopA === null && loopB === null}
                  className="p-2 bg-[var(--replay-dark-grey)] hover:bg-[var(--replay-border)] rounded-lg transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={12} className="text-[var(--replay-mid-grey)]" />
                </button>
              </div>
              {loopA !== null && (
                <div className="mt-1 text-xs text-[var(--replay-mid-grey)] text-center">
                  {formatTime(loopA)} {loopB !== null && `→ ${formatTime(loopB)}`}
                </div>
              )}
            </div>

            {/* Playback Info */}
            <div className="p-3 bg-[var(--replay-dark-grey)]/60 rounded-xl border border-[var(--replay-border)]">
              <div className="flex items-center gap-2 mb-2">
                <Timer size={14} className="text-green-400" />
                <span className="text-xs font-semibold text-[var(--replay-off-white)]">Time</span>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono font-bold text-[var(--replay-off-white)]">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-[var(--replay-mid-grey)]">
                  / {formatTime(duration)}
                </div>
              </div>
            </div>
          </div>

          {/* Pitch and Speed Controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* Pitch Control */}
            <div className="p-3 bg-[var(--replay-dark-grey)]/60 rounded-xl border border-[var(--replay-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--replay-off-white)]">Pitch</span>
                <span className="text-xs text-purple-300 font-mono">
                  {pitch > 0 ? "+" : ""}{pitch} st
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
                className="w-full h-2 bg-[var(--replay-dark-grey)] rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between mt-1 text-xs text-[var(--replay-mid-grey)]">
                <span>-12</span>
                <button
                  onClick={() => setPitch(0)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  Reset
                </button>
                <span>+12</span>
              </div>
            </div>

            {/* Speed Control */}
            <div className="p-3 bg-[var(--replay-dark-grey)]/60 rounded-xl border border-[var(--replay-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--replay-off-white)]">Speed</span>
                <span className="text-xs text-pink-300 font-mono">
                  {speed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-[var(--replay-dark-grey)] rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <div className="flex justify-between mt-1 text-xs text-[var(--replay-mid-grey)]">
                <span>0.5x</span>
                <button
                  onClick={() => setSpeed(1)}
                  className="text-pink-400 hover:text-pink-300"
                >
                  Reset
                </button>
                <span>2x</span>
              </div>
            </div>
          </div>

          {/* Quick Speed Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--replay-mid-grey)]">Quick:</span>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  Math.abs(speed - s) < 0.01
                    ? "bg-pink-500 text-white"
                    : "bg-[var(--replay-dark-grey)] text-[var(--replay-mid-grey)] hover:bg-[var(--replay-border)]"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
