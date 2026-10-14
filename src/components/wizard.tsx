"use client";
import { useEffect, useState, type ReactNode } from "react";
import { start, type Match } from "../lib/darts";

const KEY = "darts-setup"; // long-term: names + options; the match itself lives in state only
export const BG = ["bg-dk-ta", "bg-dk-tb", "bg-dk-tc", "bg-dk-td"];
type Stage = "players" | "options" | "bull" | "order";
const ORDER: Stage[] = ["players", "options", "bull", "order"];

const Head = ({ icon, title, text }: { icon: string; title: string; text: ReactNode }) => (
  <div className="flex items-start gap-3">
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-dk-ball text-2xl shadow-inner">{icon}</span>
    <div>
      <h2 className="text-2xl font-black leading-tight">{title}</h2>
      <p className="text-sm font-medium text-slate-600">{text}</p>
    </div>
  </div>
);
const Next = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} className="min-h-14 w-full rounded-2xl bg-dk-ink text-lg font-black text-dk-ball shadow-xl">{children}</button>
);
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} aria-pressed={on} className={`min-h-12 flex-1 rounded-xl px-2 text-base font-black ${on ? "bg-dk-ink text-dk-ball" : "bg-slate-100"}`}>{children}</button>
);

export default function Wizard({ onStart }: { onStart: (m: Match) => void }) {
  const [stage, setStage] = useState<Stage>("players");
  const [hist, setHist] = useState<Stage[]>([]);
  const [names, setNames] = useState(["Player 1", "Player 2"]);
  const [startScore, setStartScore] = useState(501);
  const [doubleOut, setDoubleOut] = useState(true);
  const [legs, setLegs] = useState(1);
  const [order, setOrder] = useState<number[]>([0, 1]); // indexes into names, in order of play

  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (o) { setNames(o.names); setStartScore(o.start); setDoubleOut(o.doubleOut); setLegs(o.legs); }
    } catch {}
  }, []);

  const go = (s: Stage) => { setHist((h) => [...h, stage]); setStage(s); };
  const back = () => { setStage(hist[hist.length - 1]); setHist((h) => h.slice(0, -1)); };
  const nm = (i: number) => names[i].trim() || `P${i + 1}`;
  const move = (pos: number, dir: -1 | 1) =>
    setOrder((o) => { const n = [...o]; [n[pos], n[pos + dir]] = [n[pos + dir], n[pos]]; return n; });

  const begin = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ names, start: startScore, doubleOut, legs })); } catch {}
    onStart(start({ names: order.map(nm), start: startScore, doubleOut, legs }));
  };
  const step = ORDER.indexOf(stage) + 1;

  return (
    <div className="mx-auto flex h-full w-full max-w-xl flex-col">
      <div className="flex items-center gap-2 px-3 pt-3">
        {hist.length > 0 && <button onClick={back} className="min-h-11 rounded-xl bg-slate-200 px-3 text-sm font-extrabold">← Back</button>}
        <div className="ml-auto flex gap-1.5" aria-label={`Step ${step} of ${ORDER.length}`}>
          {ORDER.map((s, i) => <span key={s} className={`h-2 w-6 rounded-full ${i < step ? "bg-dk-ink" : "bg-slate-300"}`} />)}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {stage === "players" && (
          <>
            <Head icon="👥" title="Who's playing?" text="1 to 4 players. You'll set the order of play shortly." />
            <div className="space-y-2">
              {names.map((n, i) => (
                <div key={i} className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black text-white ${BG[i]}`}>{n.slice(0, 2).toUpperCase() || "?"}</span>
                  <input value={n} maxLength={12} aria-label={`Player ${i + 1} name`}
                    onChange={(e) => setNames((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
                    onFocus={(e) => e.target.select()}
                    className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 text-base font-bold outline-none focus:border-dk-ink" />
                  {names.length > 1 && (
                    <button aria-label={`Remove player ${i + 1}`} onClick={() => setNames((a) => a.filter((_, j) => j !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg font-black">✕</button>
                  )}
                </div>
              ))}
              {names.length < 4 && (
                <button onClick={() => setNames((a) => [...a, `Player ${a.length + 1}`])} className="min-h-12 w-full rounded-2xl border-2 border-dashed border-slate-300 text-base font-extrabold text-slate-600">+ Add player</button>
              )}
            </div>
          </>
        )}

        {stage === "options" && (
          <>
            <Head icon="⚙️" title="Game options" text="Pick the start score, how you finish and the match length." />
            <div className="rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-200">
              <div className="mb-1 text-sm font-black">Start score</div>
              <div className="flex gap-2">{[301, 501, 701].map((s) => <Chip key={s} on={startScore === s} onClick={() => setStartScore(s)}>{s}</Chip>)}</div>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-200">
              <div className="mb-1 text-sm font-black">Finish</div>
              <div className="flex gap-2">
                <Chip on={doubleOut} onClick={() => setDoubleOut(true)}>Double out</Chip>
                <Chip on={!doubleOut} onClick={() => setDoubleOut(false)}>Straight out</Chip>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-600">{doubleOut ? "The last dart must be a double (or the bull)." : "Any dart can finish the leg."}</p>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-200">
              <div className="mb-1 text-sm font-black">Match: first to</div>
              <div className="flex gap-2">{[1, 2, 3, 5].map((l) => <Chip key={l} on={legs === l} onClick={() => setLegs(l)}>{l} leg{l > 1 ? "s" : ""}</Chip>)}</div>
            </div>
          </>
        )}

        {stage === "bull" && (
          <>
            <Head icon="🎯" title="Throw for the bull" text="Everyone throws one dart at the bullseye. Closest goes first. Who won?" />
            {names.map((_, i) => (
              <button key={i} onClick={() => { setOrder(names.map((__, k) => (i + k) % names.length)); go("order"); }}
                className={`min-h-16 w-full rounded-2xl px-4 text-left text-lg font-black text-white shadow-md ${BG[i]}`}>
                {nm(i)}<span className="block text-xs font-semibold opacity-80">closest to the bull</span>
              </button>
            ))}
          </>
        )}

        {stage === "order" && (
          <>
            <Head icon="🔢" title="Order of play" text="Closest to the bull throws first. Use the arrows to change the order." />
            <ol className="space-y-2">
              {order.map((pi, pos) => (
                <li key={pi} className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-dk-ink text-sm font-black text-dk-ball">{pos + 1}</span>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-black text-white ${BG[pi]}`}>{nm(pi).slice(0, 2).toUpperCase()}</span>
                  <span className="min-w-0 flex-1 truncate text-base font-black">{nm(pi)}</span>
                  <button disabled={pos === 0} onClick={() => move(pos, -1)} aria-label={`Move ${nm(pi)} up`} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 font-black disabled:opacity-30">▲</button>
                  <button disabled={pos === order.length - 1} onClick={() => move(pos, 1)} aria-label={`Move ${nm(pi)} down`} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 font-black disabled:opacity-30">▼</button>
                </li>
              ))}
            </ol>
            <p className="rounded-xl bg-slate-100 p-3 text-sm font-bold">
              {startScore} · {doubleOut ? "double out" : "straight out"} · first to {legs} leg{legs > 1 ? "s" : ""}. Players take turns to start each leg.
            </p>
          </>
        )}
      </div>

      <div className="p-3 pt-1">
        {stage === "players" && <Next onClick={() => go("options")}>Next: options →</Next>}
        {stage === "options" && <Next onClick={() => { if (names.length === 1) setOrder([0]); go(names.length > 1 ? "bull" : "order"); }}>{names.length > 1 ? "Next: bull-up →" : "Next: order →"}</Next>}
        {stage === "order" && <Next onClick={begin}>Start match →</Next>}
      </div>
    </div>
  );
}
