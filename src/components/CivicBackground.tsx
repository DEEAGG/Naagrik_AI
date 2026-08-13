import { useEffect, useRef } from 'react';

interface Marker {
  x: number;
  y: number;
  kind: 'pending' | 'monitoring' | 'resolved';
  phase: number;
}

const MARKERS: Marker[] = [
  { x: 0.18, y: 0.32, kind: 'pending', phase: 0 },
  { x: 0.34, y: 0.58, kind: 'monitoring', phase: 1.2 },
  { x: 0.52, y: 0.26, kind: 'resolved', phase: 2.1 },
  { x: 0.68, y: 0.62, kind: 'pending', phase: 0.6 },
  { x: 0.82, y: 0.38, kind: 'monitoring', phase: 1.8 },
  { x: 0.46, y: 0.74, kind: 'resolved', phase: 0.3 },
];

const COLORS: Record<Marker['kind'], [number, number, number]> = {
  pending: [245, 158, 11],
  monitoring: [77, 134, 255],
  resolved: [16, 185, 129],
};

export default function CivicBackground({ zoom = false }: { zoom?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Pre-generate a stable road network
    const roads = generateRoads();

    let t = 0;
    const render = () => {
      t += 0.004;
      ctx.clearRect(0, 0, w, h);

      const scale = zoom ? 1.12 : 1;
      const ox = zoom ? -w * 0.06 : 0;
      const oy = zoom ? -h * 0.04 : 0;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2 + ox, -h / 2 + oy);

      drawGrid(ctx, w, h, t);
      drawRoads(ctx, roads, w, h, t);
      drawNodes(ctx, roads, t);
      drawMarkers(ctx, w, h, t);
      drawScanline(ctx, w, h, t);

      ctx.restore();
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [zoom]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(77,134,255,0.10),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(7,9,13,0.9),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950" />
    </div>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.strokeStyle = 'rgba(77,134,255,0.05)';
  ctx.lineWidth = 1;
  const gap = 56;
  const offset = (t * 12) % gap;
  for (let x = -gap + offset; x < w + gap; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = -gap + offset; y < h + gap; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

interface Road {
  x1: number; y1: number; x2: number; y2: number;
  nodes: { x: number; y: number }[];
}

function generateRoads(): Road[] {
  const roads: Road[] = [];
  const seed = (n: number) => Math.sin(n * 12.9898) * 43758.5453 % 1;
  let s = 1;
  for (let i = 0; i < 7; i++) {
    const horiz = i % 2 === 0;
    const a = seed(s++) * 0.9 + 0.05;
    const b = seed(s++) * 0.9 + 0.05;
    const c = seed(s++) * 0.9 + 0.05;
    const x1 = horiz ? 0 : a;
    const y1 = horiz ? a : 0;
    const x2 = horiz ? 1 : b;
    const y2 = horiz ? b : 1;
    const nodes: { x: number; y: number }[] = [];
    const steps = 5;
    for (let k = 0; k <= steps; k++) {
      const f = k / steps;
      nodes.push({ x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f });
    }
    void c;
    roads.push({ x1, y1, x2, y2, nodes });
  }
  return roads;
}

function drawRoads(ctx: CanvasRenderingContext2D, roads: Road[], w: number, h: number, t: number) {
  for (const r of roads) {
    ctx.strokeStyle = 'rgba(120,140,180,0.10)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r.x1 * w, r.y1 * h);
    ctx.lineTo(r.x2 * w, r.y2 * h);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(77,134,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -t * 40;
    ctx.beginPath();
    ctx.moveTo(r.x1 * w, r.y1 * h);
    ctx.lineTo(r.x2 * w, r.y2 * h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawNodes(ctx: CanvasRenderingContext2D, roads: Road[], _t: number) {
  for (const r of roads) {
    for (const n of r.nodes) {
      const x = n.x * (ctx.canvas.width / (window.devicePixelRatio || 1));
      const y = n.y * (ctx.canvas.height / (window.devicePixelRatio || 1));
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(150,170,210,0.35)';
      ctx.fill();
    }
  }
}

function drawMarkers(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  for (const m of MARKERS) {
    const [r, g, b] = COLORS[m.kind];
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 + m.phase);
    const x = m.x * w;
    const y = m.y * h;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, 26 + pulse * 10);
    grad.addColorStop(0, `rgba(${r},${g},${b},${0.35 + pulse * 0.25})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 26 + pulse * 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 + pulse * 0.3})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawScanline(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const y = (t * 60) % (h + 200) - 100;
  const grad = ctx.createLinearGradient(0, y - 80, 0, y + 80);
  grad.addColorStop(0, 'rgba(77,134,255,0)');
  grad.addColorStop(0.5, 'rgba(77,134,255,0.05)');
  grad.addColorStop(1, 'rgba(77,134,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 80, w, 160);
}
