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
  Store,
  Check,
  Clock,
  Calendar,
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  BarChart3,
  Link2,
  ChevronRight,
  Instagram,
  ExternalLink,
  Blocks,
  Eye,
  FileText
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
  const [activeSection, setActiveSection] = useState<string>('');

  // Smooth scroll tracking for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate visualizer preview
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVisualizer(prev => (prev + 1) % 7);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to section helper
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  // Coming Soon Features - Updated to reflect current work
  const comingSoonFeatures = [
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track plays, likes, sales, and earnings. Full insights into your audience.",
      quarter: "Live Now",
      isLive: true
    },
    {
      icon: Users,
      title: "Social Features",
      description: "Follow producers, like tracks, build your network. Already live!",
      quarter: "Live Now",
      isLive: true
    },
    {
      icon: TrendingUp,
      title: "Discovery Feed",
      description: "TikTok-style FYP for producers. Discover new beats, get discovered.",
      quarter: "In Progress",
      isInProgress: true
    },
    {
      icon: Store,
      title: "Beat Marketplace",
      description: "Sell your beats with licensing. Set your prices, keep 85%.",
      quarter: "In Progress",
      isInProgress: true
    },
    {
      icon: MessageSquare,
      title: "Direct Messages",
      description: "Connect directly with artists and producers for collabs.",
      quarter: "Q1 2025"
    },
    {
      icon: Blocks,
      title: "Blockchain Payouts",
      description: "Transparent, verifiable royalty payments on-chain. No hidden fees.",
      quarter: "Q1 2025"
    }
  ];

  // Public Roadmap Items - Updated Dec 2024
  const roadmapItems = {
    launched: [
      "Premium music library with cloud sync",
      "10-band parametric EQ with 12 presets",
      "AI-powered lyrics transcription (Whisper)",
      "BPM & key detection via Essentia",
      "7 audio visualizer variants with reactive effects",
      "Producer mode with A/B looping",
      "Crossfade & playback speed control",
      "Custom albums with cover art",
      "Analytics dashboard with earnings tracking",
      "Social features (follows, likes, comments)",
      "Producer profiles with track uploads",
      "Mobile-responsive UI",
      "Apple Music style synced lyrics"
    ],
    inProgress: [
      "Discovery feed (FYP) for producers",
      "Beat marketplace with licensing",
      "Like-to-play instant playback",
      "Landing page & SEO optimization",
      "Public producer discovery"
    ],
    planned: [
      "Beat packs & bundles",
      "Direct messaging between producers",
      "Custom licensing templates",
      "Blockchain-transparent payouts",
      "Payout request system"
    ],
    future: [
      "Native mobile app (iOS & Android)",
      "Collaboration tools & split sheets",
      "AI beat recommendations",
      "Stem separation",
      "Sample clearance integration"
    ]
  };

  // Sample blockchain transactions for transparency showcase
  const sampleTransactions = [
    { producer: "@beatmaker_jay", amount: 149.99, date: "Dec 4, 2025", txHash: "0x8f2a...e4b1", status: "confirmed" },
    { producer: "@prodbyname", amount: 299.99, date: "Dec 3, 2025", txHash: "0x3c7d...a2f8", status: "confirmed" },
    { producer: "@trapking808", amount: 79.99, date: "Dec 3, 2025", txHash: "0x9e1b...c5d2", status: "confirmed" },
    { producer: "@lofimaster", amount: 199.99, date: "Dec 2, 2025", txHash: "0x4f8a...b3e7", status: "confirmed" },
    { producer: "@melodicbeats", amount: 49.99, date: "Dec 2, 2025", txHash: "0x7d2c...f1a9", status: "confirmed" }
  ];

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
            className="absolute bottom-1/4 right-1/4 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-indigo-500/[0.08] md:bg-indigo-500/[0.10] rounded-full blur-[50px] md:blur-[100px]"
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

          {/* Animated audio bars in hero background - Full width edge-to-edge */}
          <div className="absolute bottom-0 left-0 right-0 h-32 md:h-64 flex items-end justify-between gap-[1px] md:gap-[2px] opacity-[0.12] md:opacity-[0.15] px-0">
            {Array(40).fill(0).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
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
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/20 backdrop-blur-sm flex items-center justify-center border border-violet-500/30">
                <Disc className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <span className="text-lg md:text-xl font-black tracking-tight text-white">RHYTHM</span>
          </div>

          {/* Navigation Links - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('roadmap')}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Roadmap
            </button>
            <button
              onClick={() => scrollToSection('transparency')}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Transparency
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Pricing
            </button>
          </nav>

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
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
              <span className="text-xs md:text-sm font-medium text-white/70">For Creators & Music Lovers</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-6 leading-[1.1]">
              Your Music.
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent">Your Way.</span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-white/50 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
              The all-in-one platform for creators and music lovers. Studio-grade tools, stunning visualizers,
              and a community where <span className="text-white/70 font-medium">artists keep 85% of every sale</span>.
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
                onClick={() => scrollToSection('features')}
                className="flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 hover:border-white/30 transition-all"
              >
                Explore Features
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 md:mt-12 flex items-center justify-center gap-6 md:gap-8 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>No Ads</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Privacy First</span>
              </div>
              <div className="flex items-center gap-2">
                <Blocks className="w-4 h-4" />
                <span>Transparent</span>
              </div>
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
      <section id="features" className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs md:text-sm font-medium text-white/60">Live Now</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Everything You Need to Create
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              Powerful features wrapped in a beautiful, minimalist interface. All available today.
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
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                      New
                    </div>
                  )}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-all duration-300 ${
                    feature.isNew
                      ? "bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30"
                      : "bg-white/10"
                  }`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${feature.isNew ? "text-violet-300" : "text-white"}`} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/50 text-sm md:text-base leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Visualizer Preview Section - Professional Real Visualizers */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
              <Waves className="w-4 h-4 text-purple-400" />
              <span className="text-xs md:text-sm font-medium text-white/60">Studio-Grade Visuals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Visualizers That Feel Like Art
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              Seven real-time audio-reactive visualizations. Each one responds to your music's bass, mids, and highs. The Lyrics mode syncs with AI transcription.
            </p>
          </div>

          {/* Hero Visualizer Preview - Large Featured */}
          <div className="mb-8 relative">
            <div className="aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-3xl bg-black border border-white/10 overflow-hidden relative group">
              {/* Real reactive blur background like our app */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute rounded-full"
                  style={{
                    width: '60%',
                    height: '60%',
                    left: '20%',
                    top: '20%',
                    background: `radial-gradient(circle,
                      rgba(147, 51, 234, 0.5) 0%,
                      rgba(147, 51, 234, 0) 70%)`,
                    filter: 'blur(60px)',
                    animation: 'visualizerPulse 2s ease-in-out infinite',
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: '50%',
                    height: '50%',
                    right: '10%',
                    bottom: '20%',
                    background: `radial-gradient(circle,
                      rgba(79, 70, 229, 0.4) 0%,
                      rgba(79, 70, 229, 0) 70%)`,
                    filter: 'blur(50px)',
                    animation: 'visualizerPulse 2.5s ease-in-out infinite 0.5s',
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: '40%',
                    height: '40%',
                    left: '5%',
                    bottom: '30%',
                    background: `radial-gradient(circle,
                      rgba(236, 72, 153, 0.3) 0%,
                      rgba(236, 72, 153, 0) 70%)`,
                    filter: 'blur(40px)',
                    animation: 'visualizerPulse 3s ease-in-out infinite 1s',
                  }}
                />
              </div>

              {/* Content based on active visualizer */}
              <div className="absolute inset-0 flex items-center justify-center">
                {activeVisualizer === 6 ? (
                  // Lyrics Preview - Apple Music Style
                  <div className="text-center px-4 md:px-12 py-8 w-full">
                    <p className="text-white/20 text-sm md:text-xl mb-3 md:mb-4 blur-[1px] transform scale-75">I've been searching for a feeling</p>
                    <p
                      className="text-white font-bold text-2xl md:text-5xl lg:text-6xl mb-3 md:mb-4"
                      style={{
                        textShadow: '0 0 40px rgba(147, 51, 234, 0.5), 0 0 80px rgba(79, 70, 229, 0.3)',
                        animation: 'lyricsGlow 2s ease-in-out infinite'
                      }}
                    >
                      That I can't seem to find
                    </p>
                    <p className="text-white/20 text-sm md:text-xl mt-3 md:mt-4 blur-[1px] transform scale-75">Running through my mind like water</p>
                  </div>
                ) : (
                  // Audio Bars Preview - Real EQ style - Full width
                  <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-[2px] md:gap-1 px-0 pb-6 md:pb-12 h-full pt-20">
                    {Array(48).fill(0).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{
                          height: `${20 + Math.sin(i * 0.3 + Date.now() / 500) * 30 + Math.random() * 30}%`,
                          background: `linear-gradient(to top,
                            hsl(${260 + (i % 20) * 5}, 80%, 50%),
                            hsl(${300 + (i % 15) * 3}, 85%, 60%))`,
                          boxShadow: `0 0 15px hsla(${270 + (i % 20) * 4}, 80%, 55%, 0.4)`,
                          animation: `audioBarRealistic ${0.4 + (i % 5) * 0.1}s ease-in-out infinite`,
                          animationDelay: `${i * 30}ms`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Visualizer label */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                <span className="text-white/70 text-xs font-medium">{visualizers[activeVisualizer]} Visualizer</span>
              </div>

              {/* Playing indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white/70 text-xs font-medium">Live Preview</span>
              </div>
            </div>
          </div>

          {/* Visualizer Selector Grid */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
            {visualizers.map((name, index) => (
              <button
                key={name}
                className={`aspect-square rounded-xl bg-gradient-to-br from-[#0a0a12] to-[#15151f] border transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden group ${
                  activeVisualizer === index
                    ? "border-purple-500/50 ring-2 ring-purple-500/30 scale-105"
                    : "border-white/10 hover:border-white/20 hover:scale-102"
                }`}
                onClick={() => setActiveVisualizer(index)}
              >
                {/* Mini visualizer preview - unique for each type */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${activeVisualizer === index ? 'opacity-70' : 'opacity-40 group-hover:opacity-50'}`}>
                  {/* Bars - index 0 */}
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-[1px] px-1 pb-2 h-2/3">
                      {Array(5).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{
                            height: `${40 + Math.sin(i * 1.2) * 40}%`,
                            background: `linear-gradient(to top, hsl(${260 + i * 20}, 80%, 50%), hsl(${280 + i * 20}, 90%, 65%))`,
                            animation: `miniBarPulse 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Wave - index 1 */}
                  {index === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <svg viewBox="0 0 40 20" className="w-full h-1/2">
                        <path
                          d="M0,10 Q5,5 10,10 T20,10 T30,10 T40,10"
                          fill="none"
                          stroke="url(#waveGrad)"
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                        <defs>
                          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  )}
                  {/* Pulse - index 2 */}
                  {index === 2 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[1, 2, 3].map((ring) => (
                        <div
                          key={ring}
                          className="absolute rounded-full border border-purple-500/60"
                          style={{
                            width: `${ring * 25}%`,
                            height: `${ring * 25}%`,
                            animation: `miniPulseRing 1.5s ease-out ${ring * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Circle - index 3 */}
                  {index === 3 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-3/4 h-3/4">
                        {Array(8).fill(0).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                            style={{
                              left: `${50 + 35 * Math.cos((i * 45 * Math.PI) / 180)}%`,
                              top: `${50 + 35 * Math.sin((i * 45 * Math.PI) / 180)}%`,
                              transform: 'translate(-50%, -50%)',
                              animation: `miniDotPulse 1s ease-in-out ${i * 0.1}s infinite alternate`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Dots - index 4 */}
                  {index === 4 && (
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-1 p-3">
                      {Array(12).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full"
                          style={{
                            background: `linear-gradient(135deg, hsl(${260 + i * 8}, 70%, 55%), hsl(${280 + i * 8}, 80%, 60%))`,
                            animation: `miniDotPulse 0.6s ease-in-out ${i * 0.05}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Lines - index 5 */}
                  {index === 5 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3">
                      {Array(4).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className="h-[2px] rounded-full"
                          style={{
                            width: `${50 + Math.random() * 40}%`,
                            background: `linear-gradient(90deg, hsl(${260 + i * 25}, 80%, 55%), hsl(${290 + i * 25}, 85%, 60%))`,
                            animation: `miniLineStretch 1s ease-in-out ${i * 0.15}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Lyrics - index 6 */}
                  {index === 6 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="text-[10px] font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"
                        style={{ animation: 'miniLyricsGlow 2s ease-in-out infinite' }}
                      >
                        Aa
                      </div>
                    </div>
                  )}
                </div>
                <span className="relative z-10 text-white font-medium text-[10px] md:text-xs flex items-center gap-1">
                  {name}
                  {name === "Lyrics" && (
                    <span className="px-1 py-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded text-[6px] font-bold uppercase">AI</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes visualizerPulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.7; }
          }
          @keyframes lyricsGlow {
            0%, 100% { text-shadow: 0 0 40px rgba(147, 51, 234, 0.5), 0 0 80px rgba(79, 70, 229, 0.3); }
            50% { text-shadow: 0 0 60px rgba(147, 51, 234, 0.7), 0 0 100px rgba(79, 70, 229, 0.5); }
          }
          @keyframes audioBarRealistic {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.6); }
          }
          @keyframes miniBarPulse {
            0% { transform: scaleY(0.6); }
            100% { transform: scaleY(1); }
          }
          @keyframes miniPulseRing {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(1.2); opacity: 0; }
          }
          @keyframes miniDotPulse {
            0% { transform: scale(0.7); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes miniLineStretch {
            0% { width: 40%; }
            100% { width: 90%; }
          }
          @keyframes miniLyricsGlow {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
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

      {/* Creator Profiles & Community Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4 md:mb-6">
              <Users className="w-4 h-4 text-violet-400" />
              <span className="text-xs md:text-sm font-medium text-violet-300">Connect & Create</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Build Your Creator Profile
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-sm md:text-base">
              Whether you're a producer selling beats, an artist finding sounds, or a creator building an audience - your music deserves a home.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Preview Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0a0a12] to-[#15151f] border border-violet-500/20 relative overflow-hidden">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                  P
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">@prodbyname</h3>
                  <p className="text-white/50 text-sm mb-3">Hip-Hop / Trap / R&B Producer</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/60"><span className="text-white font-bold">1.2K</span> Followers</span>
                    <span className="text-white/60"><span className="text-white font-bold">89</span> Beats</span>
                    <span className="text-white/60"><span className="text-white font-bold">$12.4K</span> Earned</span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <p className="text-lg font-bold text-purple-400">847K</p>
                  <p className="text-xs text-white/40">Total Plays</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <p className="text-lg font-bold text-violet-400">234</p>
                  <p className="text-xs text-white/40">Licenses Sold</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <p className="text-lg font-bold text-green-400">98%</p>
                  <p className="text-xs text-white/40">Rating</p>
                </div>
              </div>

              {/* Recent tracks */}
              <div className="space-y-2">
                {[
                  { title: "Midnight Sessions", plays: "124K", bpm: "140 BPM" },
                  { title: "Dark Type Beat", plays: "89K", bpm: "145 BPM" },
                  { title: "Vibes Only", plays: "67K", bpm: "132 BPM" },
                ].map((track, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{track.title}</p>
                      <p className="text-xs text-white/40">{track.plays} plays · {track.bpm}</p>
                    </div>
                    <div className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-300 font-medium">
                      $29.99
                    </div>
                  </div>
                ))}
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Feature List */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Your Brand, Your Way</h4>
                    <p className="text-sm text-white/50">Custom profile with bio, avatar, banner, genre tags, and social links. Make it unmistakably yours.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Discovery Feed</h4>
                    <p className="text-sm text-white/50">Discover new music through our TikTok-style feed. Find your next favorite artist or get your music heard.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Direct Messaging <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded font-bold">COMING SOON</span></h4>
                    <p className="text-sm text-white/50">Connect with creators directly. Discuss collabs, negotiate custom work, or just share the love.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Real Analytics</h4>
                    <p className="text-sm text-white/50">Track plays, followers, and engagement. Know exactly how your music is performing.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Marketplace <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded font-bold">IN PROGRESS</span></h4>
                    <p className="text-sm text-white/50">Sell beats, buy samples, license music. Creators keep 85% of every sale.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-center">
            <blockquote className="text-lg md:text-xl text-white/80 italic mb-4">
              "Finally a platform that puts creators first. Real tools, real community, real payouts."
            </blockquote>
            <p className="text-white/50 text-sm">— Built by creators who've been there</p>
          </div>
        </div>
      </section>

      {/* How Creators Get Paid Section - Visual Blockchain/Payout */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-green-500/[0.02] to-transparent overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-4 md:mb-6">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs md:text-sm font-medium text-green-300">Transparent Payouts</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              How Creators Get Paid
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              Two ways to earn: sell directly or get paid from streams. Every transaction is transparent and verifiable.
            </p>
          </div>

          {/* Revenue Split Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Direct Sales */}
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0a0a12] to-[#15151f] border border-green-500/20 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Store className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Direct Sales</h3>
                  <p className="text-sm text-white/50">Beats, samples, licenses</p>
                </div>
              </div>

              {/* Visual Split Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">$100 Sale</span>
                  <span className="text-green-400 font-bold">You Keep $85</span>
                </div>
                <div className="h-8 rounded-full overflow-hidden flex bg-white/5">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center text-sm font-bold text-black" style={{ width: '85%' }}>
                    85% Creator
                  </div>
                  <div className="h-full bg-white/10 flex items-center justify-center text-xs text-white/60" style={{ width: '15%' }}>
                    15%
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-white/80">Creator Payout</span>
                  </div>
                  <span className="text-green-400 font-bold">$85.00</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                    <span className="text-white/50">Platform Fee</span>
                  </div>
                  <span className="text-white/50">$10.00</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                    <span className="text-white/50">Payment Processing</span>
                  </div>
                  <span className="text-white/50">$5.00</span>
                </div>
              </div>
            </div>

            {/* Stream Revenue */}
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0a0a12] to-[#15151f] border border-purple-500/20 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Stream Revenue</h3>
                  <p className="text-sm text-white/50">From subscriber pool</p>
                </div>
              </div>

              {/* Visual Split Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">Subscriber Pool</span>
                  <span className="text-purple-400 font-bold">70% to Creators</span>
                </div>
                <div className="h-8 rounded-full overflow-hidden flex bg-white/5">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 flex items-center justify-center text-sm font-bold text-white" style={{ width: '70%' }}>
                    70% Creators
                  </div>
                  <div className="h-full bg-white/10 flex items-center justify-center text-xs text-white/60" style={{ width: '30%' }}>
                    30%
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">1</div>
                  <div>
                    <p className="text-white/80 text-sm">Users subscribe to RHYTHM</p>
                    <p className="text-white/40 text-xs">$9.99/month Premium</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">2</div>
                  <div>
                    <p className="text-white/80 text-sm">70% goes to creator pool</p>
                    <p className="text-white/40 text-xs">Distributed by play count</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">3</div>
                  <div>
                    <p className="text-white/80 text-sm">Monthly payouts via PayPal/bank</p>
                    <p className="text-white/40 text-xs">$50 minimum threshold</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Verification Visual */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-violet-500/10 border border-violet-500/20">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Blockchain Icon */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Blocks className="w-10 h-10 text-purple-400" />
                </div>
              </div>

              {/* Blockchain Chain Visualization */}
              <div className="flex-1 w-full">
                <h4 className="text-lg font-bold text-white mb-2">Blockchain-Verified Transactions</h4>
                <p className="text-white/50 text-sm mb-4">Every sale and payout is recorded on-chain for complete transparency.</p>

                {/* Visual Chain */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {[
                    { label: 'Sale', value: '$29.99', color: 'green' },
                    { label: 'Verify', value: '✓', color: 'purple' },
                    { label: 'Split', value: '85/15', color: 'violet' },
                    { label: 'Record', value: 'Block #', color: 'purple' },
                    { label: 'Payout', value: '$25.49', color: 'green' },
                  ].map((block, i) => (
                    <div key={i} className="flex items-center">
                      <div className={`px-3 py-2 rounded-lg bg-${block.color}-500/20 border border-${block.color}-500/30 text-center min-w-[70px]`}
                           style={{
                             background: block.color === 'green' ? 'rgba(34, 197, 94, 0.2)' :
                                        block.color === 'purple' ? 'rgba(147, 51, 234, 0.2)' :
                                        'rgba(236, 72, 153, 0.2)',
                             borderColor: block.color === 'green' ? 'rgba(34, 197, 94, 0.3)' :
                                         block.color === 'purple' ? 'rgba(147, 51, 234, 0.3)' :
                                         'rgba(236, 72, 153, 0.3)'
                           }}>
                        <p className="text-[10px] text-white/50 uppercase">{block.label}</p>
                        <p className="text-sm font-bold text-white">{block.value}</p>
                      </div>
                      {i < 4 && (
                        <div className="w-4 h-0.5 bg-gradient-to-r from-violet-500/50 to-indigo-500/50" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Compare with other platforms */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl md:text-3xl font-black text-green-400 mb-1">85%</p>
              <p className="text-xs text-white/50">RHYTHM</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl md:text-3xl font-black text-white/30 mb-1">70%</p>
              <p className="text-xs text-white/40">BeatStars</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl md:text-3xl font-black text-white/30 mb-1">80%</p>
              <p className="text-xs text-white/40">Airbit</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-2xl md:text-3xl font-black text-white/30 mb-1">~12%</p>
              <p className="text-xs text-white/40">Spotify</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-purple-500/[0.03] to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4 md:mb-6">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs md:text-sm font-medium text-purple-300">Coming Soon</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              The Future of RHYTHM
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              Features in active development. Building the ultimate platform for creators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {comingSoonFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isInProgress = (feature as any).isInProgress;
              return (
                <div
                  key={index}
                  className={`group p-5 md:p-6 lg:p-8 rounded-2xl border transition-all duration-300 cursor-default relative overflow-hidden ${
                    feature.isLive
                      ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30 hover:border-green-400/50"
                      : isInProgress
                      ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/30 hover:border-yellow-400/50"
                      : "bg-white/[0.03] border-white/10 hover:border-purple-500/30 hover:bg-purple-500/[0.05]"
                  }`}
                >
                  {/* Quarter badge */}
                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    feature.isLive
                      ? "bg-green-500/20 text-green-400"
                      : isInProgress
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-purple-500/20 text-purple-300"
                  }`}>
                    {feature.quarter}
                  </div>
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-all duration-300 ${
                    feature.isLive
                      ? "bg-green-500/20 border border-green-500/30"
                      : isInProgress
                      ? "bg-yellow-500/20 border border-yellow-500/30"
                      : "bg-purple-500/20 border border-purple-500/30"
                  }`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${feature.isLive ? "text-green-400" : isInProgress ? "text-yellow-400" : "text-purple-300"}`} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/50 text-sm md:text-base leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Public Roadmap Section */}
      <section id="roadmap" className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
              <Calendar className="w-4 h-4 text-white/60" />
              <span className="text-xs md:text-sm font-medium text-white/60">Public Roadmap</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Built in Public, Built for You
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              Full transparency on what we're building and when. No hidden agendas.
            </p>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Launched */}
            <div className="p-5 md:p-6 rounded-2xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-green-400">Launched</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roadmapItems.launched.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div className="p-5 md:p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-yellow-400">In Progress (Q1 2025)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roadmapItems.inProgress.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-500 flex-shrink-0 animate-pulse" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Planned */}
            <div className="p-5 md:p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-purple-400">Planned (Q2 2025)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roadmapItems.planned.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <div className="w-3.5 h-3.5 rounded-full border border-purple-500/50 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Future */}
            <div className="p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white/60" />
                </div>
                <h3 className="text-lg font-bold text-white/60">Future (Q3-Q4 2025)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roadmapItems.future.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/40">
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Transparency Section */}
      <section id="transparency" className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent overflow-hidden">
        {/* Animated blockchain background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
          <div className="absolute top-2/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 md:mb-6">
              <Blocks className="w-4 h-4 text-cyan-400" />
              <span className="text-xs md:text-sm font-medium text-cyan-300">Blockchain Transparency</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Every Payout, On-Chain
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-sm md:text-base">
              No hidden fees. No surprise deductions. Every producer payout is recorded on the blockchain
              for complete transparency. Verify any transaction, anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Live Transaction Feed */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0a0a12] to-[#15151f] border border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Payouts
                </h3>
                <span className="text-xs text-white/40">Updating in real-time</span>
              </div>
              <div className="space-y-3">
                {sampleTransactions.map((tx, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                        {tx.producer.charAt(1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{tx.producer}</p>
                        <p className="text-xs text-white/40">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">+${tx.amount}</p>
                      <a
                        href="#"
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        {tx.txHash}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-2 transition-colors">
                View All Transactions
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Transparency Features */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Public Ledger</h4>
                    <p className="text-sm text-white/50">Every payout is recorded on the blockchain. Anyone can verify transactions without compromising privacy.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">85% to Producers</h4>
                    <p className="text-sm text-white/50">Industry-leading split. Producers keep 85% of every sale. Platform takes just 15%.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Automated Licensing</h4>
                    <p className="text-sm text-white/50">Smart contracts handle licensing automatically. Instant PDF delivery with verifiable terms.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">No Middlemen</h4>
                    <p className="text-sm text-white/50">Direct payouts to your wallet or bank. No waiting for monthly statements or hidden processing fees.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <p className="text-2xl md:text-3xl font-black text-white">$0</p>
              <p className="text-xs text-white/40 mt-1">Total Paid Out</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <p className="text-2xl md:text-3xl font-black text-white">0</p>
              <p className="text-xs text-white/40 mt-1">Transactions</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <p className="text-2xl md:text-3xl font-black text-white">85%</p>
              <p className="text-xs text-white/40 mt-1">To Producers</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <p className="text-2xl md:text-3xl font-black text-white">0</p>
              <p className="text-xs text-white/40 mt-1">Hidden Fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
              <DollarSign className="w-4 h-4 text-white/60" />
              <span className="text-xs md:text-sm font-medium text-white/60">Pricing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Start Free. Grow When Ready.
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-sm md:text-base">
              No credit card required. Free forever for personal use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Tier */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                <p className="text-3xl font-black text-white">$0<span className="text-lg font-normal text-white/40">/forever</span></p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-green-500" />
                  Unlimited local tracks
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-green-500" />
                  Full 10-band EQ
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-green-500" />
                  All 7 visualizers
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-green-500" />
                  Cloud sync (50 tracks)
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-green-500" />
                  AI lyrics (5/month)
                </li>
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full py-3 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full text-xs font-bold text-white">
                COMING SOON
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                <p className="text-3xl font-black text-white">$9.99<span className="text-lg font-normal text-white/40">/month</span></p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-purple-400" />
                  Everything in Free
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-purple-400" />
                  Unlimited cloud storage
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-purple-400" />
                  Unlimited AI transcription
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-purple-400" />
                  Sell on marketplace
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-purple-400" />
                  Priority support
                </li>
              </ul>
              <button
                disabled
                className="w-full py-3 bg-white/10 text-white/50 font-semibold rounded-full cursor-not-allowed"
              >
                Coming Q2 2025
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-white/40 mt-6">
            * Marketplace fees separate. Producers keep 85% of all sales.
          </p>
        </div>
      </section>

      {/* About Section - Artist Focused */}
      <section id="about" className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
              <Music className="w-4 h-4 text-purple-400" />
              <span className="text-xs md:text-sm font-medium text-white/60">Our Story</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
              Built By Creators, For Creators
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              We got tired of platforms that take half your earnings, bury your music in algorithms, and treat creators like content machines.
              RHYTHM is what we wished existed when we started - a platform that respects the craft for creators and music lovers alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Fair Revenue Split</h3>
              <p className="text-white/50 text-sm">
                You keep 85% of every sale. No hidden fees, no surprise deductions. Your money hits your account fast.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real Connections</h3>
              <p className="text-white/50 text-sm">
                Not vanity metrics. Real artists discovering your music, real DMs, real collaborations. Build your network organically.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Your Music, Protected</h3>
              <p className="text-white/50 text-sm">
                Watermarking tools, licensing automation, and blockchain-verified payouts. Your intellectual property stays yours.
              </p>
            </div>
          </div>

          {/* The Vision */}
          <div className="mt-12 md:mt-16 p-6 md:p-10 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">The Vision</h3>
                <p className="text-white/60 text-sm md:text-base leading-relaxed mb-4">
                  RHYTHM isn't just another music platform. We're building the infrastructure for the next generation of creators and music lovers.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3 text-white/60">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Direct creator-to-listener relationships</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/60">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Transparent, on-chain payment verification</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/60">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Tools that make selling easier, not harder</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/60">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Community that elevates everyone</span>
                  </li>
                </ul>
              </div>
              <div className="text-center md:text-right">
                <p className="text-5xl md:text-7xl font-black bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent mb-2">
                  85%
                </p>
                <p className="text-white/40 text-sm">goes directly to you</p>
                <p className="text-white/60 mt-4 text-sm">
                  Compare that to 50-70% on other platforms.
                  <br />The math is simple.
                </p>
              </div>
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
          <div className="p-8 md:p-12 rounded-2xl md:rounded-3xl bg-gradient-to-br from-violet-500/15 to-indigo-500/10 border border-violet-500/20 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs md:text-sm font-medium text-white/70">Join the Movement</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
                Your Music. Your Rules.
              </h2>
              <p className="text-white/60 mb-6 md:mb-8 max-w-lg mx-auto text-sm md:text-base">
                Stop letting platforms dictate your worth. Join creators and music lovers who are building on their own terms.
                Free to start. Free to grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onGetStarted}
                  className="group inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Creating Free
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 transition-all"
                >
                  See All Features
                </button>
              </div>
              <p className="text-white/30 text-xs mt-6">No credit card required · Free forever for personal use</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 md:py-16 px-4 md:px-8 lg:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Disc className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black text-white">RHYTHM</span>
              </div>
              <p className="text-white/50 text-sm max-w-sm mb-4">
                Built by creators, for creators. Professional tools, real connections, and an 85% revenue split. The platform we wished existed.
              </p>
              <p className="text-white/40 text-xs italic mb-4">For Creators & Music Lovers ✦ Keep 85%</p>
              <div className="flex items-center gap-3">
                <a href="https://github.com/bydc-cloud/REPLAY" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors">
                  <Github className="w-4 h-4 text-white/70" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors">
                  <Twitter className="w-4 h-4 text-white/70" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors">
                  <Instagram className="w-4 h-4 text-white/70" />
                </a>
                <a href="mailto:support@rhythm.fm" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors">
                  <Mail className="w-4 h-4 text-white/70" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white/70 transition-colors">Features</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('roadmap')} className="hover:text-white/70 transition-colors">Roadmap</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="hover:text-white/70 transition-colors">Pricing</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('transparency')} className="hover:text-white/70 transition-colors">Transparency</button>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>
                  <button onClick={() => scrollToSection('about')} className="hover:text-white/70 transition-colors">About</button>
                </li>
                <li className="hover:text-white/70 transition-colors cursor-default">Blog</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Careers</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Press</li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="hover:text-white/70 transition-colors cursor-default">Terms of Service</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Privacy Policy</li>
                <li className="hover:text-white/70 transition-colors cursor-default">DMCA</li>
                <li className="hover:text-white/70 transition-colors cursor-default">Licensing</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © 2025 RHYTHM. All rights reserved.
            </p>
            <p className="text-xs text-white/30">
              Made with <span className="text-violet-400">♥</span> for producers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
