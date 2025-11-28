import { useState, useEffect, useRef, useMemo } from "react";
import { Mic, MicOff, Music2, Type, Sparkles } from "lucide-react";

interface LyricLine {
  text: string;
  startTime: number;
  endTime: number;
  words?: { text: string; startTime: number; endTime: number }[];
}

interface LyricsVisualizerProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  trackTitle?: string;
  trackArtist?: string;
  audioLevels?: number[];
  onSeek?: (time: number) => void;
}

export const LyricsVisualizer = ({
  currentTime,
  duration,
  isPlaying,
  trackTitle = "Unknown Track",
  trackArtist = "Unknown Artist",
  audioLevels = [],
  onSeek,
}: LyricsVisualizerProps) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState<"fullscreen" | "karaoke" | "minimal">("fullscreen");
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Calculate average energy from audio levels for glow effects
  const averageEnergy = useMemo(() => {
    if (audioLevels.length === 0) return 0.3;
    return audioLevels.reduce((a, b) => a + b, 0) / audioLevels.length;
  }, [audioLevels]);

  // Demo lyrics - in production this would come from transcription API
  useEffect(() => {
    // Generate placeholder lyrics based on track duration
    if (duration > 0 && lyrics.length === 0) {
      const demoLyrics: LyricLine[] = [
        { text: "♪ Music playing ♪", startTime: 0, endTime: duration * 0.1 },
        { text: "Let the rhythm take control", startTime: duration * 0.1, endTime: duration * 0.2 },
        { text: "Feel the beat within your soul", startTime: duration * 0.2, endTime: duration * 0.3 },
        { text: "Dancing through the night", startTime: duration * 0.3, endTime: duration * 0.4 },
        { text: "Everything feels right", startTime: duration * 0.4, endTime: duration * 0.5 },
        { text: "The music sets us free", startTime: duration * 0.5, endTime: duration * 0.6 },
        { text: "Just you and me", startTime: duration * 0.6, endTime: duration * 0.7 },
        { text: "Lost in the melody", startTime: duration * 0.7, endTime: duration * 0.8 },
        { text: "This is where we belong", startTime: duration * 0.8, endTime: duration * 0.9 },
        { text: "♪ Instrumental ♪", startTime: duration * 0.9, endTime: duration },
      ];
      setLyrics(demoLyrics);
    }
  }, [duration, lyrics.length]);

  // Update current line based on playback time
  useEffect(() => {
    const lineIndex = lyrics.findIndex(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
    if (lineIndex !== -1 && lineIndex !== currentLineIndex) {
      setCurrentLineIndex(lineIndex);
    }
  }, [currentTime, lyrics, currentLineIndex]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineIndex]);

  // Calculate progress within current line for karaoke effect
  const getLineProgress = (line: LyricLine): number => {
    if (currentTime < line.startTime) return 0;
    if (currentTime >= line.endTime) return 100;
    return ((currentTime - line.startTime) / (line.endTime - line.startTime)) * 100;
  };

  const handleLineClick = (line: LyricLine) => {
    if (onSeek) {
      onSeek(line.startTime);
    }
  };

  // Start transcription (placeholder - would integrate with speech-to-text API)
  const startTranscription = async () => {
    setIsTranscribing(true);
    setTranscriptionError(null);

    // Simulate transcription process
    setTimeout(() => {
      setIsTranscribing(false);
      // In production, this would call a transcription API
      // For now, we keep the demo lyrics
    }, 2000);
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-[var(--replay-black)] via-[var(--replay-dark-grey)] to-[var(--replay-black)]">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-[var(--replay-mid-grey)]" />
          <span className="text-sm text-[var(--replay-mid-grey)]">Lyrics</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Display Mode Toggle */}
          <div className="flex bg-[var(--replay-elevated)]/60 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setDisplayMode("fullscreen")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                displayMode === "fullscreen"
                  ? "bg-white/20 text-[var(--replay-off-white)]"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
            >
              Full
            </button>
            <button
              onClick={() => setDisplayMode("karaoke")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                displayMode === "karaoke"
                  ? "bg-white/20 text-[var(--replay-off-white)]"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
            >
              Karaoke
            </button>
            <button
              onClick={() => setDisplayMode("minimal")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                displayMode === "minimal"
                  ? "bg-white/20 text-[var(--replay-off-white)]"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
            >
              Focus
            </button>
          </div>

          {/* Transcribe Button */}
          <button
            onClick={startTranscription}
            disabled={isTranscribing}
            className={`p-2 rounded-lg transition-all ${
              isTranscribing
                ? "bg-purple-500/20 text-purple-400"
                : "bg-[var(--replay-elevated)]/60 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/10"
            }`}
            title="Transcribe audio"
          >
            {isTranscribing ? (
              <Sparkles className="w-5 h-5 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Track Info */}
      <div className="absolute top-16 left-4 right-4 z-10 text-center">
        <h2 className="text-xl font-bold text-[var(--replay-off-white)] truncate">{trackTitle}</h2>
        <p className="text-sm text-[var(--replay-mid-grey)]">{trackArtist}</p>
      </div>

      {/* Lyrics Display */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-y-auto scrollbar-hide pt-32 pb-24 px-8 ${
          displayMode === "minimal" ? "flex items-center justify-center" : ""
        }`}
      >
        {lyrics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MicOff className="w-16 h-16 text-[var(--replay-mid-grey)]/50 mb-4" />
            <p className="text-[var(--replay-mid-grey)] text-lg mb-2">No lyrics available</p>
            <p className="text-[var(--replay-mid-grey)]/60 text-sm mb-6">
              Click the microphone to transcribe this track
            </p>
            <button
              onClick={startTranscription}
              disabled={isTranscribing}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              {isTranscribing ? "Transcribing..." : "Transcribe Audio"}
            </button>
          </div>
        ) : displayMode === "minimal" ? (
          // Minimal/Focus Mode - Only current line
          <div className="text-center">
            <div
              className="text-4xl md:text-6xl font-bold transition-all duration-500"
              style={{
                color: `rgba(232, 232, 232, ${0.6 + averageEnergy * 0.4})`,
                textShadow: isPlaying
                  ? `0 0 ${20 + averageEnergy * 40}px rgba(147, 51, 234, ${0.3 + averageEnergy * 0.4}),
                     0 0 ${40 + averageEnergy * 60}px rgba(236, 72, 153, ${0.2 + averageEnergy * 0.3})`
                  : "none",
                transform: `scale(${1 + averageEnergy * 0.05})`,
              }}
            >
              {lyrics[currentLineIndex]?.text || "♪"}
            </div>
            {lyrics[currentLineIndex + 1] && (
              <div className="mt-8 text-xl text-[var(--replay-mid-grey)]/50 transition-all duration-500">
                {lyrics[currentLineIndex + 1].text}
              </div>
            )}
          </div>
        ) : displayMode === "karaoke" ? (
          // Karaoke Mode - Word by word highlighting
          <div className="space-y-6">
            {lyrics.map((line, index) => {
              const isActive = index === currentLineIndex;
              const isPast = index < currentLineIndex;
              const progress = getLineProgress(line);

              return (
                <div
                  key={index}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => handleLineClick(line)}
                  className={`text-center cursor-pointer transition-all duration-300 ${
                    isActive ? "scale-110 py-4" : "scale-100 py-2"
                  }`}
                >
                  <div
                    className={`relative inline-block text-3xl md:text-4xl font-bold transition-all duration-300 ${
                      isPast
                        ? "text-[var(--replay-mid-grey)]/40"
                        : isActive
                        ? "text-[var(--replay-off-white)]"
                        : "text-[var(--replay-mid-grey)]/60"
                    }`}
                    style={{
                      textShadow: isActive && isPlaying
                        ? `0 0 30px rgba(147, 51, 234, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)`
                        : "none",
                    }}
                  >
                    {/* Background text (unhighlighted) */}
                    <span className="relative z-0">{line.text}</span>

                    {/* Overlay with gradient highlight */}
                    {isActive && (
                      <span
                        className="absolute inset-0 z-10 overflow-hidden"
                        style={{
                          background: `linear-gradient(90deg,
                            rgba(147, 51, 234, 0.9) 0%,
                            rgba(236, 72, 153, 0.9) ${progress}%,
                            transparent ${progress}%)`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {line.text}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Fullscreen Mode - All lyrics scrollable
          <div className="space-y-4">
            {lyrics.map((line, index) => {
              const isActive = index === currentLineIndex;
              const isPast = index < currentLineIndex;

              return (
                <div
                  key={index}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => handleLineClick(line)}
                  className={`text-center cursor-pointer transition-all duration-500 hover:opacity-100 ${
                    isActive ? "py-6" : "py-2"
                  }`}
                >
                  <p
                    className={`text-2xl md:text-4xl font-semibold transition-all duration-500 ${
                      isPast
                        ? "text-[var(--replay-mid-grey)]/30 blur-[1px]"
                        : isActive
                        ? "text-[var(--replay-off-white)] scale-110"
                        : "text-[var(--replay-mid-grey)]/50"
                    }`}
                    style={{
                      textShadow: isActive && isPlaying
                        ? `0 0 ${20 + averageEnergy * 30}px rgba(147, 51, 234, ${0.4 + averageEnergy * 0.3}),
                           0 0 ${40 + averageEnergy * 40}px rgba(236, 72, 153, ${0.2 + averageEnergy * 0.2})`
                        : "none",
                    }}
                  >
                    {line.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transcription Status */}
      {isTranscribing && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[var(--replay-elevated)]/90 backdrop-blur-sm px-6 py-3 rounded-xl flex items-center gap-3 z-20">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-[var(--replay-off-white)]">Transcribing audio...</span>
        </div>
      )}

      {/* Error Message */}
      {transcriptionError && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-500/20 backdrop-blur-sm px-6 py-3 rounded-xl text-red-400 text-sm z-20">
          {transcriptionError}
        </div>
      )}

      {/* Audio Reactive Background Effect */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%,
            rgba(147, 51, 234, ${0.1 + averageEnergy * 0.2}) 0%,
            rgba(236, 72, 153, ${0.05 + averageEnergy * 0.1}) 30%,
            transparent 70%)`,
          filter: `blur(${60 - averageEnergy * 20}px)`,
          transform: `scale(${1 + averageEnergy * 0.3})`,
          transition: "all 0.1s ease-out",
        }}
      />

      {/* Floating Particles Effect */}
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: i % 2 === 0 ? "rgba(147, 51, 234, 0.6)" : "rgba(236, 72, 153, 0.6)",
                boxShadow: `0 0 ${4 + averageEnergy * 8}px currentColor`,
                animation: `float-particle ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.3 + averageEnergy * 0.5,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          50% {
            transform: translateY(-50px) translateX(20px);
            opacity: 0.8;
          }
          90% {
            opacity: 0.6;
          }
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
