import { useState, useEffect } from "react";
import {
  Play,
  Music,
  Headphones,
  Sparkles,
  Upload,
  Library,
  Radio,
  ArrowRight,
  Smartphone,
  Monitor,
  Cloud,
  Shuffle,
  Heart,
  ListMusic,
  Waves,
  Zap
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage = ({ onGetStarted, onSignIn }: LandingPageProps) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [activeVisualizer, setActiveVisualizer] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Smooth scroll tracking for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate visualizer preview
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVisualizer(prev => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Upload,
      title: "Import Your Music",
      description: "Drag and drop or browse to import MP3, M4A, WAV, FLAC, and more. Your music, your library."
    },
    {
      icon: Library,
      title: "Smart Organization",
      description: "Automatically organize by artist, album, and genre. Create unlimited custom playlists."
    },
    {
      icon: Sparkles,
      title: "Stunning Visualizers",
      description: "Six beautiful audio-reactive visualizers that dance to your music in real-time."
    },
    {
      icon: Cloud,
      title: "Sync Everywhere",
      description: "Your library syncs across all devices. Start on desktop, continue on mobile."
    },
    {
      icon: Shuffle,
      title: "Smart Playback",
      description: "Full queue control with shuffle, repeat, and seamless gapless playback."
    },
    {
      icon: Heart,
      title: "Favorites & Likes",
      description: "Heart your favorite tracks for quick access. Build your perfect collection."
    }
  ];

  const visualizers = ["Orb", "Spectrum", "Particles", "Galaxy", "DNA", "Radial"];

  return (
    <div className="min-h-screen bg-[var(--replay-black)] overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background gradient with parallax */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#000000]"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[100px]"
            style={{
              transform: `translate(${Math.sin(Date.now() / 5000) * 20}px, ${Math.cos(Date.now() / 5000) * 20}px)`,
              animation: 'pulse 8s ease-in-out infinite'
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[80px]"
            style={{ animation: 'pulse 10s ease-in-out infinite 2s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/[0.02] to-transparent rounded-full"
            style={{ animation: 'pulse 12s ease-in-out infinite 4s' }}
          />
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8 lg:px-12 md:py-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Play className="w-4 h-4 md:w-5 md:h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
            <span className="text-lg md:text-xl font-black tracking-tight text-white">REPLAY</span>
          </div>

          <button
            onClick={onSignIn}
            className="px-4 md:px-6 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Sign In
          </button>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-8 text-center py-12">
          <div className="max-w-4xl w-full">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/5 border border-white/10 mb-6 md:mb-8 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60" />
              <span className="text-xs md:text-sm font-medium text-white/60">For Artists, by Artists</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-6 leading-[1.1]">
              Your Music,
              <br />
              <span className="text-white/50">Beautifully Organized</span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-white/50 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
              A premium music player built for musicians. Import, organize,
              and enjoy your music with stunning real-time visualizations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <button
                onClick={onGetStarted}
                className="group flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onSignIn}
                className="flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 hover:border-white/30 transition-all"
              >
                I have an account
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-5 h-8 md:w-6 md:h-10 border-2 border-white/20 rounded-full flex justify-center pt-1.5 md:pt-2">
              <div className="w-1 h-1.5 md:h-2 bg-white/40 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Available Everywhere
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              Access your music library on any device. Seamlessly sync across platforms.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="flex flex-col items-center gap-3 md:gap-4 group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                <Monitor className="w-8 h-8 md:w-10 md:h-10 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <span className="text-white/70 font-medium text-sm md:text-base">Desktop</span>
            </div>

            <div className="flex flex-col items-center gap-3 md:gap-4 group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                <Smartphone className="w-8 h-8 md:w-10 md:h-10 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <span className="text-white/70 font-medium text-sm md:text-base">Mobile</span>
            </div>

            <div className="flex flex-col items-center gap-3 md:gap-4 group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                <Cloud className="w-8 h-8 md:w-10 md:h-10 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <span className="text-white/70 font-medium text-sm md:text-base">Cloud Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Everything You Need
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              Powerful features wrapped in a beautiful, minimalist interface.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group p-5 md:p-6 lg:p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 cursor-default ${
                    hoveredFeature === index ? "bg-white/[0.06] border-white/25" : ""
                  }`}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-white/15 group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/50 text-sm md:text-base leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Visualizer Preview Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
              <Waves className="w-4 h-4 text-white/60" />
              <span className="text-xs md:text-sm font-medium text-white/60">Audio Reactive</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Stunning Visualizers
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              Six beautiful visualizations that respond to your music in real-time.
            </p>
          </div>

          {/* Visualizer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {visualizers.map((name, index) => (
              <div
                key={name}
                className={`aspect-square rounded-xl md:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border transition-all duration-500 flex items-center justify-center relative overflow-hidden group cursor-pointer ${
                  activeVisualizer === index
                    ? "border-white/30 ring-2 ring-white/20"
                    : "border-white/10 hover:border-white/20"
                }`}
                onClick={() => setActiveVisualizer(index)}
              >
                {/* Animated visualizer preview */}
                <div className={`absolute inset-0 transition-opacity duration-500 ${activeVisualizer === index ? 'opacity-60' : 'opacity-30 group-hover:opacity-50'}`}>
                  {index === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500/50 to-blue-500/50 blur-xl animate-pulse" />
                      <div className="absolute w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/30 animate-ping" style={{ animationDuration: '2s' }} />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 md:gap-1 p-3 md:p-4">
                      {Array(12).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-green-500/60 to-cyan-500/60 rounded-t animate-pulse"
                          style={{
                            height: `${20 + Math.sin(i + Date.now() / 500) * 30 + 30}%`,
                            animationDelay: `${i * 100}ms`,
                            animationDuration: '1s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {index === 2 && (
                    <div className="absolute inset-0">
                      {Array(15).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 md:w-3 md:h-3 bg-white/50 rounded-full animate-ping"
                          style={{
                            left: `${15 + (i % 5) * 18}%`,
                            top: `${15 + Math.floor(i / 5) * 25}%`,
                            animationDelay: `${i * 200}ms`,
                            animationDuration: '2s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {index === 3 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full animate-spin" style={{ animationDuration: '20s' }}>
                        <div className="absolute inset-[30%] rounded-full bg-gradient-conic from-purple-500/30 via-transparent to-pink-500/30 blur-md" />
                      </div>
                      <div className="absolute w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/40 blur-sm" />
                    </div>
                  )}
                  {index === 4 && (
                    <div className="absolute inset-0 flex flex-col justify-between py-4 md:py-6">
                      {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="flex justify-between px-4 md:px-6">
                          <div
                            className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-cyan-500/60 animate-pulse"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                          <div
                            className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-pink-500/60 animate-pulse"
                            style={{ animationDelay: `${i * 150 + 75}ms` }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {index === 5 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {Array(16).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-0.5 md:w-1 bg-gradient-to-t from-transparent to-orange-500/60 origin-bottom animate-pulse"
                          style={{
                            height: `${25 + Math.random() * 20}%`,
                            transform: `rotate(${i * 22.5}deg)`,
                            animationDelay: `${i * 50}ms`
                          }}
                        />
                      ))}
                      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-white/40" />
                    </div>
                  )}
                </div>
                <span className="relative z-10 text-white font-semibold text-sm md:text-base">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Speed Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Zap className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Lightning Fast
            </h2>
            <p className="text-white/50 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
              Built for performance. Instant playback, smooth animations, and responsive controls.
              Your music starts playing the moment you tap play.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 md:p-12 rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
            <Headphones className="w-12 h-12 md:w-16 md:h-16 text-white/50 mx-auto mb-4 md:mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Ready to Start?
            </h2>
            <p className="text-white/50 mb-6 md:mb-8 max-w-lg mx-auto text-sm md:text-base">
              Create your free account and start organizing your music collection today.
              No credit card required.
            </p>
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center gap-2 px-6 md:px-8 py-3.5 md:py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-6 md:py-8 px-4 md:px-8 lg:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 md:w-4 md:h-4 text-white fill-white ml-0.5" />
            </div>
            <span className="text-sm font-bold text-white/50">REPLAY</span>
          </div>
          <p className="text-xs md:text-sm text-white/30 text-center md:text-right">
            Your music, beautifully organized.
          </p>
        </div>
      </footer>
    </div>
  );
};
