# HLD Architect Co-pilot — Build Plan

This file tracks the multi-session build of the app. Goal: become the best system design architect through daily practice — not a course, a gym.

## Decisions locked in

- **Frame**: Skills + Drills, not linear phases. Ten architect behaviors define skills.
- **Home tab**: Daily Loop (today's drill, today's outage, term to revisit, open workspaces, streak).
- **Drills**: random from vault by default, manual pick allowed.
- **Indexer scope**: every folder under `system_design/` with .md content, except `Extras`, `canvas`, `excalidraw`, `awesome-low-level-design`, `docs`, `.obsidian`, `.git`, `.trash`.
- **Markdown stack**: `marked` + lazy `mermaid` + lazy `highlight.js`.
- **Vault path**: configured in `vault.config.mjs`, env override via `VAULT_PATH`.
- **Generated index**: gitignored. Regenerated via `npm run index:vault`.

## The ten architect behaviors (the rubric)

1. Reads constraints first
2. Defends every component
3. Speaks in trade-offs, not tools
4. Does napkin math fast
5. Thinks failure-first
6. Recognizes patterns across domains
7. Phases complexity (v1 / 10× / 100× / 1000×)
8. Communicates to non-engineers
9. Stays calibrated (treats claims as drafts)
10. Practices on a loop

## Phases

| #   | Phase                                                  | Status      |
| --- | ------------------------------------------------------ | ----------- |
| P0  | Foundation: cleanup + vault indexer                    | done        |
| P1  | In-app note reader + Library tab                       | done        |
| P2  | Skills + Drills frame + Daily Loop home                | done        |
| P2.5| Beginner mode: level picker + 14-lesson starter path   | done        |
| P3  | Greenfield drill end-to-end (template drill)           | done        |
| P4  | Workspaces (persistence + browser)                     | done        |
| P5  | Outage replay drill                                    | done        |
| P6  | Architecture linter v2 + Bug Finder drill              | done        |
| P7  | Capacity + bottleneck simulator + phased canvas        | done        |
| P8  | Failure injection drill                                | todo        |
| P9  | Trade-off + migration drills                           | todo        |
| P10 | ADR + founder proposal v2 (grounded in workspace)      | todo        |
| P11 | Interview / panel mode (timed)                         | todo        |
| P12 | Calibration: skills passport + gaps + spaced rep       | todo        |
| P13 | Polish: mobile, performance, error boundaries          | todo        |

**Current phase pointer**: P8

## Phase specs

### P0 — Foundation: cleanup + vault indexer

- Remove `vite-dev.log`, `vite-dev.err`, `dist/`. Update `.gitignore` for generated artifacts.
- `vault.config.mjs` for vault path (env override `VAULT_PATH`).
- `scripts/buildVaultIndex.mjs` walks vault, parses each note: title, tags, headings, intuition, failure-first, wikilinks, mermaid presence, word count, reliability flags (absolute language / vendor-heavy / long-unverified). Output: `src/data/vaultIndex.generated.json`.
- npm scripts: `index:vault`, `predev`, `prebuild`.
- Refactor `src/data/vaultIndex.js` to merge curated section text (priority/summary/role) with counts from generated index.
- **Exit**: `npm run index:vault` produces JSON with ≥120 notes, all with valid metadata; app still runs.

### P1 — In-app note reader + Library tab

- Deps: `marked`, `mermaid` (lazy), `highlight.js` (lazy).
- `<NoteReader>` renders markdown including mermaid, code, tables, callouts.
- Folder tree, search across vault, backlinks panel, last-read state.
- Top-level "Library" tab.
- **Exit**: every vault path referenced in app opens a real readable note.

### P2 — Skills + Drills frame + Daily Loop home

- Replace `LearnView` with `SkillsView` organized by ten behaviors.
- Existing phase content migrates as skill drills + readings (preserved).
- New "Today" home tab: today's drill / outage / term cards, open workspaces, streak counter.
- **Exit**: opening the app lands on Today; cards work.

### P3 — Greenfield drill end-to-end

- Constraints gate (QPS / latency / consistency / durability / cost / team / growth) — required.
- Component palette + per-component justification.
- Architecture linter v1 — 8 rules, each citing a vault note.
- Reference diff against matching case study.
- Honest rubric scoring — checkboxes tied to ten behaviors.
- **Exit**: complete a greenfield drill on URL shortener; meaningful diff vs `design_url_shortener.md`.

### P4 — Workspaces

- Workspace data model `{ id, name, brief, design, findings, notes, adrs, history, createdAt, updatedAt }`.
- Save / load / list / version / compare / delete via localStorage.
- Workspace browser tab.
- Save-from-drill flow.
- Today tab surfaces open workspaces.
- **Exit**: yesterday's drill openable today with state intact.

### P5 — Outage replay drill

- Picks from `09_real_outages/`.
- Pre-incident architecture sketch.
- User predicts root cause + blast radius before reveal.
- Reveal compares with postmortem.
- Attempt saved to workspace history.
- **Exit**: 10 of 15 outages have a working replay.

### P6 — Architecture linter v2 + Bug Finder drill

- Replace keyword bingo in `reviewEngine.js`.
- Rule engine over typed design model from P3.
- 15+ rules, each citing vault patterns / outages.
- Bug Finder drill: random flawed brief → user finds bugs → compare with linter findings + outage citations.
- **Exit**: every linter finding has a clickable vault citation.

### P7 — Capacity + bottleneck simulator + phased canvas

- Capacity widget: storage, QPS, bandwidth, rough cost.
- Bottleneck simulator: at 2× / 10× / 100×, name next thing to break.
- Phased canvas: v1 / 10× / 100× / 1000× columns.
- **Exit**: bottleneck simulator returns a non-trivial result for the saved checkout workspace.

### P8 — Failure injection drill

- Pick component → choose failure mode (slow / dead / partitioned / drop 1% / drop 50%).
- Walk cascade asking timeout / retry / breaker / fallback / alert / user-visible at each hop.
- Score against failure-first behaviors.
- **Exit**: drill works on any saved workspace design.

### P9 — Trade-off + migration drills

- Trade-off defense drill on a trade-off canvas template.
- Migration drill: v1 → v2 plan with rollback per step.
- Both save to workspace.
- **Exit**: one trade-off and one migration drill end-to-end with reference diff.

### P10 — ADR + founder proposal v2

- Replace templated string in `reviewEngine.js#buildProposal`.
- Pull workspace findings, design state, lint output, capacity numbers.
- ADR includes context / constraints / options / decision / trade-offs / rollout / metrics / revisit-when.
- Founder proposal connects technical choice to business impact.
- **Exit**: a saved workspace produces a credible ADR.

### P11 — Interview / panel mode

- 45-min timer, structured prompt, vault locked until submit.
- After submit: full diff vs case study + rubric self-rating.
- **Exit**: one full timed run on a case study.

### P12 — Calibration: skills passport + gaps + spaced rep

- Skills passport tracks ten behaviors over time per drill.
- Gaps view — behaviors / topics you keep skipping.
- Vocab + concept review schedule based on drill usage.
- Reliability badges (from P0 indexer) appear in reader.
- **Exit**: passport view shows real distribution.

### P13 — Polish

- Mobile layout pass.
- Dark mode contrast.
- Empty states everywhere.
- Error boundaries around drill / reader.
- Vault index size — lazy-load by folder if > 1 MB.
- **Exit**: phone-width clean run, no console errors.

## Resume instructions for future Claude sessions

1. Read this file. Find current phase pointer.
2. Open the open phase's spec.
3. Execute. Commit when phase exits cleanly.
4. Update the table (mark done) and bump current phase pointer.
5. Append a one-line log under the phase spec noting what shipped.

## Phase log

### P0 log
- 2026-04-25: Indexer parses 255 notes across 22 folders, 143 with reliability flags, 87 backlinks resolved. Generated index is 555 KB JSON. Build passes; dev server boots on port 5174. `vault.config.mjs` supports `VAULT_PATH` env override. `src/data/vaultIndex.js` now merges curated section descriptions with generated counts via `SECTION_MANIFEST`. Helpers exported: `notesByFolder`, `notesByType`, `notesByTag`, `getNote`, `backlinksFor`. Generated JSON gitignored.

### P1 log
- 2026-04-25: Indexer now also emits per-folder content chunks under `src/data/vault/*.generated.json` (19 chunks, 8.26 MB total raw / ~1.5 MB gzipped, code-split per folder via `import.meta.glob`). Added `src/lib/markdown.js` (marked + lazy mermaid + lazy highlight.js + Obsidian wikilink extension). Added `src/lib/vaultLoader.js` (folder-level lazy loader with cache). Added `src/components/NoteReader.jsx` (renders markdown, scrolls top on note change, resolves wikilink clicks, shows reliability flag badges + backlinks panel). Added `src/components/LibraryView.jsx` (folder tree + full-text search across title/tag/intuition/heading + note list + reader pane). Wired App.jsx with Library tab, lifted `activeNotePath` state to localStorage, added `openNote(path)` handler that switches tab + sets path. Source-note citations in LearnView (phase.sourceNotes) and VocabView (term.sourceNotes) are now clickable `SourceNoteLink` buttons that open the reader; missing notes show as disabled with strikethrough. Build passes (warnings on chunk size are expected for vault content); dev runs at 5173.
- 2026-04-25: Followup — added `vite.config.js` with `@vitejs/plugin-react` so the automatic JSX runtime is enabled (new components don't need `import React`).

### P2 log
- 2026-04-25: Reframed app from "phases" to "skills + drills." Added `src/data/skills.js` with the ten architect behaviors; each skill has behavior, cue, source notes (from vault), drill, bug scenario, readiness — pulled from existing phase data where possible, written inline for skills 3 (trade-offs), 4 (napkin math), 9 (calibrated), 10 (loop). Extracted `SourceNoteLink` and `VaultMap` from App.jsx into `src/components/`. Added `src/components/SkillsView.jsx` replacing LearnView (sidebar + workbench + overview/drill/bug modes + readiness checklist). Added `src/components/TodayView.jsx` — new home tab with greeting, streak counter (localStorage `hld-streak`), and four daily cards (drill / outage / term / skill) using deterministic per-day hash so all picks rotate together. Outage card pulls from indexed `09_real_outages` notes with failureFirst preview. Tab order is now Today → Skills → Library → Vocabulary → Review System → Proposal → Notes; `activeTab` and `activeSkillId` persisted to localStorage. LearnView removed from App.jsx (~245 lines deleted); imports cleaned.

### P2.5 log
- 2026-04-26: Beginner mode. Added `LevelPicker` overlay shown on first load when `hld-level` is unset; user picks beginner / practicing / advanced. Added `src/data/starterPath.js` — 14 ordered lessons mapping to existing fundamentals/building-block/pattern/HLD notes, each with `whyThisMatters` and two `checkQuestions`. Added `StarterPathToday` component (rendered on Today tab when level=beginner): hero with progress bar, "Up next" CTA card, full lesson list with done/current/upcoming states, beginner-only term card filtered to Fundamentals, "Skip to Practicing mode" footer. Added `LessonView` for single-lesson detail: back button, why-this-matters callout, embedded NoteReader, two-textarea reflect section, two-click "Mark complete" with confirm step. Graduation screen renders after lesson 14 with explicit "Switch to Practicing mode" promotion. Added `DrillApproachScaffold` (six-step recipe: restate → constraints → paths → components → failures → trade-offs) collapsible in SkillsView drill mode, default open for beginner/practicing, default closed for advanced. App.jsx wires `level` and `starterProgress` to localStorage; gates the rest of the app behind LevelPicker until level is set. Build clean.

### P3 log
- 2026-04-26: Greenfield drill end-to-end. New top-level **Drill** tab between Skills and Library. Six curated cases (URL Shortener, Notification Service, Real-time Chat, Food Delivery, Search Autocomplete, Payment System) each with prompt, suggested constraints, expected components, key insights, and a `refCasePath` pointing into `05_case_studies/`. 16-component palette categorized as Edge / Application / Data / Async / Observability. Three-step wizard: (1) **Constraints** gate — 8 fields (read QPS, write QPS, p95 latency, team size, consistency, durability, cost, growth) — required to proceed; "Use suggested values" shortcut available. (2) **Components** — palette on the left, chosen list with per-component justification textarea on the right; rule that justifications must be ≥12 chars to advance; warning highlight on under-justified items. (3) **Review** — runs `lintDrill()` over the state and shows findings sorted by severity (high/medium/low) with vault citations as `SourceNoteLink`s; component diff against expected (covered / missed / extra); 10-item self-rubric tied to the architect skills; full case-study `NoteReader` rendered inline at the bottom for reference. Drill state persisted per case in `localStorage[hld-drill-${caseId}]`. Linter has 8 rules: missing-constraints, unjustified-component, cache-without-invalidation, queue-without-controls, sql-write-bottleneck, strong-with-cache, microservices-small-team, sync-side-effects — each with a specific vault citation. New files: `src/data/drillCases.js`, `src/lib/drillLinter.js`, `src/components/DrillView.jsx`, `src/components/DrillWizard.jsx`. Build clean.

### P4 log
- 2026-04-26: Workspaces — the persistence layer. New `src/data/workspaces.js` provides a unified workspace store backed by `localStorage["hld-workspaces"]` with CRUD: `listWorkspaces`, `getWorkspace`, `createWorkspace`, `updateWorkspace`, `deleteWorkspace`, `findDrillWorkspace`, `ensureDrillWorkspace`, `statusOf`. Workspace shape is a discriminated union by `kind` ('drill' | 'review'). `useWorkspaces` and `useWorkspace` hooks subscribe via in-page pubsub + `storage` event listener for cross-tab updates. One-time migration converts legacy `hld-drill-${caseId}` keys to drill workspaces (gated by `hld-workspaces-migrated-v1` flag). DrillWizard refactored to use the workspace API: state lives in the workspace; every edit persists immediately via `updateWorkspace`. DrillView's case picker now reads workspace status via `findDrillWorkspace`/`statusOf`. New `WorkspacesView` tab between Drill and Library: hero with "New system review" CTA, search box, in-progress/completed sections, per-row open + delete buttons, time-since-update display. TodayView (practicing flavor) gains an "Open workspaces" card listing up to 4 in-progress workspaces with deep-link to drill or review tab. App.jsx adds `openWorkspace()` handler that routes by kind. Build clean.

### P5 log
- 2026-04-26: Outage Replay drill. New top-level **Outage** tab (between Drill and Workspaces). Curated 15 of 15 vault outages in `src/data/outageReplays.js` — each replay has a spoiler-free pre-incident block (architecture summary, components, normal state, trigger hint), four reveal sections (root cause, blast radius, recovery, prevention), key lessons, and related vault notes. Four predict prompts (rootCause / blastRadius / recovery / prevention) are identical across all replays so the user builds a consistent failure-first habit. Three-step drill flow: (1) **Brief** — read pre-incident architecture; (2) **Predict** — fill four textareas (≥20 chars each) before reveal unlocks; (3) **Reveal** — side-by-side prediction vs reality for each prompt with a 4-tier self-rating (Off / Some clue / Got close / Got it), key lessons callout, related notes, and the full postmortem rendered inline via `NoteReader`. After saving, a Done step shows score (X / 16), full attempt history with timestamps, and a "Replay this outage" CTA so the same outage can be re-attempted later. Workspace model extended with `kind: "outage"` storing `{ step, currentAttempt, attempts: [] }`; new helpers `findOutageWorkspace`, `ensureOutageWorkspace`. `statusOf` now marks an outage workspace completed once it has a finished attempt with no in-flight one. `WorkspacesView` shows outage attempt counts; `TodayView`'s daily outage card auto-deep-links into the replay drill when the picked outage has a curated replay (falls back to "Read postmortem" otherwise). New `OutageReplayView` (grid + drill in one file, mirroring DrillView/DrillWizard pattern). App.jsx adds `activeOutageId` localStorage state, `openOutageReplay` handler, `openWorkspace` extended to route outage kind. Build clean.

### P6 log
- 2026-04-26: Architecture Linter v2 + Bug Finder drill. **Linter v2** (`src/lib/drillLinter.js`): refactored from 8 inline rules to a 19-rule table-driven engine. Each rule has `id`, `severity`, `title`, `when` predicate (or `runMany` for per-component findings), `detailFrom`, `suggestedFix`, `citations`, optional `outageRefs`. New v2 rules: `no-load-balancer-at-scale`, `no-cdn-for-static`, `no-observability`, `no-rate-limit-on-public-api`, `high-durability-no-replication`, `search-via-sql`, `api-gateway-without-auth`, `payment-without-idempotency`, `low-latency-no-cache`, `blob-without-cdn`, `no-backup-language-at-high-durability`. **All 34 vault citations validated to resolve** in the indexer; outageRefs link to specific 09_real_outages notes (e.g., `payment-without-idempotency` → Knight Capital, `high-durability-no-replication` → GitLab + GitHub, `no-cdn-for-static` → Fastly). Exports new `LINT_RULES_INDEX` for downstream use (P10 ADR builder). **Bug Finder drill** — new top-level tab between Drill and Outage. Six curated flawed scenarios in `src/data/bugScenarios.js` (checkout-double-charge, photo-gallery-overload, notification-firehose, search-via-sql, iot-ingest-overload, premature-microservices), each with a typed design (constraints + components with justifications), a narrative, and 7-9 candidate bugs (mix of real + plausible decoys). Real bugs have `severity`, `ruleMatch` (links to a linter rule id), `explanation`, and `citations`; decoys have only an `explanation` calling out why the pattern-match is wrong here. Three-step flow: (1) **Brief** — read narrative + typed design; (2) **Find bugs** — checkbox list of candidates; (3) **Reveal** — score banner (hits − false positives), three sections (caught / missed / decoys-fallen-for) with citations, plus a separate **Linter section** that runs `lintDrill()` against the design and shows fired rules with a "matches your pick" badge where they overlap. New workspace `kind: "bugfinder"` with attempt history identical in shape to outage replays. `WorkspacesView` and TodayView surface bugfinder workspaces. Component reuses outage-card / drill-stepper / drill-step CSS; new `bf-*` styles for design panel, candidate list, score banner, lint result rows. App.jsx adds `activeBugScenarioId` localStorage state and `openWorkspace` routing. Build clean.

### P7 log
- 2026-04-26: Capacity Lab — capacity calculator + bottleneck simulator + phased canvas. New `src/lib/capacity.js` with three pure helpers: (1) `computeCapacity(constraints, components, assumptions)` derives storage/day, storage/year (with replication), peak in/out bandwidth Mbps, monthly egress GB, DB IOPS estimate (using a configurable cache hit rate), and a monthly cost band (storage low/high + bandwidth + compute boxes). Sensible defaults: 5KB payload, 365-day retention, 3× replication for high durability, 70% cache hit, 2× write amplification. (2) `simulateBottlenecks(constraints, components)` runs at multipliers [2, 10, 100, 1000] — for each, scales QPS, re-runs the v2 linter, surfaces *new* findings (vs base) plus four capacity-specific heuristics: sharding mandatory at >50K writes/s, CDN mandatory at >50K reads/s, multi-region at >100× and global QPS, connection-pool exhaustion when reads+writes >25K with no cache (cites Slack 2024). (3) `phasedComponents(constraints, components)` produces a four-column evolution: v1 (today) / 10× scale-up / 100× scale-out / 1000× planet-scale. Each phase shows the cumulative stack and the components that get added at that phase, with one-line rationale. New `src/components/CapacityLabView.jsx` — picker lists drill workspaces with components, then renders a tabbed lab: capacity stat grid (6 cards: storage/day, storage/year, bandwidth in/out, DB IOPS, monthly cost band) with a collapsible "Adjust assumptions" panel, bottleneck simulator (4 cards 2×/10×/100×/1000× each with severity-tagged break list and clickable citations), and phased canvas (4 column grid showing stack with new-this-phase components highlighted plus "why these are added" rationale). New top-level **Capacity** tab between Outage and Workspaces. App.jsx adds `capacityWorkspaceId` localStorage state. Smoke test on payment-system case (1K read / 500 write QPS, 5KB payload): storage 412 GB/day → 440 TB/year replicated; cost band $46K–$455K/month; 0 breaks at 2×, 1 break at 10× (no LB), 3 breaks at 100×, 5 breaks at 1000× (sharding + multi-region + CDN + LB + pool exhaustion). Exit criterion satisfied. Build clean.
