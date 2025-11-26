import { X, GripVertical, Play } from "lucide-react";
import { useState } from "react";
import { CoverArtPlaceholder } from "./CoverArtPlaceholder";

interface QueueSong {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  duration: string;
}

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueDrawer = ({ isOpen, onClose }: QueueDrawerProps) => {
  const [songs, setSongs] = useState<QueueSong[]>([
    {
      id: "1",
      title: "Electric Dreams",
      artist: "Neon Lights",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
      duration: "3:45",
    },
    {
      id: "2",
      title: "Midnight Drive",
      artist: "Synthwave",
      imageUrl: "https://images.unsplash.com/photo-1703115015343-81b498a8c080?w=200&h=200&fit=crop",
      duration: "4:12",
    },
    {
      id: "3",
      title: "Synth Paradise",
      artist: "Electric Dreams",
      imageUrl: "https://images.unsplash.com/photo-1574494462457-45f409ae5039?w=200&h=200&fit=crop",
      duration: "3:58",
    },
    {
      id: "4",
      title: "Neon Nights",
      artist: "Retro Vibes",
      imageUrl: "https://images.unsplash.com/photo-1681148773017-42eaa4522384?w=200&h=200&fit=crop",
      duration: "3:30",
    },
    {
      id: "5",
      title: "Digital Rain",
      artist: "Cyber Sound",
      imageUrl: "https://images.unsplash.com/photo-1510809393-728d340e4eb1?w=200&h=200&fit=crop",
      duration: "4:05",
    },
  ]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSongs = [...songs];
    const draggedSong = newSongs[draggedIndex];
    newSongs.splice(draggedIndex, 1);
    newSongs.splice(index, 0, draggedSong);
    
    setSongs(newSongs);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-[#1a1a1a]/95 backdrop-blur-2xl border-l border-white/10 z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">Queue</h2>
            <p className="text-sm text-[var(--replay-mid-grey)] mt-0.5">{songs.length} songs</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Now Playing */}
        <div className="px-6 py-4 bg-[var(--replay-off-white)]/5 border-b border-white/5">
          <p className="text-xs uppercase tracking-wider text-[var(--replay-mid-grey)] mb-3">
            Now Playing
          </p>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative">
              <img
                src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop"
                alt="Now playing"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play size={20} className="text-[var(--replay-off-white)] fill-current" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[var(--replay-off-white)] truncate">
                Electric Dreams
              </h4>
              <p className="text-sm text-[var(--replay-mid-grey)] truncate">Neon Lights</p>
            </div>
            <span className="text-sm text-[var(--replay-mid-grey)] tabular-nums">6:23</span>
          </div>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-[var(--replay-mid-grey)] mb-3">
            Up Next
          </p>
          <div className="space-y-1">
            {songs.map((song, index) => (
              <div
                key={song.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing ${
                  draggedIndex === index ? "opacity-50" : "opacity-100"
                }`}
              >
                {/* Drag Handle */}
                <div className="text-[var(--replay-mid-grey)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={16} />
                </div>

                {/* Album Art */}
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 border border-white/5">
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[var(--replay-off-white)] truncate text-sm">
                    {song.title}
                  </h4>
                  <p className="text-xs text-[var(--replay-mid-grey)] truncate">{song.artist}</p>
                </div>

                {/* Duration */}
                <span className="text-sm text-[var(--replay-mid-grey)] tabular-nums">
                  {song.duration}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#1a1a1a]/40">
          <p className="text-xs text-[var(--replay-mid-grey)] text-center">
            Drag to reorder • Tap to play next
          </p>
        </div>
      </div>
    </>
  );
};