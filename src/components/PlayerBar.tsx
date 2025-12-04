import { Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Volume2, VolumeX, ListMusic, Minimize2, Sliders, Music, MoreHorizontal, ListPlus, User, Disc, Share2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { FullScreenPlayer } from "./FullScreenPlayer";
import { VisualizerModal } from "./VisualizerModal";
import { ProducerModePanel } from "./ProducerModePanel";
import { EqualizerPanel } from "./EqualizerPanel";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { PremiumCoverArt } from "./PremiumCoverArt";
import { WaveformProgress } from "./WaveformProgress";
import { useSettings } from "../contexts/SettingsContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useMusicLibrary, getAudioUrl } from "../contexts/MusicLibraryContext";
import { useAudioEffects } from "../contexts/AudioEffectsContext";
import { useToast } from "../contexts/ToastContext";

interface PlayerBarProps {
  onQueueClick?: () => void;
  onMiniPlayerToggle?: () => void;
}

export const PlayerBar = ({ onQueueClick, onMiniPlayerToggle }: PlayerBarProps = {}) => {
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [visualizerModalOpen, setVisualizerModalOpen] = useState(false);
  const [producerPanelExpanded, setProducerPanelExpanded] = useState(false);
  const [equalizerExpanded, setEqualizerExpanded] = useState(false);
  const [showTrackMenu, setShowTrackMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const trackMenuRef = useRef<HTMLDivElement>(null);
  const { visualizerVariant, developerMode } = useSettings();
  const { connectToAudioElement, eqEnabled } = useAudioEffects();

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    shuffleMode,
    audioElement,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    seekForward,
    seekBackward,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    addToQueue,
    addToQueueNext
  } = useAudioPlayer();

  const { toggleLike, tracks, playlists, addToPlaylist } = useMusicLibrary();
  const { showToast } = useToast();
  const { playbackSpeed } = useAudioEffects();

  // Get current track with full data including analysis
  const trackWithData = currentTrack ? tracks.find(t => t.id === currentTrack.id) : null;

  // Check if current track is liked
  const isLiked = trackWithData?.isLiked || false;

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

  // NOTE: Audio effects chain connection is now handled in AudioPlayerContext
  // BEFORE play() is called. This ensures proper Safari compatibility where
  // createMediaElementSource must happen before playback starts.

  // Close track menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (trackMenuRef.current && !trackMenuRef.current.contains(e.target as Node)) {
        setShowTrackMenu(false);
        setShowPlaylistMenu(false);
      }
    };
    if (showTrackMenu || showPlaylistMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTrackMenu, showPlaylistMenu]);

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
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--replay-elevated)]/95 backdrop-blur-md z-50">
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
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--replay-elevated)]/95 backdrop-blur-md z-50 overflow-hidden"
      >
        {/* Ultra Thin Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-[var(--replay-off-white)] to-[var(--replay-off-white)]/60"
            style={{
              width: `${progress}%`,
              transition: 'width 100ms linear'
            }}
          />
        </div>

        {/* Swipeable Content Wrapper */}
        <div
          className="px-4 py-3 transition-transform duration-200"
          style={{ transform: `translateX(${swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Album Art & Song Info - This row is clickable to open full screen */}
          <div
            className="flex items-center justify-center gap-3 mb-3 cursor-pointer"
            onClick={() => setFullScreenOpen(true)}
          >
            <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden shadow-xl bg-[var(--replay-dark-grey)]">
              {currentTrack.artworkUrl || currentTrack.artworkData ? (
                <img
                  src={currentTrack.artworkUrl || currentTrack.artworkData}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PremiumCoverArt isPlaying={isPlaying} size="sm" variant={visualizerVariant === "none" ? "bars" : visualizerVariant} audioElement={audioElement} />
              )}
            </div>

            <div className="flex-1 min-w-0 text-center">
              <h4 className="font-semibold text-[var(--replay-off-white)] truncate text-sm">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-[var(--replay-mid-grey)] truncate">
                {currentTrack.artist} • {formatTime(currentTime)} / {formatTime(duration)}
                {trackWithData?.bpm && ` • ${trackWithData.bpm} BPM`}
                {playbackSpeed !== 1 && ` • ${playbackSpeed.toFixed(2)}x`}
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

          {/* Centered Playback Controls - Not clickable for full screen */}
          <div className="flex items-center justify-center gap-4">
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
              onClick={togglePlayPause}
              className="bg-[var(--replay-off-white)] hover:bg-white text-[var(--replay-black)] rounded-full p-3 transition-all duration-200 active:scale-95"
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

      {/* Equalizer Panel - Above Producer Mode */}
      {currentTrack && (
        <div
          className="hidden md:block fixed left-0 right-0 z-40"
          style={{ bottom: developerMode && producerPanelExpanded ? '280px' : (developerMode ? '116px' : '80px') }}
        >
          <EqualizerPanel
            isExpanded={equalizerExpanded}
            onToggleExpand={() => setEqualizerExpanded(!equalizerExpanded)}
          />
        </div>
      )}

      {/* Producer Mode Panel - Above Desktop Player */}
      {developerMode && currentTrack && (
        <div className="hidden md:block fixed bottom-20 left-0 right-0 z-40">
          <ProducerModePanel
            audioElement={audioElement}
            isExpanded={producerPanelExpanded}
            onToggleExpand={() => setProducerPanelExpanded(!producerPanelExpanded)}
          />
        </div>
      )}

      {/* Desktop: Full Player Bar */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0a]/98 via-[#1a1a1a]/98 to-[#0a0a0a]/98 backdrop-blur-2xl border-t border-white/5 z-50">
        {/* Progress Bar - Ultra Thin Top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/5 group cursor-pointer hover:h-[5px] transition-[height] duration-150">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="h-full bg-gradient-to-r from-[var(--replay-off-white)] to-white/80"
            style={{
              width: `${progress}%`,
              transition: 'width 100ms linear'
            }}
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
              <div className="flex items-center gap-2">
                <p className="text-sm text-[var(--replay-mid-grey)] truncate">{currentTrack.artist}</p>
                {trackWithData?.bpm && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {trackWithData.bpm} BPM
                  </span>
                )}
                {trackWithData?.musicalKey && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {trackWithData.musicalKey}
                  </span>
                )}
                {playbackSpeed !== 1 && (
                  <span className="text-xs bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {playbackSpeed.toFixed(2)}x
                  </span>
                )}
              </div>
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

            {/* 3-dot Menu */}
            <div className="relative" ref={trackMenuRef}>
              <button
                onClick={() => setShowTrackMenu(!showTrackMenu)}
                className="p-2.5 rounded-xl text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] hover:bg-white/10 transition-all duration-300"
                title="More options"
              >
                <MoreHorizontal size={20} />
              </button>

              {/* Dropdown Menu */}
              {showTrackMenu && (
                <div className="absolute left-0 bottom-full mb-2 w-56 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden z-[60]">
                  {/* Play Next */}
                  <button
                    onClick={() => {
                      if (currentTrack) {
                        addToQueueNext(currentTrack);
                        showToast('Added to queue (next)', 'success');
                        setShowTrackMenu(false);
                      }
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
                  >
                    <ListMusic size={18} className="text-[var(--replay-mid-grey)]" />
                    <span>Play Next</span>
                  </button>

                  {/* Add to Queue */}
                  <button
                    onClick={() => {
                      if (currentTrack) {
                        addToQueue(currentTrack);
                        showToast('Added to queue', 'success');
                        setShowTrackMenu(false);
                      }
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
                  >
                    <ListPlus size={18} className="text-[var(--replay-mid-grey)]" />
                    <span>Add to Queue</span>
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-white/10 my-1" />

                  {/* Add to Playlist */}
                  <button
                    onClick={() => {
                      setShowPlaylistMenu(!showPlaylistMenu);
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ListPlus size={18} className="text-[var(--replay-mid-grey)]" />
                      <span>Add to Playlist</span>
                    </div>
                    <ChevronDown size={16} className={`text-[var(--replay-mid-grey)] transition-transform ${showPlaylistMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Playlist submenu */}
                  {showPlaylistMenu && (
                    <div className="bg-black/20 max-h-40 overflow-y-auto">
                      {playlists.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-[var(--replay-mid-grey)]">
                          No playlists yet
                        </div>
                      ) : (
                        playlists.map(playlist => (
                          <button
                            key={playlist.id}
                            onClick={() => {
                              if (currentTrack) {
                                addToPlaylist(playlist.id, currentTrack.id);
                                showToast(`Added to "${playlist.name}"`, 'success');
                                setShowTrackMenu(false);
                                setShowPlaylistMenu(false);
                              }
                            }}
                            className="w-full px-6 py-2 flex items-center gap-2 text-left text-sm text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
                          >
                            <Disc size={14} className="text-[var(--replay-mid-grey)]" />
                            <span className="truncate">{playlist.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-white/10 my-1" />

                  {/* Go to Artist */}
                  <button
                    onClick={() => {
                      showToast(`Artist: ${currentTrack?.artist || 'Unknown'}`, 'info');
                      setShowTrackMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
                  >
                    <User size={18} className="text-[var(--replay-mid-grey)]" />
                    <span>Go to Artist</span>
                  </button>

                  {/* Go to Album */}
                  <button
                    onClick={() => {
                      showToast(`Album: ${currentTrack?.album || 'Unknown'}`, 'info');
                      setShowTrackMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
                  >
                    <Disc size={18} className="text-[var(--replay-mid-grey)]" />
                    <span>Go to Album</span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={async () => {
                      if (navigator.share && currentTrack) {
                        try {
                          await navigator.share({
                            title: currentTrack.title,
                            text: `Check out "${currentTrack.title}" by ${currentTrack.artist}`,
                          });
                        } catch {
                          // User cancelled
                        }
                      } else {
                        showToast('Share not available', 'info');
                      }
                      setShowTrackMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left text-[var(--replay-off-white)] hover:bg-white/10 transition-colors"
                  >
                    <Share2 size={18} className="text-[var(--replay-mid-grey)]" />
                    <span>Share</span>
                  </button>
                </div>
              )}
            </div>
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
            {/* EQ Button */}
            <button
              onClick={() => setEqualizerExpanded(!equalizerExpanded)}
              className={`transition-all p-2 rounded-full hover:bg-white/5 ${
                equalizerExpanded || eqEnabled
                  ? "text-purple-400 bg-purple-500/20"
                  : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
              }`}
              title="Equalizer & Effects"
            >
              <Music size={18} />
            </button>
            {developerMode && (
              <button
                onClick={() => setProducerPanelExpanded(!producerPanelExpanded)}
                className={`transition-all p-2 rounded-full hover:bg-white/5 ${
                  producerPanelExpanded
                    ? "text-purple-400 bg-purple-500/20"
                    : "text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)]"
                }`}
                title="Producer Mode"
              >
                <Sliders size={18} />
              </button>
            )}
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
                className="text-[var(--replay-mid-grey)] hover:text-[var(--replay-off-white)] transition-colors duration-200"
              >
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="relative w-28 h-2 group">
                {/* Track background */}
                <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                  {/* Fill */}
                  <div
                    className="h-full bg-gradient-to-r from-[var(--replay-off-white)] to-white/90 rounded-full transition-[width] duration-75 ease-out"
                    style={{ width: `${volumePercent}%` }}
                  />
                </div>
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--replay-off-white)] rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{ left: `calc(${volumePercent}% - 6px)` }}
                />
                {/* Input slider (invisible but functional) */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumePercent}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  style={{ WebkitAppearance: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
