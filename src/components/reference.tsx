import type { ReactNode } from "react";
import { finishes, routeText } from "../lib/darts";

type Tab = "rules" | "flow" | "finishes";

const Card = ({ icon, title, children }: { icon: string; title: string; children: ReactNode }) => (
  <section className="flex gap-3 rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-200">
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-dk-ball text-2xl shadow-inner">
      {icon}
    </span>
    <div className="min-w-0">
      <h2 className="text-xl font-black leading-tight">{title}</h2>
      <div className="mt-1 text-base font-medium leading-snug text-slate-700">{children}</div>
    </div>
  </section>
);

const FLOW: [string, string, string[]][] = [
  [
    "🎯",
    "Bull-up",
    [
      "Each player throws one dart at the bullseye.",
      "Closest goes first; the others follow in order.",
    ],
  ],
  [
    "🎯",
    "A visit",
    [
      "Each turn is up to 3 darts.",
      "Enter each dart, then confirm the hand-over.",
      "Bust? The score goes back to where the visit began.",
    ],
  ],
  [
    "🏁",
    "Finishing",
    ["Reach exactly zero.", "With double out, the last dart must be a double or the bull."],
  ],
  ["🔁", "Next leg", ["Scores reset.", "The starter rotates each leg."]],
  ["🏆", "The match", ["First to the chosen number of legs wins."]],
];

const TABLE = Array.from({ length: 169 }, (_, i) => 170 - i)
  .map((r) => [r, finishes(r, 3, true)[0]] as const)
  .filter(([, route]) => route);

export default function Reference({ tab }: { tab: Tab }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-3 p-3">
        {tab === "rules" && (
          <>
            <Card icon="🎯" title="X01">
              Start on 301, 501 or 701 and count down to exactly zero.
            </Card>
            <Card icon="✌️" title="Double out">
              Your last dart must land in a double ring (the outer ring) or the bullseye (50).
            </Card>
            <Card icon="💥" title="Bust">
              Go below zero, finish on a non-double, or leave 1 and the whole visit scores nothing.
            </Card>
            <Card icon="🔢" title="Board values">
              Single = face value · Double = 2× · Treble = 3× · Outer bull 25 · Bullseye 50.
            </Card>
            <Card icon="🔥" title="Max visit">
              Three treble 20s make 180.
            </Card>
          </>
        )}
        {tab === "flow" && (
          <ol className="relative space-y-3 pl-1">
            <span className="absolute bottom-6 left-[27px] top-6 w-1 rounded bg-dk-ink/15" />
            {FLOW.map(([icon, title, lines], i) => (
              <li key={title} className="relative flex gap-3">
                <span className="relative z-[1] grid h-12 w-12 shrink-0 place-items-center rounded-full bg-dk-ink text-xl shadow-md ring-4 ring-[#eef2f7]">
                  {icon}
                </span>
                <div className="flex-1 rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-200">
                  <h2 className="text-lg font-black leading-tight">
                    <span className="text-slate-400">{i + 1}.</span> {title}
                  </h2>
                  <ul className="mt-1 space-y-1 text-base font-medium leading-snug text-slate-700">
                    {lines.map((l) => (
                      <li key={l} className="flex gap-2">
                        <span>•</span>
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        )}
        {tab === "finishes" && (
          <section className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-slate-200">
            <h2 className="text-xl font-black">Checkout chart</h2>
            <p className="text-sm font-semibold text-slate-600">
              Best 3-dart double-out finishes from 170 down.
            </p>
            <ul className="mt-2 divide-y divide-slate-100">
              {TABLE.map(([r, route]) => (
                <li key={r} className="flex items-center gap-3 py-1.5">
                  <span className="w-12 shrink-0 rounded-lg bg-dk-ink py-1 text-center text-base font-black text-dk-ball">
                    {r}
                  </span>
                  <span className="text-base font-bold">{routeText(route)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
