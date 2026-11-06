"use client";
import { useIdentity } from "./useScene";

/** The mark is generated too: the orbit's tilt comes from the seed. */
export function Logo({ size = 28 }: { size?: number }) {
  const id = useIdentity();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id="planet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--a)" />
          <stop offset="1" stopColor="var(--b)" />
        </linearGradient>
      </defs>
      <g transform={`rotate(${id.orbitTilt} 20 20)`}>
        <ellipse
          cx="20"
          cy="20"
          rx="18"
          ry="6.5"
          fill="none"
          stroke="var(--star)"
          strokeOpacity=".55"
          strokeWidth="1.2"
        />
        <circle cx="20" cy="20" r="8.5" fill="url(#planet)" />
        <circle r="2.2" fill="var(--c)" className="logo-moon">
          <animateMotion dur="6s" repeatCount="indefinite" path="M 38 20 A 18 6.5 0 1 1 2 20 A 18 6.5 0 1 1 38 20" />
        </circle>
        {/* Parked moon for reduced motion (SMIL ignores CSS, so the animated one is hidden instead). */}
        <circle cx="38" cy="20" r="2.2" fill="var(--c)" className="logo-moon-still" />
      </g>
    </svg>
  );
}
