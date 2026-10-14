"use client";
import { useState } from "react";
import Board from "./board";
import Wizard, { BG } from "./wizard";
import { advice, avg, label, MISS, routeText, shift, throwDart, value, type Dart, type Match } from "../lib/darts";

type Saved = { m: Match | null; past: Match[] };
type Mod = 1 | 2 | 3;

export default function Play() {
  const [{ m, past }, setS] = useState<Saved>({ m: null, past: [] });
  const [mod, setMod] = useState<Mod>(1);
  if (!m) return <Wizard onStart={(m) => setS({ m, past: [] })} />;

  const hit = (d: Dart) => {
    setS({ m: throwDart(m, d), past: [...past.slice(-299), { ...m, steps: [] }] });
    setMod(1);
  };
  const undo = () => past.length && setS({ m: past[past.length - 1], past: past.slice(0, -1) });
  const reset = () => confirm("Start a new match?") && setS({ m: null, past: [] });

  const n = m.cfg.names;
  const left = 3 - m.visit.length;
  const ad = advice(m.rem[m.cur], left, m.cfg.doubleOut);
  const targets = ad.kind === "finish" ? ad.routes[0] : ad.route;
  const locked = m.steps.length > 0 || m.winner !== null;
  const total = m.visit.reduce((s, d) => s + value(d), 0);

  return (
    <div className="flex h-full flex-col gap-2 p-2.5 wide:grid wide:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] wide:grid-rows-[auto_auto_1fr_auto] wide:gap-x-4 short:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid gap-1.5 wide:col-start-2 wide:row-start-1 short:col-start-1" style={{ gridTemplateColumns: `repeat(${n.length}, minmax(0, 1fr))` }}>
        {n.map((name, i) => {
          const on = i === m.cur && m.winner === null;
          return (
            <div key={i} aria-current={on} className={`overflow-hidden rounded-2xl shadow-md ring-1 ${on ? "bg-dk-ink text-white ring-dk-ball" : "bg-white ring-slate-200"}`}>
              <div className={`h-1.5 ${BG[i]}`} />
              <div className="px-1.5 pb-1 pt-0.5 text-center">
                <div className="truncate text-xs font-black">{on && "🎯 "}{name}</div>
                <div className={`text-3xl short:text-2xl font-black tabular-nums leading-tight ${on ? "text-dk-ball" : ""}`}>{m.rem[i]}</div>
                <div className={`truncate text-[10px] font-bold ${on ? "text-white/70" : "text-slate-500"}`}>
                  {n.length > 0 && `Legs ${m.legs[i]}`} · avg {avg(m.stats[i])}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dk-board-box min-h-0 flex-1 wide:col-start-1 wide:row-span-4 wide:row-start-1 short:hidden">
        <Board targets={locked ? [] : targets} thrown={m.visit} />
      </div>

      <div className="rounded-2xl bg-white px-3 py-2 shadow-md ring-1 ring-slate-200 wide:col-start-2 wide:row-start-2 short:col-start-1 short:py-1">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} data-testid="dart" className={`grid h-9 min-w-12 place-items-center rounded-xl px-2 text-base font-black ${m.visit[i] ? "bg-dk-ink text-dk-ball" : "bg-slate-100 text-slate-400"}`}>
              {m.visit[i] ? label(m.visit[i]) : "–"}
            </span>
          ))}
          <span className="ml-auto text-sm font-black">Visit {total}</span>
          <button onClick={reset} aria-label="New match" className="min-h-9 min-w-11 rounded-lg bg-slate-200 text-xs font-extrabold text-slate-700">New</button>
        </div>
        {m.winner === null && (
          <p className="mt-1 text-sm font-bold leading-tight" data-testid="advice">
            {ad.kind === "finish" && (
              <>
                <span className="mr-1 rounded bg-dk-ball px-1.5 py-0.5 text-xs font-black">CHECKOUT · {left} dart{left > 1 ? "s" : ""}</span>
                {ad.routes.map((r) => <span key={routeText(r)} className="mr-2 whitespace-nowrap">{routeText(r)}</span>)}
              </>
            )}
            {ad.kind === "setup" && <><span className="mr-1 rounded bg-amber-300 px-1.5 py-0.5 text-xs font-black">SET UP</span>{routeText(ad.route)}</>}
            {ad.kind === "score" && <><span className="mr-1 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-black">SCORE</span>Aim for the treble 20</>}
          </p>
        )}
      </div>

      {m.winner !== null ? (
        <div className="grid grid-cols-[1fr_auto] gap-2 wide:col-start-2 wide:row-start-4 short:col-start-2 short:row-start-1">
          <button onClick={() => setS({ m: null, past: [] })} className="min-h-16 rounded-2xl bg-dk-ink text-lg font-black text-dk-ball shadow-lg">New match →</button>
          <button onClick={undo} disabled={!past.length} className="min-h-16 rounded-2xl bg-slate-200 px-4 text-sm font-extrabold">↶ Undo</button>
        </div>
      ) : (
        <div className="grid gap-1.5 wide:col-start-2 wide:row-start-4 short:col-start-2 short:row-start-1 short:row-span-4">
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Multiplier">
            {([[1, "Single"], [2, "Double"], [3, "Treble"]] as [Mod, string][]).map(([k, t]) => (
              <button key={k} aria-pressed={mod === k} onClick={() => setMod(k)} disabled={locked}
                className={`min-h-11 rounded-xl text-sm font-black ${mod === k ? "bg-dk-ink text-dk-ball" : "bg-white ring-1 ring-slate-300"}`}>{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1.5 short:grid-cols-8">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((k) => (
              <button key={k} disabled={locked} onClick={() => hit({ m: mod, n: k })} aria-label={label({ m: mod, n: k })}
                className="min-h-11 rounded-xl bg-white text-base font-black shadow ring-1 ring-slate-300 active:bg-dk-ball disabled:opacity-40">
                {mod === 1 ? k : `${"SDT"[mod - 1]}${k}`}
              </button>
            ))}
            <button disabled={locked} onClick={() => hit({ m: 1, n: 25 })} className="min-h-11 rounded-xl bg-emerald-600 text-sm font-black text-white shadow disabled:opacity-40">25</button>
            <button disabled={locked} onClick={() => hit({ m: 2, n: 25 })} className="min-h-11 rounded-xl bg-red-600 text-sm font-black text-white shadow disabled:opacity-40">Bull</button>
            <button disabled={locked} onClick={() => hit(MISS)} className="min-h-11 rounded-xl bg-slate-300 text-sm font-black disabled:opacity-40">Miss</button>
            <button onClick={undo} disabled={!past.length || m.steps.length > 0} className="min-h-11 rounded-xl bg-dk-ink text-sm font-black text-white disabled:opacity-30">↶</button>
          </div>
        </div>
      )}

      {m.steps[0] && (
        <div role="dialog" aria-modal="true" aria-label="Prompt" className="fixed inset-0 z-10 flex items-end justify-center bg-dk-ink/70 p-3 backdrop-blur-sm sm:items-center">
          <div key={m.steps.length} className="flex max-h-[92dvh] w-full max-w-sm animate-dk-sheet flex-col rounded-3xl bg-white p-5 shadow-2xl wide:max-w-md">
            <div className="mb-1 flex shrink-0 items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-dk-ball text-2xl">{m.steps[0].icon}</span>
              {m.steps.length > 1 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-600">{m.steps.length} prompts left</span>}
            </div>
            <h2 className="shrink-0 text-2xl font-black leading-tight">{m.steps[0].title}</h2>
            <ul className="my-3 min-h-0 space-y-2 overflow-y-auto">
              {m.steps[0].lines.map((l) => (
                <li key={l} className="flex gap-2 rounded-xl bg-slate-100 p-3 text-base font-bold"><span className="text-emerald-600">✔</span>{l}</li>
              ))}
            </ul>
            <button onClick={() => setS({ m: shift(m), past })} className="min-h-14 w-full shrink-0 rounded-2xl bg-dk-ink text-lg font-black text-dk-ball shadow-lg">
              {m.steps.length > 1 ? "Next →" : m.winner !== null ? "Done" : "Ready: throw!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
