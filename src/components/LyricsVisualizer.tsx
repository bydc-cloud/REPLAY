import { useState, useEffect, useRef, useMemo } from "react";
import { Loader2, RefreshCw } from "lucide-react";
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
  const [autoTranscribeAttempted, setAutoTranscribeAttempted] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Get track from context
  const track = trackId ? tracks.find(t => t.id === trackId) : null;

  // Calculate average energy from audio levels for glow effects
  const averageEnergy = useMemo(() => {
    if (audioLevels.length === 0) return 0.3;
    return audioLevels.reduce((a, b) => a + b, 0) / audioLevels.length;
  }, [audioLevels]);

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

  // Define state variables early so they can be used in effects
  const isTranscribing = track?.lyrics?.status === 'processing' || lyrics?.status === 'processing';
  const hasFailed = track?.lyrics?.status === 'failed';
  const hasLyrics = lines.length > 0;
  const canTranscribe = track?.hasAudio || (trackId && !trackId.startsWith('local-'));

  // Load lyrics when track changes - with polling for processing tracks
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const loadLyrics = async () => {
      if (!trackId) return;

      console.log('Loading lyrics for track:', trackId, 'status:', track?.lyrics?.status);

      // Check if lyrics are already in track object and completed
      if (track?.lyrics && track.lyrics.status === 'completed' && track.lyrics.segments && track.lyrics.segments.length > 0) {
        console.log('Using cached lyrics with', track.lyrics.segments.length, 'segments');
        setLyrics(track.lyrics);
        return;
      }

      // Try to fetch from API
      const fetchedLyrics = await getLyrics(trackId);
      console.log('Fetched lyrics:', fetchedLyrics?.status, 'segments:', fetchedLyrics?.segments?.length);

      if (fetchedLyrics) {
        setLyrics(fetchedLyrics);

        // If still processing, poll every 5 seconds
        if (fetchedLyrics.status === 'processing' && !pollInterval) {
          console.log('Lyrics processing, starting poll...');
          pollInterval = setInterval(async () => {
            const updated = await getLyrics(trackId);
            if (updated && updated.status === 'completed') {
              console.log('Lyrics completed via poll');
              setLyrics(updated);
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
            }
          }, 5000);
        }
      }
    };

    loadLyrics();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [trackId, track?.lyrics?.status, getLyrics]);

  // Auto-transcribe when lyrics visualizer is shown and no lyrics exist
  useEffect(() => {
    const shouldAutoTranscribe =
      trackId &&
      canTranscribe &&
      !hasLyrics &&
      !isTranscribing &&
      !hasFailed &&
      autoTranscribeAttempted !== trackId &&
      lyrics?.status !== 'processing' &&
      lyrics?.status !== 'completed';

    if (shouldAutoTranscribe) {
      console.log('Auto-transcribing track:', trackId);
      setAutoTranscribeAttempted(trackId);
      transcribeTrack(trackId).then(result => {
        if (result) {
          setLyrics(result);
        }
      });
    }
  }, [trackId, canTranscribe, hasLyrics, isTranscribing, hasFailed, autoTranscribeAttempted, lyrics?.status, transcribeTrack]);

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

  const handleLineClick = (line: { startTime: number }) => {
    if (onSeek) {
      onSeek(line.startTime);
    }
  };

  // Retry transcription manually
  const retryTranscription = async () => {
    if (!trackId) return;
    setAutoTranscribeAttempted(null); // Reset to allow re-attempt
    const result = await transcribeTrack(trackId);
    if (result) {
      setLyrics(result);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      {/* Ambient Background Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(147, 51, 234, ${0.08 + averageEnergy * 0.12}) 0%,
            rgba(79, 70, 229, ${0.04 + averageEnergy * 0.08}) 40%,
            transparent 70%)`,
          transition: "all 0.15s ease-out",
        }}
      />

      {/* Lyrics Display - Mobile optimized with safe areas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-hide flex flex-col justify-center px-4 sm:px-6 md:px-12 py-20 sm:py-24 md:py-32"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {isTranscribing ? (
          // Transcribing State
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="w-16 h-16 text-purple-500 mb-6 animate-spin" />
            <p className="text-white text-xl font-medium mb-2">Transcribing audio...</p>
            <p className="text-white/40 text-sm">
              This may take a minute
            </p>
          </div>
        ) : hasFailed ? (
          // Failed State - with retry button
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
              <RefreshCw className="w-10 h-10 text-red-400" />
            </div>
            <p className="text-white text-xl font-medium mb-2">Transcription failed</p>
            <p className="text-white/40 text-sm mb-6">
              There was an error transcribing this track
            </p>
            {canTranscribe && (
              <button
                onClick={retryTranscription}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-white font-medium hover:scale-105 transition-transform flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            )}
          </div>
        ) : !hasLyrics ? (
          // No Lyrics State - Show loading since we're auto-transcribing
          <div className="flex flex-col items-center justify-center text-center">
            {canTranscribe ? (
              <>
                <Loader2 className="w-16 h-16 text-purple-500 mb-6 animate-spin" />
                <p className="text-white text-xl font-medium mb-2">Preparing lyrics...</p>
                <p className="text-white/40 text-sm">
                  Starting transcription automatically
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 text-white/30" />
                </div>
                <p className="text-white/60 text-xl font-medium mb-2">No lyrics available</p>
                <p className="text-white/30 text-sm">
                  Upload this track to enable transcription
                </p>
              </>
            )}
          </div>
        ) : (
          // Apple Music Style Lyrics Display - Mobile optimized
          <div className="space-y-1 sm:space-y-2 md:space-y-4 max-w-4xl mx-auto w-full">
            {lines.map((line, index) => {
              const isActive = index === currentLineIndex;
              const isPast = index < currentLineIndex;
              const distanceFromActive = Math.abs(index - currentLineIndex);

              // Calculate blur and opacity based on distance from active line
              // Reduced blur on mobile for better readability
              const blur = isActive ? 0 : Math.min(distanceFromActive * 1, 3);
              const opacity = isActive ? 1 : Math.max(0.3, 0.65 - distanceFromActive * 0.1);
              const scale = isActive ? 1 : 0.97;

              return (
                <div
                  key={index}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => handleLineClick(line)}
                  className="cursor-pointer transition-all duration-400 ease-out text-center px-2"
                  style={{
                    transform: `scale(${scale})`,
                    opacity: opacity,
                    filter: `blur(${blur}px)`,
                  }}
                >
                  <p
                    className={`text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold leading-snug sm:leading-tight transition-colors duration-300 ${
                      isActive
                        ? "text-white"
                        : isPast
                        ? "text-white/40"
                        : "text-white/50"
                    }`}
                    style={{
                      textShadow: isActive && isPlaying
                        ? `0 0 30px rgba(147, 51, 234, ${0.4 + averageEnergy * 0.25}),
                           0 0 60px rgba(79, 70, 229, ${0.25 + averageEnergy * 0.15})`
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

      {/* Track Info Overlay at Top - Hidden on mobile in visualizer modal (shown in modal header) */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none hidden md:block">
        <div className="text-center">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white/90 truncate">{trackTitle}</h2>
          <p className="text-xs sm:text-sm text-white/50">{trackArtist}</p>
        </div>
      </div>

      {/* Subtle Audio Visualizer at Bottom - Smaller on mobile */}
      {isPlaying && hasLyrics && (
        <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 md:h-24 pointer-events-none flex items-end justify-center gap-[2px] sm:gap-[3px] px-4 sm:px-6 md:px-8 pb-2 sm:pb-3 md:pb-4">
          {/* Show fewer bars on mobile using CSS visibility */}
          {audioLevels.slice(0, 32).map((level, i) => (
            <div
              key={i}
              className={`flex-1 max-w-1 sm:max-w-1.5 rounded-full ${i >= 24 ? 'hidden sm:block' : ''}`}
              style={{
                height: `${Math.max(3, level * 50)}px`,
                background: `linear-gradient(to top,
                  rgba(147, 51, 234, ${0.35 + level * 0.35}),
                  rgba(79, 70, 229, ${0.25 + level * 0.25}))`,
                transition: 'height 0.05s ease-out',
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
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
