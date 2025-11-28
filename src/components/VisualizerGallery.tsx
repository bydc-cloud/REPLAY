import { useState } from "react";
import { Play, Pause, Sparkles } from "lucide-react";
import { PerformantVisualizer } from "./PerformantVisualizer";

export const VisualizerGallery = () => {
  const [isPlaying, setIsPlaying] = useState(true);

  const visualizers = [
    {
      variant: "bars" as const,
      name: "Bars",
      description: "Classic frequency bars",
      features: "60fps • GPU accelerated"
    },
    {
      variant: "wave" as const,
      name: "Wave",
      description: "Flowing wave animation",
      features: "Smooth motion • Reactive"
    },
    {
      variant: "pulse" as const,
      name: "Pulse",
      description: "Pulsing ring visualizer",
      features: "Bass reactive • Concentric"
    },
    {
      variant: "circle" as const,
      name: "Circle",
      description: "Radial frequency display",
      features: "360° spectrum • Dynamic"
    },
    {
      variant: "dots" as const,
      name: "Dots",
      description: "Grid of reactive dots",
      features: "Minimal • Clean"
    },
    {
      variant: "lines" as const,
      name: "Lines",
      description: "Horizontal frequency lines",
      features: "Layered • Gradient"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a]/60 via-[#0f0f0f]/60 to-[#1a1a1a]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-8 mb-12 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Sparkles className="text-[var(--replay-off-white)] flex-shrink-0" size={24} />
            <h2 className="text-xl md:text-3xl font-black text-[var(--replay-off-white)]">
              Audio-Reactive Visualizers
            </h2>
          </div>
          <p className="text-[var(--replay-mid-grey)] text-sm md:text-lg">
            Colorful animations that respond to music in real-time
          </p>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="group bg-gradient-to-br from-[var(--replay-off-white)]/20 to-[var(--replay-off-white)]/10 hover:from-[var(--replay-off-white)]/30 hover:to-[var(--replay-off-white)]/20 text-[var(--replay-off-white)] rounded-full p-3 md:p-5 transition-all hover:scale-110 shadow-lg border border-white/20 flex-shrink-0"
        >
          {isPlaying ? (
            <Pause size={20} className="md:w-7 md:h-7" fill="currentColor" />
          ) : (
            <Play size={20} className="md:w-7 md:h-7 ml-0.5" fill="currentColor" />
          )}
        </button>
      </div>

      {/* Visualizer Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {visualizers.map((viz) => (
          <div
            key={viz.variant}
            className="group flex flex-col bg-[#0a0a0a]/40 rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/5 hover:border-white/20 transition-all"
          >
            {/* Visualizer Display */}
            <div className="mb-3 md:mb-5 flex items-center justify-center h-24 md:h-32 relative">
              <div className="w-full h-full">
                <PerformantVisualizer
                  isPlaying={isPlaying}
                  size="full"
                  variant={viz.variant}
                />
              </div>
            </div>

            {/* Info */}
            <div className="text-center">
              <h3 className="text-sm md:text-xl font-black text-[var(--replay-off-white)] mb-1 md:mb-2">
                {viz.name}
              </h3>
              <p className="hidden md:block text-sm text-[var(--replay-off-white)]/70 mb-3">
                {viz.description}
              </p>
              <div className="hidden md:flex items-center justify-center gap-2 text-xs text-[var(--replay-off-white)]/60 bg-[var(--replay-dark-grey)]/60 rounded-full px-4 py-2 border border-[var(--replay-border)]">
                {viz.features}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};