/**
 * Reduce an FFT magnitude spectrum to three perceptual bands, normalised 0..1.
 * Pure, so it's unit-tested without Web Audio.
 */
export const BANDS = {
  bass: [20, 150],
  mid: [150, 2000],
  high: [2000, 9000],
} as const;

export function bandLevels(spectrum: ArrayLike<number>, sampleRate: number, fftSize: number): [number, number, number] {
  const hzPerBin = sampleRate / fftSize;
  const level = ([lo, hi]: readonly [number, number]) => {
    const a = Math.max(1, Math.floor(lo / hzPerBin));
    const b = Math.min(spectrum.length - 1, Math.ceil(hi / hzPerBin));
    if (b < a) return 0;
    let sum = 0;
    for (let i = a; i <= b; i++) sum += spectrum[i];
    return sum / (b - a + 1) / 255;
  };
  return [level(BANDS.bass), level(BANDS.mid), level(BANDS.high)];
}

/** Fast attack, slow release: punchy on beats, no flicker between them. */
export function envelope(prev: number, next: number, attack = 0.55, release = 0.08) {
  return prev + (next - prev) * (next > prev ? attack : release);
}

/** Lift quiet signals (mics are quiet) and clamp. */
export function shape(level: number, gain: number) {
  return Math.min(1, Math.pow(Math.max(0, level * gain), 0.8));
}
