import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from "react";

// EQ Frequency bands (10-band)
export const EQ_BANDS = [
  { frequency: 32, label: "32" },
  { frequency: 64, label: "64" },
  { frequency: 125, label: "125" },
  { frequency: 250, label: "250" },
  { frequency: 500, label: "500" },
  { frequency: 1000, label: "1K" },
  { frequency: 2000, label: "2K" },
  { frequency: 4000, label: "4K" },
  { frequency: 8000, label: "8K" },
  { frequency: 16000, label: "16K" },
];

// EQ Presets
export const EQ_PRESETS: Record<string, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bass_boost: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  treble_boost: [0, 0, 0, 0, 0, 2, 4, 5, 6, 6],
  vocal_boost: [-2, -1, 0, 2, 4, 4, 3, 2, 0, -1],
  acoustic: [3, 2, 0, 1, 2, 2, 3, 3, 2, 1],
  electronic: [4, 3, 0, -1, 2, 1, 0, 3, 4, 4],
  rock: [4, 3, 1, 0, -1, 0, 2, 3, 4, 4],
  jazz: [2, 1, 0, 1, 2, 2, 1, 2, 3, 2],
  classical: [3, 2, 0, 0, 0, 0, 0, 2, 3, 3],
  hip_hop: [5, 4, 2, 1, 0, 0, 1, 0, 2, 3],
  pop: [1, 2, 3, 3, 2, 0, 0, 1, 2, 2],
  headphones: [3, 4, 3, 1, -1, 0, 2, 3, 4, 5],
};

export interface EffectSettings {
  enabled: boolean;
  intensity: number; // 0-100
}

interface AudioEffectsContextType {
  // EQ
  eqEnabled: boolean;
  setEqEnabled: (enabled: boolean) => void;
  eqBands: number[]; // -12 to +12 dB for each band
  setEqBand: (index: number, value: number) => void;
  setEqPreset: (presetName: string) => void;
  currentPreset: string | null;
  customPresets: Record<string, number[]>;
  saveCustomPreset: (name: string) => void;
  deleteCustomPreset: (name: string) => void;

  // Effects
  bassBoost: EffectSettings;
  setBassBoost: (settings: Partial<EffectSettings>) => void;
  reverb: EffectSettings;
  setReverb: (settings: Partial<EffectSettings>) => void;
  compressor: EffectSettings;
  setCompressor: (settings: Partial<EffectSettings>) => void;
  stereoEnhancer: EffectSettings;
  setStereoEnhancer: (settings: Partial<EffectSettings>) => void;
  loudnessNormalization: EffectSettings;
  setLoudnessNormalization: (settings: Partial<EffectSettings>) => void;

  // Crossfade
  crossfadeEnabled: boolean;
  setCrossfadeEnabled: (enabled: boolean) => void;
  crossfadeDuration: number; // 0-12 seconds
  setCrossfadeDuration: (seconds: number) => void;

  // Audio chain connection
  connectToAudioElement: (audio: HTMLAudioElement) => void;
  disconnectFromAudioElement: () => void;
}

const AudioEffectsContext = createContext<AudioEffectsContextType | undefined>(undefined);

export const AudioEffectsProvider = ({ children }: { children: ReactNode }) => {
  // EQ State
  const [eqEnabled, setEqEnabledState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("replay-eq-enabled") === "true";
    }
    return false;
  });

  const [eqBands, setEqBands] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-eq-bands");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { }
      }
    }
    return EQ_PRESETS.flat;
  });

  const [currentPreset, setCurrentPreset] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("replay-eq-preset") || "flat";
    }
    return "flat";
  });

  const [customPresets, setCustomPresets] = useState<Record<string, number[]>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-eq-custom-presets");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { }
      }
    }
    return {};
  });

  // Effects State
  const [bassBoost, setBassBoostState] = useState<EffectSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-effect-bass");
      if (saved) return JSON.parse(saved);
    }
    return { enabled: false, intensity: 50 };
  });

  const [reverb, setReverbState] = useState<EffectSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-effect-reverb");
      if (saved) return JSON.parse(saved);
    }
    return { enabled: false, intensity: 30 };
  });

  const [compressor, setCompressorState] = useState<EffectSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-effect-compressor");
      if (saved) return JSON.parse(saved);
    }
    return { enabled: false, intensity: 50 };
  });

  const [stereoEnhancer, setStereoEnhancerState] = useState<EffectSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-effect-stereo");
      if (saved) return JSON.parse(saved);
    }
    return { enabled: false, intensity: 50 };
  });

  const [loudnessNormalization, setLoudnessNormalizationState] = useState<EffectSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-effect-loudness");
      if (saved) return JSON.parse(saved);
    }
    return { enabled: false, intensity: 50 };
  });

  // Crossfade
  const [crossfadeEnabled, setCrossfadeEnabledState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("replay-crossfade-enabled") === "true";
    }
    return false;
  });

  const [crossfadeDuration, setCrossfadeDurationState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-crossfade-duration");
      if (saved) return parseFloat(saved);
    }
    return 3;
  });

  // Audio Nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const stereoRef = useRef<StereoPannerNode | null>(null);
  const connectedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("replay-eq-enabled", eqEnabled.toString());
  }, [eqEnabled]);

  useEffect(() => {
    localStorage.setItem("replay-eq-bands", JSON.stringify(eqBands));
  }, [eqBands]);

  useEffect(() => {
    if (currentPreset) {
      localStorage.setItem("replay-eq-preset", currentPreset);
    }
  }, [currentPreset]);

  useEffect(() => {
    localStorage.setItem("replay-eq-custom-presets", JSON.stringify(customPresets));
  }, [customPresets]);

  useEffect(() => {
    localStorage.setItem("replay-effect-bass", JSON.stringify(bassBoost));
  }, [bassBoost]);

  useEffect(() => {
    localStorage.setItem("replay-effect-reverb", JSON.stringify(reverb));
  }, [reverb]);

  useEffect(() => {
    localStorage.setItem("replay-effect-compressor", JSON.stringify(compressor));
  }, [compressor]);

  useEffect(() => {
    localStorage.setItem("replay-effect-stereo", JSON.stringify(stereoEnhancer));
  }, [stereoEnhancer]);

  useEffect(() => {
    localStorage.setItem("replay-effect-loudness", JSON.stringify(loudnessNormalization));
  }, [loudnessNormalization]);

  useEffect(() => {
    localStorage.setItem("replay-crossfade-enabled", crossfadeEnabled.toString());
  }, [crossfadeEnabled]);

  useEffect(() => {
    localStorage.setItem("replay-crossfade-duration", crossfadeDuration.toString());
  }, [crossfadeDuration]);

  // Apply EQ settings to filters
  const applyEqSettings = useCallback(() => {
    if (!eqEnabled || eqFiltersRef.current.length === 0) return;

    eqFiltersRef.current.forEach((filter, index) => {
      if (filter && eqBands[index] !== undefined) {
        filter.gain.value = eqBands[index];
      }
    });
  }, [eqEnabled, eqBands]);

  // Apply effect settings
  const applyEffects = useCallback(() => {
    // Bass boost
    if (bassFilterRef.current) {
      if (bassBoost.enabled) {
        bassFilterRef.current.gain.value = (bassBoost.intensity / 100) * 12; // 0-12 dB
      } else {
        bassFilterRef.current.gain.value = 0;
      }
    }

    // Compressor
    if (compressorRef.current) {
      if (compressor.enabled) {
        const intensity = compressor.intensity / 100;
        compressorRef.current.threshold.value = -50 + (intensity * 30); // -50 to -20 dB
        compressorRef.current.ratio.value = 4 + (intensity * 8); // 4:1 to 12:1
        compressorRef.current.attack.value = 0.003;
        compressorRef.current.release.value = 0.25;
      } else {
        compressorRef.current.threshold.value = 0;
        compressorRef.current.ratio.value = 1;
      }
    }

    // Stereo enhancer (simple panning effect)
    if (stereoRef.current && stereoEnhancer.enabled) {
      // This is a simplified implementation
      // A real stereo enhancer would use more complex processing
    }
  }, [bassBoost, compressor, stereoEnhancer]);

  // Update effects when settings change
  useEffect(() => {
    applyEqSettings();
  }, [applyEqSettings]);

  useEffect(() => {
    applyEffects();
  }, [applyEffects]);

  // Connect to audio element
  const connectToAudioElement = useCallback((audio: HTMLAudioElement) => {
    // Don't reconnect if already connected to same element
    if (connectedAudioRef.current === audio && audioContextRef.current) {
      return;
    }

    // Clean up previous connection
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch { }
    }

    try {
      // Create new AudioContext
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;

      // Create source from audio element
      sourceRef.current = ctx.createMediaElementSource(audio);

      // Create EQ filters
      eqFiltersRef.current = EQ_BANDS.map(({ frequency }) => {
        const filter = ctx.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = frequency;
        filter.Q.value = 1.4; // Standard Q for parametric EQ
        filter.gain.value = 0;
        return filter;
      });

      // Create bass boost filter
      bassFilterRef.current = ctx.createBiquadFilter();
      bassFilterRef.current.type = "lowshelf";
      bassFilterRef.current.frequency.value = 100;
      bassFilterRef.current.gain.value = 0;

      // Create compressor
      compressorRef.current = ctx.createDynamicsCompressor();
      compressorRef.current.threshold.value = 0;
      compressorRef.current.ratio.value = 1;

      // Create gain node for loudness normalization
      gainRef.current = ctx.createGain();
      gainRef.current.gain.value = 1;

      // Create stereo panner
      stereoRef.current = ctx.createStereoPanner();
      stereoRef.current.pan.value = 0;

      // Connect the chain:
      // Source -> EQ filters (in series) -> Bass -> Compressor -> Gain -> Stereo -> Destination
      let lastNode: AudioNode = sourceRef.current;

      // Connect EQ filters in series
      eqFiltersRef.current.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });

      // Connect other effects
      lastNode.connect(bassFilterRef.current);
      bassFilterRef.current.connect(compressorRef.current);
      compressorRef.current.connect(gainRef.current);
      gainRef.current.connect(stereoRef.current);
      stereoRef.current.connect(ctx.destination);

      connectedAudioRef.current = audio;

      // Apply current settings
      applyEqSettings();
      applyEffects();

      console.log("Audio effects chain connected");
    } catch (e) {
      console.error("Failed to connect audio effects:", e);
    }
  }, [applyEqSettings, applyEffects]);

  const disconnectFromAudioElement = useCallback(() => {
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch { }
      audioContextRef.current = null;
    }
    sourceRef.current = null;
    eqFiltersRef.current = [];
    bassFilterRef.current = null;
    compressorRef.current = null;
    gainRef.current = null;
    stereoRef.current = null;
    connectedAudioRef.current = null;
  }, []);

  // EQ setters
  const setEqEnabled = (enabled: boolean) => {
    setEqEnabledState(enabled);
  };

  const setEqBand = (index: number, value: number) => {
    const clamped = Math.max(-12, Math.min(12, value));
    setEqBands((prev) => {
      const newBands = [...prev];
      newBands[index] = clamped;
      return newBands;
    });
    setCurrentPreset(null); // Mark as custom when manually adjusted
  };

  const setEqPreset = (presetName: string) => {
    const preset = EQ_PRESETS[presetName] || customPresets[presetName];
    if (preset) {
      setEqBands([...preset]);
      setCurrentPreset(presetName);
    }
  };

  const saveCustomPreset = (name: string) => {
    setCustomPresets((prev) => ({
      ...prev,
      [name]: [...eqBands],
    }));
    setCurrentPreset(name);
  };

  const deleteCustomPreset = (name: string) => {
    setCustomPresets((prev) => {
      const newPresets = { ...prev };
      delete newPresets[name];
      return newPresets;
    });
    if (currentPreset === name) {
      setCurrentPreset(null);
    }
  };

  // Effect setters
  const setBassBoost = (settings: Partial<EffectSettings>) => {
    setBassBoostState((prev) => ({ ...prev, ...settings }));
  };

  const setReverb = (settings: Partial<EffectSettings>) => {
    setReverbState((prev) => ({ ...prev, ...settings }));
  };

  const setCompressor = (settings: Partial<EffectSettings>) => {
    setCompressorState((prev) => ({ ...prev, ...settings }));
  };

  const setStereoEnhancer = (settings: Partial<EffectSettings>) => {
    setStereoEnhancerState((prev) => ({ ...prev, ...settings }));
  };

  const setLoudnessNormalization = (settings: Partial<EffectSettings>) => {
    setLoudnessNormalizationState((prev) => ({ ...prev, ...settings }));
  };

  // Crossfade setters
  const setCrossfadeEnabled = (enabled: boolean) => {
    setCrossfadeEnabledState(enabled);
  };

  const setCrossfadeDuration = (seconds: number) => {
    setCrossfadeDurationState(Math.max(0, Math.min(12, seconds)));
  };

  return (
    <AudioEffectsContext.Provider
      value={{
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
        loudnessNormalization,
        setLoudnessNormalization,
        crossfadeEnabled,
        setCrossfadeEnabled,
        crossfadeDuration,
        setCrossfadeDuration,
        connectToAudioElement,
        disconnectFromAudioElement,
      }}
    >
      {children}
    </AudioEffectsContext.Provider>
  );
};

export const useAudioEffects = () => {
  const context = useContext(AudioEffectsContext);
  if (context === undefined) {
    throw new Error("useAudioEffects must be used within an AudioEffectsProvider");
  }
  return context;
};
