import { Settings as SettingsIcon, Sparkles, Check, Sun, Moon, Palette, Keyboard, Info, Heart, Download, Upload, FileJson, CheckCircle2, User, Loader2, Code2, Zap, Trash2, EyeOff, Cloud, CloudOff, Radio } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { PremiumCoverArt } from "./PremiumCoverArt";
import { useSettings } from "../contexts/SettingsContext";
import { useMusicLibrary } from "../contexts/MusicLibraryContext";
import { useAuth } from "../contexts/PostgresAuthContext";

type VisualizerVariant = "none" | "bars" | "wave" | "pulse" | "circle" | "dots" | "lines" | "lyrics";

interface SettingsViewProps {
  selectedVisualizer: VisualizerVariant;
  onVisualizerChange: (variant: VisualizerVariant) => void;
}

export const SettingsView = ({ selectedVisualizer, onVisualizerChange }: SettingsViewProps) => {
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const { themeMode, setThemeMode, developerMode, setDeveloperMode } = useSettings();
  const { tracks, playlists, projectFolders, cleanupTracksWithoutAudio, deleteTracksNeedingReimport, verifyAndCleanupOrphanedB2Tracks, getLocalOnlyTracks, syncLocalTracksToCloud, isSyncingToCloud, cloudSyncProgress, cloudSyncStats } = useMusicLibrary();
  const { user, updateProfile, error: authError, clearError } = useAuth();
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ deleted: number; tracks: string[] } | null>(null);
  const lastUserNameRef = useRef(user?.name);

  // Sync displayName with user.name when user changes (e.g., after login or profile update)
  useEffect(() => {
    // Only sync if user.name actually changed from what we last knew
    if (user?.name && user.name !== lastUserNameRef.current) {
      lastUserNameRef.current = user.name;
      setDisplayName(user.name);
    }
  }, [user?.name]);

  const handleUpdateProfile = async () => {
    if (!displayName.trim() || displayName.trim() === user?.name) return;

    setIsUpdatingProfile(true);
    clearError();

    const success = await updateProfile(displayName.trim());

    if (success) {
      // Update the ref so useEffect doesn't reset the name
      lastUserNameRef.current = displayName.trim();
      setProfileUpdateSuccess(true);
      setTimeout(() => setProfileUpdateSuccess(false), 3000);
    }

    setIsUpdatingProfile(false);
  };

  // Cleanup tracks that need re-importing (stale blob URLs without cloud backup)
  // Also cleans up tracks without any audio data and verifies B2 cloud storage
  const handleCleanupTracks = async () => {
    setIsCleaningUp(true);
    setCleanupResult(null);
    try {
      // First, clean up tracks with stale blob URLs (frontend)
      const result1 = await deleteTracksNeedingReimport();

      // Then, delete tracks without any audio data in the database (file_data IS NULL AND file_key IS NULL)
      const result2 = await cleanupTracksWithoutAudio();

      // Finally, verify B2 cloud storage and remove orphaned tracks
      const result3 = await verifyAndCleanupOrphanedB2Tracks();

      // Combine results
      const totalDeleted = result1.deleted + result2.deleted + result3.deleted;
      const allTracks = [...result1.tracks, ...result2.tracks, ...result3.tracks];

      setCleanupResult({ deleted: totalDeleted, tracks: allTracks });
      setTimeout(() => setCleanupResult(null), 5000);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
    setIsCleaningUp(false);
  };

  // Export library data as JSON
  const handleExportLibrary = () => {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      tracks: tracks.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        isLiked: t.isLiked,
        playCount: t.playCount,
        genre: t.genre,
        artworkUrl: t.artworkUrl,
      })),
      playlists: playlists.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        trackIds: p.trackIds,
      })),
      projectFolders: projectFolders.map(f => ({
        id: f.id,
        name: f.name,
        trackIds: f.trackIds,
        color: f.color,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `replay-library-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // Import library data from JSON
  const handleImportLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target?.result as string);
        // Validate the import data structure
        if (importData.version && importData.tracks) {
          // In a full implementation, you would merge/replace the library data
          // For now, we just show success
          console.log("Import data:", importData);
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        }
      } catch (error) {
        console.error("Failed to parse import file:", error);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const visualizers = [
    {
      variant: "none" as const,
      name: "None",
      description: "No visualizer - show album art or simple player",
      features: ["Minimal", "Low battery", "Clean"],
      gradient: "from-gray-500/20 to-slate-500/20",
      borderGradient: "from-gray-500/50 to-slate-500/50",
      icon: EyeOff
    },
    {
      variant: "bars" as const,
      name: "Bars",
      description: "Classic frequency bars with smooth animation",
      features: ["60fps", "GPU accelerated", "Responsive"],
      gradient: "from-purple-500/20 to-pink-500/20",
      borderGradient: "from-purple-500/50 to-pink-500/50"
    },
    {
      variant: "wave" as const,
      name: "Wave",
      description: "Flowing wave animation with smooth transitions",
      features: ["Smooth motion", "Reactive", "Colorful"],
      gradient: "from-blue-500/20 to-cyan-500/20",
      borderGradient: "from-blue-500/50 to-cyan-500/50"
    },
    {
      variant: "pulse" as const,
      name: "Pulse",
      description: "Pulsing ring visualizer with bass response",
      features: ["Bass reactive", "Concentric rings", "Smooth pulse"],
      gradient: "from-green-500/20 to-emerald-500/20",
      borderGradient: "from-green-500/50 to-emerald-500/50"
    },
    {
      variant: "circle" as const,
      name: "Circle",
      description: "Radial frequency display in 360 degrees",
      features: ["360° spectrum", "Dynamic", "Circular"],
      gradient: "from-indigo-500/20 to-purple-500/20",
      borderGradient: "from-indigo-500/50 to-purple-500/50"
    },
    {
      variant: "dots" as const,
      name: "Dots",
      description: "Grid of reactive dots with minimal design",
      features: ["Minimal", "Clean", "Grid layout"],
      gradient: "from-teal-500/20 to-cyan-500/20",
      borderGradient: "from-teal-500/50 to-cyan-500/50"
    },
    {
      variant: "lines" as const,
      name: "Lines",
      description: "Horizontal frequency lines with gradients",
      features: ["Layered", "Gradient", "Horizontal"],
      gradient: "from-orange-500/20 to-red-500/20",
      borderGradient: "from-orange-500/50 to-red-500/50"
    },
    {
      variant: "lyrics" as const,
      name: "Lyrics",
      description: "Synced lyrics display with real-time transcription",
      features: ["Karaoke mode", "Auto-scroll", "Transcription"],
      gradient: "from-violet-500/20 to-fuchsia-500/20",
      borderGradient: "from-violet-500/50 to-fuchsia-500/50"
    }
  ];

  return (
    <div className="p-4 md:p-8 pt-4 md:pt-8 pb-32 md:pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="text-[var(--replay-off-white)]" size={32} />
          <h1 className="text-3xl md:text-4xl font-black text-[var(--replay-off-white)]">
            Settings
          </h1>
        </div>
        <p className="text-[var(--replay-mid-grey)]">
          Customize your Rhythm experience
        </p>
      </div>

      {/* Profile Settings */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-[var(--replay-off-white)]" size={28} />
            <div>
              <h2 className="text-2xl font-black text-[var(--replay-off-white)]">
                Profile
              </h2>
              <p className="text-sm text-[var(--replay-mid-grey)] mt-1">
                Manage your account settings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Display Name */}
            <div className="p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
              <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                Display Name
              </label>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="flex-1 px-4 py-3 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-xl text-[var(--replay-off-white)] placeholder-[var(--replay-mid-grey)] focus:outline-none focus:border-[var(--replay-off-white)] transition-colors"
                />
                <button
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile || !displayName.trim() || displayName === user?.name}
                  className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center ${
                    profileUpdateSuccess
                      ? "bg-green-500 text-white"
                      : isUpdatingProfile || !displayName.trim() || displayName === user?.name
                      ? "bg-[var(--replay-border)] text-[var(--replay-mid-grey)] cursor-not-allowed"
                      : "bg-[var(--replay-off-white)] text-[var(--replay-black)] hover:scale-105 active:scale-95"
                  }`}
                >
                  {isUpdatingProfile ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : profileUpdateSuccess ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
              {authError && (
                <p className="mt-2 text-sm text-red-400">{authError}</p>
              )}
              <p className="mt-2 text-xs text-[var(--replay-mid-grey)]">
                This name will be shown in your greeting on the home page.
              </p>
            </div>

            {/* Email (Read Only) */}
            <div className="p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
              <label className="block text-sm font-semibold text-[var(--replay-off-white)] mb-2">
                Email
              </label>
              <p className="text-[var(--replay-mid-grey)]">{user?.email || "Not signed in"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Appearance Settings */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="text-[var(--replay-off-white)]" size={28} />
            <div>
              <h2 className="text-2xl font-black text-[var(--replay-off-white)]">
                Appearance
              </h2>
              <p className="text-sm text-[var(--replay-mid-grey)] mt-1">
                Choose your preferred theme
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Dark Mode Button */}
            <button
              onClick={() => setThemeMode("dark")}
              className={`group relative text-left bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                themeMode === "dark"
                  ? "border-[var(--replay-off-white)] ring-2 ring-[var(--replay-off-white)]/20"
                  : "border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)]"
              }`}
            >
              {themeMode === "dark" && (
                <div className="absolute top-3 right-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] rounded-full p-1.5 shadow-lg">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-black to-slate-900 rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl">
                  <Moon className="text-white" size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-black text-[var(--replay-off-white)] mb-1">
                    Dark Mode
                  </h3>
                  <p className="text-xs text-[var(--replay-mid-grey)]">
                    Pure black minimalist theme
                  </p>
                </div>
              </div>
            </button>

            {/* Light Mode Button */}
            <button
              onClick={() => setThemeMode("light")}
              className={`group relative text-left bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                themeMode === "light"
                  ? "border-[var(--replay-off-white)] ring-2 ring-[var(--replay-off-white)]/20"
                  : "border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)]"
              }`}
            >
              {themeMode === "light" && (
                <div className="absolute top-3 right-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] rounded-full p-1.5 shadow-lg">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-100 rounded-2xl border border-gray-300 flex items-center justify-center shadow-2xl">
                  <Sun className="text-gray-900" size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-black text-[var(--replay-off-white)] mb-1">
                    Light Mode
                  </h3>
                  <p className="text-xs text-[var(--replay-mid-grey)]">
                    Clean white minimalist theme
                  </p>
                </div>
              </div>
            </button>

            {/* MP3 Player Mode Button */}
            <button
              onClick={() => setThemeMode("mp3player")}
              className={`group relative text-left bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl col-span-2 md:col-span-1 ${
                themeMode === "mp3player"
                  ? "border-[#00ff88] ring-2 ring-[#00ff88]/20"
                  : "border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)]"
              }`}
            >
              {themeMode === "mp3player" && (
                <div className="absolute top-3 right-3 bg-[#00ff88] text-black rounded-full p-1.5 shadow-lg">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#4a4f57] to-[#2a2d32] rounded-lg border-2 border-[#555a62] flex items-center justify-center shadow-2xl relative overflow-hidden">
                  {/* LCD Screen simulation */}
                  <div className="absolute inset-1 bg-[#1a2820] rounded flex items-center justify-center">
                    <Radio className="text-[#00ff88]" size={24} style={{ filter: 'drop-shadow(0 0 4px #00ff88)' }} />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-black text-[var(--replay-off-white)] mb-1">
                    MP3 Player
                  </h3>
                  <p className="text-xs text-[var(--replay-mid-grey)]">
                    Realistic hardware device look
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[var(--replay-off-white)] font-semibold mb-1">
                  Theme Preferences
                </p>
                <p className="text-xs text-[var(--replay-mid-grey)]">
                  Your theme preference is saved automatically and will persist across sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Mode Section */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Code2 className="text-[var(--replay-off-white)]" size={28} />
            <div>
              <h2 className="text-2xl font-black text-[var(--replay-off-white)]">
                Developer Mode
              </h2>
              <p className="text-sm text-[var(--replay-mid-grey)] mt-1">
                Unlock advanced producer tools and features
              </p>
            </div>
          </div>

          <div className="p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  developerMode
                    ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50"
                    : "bg-[var(--replay-dark-grey)] border border-[var(--replay-border)]"
                }`}>
                  <Zap className={`transition-colors ${developerMode ? "text-purple-400" : "text-[var(--replay-mid-grey)]"}`} size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--replay-off-white)]">
                    Enable Developer Mode
                  </h3>
                  <p className="text-xs text-[var(--replay-mid-grey)]">
                    Access Producer Mode, waveform analysis, BPM detection, and more
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => setDeveloperMode(!developerMode)}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  developerMode
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-[var(--replay-dark-grey)] border border-[var(--replay-border)]"
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${
                  developerMode ? "left-7" : "left-1"
                }`} />
              </button>
            </div>
          </div>

          {/* Developer Mode Features Preview */}
          {developerMode && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: "🎛️", label: "Producer Mode", desc: "Waveform & controls" },
                { icon: "🥁", label: "BPM Detection", desc: "Auto tempo analysis" },
                { icon: "🎵", label: "Key Detection", desc: "Musical key finder" },
                { icon: "🔁", label: "A/B Looping", desc: "Practice sections" },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h4 className="text-xs font-semibold text-[var(--replay-off-white)]">{feature.label}</h4>
                  <p className="text-xs text-[var(--replay-mid-grey)]">{feature.desc}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
            <p className="text-xs text-[var(--replay-mid-grey)] leading-relaxed">
              {developerMode
                ? "🚀 Developer Mode is active! Producer tools are now available in the player view."
                : "Enable Developer Mode to unlock advanced audio analysis tools, waveform visualization, pitch/speed controls, and producer-grade features."}
            </p>
          </div>
        </div>
      </section>

      {/* Visualizer Settings Section */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[var(--replay-off-white)]" size={28} />
              <div>
                <h2 className="text-2xl font-black text-[var(--replay-off-white)]">
                  Audio Visualizer
                </h2>
                <p className="text-sm text-[var(--replay-mid-grey)] mt-1">
                  Choose your favorite visualizer for songs without cover art
                </p>
              </div>
            </div>
          </div>

          {/* Current Selection Preview */}
          <div className="mb-8 p-6 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl border border-[var(--replay-border)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-[var(--replay-mid-grey)] mb-1 uppercase tracking-wider">
                  Currently Active
                </p>
                <p className="text-xl font-black text-[var(--replay-off-white)]">
                  {visualizers.find(v => v.variant === selectedVisualizer)?.name}
                </p>
              </div>
              <button
                onClick={() => setPreviewPlaying(!previewPlaying)}
                className="text-xs text-[var(--replay-off-white)]/70 hover:text-[var(--replay-off-white)] transition-colors bg-[var(--replay-dark-grey)]/60 hover:bg-[var(--replay-dark-grey)] px-4 py-2 rounded-full border border-[var(--replay-border)]"
              >
                {previewPlaying ? "Pause Preview" : "Play Preview"}
              </button>
            </div>
            <div className="flex items-center justify-center py-4">
              <PremiumCoverArt
                isPlaying={previewPlaying}
                size="lg"
                variant={selectedVisualizer}
                demoMode={true}
              />
            </div>
          </div>

          {/* Visualizer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visualizers.map((viz) => {
              const isSelected = selectedVisualizer === viz.variant;
              
              return (
                <button
                  key={viz.variant}
                  onClick={() => onVisualizerChange(viz.variant)}
                  className={`group relative text-left bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-2xl p-5 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    isSelected 
                      ? `border-[var(--replay-off-white)] bg-gradient-to-br ${viz.gradient} ring-2 ring-[var(--replay-off-white)]/20` 
                      : 'border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)]'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-[var(--replay-off-white)] text-[var(--replay-black)] rounded-full p-1.5 shadow-lg">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}

                  {/* Visualizer Preview */}
                  <div className="mb-4 flex items-center justify-center">
                    <div className="w-32 h-32 flex items-center justify-center">
                      {viz.variant === "none" ? (
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-700/50 to-slate-800/50 flex items-center justify-center border border-gray-600/30">
                          <EyeOff className="text-gray-400" size={40} />
                        </div>
                      ) : (
                        <PremiumCoverArt
                          isPlaying={true}
                          size="md"
                          variant={viz.variant}
                          demoMode={true}
                        />
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className={`text-lg font-black mb-2 ${
                      isSelected ? 'text-[var(--replay-off-white)]' : 'text-[var(--replay-off-white)]/90'
                    }`}>
                      {viz.name}
                    </h3>
                    <p className="text-xs text-[var(--replay-mid-grey)] mb-3 line-clamp-2">
                      {viz.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5">
                      {viz.features.map((feature, idx) => (
                        <span 
                          key={idx}
                          className={`text-xs px-2 py-1 rounded-full ${
                            isSelected 
                              ? 'bg-[var(--replay-off-white)]/10 text-[var(--replay-off-white)] border border-[var(--replay-off-white)]/20' 
                              : 'bg-[var(--replay-dark-grey)] text-[var(--replay-mid-grey)] border border-[var(--replay-border)]'
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hover Gradient Border Effect */}
                  {!isSelected && (
                    <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${viz.gradient} -z-10 blur-xl`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Info Footer */}
          <div className="mt-6 p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[var(--replay-off-white)] font-semibold mb-1">
                  Audio-Reactive Technology
                </p>
                <p className="text-xs text-[var(--replay-mid-grey)]">
                  All visualizers respond to real audio frequencies using Web Audio API. 
                  Bass, mid, and treble ranges control different visual elements for a truly immersive experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Settings Sections (Placeholder for future) */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Keyboard className="text-[var(--replay-off-white)]" size={24} />
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">
              Keyboard Shortcuts
            </h2>
          </div>
          
          <div className="space-y-3">
            {[
              { keys: ["Space"], action: "Play / Pause" },
              { keys: ["→"], action: "Next Track" },
              { keys: ["←"], action: "Previous Track" },
              { keys: ["↑"], action: "Volume Up" },
              { keys: ["↓"], action: "Volume Down" },
              { keys: ["Cmd/Ctrl", "K"], action: "Open Search" },
              { keys: ["Cmd/Ctrl", "Q"], action: "Toggle Queue" },
              { keys: ["F"], action: "Toggle Full Screen" },
            ].map((shortcut, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]"
              >
                <span className="text-sm text-[var(--replay-off-white)]">
                  {shortcut.action}
                </span>
                <div className="flex gap-2">
                  {shortcut.keys.map((key, keyIdx) => (
                    <kbd
                      key={keyIdx}
                      className="px-3 py-1 bg-[var(--replay-dark-grey)] border border-[var(--replay-border)] rounded-lg text-xs text-[var(--replay-off-white)] font-mono shadow-sm"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Export/Import Library Section */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileJson className="text-[var(--replay-off-white)]" size={24} />
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">
              Library Data
            </h2>
          </div>

          {/* Hidden file input for import */}
          <input
            type="file"
            ref={importInputRef}
            onChange={handleImportLibrary}
            accept=".json"
            className="hidden"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Button */}
            <button
              onClick={handleExportLibrary}
              className="group relative flex items-center gap-4 p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)] transition-all hover:scale-[1.02]"
            >
              {exportSuccess ? (
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="text-green-500" size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <Download className="text-blue-400" size={24} />
                </div>
              )}
              <div className="text-left">
                <h3 className="text-sm font-semibold text-[var(--replay-off-white)]">
                  {exportSuccess ? "Exported!" : "Export Library"}
                </h3>
                <p className="text-xs text-[var(--replay-mid-grey)]">
                  {exportSuccess
                    ? "Library saved to downloads"
                    : `${tracks.length} tracks, ${playlists.length} playlists`}
                </p>
              </div>
            </button>

            {/* Import Button */}
            <button
              onClick={() => importInputRef.current?.click()}
              className="group relative flex items-center gap-4 p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)] hover:border-[var(--replay-mid-grey)] transition-all hover:scale-[1.02]"
            >
              {importSuccess ? (
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="text-green-500" size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                  <Upload className="text-green-400" size={24} />
                </div>
              )}
              <div className="text-left">
                <h3 className="text-sm font-semibold text-[var(--replay-off-white)]">
                  {importSuccess ? "Imported!" : "Import Library"}
                </h3>
                <p className="text-xs text-[var(--replay-mid-grey)]">
                  {importSuccess
                    ? "Library data imported successfully"
                    : "Restore from backup JSON file"}
                </p>
              </div>
            </button>
          </div>

          <div className="mt-4 p-3 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
            <p className="text-xs text-[var(--replay-mid-grey)] leading-relaxed">
              Export your library to create a backup of your playlists, play counts, and liked songs.
              Import a backup file to restore your library on a new device or after reinstalling.
            </p>
          </div>

          {/* Cleanup Section */}
          <div className="mt-4">
            <button
              onClick={handleCleanupTracks}
              disabled={isCleaningUp}
              className="w-full flex items-center gap-4 p-4 bg-red-500/10 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all hover:bg-red-500/20 disabled:opacity-50"
            >
              {isCleaningUp ? (
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Loader2 className="text-red-400 animate-spin" size={24} />
                </div>
              ) : cleanupResult ? (
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="text-green-500" size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="text-red-400" size={24} />
                </div>
              )}
              <div className="text-left">
                <h3 className="text-sm font-semibold text-[var(--replay-off-white)]">
                  {isCleaningUp ? "Cleaning up..." : cleanupResult ? `Removed ${cleanupResult.deleted} tracks` : "Clean Up Broken Tracks"}
                </h3>
                <p className="text-xs text-[var(--replay-mid-grey)]">
                  {cleanupResult
                    ? cleanupResult.deleted > 0 ? cleanupResult.tracks.join(", ") : "No broken tracks found"
                    : "Remove tracks without audio data that need re-importing"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Cloud Sync Section */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Cloud className="text-[var(--replay-off-white)]" size={24} />
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">
              Cloud Sync
            </h2>
          </div>

          {/* Sync Status */}
          <div className="space-y-4">
            {/* Local tracks count */}
            {(() => {
              const localTracks = getLocalOnlyTracks();
              const localCount = localTracks.length;

              return (
                <>
                  <div className="p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          localCount > 0
                            ? "bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30"
                            : "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
                        }`}>
                          {localCount > 0 ? (
                            <CloudOff className="text-orange-400" size={24} />
                          ) : (
                            <Cloud className="text-green-400" size={24} />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--replay-off-white)]">
                            {localCount > 0 ? `${localCount} Local-Only Tracks` : "All Tracks Synced"}
                          </h3>
                          <p className="text-xs text-[var(--replay-mid-grey)]">
                            {localCount > 0
                              ? "These tracks are stored locally and need to be synced to cloud"
                              : "All your tracks are backed up to the cloud"}
                          </p>
                        </div>
                      </div>
                      {localCount > 0 && !isSyncingToCloud && (
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">
                          Needs Sync
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sync Progress */}
                  {isSyncingToCloud && (
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                          <span className="text-sm font-semibold text-[var(--replay-off-white)]">
                            Syncing to Cloud...
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-400">
                          {cloudSyncProgress}%
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--replay-dark-grey)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${cloudSyncProgress}%` }}
                        />
                      </div>
                      {cloudSyncStats.currentTrack && (
                        <p className="mt-2 text-xs text-[var(--replay-mid-grey)] truncate">
                          Uploading: {cloudSyncStats.currentTrack}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--replay-mid-grey)]">
                        <span>{cloudSyncStats.synced} synced</span>
                        {cloudSyncStats.failed > 0 && (
                          <span className="text-red-400">{cloudSyncStats.failed} failed</span>
                        )}
                        <span>{cloudSyncStats.total - cloudSyncStats.synced - cloudSyncStats.failed} remaining</span>
                      </div>
                    </div>
                  )}

                  {/* Sync Button */}
                  <button
                    onClick={() => syncLocalTracksToCloud()}
                    disabled={isSyncingToCloud || localCount === 0}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      localCount > 0 && !isSyncingToCloud
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 hover:border-blue-500/50 hover:from-blue-500/30 hover:to-purple-500/30"
                        : "bg-[var(--replay-dark-grey)]/60 border-[var(--replay-border)]"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      localCount > 0 && !isSyncingToCloud
                        ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30"
                        : "bg-[var(--replay-dark-grey)]"
                    }`}>
                      {isSyncingToCloud ? (
                        <Loader2 className="text-blue-400 animate-spin" size={24} />
                      ) : (
                        <Cloud className={localCount > 0 ? "text-blue-400" : "text-[var(--replay-mid-grey)]"} size={24} />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-sm font-semibold text-[var(--replay-off-white)]">
                        {isSyncingToCloud
                          ? "Syncing..."
                          : localCount > 0
                            ? `Sync ${localCount} Track${localCount === 1 ? '' : 's'} to Cloud`
                            : "All Tracks Synced"}
                      </h3>
                      <p className="text-xs text-[var(--replay-mid-grey)]">
                        {localCount > 0
                          ? "Upload local tracks to cloud storage for backup"
                          : "Your library is fully backed up"}
                      </p>
                    </div>
                  </button>
                </>
              );
            })()}
          </div>

          <div className="mt-4 p-3 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
            <p className="text-xs text-[var(--replay-mid-grey)] leading-relaxed">
              Cloud sync uploads your local music files to secure cloud storage, allowing you to access
              your music from any device. Tracks are synced one at a time to ensure reliability.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Info className="text-[var(--replay-off-white)]" size={24} />
            <h2 className="text-xl font-black text-[var(--replay-off-white)]">
              About Rhythm
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
              <span className="text-sm text-[var(--replay-mid-grey)]">Version</span>
              <span className="text-sm text-[var(--replay-off-white)]">1.0.0 Premium</span>
            </div>
            
            <div className="p-4 bg-[var(--replay-dark-grey)]/60 backdrop-blur-sm rounded-xl border border-[var(--replay-border)]">
              <p className="text-xs text-[var(--replay-mid-grey)] leading-relaxed">
                Rhythm is a premium local music organizer designed for Mac and Windows. 
                Featuring project-based organization, stunning visualizers, and a minimalist 
                black theme with glassmorphism effects throughout.
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="text-purple-400 mt-0.5 flex-shrink-0" size={16} />
                <p className="text-xs text-[var(--replay-off-white)]">
                  <strong>Premium Features Active:</strong> Audio visualizers, full-screen player, 
                  album art effects, keyboard shortcuts, enhanced cards, queue drawer, 
                  lyrics panel, mini player, advanced search, and smooth transitions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support the Creator Section */}
      <section className="mb-8">
        <div className="bg-[var(--replay-elevated)]/80 backdrop-blur-xl border border-[var(--replay-border)] rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
          {/* Venmo Card */}
          <div className="max-w-md mx-auto">
            {/* Venmo Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center gap-2 mb-3">
                <Heart className="text-pink-400" size={24} />
                <h2 className="text-2xl font-black text-[var(--replay-off-white)]">
                  Support the Creator
                </h2>
              </div>
              <p className="text-sm text-[var(--replay-off-white)]/70">
                Help keep Rhythm alive and support future updates
              </p>
            </div>

            {/* Venmo UI Card */}
            <div className="bg-gradient-to-br from-[#008CFF] to-[#0074D9] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              {/* Venmo Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                {/* Venmo Title */}
                <div className="flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-white tracking-tight">venmo</span>
                </div>

                {/* Profile Section */}
                <div className="flex items-center gap-4 mb-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 flex-shrink-0">
                    <span className="text-2xl font-black text-white">JD</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-black text-white">John Dallas Cox</p>
                    </div>
                    <p className="text-sm text-white/80">@johndallascox</p>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[5, 10, 20].map((amount) => (
                    <a
                      key={amount}
                      href={`https://venmo.com/johndallascox?txn=pay&amount=${amount}&note=Thanks%20for%20Rhythm!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-black rounded-xl py-3 text-center transition-all duration-200 hover:scale-105 active:scale-95 border border-white/30"
                    >
                      ${amount}
                    </a>
                  ))}
                </div>

                {/* Main Pay Button */}
                <a
                  href="https://venmo.com/johndallascox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white hover:bg-gray-100 text-[#008CFF] font-black text-lg rounded-full py-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 mb-3"
                >
                  Pay John Dallas Cox
                </a>

                {/* Custom Amount Link */}
                <a
                  href="https://venmo.com/johndallascox?txn=pay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-white/90 hover:text-white text-sm font-semibold transition-colors"
                >
                  Choose custom amount →
                </a>
              </div>
            </div>

            {/* Footer Message */}
            <div className="mt-6 text-center">
              <p className="text-xs text-[var(--replay-off-white)]/60 leading-relaxed">
                💙 Every contribution is greatly appreciated and helps fund continued development, 
                new features, and improvements to Rhythm. Thank you for your support!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};