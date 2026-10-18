# Project Eleven

Mobile-first local single-player football manager, Dutch UI. **Development build, not the complete licensed production release described in the master prompt.**

## Run

Requires Node 22+. `npm ci`, then `npm run dev`. To create a static production export: `npm run build`. Serve the `out` directory over HTTP(S); do not open HTML with file:// (workers and service workers require a proper origin).

## Current gameplay

16 fictional clubs, two linked divisions, home/away league fixtures, domestic cup with extra time and penalties, standings, squad and formation management, incremental 2D match simulation, live tactical changes and substitutions, calendar, transfers and season-long loans, contracts, scouting, training, youth intake, staff, a reconciled financial ledger, facilities, board confidence/dismissal, career history and local save slots with backup/export/import.

The MIT match engine is vendored at a pinned revision; required notices are retained. The game owns serializable domain state. Web Workers handle matches and other clubs' fixtures. IndexedDB commits actions before acknowledging them in UI. Match checkpoints are reconstructed from deterministic commands. Conflicting gameplay edits are prevented while a match is active; save management remains available.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm test` (includes a full real-engine season; allow several minutes)
- `npm run build`
- `node scripts/verify-export.mjs`
- `npm audit --omit=dev`

`docs/QA-REPORT.md` records actual coverage and limits. DOM tests are not browser tests. Do not infer iPhone Safari, Android, mobile layout or PWA installation quality from a successful build.

## Real data

No licensed dataset was supplied. Existing careers are snapshots and never silently overwritten by later imports. CSV and JSON imports accept stable external IDs, validated player names, club mappings and positions; optional date/nationality/ability. The import UI requires coherent squads for every configured club. Club/league metadata imports and authenticated provider API adapters are **not implemented**. The shipped competitions and clubs are fictional. Simulated attributes/values are labelled game data.

## Render

`render.yaml` defines a static site with `out` as publish directory. Runtime saves are in the player's IndexedDB, so no server database is required. A supported Git repository must be created and pushed before Render can clone/deploy this source. No deployment was created in this session and no live URL is claimed. GitHub connector currently exposes operations on existing repositories, not repository creation.

## Architectural boundaries

`src/domain`: game rules and models; `src/workers`: simulation protocol; `src/persistence`: versioned transactional saves; `src/ui`: interactions; `vendor/football-simulator`: MIT engine with documented manual substitution / extra time extensions. `docs/MASTER-PROMPT.md` remains the source requirements; see the gap report before calling this production ready.
