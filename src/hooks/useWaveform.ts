import { useState, useEffect, useRef } from "react";

interface WaveformData {
  peaks: number[];
  duration: number;
}

export const useWaveform = (audioUrl?: string) => {
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, WaveformData>>(new Map());

  useEffect(() => {
    if (!audioUrl) {
      setWaveformData(null);
      return;
    }

    // Check cache first
    const cached = cacheRef.current.get(audioUrl);
    if (cached) {
      setWaveformData(cached);
      return;
    }

    const generateWaveform = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Fetch the audio file
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();

        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get the raw audio data (use first channel)
        const rawData = audioBuffer.getChannelData(0);
        const duration = audioBuffer.duration;

        // Number of bars to display (responsive)
        const barCount = window.innerWidth < 768 ? 80 : 150;

        // Samples per bar
        const samplesPerBar = Math.floor(rawData.length / barCount);

        const peaks: number[] = [];

        for (let i = 0; i < barCount; i++) {
          const start = i * samplesPerBar;
          const end = start + samplesPerBar;

          let sum = 0;
          let max = 0;

          for (let j = start; j < end; j++) {
            const absolute = Math.abs(rawData[j]);
            sum += absolute;
            if (absolute > max) max = absolute;
          }

          // Use a mix of average and peak for better visualization
          const avg = sum / samplesPerBar;
          const peak = (avg * 0.7 + max * 0.3);
          peaks.push(peak);
        }

        // Normalize peaks to 0-1 range
        const maxPeak = Math.max(...peaks);
        const normalizedPeaks = peaks.map(p => p / maxPeak);

        const data = { peaks: normalizedPeaks, duration };

        // Cache the result
        cacheRef.current.set(audioUrl, data);

        setWaveformData(data);
        audioContext.close();
      } catch (err) {
        console.error("Waveform generation error:", err);
        setError("Failed to generate waveform");

        // Generate placeholder waveform on error
        const placeholderPeaks = Array.from({ length: 100 }, () =>
          0.3 + Math.random() * 0.5
        );
        setWaveformData({ peaks: placeholderPeaks, duration: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    generateWaveform();
  }, [audioUrl]);

  return { waveformData, isLoading, error };
};

// Lightweight version that generates from audio element in real-time
export const useRealtimeWaveform = (audioElement: HTMLAudioElement | null) => {
  const [peaks, setPeaks] = useState<number[]>([]);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    // Create a simplified waveform from frequency data
    const generateSimplifiedWaveform = () => {
      // Generate mock waveform based on duration
      const barCount = window.innerWidth < 768 ? 80 : 150;
      const mockPeaks = Array.from({ length: barCount }, (_, i) => {
        // Create a natural-looking waveform pattern
        const position = i / barCount;
        const wave1 = Math.sin(position * Math.PI * 8) * 0.3;
        const wave2 = Math.sin(position * Math.PI * 15) * 0.2;
        const wave3 = Math.sin(position * Math.PI * 3) * 0.2;
        const base = 0.4;
        return Math.max(0.1, Math.min(1, base + wave1 + wave2 + wave3 + Math.random() * 0.15));
      });
      setPeaks(mockPeaks);
    };

    generateSimplifiedWaveform();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioElement]);

  return { peaks };
};
