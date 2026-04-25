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
| P1  | In-app note reader + Library tab                       | todo        |
| P2  | Skills + Drills frame + Daily Loop home                | todo        |
| P3  | Greenfield drill end-to-end (template drill)           | todo        |
| P4  | Workspaces (persistence + browser)                     | todo        |
| P5  | Outage replay drill                                    | todo        |
| P6  | Architecture linter v2 + Bug Finder drill              | todo        |
| P7  | Capacity + bottleneck simulator + phased canvas        | todo        |
| P8  | Failure injection drill                                | todo        |
| P9  | Trade-off + migration drills                           | todo        |
| P10 | ADR + founder proposal v2 (grounded in workspace)      | todo        |
| P11 | Interview / panel mode (timed)                         | todo        |
| P12 | Calibration: skills passport + gaps + spaced rep       | todo        |
| P13 | Polish: mobile, performance, error boundaries          | todo        |

**Current phase pointer**: P1

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
