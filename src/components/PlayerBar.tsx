import { Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Volume2, VolumeX, ListMusic, Minimize2 } from "lucide-react";
import { useState, useRef } from "react";
import { FullScreenPlayer } from "./FullScreenPlayer";
import { VisualizerModal } from "./VisualizerModal";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { PremiumCoverArt } from "./PremiumCoverArt";
import { WaveformProgress } from "./WaveformProgress";
import { useSettings } from "../contexts/SettingsContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useMusicLibrary, getAudioUrl } from "../contexts/MusicLibraryContext";

interface PlayerBarProps {
  onQueueClick?: () => void;
  onMiniPlayerToggle?: () => void;
}

export const PlayerBar = ({ onQueueClick, onMiniPlayerToggle }: PlayerBarProps = {}) => {
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [visualizerModalOpen, setVisualizerModalOpen] = useState(false);
  const { visualizerVariant } = useSettings();

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
    seekForward,
    seekBackward,
    setVolume,
    toggleShuffle,
    cycleRepeatMode
  } = useAudioPlayer();

  const { toggleLike, tracks } = useMusicLibrary();

  // Check if current track is liked
  const isLiked = currentTrack ? tracks.find(t => t.id === currentTrack.id)?.isLiked || false : false;

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

  // Format time
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Swipe gesture state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: togglePlayPause,
    onNext: playNext,
    onPrevious: playPrevious,
    onVolumeUp: () => setVolume(Math.min(1, volume + 0.05)),
    onVolumeDown: () => setVolume(Math.max(0, volume - 0.05)),
    onMute: () => setVolume(volume > 0 ? 0 : 0.7),
    onLike: () => currentTrack && toggleLike(currentTrack.id),
    onSeekForward: () => seekForward(5),
    onSeekBackward: () => seekBackward(5),
    onShuffle: toggleShuffle,
    onRepeat: cycleRepeatMode,
  });

  // Get audio URL for waveform
  const audioUrl = currentTrack ? getAudioUrl(currentTrack) : undefined;

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const diff = touchEndX.current - touchStartX.current;
    if (Math.abs(diff) < 100) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    const threshold = 50;

    if (swipeDistance > threshold) {
      playPrevious();
    } else if (swipeDistance < -threshold) {
      playNext();
    }

    setSwipeOffset(0);
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    seek((newProgress / 100) * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value) / 100);
  };

  // Get repeat icon
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const repeatActive = repeatMode !== "off";

  // If no track, show placeholder
  if (!currentTrack) {
    return (
      <>
        {/* Mobile: Compact Player Footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--replay-elevated)]/95 backdrop-blur-md border-t border-[var(--replay-border)] z-50">
          <div className="px-4 py-4 text-center">
            <p className="text-sm text-[var(--replay-mid-grey)]">No track playing</p>
            <p className="text-xs text-[var(--replay-mid-grey)]/60 mt-1">Import music to get started</p>
          </div>
        </div>

        {/* Desktop: Full Player Bar */}
        <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0a]/98 via-[#1a1a1a]/98 to-[#0a0a0a]/98 backdrop-blur-2xl border-t border-white/5 z-50 items-center justify-center">
          <p className="text-sm text-[var(--replay-mid-grey)]">No track playing - Import music to get started</p>
        </div>
      </>
    );
  }

  return (
    <>
      <FullScreenPlayer
        isOpen={fullScreenOpen}
        onClose={() => setFullScreenOpen(false)}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        liked={isLiked}
        onLike={() => toggleLike(currentTrack.id)}
        progress={progress}
        onProgressChange={(p) => seek((p / 100) * duration)}
        volume={volumePercent}
        onVolumeChange={(v) => setVolume(v / 100)}
      />

      <VisualizerModal
        isOpen={visualizerModalOpen}
        onClose={() => setVisualizerModalOpen(false)}
      />

      {/* Mobile: Compact Player Footer */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--replay-elevated)]/95 backdrop-blur-md border-t border-[var(--replay-border)] z-50 overflow-hidden"
      >
        {/* Ultra Thin Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-[var(--replay-off-white)] to-[var(--replay-off-white)]/60"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Swipeable Content Wrapper */}
        <div
          className="px-4 py-3 transition-transform duration-200"
          style={{ transform: `translateX(${swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setFullScreenOpen(true)}
        >
          {/* Album Art & Song Info */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden shadow-xl bg-[var(--replay-dark-grey)]">
              {currentTrack.artworkUrl || currentTrack.artworkData ? (
                <img
                  src={currentTrack.artworkUrl || currentTrack.artworkData}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PremiumCoverArt isPlaying={isPlaying} size="sm" variant={visualizerVariant} />
              )}
            </div>

            <div className="flex-1 min-w-0 text-center">
              <h4 className="font-semibold text-[var(--replay-off-white)] truncate text-sm">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-[var(--replay-mid-grey)] truncate">
                {currentTrack.artist} • {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(currentTrack.id);
              }}
              className={`p-2 rounded-lg transition-all duration-300 flex-shrink-0 ${
                isLiked
                  ? "text-[var(--replay-off-white)] bg-white/10"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
            >
              <Heart size={18} className={isLiked ? "fill-current" : ""} />
            </button>
          </div>

          {/* Centered Playback Controls */}
          <div
            className="flex items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`transition-all p-2 rounded-lg ${
                shuffleMode === "on"
                  ? "text-[var(--replay-off-white)]"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
            >
              <Shuffle size={18} />
            </button>

            {/* Previous */}
            <button
              onClick={playPrevious}
              className="text-[var(--replay-off-white)] hover:opacity-70 transition-all p-2 rounded-lg active:scale-95"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>

            {/* Play/Pause - Large */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="bg-gradient-to-br from-[var(--replay-off-white)] to-[var(--replay-off-white)]/80 hover:from-[var(--replay-off-white)] hover:to-[var(--replay-off-white)] text-[var(--replay-black)] rounded-xl p-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-[var(--replay-off-white)]/30 ring-2 ring-[var(--replay-off-white)]/20"
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              className="text-[var(--replay-off-white)] hover:opacity-70 transition-all p-2 rounded-lg active:scale-95"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>

            {/* Repeat */}
            <button
              onClick={cycleRepeatMode}
              className={`transition-all p-2 rounded-lg ${
                repeatActive
                  ? "text-[var(--replay-off-white)]"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
            >
              <RepeatIcon size={18} />
            </button>
          </div>
        </div>

        {/* Swipe Indicators */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="text-[var(--replay-off-white)] transition-opacity duration-200"
            style={{ opacity: swipeOffset > 20 ? Math.min(swipeOffset / 50, 1) : 0 }}
          >
            <SkipBack size={32} />
          </div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="text-[var(--replay-off-white)] transition-opacity duration-200"
            style={{ opacity: swipeOffset < -20 ? Math.min(Math.abs(swipeOffset) / 50, 1) : 0 }}
          >
            <SkipForward size={32} />
          </div>
        </div>
      </div>

      {/* Desktop: Full Player Bar */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0a]/98 via-[#1a1a1a]/98 to-[#0a0a0a]/98 backdrop-blur-2xl border-t border-white/5 z-50">
        {/* Progress Bar - Ultra Thin Top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/5 group cursor-pointer">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="h-full bg-gradient-to-r from-[var(--replay-off-white)] to-white/80 transition-all group-hover:h-[4px]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex h-full items-center justify-between px-6 max-w-[1800px] mx-auto w-full">
          {/* Left: Current Song Info */}
          <div className="flex items-center gap-4 w-[320px]">
            <button
              onClick={() => setVisualizerModalOpen(true)}
              className="w-14 h-14 rounded-xl overflow-hidden shadow-xl flex-shrink-0 bg-[var(--replay-dark-grey)] hover:scale-105 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 cursor-pointer group relative"
              title="Open full-screen visualizer"
            >
              {currentTrack.artworkUrl || currentTrack.artworkData ? (
                <img
                  src={currentTrack.artworkUrl || currentTrack.artworkData}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PremiumCoverArt isPlaying={isPlaying} size="md" variant={visualizerVariant} />
              )}
              {/* Hover overlay with expand icon */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[var(--replay-off-white)] truncate">
                {currentTrack.title}
              </h4>
              <p className="text-sm text-[var(--replay-mid-grey)] truncate">{currentTrack.artist}</p>
            </div>

            <button
              onClick={() => toggleLike(currentTrack.id)}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                isLiked
                  ? "text-[var(--replay-off-white)] bg-white/15 shadow-lg shadow-white/10"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/10"
              }`}
            >
              <Heart size={20} className={isLiked ? "fill-current" : ""} />
            </button>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleShuffle}
                className={`transition-all duration-200 p-2.5 rounded-xl hover:bg-white/10 active:scale-95 ${
                  shuffleMode === "on"
                    ? "text-[var(--replay-off-white)]"
                    : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
                }`}
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={playPrevious}
                className="text-[var(--replay-off-white)] hover:opacity-80 transition-all duration-200 p-2.5 rounded-xl hover:bg-white/10 active:scale-95"
              >
                <SkipBack size={22} fill="currentColor" />
              </button>

              <button
                onClick={togglePlayPause}
                className="bg-gradient-to-br from-[var(--replay-off-white)] to-white/90 hover:from-white hover:to-white/95 text-[var(--replay-black)] rounded-xl p-3.5 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/25 active:scale-95"
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="text-[var(--replay-off-white)] hover:opacity-80 transition-all duration-200 p-2.5 rounded-xl hover:bg-white/10 active:scale-95"
              >
                <SkipForward size={22} fill="currentColor" />
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`transition-all duration-200 p-2.5 rounded-xl hover:bg-white/10 active:scale-95 ${
                  repeatActive
                    ? "text-[var(--replay-off-white)]"
                    : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
                }`}
              >
                <RepeatIcon size={18} />
              </button>
            </div>

            {/* Waveform Progress */}
            <div className="w-full max-w-lg">
              <WaveformProgress
                progress={progress}
                duration={duration}
                currentTime={currentTime}
                onSeek={(p) => seek((p / 100) * duration)}
                audioUrl={audioUrl}
                isPlaying={isPlaying}
                compact={true}
              />
            </div>
          </div>

          {/* Right: Volume & Queue */}
          <div className="flex items-center gap-4 w-[320px] justify-end">
            {onMiniPlayerToggle && (
              <button
                onClick={onMiniPlayerToggle}
                className="text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-all p-2 rounded-full hover:bg-white/5"
                title="Mini player"
              >
                <Minimize2 size={18} />
              </button>
            )}
            <button
              onClick={onQueueClick}
              className="text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-all p-2 rounded-full hover:bg-white/5"
            >
              <ListMusic size={20} />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                className="text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-all"
              >
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden relative group cursor-pointer">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumePercent}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="h-full bg-gradient-to-r from-[var(--replay-off-white)] to-white/80 transition-all"
                  style={{ width: `${volumePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
