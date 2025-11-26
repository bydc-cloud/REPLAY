import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { EnhancedVisualizer } from "./EnhancedVisualizer";
import { CoverArtPlaceholder } from "./CoverArtPlaceholder";

export const VisualizerShowcase = () => {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-[var(--replay-off-white)] mb-1">
            Enhanced Visualizers
          </h2>
          <p className="text-sm text-[var(--replay-mid-grey)]">
            Beautiful animations for songs without cover art
          </p>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-[var(--replay-off-white)]/10 hover:bg-[var(--replay-off-white)]/20 text-[var(--replay-off-white)] rounded-full p-3 transition-all"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Circular Visualizer */}
        <div>
          <div className="mb-3">
            <CoverArtPlaceholder 
              isPlaying={isPlaying} 
              size="lg" 
              variant="circular"
            />
          </div>
          <p className="text-sm text-[var(--replay-off-white)] text-center font-semibold">
            Circular
          </p>
          <p className="text-xs text-[var(--replay-mid-grey)] text-center">
            Radial animation
          </p>
        </div>

        {/* Bars Visualizer */}
        <div>
          <div className="mb-3">
            <CoverArtPlaceholder 
              isPlaying={isPlaying} 
              size="lg" 
              variant="bars"
            />
          </div>
          <p className="text-sm text-[var(--replay-off-white)] text-center font-semibold">
            Bars
          </p>
          <p className="text-xs text-[var(--replay-mid-grey)] text-center">
            Classic vertical bars
          </p>
        </div>

        {/* Waveform Visualizer */}
        <div>
          <div className="mb-3">
            <CoverArtPlaceholder 
              isPlaying={isPlaying} 
              size="lg" 
              variant="waveform"
            />
          </div>
          <p className="text-sm text-[var(--replay-off-white)] text-center font-semibold">
            Waveform
          </p>
          <p className="text-xs text-[var(--replay-mid-grey)] text-center">
            Wave-like motion
          </p>
        </div>
      </div>
    </div>
  );
};
