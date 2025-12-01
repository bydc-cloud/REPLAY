/**
 * Audio Analysis Service
 * Uses essentia.js for accurate BPM and key detection
 */

// Essentia.js Web Assembly module
let essentia: any = null;
let essentiaExtractor: any = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Key mappings from essentia output
const KEY_MAP: Record<string, string> = {
  'C': 'C', 'C#': 'C#', 'Db': 'Db', 'D': 'D', 'D#': 'D#', 'Eb': 'Eb',
  'E': 'E', 'F': 'F', 'F#': 'F#', 'Gb': 'Gb', 'G': 'G', 'G#': 'G#',
  'Ab': 'Ab', 'A': 'A', 'A#': 'A#', 'Bb': 'Bb', 'B': 'B'
};

const SCALE_MAP: Record<string, string> = {
  'major': 'Major',
  'minor': 'Minor'
};

export interface AudioAnalysisResult {
  bpm: number;
  musicalKey: string;
  energy: number;
  confidence: {
    bpm: number;
    key: number;
  };
}

/**
 * Initialize Essentia.js
 */
async function initEssentia(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Dynamic import of essentia.js modules
      const { Essentia, EssentiaWASM } = await import('essentia.js');

      // Initialize the WASM module
      const essentiaWasm = await EssentiaWASM();
      essentia = new Essentia(essentiaWasm);

      isInitialized = true;
      console.log('Essentia.js initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Essentia.js:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Convert audio file to mono float32 array for analysis
 */
async function decodeAudioFile(audioData: ArrayBuffer): Promise<Float32Array> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  try {
    const audioBuffer = await audioContext.decodeAudioData(audioData);

    // Get mono channel (mix down if stereo)
    let monoData: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      monoData = audioBuffer.getChannelData(0);
    } else {
      // Mix stereo to mono
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      monoData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        monoData[i] = (left[i] + right[i]) / 2;
      }
    }

    // Resample to 44100Hz if needed (essentia expects this)
    if (audioBuffer.sampleRate !== 44100) {
      monoData = resample(monoData, audioBuffer.sampleRate, 44100);
    }

    return monoData;
  } finally {
    await audioContext.close();
  }
}

/**
 * Simple linear resampling
 */
function resample(data: Float32Array, fromRate: number, toRate: number): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.round(data.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, data.length - 1);
    const frac = srcIndex - srcIndexFloor;

    result[i] = data[srcIndexFloor] * (1 - frac) + data[srcIndexCeil] * frac;
  }

  return result;
}

/**
 * Detect BPM using essentia.js RhythmExtractor
 */
async function detectBPM(audioData: Float32Array): Promise<{ bpm: number; confidence: number }> {
  if (!essentia) {
    throw new Error('Essentia not initialized');
  }

  try {
    // Use PercivalBpmEstimator for tempo detection
    const bpmResult = essentia.PercivalBpmEstimator(essentia.arrayToVector(audioData));
    const bpm = Math.round(bpmResult.bpm);

    // Clamp to reasonable range (60-200 BPM)
    const clampedBpm = Math.max(60, Math.min(200, bpm));

    // If detected BPM is very low, it might be half-time - double it
    const finalBpm = clampedBpm < 70 ? clampedBpm * 2 : clampedBpm;

    return {
      bpm: Math.round(finalBpm),
      confidence: 0.85 // Essentia is generally reliable
    };
  } catch (error) {
    console.error('BPM detection failed:', error);
    // Fallback to simple beat detection
    return fallbackBPMDetection(audioData);
  }
}

/**
 * Fallback BPM detection using peak detection
 */
function fallbackBPMDetection(audioData: Float32Array): { bpm: number; confidence: number } {
  // Simple peak-based BPM detection
  const sampleRate = 44100;
  const chunkSize = 1024;
  const chunks = Math.floor(audioData.length / chunkSize);

  // Calculate RMS energy for each chunk
  const energies: number[] = [];
  for (let i = 0; i < chunks; i++) {
    let sum = 0;
    for (let j = 0; j < chunkSize; j++) {
      const sample = audioData[i * chunkSize + j];
      sum += sample * sample;
    }
    energies.push(Math.sqrt(sum / chunkSize));
  }

  // Find peaks (above average energy)
  const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
  const threshold = avgEnergy * 1.3;

  const peaks: number[] = [];
  for (let i = 1; i < energies.length - 1; i++) {
    if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
      peaks.push(i);
    }
  }

  if (peaks.length < 2) {
    return { bpm: 120, confidence: 0.3 }; // Default fallback
  }

  // Calculate average interval between peaks
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const secondsPerBeat = (avgInterval * chunkSize) / sampleRate;
  const bpm = Math.round(60 / secondsPerBeat);

  // Clamp to reasonable range
  const clampedBpm = Math.max(60, Math.min(200, bpm));

  return {
    bpm: clampedBpm,
    confidence: 0.5
  };
}

/**
 * Detect musical key using essentia.js KeyExtractor
 */
async function detectKey(audioData: Float32Array): Promise<{ key: string; confidence: number }> {
  if (!essentia) {
    throw new Error('Essentia not initialized');
  }

  try {
    // Use Key algorithm with HPCP (Harmonic Pitch Class Profile)
    const keyResult = essentia.KeyExtractor(essentia.arrayToVector(audioData));

    const key = KEY_MAP[keyResult.key] || keyResult.key;
    const scale = SCALE_MAP[keyResult.scale] || keyResult.scale;
    const musicalKey = `${key} ${scale}`;

    return {
      key: musicalKey,
      confidence: keyResult.strength || 0.8
    };
  } catch (error) {
    console.error('Key detection failed:', error);
    // Fallback to chromagram-based detection
    return fallbackKeyDetection(audioData);
  }
}

/**
 * Fallback key detection using simple chromagram analysis
 */
function fallbackKeyDetection(audioData: Float32Array): { key: string; confidence: number } {
  // Simple chromagram-based key detection
  // This is a simplified version - essentia is much more accurate

  const sampleRate = 44100;
  const fftSize = 4096;

  // Krumhansl-Kessler major and minor profiles
  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Build a simple chroma vector
  const chroma = new Array(12).fill(0);
  const numChunks = Math.floor(audioData.length / fftSize);

  for (let chunk = 0; chunk < numChunks; chunk++) {
    // Simple energy estimation per pitch class (very approximate)
    for (let pc = 0; pc < 12; pc++) {
      const freq = 440 * Math.pow(2, (pc - 9) / 12); // A4 = 440Hz
      const period = sampleRate / freq;
      let sum = 0;
      for (let i = 0; i < fftSize && (chunk * fftSize + i) < audioData.length; i++) {
        const sample = audioData[chunk * fftSize + i];
        sum += Math.abs(sample * Math.sin(2 * Math.PI * i / period));
      }
      chroma[pc] += sum;
    }
  }

  // Normalize chroma
  const maxChroma = Math.max(...chroma);
  if (maxChroma > 0) {
    for (let i = 0; i < 12; i++) {
      chroma[i] /= maxChroma;
    }
  }

  // Correlate with major and minor profiles for each key
  let bestKey = 'C';
  let bestScale = 'Major';
  let bestCorr = -Infinity;

  for (let key = 0; key < 12; key++) {
    // Rotate chroma to start from this key
    const rotatedChroma = [...chroma.slice(key), ...chroma.slice(0, key)];

    // Correlate with major profile
    let majorCorr = 0;
    for (let i = 0; i < 12; i++) {
      majorCorr += rotatedChroma[i] * majorProfile[i];
    }

    if (majorCorr > bestCorr) {
      bestCorr = majorCorr;
      bestKey = keyNames[key];
      bestScale = 'Major';
    }

    // Correlate with minor profile
    let minorCorr = 0;
    for (let i = 0; i < 12; i++) {
      minorCorr += rotatedChroma[i] * minorProfile[i];
    }

    if (minorCorr > bestCorr) {
      bestCorr = minorCorr;
      bestKey = keyNames[key];
      bestScale = 'Minor';
    }
  }

  return {
    key: `${bestKey} ${bestScale}`,
    confidence: 0.5
  };
}

/**
 * Calculate overall energy level (0-1)
 */
function calculateEnergy(audioData: Float32Array): number {
  // RMS energy normalized to 0-1
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  const rms = Math.sqrt(sum / audioData.length);

  // Normalize - typical RMS is around 0.1-0.3 for music
  const normalizedEnergy = Math.min(1, rms / 0.3);

  return Math.round(normalizedEnergy * 100) / 100;
}

/**
 * Analyze audio file for BPM, key, and energy
 */
export async function analyzeAudio(audioData: ArrayBuffer): Promise<AudioAnalysisResult> {
  // Initialize essentia if needed
  await initEssentia();

  // Decode audio to float32 samples
  const samples = await decodeAudioFile(audioData);

  // Run analysis in parallel
  const [bpmResult, keyResult] = await Promise.all([
    detectBPM(samples),
    detectKey(samples)
  ]);

  const energy = calculateEnergy(samples);

  return {
    bpm: bpmResult.bpm,
    musicalKey: keyResult.key,
    energy,
    confidence: {
      bpm: bpmResult.confidence,
      key: keyResult.confidence
    }
  };
}

/**
 * Analyze audio from base64 data URL
 */
export async function analyzeAudioFromDataUrl(dataUrl: string): Promise<AudioAnalysisResult> {
  // Convert data URL to ArrayBuffer
  const response = await fetch(dataUrl);
  const arrayBuffer = await response.arrayBuffer();

  return analyzeAudio(arrayBuffer);
}

/**
 * Analyze audio from blob URL
 */
export async function analyzeAudioFromBlobUrl(blobUrl: string): Promise<AudioAnalysisResult> {
  const response = await fetch(blobUrl);
  const arrayBuffer = await response.arrayBuffer();

  return analyzeAudio(arrayBuffer);
}

/**
 * Check if essentia is ready
 */
export function isEssentiaReady(): boolean {
  return isInitialized;
}

/**
 * Pre-initialize essentia (call on app load)
 */
export async function preloadEssentia(): Promise<void> {
  try {
    await initEssentia();
  } catch (error) {
    console.warn('Essentia pre-load failed, will retry on first use:', error);
  }
}
