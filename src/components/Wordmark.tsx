"use client";
import { useEffect, useRef } from "react";

export const WORDMARKS = ["extrude", "chrome", "orbit", "signal"] as const;
export type WordmarkStyle = (typeof WORDMARKS)[number];

/**
 * The hero wordmark, in several art directions. All styles share one markup:
 * the real text is a single span; every other layer is decorative and hidden
 * from assistive tech. CSS picks the layers per style ([data-wm]).
 * `?wm=chrome|orbit|signal|extrude` previews a style.
 */
export function Wordmark({ initial = "extrude" as WordmarkStyle }) {
  const ref = useRef<HTMLHeadingElement>(null);
  // Preview override from the URL; applied to the DOM directly, no re-render.
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("wm");
    if (q && (WORDMARKS as readonly string[]).includes(q) && ref.current) ref.current.dataset.wm = q;
  }, []);

  const word = "ORBITAL";
  return (
    <h1
      ref={ref}
      data-wm={initial}
      className="wm font-display text-[clamp(2.8rem,11.5vw,11rem)] font-extrabold leading-[0.82] tracking-[-0.03em]"
    >
      <span aria-hidden className="wm-layer wm-echo wm-echo-2">
        {word}
      </span>
      <span aria-hidden className="wm-layer wm-echo">
        {word}
      </span>
      <Ring className="wm-ring wm-ring-back" />
      <span className="wm-face">{word}</span>
      <span aria-hidden className="wm-layer wm-shine">
        {word}
      </span>
      <span aria-hidden className="wm-layer wm-signal">
        {word}
      </span>
      <Ring className="wm-ring wm-ring-front" front />
    </h1>
  );
}

/** One orbit drawn twice: the back copy sits behind the letters, the front copy is clipped to the near half. */
function Ring({ className, front = false }: { className: string; front?: boolean }) {
  const path = "M 980 150 A 480 64 0 1 1 20 150 A 480 64 0 1 1 980 150";
  const id = front ? "wm-near" : undefined;
  return (
    <svg aria-hidden className={className} viewBox="0 0 1000 300" preserveAspectRatio="none">
      {front && (
        <defs>
          <clipPath id={id}>
            <rect x="0" y="150" width="1000" height="150" />
          </clipPath>
        </defs>
      )}
      <g transform="rotate(-7 500 150)">
        <g clipPath={front ? `url(#${id})` : undefined}>
          <path d={path} fill="none" stroke="var(--c)" strokeWidth={front ? 3 : 2} vectorEffect="non-scaling-stroke" />
          <circle r="9" fill="var(--star)">
            <animateMotion dur="9s" repeatCount="indefinite" path={path} />
          </circle>
        </g>
      </g>
    </svg>
  );
}
