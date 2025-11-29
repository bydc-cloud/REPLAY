import { useState, useEffect, useRef } from "react";
import {
  Play,
  Music,
  Headphones,
  Sparkles,
  Upload,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Monitor,
  Cloud,
  Shuffle,
  Waves,
  Zap,
  Shield,
  Github,
  Twitter,
  Mail,
  Lock,
  Mic,
  Disc,
  Wand2,
  Sliders,
  Volume2,
  Store
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
      icon: Sliders,
      title: "10-Band Equalizer",
      description: "Professional-grade parametric EQ with 12 built-in presets. Fine-tune your sound from 32Hz to 16kHz.",
      isNew: true
    },
    {
      icon: Volume2,
      title: "Audio Effects Suite",
      description: "Bass boost, compressor, stereo enhancer, and crossfade. Studio-quality effects at your fingertips.",
      isNew: true
    },
    {
      icon: Mic,
      title: "AI Lyrics Transcription",
      description: "Powered by OpenAI Whisper. Automatically transcribe any song and display synced lyrics in real-time.",
      isNew: true
    },
    {
      icon: Sparkles,
      title: "7 Stunning Visualizers",
      description: "Audio-reactive bars, waves, pulses, circles, dots, lines, and immersive lyrics mode."
    },
    {
      icon: Shield,
      title: "Producer Watermarks",
      description: "Protect your beats with custom audio tags. Set volume, interval, and overlay modes.",
      isNew: true
    },
    {
      icon: Store,
      title: "Beat Marketplace",
      description: "Sell your beats directly to artists. Create beat packs, set licenses, and track royalties.",
      isNew: true
    },
    {
      icon: Cloud,
      title: "Cloud Sync",
      description: "Your library syncs across all devices via Backblaze B2. Start on desktop, continue on mobile."
    },
    {
      icon: Disc,
      title: "Custom Albums",
      description: "Create albums with custom cover art. Perfect for organizing demos, projects, and releases."
    },
    {
      icon: Shuffle,
      title: "Smart Playback",
      description: "Full queue control with shuffle, repeat modes, crossfade, and gapless playback."
    },
    {
      icon: Wand2,
      title: "Mini Player Mode",
      description: "Compact, draggable player that stays on top. Keep the music flowing anywhere.",
      isNew: true
    },
    {
      icon: Lock,
      title: "Private & Secure",
      description: "Your music stays yours. No ads, no tracking, full privacy. You own your data."
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

        {/* Animated background elements - Optimized for mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient orbs - Smaller on mobile */}
          <div
            className="absolute top-1/4 left-1/4 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-purple-500/[0.12] md:bg-purple-500/[0.15] rounded-full blur-[60px] md:blur-[120px]"
            style={{ animation: 'float 8s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-pink-500/[0.10] md:bg-pink-500/[0.12] rounded-full blur-[50px] md:blur-[100px]"
            style={{ animation: 'float 10s ease-in-out infinite 2s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[700px] h-[300px] md:h-[700px] bg-gradient-radial from-white/[0.03] md:from-white/[0.04] to-transparent rounded-full"
            style={{ animation: 'pulse 12s ease-in-out infinite 4s' }}
          />
          {/* Hide smaller orbs on mobile for performance */}
          <div
            className="hidden md:block absolute top-10 right-20 w-[300px] h-[300px] bg-cyan-500/[0.08] rounded-full blur-[80px]"
            style={{ animation: 'float 12s ease-in-out infinite 3s' }}
          />
          <div
            className="hidden md:block absolute bottom-20 left-10 w-[350px] h-[350px] bg-indigo-500/[0.10] rounded-full blur-[90px]"
            style={{ animation: 'float 9s ease-in-out infinite 1s' }}
          />

          {/* Animated audio bars in hero background - Fewer on mobile for performance */}
          <div className="absolute bottom-0 left-0 right-0 h-32 md:h-64 flex items-end justify-center gap-[2px] md:gap-1 opacity-[0.12] md:opacity-[0.15] px-4 md:px-10">
            {Array(30).fill(0).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t max-w-2 md:max-w-none"
                style={{
                  height: `${20 + Math.sin(i * 0.4) * 40 + 30}%`,
                  background: `linear-gradient(to top, hsl(${260 + (i % 20) * 5}, 80%, 50%), hsl(${300 + (i % 15) * 3}, 85%, 60%))`,
                  animation: `audioBar ${0.6 + Math.random() * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 40}ms`,
                  boxShadow: `0 0 10px hsla(${270 + (i % 20) * 4}, 80%, 55%, 0.2)`
                }}
              />
            ))}
          </div>

          {/* Circular audio visualizer - Left side - Hidden on mobile */}
          <div className="hidden md:block absolute left-[5%] top-1/3 w-48 h-48 md:w-64 md:h-64 opacity-[0.12]">
            <div className="relative w-full h-full animate-spin" style={{ animationDuration: '20s' }}>
              {Array(24).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 origin-center"
                  style={{
                    transform: `rotate(${i * 15}deg) translateX(40px)`,
                  }}
                >
                  <div
                    className="w-1.5 rounded-full"
                    style={{
                      height: `${20 + Math.sin(i * 0.5) * 30}px`,
                      background: `linear-gradient(to top, hsl(${260 + i * 4}, 80%, 55%), hsl(${320 - i * 2}, 85%, 65%))`,
                      animation: `audioBar ${0.8 + (i % 3) * 0.2}s ease-in-out infinite`,
                      animationDelay: `${i * 80}ms`,
                      boxShadow: `0 0 10px hsla(${280 + i * 3}, 80%, 60%, 0.5)`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Circular audio visualizer - Right side - Hidden on mobile */}
          <div className="hidden md:block absolute right-[5%] top-1/2 w-40 h-40 md:w-56 md:h-56 opacity-[0.10]">
            <div className="relative w-full h-full animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
              {Array(20).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 origin-center"
                  style={{
                    transform: `rotate(${i * 18}deg) translateX(35px)`,
                  }}
                >
                  <div
                    className="w-1 rounded-full"
                    style={{
                      height: `${15 + Math.cos(i * 0.6) * 25}px`,
                      background: `linear-gradient(to top, hsl(${200 + i * 6}, 75%, 50%), hsl(${240 + i * 4}, 80%, 60%))`,
                      animation: `audioBar ${0.7 + (i % 4) * 0.15}s ease-in-out infinite`,
                      animationDelay: `${i * 100}ms`,
                      boxShadow: `0 0 8px hsla(${220 + i * 5}, 75%, 55%, 0.5)`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Floating waveform lines - Hidden on mobile */}
          <div className="hidden md:block absolute top-1/4 left-0 right-0 h-20 opacity-[0.08]">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M0,40 Q50,10 100,40 T200,40 T300,40 T400,40 T500,40 T600,40 T700,40 T800,40 T900,40 T1000,40 T1100,40 T1200,40 T1300,40 T1400,40 T1500,40 T1600,40 T1700,40 T1800,40 T1900,40 T2000,40"
                stroke="url(#waveGradient)"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
                style={{ animationDuration: '2s' }}
              />
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="20%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="80%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>


          {/* Pulsing rings - Smaller on mobile, fewer rings */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {[0, 1].map((ring) => (
              <div
                key={ring}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border md:hidden"
                style={{
                  width: `${150 + ring * 80}px`,
                  height: `${150 + ring * 80}px`,
                  borderColor: `hsla(${270 + ring * 15}, 70%, 50%, ${0.06 - ring * 0.02})`,
                  animation: `pulseRing ${4 + ring}s ease-out infinite`,
                  animationDelay: `${ring * 0.8}s`
                }}
              />
            ))}
            {[0, 1, 2, 3].map((ring) => (
              <div
                key={ring}
                className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  width: `${300 + ring * 150}px`,
                  height: `${300 + ring * 150}px`,
                  borderColor: `hsla(${270 + ring * 15}, 70%, 50%, ${0.08 - ring * 0.015})`,
                  animation: `pulseRing ${4 + ring}s ease-out infinite`,
                  animationDelay: `${ring * 0.8}s`
                }}
              />
            ))}
          </div>

          {/* Floating EQ bars pattern - top right - Hidden on mobile */}
          <div className="hidden md:flex absolute top-20 right-[15%] items-end gap-1 h-20 opacity-[0.12]">
            {Array(8).fill(0).map((_, i) => (
              <div
                key={i}
                className="w-2 rounded-full"
                style={{
                  height: `${30 + Math.sin(i * 0.8) * 40}%`,
                  background: `linear-gradient(to top, #8b5cf6, #d946ef)`,
                  animation: `audioBar ${0.5 + i * 0.1}s ease-in-out infinite`,
                  animationDelay: `${i * 100}ms`,
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
                }}
              />
            ))}
          </div>
        </div>

        {/* CSS Animations - With reduced motion support */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-10px) translateX(-10px); }
            75% { transform: translateY(-30px) translateX(5px); }
          }
          @keyframes audioBar {
            0%, 100% { transform: scaleY(1); opacity: 1; }
            50% { transform: scaleY(0.4); opacity: 0.7; }
          }
          @keyframes pulseRing {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.1; }
            50% { opacity: 0.05; }
            100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
          }
          @keyframes waveMove {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          /* Reduce animations for users who prefer reduced motion */
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
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
              The premium music player for producers & musicians. Professional 10-band EQ,
              studio effects, AI lyrics, beat marketplace, and 7 stunning visualizers.
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
                <li className="hover:text-white/70 transition-colors cursor-default">10-Band Equalizer</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Audio Effects Suite</li>
                <li className="hover:text-white/70 transition-colors cursor-default">7 Visualizers</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Beat Marketplace</li>
                <li className="hover:text-white/70 transition-colors cursor-default">AI Lyrics</li>
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
