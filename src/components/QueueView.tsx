import { Play, GripVertical, X, Music } from "lucide-react";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { Track } from "../contexts/MusicLibraryContext";

interface QueueItemProps {
  track: Track;
  isPlaying?: boolean;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
}

const QueueItem = ({ track, isPlaying, index, onPlay, onRemove }: QueueItemProps) => {
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds || isNaN(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`group flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer ${
        isPlaying
          ? "bg-[var(--replay-elevated)]"
          : "hover:bg-[var(--replay-elevated)]"
      }`}
      onClick={onPlay}
    >
      {/* Drag Handle & Index */}
      <div className="flex items-center gap-2 w-12">
        <GripVertical
          size={16}
          className="text-[var(--replay-mid-grey)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
        />
        {!isPlaying && (
          <span className="text-sm text-[var(--replay-mid-grey)] group-hover:hidden tabular-nums">
            {index}
          </span>
        )}
        {isPlaying && (
          <div className="flex gap-0.5">
            <div className="w-1 h-3 bg-[var(--replay-off-white)] animate-pulse" />
            <div className="w-1 h-3 bg-[var(--replay-off-white)] animate-pulse delay-100" />
            <div className="w-1 h-3 bg-[var(--replay-off-white)] animate-pulse delay-200" />
          </div>
        )}
      </div>

      {/* Album Art */}
      <div className="relative w-12 h-12 bg-[var(--replay-elevated)] rounded overflow-hidden flex-shrink-0">
        {track.artworkUrl || track.artworkData ? (
          <img
            src={track.artworkUrl || track.artworkData}
            alt={track.album || track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={20} className="text-[var(--replay-mid-grey)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={20} className="text-[var(--replay-off-white)]" fill="currentColor" />
        </div>
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <h4
          className={`font-semibold truncate ${
            isPlaying
              ? "text-[var(--replay-off-white)]"
              : "text-[var(--replay-off-white)] group-hover:text-[var(--replay-off-white)]"
          }`}
        >
          {track.title}
        </h4>
        <p className="text-sm text-[var(--replay-mid-grey)] truncate">
          {track.artist} {track.album ? `• ${track.album}` : ""}
        </p>
      </div>

      {/* Duration */}
      <div className="text-sm text-[var(--replay-mid-grey)] tabular-nums">
        {formatDuration(track.duration)}
      </div>

      {/* Remove Button */}
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
};

export const QueueView = () => {
  const { queue, currentTrack, play, removeFromQueue } = useAudioPlayer();

  const totalDuration = queue.reduce((acc, track) => {
    return acc + (track.duration || 0);
  }, 0);

  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  // Find current track index in queue
  const currentIndex = currentTrack
    ? queue.findIndex(t => t.id === currentTrack.id)
    : -1;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-[var(--replay-off-white)] mb-2">
          Queue
        </h1>
        <p className="text-[var(--replay-mid-grey)]">
          {queue.length} songs • {hours > 0 ? `${hours} hr ` : ""}
          {minutes} min
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--replay-elevated)] flex items-center justify-center mb-4">
            <Music size={32} className="text-[var(--replay-mid-grey)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--replay-off-white)] mb-2">
            Queue is empty
          </h2>
          <p className="text-[var(--replay-mid-grey)] max-w-xs">
            Play some music to see your queue here
          </p>
        </div>
      ) : (
        <div className="max-w-4xl">
          {/* Now Playing */}
          {currentTrack && currentIndex >= 0 && (
            <div className="mb-6">
              <h2 className="text-sm uppercase tracking-wider text-[var(--replay-mid-grey)] mb-3 px-3">
                Now Playing
              </h2>
              <QueueItem
                track={currentTrack}
                isPlaying={true}
                index={1}
                onPlay={() => {}}
                onRemove={() => removeFromQueue(currentIndex)}
              />
            </div>
          )}

          {/* Up Next */}
          {queue.filter(t => t.id !== currentTrack?.id).length > 0 && (
            <div>
              <h2 className="text-sm uppercase tracking-wider text-[var(--replay-mid-grey)] mb-3 px-3">
                Up Next
              </h2>
              <div className="space-y-1">
                {queue
                  .map((track, index) => ({ track, originalIndex: index }))
                  .filter(({ track }) => track.id !== currentTrack?.id)
                  .map(({ track, originalIndex }, displayIndex) => (
                    <QueueItem
                      key={track.id}
                      track={track}
                      index={displayIndex + 2}
                      onPlay={() => play(track)}
                      onRemove={() => removeFromQueue(originalIndex)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
