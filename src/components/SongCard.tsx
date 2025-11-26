import { Play, Music } from "lucide-react";

interface SongCardProps {
  title: string;
  artist: string;
  imageUrl?: string;
  onClick?: () => void;
}

export const SongCard = ({ title, artist, imageUrl, onClick }: SongCardProps) => {
  return (
    <button className="group bg-[var(--replay-elevated)] rounded p-3 flex items-center gap-4 hover-lift border border-[var(--replay-border)] hover:border-[var(--replay-off-white)] transition-all w-full" onClick={onClick}>
      <div className="relative w-16 h-16 bg-[var(--replay-dark-grey)] rounded overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--replay-elevated)] to-[var(--replay-dark-grey)]">
            <Music className="w-8 h-8 text-[var(--replay-mid-grey)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-[var(--replay-off-white)] rounded-full p-2">
            <Play size={20} className="text-[var(--replay-black)] fill-current" />
          </div>
        </div>
      </div>
      <div className="text-left flex-1 min-w-0">
        <h4 className="font-semibold text-[var(--replay-off-white)] truncate">
          {title}
        </h4>
        <p className="text-sm text-[var(--replay-mid-grey)] truncate">{artist}</p>
      </div>
    </button>
  );
};