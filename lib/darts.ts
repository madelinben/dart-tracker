// Pure X01 darts logic: dart-by-dart scoring, bust/checkout rules, checkout advice.
export type Dart = { m: 0 | 1 | 2 | 3; n: number }; // m: 0 miss, 1 single, 2 double, 3 treble; n: 1-20 or 25
export type Route = Dart[];
export type Step = { icon: string; title: string; lines: string[] };
export type Config = { names: string[]; start: number; doubleOut: boolean; legs: number }; // legs = first to
export type Stat = { darts: number; pts: number; high: number };
export type Match = {
  cfg: Config;
  rem: number[]; // points left per player
  legs: number[];
  cur: number; // player throwing
  starter: number; // player who started this leg
  leg: number;
  visit: Dart[]; // darts thrown in the current visit
  visitStart: number; // cur's score at the start of the visit (bust reverts to it)
  stats: Stat[];
  steps: Step[]; // queued prompts, first one is showing
  winner: number | null;
};

export const value = (d: Dart) => d.m * d.n;
export const label = (d: Dart) =>
  d.m === 0 ? "Miss" : d.n === 25 ? (d.m === 2 ? "Bull" : "25") : `${"SDT"[d.m - 1]}${d.n}`;
export const MISS: Dart = { m: 0, n: 0 };

const ALL: Dart[] = [];
for (let n = 1; n <= 20; n++) for (const m of [1, 2, 3] as const) ALL.push({ m, n });
ALL.push({ m: 1, n: 25 }, { m: 2, n: 25 });

// --- checkout advice -------------------------------------------------------
const DOUBLE_PREF = [20, 16, 8, 10, 18, 12, 4, 6, 14, 2, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25];
// Lower is easier/preferred. Finishing double: favourite doubles. Other darts: big trebles first.
function cost(d: Dart, last: boolean, doubleOut: boolean) {
  if (last && doubleOut) return DOUBLE_PREF.indexOf(d.n) * 0.5;
  if (d.m === 3) return d.n >= 17 ? 20 - d.n : 4 + (20 - d.n) * 0.1;
  if (d.m === 1) return d.n === 25 ? 5 : d.n === 20 ? 3 : 6 + (20 - d.n) * 0.05;
  return 4 + (20 - d.n) * 0.05; // doubles mid-route / bull
}
const routeCost = (r: Route, doubleOut: boolean) => r.reduce((s, d, i) => s + cost(d, i === r.length - 1, doubleOut), 0);
const canFinish = (d: Dart, doubleOut: boolean) => (doubleOut ? d.m === 2 : d.m > 0);

const cache = new Map<string, Route[]>();
// Valid finishes in at most `darts` darts, fewest darts then easiest first.
export function finishes(rem: number, darts: number, doubleOut: boolean): Route[] {
  const key = `${rem}|${darts}|${doubleOut}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out: Route[] = [];
  const lasts = ALL.filter((d) => canFinish(d, doubleOut));
  const lastFor = (left: number) => lasts.filter((d) => value(d) === left);
  for (const l of lastFor(rem)) out.push([l]);
  if (darts >= 2) {
    for (const a of ALL) for (const l of lastFor(rem - value(a))) out.push([a, l]);
  }
  if (darts >= 3) {
    for (const a of ALL) for (const b of ALL) {
      if (value(b) > value(a)) continue; // canonical order: biggest first
      for (const l of lastFor(rem - value(a) - value(b))) out.push([a, b, l]);
    }
  }
  out.sort((x, y) => x.length - y.length || routeCost(x, doubleOut) - routeCost(y, doubleOut));
  const best = out.slice(0, 3);
  cache.set(key, best);
  return best;
}

// A dart to throw now to leave a good finish (when no finish exists yet).
export function setup(rem: number, left: number, doubleOut: boolean): Route | null {
  let best: { r: Route; c: number } | null = null;
  const floor = doubleOut ? 2 : 1;
  for (const d of ALL) {
    const r = rem - value(d);
    if (r < floor) continue;
    const next = left > 1 ? finishes(r, left - 1, doubleOut)[0] : finishes(r, 3, doubleOut)[0];
    if (!next) continue;
    const route = left > 1 ? [d, ...next] : [d];
    const c = cost(d, false, doubleOut) + routeCost(next, doubleOut) + next.length * 10 + (left > 1 ? 0 : 15);
    if (!best || c < best.c) best = { r: route, c };
  }
  return best?.r ?? null;
}

export type Advice = { kind: "finish"; routes: Route[] } | { kind: "setup"; route: Route } | { kind: "score"; route: Route };
export function advice(rem: number, left: number, doubleOut: boolean): Advice {
  const f = finishes(rem, left, doubleOut);
  if (f.length) return { kind: "finish", routes: f };
  const s = rem <= 200 ? setup(rem, left, doubleOut) : null;
  if (s) return { kind: "setup", route: s };
  return { kind: "score", route: [{ m: 3, n: 20 }] };
}
export const routeText = (r: Route) => r.map(label).join(" · ");
export function adviceText(rem: number, left: number, doubleOut: boolean) {
  const a = advice(rem, left, doubleOut);
  if (a.kind === "finish") return `Checkout: ${routeText(a.routes[0])}`;
  if (a.kind === "setup") return `No finish yet. Set up: ${routeText(a.route)}`;
  return "Score big: aim for T20";
}

// --- match -----------------------------------------------------------------
export function start(cfg: Config): Match {
  const n = cfg.names.length;
  return {
    cfg, rem: Array(n).fill(cfg.start), legs: Array(n).fill(0), cur: 0, starter: 0, leg: 1,
    visit: [], visitStart: cfg.start,
    stats: cfg.names.map(() => ({ darts: 0, pts: 0, high: 0 })), winner: null,
    steps: [{
      icon: "🎯",
      title: "Game on!",
      lines: [
        `${cfg.names[0]} throws first`,
        `Order of play: ${cfg.names.join(" → ")}`,
        `First to ${cfg.legs} leg${cfg.legs > 1 ? "s" : ""} · ${cfg.start} · ${cfg.doubleOut ? "double out" : "straight out"}`,
        "3 darts each visit: enter every dart, then confirm the hand-over",
      ],
    }],
  };
}

export const shift = (m: Match): Match => ({ ...m, steps: m.steps.slice(1) });
export const avg = (s: Stat) => (s.darts ? ((s.pts / s.darts) * 3).toFixed(1) : "0.0");
const sum = (v: Dart[]) => v.reduce((s, d) => s + value(d), 0);

function upNext(m: Match, rem: number[], next: number) {
  return [`Next up: ${m.cfg.names[next]} (${rem[next]} left)`, adviceText(rem[next], 3, m.cfg.doubleOut)];
}

export function throwDart(m: Match, d: Dart): Match {
  if (m.winner !== null || m.steps.length || m.visit.length >= 3) return m;
  const p = m.cur;
  const name = m.cfg.names[p];
  const r = m.rem[p] - value(d);
  const visit = [...m.visit, d];
  const rem = [...m.rem];
  const stats = m.stats.map((s) => ({ ...s }));
  const next = (p + 1) % m.cfg.names.length;
  const nextState = { cur: next, visit: [] as Dart[], visitStart: rem[next] };

  const reason =
    r < 0 ? "Score went below zero"
    : m.cfg.doubleOut && r === 1 ? "Can't leave 1: you need a double to finish"
    : m.cfg.doubleOut && r === 0 && d.m !== 2 ? "You must finish on a double"
    : null;
  if (reason) {
    rem[p] = m.visitStart;
    stats[p].darts += 3;
    nextState.visitStart = rem[next];
    return {
      ...m, ...nextState, rem, stats,
      steps: [{ icon: "💥", title: "BUST!", lines: [reason, `${name} stays on ${m.visitStart}`, ...upNext(m, rem, next)] }],
    };
  }

  rem[p] = r;
  if (r === 0) {
    const legs = [...m.legs];
    legs[p]++;
    stats[p].darts += visit.length;
    stats[p].pts += sum(visit);
    stats[p].high = Math.max(stats[p].high, sum(visit));
    const steps: Step[] = [{
      icon: "🎯",
      title: `Game shot! ${name} wins leg ${m.leg}`,
      lines: [`Finished on ${visit.map(label).join(" ")}`, `Legs: ${m.cfg.names.map((n, i) => `${n} ${legs[i]}`).join(" · ")}`],
    }];
    if (legs[p] >= m.cfg.legs) {
      steps.push({
        icon: "🏆",
        title: `${name} wins the match!`,
        lines: m.cfg.names.map((n, i) => `${n}: ${avg(stats[i])} 3-dart avg · best visit ${stats[i].high}`),
      });
      return { ...m, rem, legs, stats, visit, steps, winner: p };
    }
    const starter = (m.starter + 1) % m.cfg.names.length;
    const fresh = Array(m.cfg.names.length).fill(m.cfg.start);
    steps.push({
      icon: "🔁",
      title: `Leg ${m.leg + 1}`,
      lines: [`Scores reset to ${m.cfg.start}`, `${m.cfg.names[starter]} throws first`, "Players alternate who starts each leg", adviceText(m.cfg.start, 3, m.cfg.doubleOut)],
    });
    return { ...m, rem: fresh, legs, stats, steps, cur: starter, starter, leg: m.leg + 1, visit: [], visitStart: m.cfg.start };
  }

  if (visit.length === 3) {
    const total = sum(visit);
    stats[p].darts += 3;
    stats[p].pts += total;
    stats[p].high = Math.max(stats[p].high, total);
    const tag = total === 180 ? "🔥" : total >= 100 ? "💯" : "🎯";
    return {
      ...m, ...nextState, rem, stats,
      steps: [{
        icon: tag,
        title: `${name} scored ${total}${total === 180 ? "!" : ""}`,
        lines: [visit.map(label).join(" · "), `${name}: ${m.visitStart} → ${r} left`, ...upNext(m, rem, next)],
      }],
    };
  }
  return { ...m, rem, visit };
}
