import { useState, useRef, useEffect } from "react";
import {
  Shield,
  Upload,
  Play,
  Pause,
  Trash2,
  Settings,
  Volume2,
  Clock,
  Check,
  AlertCircle
} from "lucide-react";

interface WatermarkSettings {
  enabled: boolean;
  audioFile: string | null;
  audioFileName: string | null;
  volume: number; // 0-100
  interval: number; // seconds between watermarks
  fadeIn: number; // ms
  fadeOut: number; // ms
  position: "overlay" | "replace";
}

interface WatermarkPanelProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const WatermarkPanel = ({ isExpanded = false, onToggleExpand }: WatermarkPanelProps) => {
  const [settings, setSettings] = useState<WatermarkSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-watermark-settings");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return {
      enabled: false,
      audioFile: null,
      audioFileName: null,
      volume: 80,
      interval: 30,
      fadeIn: 200,
      fadeOut: 200,
      position: "overlay"
    };
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("replay-watermark-settings", JSON.stringify(settings));
  }, [settings]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings((prev) => ({
          ...prev,
          audioFile: event.target?.result as string,
          audioFileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const playPreview = () => {
    if (!settings.audioFile) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.volume = settings.volume / 100;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(settings.audioFile);
      audio.volume = settings.volume / 100;
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
    }
  };

  const removeWatermark = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setSettings((prev) => ({
      ...prev,
      audioFile: null,
      audioFileName: null,
      enabled: false
    }));
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${settings.enabled ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-[var(--replay-mid-grey)]"}`}>
            <Shield size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-[var(--replay-off-white)]">Producer Tags / Watermarks</h3>
            <p className="text-xs text-[var(--replay-mid-grey)]">
              {settings.enabled && settings.audioFileName
                ? `Active: ${settings.audioFileName}`
                : "Protect your beats with audio tags"}
            </p>
          </div>
        </div>
        <div className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}>
          <svg className="w-5 h-5 text-[var(--replay-mid-grey)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-sm text-[var(--replay-off-white)]">Enable Watermarking</span>
            <button
              onClick={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.enabled ? "bg-purple-500" : "bg-white/20"
              }`}
              disabled={!settings.audioFile}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  settings.enabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Upload Section */}
          <div className="space-y-2">
            <label className="text-sm text-[var(--replay-mid-grey)]">Watermark Audio</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {settings.audioFile ? (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <button
                  onClick={playPreview}
                  className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--replay-off-white)] truncate">{settings.audioFileName}</p>
                  <p className="text-xs text-[var(--replay-mid-grey)]">Click to preview</p>
                </div>
                <button
                  onClick={removeWatermark}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex flex-col items-center gap-2"
              >
                <Upload size={24} className="text-[var(--replay-mid-grey)]" />
                <span className="text-sm text-[var(--replay-mid-grey)]">Upload your producer tag</span>
                <span className="text-xs text-[var(--replay-mid-grey)]/60">MP3, WAV, or OGG</span>
              </button>
            )}
          </div>

          {/* Settings */}
          {settings.audioFile && (
            <div className="space-y-4">
              {/* Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={14} className="text-[var(--replay-mid-grey)]" />
                    <span className="text-sm text-[var(--replay-mid-grey)]">Volume</span>
                  </div>
                  <span className="text-sm font-mono text-purple-400">{settings.volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) => setSettings((prev) => ({ ...prev, volume: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              {/* Interval */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[var(--replay-mid-grey)]" />
                    <span className="text-sm text-[var(--replay-mid-grey)]">Repeat Interval</span>
                  </div>
                  <span className="text-sm font-mono text-purple-400">{settings.interval}s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={settings.interval}
                  onChange={(e) => setSettings((prev) => ({ ...prev, interval: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              {/* Position Mode */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-[var(--replay-mid-grey)]" />
                  <span className="text-sm text-[var(--replay-mid-grey)]">Mixing Mode</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings((prev) => ({ ...prev, position: "overlay" }))}
                    className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.position === "overlay"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-white/5 text-[var(--replay-mid-grey)] border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Overlay
                  </button>
                  <button
                    onClick={() => setSettings((prev) => ({ ...prev, position: "replace" }))}
                    className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.position === "replace"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-white/5 text-[var(--replay-mid-grey)] border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Duck Audio
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                settings.enabled ? "bg-green-500/10 border border-green-500/30" : "bg-yellow-500/10 border border-yellow-500/30"
              }`}>
                {settings.enabled ? (
                  <>
                    <Check size={16} className="text-green-400" />
                    <span className="text-sm text-green-400">Watermarking active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-yellow-400" />
                    <span className="text-sm text-yellow-400">Enable watermarking to protect previews</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
