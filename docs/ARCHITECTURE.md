# Architecture

## World and commands

`World` is plain serializable data with stable IDs, schema/engine versions, a dataset provenance record, revision and processed command IDs. Domain commands use structured clones; calendar/result/transfer actions reject duplicates. League tables are derived from completed fixtures. Money is integer euros and every cash movement has a ledger entry, including both sides of transfers.

## Football engine

MIT engine source is pinned and vendored. `MatchSession` projects game attributes, roles, fitness and tactics into engine players/teams and retains canonical mappings. It runs incremental quarter-second ticks and discards redundant snapshots to bound memory. UI receives snapshots from a dedicated worker. Full reports retain compact events and actual participants. The adapter uses the named bench for the managed club. Added manual substitution and extra-time methods preserve on-field state.

## Progression

One command advances a day after due fixtures are resolved. Training, recovery, salaries, scouting and facilities use in-game dates. Other fixtures run in a worker as one staged batch, then the resulting world is atomically saved. Cancellation drops the staged batch. Promotion/relegation, histories, contracts, youth and fixtures are handled at the season transition. The current compact season has 14 league rounds plus a cup; the next season starts after the annual calendar boundary.

Emergency academy registrations are an explicit game rule available to every club if injuries would prevent fixtures. They are weak, zero-value temporary players and cannot be sold during that season. The real-player release must disclose generated academy players as simulation data.

## Save boundary

IndexedDB stores one current envelope and previous envelope per slot. SHA-256 detects accidental corruption; it is not anti-cheat authentication. Zod checks nested shape before semantic ID/ledger checks. Writes are transactional and reject stale/equal-revision conflicting data. A failed save leaves the acknowledged world unchanged. Recovery writes a new higher revision. Exported/imported saves are local only.

Live matches retain a clock and manager-command history. A reload deterministically replays it from the persisted world. UI restricts conflicting domain edits during live matches. Checkpoints are periodic, so sudden browser termination may replay the last short interval.

## Frontend and deployment

Next.js App Router exports a static app. Runtime gameplay needs no server and no mandatory login. Zustand holds active state. CSS has mobile/tablet/desktop layouts, safe areas, focus/reduced-motion styles and pointer/tap alternatives; actual layout and gestures still need browser QA.

`prepare-offline.mjs` generates a content-identified service-worker resource list after each build. It includes all application chunks, workers, CSS, fonts and icons. Activation retains one previous cache generation and update UI waits for controllerchange. This packaging check is not proof of real-device offline behavior.

Render uses a static site and the generated `out` directory. The source must first exist in a supported remote Git repository. No external production resources have been created.
