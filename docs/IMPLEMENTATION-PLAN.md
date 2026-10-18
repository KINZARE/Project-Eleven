# Project Eleven Implementation Plan
Goal: implement the supplied MASTER-PROMPT as an integrated offline football manager, shipping only verified features.
Architecture: pure serializable WorldState, immutable commands; seeded MIT engine behind adapter; worker simulation; transactional IndexedDB envelopes and backups; React UI; static Next export on Render.
Spec: MASTER-PROMPT.md.
Execution: native, user requested build.
## Task 1 — World and competition core
Tests first: round-robin pairs and no duplicate team per round; same seed identical world; ranking derived from fixtures; invalid lineup rejected. Implement model.ts, world.ts, competition.ts, rules.ts.
## Task 2 — Simulation adapter
Test deterministic score and actual 22-player snapshots, no duplicate result, tactics alter trajectory. Implement match.ts, worker.ts. Preserve actual engine coordinates.
## Task 3 — Career and economy
Tests: day exactly once, balanced transfer ledger and unique ownership, contract budget validation, injury eligibility, training and youth, season history. Implement progression.ts, management.ts.
## Task 4 — Persistence and data
Tests: transaction backup, corrupt export rejected, incompatible version rejected, stale saves do not overwrite, import validates IDs/assignments. Implement persistence and import adapters.
## Task 5 — Mobile gameplay UI
Implement onboarding, home, squad/player sheet, tactics, incremental match, transfers, training, staff, youth, finances, competition, inbox, career and save slots. Every exposed button invokes a domain command.
## Task 6 — Verification and delivery
Run full suite, stress worlds, typecheck, lint, build and available browser QA. Ship PWA manifest / icons / offline shell. Read QA report before deployment. Deployment requires supported Git remote and authorized Render workspace; missing licensed dataset blocks real-player release, not fictional development build.
## Review focus
Crash during calendar commit; double-tap transfer; corrupted save; season boundary and contract expiry; injured goalkeeper / insufficient eligible squad.
