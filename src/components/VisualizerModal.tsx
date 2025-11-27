import { X, Heart, SkipBack, Play, Pause, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ColorfulVisualizer } from "./ColorfulVisualizer";
import { useSettings } from "../contexts/SettingsContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";

interface VisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisualizerModal = ({ isOpen, onClose }: VisualizerModalProps) => {
  const { visualizerVariant, setVisualizerVariant } = useSettings();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    shuffleMode,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    audioElement
  } = useAudioPlayer();

  const { toggleLike, tracks } = useMusicLibrary();
  const isLiked = currentTrack ? tracks.find(t => t.id === currentTrack.id)?.isLiked || false : false;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const visualizerOptions: Array<"orb" | "spectrum" | "particles" | "galaxy" | "dna" | "radial"> = [
    "orb", "spectrum", "particles", "galaxy", "dna", "radial"
  ];

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeout) clearTimeout(controlsTimeout);
      const timeout = setTimeout(() => setShowControls(false), 3000);
      setControlsTimeout(timeout);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [isOpen, controlsTimeout]);

  // Handle escape key and fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, onClose, togglePlayPause]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const repeatActive = repeatMode !== "off";

  if (!isOpen || !currentTrack) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-black flex flex-col ${!showControls ? 'cursor-none' : 'cursor-auto'}`}
      onMouseMove={() => setShowControls(true)}
    >
      {/* Full-screen Visualizer - Properly Centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          <ColorfulVisualizer
            isPlaying={isPlaying}
            variant={visualizerVariant}
            size="full"
            audioElement={audioElement}
          />
        </div>
      </div>

      {/* Gradient overlays for controls visibility */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.8) 100%)"
        }}
      />

      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 p-6 flex items-center justify-between transition-all duration-500 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{currentTrack.title}</h2>
          <p className="text-white/60">{currentTrack.artist}</p>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
        >
          {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
        </button>
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 transition-all duration-500 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        {/* Visualizer Selector */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {visualizerOptions.map((variant) => (
            <button
              key={variant}
              onClick={() => setVisualizerVariant(variant)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                visualizerVariant === variant
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="relative group">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => seek((Number(e.target.value) / 100) * duration)}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:opacity-0
                [&::-webkit-slider-thumb]:group-hover:opacity-100 [&::-webkit-slider-thumb]:transition-opacity
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
              style={{
                background: `linear-gradient(to right, white 0%, white ${progress}%, rgba(255, 255, 255, 0.2) ${progress}%, rgba(255, 255, 255, 0.2) 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-white/60 tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-xs text-white/60 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={toggleShuffle}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              shuffleMode === "on"
                ? "text-white bg-white/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Shuffle size={20} />
          </button>

          <button
            onClick={playPrevious}
            className="p-3 text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <SkipBack size={28} fill="currentColor" />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-5 bg-white text-black rounded-full hover:scale-105 transition-all shadow-2xl shadow-white/30 cursor-pointer"
          >
            {isPlaying ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button
            onClick={playNext}
            className="p-3 text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <SkipForward size={28} fill="currentColor" />
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              repeatActive
                ? "text-white bg-white/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <RepeatIcon size={20} />
          </button>
        </div>

        {/* Volume & Like */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={() => currentTrack && toggleLike(currentTrack.id)}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isLiked ? "text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <Heart size={24} className={isLiked ? "fill-current" : ""} />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
              className="text-white/60 hover:text-white transition-all cursor-pointer"
            >
              {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="w-24 relative group">
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                style={{
                  background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255, 255, 255, 0.2) ${volume * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center mt-4">
          <p className="text-xs text-white/30">
            Press <span className="text-white/50">F</span> for fullscreen • <span className="text-white/50">Space</span> to play/pause • <span className="text-white/50">Esc</span> to close
          </p>
        </div>
      </div>
    </div>
  );
};
