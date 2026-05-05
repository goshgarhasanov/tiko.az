// Yüngül canvas konfetti — qalib zamanı işə salınır.

const COLORS = ["#6366F1", "#D946EF", "#F59E0B", "#06B6D4", "#84CC16", "#F43F5E", "#FACC15"];

/**
 * Kətan üzərində bir burst konfetti çıxarır.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} [opts]
 * @param {number} [opts.count]
 * @param {number} [opts.durationMs]
 */
export function burst(canvas, { count = 180, durationMs = 2400 } = {}) {
  if (!canvas) return;
  resize(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const particles = Array.from({ length: count }, () => makeParticle(w, h));

  const start = performance.now();
  let raf;

  function frame(now) {
    const t = now - start;
    if (t > durationMs) {
      ctx.clearRect(0, 0, w, h);
      cancelAnimationFrame(raf);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.vy += 0.18; // cazibə
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - t / durationMs);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}

function resize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
}

function makeParticle(w, h) {
  return {
    x: w / 2 + (Math.random() - 0.5) * w * 0.4,
    y: h * 0.35 + (Math.random() - 0.5) * 80,
    vx: (Math.random() - 0.5) * 9,
    vy: -Math.random() * 9 - 3,
    size: 6 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.3,
  };
}
