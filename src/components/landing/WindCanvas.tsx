"use client";

import * as React from "react";

export function WindCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isVisible = true;
    let animationFrameId: number;

    // Pause animation when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 450;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle pool (capped at 60 particles strictly)
    const PARTICLE_COUNT = 55;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 450),
      length: 15 + Math.random() * 35,
      speed: 0.8 + Math.random() * 1.6,
      opacity: 0.15 + Math.random() * 0.35,
      thickness: 1 + Math.random() * 1.5,
    }));

    const render = () => {
      if (isVisible && ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Subtle wind vector lines
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Diagonal wind flow (resembling typical NW-SE winter dispersion in MP)
          p.x += p.speed * 1.4;
          p.y += p.speed * 0.4;

          if (p.x > canvas.width) {
            p.x = -p.length;
            p.y = Math.random() * canvas.height;
          }
          if (p.y > canvas.height) {
            p.y = -10;
          }

          ctx.beginPath();
          ctx.strokeStyle = `rgba(14, 154, 167, ${p.opacity})`;
          ctx.lineWidth = p.thickness;
          ctx.lineCap = "round";
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.length, p.y + p.length * 0.3);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60 dark:opacity-40"
      aria-hidden="true"
    />
  );
}
