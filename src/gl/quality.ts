/**
 * Adaptive quality governor. Watches frame times and trades resolution and
 * ray-march steps for frame rate, with hysteresis so it doesn't oscillate.
 */
export type Tier = { name: "high" | "medium" | "low"; scale: number; steps: number };

export const TIERS: Tier[] = [
  { name: "high", scale: 1, steps: 64 },
  { name: "medium", scale: 0.75, steps: 40 },
  { name: "low", scale: 0.5, steps: 24 },
];

export class QualityGovernor {
  private index: number;
  private samples: number[] = [];
  private cooldown = 0;

  constructor(
    start: Tier["name"] = "high",
    private readonly window = 45,
  ) {
    this.index = Math.max(
      0,
      TIERS.findIndex((t) => t.name === start),
    );
  }

  get tier() {
    return TIERS[this.index];
  }

  /** Average of the current sample window, for display. */
  get frameMs() {
    if (!this.samples.length) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  /** Feed one frame time. Returns true when the tier changed. */
  sample(ms: number): boolean {
    if (ms > 1000) return false; // tab switch or breakpoint, not a real frame
    this.samples.push(ms);
    if (this.samples.length < this.window) return false;
    const avg = this.frameMs;
    this.samples = [];
    if (this.cooldown > 0) {
      this.cooldown--;
      return false;
    }
    if (avg > 21 && this.index < TIERS.length - 1) {
      this.index++;
      this.cooldown = 2;
      return true;
    }
    if (avg < 11 && this.index > 0) {
      this.index--;
      this.cooldown = 4; // stepping up is riskier: wait longer before the next change
      return true;
    }
    return false;
  }
}
