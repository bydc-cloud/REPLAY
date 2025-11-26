import { Play, GripVertical, X } from "lucide-react";

interface QueueItemProps {
  title: string;
  artist: string;
  album: string;
  duration: string;
  imageUrl: string;
  isPlaying?: boolean;
  index: number;
}

const QueueItem = ({ title, artist, album, duration, imageUrl, isPlaying, index }: QueueItemProps) => {
  return (
    <div
      className={`group flex items-center gap-4 p-3 rounded-lg transition-colors ${
        isPlaying
          ? "bg-[var(--replay-elevated)]"
          : "hover:bg-[var(--replay-elevated)]"
      }`}
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
        <img
          src={imageUrl}
          alt={album}
          className="w-full h-full object-cover"
        />
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
          {title}
        </h4>
        <p className="text-sm text-[var(--replay-mid-grey)] truncate">
          {artist} • {album}
        </p>
      </div>

      {/* Duration */}
      <div className="text-sm text-[var(--replay-mid-grey)] tabular-nums">
        {duration}
      </div>

      {/* Remove Button */}
      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]">
        <X size={18} />
      </button>
    </div>
  );
};

export const QueueView = () => {
  const queue = [
    {
      title: "Electric Dreams",
      artist: "Neon Lights",
      album: "Neon Nights",
      duration: "3:45",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
      isPlaying: true,
    },
    {
      title: "Midnight Drive",
      artist: "Synthwave Collective",
      album: "Neon Nights",
      duration: "4:12",
      imageUrl: "https://images.unsplash.com/photo-1703115015343-81b498a8c080?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
    {
      title: "Synth Paradise",
      artist: "Electric Dreams",
      album: "Retrograde",
      duration: "3:58",
      imageUrl: "https://images.unsplash.com/photo-1574494462457-45f409ae5039?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
    {
      title: "Analog Love",
      artist: "Vinyl Hearts",
      album: "Analog Stories",
      duration: "5:23",
      imageUrl: "https://images.unsplash.com/photo-1681148773017-42eaa4522384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
    {
      title: "Electric Feel",
      artist: "Pop Sensation",
      album: "Stadium Lights",
      duration: "3:34",
      imageUrl: "https://images.unsplash.com/photo-1510809393-728d340e4eb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
    {
      title: "Blue Horizon",
      artist: "Jazz Ensemble",
      album: "Blue Note Session",
      duration: "6:15",
      imageUrl: "https://images.unsplash.com/photo-1710951403141-353d4e5c7cbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
    {
      title: "Power Chord",
      artist: "Rock Brigade",
      album: "Amplified",
      duration: "4:02",
      imageUrl: "https://images.unsplash.com/photo-1740459057005-65f000db582f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
    {
      title: "Neon Dreams",
      artist: "Synthwave Collective",
      album: "Digital Dreams",
      duration: "3:51",
      imageUrl: "https://images.unsplash.com/photo-1619983081563-430f63602796?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
    },
  ];

  const totalDuration = queue.reduce((acc, song) => {
    const [mins, secs] = song.duration.split(":").map(Number);
    return acc + mins * 60 + secs;
  }, 0);

  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

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

      <div className="max-w-4xl">
        {/* Now Playing */}
        <div className="mb-6">
          <h2 className="text-sm uppercase tracking-wider text-[var(--replay-mid-grey)] mb-3 px-3">
            Now Playing
          </h2>
          <QueueItem {...queue[0]} index={1} />
        </div>

        {/* Up Next */}
        <div>
          <h2 className="text-sm uppercase tracking-wider text-[var(--replay-mid-grey)] mb-3 px-3">
            Up Next
          </h2>
          <div className="space-y-1">
            {queue.slice(1).map((song, index) => (
              <QueueItem key={index} {...song} index={index + 2} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
