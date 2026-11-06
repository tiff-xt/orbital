"use client";
import { useEffect, useRef } from "react";
import { createProgram, fullscreenTriangle, FULLSCREEN_VERTEX, hexToRgb } from "@/gl/program";
import { QualityGovernor } from "@/gl/quality";
import { sceneFragment } from "@/gl/sceneShader";
import { audio } from "@/lib/audio/engine";
import { scene } from "@/lib/sceneState";

/**
 * The persistent background. Lives in the root layout, so it survives route
 * changes and can carry the warp transition between pages.
 */
export function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      document.documentElement.dataset.webgl = "off";
      return;
    }

    let prog: ReturnType<typeof createProgram>;
    try {
      prog = createProgram(gl, FULLSCREEN_VERTEX, sceneFragment);
    } catch (err) {
      console.error(err);
      document.documentElement.dataset.webgl = "off";
      return;
    }
    const draw = fullscreenTriangle(gl, prog.program);
    prog.use();
    document.documentElement.dataset.webgl = "on";

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const governor = new QualityGovernor(matchMedia("(max-width: 640px)").matches ? "medium" : "high");
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let scroll = 0;
    let raf = 0;
    let last = performance.now();
    let fpsAcc = 0;
    let fpsFrames = 0;
    let visible = true;
    let lastBass = -1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * governor.tier.scale;
      const w = Math.round(innerWidth * dpr);
      const h = Math.round(innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const planetPos = (): [number, number] => {
      const aspect = innerWidth / innerHeight;
      if (scene.layout === "lab") {
        if (aspect > 1.1) return [-0.18 * aspect, scene.sheetOpen && innerWidth < 1024 ? 0.22 : 0.05];
        return [0, scene.sheetOpen ? 0.4 : 0.32];
      }
      // Wide screens: planet right of the headline. Tall screens: above it.
      return aspect > 1.1 ? [Math.min(0.4 * aspect, 0.6), 0.06] : [0.05, 0.3];
    };

    const pos = { x: 0, y: 0, ready: false };
    const frame = (now: number) => {
      raf = 0;
      const dt = now - last;
      last = now;
      if (governor.sample(dt)) resize();
      fpsAcc += dt;
      fpsFrames++;
      if (fpsAcc > 500) {
        scene.stats = {
          fps: Math.round((fpsFrames * 1000) / fpsAcc),
          frameMs: governor.frameMs,
          tier: governor.tier.name,
          scale: governor.tier.scale,
          steps: governor.tier.steps,
        };
        fpsAcc = 0;
        fpsFrames = 0;
      }

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const max = document.documentElement.scrollHeight - innerHeight;
      const target = max > 0 ? Math.min(1, scrollY / Math.min(max, innerHeight * 1.2)) : 0;
      scroll += (target - scroll) * 0.12;

      const p = scene.planet;
      const c = scene.palette;
      const a = audio.read(scene.audioGain);
      scene.audio = a;
      // Let CSS react to the beat too (only written when it changes).
      const bassCss = Math.round(a[0] * 50) / 50;
      if (bassCss !== lastBass) {
        lastBass = bassCss;
        document.documentElement.style.setProperty("--bass", String(bassCss));
      }

      prog.set("uRes", [canvas.width, canvas.height]);
      prog.set("uTime", reduce.matches ? 12 : now / 1000);
      prog.set("uMouse", [mouse.x, mouse.y]);
      prog.set("uScroll", scroll);
      // Glide between layouts instead of jumping.
      const [px, py] = planetPos();
      if (!pos.ready) Object.assign(pos, { x: px, y: py, ready: true });
      pos.x += (px - pos.x) * 0.06;
      pos.y += (py - pos.y) * 0.06;
      prog.set("uPlanetPos", [pos.x, pos.y]);
      prog.set("uVoid", hexToRgb(c.void));
      prog.set("uA", hexToRgb(c.a));
      prog.set("uB", hexToRgb(c.b));
      prog.set("uC", hexToRgb(c.c));
      prog.set("uStar", hexToRgb(c.star));
      prog.set("uRadius", p.radius);
      prog.set("uTerrain", p.terrain);
      prog.set("uNoise", p.noiseScale);
      prog.set("uBands", p.bands);
      prog.set("uSpin", p.spin);
      prog.set("uAtmos", p.atmosphere);
      prog.set("uRingTilt", p.ringTilt);
      prog.set("uRingInner", p.ringInner);
      prog.set("uRingOuter", p.ringOuter);
      prog.set("uRingDensity", p.ringDensity);
      prog.set("uAudio", a);
      prog.set("uWarp", scene.warp);
      prog.setInt("uSteps", governor.tier.steps);
      draw();

      // Reduced motion: still respond to input and audio, but don't idle-animate.
      const busy =
        !reduce.matches ||
        audio.mode !== "off" ||
        scene.warp > 0 ||
        Math.abs(mouse.tx - mouse.x) > 0.001 ||
        Math.abs(px - pos.x) + Math.abs(py - pos.y) > 0.001;
      if (visible && busy) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onPointer = (e: PointerEvent) => {
      mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
      kick();
    };
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      kick();
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      document.documentElement.dataset.webgl = "off";
    };

    const onResize = () => {
      resize();
      kick();
    };
    resize();
    kick();
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    const unsub = scene.subscribe(kick);
    const poll = window.setInterval(kick, 250); // wakes the loop for audio/warp in reduced-motion mode

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(poll);
      unsub();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", kick);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="fixed inset-0 -z-10 h-dvh w-screen" />;
}
