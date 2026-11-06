/**
 * Generative identity. One short seed deterministically produces the palette,
 * the planet, its rings and the logo's orbit, so every visitor gets their own
 * Orbital and any one can be shared as a link.
 */

export type Palette = {
  name: string;
  /** Background void. */
  void: string;
  /** Primary and secondary nebula / planet colours. */
  a: string;
  b: string;
  /** Atmosphere and highlight. */
  c: string;
  /** Starlight and ring dust. */
  star: string;
};

export const PALETTES: Palette[] = [
  { name: "Nebula", void: "#04050d", a: "#7c5cff", b: "#ff4fa3", c: "#5ee7ff", star: "#ffe9c2" },
  { name: "Ion", void: "#02060d", a: "#2f6bff", b: "#45d4ff", c: "#b48cff", star: "#e8f3ff" },
  { name: "Solar", void: "#0b0503", a: "#ff6a3d", b: "#ffc24a", c: "#ff3d7f", star: "#fff0d8" },
  { name: "Aurora", void: "#020a0b", a: "#2ee6a8", b: "#4f7dff", c: "#c06bff", star: "#e9fff7" },
];

export type Planet = {
  radius: number;
  terrain: number;
  noiseScale: number;
  bands: number;
  spin: number;
  atmosphere: number;
  ringTilt: number;
  ringInner: number;
  ringOuter: number;
  ringDensity: number;
};

export type Identity = {
  seed: string;
  paletteIndex: number;
  palette: Palette;
  planet: Planet;
  /** Logo orbit tilt in degrees. */
  orbitTilt: number;
};

/** FNV-1a: tiny, stable string hash. Also inlined in the pre-paint script. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEFAULT_SEED = "orbital";

/** Seeds are short, lowercase and URL-safe. Anything else is cleaned up. */
export function normalizeSeed(raw: string | null | undefined): string | null {
  const s = (raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  return s.length >= 3 ? s : null;
}

export function randomSeed(rand: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(rand() * 32)];
  return s;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function identity(seed: string): Identity {
  const h = fnv1a(seed);
  const rand = mulberry32(h);
  const paletteIndex = h % PALETTES.length;
  const planet: Planet = {
    radius: lerp(0.78, 1.0, rand()),
    terrain: lerp(0.015, 0.045, rand()),
    noiseScale: lerp(1.6, 3.4, rand()),
    bands: Math.round(lerp(3, 9, rand())),
    spin: lerp(0.02, 0.06, rand()),
    atmosphere: lerp(0.6, 1.1, rand()),
    ringTilt: lerp(0.18, 0.42, rand()) * (rand() > 0.5 ? 1 : -1),
    ringInner: lerp(1.35, 1.6, rand()),
    ringOuter: lerp(1.95, 2.45, rand()),
    ringDensity: lerp(0.6, 1.4, rand()),
  };
  return {
    seed,
    paletteIndex,
    palette: PALETTES[paletteIndex],
    planet,
    orbitTilt: Math.round(lerp(-28, 28, rand())),
  };
}

/**
 * Runs in <head> before first paint: resolves the seed (URL or random) and
 * applies its palette as CSS variables, so there's no flash of the wrong
 * colours. Kept in sync with fnv1a/PALETTES above by a unit test.
 */
export const prePaintScript = `(function(){try{
var P=${JSON.stringify(PALETTES)};
function h(s){var x=0x811c9dc5;for(var i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,0x01000193)}return x>>>0}
var q=new URLSearchParams(location.search).get("seed")||"";
var s=q.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,12);
if(s.length<3){var a="abcdefghijkmnpqrstuvwxyz23456789";s="";for(var i=0;i<6;i++)s+=a[Math.floor(Math.random()*32)]}
window.__ORBITAL_SEED__=s;
var p=P[h(s)%P.length],r=document.documentElement.style;
r.setProperty("--void",p.void);r.setProperty("--a",p.a);r.setProperty("--b",p.b);r.setProperty("--c",p.c);r.setProperty("--star",p.star);
}catch(e){}})();`;
