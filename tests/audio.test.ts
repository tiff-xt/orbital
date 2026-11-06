import { describe, expect, it } from "vitest";
import { bandLevels, envelope, shape } from "@/lib/audio/bands";

const SR = 48000;
const FFT = 1024; // 512 bins, ~46.9 Hz each

function spectrumWithPeak(hz: number) {
  const s = new Uint8Array(FFT / 2);
  s[Math.round(hz / (SR / FFT))] = 255;
  return s;
}

describe("bandLevels", () => {
  it("routes energy to the right band", () => {
    const [b1] = bandLevels(spectrumWithPeak(80), SR, FFT);
    const [, m2] = bandLevels(spectrumWithPeak(800), SR, FFT);
    const [, , h3] = bandLevels(spectrumWithPeak(5000), SR, FFT);
    expect(b1).toBeGreaterThan(0);
    expect(m2).toBeGreaterThan(0);
    expect(h3).toBeGreaterThan(0);
    expect(bandLevels(spectrumWithPeak(80), SR, FFT).slice(1)).toEqual([0, 0]);
  });

  it("is 1 for a saturated spectrum and 0 for silence", () => {
    expect(bandLevels(new Uint8Array(512).fill(255), SR, FFT)).toEqual([1, 1, 1]);
    expect(bandLevels(new Uint8Array(512), SR, FFT)).toEqual([0, 0, 0]);
  });
});

describe("envelope and shape", () => {
  it("attacks fast and releases slowly", () => {
    const up = envelope(0, 1);
    const down = envelope(1, 0);
    expect(up).toBeGreaterThan(0.5);
    expect(down).toBeGreaterThan(0.9);
  });
  it("clamps to 0..1", () => {
    expect(shape(2, 3)).toBe(1);
    expect(shape(-1, 1)).toBe(0);
  });
});
