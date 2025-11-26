import { ChevronDown, Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Volume2, MoreHorizontal } from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { CoverArtPlaceholder } from "./CoverArtPlaceholder";
import { EnhancedVisualizer } from "./EnhancedVisualizer";
import { PremiumCoverArt } from "./PremiumCoverArt";
import { useSettings } from "../contexts/SettingsContext";

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
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--replay-black)] md:hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-6 bg-[#1a1a1a]/40 backdrop-blur-xl border-b border-white/10">
        <button onClick={onClose} className="text-[var(--replay-off-white)]">
          <ChevronDown size={28} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs text-[var(--replay-mid-grey)]">Playing from Project</p>
          <p className="text-sm text-[var(--replay-off-white)] font-semibold">Synthwave Collection</p>
        </div>
        <button className="text-[var(--replay-off-white)]">
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-8 pb-6">
          {/* Large Album Art with Premium Visualizer */}
          <div className="w-full max-w-md mx-auto mb-8">
            <PremiumCoverArt isPlaying={isPlaying} size="xl" variant={visualizerVariant} />
          </div>

          {/* Song Info */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold text-[var(--replay-off-white)] mb-1 truncate">
                Electric Dreams
              </h2>
              <p className="text-[var(--replay-mid-grey)] truncate">Neon Lights</p>
            </div>
            <button
              onClick={onLike}
              className={`ml-4 transition-colors ${
                liked
                  ? "text-[var(--replay-off-white)]"
                  : "text-[var(--replay-mid-grey)]"
              }`}
            >
              <Heart size={28} className={liked ? "fill-current" : ""} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="relative group">
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
            <div className="flex justify-between mt-2">
              <span className="text-xs text-[var(--replay-mid-grey)] tabular-nums">2:14</span>
              <span className="text-xs text-[var(--replay-mid-grey)] tabular-nums">6:23</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 my-8">
            <button className="text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors">
              <Shuffle size={24} />
            </button>
            <button className="text-[var(--replay-off-white)] hover:opacity-70 transition-opacity">
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button
              onClick={onPlayPause}
              className="bg-[var(--replay-off-white)]/90 hover:bg-[var(--replay-off-white)] hover:scale-105 text-[var(--replay-black)] rounded-full p-6 transition-all duration-300 shadow-lg shadow-white/20"
            >
              {isPlaying ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button className="text-[var(--replay-off-white)] hover:opacity-70 transition-opacity">
              <SkipForward size={32} fill="currentColor" />
            </button>
            <button className="text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors">
              <Repeat size={24} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4 bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <Volume2 size={20} className="text-[var(--replay-mid-grey)]" />
            <div className="flex-1 relative group">
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
            <span className="text-xs text-[var(--replay-mid-grey)] w-8 text-right tabular-nums">{volume}</span>
          </div>
        </div>
      </div>
    </div>
  );
};