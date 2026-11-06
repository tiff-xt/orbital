/**
 * The hero wordmark: faint glass letters that charge with the seeded palette
 * from left to right, with scan lines, flaring with the bass when sound is on.
 * The real text is one span; the glowing copy is decorative and hidden from
 * assistive tech.
 */
export function Wordmark() {
  const word = "ORBITAL";
  return (
    <h1 className="wm font-display text-[clamp(2.8rem,11.5vw,11rem)] font-extrabold leading-[0.82] tracking-[-0.03em]">
      <span className="wm-face">{word}</span>
      <span aria-hidden className="wm-signal">
        {word}
      </span>
    </h1>
  );
}
