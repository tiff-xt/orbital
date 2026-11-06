import { describe, expect, it } from "vitest";
import { decodeLab, encodeLab } from "@/lib/labParams";

describe("lab URL state", () => {
  it("round-trips overrides", () => {
    const o = { radius: 0.9, ringTilt: -0.25, bands: 6, paletteIndex: 2 };
    expect(decodeLab(encodeLab(o), 4)).toEqual(o);
  });

  it("clamps and drops hostile values", () => {
    const out = decodeLab(new URLSearchParams("radius=99&terrain=abc&palette=9&bands=-4"), 4);
    expect(out).toEqual({ radius: 1.2, bands: 0 });
  });

  it("repairs an inverted ring", () => {
    const out = decodeLab(new URLSearchParams("ringInner=1.9&ringOuter=1.6"), 4);
    expect(out.ringOuter).toBeGreaterThan(out.ringInner!);
  });
});
