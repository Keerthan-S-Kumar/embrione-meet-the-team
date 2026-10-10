"use client";

import { useEffect, useRef } from "react";
import { DOMAIN_COLORS } from "@/lib/constants";

/**
 * Background "team constellation": every dot is a team member, coloured by domain.
 * Nearby dots link up, tiny pulses travel along links, and dots near the cursor connect to it.
 * Touch screens and reduced-motion users get a single still frame instead of an animation.
 */

type Rgb = [number, number, number];
interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rgb: Rgb;
}
interface Pulse {
  a: number;
  b: number;
  t: number;
  speed: number;
}

const LINK_DIST = 150;
const CURSOR_DIST = 190;

const hexToRgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const PALETTE = Object.values(DOMAIN_COLORS).map(hexToRgb);

export function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const animated =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dots: Dot[] = [];
    let pulses: Pulse[] = [];
    let mouse: { x: number; y: number } | null = null;
    let frame = 0;
    let last = 0;
    let sincePulse = 0;

    function seed() {
      const count = Math.min(55, Math.max(22, Math.round((w * h) / 26000)));
      dots = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 6 + Math.random() * 12; // pixels per second: slow on purpose
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1.4 + Math.random() * 1.4,
          rgb: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        };
      });
      pulses = [];
    }

    function resize() {
      const widthChanged = window.innerWidth !== w;
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged || dots.length === 0) seed();
      if (!animated) draw();
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // Links between nearby dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i];
          const b = dots[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > LINK_DIST) continue;
          const alpha = (1 - d / LINK_DIST) * 0.16;
          ctx!.strokeStyle = `rgba(${(a.rgb[0] + b.rgb[0]) >> 1},${(a.rgb[1] + b.rgb[1]) >> 1},${(a.rgb[2] + b.rgb[2]) >> 1},${alpha})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // Dots (brighter when the cursor is near) and cursor links
      for (const p of dots) {
        let boost = 0;
        if (mouse) {
          const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (d < CURSOR_DIST) {
            boost = 1 - d / CURSOR_DIST;
            ctx!.strokeStyle = `rgba(255,190,215,${boost * 0.35})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(mouse.x, mouse.y);
            ctx!.stroke();
          }
        }
        const [r, g, b] = p.rgb;
        ctx!.fillStyle = `rgba(${r},${g},${b},${0.07 + boost * 0.1})`; // soft halo
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 4.5, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${r},${g},${b},${0.5 + boost * 0.4})`; // core
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Pulses travelling along links
      for (const s of pulses) {
        const a = dots[s.a];
        const b = dots[s.b];
        const x = a.x + (b.x - a.x) * s.t;
        const y = a.y + (b.y - a.y) * s.t;
        const alpha = Math.sin(Math.PI * s.t) * 0.9;
        ctx!.fillStyle = `rgba(255,214,230,${alpha})`;
        ctx!.beginPath();
        ctx!.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function spawnPulse() {
      if (pulses.length >= 4) return;
      const a = Math.floor(Math.random() * dots.length);
      const near: number[] = [];
      dots.forEach((q, i) => {
        if (i !== a && Math.hypot(q.x - dots[a].x, q.y - dots[a].y) < LINK_DIST) near.push(i);
      });
      if (near.length) pulses.push({ a, b: near[Math.floor(Math.random() * near.length)], t: 0, speed: 0.5 + Math.random() * 0.4 });
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      for (const p of dots) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      sincePulse += dt;
      if (sincePulse > 1.1) {
        sincePulse = 0;
        spawnPulse();
      }
      pulses = pulses.filter((s) => {
        s.t += dt * s.speed;
        const far = Math.hypot(dots[s.a].x - dots[s.b].x, dots[s.a].y - dots[s.b].y) > LINK_DIST * 1.15;
        return s.t < 1 && !far;
      });

      draw();
      frame = requestAnimationFrame(tick);
    }

    function start() {
      cancelAnimationFrame(frame);
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
    const onVisibility = () => (document.hidden ? cancelAnimationFrame(frame) : start());
    const onMove = (e: PointerEvent) => (mouse = { x: e.clientX, y: e.clientY });
    const onLeave = () => (mouse = null);

    resize();
    window.addEventListener("resize", resize);
    if (animated) {
      start();
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pointermove", onMove);
      document.documentElement.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 size-full" />;
}