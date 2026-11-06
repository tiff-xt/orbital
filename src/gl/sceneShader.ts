/**
 * The whole scene is one fragment shader:
 *   1. background: domain-warped fbm nebula + two parallax star layers
 *   2. planet: SDF sphere with fbm terrain, ray-marched only inside its
 *      bounding sphere (analytic test first, so empty sky costs nothing)
 *   3. rings: analytic ray–plane hit, banded dust, shadowed by the planet
 *   4. atmosphere: fresnel rim + volumetric-ish halo from closest approach
 *   5. warp: hyperspace streaks for page transitions
 * Audio (bass, mid, high) drives atmosphere, nebula turbulence and starlight.
 */
export const sceneFragment = /* glsl */ `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;      // -1..1
uniform float uScroll;     // 0..1 page progress
uniform vec2  uPlanetPos;  // screen-space centre in NDC-ish units
uniform vec3  uVoid, uA, uB, uC, uStar;
uniform float uRadius, uTerrain, uNoise, uBands, uSpin, uAtmos;
uniform float uRingTilt, uRingInner, uRingOuter, uRingDensity;
uniform vec3  uAudio;      // bass, mid, high (0..1)
uniform float uWarp;       // 0..1
uniform int   uSteps;

const vec3 LIGHT = normalize(vec3(-0.7, 0.45, 0.55));

// ── noise ───────────────────────────────────────────────────
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1,0,0)), u.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), u.x), u.y),
    mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), u.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), u.x), u.y),
    u.z);
}
float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise3(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// ── background ──────────────────────────────────────────────
vec3 stars(vec2 uv, float scale, float t) {
  vec2 g = uv * scale;
  vec2 id = floor(g), f = fract(g) - 0.5;
  float h = hash12(id);
  if (h < 0.965) return vec3(0.0);
  vec2 off = vec2(hash12(id + 7.1), hash12(id + 3.7)) - 0.5;
  float d = length(f - off * 0.7);
  float tw = 0.6 + 0.4 * sin(t * (1.5 + h * 3.0) + h * 40.0);
  float b = smoothstep(0.08, 0.0, d) * tw * (0.6 + uAudio.z * 1.6);
  return mix(uStar, uC, step(0.992, h)) * b;
}

vec3 background(vec2 uv, float t) {
  vec2 p = uv + uMouse * 0.02 + vec2(0.0, uScroll * 0.35);
  // Domain warping: fbm of fbm, so the gas folds in on itself.
  vec3 q = vec3(p * 1.3, t * 0.015);
  float w = fbm(q + vec3(fbm(q + 4.0), fbm(q + 9.0), 0.0) * (1.4 + uAudio.y * 1.5));
  float mask = smoothstep(0.35, 0.85, fbm(vec3(p * 0.7 + 3.0, t * 0.01)));
  vec3 neb = mix(uA, uB, smoothstep(0.3, 0.75, w)) * pow(w, 2.2) * mask * 1.25;
  vec3 col = uVoid + neb * 0.55;
  col += stars(p + uMouse * 0.01, 90.0, t) * 1.2;
  col += stars(p * 0.8 + uMouse * 0.03 + 11.0, 45.0, t) * 1.6;
  return col;
}

// ── planet ──────────────────────────────────────────────────
vec3 planetLocal(vec3 p, float t) {
  vec3 q = p;
  q.xz *= rot(t * uSpin);
  return q;
}
float terrain(vec3 n, float t) {
  return fbm(planetLocal(n, t) * uNoise);
}
float sdPlanet(vec3 p, float t) {
  float r = length(p);
  return r - uRadius - uTerrain * terrain(p / max(r, 1e-4), t);
}
vec3 normalAt(vec3 p, float t) {
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.002;
  return normalize(
    k.xyy * sdPlanet(p + k.xyy * e, t) + k.yyx * sdPlanet(p + k.yyx * e, t) +
    k.yxy * sdPlanet(p + k.yxy * e, t) + k.xxx * sdPlanet(p + k.xxx * e, t));
}
// Ray–sphere: returns (tNear, tFar) or (-1,-1).
vec2 sphere(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - r * r;
  float h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;
  float t = uTime;

  // Warp: zoom the sky toward the centre and streak the starlight.
  float warp = uWarp * uWarp;
  vec2 wuv = uv * (1.0 - warp * 0.55);
  vec3 col = background(wuv, t);
  float ang = atan(uv.y, uv.x);
  float lane = hash12(vec2(floor(ang * 150.0), 1.0));
  float streak = step(0.9, lane) * smoothstep(0.05, 0.9, length(uv)) * warp;
  col += mix(uStar, uC, lane) * streak * 2.2;

  // Camera: planet sits at uPlanetPos; scroll pulls it away and up.
  vec2 pp = uPlanetPos + vec2(-0.25, 0.55) * uScroll;
  vec3 ro = vec3(0.0, 0.0, 5.6 + uScroll * 2.4);
  vec3 rd = normalize(vec3(uv - pp, -1.55));
  rd.yz *= rot(uMouse.y * 0.06);
  rd.xz *= rot(-uMouse.x * 0.08);

  float bass = uAudio.x;
  float bound = uRadius * (1.0 + uTerrain * 1.6);
  vec2 hit = sphere(ro, rd, bound);

  // Rings plane (shared by occlusion test and shading).
  vec3 rn = normalize(vec3(0.0, cos(uRingTilt), sin(uRingTilt)));
  rn.xy *= rot(0.35);
  float denom = dot(rd, rn);
  float tRing = abs(denom) > 1e-4 ? -dot(ro, rn) / denom : -1.0;

  float tPlanet = -1.0;
  vec3 pHit;
  if (hit.y > 0.0) {
    float tt = max(hit.x, 0.0);
    for (int i = 0; i < 96; i++) {
      if (i >= uSteps) break;
      vec3 p = ro + rd * tt;
      float d = sdPlanet(p, t);
      if (d < 0.0015) { tPlanet = tt; pHit = p; break; }
      tt += d * 0.85;
      if (tt > hit.y) break;
    }
  }

  // Atmosphere halo from the ray's closest approach to the planet.
  float closest = length(cross(ro, rd));
  float halo = exp(-max(closest - uRadius, 0.0) * 9.0) * (0.35 + bass * 0.9) * uAtmos;
  if (dot(-ro, rd) > 0.0) col += uC * halo * 0.6;

  if (tPlanet > 0.0) {
    vec3 n = normalAt(pHit, t);
    vec3 loc = planetLocal(normalize(pHit), t);
    float h = terrain(normalize(pHit), t);
    // Latitude bands, wobbled by terrain.
    float band = 0.5 + 0.5 * sin(loc.y * uBands * 3.14159 + h * 6.0);
    vec3 albedo = mix(uA, uB, band) * 0.55;
    albedo = mix(albedo, uStar * 0.8, smoothstep(0.62, 0.78, h) * 0.6);
    float diff = max(dot(n, LIGHT), 0.0);
    float term = smoothstep(-0.15, 0.35, dot(n, LIGHT));
    vec3 surf = albedo * (0.04 + diff * 1.2) * term;
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    surf += uC * fres * (0.55 + bass * 1.2) * uAtmos;
    float spec = pow(max(dot(reflect(-LIGHT, n), -rd), 0.0), 24.0) * 0.25;
    surf += uStar * spec;
    col = surf;
  }

  // Rings: drawn in front of the planet only when closer.
  if (tRing > 0.0 && (tPlanet < 0.0 || tRing < tPlanet)) {
    vec3 q = ro + rd * tRing;
    float r = length(q) / uRadius;
    if (r > uRingInner && r < uRingOuter) {
      float edge = smoothstep(uRingInner, uRingInner + 0.05, r) * smoothstep(uRingOuter, uRingOuter - 0.12, r);
      float dust = 0.55 + 0.45 * sin(r * 48.0 * uRingDensity + noise3(vec3(r * 12.0, 0.0, 0.0)) * 4.0);
      dust *= 0.6 + 0.4 * noise3(vec3(r * 40.0, 3.0, 1.0));
      // Planet shadow on the rings.
      vec2 sh = sphere(q, LIGHT, uRadius);
      float lit = sh.y > 0.0 ? 0.15 : 1.0;
      float facing = 0.55 + 0.45 * abs(dot(rn, LIGHT));
      vec3 ringCol = mix(uStar, mix(uA, uC, 0.5 + 0.5 * sin(r * 3.0)), 0.45 + 0.25 * sin(r * 6.0)) * (0.7 + bass * 0.8);
      float alpha = edge * dust * 0.7;
      col = mix(col, ringCol * lit * facing, alpha);
    }
  }

  // Grade: soft tone map, vignette, gamma; fade the planet during warp.
  col *= 1.0 - warp * 0.35;
  col = 1.0 - exp(-col * 1.35);
  col *= 1.0 - 0.35 * dot(uv * 0.85, uv * 0.85);
  col = pow(col, vec3(1.0 / 2.2));
  // Ordered dither kills banding in the dark gradients.
  col += (hash12(frag + fract(t)) - 0.5) / 255.0;
  fragColor = vec4(col, 1.0);
}
`;
