import { useState } from "react";
import {
  Sliders,
  ChevronDown,
  ChevronUp,
  Power,
  Save,
  Trash2,
  Music,
  Volume2,
  Waves
} from "lucide-react";
import {
  useAudioEffects,
  EQ_BANDS,
  EQ_PRESETS
} from "../contexts/AudioEffectsContext";

interface EqualizerPanelProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const EqualizerPanel = ({ isExpanded = false, onToggleExpand }: EqualizerPanelProps) => {
  const {
    eqEnabled,
    setEqEnabled,
    eqBands,
    setEqBand,
    setEqPreset,
    currentPreset,
    customPresets,
    saveCustomPreset,
    deleteCustomPreset,
    bassBoost,
    setBassBoost,
    reverb,
    setReverb,
    compressor,
    setCompressor,
    stereoEnhancer,
    setStereoEnhancer,
    crossfadeEnabled,
    setCrossfadeEnabled,
    crossfadeDuration,
    setCrossfadeDuration,
  } = useAudioEffects();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [activeTab, setActiveTab] = useState<"eq" | "effects" | "playback">("eq");

  const allPresets = { ...EQ_PRESETS, ...customPresets };
  const presetNames = Object.keys(allPresets);
  const builtInPresetNames = Object.keys(EQ_PRESETS);

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      saveCustomPreset(newPresetName.trim());
      setNewPresetName("");
      setShowSaveDialog(false);
    }
  };

  const formatPresetName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="w-full bg-[var(--replay-elevated)]/95 backdrop-blur-xl border-t border-[var(--replay-border)]">
      {/* Header Toggle */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-2 flex items-center justify-between text-[var(--replay-off-white)] hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Sliders size={18} className={eqEnabled ? "text-purple-400" : "text-[var(--replay-mid-grey)]"} />
          <span className="font-medium text-sm">Audio Effects & Equalizer</span>
          {eqEnabled && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Active
            </span>
          )}
        </div>
        {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-[var(--replay-border)] pb-2">
            <button
              onClick={() => setActiveTab("eq")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "eq"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders size={14} />
                Equalizer
              </div>
            </button>
            <button
              onClick={() => setActiveTab("effects")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "effects"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Waves size={14} />
                Effects
              </div>
            </button>
            <button
              onClick={() => setActiveTab("playback")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "playback"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <Music size={14} />
                Playback
              </div>
            </button>
          </div>

          {/* Equalizer Tab */}
          {activeTab === "eq" && (
            <div className="space-y-4">
              {/* EQ Controls Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Power Toggle */}
                  <button
                    onClick={() => setEqEnabled(!eqEnabled)}
                    className={`p-2 rounded-lg transition-all ${
                      eqEnabled
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-white/5 text-[var(--replay-mid-grey)] border border-white/10 hover:text-[var(--replay-off-white)]"
                    }`}
                  >
                    <Power size={16} />
                  </button>

                  {/* Preset Selector */}
                  <select
                    value={currentPreset || "custom"}
                    onChange={(e) => {
                      if (e.target.value !== "custom") {
                        setEqPreset(e.target.value);
                      }
                    }}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[var(--replay-off-white)] focus:outline-none focus:border-purple-500/50"
                  >
                    {!currentPreset && <option value="custom">Custom</option>}
                    {presetNames.map((name) => (
                      <option key={name} value={name}>
                        {formatPresetName(name)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save/Delete Preset */}
                <div className="flex items-center gap-2">
                  {currentPreset && !builtInPresetNames.includes(currentPreset) && (
                    <button
                      onClick={() => deleteCustomPreset(currentPreset)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete preset"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="p-2 rounded-lg bg-white/5 text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
                    title="Save as preset"
                  >
                    <Save size={14} />
                  </button>
                </div>
              </div>

              {/* Save Preset Dialog */}
              {showSaveDialog && (
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="flex-1 bg-transparent border border-white/10 rounded px-3 py-1.5 text-sm text-[var(--replay-off-white)] focus:outline-none focus:border-purple-500/50"
                    autoFocus
                  />
                  <button
                    onClick={handleSavePreset}
                    className="px-3 py-1.5 rounded bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setNewPresetName("");
                    }}
                    className="px-3 py-1.5 rounded bg-white/10 text-[var(--replay-off-white)] text-sm hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* EQ Sliders */}
              <div className="grid grid-cols-10 gap-2">
                {EQ_BANDS.map((band, index) => (
                  <div key={band.frequency} className="flex flex-col items-center">
                    {/* Slider Track */}
                    <div className="relative h-32 w-6 bg-white/5 rounded-full overflow-hidden">
                      {/* Fill from center */}
                      <div
                        className="absolute left-0 right-0 bg-gradient-to-t from-purple-600 to-purple-400 transition-all"
                        style={{
                          top: eqBands[index] >= 0 ? `${50 - (eqBands[index] / 12) * 50}%` : "50%",
                          bottom: eqBands[index] < 0 ? `${50 - (Math.abs(eqBands[index]) / 12) * 50}%` : "50%",
                          opacity: eqEnabled ? 1 : 0.3,
                        }}
                      />
                      {/* Center line */}
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
                      {/* Slider thumb */}
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="0.5"
                        value={eqBands[index]}
                        onChange={(e) => setEqBand(index, parseFloat(e.target.value))}
                        disabled={!eqEnabled}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ writingMode: "vertical-lr" as const, WebkitAppearance: "slider-vertical" }}
                      />
                      {/* Visual thumb */}
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 w-4 h-2 rounded-full transition-all ${
                          eqEnabled ? "bg-white shadow-lg" : "bg-white/30"
                        }`}
                        style={{
                          top: `${50 - (eqBands[index] / 12) * 50}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    </div>
                    {/* Value */}
                    <span className="text-[10px] text-[var(--replay-mid-grey)] mt-1">
                      {eqBands[index] > 0 ? "+" : ""}{eqBands[index].toFixed(0)}
                    </span>
                    {/* Label */}
                    <span className="text-xs text-[var(--replay-off-white)] font-medium">
                      {band.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* dB Scale */}
              <div className="flex justify-between text-[10px] text-[var(--replay-mid-grey)] px-2">
                <span>+12 dB</span>
                <span>0 dB</span>
                <span>-12 dB</span>
              </div>
            </div>
          )}

          {/* Effects Tab */}
          {activeTab === "effects" && (
            <div className="space-y-4">
              {/* Bass Boost */}
              <EffectControl
                name="Bass Boost"
                icon={<Volume2 size={16} />}
                enabled={bassBoost.enabled}
                intensity={bassBoost.intensity}
                onToggle={() => setBassBoost({ enabled: !bassBoost.enabled })}
                onIntensityChange={(v) => setBassBoost({ intensity: v })}
                description="Enhance low frequencies"
              />

              {/* Reverb */}
              <EffectControl
                name="Reverb"
                icon={<Waves size={16} />}
                enabled={reverb.enabled}
                intensity={reverb.intensity}
                onToggle={() => setReverb({ enabled: !reverb.enabled })}
                onIntensityChange={(v) => setReverb({ intensity: v })}
                description="Add spatial depth"
              />

              {/* Compressor */}
              <EffectControl
                name="Compressor"
                icon={<Sliders size={16} />}
                enabled={compressor.enabled}
                intensity={compressor.intensity}
                onToggle={() => setCompressor({ enabled: !compressor.enabled })}
                onIntensityChange={(v) => setCompressor({ intensity: v })}
                description="Dynamic range control"
              />

              {/* Stereo Enhancer */}
              <EffectControl
                name="Stereo Enhancer"
                icon={<Music size={16} />}
                enabled={stereoEnhancer.enabled}
                intensity={stereoEnhancer.intensity}
                onToggle={() => setStereoEnhancer({ enabled: !stereoEnhancer.enabled })}
                onIntensityChange={(v) => setStereoEnhancer({ intensity: v })}
                description="Widen stereo image"
              />
            </div>
          )}

          {/* Playback Tab */}
          {activeTab === "playback" && (
            <div className="space-y-4">
              {/* Crossfade */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
                      className={`p-2 rounded-lg transition-all ${
                        crossfadeEnabled
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-white/5 text-[var(--replay-mid-grey)] border border-white/10"
                      }`}
                    >
                      <Power size={14} />
                    </button>
                    <div>
                      <h4 className="text-sm font-medium text-[var(--replay-off-white)]">Crossfade</h4>
                      <p className="text-xs text-[var(--replay-mid-grey)]">Smooth transitions between tracks</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-purple-400">{crossfadeDuration}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={crossfadeDuration}
                  onChange={(e) => setCrossfadeDuration(parseInt(e.target.value))}
                  disabled={!crossfadeEnabled}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                    disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-[var(--replay-mid-grey)] mt-1">
                  <span>0s</span>
                  <span>6s</span>
                  <span>12s</span>
                </div>
              </div>

              {/* Gapless Playback Info */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30">
                    <Music size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[var(--replay-off-white)]">Gapless Playback</h4>
                    <p className="text-xs text-[var(--replay-mid-grey)]">Enabled by default for seamless listening</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Effect Control Component
interface EffectControlProps {
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  intensity: number;
  onToggle: () => void;
  onIntensityChange: (value: number) => void;
  description: string;
}

const EffectControl = ({
  name,
  icon,
  enabled,
  intensity,
  onToggle,
  onIntensityChange,
  description,
}: EffectControlProps) => (
  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-all ${
            enabled
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-white/5 text-[var(--replay-mid-grey)] border border-white/10"
          }`}
        >
          {icon}
        </button>
        <div>
          <h4 className="text-sm font-medium text-[var(--replay-off-white)]">{name}</h4>
          <p className="text-xs text-[var(--replay-mid-grey)]">{description}</p>
        </div>
      </div>
      <span className="text-sm font-mono text-purple-400">{intensity}%</span>
    </div>
    <input
      type="range"
      min="0"
      max="100"
      value={intensity}
      onChange={(e) => onIntensityChange(parseInt(e.target.value))}
      disabled={!enabled}
      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500
        [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
        disabled:opacity-50"
    />
  </div>
);
