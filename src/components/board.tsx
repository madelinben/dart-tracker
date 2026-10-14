import { value, type Dart } from "../lib/darts";

const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]; // clockwise from the top
const R = { bull: 3.7, outer: 9.35, t1: 58.2, t2: 62.9, d1: 95.3, d2: 100 };
const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (r: number, deg: number) => [r * Math.sin(rad(deg)), -r * Math.cos(rad(deg))];
const ring = (r1: number, r2: number, a1: number, a2: number) => {
  const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
};
// ring: inner radius, outer radius, multiplier, mid radius for dart markers
const RINGS = [
  [R.outer, R.t1, 1, 34], [R.t1, R.t2, 3, 60.5], [R.t2, R.d1, 1, 79], [R.d1, R.d2, 2, 97.6],
] as const;

const hitPos = (d: Dart) => {
  if (d.n === 25) return d.m === 2 ? [0, 0] : [0, 6.5];
  const i = ORDER.indexOf(d.n);
  const mid = RINGS.find((r) => r[2] === d.m)![3];
  return pt(mid, i * 18);
};

export default function Board({ targets, thrown }: { targets: Dart[]; thrown: Dart[] }) {
  const isT = (m: number, n: number) => targets.some((t) => t.m === m && t.n === n);
  return (
    <svg viewBox="-118 -118 236 236" width="320" height="320" className="dk-board-svg h-full w-full drop-shadow-lg" role="img" aria-label="Dartboard">
      <circle r="116" fill="#0b1d3a" />
      <circle r="104" fill="#111" />
      {ORDER.map((n, i) => {
        const a1 = i * 18 - 9, a2 = i * 18 + 9, even = i % 2 === 0;
        const [lx, ly] = pt(109, i * 18);
        return (
          <g key={n}>
            {RINGS.map(([r1, r2, m]) => {
              const hot = isT(m, n);
              const base = m === 1 ? (even ? "#161616" : "#f1e2b6") : even ? "#dc2626" : "#15803d";
              return <path key={m + "-" + r1} d={ring(r1, r2, a1, a2)} fill={hot ? "#d9f100" : base} stroke="#9ca3af" strokeWidth="0.5" className={hot ? "dk-pulse" : undefined} />;
            })}
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="800" fill="#fff">{n}</text>
          </g>
        );
      })}
      <circle r={R.outer} fill={isT(1, 25) ? "#d9f100" : "#15803d"} stroke="#9ca3af" strokeWidth="0.5" className={isT(1, 25) ? "dk-pulse" : undefined} />
      <circle r={R.bull} fill={isT(2, 25) ? "#d9f100" : "#dc2626"} stroke="#9ca3af" strokeWidth="0.5" className={isT(2, 25) ? "dk-pulse" : undefined} />
      {thrown.filter((d) => value(d) > 0).map((d, i) => {
        const [x, y] = hitPos(d);
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="6" fill="#fff" stroke="#0b1d3a" strokeWidth="1.5" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill="#0b1d3a">{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}
