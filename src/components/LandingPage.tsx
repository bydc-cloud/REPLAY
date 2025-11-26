import { useState } from "react";
import { Play, Music, Headphones, Sparkles, Upload, Library, Radio, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage = ({ onGetStarted, onSignIn }: LandingPageProps) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Upload,
      title: "Import Your Music",
      description: "Import audio files directly from your device. Supports MP3, M4A, WAV, FLAC, and more."
    },
    {
      icon: Library,
      title: "Organize Library",
      description: "Automatically organize your music by artist, album, and genre. Create custom playlists."
    },
    {
      icon: Sparkles,
      title: "Beautiful Visualizers",
      description: "Six stunning audio-reactive visualizers: Orb, Spectrum, Particles, Galaxy, DNA, and Radial."
    },
    {
      icon: Radio,
      title: "Queue Management",
      description: "Full queue control with shuffle, repeat modes, and seamless playback."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--replay-black)] overflow-y-auto">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#000000]" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/3 rounded-full blur-2xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 md:py-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-white">REPLAY</span>
          </div>

          <button
            onClick={onSignIn}
            className="px-6 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Sign In
          </button>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-4xl">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Sparkles className="w-4 h-4 text-white/60" />
              <span className="text-sm font-medium text-white/60">For Artists, by Artists</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Your Music,
              <br />
              <span className="text-white/60">Beautifully Organized</span>
            </h1>

            <p className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto">
              A premium music player built by musicians, for musicians. Import, organize,
              and enjoy your music with stunning visualizations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onSignIn}
                className="flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 transition-all"
              >
                I have an account
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="relative py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Powerful features wrapped in a beautiful, minimalist interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-default ${
                    hoveredFeature === index ? "bg-white/10" : ""
                  }`}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/50">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Visualizer Preview Section */}
      <section className="relative py-24 px-6 md:px-12 bg-gradient-to-b from-transparent to-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Stunning Visualizers
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Six beautiful audio-reactive visualizations to enhance your listening experience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {["Orb", "Spectrum", "Particles", "Galaxy", "DNA", "Radial"].map((name, index) => (
              <div
                key={name}
                className="aspect-square rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group"
              >
                {/* Simulated visualizer preview */}
                <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity">
                  {index === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-white/30 blur-xl animate-pulse" />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 p-4">
                      {Array(12).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 bg-white/40 rounded-t"
                          style={{ height: `${20 + Math.random() * 60}%` }}
                        />
                      ))}
                    </div>
                  )}
                  {index === 2 && (
                    <div className="absolute inset-0">
                      {Array(20).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-white/40 rounded-full"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <span className="relative z-10 text-white font-semibold">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
            <Headphones className="w-16 h-16 text-white/50 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Start?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Create your free account and start organizing your music collection today.
            </p>
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-sm font-bold text-white/50">REPLAY</span>
          </div>
          <p className="text-sm text-white/30">
            Your music, beautifully organized.
          </p>
        </div>
      </footer>
    </div>
  );
};
