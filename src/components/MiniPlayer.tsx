import { useState, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Maximize2, X } from "lucide-react";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useSettings } from "../contexts/SettingsContext";
import { PremiumCoverArt } from "./PremiumCoverArt";

interface MiniPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
}

export const MiniPlayer = ({ isOpen, onClose, onExpand }: MiniPlayerProps) => {
  const { visualizerVariant } = useSettings();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
  } = useAudioPlayer();

  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = Math.max(0, Math.min(window.innerWidth - 280, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen || !currentTrack) return null;

  return (
    <div
      className="fixed z-[100] transition-shadow duration-300 select-none"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative bg-[#0a0a0a]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden w-[280px]">
        {/* Progress bar at top - smooth transition */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-[width] duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-3 pt-4 flex items-center gap-3">
          {/* Album Art */}
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--replay-elevated)]">
            {currentTrack.artworkUrl || currentTrack.artworkData ? (
              <img
                src={currentTrack.artworkUrl || currentTrack.artworkData}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <PremiumCoverArt
                isPlaying={isPlaying}
                size="sm"
                variant={visualizerVariant === "lyrics" ? "bars" : visualizerVariant}
              />
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[var(--replay-off-white)] truncate">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-[var(--replay-mid-grey)] truncate">
              {currentTrack.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                playPrevious();
              }}
              className="p-1.5 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors rounded-full hover:bg-white/10"
            >
              <SkipBack size={16} fill="currentColor" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="p-2 bg-white/10 text-[var(--replay-off-white)] rounded-full hover:bg-white/20 transition-all"
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                playNext();
              }}
              className="p-1.5 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors rounded-full hover:bg-white/10"
            >
              <SkipForward size={16} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors rounded hover:bg-white/10"
            title="Expand player"
          >
            <Maximize2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors rounded hover:bg-white/10"
            title="Close mini player"
          >
            <X size={12} />
          </button>
        </div>

        {/* Drag hint */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
};
