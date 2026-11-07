"use client";

import { useEffect, useRef } from "react";

export function SilkBackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !container || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | null = null;
    let visible = false;
    let lastTime: number | null = null;
    let elapsed = 0;
    let pixels: ImageData | null = null;

    function draw() {
      if (!pixels || !context || !canvas) return;
      const { width, height, data } = pixels;
      const offset = motion.matches ? 0 : elapsed * 0.0012;

      for (let y = 0; y < height; y++) {
        const v = (y / height) * 2;
        for (let x = 0; x < width; x++) {
          const u = (x / width) * 2;
          const silkY = v + 0.03 * Math.sin(8 * u - offset);
          const pattern = 0.6 + 0.4 * Math.sin(
            5 * (u + silkY + Math.cos(3 * u + 5 * silkY) + 0.02 * offset)
            + Math.sin(20 * (u + silkY - 0.1 * offset)),
          );
          const noise = ((2.71828 * Math.sin(2.71828 * x))
            * (2.71828 * Math.sin(2.71828 * y)) * (1 + x)) % 1;
          const edge = Math.min(1, Math.hypot(x / width - 0.5, y / height - 0.5));
          const intensity = (0.48 + 0.52 * Math.max(0, pattern - noise * 0.8 / 15))
            * (1 - edge * 0.3);
          const index = (y * width + x) * 4;
          data[index] = Math.round(41 * intensity);
          data[index + 1] = Math.round(77 * intensity);
          data[index + 2] = Math.round(63 * intensity);
          data[index + 3] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
    }

    function animate(now: number) {
      frame = null;
      if (lastTime === null) lastTime = now;
      const delta = now - lastTime;
      if (delta >= 1000 / 30) {
        elapsed += Math.min(delta, 100);
        lastTime = now;
        draw();
      }
      frame = requestAnimationFrame(animate);
    }

    function updateAnimation() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
      if (motion.matches) draw();
      else if (visible && !document.hidden && pixels) {
        frame = requestAnimationFrame(animate);
      }
    }

    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Sample the entire box at a bounded resolution, then let CSS upscale it.
      const scale = Math.min(1, 480 / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      pixels = context.createImageData(canvas.width, canvas.height);
      draw();
      updateAnimation();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateAnimation();
    });

    resize.observe(container);
    intersection.observe(container);
    motion.addEventListener("change", updateAnimation);
    document.addEventListener("visibilitychange", updateAnimation);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      motion.removeEventListener("change", updateAnimation);
      document.removeEventListener("visibilitychange", updateAnimation);
    };
  }, []);

  return <canvas ref={canvasRef} className="silk-background-canvas" aria-hidden="true" />;
}
