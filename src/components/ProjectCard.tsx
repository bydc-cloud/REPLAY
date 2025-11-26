import { Play, Shuffle, MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface ProjectCardProps {
  name: string;
  songCount: number;
  imageUrl: string;
}

export const ProjectCard = ({ name, songCount, imageUrl }: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group cursor-pointer relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container with Glassmorphism */}
      <div className="relative mb-4 aspect-square rounded-xl overflow-hidden bg-[var(--replay-elevated)]/50 backdrop-blur-sm border border-white/5 shadow-lg transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-black/50 group-hover:-translate-y-1">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Hover Actions */}
        <div
          className={`absolute inset-0 flex items-center justify-center gap-3 transition-all duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Play Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("Play project:", name);
            }}
            className="bg-[var(--replay-off-white)]/95 hover:bg-[var(--replay-off-white)] hover:scale-110 text-[var(--replay-black)] rounded-full p-4 transition-all duration-300 shadow-lg shadow-black/50"
          >
            <Play size={24} fill="currentColor" className="ml-0.5" />
          </button>

          {/* Shuffle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("Shuffle project:", name);
            }}
            className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-[var(--replay-off-white)] rounded-full p-3 transition-all duration-300 border border-white/20 hover:border-white/40"
          >
            <Shuffle size={20} />
          </button>
        </div>

        {/* More Options - Top Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log("More options:", name);
          }}
          className={`absolute top-3 right-3 bg-black/60 backdrop-blur-md hover:bg-black/80 text-[var(--replay-off-white)] rounded-full p-2 transition-all duration-300 border border-white/10 hover:border-white/30 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          <MoreHorizontal size={18} />
        </button>

        {/* Song Count Badge - Bottom Left */}
        <div
          className={`absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-[var(--replay-off-white)] text-xs px-3 py-1.5 rounded-full border border-white/10 transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {songCount} songs
        </div>
      </div>

      {/* Project Info */}
      <div className="px-1">
        <h3 className="font-semibold text-[var(--replay-off-white)] truncate group-hover:text-[var(--replay-off-white)] transition-colors">
          {name}
        </h3>
        <p className="text-sm text-[var(--replay-mid-grey)] mt-0.5">Project</p>
      </div>
    </div>
  );
};
