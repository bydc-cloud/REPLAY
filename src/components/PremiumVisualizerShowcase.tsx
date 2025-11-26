import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { PremiumCoverArt } from "./PremiumCoverArt";

export const PremiumVisualizerShowcase = () => {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-[var(--replay-off-white)] mb-2">
            Premium Visualizers
          </h2>
          <p className="text-[var(--replay-mid-grey)]">
            Beautiful animations for songs without cover art—perfectly centered and visually stunning
          </p>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-[var(--replay-off-white)]/10 hover:bg-[var(--replay-off-white)]/20 text-[var(--replay-off-white)] rounded-full p-4 transition-all hover:scale-105 shadow-lg"
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Orb Visualizer */}
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center">
            <PremiumCoverArt 
              isPlaying={isPlaying} 
              size="lg" 
              variant="orb"
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--replay-off-white)] mb-1">
              Orb
            </p>
            <p className="text-xs text-[var(--replay-mid-grey)]">
              3D sphere with rotating spectrum
            </p>
          </div>
        </div>

        {/* Spectrum Visualizer */}
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center">
            <PremiumCoverArt 
              isPlaying={isPlaying} 
              size="lg" 
              variant="spectrum"
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--replay-off-white)] mb-1">
              Spectrum
            </p>
            <p className="text-xs text-[var(--replay-mid-grey)]">
              Full frequency spectrum analyzer
            </p>
          </div>
        </div>

        {/* Particles Visualizer */}
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center">
            <PremiumCoverArt
              isPlaying={isPlaying}
              size="lg"
              variant="particles"
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--replay-off-white)] mb-1">
              Particles
            </p>
            <p className="text-xs text-[var(--replay-mid-grey)]">
              Floating particle system
            </p>
          </div>
        </div>

        {/* Galaxy Visualizer */}
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center">
            <PremiumCoverArt
              isPlaying={isPlaying}
              size="lg"
              variant="galaxy"
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--replay-off-white)] mb-1">
              Galaxy
            </p>
            <p className="text-xs text-[var(--replay-mid-grey)]">
              Cosmic spiral effect
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <div className="text-2xl font-black text-[var(--replay-off-white)] mb-1">4</div>
          <div className="text-xs text-[var(--replay-mid-grey)]">Unique Variants</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <div className="text-2xl font-black text-[var(--replay-off-white)] mb-1">60+</div>
          <div className="text-xs text-[var(--replay-mid-grey)]">FPS Animations</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <div className="text-2xl font-black text-[var(--replay-off-white)] mb-1">100%</div>
          <div className="text-xs text-[var(--replay-mid-grey)]">Centered & Balanced</div>
        </div>
      </div>
    </div>
  );
};
