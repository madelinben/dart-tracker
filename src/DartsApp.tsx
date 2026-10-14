"use client";
import { useState } from "react";
import Play from "./components/play";
import Reference from "./components/reference";

const I = {
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  rules: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM8 7h8M8 11h6" />,
  flow: <path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" />,
  finishes: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
};
const TABS = [
  ["play", "Match"],
  ["rules", "Rules"],
  ["flow", "Flow"],
  ["finishes", "Finishes"],
] as const;

export function DartsApp() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("play");
  return (
    <main className="dk-root mx-auto grid h-full w-full max-w-lg wide:max-w-6xl wide:shadow-xl grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[#eef2f7]">
      <header className="flex items-center justify-center gap-2 bg-gradient-to-r from-dk-ink to-[#173a73] px-4 py-3 wide:py-2 short:py-1 text-white shadow-lg">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-dk-ball text-dk-ink shadow-inner">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {I.play}
          </svg>
        </span>
        <h1 className="text-xl font-black tracking-tight">
          Darts <span className="text-dk-ball">Score</span>
        </h1>
      </header>
      <div className="min-h-0">
        {/* Play stays mounted so tab switches never lose the game */}
        <div className="h-full" hidden={tab !== "play"}>
          <Play />
        </div>
        {tab !== "play" && <Reference tab={tab} />}
      </div>
      <nav className="grid grid-cols-4 gap-1 border-t border-slate-200 bg-white p-1.5 wide:p-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {TABS.map(([id, label]) => (
          <button
            type="button"
            key={id}
            onClick={() => setTab(id)}
            aria-current={tab === id}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs wide:min-h-11 short:min-h-9 wide:flex-row wide:gap-2 wide:text-sm font-extrabold transition-colors ${tab === id ? "bg-dk-ink text-dk-ball" : "text-slate-600"}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {I[id]}
            </svg>
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
