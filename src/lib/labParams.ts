import type { Planet } from "./identity";

/** Lab controls: ranges, labels and the uniform each one drives. */
export type Control = { key: keyof Planet; label: string; min: number; max: number; step: number; group: string };

export const CONTROLS: Control[] = [
  { key: "radius", label: "Radius", min: 0.5, max: 1.2, step: 0.01, group: "Planet" },
  { key: "terrain", label: "Terrain height", min: 0, max: 0.15, step: 0.005, group: "Planet" },
  { key: "noiseScale", label: "Noise scale", min: 0.5, max: 6, step: 0.1, group: "Planet" },
  { key: "bands", label: "Cloud bands", min: 0, max: 14, step: 1, group: "Planet" },
  { key: "spin", label: "Spin", min: 0, max: 0.2, step: 0.005, group: "Planet" },
  { key: "atmosphere", label: "Atmosphere", min: 0, max: 2, step: 0.05, group: "Atmosphere" },
  { key: "ringTilt", label: "Ring tilt", min: -0.8, max: 0.8, step: 0.01, group: "Rings" },
  { key: "ringInner", label: "Inner edge", min: 1.1, max: 2, step: 0.01, group: "Rings" },
  { key: "ringOuter", label: "Outer edge", min: 1.5, max: 3, step: 0.01, group: "Rings" },
  { key: "ringDensity", label: "Dust density", min: 0.2, max: 2.5, step: 0.05, group: "Rings" },
];

const clamp = (v: number, c: Control) => Math.min(c.max, Math.max(c.min, v));

/** Lab state ⇄ URL, so any configuration is a shareable link. */
export function encodeLab(overrides: Partial<Planet> & { paletteIndex?: number }): URLSearchParams {
  const p = new URLSearchParams();
  for (const c of CONTROLS) {
    const v = overrides[c.key];
    if (v !== undefined) p.set(c.key, String(Number(v.toFixed(4))));
  }
  if (overrides.paletteIndex !== undefined) p.set("palette", String(overrides.paletteIndex));
  return p;
}

export function decodeLab(params: URLSearchParams, paletteCount: number) {
  const out: Partial<Planet> & { paletteIndex?: number } = {};
  for (const c of CONTROLS) {
    const raw = params.get(c.key);
    if (raw === null) continue;
    const n = Number(raw);
    if (Number.isFinite(n)) out[c.key] = clamp(n, c);
  }
  const pal = Number(params.get("palette"));
  if (params.has("palette") && Number.isInteger(pal) && pal >= 0 && pal < paletteCount) out.paletteIndex = pal;
  // Keep the ring sensible even if a URL says otherwise.
  if (out.ringInner !== undefined && out.ringOuter !== undefined && out.ringOuter <= out.ringInner) {
    out.ringOuter = Math.min(3, out.ringInner + 0.3);
  }
  return out;
}
