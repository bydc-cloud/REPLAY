import { useState, useEffect, useRef, useCallback } from "react";
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
  FileText,
  Heart,
  Bookmark,
  Share2,
  Plus,
  Send,
  Home,
  Library,
  User,
  Compass,
  ChevronDown,
  Map
} from "lucide-react";
import { PerformantVisualizer } from "./PerformantVisualizer";

// Custom hook for scroll-triggered animations
const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold, rootMargin: '-30px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Custom hook for animated counter
const useCountUp = (end: number, duration: number = 2000, trigger: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, end, duration]);

  return count;
};

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onBackToApp?: () => void;
  showBackButton?: boolean;
}

// Visualizer variant types for the real PerformantVisualizer
const VISUALIZER_VARIANTS: Array<"bars" | "wave" | "pulse" | "circle" | "dots" | "lines"> = [
  "bars", "wave", "pulse", "circle", "dots", "lines"
];

const VISUALIZER_DESCRIPTIONS: Record<string, string> = {
  bars: "Classic frequency spectrum with rainbow gradient coloring",
  wave: "Flowing waveform that dances to your music",
  pulse: "Bass-reactive concentric rings that breathe with the beat",
  circle: "360° orbital spectrum with rotating particles",
  dots: "Minimalist grid of audio-reactive dots",
  lines: "Horizontal frequency lines with streaming motion",
  lyrics: "AI-transcribed lyrics synced in real-time"
};

export const LandingPage = ({ onGetStarted, onSignIn, onBackToApp, showBackButton }: LandingPageProps) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [activeVisualizer, setActiveVisualizer] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState<string>('');
  const [heroVisualizerIndex, setHeroVisualizerIndex] = useState(0);

  // Scroll reveal refs for Apple-style animations
  const visualizerSectionReveal = useScrollReveal(0.1);
  const featuresSectionReveal = useScrollReveal(0.1);
  const mobileDiscoveryReveal = useScrollReveal(0.15);
  const creatorProfilesReveal = useScrollReveal(0.15);
  const payoutsSectionReveal = useScrollReveal(0.1);
  const comingSoonReveal = useScrollReveal(0.1);
  const roadmapReveal = useScrollReveal(0.1);
  const transparencyReveal = useScrollReveal(0.1);
  const pricingReveal = useScrollReveal(0.1);
  const aboutReveal = useScrollReveal(0.1);
  const ctaReveal = useScrollReveal(0.2);

  // Smooth scroll tracking for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate visualizer preview (slower for Apple-style drama)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVisualizer(prev => (prev + 1) % 7);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Separate auto-rotate for hero visualizer - faster for dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroVisualizerIndex(prev => (prev + 1) % 6);
    }, 2500); // 2.5 seconds - more dynamic
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
      icon: TrendingUp,
      title: "Discovery Feed",
      description: "Full-screen vertical scroll feed for producers. Swipe to discover new beats, get discovered.",
      quarter: "Live Now",
      isLive: true
    },
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
      description: "Follow producers, like tracks, comment, and build your network.",
      quarter: "Live Now",
      isLive: true
    },
    {
      icon: MessageSquare,
      title: "Direct Messages",
      description: "Connect directly with artists and producers for collabs.",
      quarter: "Live Now",
      isLive: true
    },
    {
      icon: Store,
      title: "Beat Marketplace",
      description: "Sell your beats with licensing. Set your prices, keep 85%.",
      quarter: "In Progress",
      isInProgress: true
    },
    {
      icon: Blocks,
      title: "Blockchain Payouts",
      description: "Transparent, verifiable royalty payments on-chain. No hidden fees.",
      quarter: "Q1 2025"
    }
  ];

  // Interactive Roadmap Journey - Updated December 2025
  const roadmapJourney = [
    {
      id: 'foundation',
      title: 'Foundation',
      date: 'Jan - Mar 2025',
      status: 'completed',
      milestone: 'Core Platform Launch',
      items: [
        'Premium music library with cloud sync',
        '10-band parametric EQ with 12 presets',
        'AI-powered lyrics transcription',
        'BPM & key detection',
        '7 audio visualizer variants'
      ]
    },
    {
      id: 'social',
      title: 'Community',
      date: 'Apr - Jun 2025',
      status: 'completed',
      milestone: 'Social Features',
      items: [
        'Producer profiles with uploads',
        'Follows, likes, comments',
        'Full-screen Discovery feed',
        'Direct messaging',
        'Mobile-responsive UI'
      ]
    },
    {
      id: 'creator',
      title: 'Creator Tools',
      date: 'Jul - Sep 2025',
      status: 'completed',
      milestone: 'Pro Features',
      items: [
        'Producer mode with A/B looping',
        'Crossfade & speed control',
        'Custom albums with covers',
        'Analytics dashboard',
        'Earnings tracking'
      ]
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      date: 'Oct - Dec 2025',
      status: 'current',
      milestone: 'Beat Economy',
      items: [
        'Beat marketplace with licensing',
        'Like-to-play instant playback',
        'Landing page optimization',
        'Public producer discovery'
      ]
    },
    {
      id: 'monetization',
      title: 'Monetization',
      date: 'Q1 2026',
      status: 'upcoming',
      milestone: 'Revenue Tools',
      items: [
        'Beat packs & bundles',
        'Custom licensing templates',
        'Blockchain-transparent payouts',
        'Payout request system'
      ]
    },
    {
      id: 'expansion',
      title: 'Expansion',
      date: 'Q2-Q3 2026',
      status: 'future',
      milestone: 'Platform Growth',
      items: [
        'Native mobile apps',
        'Collaboration & split sheets',
        'AI recommendations',
        'Stem separation'
      ]
    }
  ];

  // Track active roadmap milestone for interactivity
  const [activeRoadmapMilestone, setActiveRoadmapMilestone] = useState('marketplace');

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
            <span className="text-lg md:text-xl font-black tracking-tight text-white">Rhythm</span>
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

        {/* Hero Content - Premium Apple-style Layout */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-8 text-center py-8 md:py-12">
          <div className="max-w-5xl w-full">
            {/* Subtle Rhythm Logo - Smaller, top corner feel */}
            <div className="flex items-center justify-center gap-3 mb-8 md:mb-12 animate-hero-enter">
              <div className="relative">
                <div className="absolute inset-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-violet-500/30 blur-lg" />
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-violet-600/40 to-indigo-600/30 backdrop-blur-xl flex items-center justify-center border border-violet-500/40">
                  <Disc className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={1.5} />
                </div>
              </div>
              <span className="text-xl md:text-2xl font-bold text-white tracking-tight">Rhythm</span>
            </div>

            {/* MASSIVE TYPOGRAPHY FIRST - Apple style (headline before product) */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-black text-white mb-4 md:mb-6 leading-[0.9] tracking-[-0.02em] animate-hero-enter">
              For Artists.
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">By Artists.</span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/50 mb-10 md:mb-14 max-w-2xl mx-auto leading-relaxed animate-hero-enter-delay-1">
              The premium music platform that puts creators first.
              <br className="hidden sm:block" />
              <span className="text-white/70 font-medium">Keep 85% of every sale.</span>
            </p>

            {/* HERO VISUALIZER - Product showcase after headline */}
            <div className="w-full max-w-4xl mx-auto mb-10 md:mb-14 animate-scale-in group">
              {/* Outer glow ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-purple-600/10 to-indigo-600/20 rounded-[2rem] blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />

              <div className="relative aspect-[21/9] md:aspect-[2.5/1] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/10 bg-black/60 backdrop-blur-sm shadow-2xl shadow-violet-500/10">
                {/* Premium glow background */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-transparent to-indigo-600/15" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-violet-500/20 rounded-full blur-[100px]" />
                </div>

                {/* Real Visualizer with transition */}
                <div className="absolute inset-0 transition-opacity duration-500">
                  <PerformantVisualizer
                    isPlaying={true}
                    variant={VISUALIZER_VARIANTS[heroVisualizerIndex]}
                    size="full"
                    audioElement={null}
                  />
                </div>

                {/* Subtle vignette for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                {/* Visualizer type indicator */}
                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    {VISUALIZER_VARIANTS[heroVisualizerIndex]}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center px-4 animate-hero-enter-delay-2">
              <button
                onClick={onGetStarted}
                className="group relative flex items-center justify-center gap-2 px-10 md:px-12 py-4 md:py-5 bg-white text-black font-semibold rounded-full transition-all transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden shadow-lg shadow-white/10"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/5 to-transparent" />
                <span className="relative z-10">Get Started Free</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => scrollToSection('features')}
                className="flex items-center justify-center gap-2 px-10 md:px-12 py-4 md:py-5 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 hover:border-white/30 transition-all backdrop-blur-sm"
              >
                Explore Features
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-14 md:mt-20 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-white/40 text-sm animate-hero-enter-delay-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400/70" />
                <span>No Ads Ever</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400/70" />
                <span>7 Visualizers</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400/70" />
                <span>85% Creator Payouts</span>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-scroll-bounce">
            <span className="text-[10px] text-white/25 uppercase tracking-[0.2em]">Scroll</span>
            <ChevronDown className="w-4 h-4 text-white/25" />
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

      {/* Discovery Feed Showcase - Hero Feature */}
      <section
        ref={mobileDiscoveryReveal.ref}
        className={`relative py-20 md:py-32 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-purple-500/[0.03] to-transparent overflow-hidden transition-all duration-1000 ${
          mobileDiscoveryReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/[0.08] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-purple-300">Live Now</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Full-Screen
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Discovery Feed</span>
              </h2>

              <p className="text-lg md:text-xl text-white/60 mb-8 leading-relaxed">
                Swipe through beats like never before. Immersive, full-screen music discovery with real-time audio visualizers and synced lyrics.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-white/80">Audio-reactive visualizers respond to the beat</span>
                </div>
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-pink-400" />
                  </div>
                  <span className="text-white/80">AI-transcribed lyrics sync in real-time</span>
                </div>
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-white/80">Follow artists, like, comment, share</span>
                </div>
              </div>

              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-full hover:from-purple-500 hover:to-indigo-500 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                Try Discovery Feed
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Phone Mockup - Realistic Discovery Feed */}
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative">
                {/* Phone glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-[60px] scale-110" />

                {/* Phone frame - iPhone style */}
                <div className="relative w-[280px] md:w-[300px] h-[580px] md:h-[620px] bg-[#0a0a0a] rounded-[44px] md:rounded-[48px] border-[10px] md:border-[12px] border-[#1a1a1a] shadow-2xl overflow-hidden">
                  {/* Dynamic Island */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] md:w-[100px] h-[28px] md:h-[32px] bg-black rounded-full z-30 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a] mr-6" />
                  </div>

                  {/* Screen content - Full Discovery Feed */}
                  <div className="absolute inset-0 bg-black overflow-hidden">
                    {/* Album art background - blurred and saturated */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div
                        className="absolute inset-0 scale-150 blur-3xl opacity-60"
                        style={{
                          background: 'linear-gradient(135deg, #4c1d95 0%, #be185d 50%, #1e1b4b 100%)',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
                    </div>

                    {/* Header with hamburger and logo */}
                    <div className="absolute top-12 left-0 right-0 px-4 flex items-center justify-between z-20">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="w-4 h-0.5 bg-white/70 rounded-full" />
                          <div className="w-3 h-0.5 bg-white/70 rounded-full" />
                        </div>
                        <span className="text-white font-bold text-sm tracking-tight">Rhythm</span>
                      </div>
                    </div>

                    {/* Feed tabs */}
                    <div className="absolute top-[72px] left-0 right-0 flex items-center justify-center gap-5 z-10">
                      <span className="text-white/40 text-[11px] font-medium">Following</span>
                      <span className="text-white text-[11px] font-bold relative">
                        Discover
                        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                      </span>
                      <span className="text-white/40 text-[11px] font-medium">Beats</span>
                    </div>

                    {/* Top right controls */}
                    <div className="absolute top-[100px] right-3 z-20 flex flex-col gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <Volume2 className="w-3.5 h-3.5 text-white/80" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-purple-500/30 backdrop-blur-sm flex items-center justify-center border border-purple-400/30">
                        <Waves className="w-3.5 h-3.5 text-purple-300" />
                      </div>
                    </div>

                    {/* Center visualizer area */}
                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center px-6">
                      <div className="w-full max-w-[180px] h-32 flex items-end justify-center gap-[3px]">
                        {Array(28).fill(0).map((_, i) => {
                          const centerIndex = 14;
                          const distanceFromCenter = Math.abs(i - centerIndex);
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-full"
                              style={{
                                height: `${30 + Math.sin(i * 0.4) * 50 + Math.random() * 20}%`,
                                background: `linear-gradient(to top, rgba(139, 92, 246, ${0.9 - distanceFromCenter * 0.03}), rgba(236, 72, 153, ${0.7 - distanceFromCenter * 0.02}))`,
                                boxShadow: `0 0 8px rgba(139, 92, 246, 0.4)`,
                                animation: `audioBar ${0.4 + (i % 5) * 0.08}s ease-in-out infinite`,
                                animationDelay: `${i * 40}ms`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Center play button overlay (subtle) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>

                    {/* Right side action buttons - TikTok style */}
                    <div className="absolute right-2.5 bottom-[140px] z-20 flex flex-col items-center gap-3">
                      {/* Profile avatar with follow button */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 bg-gradient-to-br from-violet-500 to-pink-500 p-0.5">
                          <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center">
                            <User className="w-5 h-5 text-zinc-400" />
                          </div>
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center border border-black">
                          <Plus className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                      </div>

                      {/* Like button */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                          <Heart className="w-[18px] h-[18px] text-red-500 fill-red-500" />
                        </div>
                        <span className="text-[9px] font-semibold text-red-400 mt-0.5">2.4K</span>
                      </div>

                      {/* Comment button */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                          <MessageSquare className="w-[18px] h-[18px] text-white" />
                        </div>
                        <span className="text-[9px] font-semibold text-white/70 mt-0.5">128</span>
                      </div>

                      {/* Save button */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center">
                          <Bookmark className="w-[18px] h-[18px] text-violet-400 fill-violet-400" />
                        </div>
                        <span className="text-[9px] font-semibold text-violet-400 mt-0.5">Save</span>
                      </div>

                      {/* Share button */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                          <Send className="w-[18px] h-[18px] text-white" />
                        </div>
                        <span className="text-[9px] font-semibold text-white/70 mt-0.5">Share</span>
                      </div>
                    </div>

                    {/* Bottom track info */}
                    <div className="absolute bottom-[72px] left-3 right-14 z-10">
                      {/* Track title */}
                      <h3 className="text-white font-bold text-[15px] leading-snug mb-0.5">
                        Midnight Waves
                      </h3>
                      {/* Username */}
                      <p className="text-white/70 font-medium text-[11px] mb-1.5">
                        @prodbyrhythm
                      </p>
                      {/* Now playing row */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md overflow-hidden bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
                          <Music className="w-3.5 h-3.5 text-white/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 text-[10px] font-medium truncate">Now Playing</p>
                          <p className="text-white/50 text-[9px] truncate">Future Bass · 128 BPM · E Minor</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Navigation Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around px-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <Home className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                        <span className="text-[9px] text-white/40">Home</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Compass className="w-5 h-5 text-white" strokeWidth={2} />
                        <span className="text-[9px] text-white font-semibold">Discover</span>
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400" />
                      </div>
                      {/* Center create button */}
                      <div className="relative -mt-5">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-md flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/20">
                          <Disc className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Library className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                        <span className="text-[9px] text-white/40">Library</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <User className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                        <span className="text-[9px] text-white/40">Profile</span>
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full z-40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium Teaser Grid */}
      <section
        ref={featuresSectionReveal.ref}
        id="features"
        className={`relative py-20 md:py-32 px-4 md:px-8 lg:px-12 transition-all duration-1000 ${
          featuresSectionReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
        <div className="max-w-6xl mx-auto">
          {/* Premium header */}
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 md:mb-6 leading-[0.95] tracking-tight">
              Built for
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Creators.</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto">
              Professional tools. Beautiful interface. Zero compromise.
            </p>
          </div>

          {/* Featured cards - show top 5 + teaser */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {/* Show first 5 features */}
            {features.slice(0, 5).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all duration-300 cursor-default relative overflow-hidden"
                >
                  {/* Subtle hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-indigo-500/0 group-hover:from-violet-500/5 group-hover:to-indigo-500/5 transition-all duration-500" />

                  {feature.isNew && (
                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                      New
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${
                      feature.isNew
                        ? "bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30"
                        : "bg-white/10 border border-white/10"
                    }`}>
                      <Icon className={`w-6 h-6 md:w-7 md:h-7 ${feature.isNew ? "text-violet-300" : "text-white"}`} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-white/50 text-sm md:text-base leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}

            {/* Blurred teaser card */}
            <div className="group p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden cursor-pointer hover:border-violet-500/30 transition-all duration-300"
                 onClick={() => scrollToSection('all-features')}>
              {/* Blurred content preview */}
              <div className="absolute inset-0 p-6 md:p-8 blur-[6px] opacity-40">
                <div className="w-12 h-12 rounded-xl bg-white/10 mb-5" />
                <div className="h-6 w-3/4 bg-white/10 rounded mb-3" />
                <div className="h-4 w-full bg-white/10 rounded mb-2" />
                <div className="h-4 w-2/3 bg-white/10 rounded" />
              </div>

              {/* Overlay with CTA */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center py-8">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-violet-400" />
                </div>
                <p className="text-lg font-semibold text-white mb-1">+7 More Features</p>
                <p className="text-sm text-white/40 mb-4">Discover everything Rhythm offers</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 group-hover:text-violet-300 transition-colors">
                  Explore All Features
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visualizer Preview Section - REAL PerformantVisualizer Components */}
      <section
        ref={visualizerSectionReveal.ref}
        className={`relative section-apple px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent overflow-hidden transition-all duration-1000 ${
          visualizerSectionReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
        <div className="max-w-6xl mx-auto">
          {/* Apple-style header */}
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 md:mb-8 leading-[0.95] tracking-tight">
              7 Stunning
              <br />
              <span className="text-gradient-animated">Visualizers.</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Audio-reactive. GPU-accelerated. Each one responds to bass, mids, and highs in real-time.
            </p>
          </div>

          {/* Hero Visualizer Preview - Large Featured with REAL component */}
          <div className="mb-10 md:mb-12 relative">
            <div className="aspect-[16/9] md:aspect-[21/9] rounded-3xl md:rounded-[2rem] bg-black border border-white/10 overflow-hidden relative group shadow-2xl shadow-purple-500/10">
              {/* Animated glow background */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-1/4 right-1/4 w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-[35%] h-[35%] bg-pink-500/20 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s' }} />
              </div>

              {/* REAL Visualizer or Lyrics */}
              <div className="absolute inset-0">
                {activeVisualizer === 6 ? (
                  // Lyrics Preview
                  <div className="flex items-center justify-center h-full text-center px-6 md:px-16">
                    <div>
                      <p className="text-white/20 text-sm md:text-xl mb-4 blur-[1px] scale-90">I've been searching for a feeling</p>
                      <p className="text-white font-bold text-3xl md:text-6xl lg:text-7xl" style={{ textShadow: '0 0 60px rgba(147, 51, 234, 0.6), 0 0 120px rgba(79, 70, 229, 0.4)' }}>
                        That I can't seem to find
                      </p>
                      <p className="text-white/20 text-sm md:text-xl mt-4 blur-[1px] scale-90">Running through my mind like water</p>
                    </div>
                  </div>
                ) : (
                  // REAL PerformantVisualizer
                  <PerformantVisualizer
                    isPlaying={true}
                    variant={VISUALIZER_VARIANTS[activeVisualizer]}
                    size="full"
                    audioElement={null}
                  />
                )}
              </div>

              {/* Vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

              {/* Visualizer label - glass pill */}
              <div className="absolute top-5 left-5 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                <span className="text-white/80 text-sm font-medium">{visualizers[activeVisualizer]}</span>
              </div>

              {/* Live indicator */}
              <div className="absolute top-5 right-5 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white/80 text-sm font-medium">Live</span>
              </div>

              {/* Description overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <p className="text-white/70 text-sm md:text-base max-w-xl">
                  {VISUALIZER_DESCRIPTIONS[visualizers[activeVisualizer].toLowerCase()] || VISUALIZER_DESCRIPTIONS.bars}
                </p>
              </div>
            </div>
          </div>

          {/* Visualizer Selector with REAL mini visualizers */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3 md:gap-4">
            {visualizers.map((name, index) => (
              <button
                key={name}
                className={`relative aspect-square rounded-2xl border transition-all duration-500 flex flex-col items-end justify-end p-2 overflow-hidden group ${
                  activeVisualizer === index
                    ? "border-purple-500/60 ring-2 ring-purple-500/30 scale-[1.02] shadow-lg shadow-purple-500/20"
                    : "border-white/10 hover:border-white/20 bg-black/30 hover:bg-black/50"
                }`}
                onClick={() => setActiveVisualizer(index)}
              >
                {/* Real mini visualizer or icon */}
                <div className={`absolute inset-0 transition-all duration-300 ${activeVisualizer === index ? 'opacity-80 scale-100' : 'opacity-50 scale-95 group-hover:opacity-60 group-hover:scale-100'}`}>
                  {index < 6 ? (
                    <PerformantVisualizer
                      isPlaying={activeVisualizer === index}
                      variant={VISUALIZER_VARIANTS[index]}
                      size="sm"
                      audioElement={null}
                    />
                  ) : (
                    // Lyrics icon
                    <div className="flex items-center justify-center h-full">
                      <span className="text-2xl md:text-3xl font-black text-gradient-animated">Aa</span>
                    </div>
                  )}
                </div>

                {/* Label */}
                <span className={`relative z-10 text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-md ${
                  activeVisualizer === index
                    ? 'bg-purple-500/30 text-white'
                    : 'bg-black/50 text-white/70'
                }`}>
                  {name}
                  {name === "Lyrics" && (
                    <span className="ml-1 text-[8px] text-purple-300">AI</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {visualizers.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveVisualizer(index)}
                className={`visualizer-dot ${activeVisualizer === index ? 'active' : ''}`}
              />
            ))}
          </div>

          {/* Keyframe animations for mini visualizer previews */}
          <style>{`
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

      {/* Creator Profiles & Community Section */}
      <section
        ref={creatorProfilesReveal.ref}
        className={`relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent transition-all duration-1000 ${
          creatorProfilesReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
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
                    <p className="text-sm text-white/50">Discover new music through our full-screen vertical scroll feed. Find your next favorite artist or get your music heard.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Direct Messaging <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded font-bold">LIVE</span></h4>
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

          {/* Mission Statement */}
          <div className="mt-12 p-6 md:p-10 rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10 border border-violet-500/20 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-white/60">Our Mission</span>
              </div>
              <blockquote className="text-xl md:text-2xl lg:text-3xl text-white font-bold mb-4 leading-tight">
                Built by artists who wanted something better.
                <br className="hidden md:block" />
                <span className="text-purple-400"> For artists who deserve it.</span>
              </blockquote>
              <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto">
                We're creators too. We built Rhythm because the music industry needed a platform that actually puts artists first — fair payouts, real tools, and a community that celebrates music.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Creators Get Paid Section - Premium Glass Morphism */}
      <section
        ref={payoutsSectionReveal.ref}
        className={`relative section-apple px-4 md:px-8 lg:px-12 overflow-hidden transition-all duration-1000 ${
          payoutsSectionReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/[0.03] to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Apple-style header */}
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 md:mb-8 leading-[0.95] tracking-tight">
              Keep
              <br />
              <span className="text-green-400">85%.</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto leading-relaxed">
              Industry-leading creator payouts. Transparent. Blockchain-verified.
            </p>
          </div>

          {/* Revenue Split Visualization - Premium Glass Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-16">
            {/* Direct Sales - Glass Card */}
            <div className="group relative">
              {/* Animated gradient border */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-green-500/50 via-emerald-400/30 to-green-500/50 opacity-60 blur-sm group-hover:opacity-80 transition-opacity animate-gradient-x" />

              {/* Glass card */}
              <div className="relative rounded-3xl bg-black/80 backdrop-blur-xl border border-green-500/20 p-8 md:p-10 overflow-hidden">
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-green-400/30 animate-float-particle"
                      style={{
                        left: `${15 + i * 14}%`,
                        top: `${25 + (i % 3) * 20}%`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon with glow */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/20 flex items-center justify-center mb-8 border border-green-500/30 shadow-lg shadow-green-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Store className="w-8 h-8 md:w-10 md:h-10 text-green-400" />
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Direct Sales</h3>
                  <p className="text-white/50 mb-8">Beats, samples, licenses</p>

                  {/* Premium Split Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/60 text-lg">$100 Sale</span>
                      <span className="text-green-400 font-bold text-xl">You Keep $85</span>
                    </div>
                    <div className="h-14 rounded-2xl overflow-hidden flex bg-white/5 border border-white/10 relative">
                      <div className="h-full bg-gradient-to-r from-green-600 via-emerald-500 to-green-400 flex items-center justify-center font-bold text-black text-lg relative overflow-hidden" style={{ width: '85%' }}>
                        {/* Animated shine */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <span className="relative z-10">85% Creator</span>
                      </div>
                      <div className="h-full bg-white/10 flex items-center justify-center text-sm text-white/50 flex-1">
                        15%
                      </div>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    {[
                      { label: 'Creator Payout', value: '$85.00', color: 'green', active: true },
                      { label: 'Platform Fee', value: '$10.00', color: 'white/30', active: false },
                      { label: 'Processing', value: '$5.00', color: 'white/20', active: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-green-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.active ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-white/30'}`} />
                          <span className={item.active ? 'text-white' : 'text-white/50'}>{item.label}</span>
                        </div>
                        <span className={`font-bold ${item.active ? 'text-green-400 text-lg' : 'text-white/50'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stream Revenue - Glass Card */}
            <div className="group relative">
              {/* Animated gradient border */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-violet-500/50 via-indigo-400/30 to-violet-500/50 opacity-60 blur-sm group-hover:opacity-80 transition-opacity animate-gradient-x" />

              {/* Glass card */}
              <div className="relative rounded-3xl bg-black/80 backdrop-blur-xl border border-purple-500/20 p-8 md:p-10 overflow-hidden">
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/30 animate-float-particle"
                      style={{
                        left: `${15 + i * 14}%`,
                        top: `${25 + (i % 3) * 20}%`,
                        animationDelay: `${i * 0.6}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon with glow */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-500/20 flex items-center justify-center mb-8 border border-purple-500/30 shadow-lg shadow-purple-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Headphones className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Stream Revenue</h3>
                  <p className="text-white/50 mb-8">From subscriber pool</p>

                  {/* Premium Split Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/60 text-lg">Subscriber Pool</span>
                      <span className="text-purple-400 font-bold text-xl">70% to Creators</span>
                    </div>
                    <div className="h-14 rounded-2xl overflow-hidden flex bg-white/5 border border-white/10">
                      <div className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-400 flex items-center justify-center font-bold text-white text-lg" style={{ width: '70%' }}>
                        70% Creators
                      </div>
                      <div className="h-full bg-white/10 flex items-center justify-center text-sm text-white/50 flex-1">
                        30%
                      </div>
                    </div>
                  </div>

                  {/* How it works - Premium steps */}
                  <div className="space-y-3">
                    {[
                      { num: '1', title: 'Users subscribe to Rhythm', sub: '$9.99/month Premium' },
                      { num: '2', title: '70% goes to creator pool', sub: 'Distributed by play count' },
                      { num: '3', title: 'Monthly payouts via PayPal/bank', sub: '$50 minimum threshold' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition-all">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">
                          {step.num}
                        </div>
                        <div>
                          <p className="text-white font-medium">{step.title}</p>
                          <p className="text-white/40 text-sm">{step.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Blockchain Verification - Centered on Desktop */}
          <div className="max-w-4xl mx-auto mb-16 md:mb-20">
            <div className="group relative">
              {/* Animated gradient border */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-emerald-500/30 via-cyan-400/20 to-emerald-500/30 opacity-50 blur-sm group-hover:opacity-70 transition-opacity animate-gradient-x" />

              <div className="relative rounded-3xl bg-black/60 backdrop-blur-xl border border-emerald-500/20 p-8 md:p-12 lg:p-16 overflow-hidden text-center">
                {/* Subtle grid background */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>

                <div className="relative z-10">
                  {/* 3D Blockchain Icon - Centered */}
                  <div className="flex justify-center mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 flex items-center justify-center border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 transform group-hover:scale-110 transition-transform duration-500">
                        <Blocks className="w-10 h-10 md:w-12 md:h-12 text-emerald-400" />
                      </div>
                      {/* Floating rings */}
                      <div className="absolute -inset-3 rounded-2xl border border-emerald-500/20 animate-pulse" />
                      <div className="absolute -inset-6 rounded-3xl border border-emerald-500/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>
                  </div>

                  <h4 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">Blockchain-Verified</h4>
                  <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                    Every transaction recorded on-chain. Complete transparency, always.
                  </p>

                  {/* Animated Visual Chain - Centered */}
                  <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                    {[
                      { label: 'Sale', value: '$29.99', color: 'emerald' },
                      { label: 'Verify', value: '✓', color: 'cyan' },
                      { label: 'Split', value: '85/15', color: 'teal' },
                      { label: 'Payout', value: '$25.49', color: 'emerald' },
                    ].map((block, i) => (
                      <div key={i} className="flex items-center">
                        <div className="px-5 py-3 rounded-xl min-w-[90px] text-center transform hover:scale-105 transition-all duration-300 cursor-default bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40">
                          <p className="text-[10px] text-emerald-300/60 uppercase tracking-wider mb-1">{block.label}</p>
                          <p className="text-sm font-bold text-white">{block.value}</p>
                        </div>
                        {i < 3 && (
                          <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-500/40 to-cyan-500/40 relative hidden sm:block mx-1">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-chain-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compare with other platforms - Premium Centered */}
          <div className="max-w-3xl mx-auto">
            <p className="text-center text-white/40 text-sm uppercase tracking-wider mb-6">Creator Payout Comparison</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {[
                { platform: 'Rhythm', pct: 85, highlight: true },
                { platform: 'BeatStars', pct: 70, highlight: false },
                { platform: 'Airbit', pct: 80, highlight: false },
                { platform: 'Spotify', pct: 12, prefix: '~', highlight: false },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`p-5 md:p-6 rounded-2xl text-center transition-all duration-300 hover:scale-105 ${
                    item.highlight
                      ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/15'
                      : 'bg-white/[0.02] border border-white/10'
                  }`}
                >
                  <p className={`text-3xl md:text-4xl font-black mb-1 ${
                    item.highlight ? 'text-emerald-400' : 'text-white/25'
                  }`}>
                    {item.prefix || ''}{item.pct}%
                  </p>
                  <p className={`text-xs md:text-sm ${item.highlight ? 'text-emerald-300/70 font-medium' : 'text-white/35'}`}>
                    {item.platform}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium Curvy Roadmap */}
      <section
        ref={roadmapReveal.ref}
        id="roadmap"
        className={`relative py-20 md:py-32 px-4 md:px-8 lg:px-12 overflow-hidden transition-all duration-1000 ${
          roadmapReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />

        <div className="max-w-5xl mx-auto relative">
          {/* Header */}
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-6 leading-[0.95] tracking-tight">
              The <span className="text-gradient-animated">Journey</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-base md:text-lg">
              Building the future of music, one milestone at a time.
            </p>
          </div>

          {/* Desktop: Premium Curvy Path */}
          <div className="hidden lg:block relative">
            {/* SVG Curvy Path */}
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid meet"
              style={{ minHeight: '500px' }}
            >
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
                  <stop offset="40%" stopColor="#a855f7" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#eab308" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="pathGradientActive" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="60%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Background path */}
              <path
                d="M 50,100 C 200,100 200,300 350,300 S 500,100 650,100 S 800,300 950,300"
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8,8"
                opacity="0.4"
              />

              {/* Active/completed path */}
              <path
                d="M 50,100 C 200,100 200,300 350,300 S 500,100 650,100"
                fill="none"
                stroke="url(#pathGradientActive)"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            </svg>

            {/* Milestone Cards positioned along curve */}
            <div className="relative" style={{ minHeight: '500px' }}>
              {roadmapJourney.slice(0, 4).map((milestone, index) => {
                const isCompleted = milestone.status === 'completed';
                const isCurrent = milestone.status === 'current';
                const positions = [
                  { left: '0%', top: '0%' },
                  { left: '28%', top: '45%' },
                  { left: '56%', top: '0%' },
                  { left: '84%', top: '45%' }
                ];
                const pos = positions[index];

                return (
                  <div
                    key={milestone.id}
                    className={`absolute w-56 transition-all duration-500 group cursor-pointer ${
                      activeRoadmapMilestone === milestone.id ? 'scale-105 z-10' : 'hover:scale-102'
                    }`}
                    style={{ left: pos.left, top: pos.top }}
                    onClick={() => setActiveRoadmapMilestone(milestone.id)}
                  >
                    {/* Glowing dot on path */}
                    <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${
                      isCompleted
                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                        : isCurrent
                        ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse'
                        : 'bg-white/20 border-2 border-white/30'
                    }`}>
                      {isCompleted && <Check className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                      {isCurrent && <Zap className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                    </div>

                    {/* Card */}
                    <div className={`ml-6 p-5 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                      activeRoadmapMilestone === milestone.id
                        ? isCompleted
                          ? 'bg-green-500/20 border-2 border-green-500/50 shadow-xl shadow-green-500/20'
                          : isCurrent
                          ? 'bg-yellow-500/20 border-2 border-yellow-500/50 shadow-xl shadow-yellow-500/20'
                          : 'bg-violet-500/20 border-2 border-violet-500/50 shadow-xl shadow-violet-500/20'
                        : 'bg-white/[0.05] border border-white/10 group-hover:bg-white/[0.08] group-hover:border-white/20'
                    }`}>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                        isCompleted ? 'text-green-400' : isCurrent ? 'text-yellow-400' : 'text-violet-400'
                      }`}>
                        {milestone.date}
                      </p>
                      <h3 className="text-lg font-bold text-white mb-1">{milestone.title}</h3>
                      <p className="text-sm text-white/50">{milestone.milestone}</p>

                      {/* Mini progress for current */}
                      {isCurrent && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full w-3/4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Future milestones - faded */}
              {roadmapJourney.slice(4).map((milestone, index) => {
                const positions = [
                  { left: '75%', top: '85%' },
                  { left: '90%', top: '85%' }
                ];
                const pos = positions[index] || { left: '90%', top: '85%' };

                return (
                  <div
                    key={milestone.id}
                    className="absolute opacity-50 hover:opacity-70 transition-opacity cursor-pointer"
                    style={{ left: pos.left, top: pos.top }}
                    onClick={() => setActiveRoadmapMilestone(milestone.id)}
                  >
                    <div className="flex items-center gap-2 text-sm text-white/40">
                      <div className="w-3 h-3 rounded-full border border-white/20" />
                      <span>{milestone.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: Premium Vertical Journey */}
          <div className="lg:hidden relative">
            {/* Curvy vertical path */}
            <svg className="absolute left-6 top-0 w-4 h-full pointer-events-none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mobilePathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d="M 8,0 Q 2,50 8,100 T 8,200 T 8,300 T 8,400 T 8,500 T 8,600"
                fill="none"
                stroke="url(#mobilePathGradient)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <div className="space-y-6 pl-16">
              {roadmapJourney.map((milestone, index) => {
                const isActive = activeRoadmapMilestone === milestone.id;
                const isCompleted = milestone.status === 'completed';
                const isCurrent = milestone.status === 'current';
                const isFuture = milestone.status === 'future' || milestone.status === 'upcoming';

                return (
                  <div
                    key={milestone.id}
                    className="relative"
                    onClick={() => setActiveRoadmapMilestone(milestone.id)}
                  >
                    {/* Node on the path */}
                    <div className={`absolute -left-[52px] top-4 w-5 h-5 rounded-full transition-all ${
                      isCompleted
                        ? 'bg-green-500 shadow-lg shadow-green-500/40'
                        : isCurrent
                        ? 'bg-yellow-500 shadow-lg shadow-yellow-500/40 animate-pulse'
                        : 'bg-white/10 border border-white/30'
                    } ${isActive ? 'scale-125 ring-4 ring-white/20' : ''}`}>
                      {isCompleted && <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                    </div>

                    {/* Card */}
                    <div className={`p-4 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? isCompleted
                          ? 'bg-green-500/15 border border-green-500/40'
                          : isCurrent
                          ? 'bg-yellow-500/15 border border-yellow-500/40'
                          : 'bg-violet-500/15 border border-violet-500/40'
                        : 'bg-white/[0.03] border border-white/10'
                    } ${isFuture ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-xs font-bold uppercase tracking-wider ${
                          isCompleted ? 'text-green-400' : isCurrent ? 'text-yellow-400' : 'text-violet-400/70'
                        }`}>
                          {milestone.date}
                        </p>
                        {isCompleted && <Check className="w-4 h-4 text-green-400" />}
                        {isCurrent && <Zap className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">{milestone.title}</h3>
                      <p className="text-sm text-white/50">{milestone.milestone}</p>

                      {/* Expanded content when active */}
                      {isActive && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                          {milestone.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                              {isCompleted ? (
                                <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                              ) : (
                                <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-yellow-500' : 'bg-white/30'}`} />
                              )}
                              <span>{item}</span>
                            </div>
                          ))}
                          {milestone.items.length > 3 && (
                            <p className="text-xs text-white/40">+{milestone.items.length - 3} more</p>
                          )}
                        </div>
                      )}

                      {/* Progress bar for current */}
                      {isCurrent && isActive && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-white/40">Progress</span>
                            <span className="text-yellow-400 font-bold">75%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full w-3/4 relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom: Currently Building Banner */}
          <div className="mt-12 md:mt-16 p-5 md:p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-violet-500/10 border border-violet-500/20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-4">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">Now Building</span>
            </div>
            <p className="text-white/70 text-sm md:text-base">
              Beat marketplace with licensing • Public producer discovery • Landing page optimization
            </p>
          </div>
        </div>
      </section>

      {/* Blockchain Transparency Section */}
      <section
        ref={transparencyReveal.ref}
        id="transparency"
        className={`relative py-16 md:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent overflow-hidden transition-all duration-1000 ${
          transparencyReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
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
      <section
        ref={pricingReveal.ref}
        id="pricing"
        className={`relative py-16 md:py-24 px-4 md:px-8 lg:px-12 transition-all duration-1000 ${
          pricingReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
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
      <section
        ref={aboutReveal.ref}
        id="about"
        className={`relative py-16 md:py-24 px-4 md:px-8 lg:px-12 transition-all duration-1000 ${
          aboutReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
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
              Rhythm is what we wished existed when we started - a platform that respects the craft for creators and music lovers alike.
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
                  Rhythm isn't just another music platform. We're building the infrastructure for the next generation of creators and music lovers.
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
      <section
        ref={ctaReveal.ref}
        className={`relative py-16 md:py-24 px-4 md:px-8 lg:px-12 transition-all duration-1000 ${
          ctaReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
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
                <span className="text-xl font-black text-white">Rhythm</span>
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
              © 2025 Rhythm. All rights reserved.
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
