import { Settings as SettingsIcon, Sparkles, Check, Sun, Moon, Palette, Keyboard, Info, Heart } from "lucide-react";
import { useState } from "react";
import { PremiumCoverArt } from "./PremiumCoverArt";
import { useSettings } from "../contexts/SettingsContext";

interface SettingsViewProps {
  selectedVisualizer: "orb" | "spectrum" | "particles" | "galaxy" | "dna" | "radial";
  onVisualizerChange: (variant: "orb" | "spectrum" | "particles" | "galaxy" | "dna" | "radial") => void;
}

export const SettingsView = ({ selectedVisualizer, onVisualizerChange }: SettingsViewProps) => {
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const { themeMode, setThemeMode } = useSettings();

  const visualizers = [
    {
      variant: "orb" as const,
      name: "Orb",
      description: "3D rotating spectrum sphere with colorful gradient bars",
      features: ["Bass reactive", "360° rotation", "Multi-layer glow"],
      gradient: "from-purple-500/20 to-pink-500/20",
      borderGradient: "from-purple-500/50 to-pink-500/50"
    },
    {
      variant: "spectrum" as const,
      name: "Spectrum",
      description: "Full rainbow frequency analyzer with dynamic bars",
      features: ["Real-time bars", "Rainbow gradient", "Reflection effect"],
      gradient: "from-blue-500/20 to-cyan-500/20",
      borderGradient: "from-blue-500/50 to-cyan-500/50"
    },
    {
      variant: "particles" as const,
      name: "Particles",
      description: "Floating particle field with glowing orbs",
      features: ["Dynamic movement", "Glowing particles", "Orbital motion"],
      gradient: "from-green-500/20 to-emerald-500/20",
      borderGradient: "from-green-500/50 to-emerald-500/50"
    },
    {
      variant: "galaxy" as const,
      name: "Galaxy",
      description: "Spiral galaxy with nebula clouds and cosmic colors",
      features: ["Spiral arms", "Nebula effect", "Galactic core"],
      gradient: "from-indigo-500/20 to-purple-500/20",
      borderGradient: "from-indigo-500/50 to-purple-500/50"
    },
    {
      variant: "dna" as const,
      name: "DNA",
      description: "Double helix structure with bio-inspired animation",
      features: ["Dual helixes", "Wave motion", "Connecting bars"],
      gradient: "from-teal-500/20 to-cyan-500/20",
      borderGradient: "from-teal-500/50 to-cyan-500/50"
    },
    {
      variant: "radial" as const,
      name: "Radial",
      description: "Concentric pulsing rings with radial wave patterns",
      features: ["Wave pulses", "Ring scaling", "Gradient colors"],
      gradient: "from-orange-500/20 to-red-500/20",
      borderGradient: "from-orange-500/50 to-red-500/50"
    }
  ];

  return (
    <div className="pb-32 md:pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="text-[var(--replay-off-white)]" size={32} />
          <h1 className="text-3xl md:text-4xl font-black text-[var(--replay-off-white)]">
            Settings
          </h1>
        </div>
        <p className="text-[var(--replay-mid-grey)]">
          Customize your Replay experience
        </p>
      </div>

      {/* Appearance Settings */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="text-[var(--replay-off-white)]" size={28} />
            <div>
              <h2 className="text-2xl font-black text-[var(--replay-off-white)]">
                Appearance
              </h2>
              <p className="text-sm text-[var(--replay-mid-grey)] mt-1">
                Choose your preferred theme
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Dark Mode Button */}
            <button
              onClick={() => setThemeMode("dark")}
              className={`group relative text-left bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                themeMode === "dark"
                  ? "border-[var(--replay-off-white)] ring-2 ring-[var(--replay-off-white)]/20"
                  : "border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)]"
              }`}
            >
              {themeMode === "dark" && (
                <div className="absolute top-3 right-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] rounded-full p-1.5 shadow-lg">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
              
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-black to-slate-900 rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl">
                  <Moon className="text-white" size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-black text-[var(--replay-off-white)] mb-1">
                    Dark Mode
                  </h3>
                  <p className="text-xs text-[var(--replay-mid-grey)]">
                    Pure black minimalist theme
                  </p>
                </div>
              </div>
            </button>

            {/* Light Mode Button */}
            <button
              onClick={() => setThemeMode("light")}
              className={`group relative text-left bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                themeMode === "light"
                  ? "border-[var(--replay-off-white)] ring-2 ring-[var(--replay-off-white)]/20"
                  : "border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)]"
              }`}
            >
              {themeMode === "light" && (
                <div className="absolute top-3 right-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] rounded-full p-1.5 shadow-lg">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
              
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-100 rounded-2xl border border-gray-300 flex items-center justify-center shadow-2xl">
                  <Sun className="text-gray-900" size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-black text-[var(--replay-off-white)] mb-1">
                    Light Mode
                  </h3>
                  <p className="text-xs text-[var(--replay-mid-grey)]">
                    Clean white minimalist theme
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[var(--replay-off-white)] font-semibold mb-1">
                  Theme Preferences
                </p>
                <p className="text-xs text-[var(--replay-mid-grey)]">
                  Your theme preference is saved automatically and will persist across sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visualizer Settings Section */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[var(--replay-off-white)]" size={28} />
              <div>
                <h2 className="text-2xl font-black text-[var(--replay-off-white)]">
                  Audio Visualizer
                </h2>
                <p className="text-sm text-[var(--replay-mid-grey)] mt-1">
                  Choose your favorite visualizer for songs without cover art
                </p>
              </div>
            </div>
          </div>

          {/* Current Selection Preview */}
          <div className="mb-8 p-6 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl border border-[var(--replay-border)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-[var(--replay-mid-grey)] mb-1 uppercase tracking-wider">
                  Currently Active
                </p>
                <p className="text-xl font-black text-[var(--replay-off-white)]">
                  {visualizers.find(v => v.variant === selectedVisualizer)?.name}
                </p>
              </div>
              <button
                onClick={() => setPreviewPlaying(!previewPlaying)}
                className="text-xs text-[var(--replay-off-white)]/70 hover:text-[var(--replay-off-white)] transition-colors bg-[var(--replay-dark-grey)]/60 hover:bg-[var(--replay-dark-grey)] px-4 py-2 rounded-full border border-[var(--replay-border)]"
              >
                {previewPlaying ? "Pause Preview" : "Play Preview"}
              </button>
            </div>
            <div className="flex items-center justify-center py-4">
              <PremiumCoverArt 
                isPlaying={previewPlaying} 
                size="lg" 
                variant={selectedVisualizer}
              />
            </div>
          </div>

          {/* Visualizer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visualizers.map((viz) => {
              const isSelected = selectedVisualizer === viz.variant;
              
              return (
                <button
                  key={viz.variant}
                  onClick={() => onVisualizerChange(viz.variant)}
                  className={`group relative text-left bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl p-5 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    isSelected 
                      ? `border-[var(--replay-off-white)] bg-gradient-to-br ${viz.gradient} ring-2 ring-[var(--replay-off-white)]/20` 
                      : 'border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)]'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] rounded-full p-1.5 shadow-lg">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}

                  {/* Visualizer Preview */}
                  <div className="mb-4 flex items-center justify-center">
                    <div className="w-32 h-32 flex items-center justify-center">
                      <PremiumCoverArt 
                        isPlaying={previewPlaying} 
                        size="md" 
                        variant={viz.variant}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className={`text-lg font-black mb-2 ${
                      isSelected ? 'text-[var(--replay-off-white)]' : 'text-[var(--replay-off-white)]/90'
                    }`}>
                      {viz.name}
                    </h3>
                    <p className="text-xs text-[var(--replay-mid-grey)] mb-3 line-clamp-2">
                      {viz.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5">
                      {viz.features.map((feature, idx) => (
                        <span 
                          key={idx}
                          className={`text-xs px-2 py-1 rounded-full ${
                            isSelected 
                              ? 'bg-[var(--replay-off-white)]/10 text-[var(--replay-off-white)] border border-[var(--replay-off-white)]/20' 
                              : 'bg-[var(--replay-dark-grey)] text-[var(--replay-mid-grey)] border border-[var(--replay-border)]'
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hover Gradient Border Effect */}
                  {!isSelected && (
                    <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${viz.gradient} -z-10 blur-xl`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Info Footer */}
          <div className="mt-6 p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[var(--replay-off-white)] font-semibold mb-1">
                  Audio-Reactive Technology
                </p>
                <p className="text-xs text-[var(--replay-mid-grey)]">
                  All visualizers respond to real audio frequencies using Web Audio API. 
                  Bass, mid, and treble ranges control different visual elements for a truly immersive experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Settings Sections (Placeholder for future) */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Keyboard className="text-[var(--replay-off-white)]" size={24} />
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">
              Keyboard Shortcuts
            </h2>
          </div>
          
          <div className="space-y-3">
            {[
              { keys: ["Space"], action: "Play / Pause" },
              { keys: ["→"], action: "Next Track" },
              { keys: ["←"], action: "Previous Track" },
              { keys: ["↑"], action: "Volume Up" },
              { keys: ["↓"], action: "Volume Down" },
              { keys: ["Cmd/Ctrl", "K"], action: "Open Search" },
              { keys: ["Cmd/Ctrl", "Q"], action: "Toggle Queue" },
              { keys: ["F"], action: "Toggle Full Screen" },
            ].map((shortcut, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]"
              >
                <span className="text-sm text-[var(--replay-off-white)]">
                  {shortcut.action}
                </span>
                <div className="flex gap-2">
                  {shortcut.keys.map((key, keyIdx) => (
                    <kbd
                      key={keyIdx}
                      className="px-3 py-1 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-lg text-xs text-[var(--replay-off-white)] font-mono shadow-sm"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Info className="text-[var(--replay-off-white)]" size={24} />
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">
              About Replay
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
              <span className="text-sm text-[var(--replay-mid-grey)]">Version</span>
              <span className="text-sm text-[var(--replay-off-white)]">1.0.0 Premium</span>
            </div>
            
            <div className="p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
              <p className="text-xs text-[var(--replay-mid-grey)] leading-relaxed">
                Replay is a premium local music organizer designed for Mac and Windows. 
                Featuring project-based organization, stunning visualizers, and a minimalist 
                black theme with glassmorphism effects throughout.
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="text-purple-400 mt-0.5 flex-shrink-0" size={16} />
                <p className="text-xs text-[var(--replay-off-white)]">
                  <strong>Premium Features Active:</strong> Audio visualizers, full-screen player, 
                  album art effects, keyboard shortcuts, enhanced cards, queue drawer, 
                  lyrics panel, mini player, advanced search, and smooth transitions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support the Creator Section */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
          {/* Venmo Card */}
          <div className="max-w-md mx-auto">
            {/* Venmo Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center gap-2 mb-3">
                <Heart className="text-pink-400" size={24} />
                <h2 className="text-2xl font-black text-[var(--replay-off-white)]">
                  Support the Creator
                </h2>
              </div>
              <p className="text-sm text-[var(--replay-off-white)]/70">
                Help keep Replay alive and support future updates
              </p>
            </div>

            {/* Venmo UI Card */}
            <div className="bg-gradient-to-br from-[#008CFF] to-[#0074D9] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              {/* Venmo Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                {/* Venmo Title */}
                <div className="flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-white tracking-tight">venmo</span>
                </div>

                {/* Profile Section */}
                <div className="flex items-center gap-4 mb-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                    <span className="text-2xl font-black text-white">JD</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-black text-white">John Dallas Cox</p>
                    </div>
                    <p className="text-sm text-white/80">@johndallascox</p>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[5, 10, 20].map((amount) => (
                    <a
                      key={amount}
                      href={`https://venmo.com/johndallascox?txn=pay&amount=${amount}&note=Thanks%20for%20Replay!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-black rounded-xl py-3 text-center transition-all duration-200 hover:scale-105 active:scale-95 border border-white/30"
                    >
                      ${amount}
                    </a>
                  ))}
                </div>

                {/* Main Pay Button */}
                <a
                  href="https://venmo.com/johndallascox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white hover:bg-gray-100 text-[#008CFF] font-black text-lg rounded-full py-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 mb-3"
                >
                  Pay John Dallas Cox
                </a>

                {/* Custom Amount Link */}
                <a
                  href="https://venmo.com/johndallascox?txn=pay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-white/90 hover:text-white text-sm font-semibold transition-colors"
                >
                  Choose custom amount →
                </a>
              </div>
            </div>

            {/* Footer Message */}
            <div className="mt-6 text-center">
              <p className="text-xs text-[var(--replay-off-white)]/60 leading-relaxed">
                💙 Every contribution is greatly appreciated and helps fund continued development, 
                new features, and improvements to Replay. Thank you for your support!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};