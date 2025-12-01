import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type VisualizerVariant = "none" | "bars" | "wave" | "pulse" | "circle" | "dots" | "lines" | "lyrics";
type ThemeMode = "dark" | "light";

interface SettingsContextType {
  visualizerVariant: VisualizerVariant;
  setVisualizerVariant: (variant: VisualizerVariant) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  developerMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [visualizerVariant, setVisualizerVariantState] = useState<VisualizerVariant>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-visualizer");
      if (saved && ["none", "bars", "wave", "pulse", "circle", "dots", "lines", "lyrics"].includes(saved)) {
        return saved as VisualizerVariant;
      }
    }
    return "bars"; // Default to bars
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-theme");
      if (saved && ["dark", "light"].includes(saved)) {
        return saved as ThemeMode;
      }
    }
    return "dark"; // Default to dark
  });

  const [developerMode, setDeveloperModeState] = useState<boolean>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("replay-developer-mode");
      return saved === "true";
    }
    return false; // Default to off
  });

  const setDeveloperMode = (enabled: boolean) => {
    setDeveloperModeState(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("replay-developer-mode", enabled.toString());
    }
  };

  const setVisualizerVariant = (variant: VisualizerVariant) => {
    setVisualizerVariantState(variant);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("replay-visualizer", variant);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("replay-theme", mode);
    }
  };

  useEffect(() => {
    // Sync changes to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("replay-visualizer", visualizerVariant);
    }
  }, [visualizerVariant]);

  useEffect(() => {
    // Sync theme changes to localStorage and document
    if (typeof window !== "undefined") {
      localStorage.setItem("replay-theme", themeMode);
      document.documentElement.setAttribute("data-theme", themeMode);
    }
  }, [themeMode]);

  return (
    <SettingsContext.Provider value={{
      visualizerVariant,
      setVisualizerVariant,
      themeMode,
      setThemeMode,
      developerMode,
      setDeveloperMode
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};