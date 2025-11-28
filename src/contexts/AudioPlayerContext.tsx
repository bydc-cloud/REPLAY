import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { Track, getAudioUrl, useMusicLibrary } from "./MusicLibraryContext";
import { useAuth } from "./PostgresAuthContext";

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
  const { incrementPlayCount } = useMusicLibrary();
  const { token } = useAuth();

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

  // Initialize audio element
  useEffect(() => {
    // Create audio element with mobile-friendly settings
    const audio = new Audio();
    audio.volume = volume;
    audio.crossOrigin = "anonymous";

    // Mobile-specific: Enable inline playback
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.preload = "auto";

    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("ended", () => {
      handleTrackEnd();
    });

    audio.addEventListener("error", (e) => {
      console.error("Audio error:", (e.target as HTMLAudioElement)?.error);
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

      console.log("Unlocking audio for mobile...");

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

        // Store original src
        const originalSrc = silentAudio.src;

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

        // Restore
        silentAudio.src = originalSrc;
        silentAudio.volume = volume;

        // Mark as unlocked
        audioUnlockedRef.current = true;

        // If there was a pending play, execute it now
        if (pendingPlayRef.current) {
          const track = pendingPlayRef.current;
          pendingPlayRef.current = null;
          loadAndPlayTrack(track);
        }
      } catch (e) {
        console.log("Audio unlock error (non-fatal):", e);
        // Still mark as unlocked so we can try to play
        audioUnlockedRef.current = true;
      }

      // Remove listeners after unlock
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };

    // Add unlock listeners with capture to ensure they fire first
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('touchend', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio, { passive: true });

    return () => {
      audio.pause();
      audio.src = "";
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
  }, []);

  // Setup audio analyzer for visualization
  const setupAnalyzer = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (e) {
      console.error("Failed to setup audio analyzer:", e);
    }
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

    // Mark as unlocked since this is being called from a user gesture (play button click)
    audioUnlockedRef.current = true;

    setCurrentTrack(track);
    setIsPlaying(false);

    try {
      let audioUrl: string | null = null;

      // Check if track has cloud storage (fileKey) and needs streaming URL
      if (track.fileKey && token && (!track.fileUrl || track.fileUrl === '')) {
        // Fetch streaming URL from API
        try {
          const response = await fetch(`${API_URL}/api/stream/${track.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            mode: 'cors',
          });
          if (response.ok) {
            const data = await response.json();
            audioUrl = data.url;
            console.log('Got streaming URL for cloud track');
          }
        } catch (streamError) {
          console.error('Failed to get streaming URL:', streamError);
        }
      }

      // Fall back to local URL if available
      if (!audioUrl) {
        if (track.fileUrl && track.fileUrl.startsWith("indexeddb://")) {
          // For future IndexedDB support
          audioUrl = track.fileUrl;
        } else if (track.fileUrl) {
          audioUrl = getAudioUrl(track);
        }
      }

      if (!audioUrl) {
        console.error("Could not get audio URL for track:", track.title);
        return;
      }

      console.log("Loading audio URL:", audioUrl.substring(0, 100) + "...");

      // Load the audio
      audioRef.current.src = audioUrl;

      // Wait for audio to be loadable
      await new Promise<void>((resolve, reject) => {
        const audio = audioRef.current!;

        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve();
        };

        const onError = () => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          reject(new Error('Failed to load audio'));
        };

        audio.addEventListener('canplay', onCanPlay, { once: true });
        audio.addEventListener('error', onError, { once: true });

        audio.load();

        // Timeout fallback
        setTimeout(() => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve(); // Try to play anyway
        }, 5000);
      });

      // Resume AudioContext if suspended (required for mobile)
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Use a promise to handle mobile play restrictions
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
            console.log("Playback started successfully");
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
            }
          });
      }
    } catch (e) {
      console.error("Failed to play track:", e);
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
