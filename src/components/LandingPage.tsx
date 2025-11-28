import { useState, useEffect } from "react";
import {
  Play,
  Music,
  Headphones,
  Sparkles,
  Upload,
  Library,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Monitor,
  Cloud,
  Shuffle,
  Heart,
  ListMusic,
  Waves,
  Zap,
  FolderOpen,
  Shield,
  Github,
  Twitter,
  Mail,
  Users,
  Lock,
  Mic,
  Disc,
  Wand2,
  Check,
  Crown,
  Rocket,
  Star,
  TrendingUp
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onBackToApp?: () => void;
  showBackButton?: boolean;
}

export const LandingPage = ({ onGetStarted, onSignIn, onBackToApp, showBackButton }: LandingPageProps) => {
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
      description: "Drag and drop or browse to import MP3, M4A, WAV, FLAC, AAC, OGG, and more. Your music, your library."
    },
    {
      icon: Mic,
      title: "AI Lyrics Transcription",
      description: "Powered by OpenAI Whisper. Automatically transcribe any song and display synced lyrics in real-time.",
      isNew: true
    },
    {
      icon: Sparkles,
      title: "Stunning Visualizers",
      description: "Seven beautiful audio-reactive visualizers including an immersive lyrics mode that dances to your music."
    },
    {
      icon: Disc,
      title: "Custom Albums & Projects",
      description: "Create your own albums with custom cover art. Perfect for organizing demos, projects, and playlists.",
      isNew: true
    },
    {
      icon: Cloud,
      title: "Cloud Sync",
      description: "Your library syncs across all devices via Backblaze B2. Start on desktop, continue on mobile."
    },
    {
      icon: Shuffle,
      title: "Smart Playback",
      description: "Full queue control with shuffle, repeat modes, and seamless playback. Swipe to skip on mobile."
    },
    {
      icon: Heart,
      title: "Favorites & Likes",
      description: "Heart your favorite tracks for quick access. Build your perfect collection."
    },
    {
      icon: Wand2,
      title: "Mini Player Mode",
      description: "A compact, draggable player that stays on top while you work. Keep the music flowing anywhere.",
      isNew: true
    },
    {
      icon: Lock,
      title: "Private & Secure",
      description: "Your music stays yours. We don't sell data or track listening habits. Full privacy."
    }
  ];

  const visualizers = ["Bars", "Wave", "Pulse", "Circle", "Dots", "Lines", "Lyrics"];

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
          {/* Gradient orbs */}
          <div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/[0.08] rounded-full blur-[100px]"
            style={{ animation: 'float 8s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/[0.06] rounded-full blur-[80px]"
            style={{ animation: 'float 10s ease-in-out infinite 2s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/[0.02] to-transparent rounded-full"
            style={{ animation: 'pulse 12s ease-in-out infinite 4s' }}
          />

          {/* Animated audio bars in hero background */}
          <div className="absolute bottom-0 left-0 right-0 h-40 flex items-end justify-center gap-1 opacity-[0.07] px-20">
            {Array(40).fill(0).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-purple-500 to-pink-400 rounded-t"
                style={{
                  height: `${15 + Math.sin(i * 0.5) * 30 + 40}%`,
                  animation: `audioBar ${0.8 + Math.random() * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>

          {/* Floating music notes */}
          <div className="absolute inset-0">
            {Array(8).fill(0).map((_, i) => (
              <div
                key={i}
                className="absolute text-white/10 text-2xl md:text-4xl"
                style={{
                  left: `${10 + i * 12}%`,
                  animation: `floatUp ${8 + Math.random() * 4}s linear infinite`,
                  animationDelay: `${i * 1.2}s`
                }}
              >
                {i % 3 === 0 ? '♪' : i % 3 === 1 ? '♫' : '♬'}
              </div>
            ))}
          </div>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-10px) translateX(-10px); }
            75% { transform: translateY(-30px) translateX(5px); }
          }
          @keyframes audioBar {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.5); }
          }
          @keyframes floatUp {
            0% { bottom: -20px; opacity: 0; transform: translateX(0) rotate(0deg); }
            10% { opacity: 0.1; }
            90% { opacity: 0.1; }
            100% { bottom: 100%; opacity: 0; transform: translateX(20px) rotate(15deg); }
          }
        `}</style>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8 lg:px-12 md:py-6">
          <div className="flex items-center gap-2 md:gap-3">
            {showBackButton && onBackToApp && (
              <button
                onClick={onBackToApp}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors mr-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to App
              </button>
            )}
            <div className="relative">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Play className="w-4 h-4 md:w-5 md:h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
            <span className="text-lg md:text-xl font-black tracking-tight text-white">REPLAY</span>
          </div>

          {!showBackButton && (
            <button
              onClick={onSignIn}
              className="px-4 md:px-6 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Sign In
            </button>
          )}
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
                  className={`group p-5 md:p-6 lg:p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 cursor-default relative overflow-hidden ${
                    hoveredFeature === index ? "bg-white/[0.06] border-white/25" : ""
                  }`}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  {/* NEW badge for new features */}
                  {feature.isNew && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                      New
                    </div>
                  )}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-all duration-300 ${
                    feature.isNew
                      ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                      : "bg-white/10"
                  }`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${feature.isNew ? "text-purple-300" : "text-white"}`} />
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
              Seven beautiful visualizations that respond to your music in real-time, including AI-powered lyrics sync.
            </p>
          </div>

          {/* Visualizer Grid - 7 visualizers in responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {visualizers.map((name, index) => (
              <div
                key={name}
                className={`aspect-square rounded-xl md:rounded-2xl bg-gradient-to-br from-[#0a0a12] to-[#15151f] border transition-all duration-500 flex items-center justify-center relative overflow-hidden group cursor-pointer ${
                  activeVisualizer === index
                    ? "border-purple-500/50 ring-2 ring-purple-500/30"
                    : "border-white/10 hover:border-white/20"
                } ${name === "Lyrics" ? "sm:col-span-1 lg:col-span-1" : ""}`}
                onClick={() => setActiveVisualizer(index)}
              >
                {/* Animated visualizer preview */}
                <div className={`absolute inset-0 transition-opacity duration-500 ${activeVisualizer === index ? 'opacity-80' : 'opacity-40 group-hover:opacity-60'}`}>
                  {/* Bars */}
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] p-3 md:p-4">
                      {Array(10).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm animate-pulse"
                          style={{
                            height: `${15 + Math.random() * 60}%`,
                            background: `linear-gradient(to top, hsl(${260 + i * 15}, 80%, 50%), hsl(${280 + i * 15}, 90%, 65%))`,
                            animationDelay: `${i * 80}ms`,
                            animationDuration: '0.8s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Wave */}
                  {index === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center gap-[2px] p-4">
                      {Array(12).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full animate-pulse"
                          style={{
                            height: `${20 + Math.sin(i * 0.8) * 30 + 20}%`,
                            animationDelay: `${i * 100}ms`,
                            animationDuration: '1.2s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Pulse */}
                  {index === 2 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[0, 1, 2].map((ring) => (
                        <div
                          key={ring}
                          className="absolute rounded-full border-2 animate-ping"
                          style={{
                            width: `${30 + ring * 25}%`,
                            height: `${30 + ring * 25}%`,
                            borderColor: `hsla(${280 + ring * 30}, 80%, 60%, ${0.6 - ring * 0.15})`,
                            animationDuration: `${1.5 + ring * 0.5}s`,
                            animationDelay: `${ring * 0.3}s`
                          }}
                        />
                      ))}
                      <div className="w-4 h-4 rounded-full bg-white/50 blur-sm" />
                    </div>
                  )}
                  {/* Circle */}
                  {index === 3 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-3/4 h-3/4 animate-spin" style={{ animationDuration: '8s' }}>
                        {Array(12).fill(0).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full animate-pulse"
                            style={{
                              left: `${50 + 35 * Math.cos(i * Math.PI / 6)}%`,
                              top: `${50 + 35 * Math.sin(i * Math.PI / 6)}%`,
                              background: `hsl(${(i / 12) * 360}, 80%, 60%)`,
                              boxShadow: `0 0 8px hsla(${(i / 12) * 360}, 80%, 60%, 0.6)`,
                              animationDelay: `${i * 100}ms`
                            }}
                          />
                        ))}
                      </div>
                      <div className="w-4 h-4 rounded-full bg-white/60" />
                    </div>
                  )}
                  {/* Dots */}
                  {index === 4 && (
                    <div className="absolute inset-0 grid grid-cols-4 gap-2 p-4">
                      {Array(16).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full animate-pulse"
                          style={{
                            background: `hsl(${180 + i * 10}, 70%, 55%)`,
                            boxShadow: `0 0 8px hsla(${180 + i * 10}, 70%, 55%, 0.5)`,
                            animationDelay: `${i * 100}ms`,
                            animationDuration: '1s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Lines */}
                  {index === 5 && (
                    <div className="absolute inset-0 flex flex-col justify-center gap-2 p-4">
                      {Array(6).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="h-1.5 rounded-full animate-pulse origin-left"
                          style={{
                            width: `${30 + Math.random() * 50}%`,
                            background: `linear-gradient(to right, hsl(${200 + i * 20}, 80%, 55%), transparent)`,
                            animationDelay: `${i * 150}ms`,
                            animationDuration: '1s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Lyrics - NEW */}
                  {index === 6 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                      <div className="text-white/30 text-[8px] md:text-xs mb-1 blur-[1px]">...previous line...</div>
                      <div
                        className="text-white font-bold text-sm md:text-base animate-pulse"
                        style={{
                          textShadow: '0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)'
                        }}
                      >
                        Synced Lyrics
                      </div>
                      <div className="text-white/30 text-[8px] md:text-xs mt-1 blur-[1px]">...next line...</div>
                      {/* Audio bars at bottom */}
                      <div className="absolute bottom-2 left-0 right-0 flex items-end justify-center gap-[1px] px-3 h-4 opacity-50">
                        {Array(8).fill(0).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-purple-500 to-pink-400 rounded-t-sm animate-pulse"
                            style={{
                              height: `${20 + Math.random() * 70}%`,
                              animationDelay: `${i * 60}ms`,
                              animationDuration: '0.6s'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="relative z-10 text-white font-semibold text-sm md:text-base flex items-center gap-1.5">
                  {name}
                  {name === "Lyrics" && (
                    <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-[8px] font-bold uppercase">AI</span>
                  )}
                </span>
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

      {/* Pricing Section */}
      <section id="pricing" className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-purple-500/[0.03] to-transparent overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4 md:mb-6">
              <Rocket className="w-4 h-4 text-purple-400" />
              <span className="text-xs md:text-sm font-medium text-purple-300">Early Adopter Pricing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Lock In Your Price Forever
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Early supporters get the best deal. Lock in your price tier before it's gone.
              Once you subscribe, your price never goes up.
            </p>
          </div>

          {/* Progress Bar Section */}
          <div className="max-w-2xl mx-auto mb-12 md:mb-16 p-5 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/60" />
                <span className="text-sm font-medium text-white">Users Claimed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white">23</span>
                <span className="text-white/50">/ 50</span>
              </div>
            </div>
            <div className="relative h-4 bg-white/10 rounded-full overflow-hidden mb-3">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: '46%' }}
              />
              <div
                className="absolute inset-y-0 left-[46%] bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full"
                style={{ width: '54%' }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-white/50">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                $5/mo tier (27 left)
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Price increases at 50 users
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
            {/* Tier 1 - Current */}
            <div className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/50 overflow-hidden group">
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-green-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                Available Now
              </div>
              <div className="mb-4">
                <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">First 50 Users</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black text-white">$5</span>
                  <span className="text-white/50">/month</span>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-6">
                Lock in the lowest price forever. Only 27 spots remaining at this tier.
              </p>
              <ul className="space-y-3 mb-6">
                {["Unlimited music imports", "Cloud sync across devices", "All 7 visualizers", "AI lyrics transcription", "Priority support", "Forever locked price"].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Claim $5/mo Spot
              </button>
            </div>

            {/* Tier 2 - Upcoming */}
            <div className="relative p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden opacity-75">
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-[10px] font-medium text-yellow-400 uppercase tracking-wider">
                Next Tier
              </div>
              <div className="mb-4">
                <span className="text-yellow-400/70 text-xs font-semibold uppercase tracking-wider">Users 51-100</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black text-white/60">$8</span>
                  <span className="text-white/40">/month</span>
                </div>
              </div>
              <p className="text-white/40 text-sm mb-6">
                Starting after the first 50 users claim their spots.
              </p>
              <ul className="space-y-3 mb-6">
                {["All features included", "Cloud sync", "All visualizers", "AI lyrics", "Standard support", "Forever locked price"].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/50">
                    <Check className="w-4 h-4 text-white/30 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="w-full py-3 bg-white/5 border border-white/10 text-white/40 font-medium rounded-xl text-center">
                Opens at 50 Users
              </div>
            </div>

            {/* Tier 3 - Future */}
            <div className="relative p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden opacity-50">
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-medium text-white/40 uppercase tracking-wider">
                Future
              </div>
              <div className="mb-4">
                <span className="text-white/30 text-xs font-semibold uppercase tracking-wider">Users 101-200</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black text-white/40">$12</span>
                  <span className="text-white/30">/month</span>
                </div>
              </div>
              <p className="text-white/30 text-sm mb-6">
                Price increases as we grow. Lock in early for the best deal.
              </p>
              <ul className="space-y-3 mb-6">
                {["All features included", "Cloud sync", "All visualizers", "AI lyrics", "Standard support", "Forever locked price"].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/30">
                    <Check className="w-4 h-4 text-white/20 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="w-full py-3 bg-white/5 border border-white/5 text-white/30 font-medium rounded-xl text-center">
                Opens at 100 Users
              </div>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Price locked forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>7-day free trial</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
              <Music className="w-4 h-4 text-white/60" />
              <span className="text-xs md:text-sm font-medium text-white/60">About REPLAY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Music, The Way It Should Be
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              REPLAY was born from frustration with bloated music apps that prioritize ads over experience.
              We built something different - a clean, fast, beautiful music player that puts your music first.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white/70" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Ads, Ever</h3>
              <p className="text-white/50 text-sm">
                Your music experience should be uninterrupted. No banner ads, no audio ads, no sponsored content.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white/70" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Privacy First</h3>
              <p className="text-white/50 text-sm">
                We don't track what you listen to. Your data stays yours. No selling to advertisers.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white/70" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lightning Fast</h3>
              <p className="text-white/50 text-sm">
                Built with modern tech for instant load times and smooth animations on any device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
            Built With Modern Tech
          </h2>
          <p className="text-white/50 mb-8 md:mb-10 max-w-lg mx-auto text-sm md:text-base">
            Powered by the latest web technologies for the best possible experience.
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {["React", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "Backblaze B2", "Railway"].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-default"
              >
                {tech}
              </span>
            ))}
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
      <footer className="relative py-8 md:py-12 px-4 md:px-8 lg:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
                <span className="text-xl font-black text-white">REPLAY</span>
              </div>
              <p className="text-white/50 text-sm max-w-md mb-4">
                A premium music player built for musicians. Import, organize, and enjoy your music
                with stunning visualizations and seamless cloud sync.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://github.com/bydc-cloud/REPLAY" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Github className="w-5 h-5 text-white/70" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Twitter className="w-5 h-5 text-white/70" />
                </a>
                <a href="mailto:support@replay.app" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Mail className="w-5 h-5 text-white/70" />
                </a>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="hover:text-white/70 transition-colors cursor-default">Music Import</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Cloud Sync</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Visualizers</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Project Folders</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Playlists</li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="hover:text-white/70 transition-colors cursor-default">Help Center</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Privacy Policy</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Terms of Service</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Contact Us</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © 2024 REPLAY. All rights reserved.
            </p>
            <p className="text-xs text-white/30">
              Made with love for musicians everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
