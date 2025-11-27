import { useEffect, useState, useRef } from "react";

export const useAudioAnalyzer = (audioElement?: HTMLAudioElement | null) => {
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!audioElement) {
      // Generate more dynamic mock data for demo
      const mockInterval = setInterval(() => {
        const mockData = new Uint8Array(128);
        const time = Date.now() / 200;
        for (let i = 0; i < 128; i++) {
          // Multiple waves at different frequencies for more complex movement
          const bassInfluence = i < 15 ? 1.5 : 1;
          const wave1 = Math.sin(time + (i / 6)) * 70 * bassInfluence;
          const wave2 = Math.sin(time * 1.7 + (i / 3)) * 50;
          const randomPulse = Math.random() * 20;
          mockData[i] = Math.max(0, Math.min(255, 90 + wave1 + wave2 + randomPulse));
        }
        setFrequencyData(mockData);
      }, 50); // 20fps for mobile performance

      setIsAnalyzing(true);
      return () => clearInterval(mockInterval);
    }

    // Real audio analysis
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        // Reduced FFT size for better mobile performance
        analyzerRef.current.fftSize = 256;
        analyzerRef.current.smoothingTimeConstant = 0.6; // More smoothing for stability
        analyzerRef.current.minDecibels = -85;
        analyzerRef.current.maxDecibels = -15;
      }

      const analyzer = analyzerRef.current;
      const audioContext = audioContextRef.current;
      if (!analyzer || !audioContext) return;

      if (!sourceRef.current && audioElement) {
        try {
          sourceRef.current = audioContext.createMediaElementSource(audioElement);
          sourceRef.current.connect(analyzer);
          analyzer.connect(audioContext.destination);
        } catch (e) {
          // Element already has source, continue
          console.log("Audio source already exists");
        }
      }
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);

      const updateFrequencyData = (timestamp: number) => {
        // Throttle to 30fps for mobile performance
        if (timestamp - lastUpdateRef.current < 33) {
          animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
          return;
        }
        lastUpdateRef.current = timestamp;

        if (analyzerRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArray);
          setFrequencyData(new Uint8Array(dataArray));
        }
        animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
      };

      animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
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
