import { ChevronDown, Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Volume2, MoreHorizontal } from "lucide-react";
import { PremiumCoverArt } from "./PremiumCoverArt";
import { useSettings } from "../contexts/SettingsContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

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
  const { currentTrack, currentTime, duration, shuffleMode, repeatMode, toggleShuffle, cycleRepeatMode, playNext, playPrevious } = useAudioPlayer();

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--replay-black)] md:hidden flex flex-col">
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
        <button className="text-[var(--replay-off-white)] p-1">
          <MoreHorizontal size={24} />
        </button>
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
              <PremiumCoverArt isPlaying={isPlaying} size="full" variant={visualizerVariant} />
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
            className={`ml-3 p-2 transition-colors ${
              liked
                ? "text-[var(--replay-off-white)]"
                : "text-[var(--replay-mid-grey)]"
            }`}
          >
            <Heart size={24} className={liked ? "fill-current" : ""} />
          </button>
        </div>

        {/* Progress Bar - Compact */}
        <div className="mb-4 flex-shrink-0">
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => onProgressChange(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--replay-off-white)]
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-black/50
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[var(--replay-off-white)] [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--replay-off-white) 0%, var(--replay-off-white) ${progress}%, rgba(255, 255, 255, 0.1) ${progress}%, rgba(255, 255, 255, 0.1) 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[var(--replay-mid-grey)] tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-xs text-[var(--replay-mid-grey)] tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls - Compact */}
        <div className="flex items-center justify-center gap-3 mb-4 flex-shrink-0">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors ${
              shuffleMode === "on"
                ? "text-[var(--replay-off-white)]"
                : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
            }`}
          >
            <Shuffle size={22} />
          </button>
          <button
            onClick={playPrevious}
            className="text-[var(--replay-off-white)] hover:opacity-70 transition-opacity p-2"
          >
            <SkipBack size={28} fill="currentColor" />
          </button>
          <button
            onClick={onPlayPause}
            className="bg-[var(--replay-off-white)]/90 hover:bg-[var(--replay-off-white)] hover:scale-105 text-[var(--replay-black)] rounded-full p-5 transition-all duration-300 shadow-lg shadow-white/20"
          >
            {isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </button>
          <button
            onClick={playNext}
            className="text-[var(--replay-off-white)] hover:opacity-70 transition-opacity p-2"
          >
            <SkipForward size={28} fill="currentColor" />
          </button>
          <button
            onClick={cycleRepeatMode}
            className={`p-2 transition-colors ${
              repeatActive
                ? "text-[var(--replay-off-white)]"
                : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
            }`}
          >
            <RepeatIcon size={22} />
          </button>
        </div>

        {/* Volume Control - Compact */}
        <div className="flex items-center gap-3 bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex-shrink-0">
          <Volume2 size={18} className="text-[var(--replay-mid-grey)]" />
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--replay-off-white)]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[var(--replay-off-white)] [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--replay-off-white) 0%, var(--replay-off-white) ${volume}%, rgba(255, 255, 255, 0.1) ${volume}%, rgba(255, 255, 255, 0.1) 100%)`,
              }}
            />
          </div>
          <span className="text-xs text-[var(--replay-mid-grey)] w-7 text-right tabular-nums">{volume}</span>
        </div>
      </div>
    </div>
  );
};