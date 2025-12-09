import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
const WORD_TOLERANCE = 0.15; // seconds, tolerance for mapping words to segments
const SMOOTHING_ALPHA = 0.35; // low-pass filter for playback time to avoid flicker
const MIN_WORD_DURATION = 0.18; // seconds, minimum time a word stays active for highlighting
const SMALL_GAP_HOLD = 0.22; // seconds, keep previous/next word active across tiny gaps

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
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
  const [activeWordProgress, setActiveWordProgress] = useState(0);
  const [autoTranscribeAttempted, setAutoTranscribeAttempted] = useState<string | null>(null);
  const [lineSlideKey, setLineSlideKey] = useState(0);
  const smoothedTimeRef = useRef<number>(0);
  const adjustedTimeRef = useRef<number>(0);

  // Get track from context
  const track = trackId ? tracks.find(t => t.id === trackId) : null;

  // Calculate average energy from audio levels for glow effects
  const averageEnergy = useMemo(() => {
    if (audioLevels.length === 0) return 0.3;
    return audioLevels.reduce((a, b) => a + b, 0) / audioLevels.length;
  }, [audioLevels]);

  // Convert lyrics segments to line format
  const { lines, words, wordToLine } = useMemo(() => {
    if (!lyrics || !lyrics.segments || lyrics.segments.length === 0) {
      return { lines: [], words: [], wordToLine: new Map<number, number>() };
    }

    const allWords = (lyrics.words || []).map((word, index) => ({ ...word, index }));
    const map = new Map<number, number>();

    const mappedLines = lyrics.segments.map((segment: LyricsSegment, lineIndex: number) => {
      const segmentWords = allWords.filter((word) =>
        word.start >= segment.start - WORD_TOLERANCE &&
        word.end <= segment.end + WORD_TOLERANCE
      );
      segmentWords.forEach((word) => map.set(word.index, lineIndex));
      return {
        text: segment.text,
        startTime: segment.start,
        endTime: segment.end,
        words: segmentWords,
      };
    });

    return { lines: mappedLines, words: allWords, wordToLine: map };
  }, [lyrics]);

  // Define state variables early so they can be used in effects
  const isTranscribing = track?.lyrics?.status === 'processing' || lyrics?.status === 'processing';
  const hasFailed = track?.lyrics?.status === 'failed';
  const hasLyrics = lines.length > 0;
  const canTranscribe = track?.hasAudio || (trackId && !trackId.startsWith('local-'));

  // Smoothed playback time with sync offset
  const getAdjustedTime = useCallback(() => {
    const smoothed = smoothedTimeRef.current + (currentTime - smoothedTimeRef.current) * SMOOTHING_ALPHA;
    smoothedTimeRef.current = smoothed;
    const adjusted = smoothed + SYNC_OFFSET;
    adjustedTimeRef.current = adjusted;
    return adjusted;
  }, [currentTime]);

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

  // Update current line and word based on playback time with sync offset
  useEffect(() => {
    if (lines.length === 0) return;

    const adjustedTime = getAdjustedTime();

    // Prefer word-level sync if available
    let activeWordIdx: number | null = null;
    if (words.length > 0) {
      const exactIndex = words.findIndex(
        (word) => adjustedTime >= word.start - WORD_TOLERANCE && adjustedTime <= word.end + WORD_TOLERANCE
      );

      if (exactIndex !== -1) {
        activeWordIdx = exactIndex;
      } else {
        // Fallback to nearest/holding word to avoid skips on fast phrases
        const nextIdx = words.findIndex((word) => word.start > adjustedTime);
        const prevIdx = nextIdx === -1 ? words.length - 1 : Math.max(0, nextIdx - 1);
        const prevWord = words[prevIdx];
        const nextWord = nextIdx === -1 ? null : words[nextIdx];
        const gapFromPrevEnd = prevWord ? adjustedTime - prevWord.end : Infinity;
        const gapToNextStart = nextWord ? nextWord.start - adjustedTime : Infinity;

        if (prevWord && gapFromPrevEnd <= SMALL_GAP_HOLD) {
          activeWordIdx = prevIdx;
        } else if (nextWord && gapToNextStart <= SMALL_GAP_HOLD) {
          activeWordIdx = nextIdx;
        } else {
          // Default to closest previous word to keep continuity
          activeWordIdx = prevIdx;
        }
      }
    }

    // Derive line index
    let lineIndex = currentLineIndex;
    if (activeWordIdx !== null && wordToLine.has(activeWordIdx)) {
      lineIndex = wordToLine.get(activeWordIdx) || 0;
    } else {
      // Line-level detection
      const matchIndex = lines.findIndex(
        (line) => adjustedTime >= line.startTime && adjustedTime < line.endTime
      );
      if (matchIndex !== -1) {
        lineIndex = matchIndex;
      } else {
        if (adjustedTime >= lines[lines.length - 1].endTime) {
          lineIndex = lines.length - 1;
        } else {
          const upcomingIndex = lines.findIndex(line => line.startTime > adjustedTime);
          if (upcomingIndex > 0) {
            lineIndex = upcomingIndex - 1;
          } else if (upcomingIndex === 0) {
            lineIndex = 0;
          }
        }
      }
    }

    if (lineIndex !== currentLineIndex) {
      setCurrentLineIndex(lineIndex);
      setLineSlideKey((k) => k + 1);
    }

    if (activeWordIdx !== null && activeWordIdx !== currentWordIndex) {
      setCurrentWordIndex(activeWordIdx);
    }

    if (activeWordIdx !== null && words[activeWordIdx]) {
      const word = words[activeWordIdx];
      const effectiveDuration = Math.max(MIN_WORD_DURATION, word.end - word.start);
      const adjustedStart = word.start - WORD_TOLERANCE * 0.35;
      const adjustedEnd = word.end + WORD_TOLERANCE * 0.35;
      const clampedTime = Math.min(adjustedEnd, Math.max(adjustedStart, adjustedTime));
      const progress = Math.min(1, Math.max(0, (clampedTime - adjustedStart) / Math.max(0.001, effectiveDuration)));
      setActiveWordProgress(progress);
    } else {
      setActiveWordProgress(0);
    }
  }, [currentTime, lines, currentLineIndex, words, wordToLine, getAdjustedTime, currentWordIndex]);

  // Note: We no longer auto-scroll since we're showing a centered 3-line view
  // The previous/current/next lines are always visible in the center
  // This prevents the scrollIntoView from scrolling the parent Discovery feed

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
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Subtle reactive glow - no solid background for overlay mode */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary blob - purple, reacts to bass - more subtle */}
        <div
          className="absolute rounded-full"
          style={{
            width: '60%',
            height: '60%',
            left: '20%',
            top: '15%',
            background: `radial-gradient(circle,
              rgba(147, 51, 234, ${0.2 + bassEnergy * 0.2}) 0%,
              rgba(147, 51, 234, 0) 70%)`,
            filter: 'blur(80px)',
            transform: `scale(${1 + bassEnergy * 0.15})`,
            transition: 'transform 0.15s ease-out, background 0.15s ease-out',
          }}
        />
        {/* Secondary blob - indigo, reacts to treble - more subtle */}
        <div
          className="absolute rounded-full"
          style={{
            width: '50%',
            height: '50%',
            right: '10%',
            bottom: '20%',
            background: `radial-gradient(circle,
              rgba(79, 70, 229, ${0.15 + trebleEnergy * 0.15}) 0%,
              rgba(79, 70, 229, 0) 70%)`,
            filter: 'blur(70px)',
            transform: `scale(${1 + trebleEnergy * 0.12}) translateY(${-trebleEnergy * 10}px)`,
            transition: 'transform 0.12s ease-out, background 0.12s ease-out',
          }}
        />
      </div>

      {/* Lyrics Display - Apple Music style centered layout */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-3 sm:px-6 md:px-12 min-h-0"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
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
          // Centered lyrics display - only show current line and neighbors
          <div className="flex flex-col items-center justify-center min-h-full">
            <div
              key={lineSlideKey}
              className="w-full max-w-4xl mx-auto text-center space-y-4 transition-transform duration-250 ease-out"
            >
              {/* Previous line - subtle */}
              {currentLineIndex > 0 && (
                <p
                  className="text-lg sm:text-xl md:text-2xl font-medium text-white/55 transition-all duration-300 transform -translate-y-1"
                  onClick={() => handleLineClick(lines[currentLineIndex - 1])}
                >
                  {lines[currentLineIndex - 1].text}
                </p>
              )}

              {/* Current line - prominent and centered */}
              <div className="animate-[lyricLineIn_0.35s_ease-out]">
                {lines[currentLineIndex]?.words && lines[currentLineIndex].words.length > 0 ? (
                  <div
                    className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight flex flex-wrap justify-center gap-y-2"
                    style={{
                      textShadow: isPlaying
                        ? `0 0 40px rgba(147, 51, 234, ${0.35 + bassEnergy * 0.25}),
                           0 0 70px rgba(79, 70, 229, ${0.18 + bassEnergy * 0.12}),
                           0 3px 6px rgba(0, 0, 0, 0.45)`
                        : "0 0 30px rgba(147, 51, 234, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)",
                      transition: 'text-shadow 0.15s ease-out',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {lines[currentLineIndex].words.map((word, idx) => {
                      const isActiveWord = currentWordIndex !== null && word.index === currentWordIndex;
                      const isPast = currentWordIndex !== null && word.index < currentWordIndex;
                      const isFuture = currentWordIndex !== null && word.index > currentWordIndex;
                      const color = isActiveWord
                        ? 'white'
                        : isPast
                          ? 'rgba(255,255,255,0.7)'
                          : 'rgba(255,255,255,0.4)';
                      return (
                        <span
                          key={`${word.index}-${idx}`}
                          className="relative mx-1"
                          style={{
                            color,
                            transform: isActiveWord ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
                            transition: 'transform 0.12s ease-out, color 0.12s ease-out',
                            textShadow: isActiveWord
                              ? `0 0 24px rgba(147, 51, 234, ${0.35 + bassEnergy * 0.25})`
                              : isPast
                                ? '0 0 12px rgba(255,255,255,0.08)'
                                : undefined,
                          }}
                        >
                          {word.word}
                          {idx < lines[currentLineIndex].words.length - 1 ? ' ' : ''}
                          {isActiveWord && (
                            <span
                              className="absolute left-0 right-0 -bottom-2 h-[3px] rounded-full"
                              style={{
                                background: 'linear-gradient(90deg, rgba(168,85,247,0.95), rgba(79,70,229,0.9))',
                                width: `${Math.max(0.18, activeWordProgress) * 100}%`,
                                transition: 'width 0.1s ease-out',
                                boxShadow: '0 0 12px rgba(168,85,247,0.6)',
                              }}
                            />
                          )}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p
                    className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight"
                    style={{
                      color: 'white',
                      textShadow: isPlaying
                        ? `0 0 40px rgba(147, 51, 234, ${0.4 + bassEnergy * 0.3}),
                           0 0 80px rgba(79, 70, 229, ${0.2 + bassEnergy * 0.15}),
                           0 4px 8px rgba(0, 0, 0, 0.5)`
                        : "0 0 30px rgba(147, 51, 234, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)",
                      transition: 'text-shadow 0.15s ease-out',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {lines[currentLineIndex]?.text || '...'}
                  </p>
                )}
              </div>

              {/* Next line - subtle hint */}
              {currentLineIndex < lines.length - 1 && (
                <p
                  className="text-lg sm:text-xl md:text-2xl font-medium text-white/40 transition-all duration-300 transform translate-y-1"
                  onClick={() => handleLineClick(lines[currentLineIndex + 1])}
                >
                  {lines[currentLineIndex + 1].text}
                </p>
              )}
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


      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes lyricLineIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
