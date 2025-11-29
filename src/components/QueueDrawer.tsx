import { X, GripVertical, Play, Music } from "lucide-react";
import { useState } from "react";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer = ({ isOpen, onClose }: QueueDrawerProps) => {
  const { queue, currentTrack, removeFromQueue, play } = useAudioPlayer();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Format time helper
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds || isNaN(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
    // Queue reordering would need to be implemented in AudioPlayerContext
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handlePlayTrack = (index: number) => {
    if (queue[index]) {
      play(queue[index]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-[#1a1a1a]/95 backdrop-blur-2xl border-l border-white/10 z-[260] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">Queue</h2>
            <p className="text-sm text-[var(--replay-mid-grey)] mt-0.5">{queue.length} songs</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Now Playing */}
        {currentTrack && (
          <div className="px-6 py-4 bg-[var(--replay-off-white)]/5 border-b border-white/5">
            <p className="text-xs uppercase tracking-wider text-[var(--replay-mid-grey)] mb-3">
              Now Playing
            </p>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative">
                {currentTrack.artworkUrl || currentTrack.artworkData ? (
                  <img
                    src={currentTrack.artworkUrl || currentTrack.artworkData}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--replay-elevated)] flex items-center justify-center">
                    <Music size={20} className="text-[var(--replay-mid-grey)]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play size={20} className="text-[var(--replay-off-white)] fill-current" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[var(--replay-off-white)] truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-sm text-[var(--replay-mid-grey)] truncate">{currentTrack.artist}</p>
              </div>
              <span className="text-sm text-[var(--replay-mid-grey)] tabular-nums">
                {formatDuration(currentTrack.duration)}
              </span>
            </div>
          </div>
        )}

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {queue.length > 0 ? (
            <>
              <p className="text-xs uppercase tracking-wider text-[var(--replay-mid-grey)] mb-3">
                Up Next
              </p>
              <div className="space-y-1">
                {queue.map((track, index) => (
                  <div
                    key={track.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handlePlayTrack(index)}
                    className={`group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer ${
                      draggedIndex === index ? "opacity-50" : "opacity-100"
                    } ${currentTrack?.id === track.id ? "bg-white/10" : ""}`}
                  >
                    {/* Drag Handle */}
                    <div className="text-[var(--replay-mid-grey)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                      <GripVertical size={16} />
                    </div>

                    {/* Album Art */}
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 border border-white/5">
                      {track.artworkUrl || track.artworkData ? (
                        <img
                          src={track.artworkUrl || track.artworkData}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--replay-elevated)] flex items-center justify-center">
                          <Music size={16} className="text-[var(--replay-mid-grey)]" />
                        </div>
                      )}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[var(--replay-off-white)] truncate text-sm">
                        {track.title}
                      </h4>
                      <p className="text-xs text-[var(--replay-mid-grey)] truncate">{track.artist}</p>
                    </div>

                    {/* Duration */}
                    <span className="text-sm text-[var(--replay-mid-grey)] tabular-nums">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[var(--replay-elevated)] flex items-center justify-center mb-4">
                <Music size={24} className="text-[var(--replay-mid-grey)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--replay-off-white)] mb-2">
                Queue is empty
              </h3>
              <p className="text-sm text-[var(--replay-mid-grey)] max-w-[200px]">
                Play some music to see your queue here
              </p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        {queue.length > 0 && (
          <div className="px-6 py-4 border-t border-white/10 bg-[#1a1a1a]/40">
            <p className="text-xs text-[var(--replay-mid-grey)] text-center">
              Tap to play • Drag to reorder
            </p>
          </div>
        )}
      </div>
    </>
  );
};
