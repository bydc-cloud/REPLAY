// Type declarations for essentia.js
declare module 'essentia.js' {
  export class Essentia {
    constructor(essentiaModule: any);

    // Array conversion utilities
    arrayToVector(array: Float32Array): any;
    vectorToArray(vector: any): Float32Array;

    // Audio analysis algorithms
    PercivalBpmEstimator(signal: any): { bpm: number };
    RhythmExtractor2013(signal: any): { bpm: number; beats: number[]; confidence: number };
    KeyExtractor(signal: any): { key: string; scale: string; strength: number };

    // Other common algorithms
    Spectrum(signal: any): any;
    MFCC(spectrum: any): any;
    RMS(signal: any): number;
    Energy(signal: any): number;
  }

  export function EssentiaWASM(): Promise<any>;

  export default Essentia;
}
