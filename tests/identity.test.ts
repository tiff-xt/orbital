import { describe, expect, it } from "vitest";
import { fnv1a, identity, normalizeSeed, PALETTES, prePaintScript, randomSeed, mulberry32 } from "@/lib/identity";

describe("identity", () => {
  it("is deterministic per seed", () => {
    expect(identity("k3x9q2")).toEqual(identity("k3x9q2"));
    expect(identity("k3x9q2")).not.toEqual(identity("k3x9q3"));
  });

  it("keeps generated parameters in usable ranges across many seeds", () => {
    const rand = mulberry32(1);
    for (let i = 0; i < 500; i++) {
      const { planet: p, orbitTilt } = identity(randomSeed(rand));
      expect(p.radius).toBeGreaterThan(0.7);
      expect(p.radius).toBeLessThanOrEqual(1);
      expect(p.ringOuter - p.ringInner).toBeGreaterThan(0.3);
      expect(Number.isInteger(p.bands)).toBe(true);
      expect(Math.abs(orbitTilt)).toBeLessThanOrEqual(28);
    }
  });

  it("normalises seeds from untrusted URLs", () => {
    expect(normalizeSeed("K3X-9Q2!")).toBe("k3x9q2");
    expect(normalizeSeed("<script>")).toBe("script");
    expect(normalizeSeed("ab")).toBeNull();
    expect(normalizeSeed(null)).toBeNull();
    expect(normalizeSeed("a".repeat(40))).toHaveLength(12);
  });

  it("pre-paint script picks the same palette as the TypeScript identity", () => {
    // Run the inline script against a fake DOM and compare.
    for (const seed of ["orbital", "k3x9q2", "zz9", "solar1"]) {
      const props: Record<string, string> = {};
      const fakeWindow: Record<string, unknown> = {};
      const run = new Function("location", "document", "window", "URLSearchParams", prePaintScript);
      run(
        { search: `?seed=${seed}` },
        { documentElement: { style: { setProperty: (k: string, v: string) => (props[k] = v) } } },
        fakeWindow,
        URLSearchParams,
      );
      expect(fakeWindow.__ORBITAL_SEED__).toBe(seed);
      expect(props["--a"]).toBe(identity(seed).palette.a);
      expect(PALETTES[fnv1a(seed) % PALETTES.length].a).toBe(props["--a"]);
    }
  });
});
