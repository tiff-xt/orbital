import { describe, expect, it } from "vitest";
import { identity } from "@/lib/identity";
import { decodeLab, encodeLab, resolveLab } from "@/lib/labParams";

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

describe("resolveLab", () => {
  it("layers overrides on the seeded identity without mutating it", () => {
    const id = identity("orbital");
    const before = structuredClone(id.planet);
    const out = resolveLab(id, { radius: 0.6, paletteIndex: (id.paletteIndex + 1) % 4 });
    expect(out.planet).toEqual({ ...before, radius: 0.6 });
    expect(out.paletteIndex).toBe((id.paletteIndex + 1) % 4);
    expect(id.planet).toEqual(before);
  });

  it("is deterministic for the same seed, so server and client renders agree", () => {
    expect(resolveLab(identity("orbital"), {})).toEqual(resolveLab(identity("orbital"), {}));
    expect(resolveLab(identity("orbital"), {}).paletteIndex).toBe(identity("orbital").paletteIndex);
  });
});
