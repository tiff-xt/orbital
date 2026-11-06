import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PALETTES } from "@/lib/identity";

export const alt = "ORBITAL, a design and motion studio rendered with shaders: a ringed planet in a nebula";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "src/assets", file));
const geist = font("geist-sans-latin-400-normal.woff");
const syne = font("syne-latin-800-normal.woff");

/** Social card in the default "Nebula" palette. */
export default async function Image() {
  const p = PALETTES[0];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: `radial-gradient(60% 70% at 78% 40%, ${p.a}55, transparent 70%), radial-gradient(45% 50% at 15% 95%, ${p.b}40, transparent 70%), ${p.void}`,
        color: "#eef0ff",
        fontFamily: "Geist",
      }}
    >
      {/* Stars */}
      {[
        [90, 80, 2],
        [300, 150, 1.5],
        [520, 60, 2],
        [640, 260, 1.5],
        [1120, 90, 2.5],
        [1040, 540, 1.5],
        [760, 560, 2],
        [180, 300, 1.5],
        [430, 380, 1],
        [980, 300, 1],
      ].map(([x, y, r], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: r * 2,
            height: r * 2,
            borderRadius: 999,
            background: p.star,
            opacity: 0.8,
          }}
        />
      ))}

      {/* Planet and ring */}
      <svg width="460" height="460" viewBox="0 0 560 560" style={{ position: "absolute", right: -10, top: 0 }}>
        <defs>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.55" stopColor={p.c} stopOpacity="0.35" />
            <stop offset="1" stopColor={p.c} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={p.a} />
            <stop offset="0.65" stopColor={p.b} />
            <stop offset="1" stopColor={p.void} />
          </linearGradient>
        </defs>
        <circle cx="280" cy="280" r="230" fill="url(#glow)" />
        <ellipse
          cx="280"
          cy="280"
          rx="262"
          ry="70"
          fill="none"
          stroke={p.star}
          strokeOpacity="0.35"
          strokeWidth="10"
          transform="rotate(-16 280 280)"
        />
        <circle cx="280" cy="280" r="150" fill="url(#body)" />
        <path
          d="M 18 280 A 262 70 0 0 0 542 280"
          fill="none"
          stroke={p.star}
          strokeOpacity="0.55"
          strokeWidth="10"
          transform="rotate(-16 280 280)"
        />
      </svg>

      {/* Copy */}
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 80,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 7, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
          Design &amp; motion studio
        </div>
        <div
          style={{
            fontFamily: "Syne",
            fontSize: 124,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 1,
            marginTop: 18,
            backgroundImage: `linear-gradient(90deg, ${p.c}, ${p.a} 55%, ${p.b})`,
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          ORBITAL
        </div>
        <div style={{ fontSize: 34, lineHeight: 1.35, marginTop: 24, color: "rgba(255,255,255,0.82)", maxWidth: 820 }}>
          We design brands that move: identities, real-time graphics and sound, built for the web.
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist", data: await geist, style: "normal", weight: 400 },
        { name: "Syne", data: await syne, style: "normal", weight: 800 },
      ],
    },
  );
}
