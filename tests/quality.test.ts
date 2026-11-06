import { describe, expect, it } from "vitest";
import { QualityGovernor } from "@/gl/quality";

const feed = (g: QualityGovernor, ms: number, frames: number) => {
  let changed = 0;
  for (let i = 0; i < frames; i++) if (g.sample(ms)) changed++;
  return changed;
};

describe("QualityGovernor", () => {
  it("steps down when frames are slow", () => {
    const g = new QualityGovernor("high", 10);
    feed(g, 30, 10);
    expect(g.tier.name).toBe("medium");
  });

  it("waits out a cooldown before changing again (no oscillation)", () => {
    const g = new QualityGovernor("high", 10);
    feed(g, 30, 10); // → medium, cooldown 2
    feed(g, 30, 20); // two windows absorbed by cooldown
    expect(g.tier.name).toBe("medium");
    feed(g, 30, 10);
    expect(g.tier.name).toBe("low");
  });

  it("steps back up when there's headroom", () => {
    const g = new QualityGovernor("low", 10);
    feed(g, 6, 10);
    expect(g.tier.name).toBe("medium");
  });

  it("ignores outlier frames like tab switches", () => {
    const g = new QualityGovernor("high", 10);
    feed(g, 5000, 50);
    expect(g.tier.name).toBe("high");
  });
});
