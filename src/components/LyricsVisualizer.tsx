import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

// Timing offset to sync lyrics slightly ahead (in seconds)
// Whisper timestamps can be slightly late, this compensates
const SYNC_OFFSET = 0.3;

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

  // Update current line based on playback time with sync offset
  useEffect(() => {
    if (lines.length === 0) return;

    // Apply sync offset to show lyrics slightly ahead
    const adjustedTime = currentTime + SYNC_OFFSET;

    // Find the line that matches current time
    let lineIndex = lines.findIndex(
      (line) => adjustedTime >= line.startTime && adjustedTime < line.endTime
    );

    // If no exact match, find the next upcoming line or last past line
    if (lineIndex === -1) {
      // Check if we're past all lines
      if (adjustedTime >= lines[lines.length - 1].endTime) {
        lineIndex = lines.length - 1;
      } else {
        // Find the next upcoming line
        const upcomingIndex = lines.findIndex(line => line.startTime > adjustedTime);
        if (upcomingIndex > 0) {
          lineIndex = upcomingIndex - 1;
        } else if (upcomingIndex === 0) {
          lineIndex = 0;
        }
      }
    }

    if (lineIndex !== -1 && lineIndex !== currentLineIndex) {
      setCurrentLineIndex(lineIndex);
    }
  }, [currentTime, lines, currentLineIndex]);

  // Auto-scroll to active line with debounce to prevent jank
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      // Clear any pending scroll to prevent jitter
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Small delay to let CSS transitions start first
      scrollTimeoutRef.current = setTimeout(() => {
        activeLineRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
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

  // Calculate bass and treble energy for reactive background
  const bassEnergy = useMemo(() => {
    if (audioLevels.length < 8) return averageEnergy;
    return audioLevels.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
  }, [audioLevels, averageEnergy]);

  const trebleEnergy = useMemo(() => {
    if (audioLevels.length < 16) return averageEnergy;
    return audioLevels.slice(audioLevels.length - 8).reduce((a, b) => a + b, 0) / 8;
  }, [audioLevels, averageEnergy]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
      {/* Apple-style Reactive Gaussian Blur Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary blob - purple, reacts to bass */}
        <div
          className="absolute rounded-full"
          style={{
            width: '60%',
            height: '60%',
            left: '20%',
            top: '15%',
            background: `radial-gradient(circle,
              rgba(147, 51, 234, ${0.4 + bassEnergy * 0.3}) 0%,
              rgba(147, 51, 234, 0) 70%)`,
            filter: 'blur(80px)',
            transform: `scale(${1 + bassEnergy * 0.15})`,
            transition: 'transform 0.15s ease-out, background 0.15s ease-out',
          }}
        />
        {/* Secondary blob - indigo, reacts to treble */}
        <div
          className="absolute rounded-full"
          style={{
            width: '50%',
            height: '50%',
            right: '10%',
            bottom: '20%',
            background: `radial-gradient(circle,
              rgba(79, 70, 229, ${0.35 + trebleEnergy * 0.25}) 0%,
              rgba(79, 70, 229, 0) 70%)`,
            filter: 'blur(70px)',
            transform: `scale(${1 + trebleEnergy * 0.12}) translateY(${-trebleEnergy * 10}px)`,
            transition: 'transform 0.12s ease-out, background 0.12s ease-out',
          }}
        />
        {/* Tertiary blob - pink accent, subtle movement */}
        <div
          className="absolute rounded-full"
          style={{
            width: '40%',
            height: '40%',
            left: '5%',
            bottom: '30%',
            background: `radial-gradient(circle,
              rgba(236, 72, 153, ${0.2 + averageEnergy * 0.15}) 0%,
              rgba(236, 72, 153, 0) 70%)`,
            filter: 'blur(60px)',
            transform: `scale(${1 + averageEnergy * 0.1})`,
            transition: 'transform 0.2s ease-out, background 0.2s ease-out',
          }}
        />
        {/* Dark overlay to keep text readable */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(1px)',
          }}
        />
      </div>

      {/* Lyrics Display - Apple Music style centered layout */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 md:px-12"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {isTranscribing ? (
          // Transcribing State - Centered
          <div className="flex flex-col items-center justify-center min-h-full text-center">
            <Loader2 className="w-16 h-16 text-purple-500 mb-6 animate-spin" />
            <p className="text-white text-2xl font-bold mb-2">Transcribing audio...</p>
            <p className="text-white/40 text-base">
              This may take a minute
            </p>
          </div>
        ) : hasFailed ? (
          // Failed State - Centered with retry button
          <div className="flex flex-col items-center justify-center min-h-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
              <RefreshCw className="w-10 h-10 text-red-400" />
            </div>
            <p className="text-white text-2xl font-bold mb-2">Transcription failed</p>
            <p className="text-white/40 text-base mb-6">
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
          // No Lyrics State - Centered
          <div className="flex flex-col items-center justify-center min-h-full text-center">
            {canTranscribe ? (
              <>
                <Loader2 className="w-16 h-16 text-purple-500 mb-6 animate-spin" />
                <p className="text-white text-2xl font-bold mb-2">Preparing lyrics...</p>
                <p className="text-white/40 text-base">
                  Starting transcription automatically
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Loader2 className="w-10 h-10 text-white/30" />
                </div>
                <p className="text-white/60 text-2xl font-bold mb-2">No lyrics available</p>
                <p className="text-white/30 text-base">
                  Upload this track to enable transcription
                </p>
              </>
            )}
          </div>
        ) : (
          // Apple Music Style Lyrics Display - Bar by bar with clear separation
          <div className="flex flex-col items-center justify-center min-h-full py-[45vh]">
            <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
              {lines.map((line, index) => {
                const isActive = index === currentLineIndex;
                const isPast = index < currentLineIndex;
                const distanceFromActive = Math.abs(index - currentLineIndex);

                // Apple Music style: clear distinction between active and inactive
                // Active line pops, others fade significantly
                const opacity = isActive ? 1 : isPast
                  ? Math.max(0.15, 0.35 - distanceFromActive * 0.08)
                  : Math.max(0.2, 0.4 - distanceFromActive * 0.08);

                // Scale creates clear visual hierarchy - active line stands out
                const scale = isActive ? 1 : 0.65;

                return (
                  <div
                    key={index}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => handleLineClick(line)}
                    className="cursor-pointer text-center"
                    style={{
                      opacity: opacity,
                      transform: `scale(${scale})`,
                      transition: 'all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      willChange: 'transform, opacity',
                      transformOrigin: 'center center',
                      marginTop: isActive ? '16px' : '0',
                      marginBottom: isActive ? '16px' : '0',
                    }}
                  >
                    <p
                      className="font-bold leading-relaxed text-2xl sm:text-4xl md:text-5xl lg:text-6xl"
                      style={{
                        color: isActive
                          ? 'white'
                          : isPast
                          ? 'rgba(255, 255, 255, 0.4)'
                          : 'rgba(255, 255, 255, 0.5)',
                        textShadow: isActive && isPlaying
                          ? `0 0 30px rgba(147, 51, 234, ${0.3 + bassEnergy * 0.2}),
                             0 0 60px rgba(79, 70, 229, ${0.15 + bassEnergy * 0.1}),
                             0 2px 4px rgba(0, 0, 0, 0.3)`
                          : isActive
                          ? "0 0 20px rgba(147, 51, 234, 0.2), 0 2px 4px rgba(0, 0, 0, 0.2)"
                          : "none",
                        transition: 'all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                        letterSpacing: isActive ? '0.02em' : '0',
                      }}
                    >
                      {line.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Track Info Overlay at Top - Only shown on desktop (mobile shows in floating controls) */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none hidden md:block">
        <div className="text-center">
          <h2 className="text-base md:text-lg font-semibold text-white/90 truncate">{trackTitle}</h2>
          <p className="text-sm text-white/50">{trackArtist}</p>
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
