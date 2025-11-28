import { useEffect } from "react";

interface KeyboardShortcutsConfig {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  onShuffle?: () => void;
  onRepeat?: () => void;
  onLike?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onFullscreen?: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ": // Spacebar - Play/Pause
        case "k": // K - Play/Pause (YouTube style)
          e.preventDefault();
          config.onPlayPause?.();
          break;
        case "arrowright": // Right arrow
          e.preventDefault();
          if (e.shiftKey) {
            config.onNext?.(); // Shift+Right - Next track
          } else {
            config.onSeekForward?.(); // Right - Seek forward 5s
          }
          break;
        case "arrowleft": // Left arrow
          e.preventDefault();
          if (e.shiftKey) {
            config.onPrevious?.(); // Shift+Left - Previous track
          } else {
            config.onSeekBackward?.(); // Left - Seek backward 5s
          }
          break;
        case "arrowup": // Up arrow - Volume up
          e.preventDefault();
          config.onVolumeUp?.();
          break;
        case "arrowdown": // Down arrow - Volume down
          e.preventDefault();
          config.onVolumeDown?.();
          break;
        case "m": // M - Mute/Unmute
          config.onMute?.();
          break;
        case "s": // S - Shuffle
          config.onShuffle?.();
          break;
        case "r": // R - Repeat
          config.onRepeat?.();
          break;
        case "l": // L - Like/Unlike
          config.onLike?.();
          break;
        case "n": // N - Next track
          config.onNext?.();
          break;
        case "p": // P - Previous track
          config.onPrevious?.();
          break;
        case "j": // J - Seek backward 10s (YouTube style)
          config.onSeekBackward?.();
          config.onSeekBackward?.(); // Double for 10s
          break;
        case "f": // F - Fullscreen
          config.onFullscreen?.();
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          // Number keys - Jump to percentage of track
          // 0 = start, 5 = 50%, 9 = 90%
          // This is handled separately if needed
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
};
