# HLD Architect Co-pilot

**Live demo:** [vibhu-0511.github.io/hld-architect-copilot](https://vibhu-0511.github.io/hld-architect-copilot/)

A browser-based **system-design gym**. Practice architecting real systems, replay famous outages, hunt bugs in flawed designs, and run capacity numbers — grounded in a curated 255-note vault of system design knowledge.

> **Goal:** stop reading about system design and start practicing it. Five minutes of drills a day beats a weekend marathon every quarter.

---

## What's inside

| Tab | What you do |
|---|---|
| **Today** | Daily drill, daily outage to replay, term to revisit, streak counter. |
| **Skills** | Ten architect behaviors (constraints first, defends every component, trade-offs, napkin math, failure-first, patterns, phased complexity, communication, calibration, looped practice). Each has cue, drill, bug scenario, and source notes. |
| **Drill** | Greenfield system design from scratch — six cases (URL Shortener, Notification Service, Real-time Chat, Food Delivery, Search Autocomplete, Payment System). Three-step wizard: state constraints → choose components with justification → review against a 19-rule architecture linter and a real case study. |
| **Bug Finder** | Six pre-built flawed designs with mixed real bugs and decoys. Pick the real ones; reveal compares your picks with the linter run. |
| **Outage** | 15 real production outages (S3 2017, Facebook BGP, CrowdStrike, Knight Capital, GitLab, TSB, etc.). Predict root cause / blast radius / recovery / prevention before reading the postmortem. Self-rate, save attempts. |
| **Capacity** | Capacity calculator (storage / bandwidth / IOPS / cost band), bottleneck simulator at 2× / 10× / 100× / 1000×, phased canvas showing how the architecture must evolve. |
| **Workspaces** | Persistence layer for everything you start. Drill attempts, outage replays, bug hunts, system reviews — all live here, all in localStorage, all resumable. |
| **Library** | The full 255-note vault rendered in-app: folder tree, full-text search, backlinks, code highlighting, and Mermaid diagrams. |
| **Vocabulary** | Curated terms with beginner / what / when / not-when / cost / example, plus flashcards and a spaced-repetition review queue. |
| **Review System** | Paste an architecture brief, get findings sorted by severity. |
| **Proposal** | Turn review findings into a founder-facing recommendation draft. |
| **Notes** | Personal note-taking with templates, attached to phases / cases / bugs. |

There's also a **beginner mode** with a 14-lesson starter path that walks you from "what's a client-server" up through "how do I think about HLD" before unlocking the rest of the app.

---

## Tech stack

- **React 19** + **Vite 7** (no backend, no auth, all state in `localStorage`)
- **Marked** + lazy **Mermaid** + lazy **highlight.js** for note rendering, with an Obsidian `[[wikilink]]` extension
- **Build-time vault indexer** (Node ESM) walks the markdown vault and emits per-folder content chunks for code-split lazy loading
- **Tailwind-free, hand-written CSS** with light/dark themes
- **lucide-react** icons
- **Multi-stage Docker** (Node build → nginx serve)
- Free hosting on **Vercel / Netlify / Cloudflare Pages / GitHub Pages**

---

## Run it locally

```bash
git clone <this repo>
cd "<this repo>"
npm install
npm run dev
# → http://127.0.0.1:5173
```

The vault is bundled at `./vault/system_design/`. The indexer auto-runs before `dev` and `build`. To use a different vault, set `VAULT_PATH`:

```bash
VAULT_PATH="/path/to/your/system_design" npm run dev
```

---

## Run it in Docker

```bash
# Build & run with one command
docker compose up --build

# → http://localhost:8080
```

Or without compose:

```bash
docker build -t hld-architect-copilot .
docker run -p 8080:80 hld-architect-copilot
```

The image is multi-stage:
1. `node:20-alpine` runs the indexer + Vite build
2. `nginx:alpine` serves the static `dist/` with SPA fallback, gzip, and immutable cache headers on hashed assets

Final image is ~25 MB.

---

## Host it for free

Pick one. All four give you a permanent URL on a free tier.

### Option 1 — Vercel  *(recommended; simplest)*

1. Push this repo to GitHub.
2. Sign in to [vercel.com](https://vercel.com) with GitHub.
3. **Add New → Project** → pick the repo → click **Deploy**.
4. Vercel reads `vercel.json`, runs `npm run build`, serves `dist/`. You get `https://<project>.vercel.app` in ~60 seconds. Future pushes auto-deploy.

### Option 2 — Netlify

1. Push to GitHub.
2. Sign in to [netlify.com](https://netlify.com) with GitHub.
3. **Add new site → Import existing project** → pick the repo. Netlify reads `netlify.toml`. You get `https://<project>.netlify.app`.

### Option 3 — Cloudflare Pages

1. Push to GitHub.
2. [pages.cloudflare.com](https://pages.cloudflare.com) → **Create a project** → connect GitHub → pick the repo.
3. Build command `npm run build`, output directory `dist`. You get `https://<project>.pages.dev`.

### Option 4 — GitHub Pages  *(via included workflow)*

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy-pages.yml`) builds and publishes on every push to `main`. URL: `https://<user>.github.io/<repo>/`.

> The workflow sets `VITE_BASE_PATH=/<repo>/` automatically so asset URLs resolve.

### Option 5 — Docker on Fly.io / Render *(if you want the Docker route)*

- **Fly.io**: `fly launch` (uses your Dockerfile) → `fly deploy`. Free allowance covers a tiny static site easily.
- **Render**: New → Web Service → connect GitHub → Render auto-detects Docker. Free tier sleeps after inactivity but wakes on request.

---

## Project structure

```
.
├── vault/system_design/         255 markdown notes (the corpus)
├── scripts/buildVaultIndex.mjs  Build-time indexer
├── src/
│   ├── App.jsx                  Tab shell, routing, level gate
│   ├── components/              Per-tab views (Drill, Outage, Bug Finder, Capacity, Library, …)
│   ├── data/                    Curated content (skills, drill cases, outage replays, bug scenarios)
│   ├── lib/                     Pure helpers (linter, capacity math, markdown renderer, vault loader)
│   └── styles.css               One-file CSS, light + dark themes
├── BUILD_PLAN.md                Phase-by-phase build log
├── Dockerfile                   Multi-stage prod image
├── nginx.conf                   SPA fallback + cache headers
├── docker-compose.yml           One-command local Docker run
├── vercel.json                  Vercel deploy config
├── netlify.toml                 Netlify deploy config
└── .github/workflows/deploy-pages.yml   GitHub Pages CI/CD
```

---

## Development

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (auto-runs indexer first) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run index:vault` | Re-run the vault indexer manually |

The `predev` and `prebuild` lifecycle scripts run the indexer automatically — you rarely need to call it directly.

### Adding to the vault

Drop new `.md` files anywhere under `vault/system_design/` (or your `VAULT_PATH`). Re-run `npm run index:vault` and reload — they show up in the Library tab and become wiki-link targets. Skipped folders: `Extras`, `canvas`, `excalidraw`, `awesome-low-level-design`, `docs`, `.obsidian`, `.git`, `.trash`.

### Adding a new linter rule

Append to `RULES` in [`src/lib/drillLinter.js`](./src/lib/drillLinter.js). Each rule needs `id`, `severity`, a `when(state)` predicate (or a `runMany` for per-component findings), and at least one vault citation. Rules surface immediately in the Drill review screen, the Bug Finder reveal, and the Capacity bottleneck simulator at 2× / 10× / 100× / 1000×.

### Adding a new outage replay

Append to `OUTAGE_REPLAYS` in [`src/data/outageReplays.js`](./src/data/outageReplays.js). Pre-incident block (architecture summary + components + trigger hint) is spoiler-free; the reveal block has root cause / blast radius / recovery / prevention.

---

## Resume blurb

> **HLD Architect Co-pilot** — *(personal project)*
>
> Practice-first system-design platform built with React 19 + Vite + a custom Node-ESM indexer. Walks 255 markdown notes from an Obsidian vault and emits per-folder content chunks for code-split lazy loading. Features include a typed-design architecture linter (19 rules over a typed model, each citing real production outages), a 15-outage replay drill, a bug-finder drill with mixed real bugs + decoys, a capacity simulator that scales QPS at 2× / 10× / 100× / 1000× to surface the next bottleneck, and a workspace persistence layer with cross-tab sync. ~6K LOC. Multi-stage Docker, deployed on Vercel.
>
> Live: https://vibhu-0511.github.io/hld-architect-copilot/  ·  Source: https://github.com/vibhu-0511/hld-architect-copilot

---

## Credits & inspirations

- Vault content distilled from years of system-design study notes — Designing Data-Intensive Applications, ByteByteGo, real postmortems, and personal project experience.
- Outage replays sourced from public postmortems (AWS, Cloudflare, Facebook, GitHub, GitLab, CrowdStrike, Knight Capital, TSB, Roblox, Slack, Discord, Southwest, Google Cloud, Fastly).

---

## License

Code is MIT. Vault notes are personal study notes — feel free to read, learn, and adapt.
