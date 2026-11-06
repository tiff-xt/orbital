import { SeedBadge } from "@/components/SeedBadge";
import { SoundButton } from "@/components/SoundButton";
import { WarpLink } from "@/components/WarpLink";

const manifesto =
  "Static logos are a print-era habit. On a screen a brand can breathe, react and make a sound. We build identities as systems: one seed, endless variations, always recognisably itself.";

const work = [
  {
    client: "Halden Observatory",
    kind: "Identity · Planetarium site",
    body: "A night-sky identity that redraws itself from the real sky above the building, every hour.",
    hue: "var(--c)",
  },
  {
    client: "Tidewell Audio",
    kind: "Sonic brand · Visualiser system",
    body: "A three-note sonic logo and a visualiser that every product page, ad and speaker display shares.",
    hue: "var(--a)",
  },
  {
    client: "Halcyon Moto",
    kind: "Launch site · Real-time 3D",
    body: "A naked-bike launch told in light and engine sound, scrubbed by scroll instead of a video player.",
    hue: "var(--b)",
  },
];

const capabilities = [
  ["Generative identity", "Logos, palettes and layouts as code: seeded, versioned, infinitely consistent."],
  ["Real-time graphics", "Custom shaders and ray-marched scenes that run at 60 fps on a mid-range phone."],
  ["Motion & sound", "Interaction choreography, sonic logos and audio-reactive systems."],
  ["Web experiences", "Launch sites and product stories, built to be fast, accessible and measurable."],
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[100svh] flex-col justify-end px-5 pb-16 pt-32 sm:px-10 sm:pb-24">
        <div className="mx-auto w-full max-w-6xl">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-white/60">Design &amp; motion studio</p>
          <h1 className="wordmark font-display text-[clamp(2.8rem,11.5vw,11rem)] font-extrabold leading-[0.82] tracking-[-0.03em]">
            ORBITAL
          </h1>
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
              We design brands that move: identities, real-time graphics and sound, built for the web.
            </p>
            <div className="flex flex-wrap gap-3">
              <WarpLink
                href="/lab"
                className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-medium text-black transition-transform active:scale-95"
              >
                Enter the lab →
              </WarpLink>
              <SoundButton className="glass inline-flex h-12 items-center rounded-full px-6 text-sm font-medium transition-colors hover:bg-white/10">
                Turn on sound
              </SoundButton>
            </div>
          </div>
          <div className="mt-10">
            <SeedBadge />
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section aria-label="Manifesto" className="px-5 py-32 sm:px-10 sm:py-48">
        <p className="mx-auto max-w-5xl font-display text-[clamp(1.9rem,4.6vw,4rem)] font-semibold leading-[1.12] tracking-[-0.01em]">
          {manifesto.split(" ").map((w, i) => (
            <span key={i} className="scrub-word">
              {w}{" "}
            </span>
          ))}
        </p>
      </section>

      {/* Work */}
      <section id="work" className="scroll-mt-24 px-5 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 font-mono text-xs uppercase tracking-[0.3em] text-white/60">Selected work</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {work.map((w, i) => (
              <li key={w.client} className="rise glass group relative overflow-hidden rounded-3xl p-6">
                <OrbitArt hue={w.hue} variant={i} />
                <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-white/50">{w.kind}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold">{w.client}</h3>
                <p className="mt-3 leading-relaxed text-white/70">{w.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Capabilities */}
      <section className="px-5 py-24 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
          {capabilities.map(([title, body], i) => (
            <div key={title} className="rise bg-void/80 p-8 backdrop-blur-md sm:p-10">
              <span className="font-mono text-xs text-c">0{i + 1}</span>
              <h3 className="mt-4 font-display text-2xl font-semibold">{title}</h3>
              <p className="mt-2 max-w-md leading-relaxed text-white/70">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sound */}
      <section aria-labelledby="sound-title" className="px-5 py-32 sm:px-10">
        <div className="rise glass mx-auto max-w-4xl rounded-[2rem] p-8 text-center sm:p-14">
          <h2
            id="sound-title"
            className="text-glow font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-none"
          >
            Turn it up.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/75">
            The whole sky listens. Bass swells the atmosphere and rings, mids churn the nebula, highs make the stars
            flicker. Play the built-in synth, or use your microphone and talk, clap or play music.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <SoundButton className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-medium text-black">
              Play the synth
            </SoundButton>
            <SoundButton
              mode="mic"
              className="glass inline-flex h-12 items-center rounded-full px-6 text-sm font-medium hover:bg-white/10"
            >
              Use my microphone
            </SoundButton>
          </div>
          <p className="mt-6 font-mono text-[11px] text-white/45">
            Audio is analysed in your browser. Nothing is recorded or sent anywhere.
          </p>
        </div>
      </section>

      <footer className="px-5 pb-28 pt-16 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 border-t border-line pt-8 text-sm text-white/55 sm:flex-row">
          <p>
            Orbital is a fictional studio: a concept piece designed and built by{" "}
            <a href="https://github.com/tiff-xt" className="text-white underline underline-offset-4">
              Tiff
            </a>
            .
          </p>
          <a
            href="https://github.com/tiff-xt/orbital"
            className="font-mono text-xs underline underline-offset-4 hover:text-white"
          >
            Source ↗
          </a>
        </div>
      </footer>
    </main>
  );
}

/** Small generative orbit diagrams for the work cards. */
function OrbitArt({ hue, variant }: { hue: string; variant: number }) {
  return (
    <svg viewBox="0 0 200 120" className="h-36 w-full" aria-hidden>
      <g
        className="origin-center transition-transform duration-[1.2s] ease-out group-hover:rotate-[14deg]"
        style={{ transformBox: "fill-box" }}
      >
        {[0, 1, 2].map((r) => (
          <ellipse
            key={r}
            cx="100"
            cy="60"
            rx={36 + r * 26}
            ry={12 + r * 8}
            fill="none"
            stroke={hue}
            strokeOpacity={0.55 - r * 0.15}
            transform={`rotate(${(variant - 1) * 18 + r * 6} 100 60)`}
          />
        ))}
      </g>
      <circle cx="100" cy="60" r="16" fill={hue} fillOpacity=".9" />
      <circle
        cx="100"
        cy="60"
        r="28"
        fill={hue}
        fillOpacity=".12"
        className="transition-all duration-700 group-hover:[r:40]"
      />
    </svg>
  );
}
