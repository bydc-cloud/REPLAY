import { useEffect, useState, useRef } from "react";

export const useAudioAnalyzer = (audioElement?: HTMLAudioElement | null) => {
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(256));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!audioElement) {
      // Generate more dynamic mock data for demo
      const mockInterval = setInterval(() => {
        const mockData = new Uint8Array(256);
        const time = Date.now() / 200;
        for (let i = 0; i < 256; i++) {
          // Multiple waves at different frequencies for more complex movement
          const bassInfluence = i < 30 ? 1.5 : 1;
          const wave1 = Math.sin(time + (i / 6)) * 70 * bassInfluence;
          const wave2 = Math.sin(time * 1.7 + (i / 3)) * 50;
          const wave3 = Math.cos(time * 0.9 + (i / 5)) * 40;
          const wave4 = Math.sin(time * 2.3 + (i / 10)) * 30;
          const randomPulse = Math.random() * 20;
          mockData[i] = Math.max(0, Math.min(255, 90 + wave1 + wave2 + wave3 + wave4 + randomPulse));
        }
        setFrequencyData(mockData);
      }, 33); // ~30fps for smoother animation

      setIsAnalyzing(true);
      return () => clearInterval(mockInterval);
    }

    // Real audio analysis
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 512; // Higher resolution for better detail
        analyzerRef.current.smoothingTimeConstant = 0.4; // Lower = more reactive to audio changes
        analyzerRef.current.minDecibels = -90; // More sensitive to quiet sounds
        analyzerRef.current.maxDecibels = -10; // Better dynamic range
      }

      const analyzer = analyzerRef.current;
      const audioContext = audioContextRef.current;
      if (!analyzer || !audioContext) return;

      if (!sourceRef.current && audioElement) {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyzer);
        analyzer.connect(audioContext.destination);
      }
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);

      const updateFrequencyData = () => {
        if (analyzerRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArray);
          setFrequencyData(new Uint8Array(dataArray));
        }
        animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
      };

      updateFrequencyData();
      setIsAnalyzing(true);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } catch (error) {
      console.error("Audio analysis error:", error);
      setIsAnalyzing(false);
    }
  }, [audioElement]);

  return { frequencyData, isAnalyzing };
};
