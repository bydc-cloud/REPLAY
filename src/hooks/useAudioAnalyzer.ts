import { useEffect, useState, useRef } from "react";

export const useAudioAnalyzer = (audioElement?: HTMLAudioElement | null) => {
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const mockTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!audioElement) {
      // Generate highly dynamic mock data for impressive demo visualization
      const mockInterval = setInterval(() => {
        const mockData = new Uint8Array(128);
        mockTimeRef.current += 0.05;
        const time = mockTimeRef.current;

        for (let i = 0; i < 128; i++) {
          // Simulate realistic frequency distribution
          const frequencyFactor = 1 - (i / 128) * 0.6; // Higher bass, lower treble naturally

          // Multiple overlapping wave patterns for organic movement
          const bassWave = i < 20 ? Math.sin(time * 2.5) * 80 : Math.sin(time * 2.5) * 30;
          const midWave = Math.sin(time * 3.7 + i * 0.15) * 50 * frequencyFactor;
          const highWave = Math.sin(time * 5.3 + i * 0.08) * 30 * frequencyFactor;

          // Rhythmic pulse (simulating beat)
          const beatPulse = Math.pow(Math.sin(time * 4), 8) * 60;

          // Sub-bass rumble
          const subBass = i < 8 ? Math.sin(time * 1.5) * 40 : 0;

          // Random sparkle for treble
          const sparkle = i > 80 ? Math.random() * 30 : 0;

          // Combine all waves
          const combined = 60 + bassWave + midWave + highWave + (i < 15 ? beatPulse : beatPulse * 0.3) + subBass + sparkle;

          mockData[i] = Math.max(10, Math.min(255, combined));
        }
        setFrequencyData(mockData);
      }, 25); // 40fps for smoother animation

      setIsAnalyzing(true);
      return () => clearInterval(mockInterval);
    }

    // Real audio analysis with enhanced settings
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        // Higher FFT size for more detailed frequency data
        analyzerRef.current.fftSize = 512;
        analyzerRef.current.smoothingTimeConstant = 0.5; // Balanced smoothing
        analyzerRef.current.minDecibels = -90; // More sensitivity
        analyzerRef.current.maxDecibels = -10; // Better dynamic range
      }

      const analyzer = analyzerRef.current;
      const audioContext = audioContextRef.current;
      if (!analyzer || !audioContext) return;

      // Resume context if suspended (required by browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

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
        // 60fps for smoother visualization
        if (timestamp - lastUpdateRef.current < 16.67) {
          animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
          return;
        }
        lastUpdateRef.current = timestamp;

        if (analyzerRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArray);

          // Apply slight boost to make visualization more visible
          const boostedData = new Uint8Array(dataArray.length);
          for (let i = 0; i < dataArray.length; i++) {
            // Boost lower values more than higher ones for better visibility
            const value = dataArray[i];
            const boost = value < 100 ? 1.3 : value < 180 ? 1.15 : 1.05;
            boostedData[i] = Math.min(255, Math.floor(value * boost));
          }

          setFrequencyData(boostedData);
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
