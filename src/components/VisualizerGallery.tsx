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
    <div className="bg-gradient-to-br from-[#1a1a1a]/60 via-[#0f0f0f]/60 to-[#1a1a1a]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-12 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-[var(--replay-off-white)]" size={32} />
            <h2 className="text-3xl font-black text-[var(--replay-off-white)]">
              Audio-Reactive Visualizers
            </h2>
          </div>
          <p className="text-[var(--replay-mid-grey)] text-lg">
            Colorful, interactive animations that respond to music in real-time
          </p>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="group bg-gradient-to-br from-[var(--replay-off-white)]/20 to-[var(--replay-off-white)]/10 hover:from-[var(--replay-off-white)]/30 hover:to-[var(--replay-off-white)]/20 text-[var(--replay-off-white)] rounded-full p-5 transition-all hover:scale-110 shadow-lg border border-white/20"
        >
          {isPlaying ? (
            <Pause size={28} fill="currentColor" />
          ) : (
            <Play size={28} fill="currentColor" className="ml-1" />
          )}
        </button>
      </div>

      {/* Visualizer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {visualizers.map((viz) => (
          <div 
            key={viz.variant}
            className="group flex flex-col bg-[#0a0a0a]/40 rounded-2xl p-6 border border-white/5 hover:border-white/20 transition-all hover:scale-105 hover:shadow-2xl"
          >
            {/* Visualizer Display */}
            <div className="mb-5 flex items-center justify-center transform group-hover:scale-105 transition-transform h-32">
              <PerformantVisualizer
                isPlaying={isPlaying}
                size="md"
                variant={viz.variant}
              />
            </div>

            {/* Info */}
            <div className="text-center">
              <h3 className="text-xl font-black text-[var(--replay-off-white)] mb-2">
                {viz.name}
              </h3>
              <p className="text-sm text-[var(--replay-off-white)]/70 mb-3">
                {viz.description}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--replay-off-white)]/60 bg-[var(--replay-dark-grey)]/60 rounded-full px-4 py-2 border border-[var(--replay-border)]">
                {viz.features}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};