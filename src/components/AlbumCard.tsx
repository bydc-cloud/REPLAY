import { Music } from "lucide-react";

interface AlbumCardProps {
  title: string;
  artist: string;
  imageUrl?: string;
  onClick?: () => void;
}

export const AlbumCard = ({ title, artist, imageUrl, onClick }: AlbumCardProps) => {
  return (
    <button className="group text-left" onClick={onClick}>
      <div className="aspect-square bg-[var(--replay-elevated)] rounded overflow-hidden mb-3 hover-lift border border-[var(--replay-border)] hover:border-[var(--replay-off-white)] transition-all">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--replay-elevated)] to-[var(--replay-dark-grey)]">
            <Music className="w-12 h-12 text-[var(--replay-mid-grey)]" />
          </div>
        )}
      </div>
      <h4 className="font-semibold text-[var(--replay-off-white)] mb-1 truncate">
        {title}
      </h4>
      <p className="text-sm text-[var(--replay-mid-grey)] truncate">{artist}</p>
    </button>
  );
};