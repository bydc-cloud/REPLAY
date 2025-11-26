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
          e.preventDefault();
          config.onPlayPause?.();
          break;
        case "arrowright": // Right arrow - Next track
          if (e.shiftKey) {
            config.onNext?.();
          }
          break;
        case "arrowleft": // Left arrow - Previous track
          if (e.shiftKey) {
            config.onPrevious?.();
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
};
