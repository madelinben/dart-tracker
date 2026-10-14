# Darts Score

Mobile-first X01 darts score tracker: wizard for players, options, bull-up and order of play; dart-by-dart scoring with bust/checkout rules, checkout advice and a dartboard that highlights what to shoot for.

Two ways this repo ships, from the same `src/`:

| Target | How |
|---|---|
| **GitHub Pages** (`madelinben.github.io/darts-score/`) | `pnpm build:demo` builds `demo/` into `docs/` (Pages source: `main` / `/docs`) |
| **get-out-there** (Cloudflare) | imported as workspace package `@get-out-there/darts` (`DartsApp`, `./styles.css`) |

```bash
pnpm install
pnpm dev          # demo at http://localhost:3101/darts-score/
pnpm test         # logic unit tests
pnpm test:e2e     # Playwright
pnpm build:demo   # static site -> docs/
```

Package rules: no router/auth/app imports; styles are `dk-` prefixed; host must `@source` this folder and import `./styles.css`.
