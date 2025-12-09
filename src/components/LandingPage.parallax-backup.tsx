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
import { WebGLShader } from "./ui/web-gl-shader";
import { LiquidButton } from "./ui/liquid-glass-button";

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

  // Interactive Roadmap Journey - Updated December 2025 - Expanded for investability
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
        'AI-powered lyrics transcription (OpenAI Whisper)',
        'BPM & key detection engine',
        '7 GPU-accelerated visualizer variants'
      ]
    },
    {
      id: 'social',
      title: 'Community',
      date: 'Apr - Jun 2025',
      status: 'completed',
      milestone: 'Social Features',
      items: [
        'Producer profiles with verified badges',
        'Social graph: follows, likes, comments',
        'TikTok-style Discovery feed',
        'Real-time direct messaging',
        'Cross-platform responsive UI'
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
        'Advanced audio effects suite',
        'Custom albums with AI cover generation',
        'Real-time analytics dashboard',
        'Earnings & payout tracking'
      ]
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      date: 'Oct - Dec 2025',
      status: 'current',
      milestone: 'Beat Economy',
      items: [
        'Beat marketplace with smart licensing',
        'Instant preview & one-click purchase',
        'Producer discovery algorithm',
        'SEO-optimized public pages'
      ]
    },
    {
      id: 'monetization',
      title: 'Monetization 2.0',
      date: 'Q1 2026',
      status: 'upcoming',
      milestone: 'Revenue Infrastructure',
      items: [
        'Beat packs & subscription bundles',
        'Multi-tier licensing (lease, exclusive, unlimited)',
        'Blockchain-verified royalty payments',
        'Instant payout to 100+ countries',
        'Tax document automation (1099, W-8)'
      ]
    },
    {
      id: 'ai',
      title: 'AI Studio',
      date: 'Q2 2026',
      status: 'future',
      milestone: 'AI-Powered Creation',
      items: [
        'AI stem separation (vocals, drums, bass)',
        'Intelligent beat recommendations',
        'AI-generated cover art studio',
        'Voice-to-melody conversion',
        'Auto-tagging & genre classification'
      ]
    },
    {
      id: 'mobile',
      title: 'Native Mobile',
      date: 'Q3 2026',
      status: 'future',
      milestone: 'Mobile Apps',
      items: [
        'iOS & Android native apps',
        'Offline mode with sync',
        'Mobile-first beat creation',
        'Push notifications for sales/collabs',
        'Apple Watch / WearOS companion'
      ]
    },
    {
      id: 'enterprise',
      title: 'Enterprise & API',
      date: 'Q4 2026',
      status: 'future',
      milestone: 'B2B Expansion',
      items: [
        'Public API for developers',
        'White-label licensing for labels',
        'Sync licensing marketplace (film/TV/games)',
        'Record label dashboards',
        'Enterprise SSO & team management'
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
    <div className="landing-page min-h-screen bg-[#050505] overflow-x-hidden isolate">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col isolate">
        {/* Static background gradient - no parallax to prevent glitching */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-[#000000]" />

        {/* WebGL shader overlay for premium feel */}
        <div className="absolute inset-0 opacity-35 mix-blend-screen pointer-events-none">
          <WebGLShader className="absolute inset-0" />
        </div>

        {/* Animated background elements - Simplified for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ transform: 'translateZ(0)' }}>
          {/* Single primary gradient orb - reduced blur for performance */}
          <div
            className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-600/[0.08] md:bg-purple-600/[0.10] rounded-full blur-[80px] md:blur-[100px]"
            style={{ animation: 'float 10s ease-in-out infinite', willChange: 'transform' }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-indigo-600/[0.06] md:bg-indigo-600/[0.08] rounded-full blur-[60px] md:blur-[80px]"
            style={{ animation: 'float 12s ease-in-out infinite 3s', willChange: 'transform' }}
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

          {/* Simplified pulsing rings - fewer for performance */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: 'translateZ(0)' }}>
            {[0, 1].map((ring) => (
              <div
                key={ring}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  width: `${200 + ring * 120}px`,
                  height: `${200 + ring * 120}px`,
                  borderColor: `rgba(139, 92, 246, ${0.08 - ring * 0.03})`,
                  animation: `pulseRing ${5 + ring}s ease-out infinite`,
                  animationDelay: `${ring}s`,
                  willChange: 'transform, opacity'
                }}
              />
            ))}
            {[0, 1, 2].map((ring) => (
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
              <LiquidButton
                onClick={onGetStarted}
                className="bg-white text-black font-semibold px-10 md:px-12 py-4 md:py-5 rounded-full shadow-lg shadow-white/10 hover:scale-[1.03] active:scale-[0.98] transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </LiquidButton>

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

      {/* Seamless Gradient Divider - Hero to Platform */}
      <div className="relative h-32 md:h-48 -mt-16 md:-mt-24 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-transparent" />
      </div>

      {/* Platform Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 lg:px-12">
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

      {/* Seamless Gradient Divider - Platform to Discovery */}
      <div className="relative h-24 md:h-32 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-purple-500/[0.04]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-purple-500/[0.06] to-transparent" />
      </div>

      {/* Discovery Feed Showcase - Hero Feature */}
      <section
        ref={mobileDiscoveryReveal.ref}
        className={`relative py-20 md:py-32 px-4 md:px-8 lg:px-12 overflow-hidden transition-all duration-1000 ${
          mobileDiscoveryReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
        {/* Background glow - extended top blending */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-purple-500/[0.05] to-purple-500/[0.02]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/[0.08] rounded-full blur-[120px]" />
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

      {/* Seamless Gradient Divider - Discovery to Features */}
      <div className="relative h-24 md:h-40 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] via-transparent to-transparent" />
      </div>

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

      {/* Seamless Gradient Divider - Features to Visualizer */}
      <div className="relative h-20 md:h-32 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.015] to-purple-500/[0.03]" />
      </div>

      {/* Visualizer Preview Section - REAL PerformantVisualizer Components */}
      <section
        ref={visualizerSectionReveal.ref}
        className={`relative section-apple px-4 md:px-8 lg:px-12 overflow-hidden transition-all duration-1000 ${
          visualizerSectionReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
        {/* Seamless background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-purple-500/[0.02] to-transparent pointer-events-none" />
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

          {/* Revenue Split Visualization - Ultra-Premium Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-16">
            {/* Direct Sales - Premium Tech Card */}
            <div className="group relative">
              {/* Multi-layer glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/15 via-green-400/10 to-emerald-500/15 rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-green-500/40 via-emerald-400/20 to-green-500/40 opacity-60 blur-md group-hover:opacity-80 transition-opacity animate-gradient-x" />

              {/* Main card */}
              <div className="relative rounded-[2rem] bg-[#0a0f14] backdrop-blur-xl border border-green-500/20 p-8 md:p-10 overflow-hidden">
                {/* Corner tech accents */}
                <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-green-500/30 rounded-tl" />
                <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-green-500/30 rounded-tr" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-green-500/30 rounded-bl" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-green-500/30 rounded-br" />

                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'linear-gradient(to right, #22c55e 1px, transparent 1px), linear-gradient(to bottom, #22c55e 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />

                {/* Content */}
                <div className="relative z-10">
                  {/* Premium icon with glow */}
                  <div className="relative inline-block mb-8">
                    <div className="absolute -inset-3 bg-green-500/20 rounded-2xl blur-xl" />
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#0a0f14] flex items-center justify-center border border-green-500/30 shadow-2xl shadow-green-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5" />
                      <Store className="w-8 h-8 md:w-10 md:h-10 text-green-400 relative z-10" />
                    </div>
                    {/* Status indicator */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center animate-pulse shadow-lg shadow-green-500/50">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-3">
                    <span className="text-[10px] font-mono font-medium text-green-300 uppercase tracking-wider">Marketplace</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Direct Sales</h3>
                  <p className="text-white/50 mb-8">Beats, samples, licenses</p>

                  {/* Premium Split Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/60 text-sm font-mono">$100 SALE</span>
                      <span className="text-green-400 font-mono font-bold text-lg">YOU KEEP $85</span>
                    </div>
                    <div className="h-12 md:h-14 rounded-xl overflow-hidden flex bg-[#0d1117] border border-green-500/20 relative">
                      <div className="h-full bg-gradient-to-r from-green-600 via-emerald-500 to-green-400 flex items-center justify-center font-mono font-bold text-black text-sm md:text-base relative overflow-hidden" style={{ width: '85%' }}>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        <span className="relative z-10 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          85% CREATOR
                        </span>
                      </div>
                      <div className="h-full bg-white/5 flex items-center justify-center text-xs font-mono text-white/40 flex-1 border-l border-white/10">
                        15%
                      </div>
                    </div>
                  </div>

                  {/* Breakdown - Tech style */}
                  <div className="space-y-2">
                    {[
                      { label: 'Creator Payout', value: '$85.00', active: true },
                      { label: 'Platform Fee', value: '$10.00', active: false },
                      { label: 'Processing', value: '$5.00', active: false },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 md:p-4 rounded-xl transition-all ${
                        item.active
                          ? 'bg-green-500/10 border border-green-500/20 hover:border-green-500/40'
                          : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${item.active ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-white/20'}`} />
                          <span className={`text-sm font-medium ${item.active ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                        </div>
                        <span className={`font-mono font-bold ${item.active ? 'text-green-400 text-lg' : 'text-white/40 text-sm'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stream Revenue - Premium Tech Card */}
            <div className="group relative">
              {/* Multi-layer glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-violet-500/15 via-indigo-400/10 to-violet-500/15 rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-violet-500/40 via-indigo-400/20 to-violet-500/40 opacity-60 blur-md group-hover:opacity-80 transition-opacity animate-gradient-x" />

              {/* Main card */}
              <div className="relative rounded-[2rem] bg-[#0a0f14] backdrop-blur-xl border border-purple-500/20 p-8 md:p-10 overflow-hidden">
                {/* Corner tech accents */}
                <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-purple-500/30 rounded-tl" />
                <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-purple-500/30 rounded-tr" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-purple-500/30 rounded-bl" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-purple-500/30 rounded-br" />

                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'linear-gradient(to right, #8b5cf6 1px, transparent 1px), linear-gradient(to bottom, #8b5cf6 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />

                {/* Content */}
                <div className="relative z-10">
                  {/* Premium icon with glow */}
                  <div className="relative inline-block mb-8">
                    <div className="absolute -inset-3 bg-purple-500/20 rounded-2xl blur-xl" />
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#0a0f14] flex items-center justify-center border border-purple-500/30 shadow-2xl shadow-purple-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/5" />
                      <Headphones className="w-8 h-8 md:w-10 md:h-10 text-purple-400 relative z-10" />
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
                    <span className="text-[10px] font-mono font-medium text-purple-300 uppercase tracking-wider">Streaming</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Stream Revenue</h3>
                  <p className="text-white/50 mb-8">From subscriber pool</p>

                  {/* Premium Split Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/60 text-sm font-mono">SUBSCRIBER POOL</span>
                      <span className="text-purple-400 font-mono font-bold text-lg">70% TO CREATORS</span>
                    </div>
                    <div className="h-12 md:h-14 rounded-xl overflow-hidden flex bg-[#0d1117] border border-purple-500/20 relative">
                      <div className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-400 flex items-center justify-center font-mono font-bold text-white text-sm md:text-base relative overflow-hidden" style={{ width: '70%' }}>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        <span className="relative z-10">70% CREATORS</span>
                      </div>
                      <div className="h-full bg-white/5 flex items-center justify-center text-xs font-mono text-white/40 flex-1 border-l border-white/10">
                        30%
                      </div>
                    </div>
                  </div>

                  {/* How it works - Tech style steps */}
                  <div className="space-y-2">
                    {[
                      { num: '01', title: 'Users subscribe to Rhythm', sub: '$9.99/month Premium' },
                      { num: '02', title: '70% goes to creator pool', sub: 'Distributed by play count' },
                      { num: '03', title: 'Monthly payouts', sub: '$50 minimum threshold' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 md:p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/[0.02] transition-all">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-mono font-bold text-sm border border-purple-500/20">
                          {step.num}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{step.title}</p>
                          <p className="text-white/40 text-xs font-mono">{step.sub}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-purple-500/40" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Blockchain Verification - Ultra-Tech Design */}
          <div className="max-w-4xl mx-auto mb-16 md:mb-20">
            <div className="group relative">
              {/* Multi-layer glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-emerald-400/15 to-cyan-500/20 rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-cyan-400/20 to-emerald-500/30 rounded-[2rem] blur-md opacity-50 group-hover:opacity-70 transition-opacity animate-gradient-x" />

              <div className="relative rounded-[2rem] bg-[#0a0f14] backdrop-blur-xl border border-cyan-500/20 p-8 md:p-12 lg:p-16 overflow-hidden text-center">
                {/* Hexagonal tech pattern background */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 15v22L30 52 0 37V15z' fill='none' stroke='%2322d3ee' stroke-width='0.5'/%3E%3C/svg%3E")`,
                  backgroundSize: '30px 26px'
                }} />

                {/* Animated scan line */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-pulse" style={{ top: '30%' }} />
                  <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent animate-pulse" style={{ top: '70%', animationDelay: '1s' }} />
                </div>

                {/* Corner accents */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-500/40 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-500/40 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-500/40 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-500/40 rounded-br-lg" />

                <div className="relative z-10">
                  {/* Premium Shield/Lock Icon with 3D effect */}
                  <div className="flex justify-center mb-8">
                    <div className="relative">
                      {/* Outer glow rings */}
                      <div className="absolute -inset-8 rounded-full border border-cyan-500/10 animate-pulse" />
                      <div className="absolute -inset-5 rounded-full border border-emerald-500/15 animate-pulse" style={{ animationDelay: '0.5s' }} />
                      <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 blur-xl" />

                      {/* Main icon container */}
                      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#0a0f14] flex items-center justify-center border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        {/* Inner glow */}
                        <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/5" />
                        <div className="relative flex items-center justify-center">
                          <Shield className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
                          <Lock className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 absolute" />
                        </div>
                      </div>

                      {/* Floating security indicators */}
                      <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Tech typography */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-medium text-cyan-300 uppercase tracking-wider">Immutable Ledger</span>
                  </div>

                  <h4 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-4">
                    Blockchain-<span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Verified</span>
                  </h4>
                  <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
                    Every transaction cryptographically signed and recorded on-chain.
                    <span className="text-cyan-400/80 font-medium"> Tamper-proof. Auditable. Forever.</span>
                  </p>

                  {/* Premium Animated Visual Chain */}
                  <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                    {[
                      { label: 'SALE', value: '$29.99', icon: '💰' },
                      { label: 'HASH', value: '0x7f3a...', icon: '🔐' },
                      { label: 'VERIFY', value: '✓', icon: '✅' },
                      { label: 'SPLIT', value: '85/15', icon: '📊' },
                      { label: 'PAYOUT', value: '$25.49', icon: '💸' },
                    ].map((block, i) => (
                      <div key={i} className="flex items-center">
                        <div className="group/block px-4 md:px-5 py-3 md:py-4 rounded-xl min-w-[80px] md:min-w-[100px] text-center transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-default bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 border border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20">
                          <p className="text-[9px] md:text-[10px] text-cyan-300/60 font-mono uppercase tracking-widest mb-1">{block.label}</p>
                          <p className="text-sm md:text-base font-mono font-bold text-white group-hover/block:text-cyan-300 transition-colors">{block.value}</p>
                        </div>
                        {i < 4 && (
                          <div className="w-4 md:w-6 h-[2px] bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 relative hidden sm:block mx-0.5">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent animate-chain-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Security badges */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Shield className="w-4 h-4 text-emerald-400/60" />
                      <span className="font-mono">256-bit Encryption</span>
                    </div>
                    <div className="hidden md:block w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Lock className="w-4 h-4 text-cyan-400/60" />
                      <span className="font-mono">Smart Contract Audit</span>
                    </div>
                    <div className="hidden md:block w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Blocks className="w-4 h-4 text-violet-400/60" />
                      <span className="font-mono">Decentralized</span>
                    </div>
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

      {/* Seamless Gradient Divider - Payouts to Roadmap */}
      <div className="relative h-24 md:h-40 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.01] via-transparent to-violet-500/[0.02]" />
      </div>

      {/* Premium Curvy Roadmap */}
      <section
        ref={roadmapReveal.ref}
        id="roadmap"
        className={`relative py-20 md:py-32 px-4 md:px-8 lg:px-12 overflow-hidden transition-all duration-1000 ${
          roadmapReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.02] via-violet-500/[0.025] to-violet-500/[0.015] pointer-events-none" />

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

          {/* Desktop: Premium Grid Roadmap with Connecting Lines */}
          <div className="hidden lg:block relative">
            {/* Grid of milestone cards - 2 rows of 4 */}
            <div className="grid grid-cols-4 gap-6 relative">
              {/* Connecting line - horizontal across top row */}
              <div className="absolute top-[72px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-green-500 via-purple-500 to-violet-500/30 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/50 via-purple-500/50 to-violet-500/20 blur-sm" />
              </div>

              {/* Connecting line - vertical on right side */}
              <div className="absolute top-[72px] right-[6%] w-[2px] h-[120px] bg-gradient-to-b from-violet-500/30 to-violet-500/30 z-0" />

              {/* Connecting line - horizontal across bottom row */}
              <div className="absolute bottom-[72px] left-[12%] right-[12%] h-[2px] bg-gradient-to-l from-cyan-500/50 via-blue-500/30 to-violet-500/20 z-0" />

              {roadmapJourney.map((milestone, index) => {
                const isCompleted = milestone.status === 'completed';
                const isCurrent = milestone.status === 'current';
                const isUpcoming = milestone.status === 'upcoming';
                const isFuture = milestone.status === 'future';

                // Determine glow colors based on status
                const statusColors = {
                  completed: { bg: 'bg-green-500/15', border: 'border-green-500/40', glow: 'shadow-green-500/30', text: 'text-green-400', dot: 'bg-green-500' },
                  current: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' },
                  upcoming: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', glow: 'shadow-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-500' },
                  future: { bg: 'bg-white/[0.03]', border: 'border-white/10', glow: '', text: 'text-white/40', dot: 'bg-white/20' }
                };
                const colors = statusColors[milestone.status as keyof typeof statusColors] || statusColors.future;

                return (
                  <div
                    key={milestone.id}
                    className={`relative group cursor-pointer transition-all duration-300 ${
                      activeRoadmapMilestone === milestone.id ? 'scale-[1.02] z-10' : 'hover:scale-[1.01]'
                    }`}
                    onClick={() => setActiveRoadmapMilestone(milestone.id)}
                  >
                    {/* Milestone card */}
                    <div className={`relative p-5 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                      activeRoadmapMilestone === milestone.id
                        ? `${colors.bg} border-2 ${colors.border} shadow-xl ${colors.glow}`
                        : `bg-white/[0.03] border border-white/10 group-hover:bg-white/[0.05] group-hover:border-white/15`
                    }`}>
                      {/* Status dot */}
                      <div className={`absolute -top-2 left-5 w-4 h-4 rounded-full ${colors.dot} ${isCurrent ? 'animate-pulse' : ''} ${isCompleted || isCurrent ? 'shadow-lg' : ''}`}>
                        {isCompleted && <Check className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                      </div>

                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${colors.text}`}>
                        {milestone.date}
                      </p>
                      <h3 className={`text-base font-bold mb-1 ${isFuture ? 'text-white/60' : 'text-white'}`}>{milestone.title}</h3>
                      <p className={`text-xs ${isFuture ? 'text-white/30' : 'text-white/50'}`}>{milestone.milestone}</p>

                      {/* Progress bar for current */}
                      {isCurrent && (
                        <div className="mt-3">
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full w-3/4 relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expanded content on active */}
                      {activeRoadmapMilestone === milestone.id && (
                        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 animate-fade-in">
                          {milestone.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                              {isCompleted ? (
                                <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-yellow-500' : 'bg-white/30'} flex-shrink-0 mt-1.5`} />
                              )}
                              <span>{item}</span>
                            </div>
                          ))}
                          {milestone.items.length > 3 && (
                            <p className="text-[10px] text-white/30 pl-5">+{milestone.items.length - 3} more</p>
                          )}
                        </div>
                      )}
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

      {/* Seamless Gradient Divider - Roadmap to Blockchain */}
      <div className="relative h-24 md:h-40 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.015] via-transparent to-cyan-500/[0.02]" />
      </div>

      {/* Blockchain Transparency Section - Premium Crypto/Tech Vibe */}
      <section
        ref={transparencyReveal.ref}
        id="transparency"
        className={`relative py-20 md:py-32 px-4 md:px-8 lg:px-12 overflow-hidden transition-all duration-1000 ${
          transparencyReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
        {/* Premium Tech Background - Hexagonal Grid Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated gradient base - with top blending */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] via-cyan-500/[0.025] to-emerald-500/[0.02]" />

          {/* Hexagonal grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 15v22L30 52 0 37V15z' fill='none' stroke='%2322d3ee' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 52px'
          }} />

          {/* Animated connecting lines */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="techLine1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <linearGradient id="techLine2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {/* Horizontal scan lines */}
            <line x1="0" y1="20%" x2="100%" y2="20%" stroke="url(#techLine1)" strokeWidth="1">
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="4s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#techLine2)" strokeWidth="1">
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur="5s" repeatCount="indefinite" begin="1s" />
            </line>
            <line x1="0" y1="80%" x2="100%" y2="80%" stroke="url(#techLine1)" strokeWidth="1">
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="6s" repeatCount="indefinite" begin="2s" />
            </line>
          </svg>

          {/* Floating data nodes */}
          <div className="hidden md:block absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-cyan-400/40 animate-pulse" />
          <div className="hidden md:block absolute top-[25%] right-[15%] w-3 h-3 rounded-full bg-emerald-400/30 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="hidden md:block absolute bottom-[20%] left-[20%] w-2 h-2 rounded-full bg-cyan-400/30 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="hidden md:block absolute bottom-[30%] right-[10%] w-2 h-2 rounded-full bg-emerald-400/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Premium Header with Tech Typography */}
          <div className="text-center mb-12 md:mb-20">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 mb-6 md:mb-8">
              <div className="relative">
                <Blocks className="w-5 h-5 text-cyan-400" />
                <div className="absolute inset-0 bg-cyan-400/30 blur-md" />
              </div>
              <span className="text-sm font-mono font-medium text-cyan-300 tracking-wider uppercase">On-Chain Verification</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-6 leading-[0.95] tracking-tight">
              Transparent
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">By Design.</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Every royalty payment verified on-chain. No black boxes.
              <span className="text-cyan-400/80 font-medium"> Zero hidden fees.</span>
            </p>
          </div>

          {/* Main Content - Tech Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 mb-12">
            {/* Live Transaction Feed - Terminal Style */}
            <div className="group relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-emerald-500/10 to-cyan-500/20 rounded-3xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />

              <div className="relative p-6 md:p-8 rounded-2xl bg-[#0a0f14] border border-cyan-500/20 overflow-hidden">
                {/* Terminal header bar */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-500/10">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-xs font-mono text-cyan-400/60">rhythm://transactions/live</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono text-emerald-400">LIVE</span>
                  </div>
                </div>

                {/* Transaction list */}
                <div className="space-y-3">
                  {sampleTransactions.map((tx, i) => (
                    <div
                      key={i}
                      className="group/tx flex items-center justify-between p-3 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/10 hover:border-cyan-500/30 hover:bg-cyan-500/[0.06] transition-all cursor-pointer"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/20 flex items-center justify-center font-mono text-sm font-bold text-cyan-300">
                          {tx.producer.charAt(1).toUpperCase()}{tx.producer.charAt(2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-mono font-medium text-white group-hover/tx:text-cyan-300 transition-colors">{tx.producer}</p>
                          <p className="text-xs font-mono text-white/30">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-mono font-bold text-emerald-400">+${tx.amount}</p>
                        <div className="flex items-center gap-1.5 text-cyan-400/60 group-hover/tx:text-cyan-400 transition-colors">
                          <span className="text-[10px] font-mono">{tx.txHash}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View all button */}
                <button className="w-full mt-6 py-3 text-sm font-mono text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-2 transition-colors rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/[0.05]">
                  <span className="text-cyan-500/60">&gt;</span> View All Transactions
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Transparency Features - Tech Style */}
            <div className="space-y-4">
              {[
                { icon: Eye, title: 'Public Ledger', desc: 'Every payout recorded on-chain. Verify any transaction, anytime.', color: 'cyan' },
                { icon: DollarSign, title: '85% Creator Split', desc: 'Industry-leading revenue share. You keep 85% of every sale.', color: 'emerald' },
                { icon: FileText, title: 'Smart Contracts', desc: 'Automated licensing with instant PDF delivery and verifiable terms.', color: 'cyan' },
                { icon: Link2, title: 'Direct Payouts', desc: 'Instant transfers to wallet or bank. No middlemen, no delays.', color: 'emerald' }
              ].map((feature, i) => {
                const Icon = feature.icon;
                const isEmerald = feature.color === 'emerald';
                return (
                  <div key={i} className="group p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/[0.02] transition-all cursor-default">
                    <div className="flex items-start gap-4">
                      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isEmerald ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-cyan-500/10 border border-cyan-500/20'
                      }`}>
                        <Icon className={`w-6 h-6 ${isEmerald ? 'text-emerald-400' : 'text-cyan-400'}`} />
                        {/* Glow on hover */}
                        <div className={`absolute inset-0 rounded-xl ${isEmerald ? 'bg-emerald-500/20' : 'bg-cyan-500/20'} blur-md opacity-0 group-hover:opacity-60 transition-opacity`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">{feature.title}</h4>
                        <p className="text-sm text-white/50">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats bar - Premium Tech Style */}
          <div className="relative">
            {/* Connecting line above stats */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-8">
              {[
                { value: '$0', label: 'Total Paid Out', prefix: '', color: 'emerald' },
                { value: '0', label: 'Verified Transactions', prefix: '', color: 'cyan' },
                { value: '85%', label: 'To Creators', prefix: '', color: 'emerald' },
                { value: '0', label: 'Hidden Fees', prefix: '$', color: 'cyan' }
              ].map((stat, i) => {
                const isEmerald = stat.color === 'emerald';
                return (
                  <div key={i} className="group p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/20 text-center transition-all">
                    <p className={`text-3xl md:text-4xl font-black font-mono ${
                      isEmerald ? 'text-emerald-400' : 'text-cyan-400'
                    }`}>
                      {stat.prefix}{stat.value}
                    </p>
                    <p className="text-xs md:text-sm text-white/40 mt-2 font-medium uppercase tracking-wider">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA - Crypto Style */}
          <div className="mt-12 md:mt-16 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-emerald-500/5 to-cyan-500/5 border border-cyan-500/20 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-400" />
                <span className="text-white font-semibold">Powered by immutable blockchain technology</span>
              </div>
              <div className="hidden md:block w-px h-6 bg-white/20" />
              <span className="text-cyan-400/80 text-sm font-mono">Transparency you can verify, not just trust</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seamless Gradient Divider - Blockchain to Pricing */}
      <div className="relative h-24 md:h-40 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.015] via-transparent to-transparent" />
      </div>

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
