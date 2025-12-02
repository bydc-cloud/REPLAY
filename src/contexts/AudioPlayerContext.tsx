import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { Track, useMusicLibrary } from "./MusicLibraryContext";
import { useAuth } from "./PostgresAuthContext";
import { useToast } from "./ToastContext";

// API URL from environment
const API_URL = import.meta.env.VITE_API_URL || '';

type RepeatMode = "off" | "all" | "one";
type ShuffleMode = "off" | "on";

interface AudioPlayerContextType {
  // State
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffleMode: ShuffleMode;
  queue: Track[];
  audioLevels: number[];
  audioElement: HTMLAudioElement | null;

  // Actions
  play: (track?: Track) => void;
  pause: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  seekForward: (seconds?: number) => void;
  seekBackward: (seconds?: number) => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  addToQueueNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const { incrementPlayCount, getTrackAudio, getStreamUrl } = useMusicLibrary();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffleMode, setShuffleMode] = useState<ShuffleMode>("off");
  const [queue, setQueueState] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(64).fill(0));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioUnlockedRef = useRef<boolean>(false);
  const pendingPlayRef = useRef<Track | null>(null);
  const lastTimeUpdateRef = useRef<number>(0);
  const wasPlayingBeforeHiddenRef = useRef<boolean>(false);
  const currentLoadIdRef = useRef<number>(0); // Track current loading request to prevent race conditions
  const retryCountRef = useRef<Map<string, number>>(new Map()); // Track retry counts per track to prevent infinite loops

  // Initialize audio element
  useEffect(() => {
    // Create audio element with mobile-friendly settings
    const audio = new Audio();
    audio.volume = volume;
    // Don't set crossOrigin for mobile - it can cause "operation not supported" errors
    // audio.crossOrigin = "anonymous";

    // Mobile-specific: Enable inline playback and background audio
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.preload = "metadata"; // Use "metadata" instead of "auto" for mobile performance

    // CRITICAL for iOS background playback - set audio category
    // This helps iOS recognize this as a media app that should continue in background
    if ('webkitAudioContext' in window) {
      // iOS Safari - the audio element should be treated as media
      (audio as HTMLAudioElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = true;
    }

    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      // Throttle timeupdate to ~10 updates per second - fast enough to be smooth but not overwhelm React
      const now = Date.now();
      if (now - lastTimeUpdateRef.current >= 100) {
        lastTimeUpdateRef.current = now;
        setCurrentTime(audio.currentTime);
      }
    });

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("ended", () => {
      handleTrackEnd();
    });

    audio.addEventListener("error", (e) => {
      const audioError = (e.target as HTMLAudioElement)?.error;
      console.error("Audio error:", audioError);
      // Provide helpful error message based on error code
      if (audioError) {
        const errorMessages: Record<number, string> = {
          1: 'Audio loading aborted',
          2: 'Network error loading audio',
          3: 'Audio decoding error - file may be corrupted',
          4: 'Audio format not supported on this device'
        };
        const message = errorMessages[audioError.code] || 'Unknown audio error';
        console.error(`Audio error code ${audioError.code}: ${message}`);
        showToast(message, 'error');
      }
    });

    // Mobile: Handle play/pause state changes
    audio.addEventListener("play", () => {
      setIsPlaying(true);
    });

    audio.addEventListener("pause", () => {
      setIsPlaying(false);
    });

    // Mobile: canplaythrough event for better mobile handling
    audio.addEventListener("canplaythrough", () => {
      console.log("Audio ready to play through");
    });

    // Mobile: Unlock audio and AudioContext on first user interaction
    const unlockAudio = async () => {
      if (audioUnlockedRef.current) return;

      // IMMEDIATELY mark as unlocked to prevent multiple calls
      audioUnlockedRef.current = true;

      console.log("Unlocking audio for mobile...");

      // Remove listeners immediately to prevent duplicate calls
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);

      try {
        // Create and resume AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log("AudioContext resumed");
        }

        // iOS Safari requires actually playing audio to unlock
        // Create a tiny silent audio and play it
        const silentAudio = audio;

        // Create a short silent data URI (tiny MP3)
        const silentDataUri = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYZVPblmAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQZB4P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

        // Play silent audio to unlock
        silentAudio.src = silentDataUri;
        silentAudio.volume = 0.01;

        try {
          await silentAudio.play();
          silentAudio.pause();
          console.log("Audio unlocked successfully with silent play");
        } catch (playError) {
          console.log("Silent play failed (expected on some devices):", playError);
        }

        // Reset to empty state (don't restore empty src which causes errors)
        silentAudio.removeAttribute('src');
        silentAudio.load(); // Reset audio element
        silentAudio.volume = volume;

        // If there was a pending play, execute it now
        if (pendingPlayRef.current) {
          const track = pendingPlayRef.current;
          pendingPlayRef.current = null;
          loadAndPlayTrack(track);
        }
      } catch (e) {
        console.log("Audio unlock error (non-fatal):", e);
      }
    };

    // Add unlock listeners with capture to ensure they fire first
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('touchend', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio, { passive: true });

    // Handle page visibility changes (when user leaves and returns)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden - remember if we were playing
        wasPlayingBeforeHiddenRef.current = !audio.paused;
        console.log("Page hidden, was playing:", wasPlayingBeforeHiddenRef.current);

        // IMPORTANT: On iOS, DON'T pause the audio when going to background
        // The Media Session API will handle lock screen controls
        // Just let the audio continue playing
      } else if (document.visibilityState === 'visible') {
        console.log("Page became visible, checking audio state...");

        // Resume AudioContext if it got suspended while page was hidden
        if (audioContextRef.current?.state === 'suspended') {
          try {
            await audioContextRef.current.resume();
            console.log("AudioContext resumed after visibility change");
          } catch (e) {
            console.log("Failed to resume AudioContext:", e);
          }
        }

        // Sync the current time immediately when page becomes visible
        if (audio && audio.duration > 0) {
          setCurrentTime(audio.currentTime);
          setDuration(audio.duration);
        }

        // Update isPlaying state to match actual audio state
        setIsPlaying(!audio.paused);

        // On iOS, the audio element may need to be re-prepared
        // If we were playing before and now paused, the user can tap to resume
        if (wasPlayingBeforeHiddenRef.current && audio.paused && audio.currentTime > 0) {
          console.log("Audio was interrupted by iOS, ready to resume on user tap");
        }
      }
    };

    // Handle iOS audio interruptions (phone calls, Siri, other apps)
    const handleAudioInterruption = async () => {
      console.log("Audio interruption detected");
      // The audio element's pause/play events will handle state updates
      // Just sync the playing state
      setIsPlaying(!audio.paused);
    };

    // iOS Safari fires 'webkitplaybacktargetavailabilitychanged' for AirPlay
    // This helps keep playback state synced
    audio.addEventListener('webkitplaybacktargetavailabilitychanged', handleAudioInterruption as EventListener);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      audio.pause();
      audio.src = "";
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.removeEventListener('webkitplaybacktargetavailabilitychanged', handleAudioInterruption as EventListener);
    };
  }, []);

  // Setup audio analyzer for visualization - REMOVED
  // Audio routing is now handled by AudioEffectsContext to avoid duplicate MediaElementAudioSourceNode
  const setupAnalyzer = useCallback(() => {
    // No-op: AudioEffectsContext now handles the audio routing and provides analyserNode
    console.log("Audio analyzer setup delegated to AudioEffectsContext");
  }, []);

  // Update audio levels for visualization
  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current || !isPlaying) {
      setAudioLevels(Array(64).fill(0));
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const levels = Array.from(dataArray).map(v => v / 255);
    setAudioLevels(levels);

    animationRef.current = requestAnimationFrame(updateAudioLevels);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      updateAudioLevels();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevels(Array(64).fill(0));
    }
  }, [isPlaying, updateAudioLevels]);

  // Media Session API for iOS/iPhone lock screen and hardware button controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Update metadata when track changes
    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Unknown Title',
        artist: currentTrack.artist || 'Unknown Artist',
        album: currentTrack.album || 'Unknown Album',
        artwork: currentTrack.artworkUrl || currentTrack.artworkData
          ? [{ src: currentTrack.artworkUrl || currentTrack.artworkData || '', sizes: '512x512', type: 'image/jpeg' }]
          : [],
      });
    }

    // Update playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Update position state for scrubbing
    if (audioRef.current && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: audioRef.current.playbackRate,
          position: currentTime,
        });
      } catch (e) {
        // Position state might not be supported on all browsers
      }
    }
  }, [currentTrack, isPlaying, currentTime, duration]);

  // Set up media session action handlers (only once)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Play action
    navigator.mediaSession.setActionHandler('play', () => {
      if (audioRef.current && currentTrack) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    });

    // Pause action
    navigator.mediaSession.setActionHandler('pause', () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    });

    // Previous track
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (queue.length > 0) {
        if (currentTime > 3) {
          // Seek to beginning if more than 3 seconds in
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
        } else {
          const prevIndex = Math.max(currentIndex - 1, 0);
          if (prevIndex !== currentIndex) {
            setCurrentIndex(prevIndex);
            loadAndPlayTrack(queue[prevIndex]);
          }
        }
      }
    });

    // Next track
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (queue.length > 0) {
        const nextIndex = repeatMode === "all"
          ? (currentIndex + 1) % queue.length
          : Math.min(currentIndex + 1, queue.length - 1);
        if (nextIndex !== currentIndex || repeatMode === "all") {
          setCurrentIndex(nextIndex);
          loadAndPlayTrack(queue[nextIndex]);
        }
      }
    });

    // Seek backward (15 seconds)
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0);
      }
    });

    // Seek forward (15 seconds)
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration);
      }
    });

    // Seek to specific position (scrubbing from lock screen)
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    // Stop
    navigator.mediaSession.setActionHandler('stop', () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setCurrentTime(0);
      }
    });

    return () => {
      // Clean up action handlers
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekto', null);
        navigator.mediaSession.setActionHandler('stop', null);
      }
    };
  }, [queue, currentIndex, repeatMode, duration, currentTime, currentTrack]);

  const handleTrackEnd = () => {
    switch (repeatMode) {
      case "one":
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        break;
      case "all":
        const nextIndex = (currentIndex + 1) % queue.length;
        setCurrentIndex(nextIndex);
        loadAndPlayTrack(queue[nextIndex]);
        break;
      case "off":
        if (currentIndex < queue.length - 1) {
          setCurrentIndex(currentIndex + 1);
          loadAndPlayTrack(queue[currentIndex + 1]);
        } else {
          setIsPlaying(false);
        }
        break;
    }
  };

  const loadAndPlayTrack = async (track: Track) => {
    if (!audioRef.current) return;

    // Generate unique ID for this load request to prevent race conditions
    const loadId = ++currentLoadIdRef.current;

    // Helper to check if this request is still the current one
    const isStale = () => loadId !== currentLoadIdRef.current;

    // Mark as unlocked since this is being called from a user gesture (play button click)
    audioUnlockedRef.current = true;

    setCurrentTrack(track);
    setIsPlaying(false);

    try {
      let audioUrl: string | null = null;

      console.log("Loading track for playback:", {
        id: track.id,
        title: track.title,
        loadId,
        hasFileUrl: !!track.fileUrl,
        fileUrlLength: track.fileUrl?.length || 0,
        hasAudio: track.hasAudio,
      });

      // Check if we already have the audio locally (blob or data URL)
      // First check the passed track object
      if (track.fileUrl && track.fileUrl.length > 0 &&
          (track.fileUrl.startsWith('blob:') || track.fileUrl.startsWith('data:'))) {
        // For blob URLs, verify they're still valid (they expire after page refresh)
        if (track.fileUrl.startsWith('blob:')) {
          try {
            // Quick HEAD request to check if blob is still accessible
            const blobResponse = await fetch(track.fileUrl, { method: 'HEAD' });
            if (blobResponse.ok) {
              audioUrl = track.fileUrl;
              console.log("Using local blob URL from track object (verified valid)");
            } else {
              console.log("Blob URL is stale/invalid, will try cloud fallback");
            }
          } catch (blobError) {
            console.log("Blob URL expired or invalid, will try cloud fallback:", blobError);
          }
        } else {
          // Data URLs don't expire, use directly
          audioUrl = track.fileUrl;
          console.log("Using local data URL from track object");
        }
      }

      if (!audioUrl) {
        // Also try to get audio via the context method which checks current tracks state
        console.log("Trying to get audio via getTrackAudio...");
        const contextAudio = await getTrackAudio(track.id);

        // Check if this request is still current after async operation
        if (isStale()) {
          console.log(`Load request ${loadId} is stale, aborting (after getTrackAudio)`);
          return;
        }

        if (contextAudio && (contextAudio.startsWith('blob:') || contextAudio.startsWith('data:'))) {
          // For blob URLs, verify they're still valid
          if (contextAudio.startsWith('blob:')) {
            try {
              const blobResponse = await fetch(contextAudio, { method: 'HEAD' });
              if (blobResponse.ok) {
                audioUrl = contextAudio;
                console.log("Using blob URL from getTrackAudio (verified valid)");
              } else {
                console.log("Context blob URL is stale/invalid");
              }
            } catch {
              console.log("Context blob URL expired, trying cloud fallback");
            }
          } else {
            audioUrl = contextAudio;
            console.log("Using data URL from getTrackAudio, length:", contextAudio.length);
          }
        }
      }

      // If still no local audio, try cloud audio
      if (!audioUrl) {
        // Detect if we're on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        console.log("No local audio, fetching from cloud. Mobile:", isMobile, "hasAudio:", track.hasAudio);

        if (isMobile) {
          // MOBILE STRATEGY: Fetch binary audio and create blob URL
          // This avoids both base64 memory issues AND streaming URL compatibility issues
          // Blob URLs work reliably on iOS Safari
          const streamUrl = getStreamUrl(track.id);
          if (streamUrl) {
            try {
              showToast(`Loading "${track.title}"...`, 'info', 3000);
              console.log("Mobile: Fetching audio as blob from streaming endpoint...");

              const response = await fetch(streamUrl);

              // Check if this request is still current after async fetch
              if (isStale()) {
                console.log(`Load request ${loadId} is stale, aborting (after mobile fetch)`);
                return;
              }

              if (response.ok) {
                const blob = await response.blob();
                audioUrl = URL.createObjectURL(blob);
                console.log("Mobile: Created blob URL, size:", blob.size);
              } else {
                console.error("Mobile: Stream fetch failed:", response.status);
              }
            } catch (fetchError) {
              console.error("Mobile: Error fetching audio stream:", fetchError);
            }
          }

          // Fallback to base64 data URL if blob approach failed
          if (!audioUrl) {
            console.log("Mobile: Falling back to base64 data URL...");
            try {
              audioUrl = await getTrackAudio(track.id);

              // Check if this request is still current after async operation
              if (isStale()) {
                console.log(`Load request ${loadId} is stale, aborting (after mobile fallback)`);
                return;
              }

              if (audioUrl) {
                console.log("Mobile: Using base64 data URL, length:", audioUrl.length);
              }
            } catch (fetchError) {
              console.error("Mobile: Error fetching base64 audio:", fetchError);
            }
          }
        } else {
          // DESKTOP STRATEGY: Use streaming URL, but verify it first
          const streamUrl = getStreamUrl(track.id);
          if (streamUrl) {
            // Pre-check if the stream URL will return valid audio
            // Do a HEAD request first to check content-type
            try {
              console.log("Desktop: Checking streaming URL availability...");
              const headResponse = await fetch(streamUrl, { method: 'HEAD' });

              // Check if this request is still current after async operation
              if (isStale()) {
                console.log(`Load request ${loadId} is stale, aborting (after HEAD check)`);
                return;
              }

              const contentType = headResponse.headers.get('content-type');

              if (headResponse.ok && contentType && contentType.startsWith('audio/')) {
                audioUrl = streamUrl;
                console.log("Desktop: Using streaming URL for instant playback");
              } else if (contentType && contentType.includes('application/json')) {
                // Server returned JSON error - audio data is missing
                console.log("Desktop: Streaming endpoint returned JSON error, audio missing in cloud");
                // Don't set audioUrl - let it fall through to show error message
              } else {
                // Some other error
                console.log("Desktop: Streaming check failed, status:", headResponse.status);
              }
            } catch (headError) {
              console.log("Desktop: HEAD request failed, trying GET...", headError);
              // If HEAD fails, try fetching as blob to check
              try {
                const response = await fetch(streamUrl);

                if (isStale()) {
                  console.log(`Load request ${loadId} is stale, aborting (after stream fetch)`);
                  return;
                }

                const contentType = response.headers.get('content-type');
                if (response.ok && contentType && contentType.startsWith('audio/')) {
                  // Got valid audio - create blob URL
                  const blob = await response.blob();
                  audioUrl = URL.createObjectURL(blob);
                  console.log("Desktop: Created blob URL from stream, size:", blob.size);
                } else {
                  console.log("Desktop: Stream returned non-audio content type:", contentType);
                }
              } catch (fetchError) {
                console.error("Desktop: Stream fetch failed:", fetchError);
              }
            }
          }

          // Fallback to full download if streaming failed or not available
          if (!audioUrl) {
            console.log("Desktop: Streaming not available or failed, fetching full audio...");
            showToast(`Loading "${track.title}"...`, 'info', 2000);

            try {
              audioUrl = await getTrackAudio(track.id);

              // Check if this request is still current after async operation
              if (isStale()) {
                console.log(`Load request ${loadId} is stale, aborting (after desktop fallback)`);
                return;
              }

              if (audioUrl) {
                console.log("Desktop: Audio fetched, size:", audioUrl.length);
              }
            } catch (fetchError) {
              console.error("Desktop: Error fetching audio:", fetchError);
            }
          }
        }
      }

      if (!audioUrl) {
        console.error("Could not get audio URL for track:", track.title);
        // Check if track has hasAudio flag to give more specific message
        if (track.hasAudio === false) {
          showToast(`"${track.title}" audio not synced to cloud. Please re-import this track.`, 'error');
        } else {
          showToast(`Unable to play "${track.title}". Try re-importing this track.`, 'error');
        }
        setIsPlaying(false);
        return;
      }

      const isStreamingUrl = audioUrl.startsWith('http');
      const isDataUrl = audioUrl.startsWith('data:');
      const isBlobUrl = audioUrl.startsWith('blob:');
      console.log("Loading audio, type:", isStreamingUrl ? 'streaming' : isDataUrl ? 'base64' : isBlobUrl ? 'blob' : 'unknown');

      // Set the audio source
      audioRef.current.src = audioUrl;

      // Always call load() to prepare the audio element
      audioRef.current.load();

      // Wait for the audio to be ready, with a timeout fallback
      // On mobile, we proceed after a short wait even if canplay hasn't fired
      const timeoutMs = isBlobUrl ? 1500 : isStreamingUrl ? 4000 : 2000;

      await new Promise<void>((resolve) => {
        const audio = audioRef.current!;
        let resolved = false;

        const done = () => {
          if (resolved) return;
          resolved = true;
          resolve();
        };

        // Timeout - proceed anyway after wait
        const timeout = setTimeout(() => {
          console.log("Audio load timeout - proceeding to play");
          done();
        }, timeoutMs);

        // Success - audio is ready
        const onCanPlay = () => {
          console.log("Audio canplay event fired");
          clearTimeout(timeout);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('loadeddata', onLoadedData);
          done();
        };

        // Also listen for loadeddata as backup
        const onLoadedData = () => {
          console.log("Audio loadeddata event fired");
          clearTimeout(timeout);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('loadeddata', onLoadedData);
          done();
        };

        audio.addEventListener('canplay', onCanPlay, { once: true });
        audio.addEventListener('loadeddata', onLoadedData, { once: true });
      });

      // CRITICAL: Check if this request is still current after waiting for audio to load
      // This is the most important check - prevents playing wrong track's audio
      if (isStale()) {
        console.log(`Load request ${loadId} is stale, aborting before play (track: "${track.title}")`);
        // Stop and clear the audio element since we're not going to play this track
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        return;
      }

      console.log("Audio ready, attempting to play...");

      // Resume AudioContext if suspended (required for mobile)
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Use a promise to handle mobile play restrictions
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Final staleness check - if track changed while play() was processing
            if (isStale()) {
              console.log(`Load request ${loadId} became stale during play, stopping`);
              audioRef.current?.pause();
              return;
            }

            // Playback started successfully - reset retry count for this track
            retryCountRef.current.delete(track.id);
            console.log("Playback started successfully for:", track.title);
            setIsPlaying(true);
            incrementPlayCount(track.id);

            // Setup analyzer after successful play
            setupAnalyzer();
          })
          .catch((error) => {
            // Auto-play was prevented or other error
            console.error("Playback failed:", error.name, error.message);

            // On mobile, we may need user interaction - set up for retry
            if (error.name === 'NotAllowedError') {
              console.log('Playback requires user interaction. Tap play to start.');
              pendingPlayRef.current = track;
              setIsPlaying(false);
              showToast('Tap play again to start playback', 'info');
            } else if (error.name === 'AbortError') {
              // This can happen on mobile when switching tracks quickly
              console.log('Playback aborted - retrying...');
              // Don't show error, just let user try again
            } else if (error.name === 'NotSupportedError' || error.message?.includes('not supported')) {
              // This happens on mobile Safari with certain audio formats or streaming issues
              console.log('Audio format not supported on this device');

              // Check retry count to prevent infinite loops
              const currentRetries = retryCountRef.current.get(track.id) || 0;
              const MAX_RETRIES = 1; // Only retry once

              if (currentRetries < MAX_RETRIES && track.fileUrl && (track.fileUrl.startsWith('blob:') || track.fileUrl.startsWith('data:'))) {
                retryCountRef.current.set(track.id, currentRetries + 1);
                console.log(`Retrying playback for ${track.title} (attempt ${currentRetries + 1})`);
                showToast('Retrying playback...', 'info');
                setTimeout(() => loadAndPlayTrack(track), 500);
              } else {
                // Don't retry - show error and reset retry count
                retryCountRef.current.delete(track.id);
                showToast('Audio format not supported. Try re-importing this track.', 'error');
              }
            } else {
              showToast(`Playback error: ${error.message}`, 'error');
            }
          });
      }
    } catch (e) {
      console.error("Failed to play track:", e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      showToast(`Failed to play "${track.title}": ${errorMessage}`, 'error');
    }
  };

  const play = async (track?: Track) => {
    // Check if there's a pending track from before audio was unlocked
    if (pendingPlayRef.current && !track) {
      track = pendingPlayRef.current;
      pendingPlayRef.current = null;
    }

    if (track) {
      // Mark audio as unlocked since user explicitly pressed play
      audioUnlockedRef.current = true;
      loadAndPlayTrack(track);
    } else if (audioRef.current && currentTrack) {
      // Mark audio as unlocked since user explicitly pressed play
      audioUnlockedRef.current = true;

      // Resume AudioContext first (required for mobile)
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Play failed:", error);
          });
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const seekForward = (seconds = 15) => {
    seek(Math.min(currentTime + seconds, duration));
  };

  const seekBackward = (seconds = 15) => {
    seek(Math.max(currentTime - seconds, 0));
  };

  const setVolume = (vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVol);
    if (audioRef.current) {
      audioRef.current.volume = clampedVol;
    }
  };

  const setQueue = (tracks: Track[], startIndex = 0) => {
    setOriginalQueue(tracks);
    const newQueue = shuffleMode === "on" ? shuffleArray(tracks) : tracks;
    setQueueState(newQueue);

    if (tracks.length > 0) {
      const actualIndex = shuffleMode === "on"
        ? newQueue.findIndex(t => t.id === tracks[startIndex]?.id)
        : startIndex;
      setCurrentIndex(Math.max(0, actualIndex));
      loadAndPlayTrack(newQueue[Math.max(0, actualIndex)]);
    }
  };

  const addToQueue = (track: Track) => {
    setQueueState(prev => [...prev, track]);
    setOriginalQueue(prev => [...prev, track]);
  };

  const addToQueueNext = (track: Track) => {
    const insertIndex = currentIndex + 1;
    setQueueState(prev => [
      ...prev.slice(0, insertIndex),
      track,
      ...prev.slice(insertIndex)
    ]);
    setOriginalQueue(prev => [
      ...prev.slice(0, insertIndex),
      track,
      ...prev.slice(insertIndex)
    ]);
  };

  const removeFromQueue = (index: number) => {
    setQueueState(prev => prev.filter((_, i) => i !== index));
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueueState([]);
    setOriginalQueue([]);
    setCurrentIndex(0);
    stop();
    setCurrentTrack(null);
  };

  const playNext = () => {
    if (queue.length === 0) return;

    if (repeatMode === "one") {
      seek(0);
      play();
    } else {
      const nextIndex = repeatMode === "all"
        ? (currentIndex + 1) % queue.length
        : Math.min(currentIndex + 1, queue.length - 1);

      if (nextIndex !== currentIndex || repeatMode === "all") {
        setCurrentIndex(nextIndex);
        loadAndPlayTrack(queue[nextIndex]);
      }
    }
  };

  const playPrevious = () => {
    if (queue.length === 0) return;

    if (currentTime > 3) {
      seek(0);
    } else {
      const prevIndex = Math.max(currentIndex - 1, 0);
      setCurrentIndex(prevIndex);
      loadAndPlayTrack(queue[prevIndex]);
    }
  };

  const toggleShuffle = () => {
    if (shuffleMode === "off") {
      setShuffleMode("on");
      const currentTrackRef = queue[currentIndex];
      const shuffled = shuffleArray(queue);
      const newIndex = shuffled.findIndex(t => t.id === currentTrackRef?.id);
      setQueueState(shuffled);
      setCurrentIndex(Math.max(0, newIndex));
    } else {
      setShuffleMode("off");
      const currentTrackRef = queue[currentIndex];
      setQueueState(originalQueue);
      const newIndex = originalQueue.findIndex(t => t.id === currentTrackRef?.id);
      setCurrentIndex(Math.max(0, newIndex));
    }
  };

  const cycleRepeatMode = () => {
    setRepeatMode(prev => {
      switch (prev) {
        case "off": return "all";
        case "all": return "one";
        case "one": return "off";
      }
    });
  };

  return (
    <AudioPlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      repeatMode,
      shuffleMode,
      queue,
      audioLevels,
      audioElement: audioRef.current,
      play,
      pause,
      togglePlayPause,
      stop,
      seek,
      seekForward,
      seekBackward,
      setVolume,
      playNext,
      playPrevious,
      setQueue,
      addToQueue,
      addToQueueNext,
      removeFromQueue,
      clearQueue,
      toggleShuffle,
      cycleRepeatMode
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
};

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
