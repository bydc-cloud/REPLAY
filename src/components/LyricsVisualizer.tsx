import { useState, useEffect, useRef, useMemo } from "react";
import { Mic, MicOff, Music2, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useMusicLibrary, TrackLyrics, LyricsSegment } from "../contexts/MusicLibraryContext";

interface LyricsVisualizerProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  trackId?: string;
  trackTitle?: string;
  trackArtist?: string;
  audioLevels?: number[];
  onSeek?: (time: number) => void;
}

export const LyricsVisualizer = ({
  currentTime,
  duration,
  isPlaying,
  trackId,
  trackTitle = "Unknown Track",
  trackArtist = "Unknown Artist",
  audioLevels = [],
  onSeek,
}: LyricsVisualizerProps) => {
  const { tracks, transcribeTrack, getLyrics } = useMusicLibrary();
  const [lyrics, setLyrics] = useState<TrackLyrics | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState<"fullscreen" | "karaoke" | "minimal">("fullscreen");
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Get track from context
  const track = trackId ? tracks.find(t => t.id === trackId) : null;
  const hasCloudFile = track?.fileKey;

  // Calculate average energy from audio levels for glow effects
  const averageEnergy = useMemo(() => {
    if (audioLevels.length === 0) return 0.3;
    return audioLevels.reduce((a, b) => a + b, 0) / audioLevels.length;
  }, [audioLevels]);

  // Load lyrics when track changes
  useEffect(() => {
    const loadLyrics = async () => {
      if (!trackId) return;

      // Check if lyrics are already in track object
      if (track?.lyrics && track.lyrics.status === 'completed') {
        setLyrics(track.lyrics);
        return;
      }

      // Try to fetch from API
      const fetchedLyrics = await getLyrics(trackId);
      if (fetchedLyrics) {
        setLyrics(fetchedLyrics);
      }
    };

    loadLyrics();
  }, [trackId, track?.lyrics, getLyrics]);

  // Convert lyrics segments to line format
  const lines = useMemo(() => {
    if (!lyrics || !lyrics.segments || lyrics.segments.length === 0) {
      return [];
    }

    return lyrics.segments.map((segment: LyricsSegment) => ({
      text: segment.text,
      startTime: segment.start,
      endTime: segment.end,
    }));
  }, [lyrics]);

  // Update current line based on playback time
  useEffect(() => {
    if (lines.length === 0) return;

    const lineIndex = lines.findIndex(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
    if (lineIndex !== -1 && lineIndex !== currentLineIndex) {
      setCurrentLineIndex(lineIndex);
    }
  }, [currentTime, lines, currentLineIndex]);

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
  const getLineProgress = (line: { startTime: number; endTime: number }): number => {
    if (currentTime < line.startTime) return 0;
    if (currentTime >= line.endTime) return 100;
    return ((currentTime - line.startTime) / (line.endTime - line.startTime)) * 100;
  };

  const handleLineClick = (line: { startTime: number }) => {
    if (onSeek) {
      onSeek(line.startTime);
    }
  };

  // Start transcription
  const startTranscription = async () => {
    if (!trackId) return;
    const result = await transcribeTrack(trackId);
    if (result) {
      setLyrics(result);
    }
  };

  const isTranscribing = track?.lyrics?.status === 'processing';
  const hasFailed = track?.lyrics?.status === 'failed';
  const hasLyrics = lines.length > 0;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-[var(--replay-black)] via-[var(--replay-dark-grey)] to-[var(--replay-black)]">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-[var(--replay-mid-grey)]" />
          <span className="text-sm text-[var(--replay-mid-grey)]">Lyrics</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Display Mode Toggle - Only show if we have lyrics */}
          {hasLyrics && (
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
          )}

          {/* Transcribe Button - Only show if we can transcribe */}
          {hasCloudFile && !hasLyrics && !isTranscribing && (
            <button
              onClick={startTranscription}
              className="p-2 rounded-lg bg-[var(--replay-elevated)]/60 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/10 transition-all"
              title="Transcribe audio"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
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
        {isTranscribing ? (
          // Transcribing State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="w-16 h-16 text-purple-500 mb-4 animate-spin" />
            <p className="text-[var(--replay-off-white)] text-lg mb-2">Transcribing audio...</p>
            <p className="text-[var(--replay-mid-grey)]/60 text-sm">
              This may take a minute. The lyrics will appear when ready.
            </p>
          </div>
        ) : hasFailed ? (
          // Failed State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500/50 mb-4" />
            <p className="text-[var(--replay-off-white)] text-lg mb-2">Transcription failed</p>
            <p className="text-[var(--replay-mid-grey)]/60 text-sm mb-6">
              There was an error transcribing this track. Please try again.
            </p>
            {hasCloudFile && (
              <button
                onClick={startTranscription}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Mic className="w-5 h-5" />
                Try Again
              </button>
            )}
          </div>
        ) : !hasLyrics ? (
          // No Lyrics State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MicOff className="w-16 h-16 text-[var(--replay-mid-grey)]/50 mb-4" />
            <p className="text-[var(--replay-mid-grey)] text-lg mb-2">No lyrics available</p>
            {hasCloudFile ? (
              <>
                <p className="text-[var(--replay-mid-grey)]/60 text-sm mb-6">
                  Click below to transcribe this track with AI
                </p>
                <button
                  onClick={startTranscription}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Mic className="w-5 h-5" />
                  Transcribe Audio
                </button>
              </>
            ) : (
              <p className="text-[var(--replay-mid-grey)]/60 text-sm">
                Upload this track to the cloud to enable transcription
              </p>
            )}
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
              {lines[currentLineIndex]?.text || "♪"}
            </div>
            {lines[currentLineIndex + 1] && (
              <div className="mt-8 text-xl text-[var(--replay-mid-grey)]/50 transition-all duration-500">
                {lines[currentLineIndex + 1].text}
              </div>
            )}
          </div>
        ) : displayMode === "karaoke" ? (
          // Karaoke Mode - Word by word highlighting
          <div className="space-y-6">
            {lines.map((line, index) => {
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
            {lines.map((line, index) => {
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

      {/* Audio Bars Visualizer at Bottom */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10 flex items-end justify-center gap-[2px] px-4 opacity-60">
          {audioLevels.slice(0, 48).map((level, i) => (
            <div
              key={i}
              className="flex-1 max-w-2 rounded-t-sm"
              style={{
                height: `${Math.max(4, level * 120)}px`,
                background: `linear-gradient(to top,
                  rgba(147, 51, 234, ${0.6 + level * 0.4}),
                  rgba(236, 72, 153, ${0.4 + level * 0.4}))`,
                boxShadow: level > 0.5 ? `0 0 ${level * 10}px rgba(147, 51, 234, 0.5)` : 'none',
                transition: 'height 0.05s ease-out',
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Particles Effect */}
      {isPlaying && hasLyrics && (
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

      {/* Pulsing Ring Effect */}
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
          <div
            className="w-[600px] h-[600px] rounded-full border-2"
            style={{
              borderColor: `rgba(147, 51, 234, ${0.1 + averageEnergy * 0.3})`,
              transform: `scale(${0.5 + averageEnergy * 0.5})`,
              opacity: 0.2 + averageEnergy * 0.3,
              transition: 'all 0.1s ease-out',
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full border-2"
            style={{
              borderColor: `rgba(236, 72, 153, ${0.1 + averageEnergy * 0.3})`,
              transform: `scale(${0.6 + averageEnergy * 0.4})`,
              opacity: 0.15 + averageEnergy * 0.25,
              transition: 'all 0.1s ease-out',
            }}
          />
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
