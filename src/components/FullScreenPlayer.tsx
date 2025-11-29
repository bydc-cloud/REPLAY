import { useState, useEffect, useRef } from "react";
import { ChevronDown, Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Volume2, MoreHorizontal, ListMusic, Share2, ListPlus, User, Disc } from "lucide-react";
import { PremiumCoverArt } from "./PremiumCoverArt";
import { useSettings } from "../contexts/SettingsContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";
import { useToast } from "../contexts/ToastContext";

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  liked: boolean;
  onLike: () => void;
  progress: number;
  onProgressChange: (value: number) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
}

export const FullScreenPlayer = ({
  isOpen,
  onClose,
  isPlaying,
  onPlayPause,
  liked,
  onLike,
  progress,
  onProgressChange,
  volume,
  onVolumeChange,
}: FullScreenPlayerProps) => {
  const { visualizerVariant } = useSettings();
  const { currentTrack, currentTime, duration, shuffleMode, repeatMode, toggleShuffle, cycleRepeatMode, playNext, playPrevious, audioElement, addToQueue, addToQueueNext } = useAudioPlayer();
  const { playlists, addToPlaylist } = useMusicLibrary();
  const { showToast } = useToast();

  // Animation state
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowPlaylistMenu(false);
      }
    };
    if (showMenu || showPlaylistMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
    };
  }, [showMenu, showPlaylistMenu]);

  // Handle open/close animations with smoother timing
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to ensure the element is mounted before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding - matches CSS transition duration
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Format time helper
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get repeat icon
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const repeatActive = repeatMode !== "off";

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[var(--replay-black)] md:hidden flex flex-col will-change-transform`}
      style={{
        transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
        opacity: isAnimating ? 1 : 0,
        transition: isAnimating
          ? 'transform 0.45s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s ease-out'
          : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-in',
      }}
    >
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]/40 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
        <button onClick={onClose} className="text-[var(--replay-off-white)] p-1">
          <ChevronDown size={28} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs text-[var(--replay-mid-grey)]">Now Playing</p>
          <p className="text-sm text-[var(--replay-off-white)] font-semibold truncate px-2">
            {currentTrack?.album || "Unknown Album"}
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-[var(--replay-off-white)] p-1"
          >
            <MoreHorizontal size={24} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              {/* Play Next */}
              <button
                onClick={() => {
                  if (currentTrack) {
                    addToQueueNext(currentTrack);
                    showToast('Added to queue (next)', 'success');
                    setShowMenu(false);
                  }
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
              >
                <ListMusic size={18} className="text-[var(--replay-mid-grey)]" />
                <span>Play Next</span>
              </button>

              {/* Add to Queue */}
              <button
                onClick={() => {
                  if (currentTrack) {
                    addToQueue(currentTrack);
                    showToast('Added to queue', 'success');
                    setShowMenu(false);
                  }
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
              >
                <ListPlus size={18} className="text-[var(--replay-mid-grey)]" />
                <span>Add to Queue</span>
              </button>

              {/* Divider */}
              <div className="h-px bg-white/10 my-1" />

              {/* Add to Playlist */}
              <button
                onClick={() => {
                  setShowPlaylistMenu(!showPlaylistMenu);
                }}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ListPlus size={18} className="text-[var(--replay-mid-grey)]" />
                  <span>Add to Playlist</span>
                </div>
                <ChevronDown size={16} className={`text-[var(--replay-mid-grey)] transition-transform ${showPlaylistMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Playlist submenu */}
              {showPlaylistMenu && (
                <div className="bg-black/20 max-h-40 overflow-y-auto">
                  {playlists.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-[var(--replay-mid-grey)]">
                      No playlists yet
                    </div>
                  ) : (
                    playlists.map(playlist => (
                      <button
                        key={playlist.id}
                        onClick={() => {
                          if (currentTrack) {
                            addToPlaylist(playlist.id, currentTrack.id);
                            showToast(`Added to "${playlist.name}"`, 'success');
                            setShowMenu(false);
                            setShowPlaylistMenu(false);
                          }
                        }}
                        className="w-full px-6 py-2 flex items-center gap-2 text-left text-sm text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
                      >
                        <Disc size={14} className="text-[var(--replay-mid-grey)]" />
                        <span className="truncate">{playlist.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-white/10 my-1" />

              {/* Go to Artist */}
              <button
                onClick={() => {
                  showToast(`Artist: ${currentTrack?.artist || 'Unknown'}`, 'info');
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
              >
                <User size={18} className="text-[var(--replay-mid-grey)]" />
                <span>Go to Artist</span>
              </button>

              {/* Go to Album */}
              <button
                onClick={() => {
                  showToast(`Album: ${currentTrack?.album || 'Unknown'}`, 'info');
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
              >
                <Disc size={18} className="text-[var(--replay-mid-grey)]" />
                <span>Go to Album</span>
              </button>

              {/* Share */}
              <button
                onClick={async () => {
                  if (navigator.share && currentTrack) {
                    try {
                      await navigator.share({
                        title: currentTrack.title,
                        text: `Check out "${currentTrack.title}" by ${currentTrack.artist}`,
                      });
                    } catch (e) {
                      // User cancelled
                    }
                  } else {
                    showToast('Share not available', 'info');
                  }
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
              >
                <Share2 size={18} className="text-[var(--replay-mid-grey)]" />
                <span>Share</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area - Flex layout to fit viewport */}
      <div className="flex-1 flex flex-col px-5 py-4 min-h-0">
        {/* Album Art - Centered and properly sized for mobile */}
        <div className="flex-1 flex items-center justify-center min-h-0 mb-4">
          <div className="w-[85vw] max-w-[320px] aspect-square mx-auto">
            {currentTrack?.artworkUrl || currentTrack?.artworkData ? (
              <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={currentTrack.artworkUrl || currentTrack.artworkData}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <PremiumCoverArt isPlaying={isPlaying} size="full" variant={visualizerVariant} audioElement={audioElement} />
            )}
          </div>
        </div>

        {/* Song Info - Compact */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[var(--replay-off-white)] mb-0.5 truncate">
              {currentTrack?.title || "No Track"}
            </h2>
            <p className="text-sm text-[var(--replay-mid-grey)] truncate">
              {currentTrack?.artist || "Unknown Artist"}
            </p>
          </div>
          <button
            onClick={onLike}
            className={`ml-3 p-2.5 rounded-full transition-all duration-300 ease-out active:scale-90 ${
              liked
                ? "text-red-500 bg-red-500/10"
                : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/5"
            }`}
          >
            <Heart
              size={24}
              className={`transition-transform duration-300 ${liked ? "fill-current scale-110" : "scale-100"}`}
            />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-5 flex-shrink-0">
          <div className="relative py-2">
            <div
              className="absolute top-2 left-0 right-0 h-2 bg-white/10 rounded-full overflow-hidden pointer-events-none"
            >
              <div
                className="h-full bg-[var(--replay-off-white)]"
                style={{
                  width: `${progress}%`,
                  transition: 'width 100ms linear'
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => onProgressChange(Number(e.target.value))}
              className="relative w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer touch-pan-y z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--replay-off-white)]
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-black/40
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:active:scale-125
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[var(--replay-off-white)] [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[var(--replay-mid-grey)] tabular-nums font-medium">{formatTime(currentTime)}</span>
            <span className="text-xs text-[var(--replay-mid-grey)] tabular-nums font-medium">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls - Compact */}
        <div className="flex items-center justify-center gap-4 mb-4 flex-shrink-0">
          <button
            onClick={toggleShuffle}
            className={`p-3 rounded-full transition-all duration-300 ease-out active:scale-90 ${
              shuffleMode === "on"
                ? "text-[var(--replay-off-white)] bg-white/10"
                : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/5"
            }`}
          >
            <Shuffle size={22} className="transition-transform duration-200" />
          </button>
          <button
            onClick={playPrevious}
            className="text-[var(--replay-off-white)] p-3 rounded-full transition-all duration-300 ease-out active:scale-90 hover:bg-white/5"
          >
            <SkipBack size={28} fill="currentColor" className="transition-transform duration-200" />
          </button>
          <button
            onClick={onPlayPause}
            className="bg-white text-black rounded-full p-5 transition-all duration-300 ease-out active:scale-95 hover:scale-105 shadow-lg shadow-white/20 hover:shadow-white/30"
          >
            {isPlaying ? (
              <Pause size={28} fill="black" stroke="black" className="transition-transform duration-200" />
            ) : (
              <Play size={28} fill="black" stroke="black" className="ml-1 transition-transform duration-200" />
            )}
          </button>
          <button
            onClick={playNext}
            className="text-[var(--replay-off-white)] p-3 rounded-full transition-all duration-300 ease-out active:scale-90 hover:bg-white/5"
          >
            <SkipForward size={28} fill="currentColor" className="transition-transform duration-200" />
          </button>
          <button
            onClick={cycleRepeatMode}
            className={`p-3 rounded-full transition-all duration-300 ease-out active:scale-90 ${
              repeatActive
                ? "text-[var(--replay-off-white)] bg-white/10"
                : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/5"
            }`}
          >
            <RepeatIcon size={22} className="transition-transform duration-200" />
          </button>
        </div>

        {/* Volume Control - Smooth */}
        <div className="flex items-center gap-4 bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex-shrink-0 transition-all duration-300">
          <Volume2 size={20} className="text-[var(--replay-mid-grey)] transition-colors duration-300" />
          <div className="flex-1 relative py-2">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer touch-pan-y
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--replay-off-white)]
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-black/30
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:active:scale-110
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[var(--replay-off-white)] [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--replay-off-white) 0%, var(--replay-off-white) ${volume}%, rgba(255, 255, 255, 0.1) ${volume}%, rgba(255, 255, 255, 0.1) 100%)`,
              }}
            />
          </div>
          <span className="text-sm text-[var(--replay-off-white)] w-8 text-right tabular-nums font-medium">{volume}</span>
        </div>
      </div>
    </div>
  );
};