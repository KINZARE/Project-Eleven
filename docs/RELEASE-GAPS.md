# Release gaps and limitations

Status: development release; the full Phase 1 + Phase 2 specification is NOT accepted as complete.

## External dependencies

- No authorized player dataset/API access was supplied. No real-player production release has been tested.
- No new GitHub remote exists for this project. Do not push into unrelated repositories.
- Render workspace My Workspace was discovered read-only; no service/project was created.
- Browser control and a runnable browser were unavailable in the selected execution environment. No mobile screenshots, real pointer gesture verification, iOS/Android/browser compatibility or install/offline browser tests were performed. DOM and export-resource checks do not substitute for those checks.

## Product depth still short of the full master prompt

- One fictional national system, not five licensed countries. Club and league metadata imports/provider APIs are absent; existing player import uses the configured club mappings.
- Negotiations use deterministic thresholds and accepted/rejected offers, not a rich multi-round counteroffer/agent system.
- Loans last until the next season. Recall clauses, conditional obligations and wages shared across clubs are absent.
- Staff are quality/wage-based coach/scout/physio roles; no separate staff contracts, AI staff hiring or detailed staff specialization.
- Tactical formation, team instructions, fitness and suitability affect the engine. Custom individual-role editor and full configurable set-piece routines are absent. Captain/taker metadata is retained in the model; this version does not claim those are engine-validated features.
- Player history is seasonal. Detailed injury/transfer timelines, retirement/replacement market balancing across many decades and advanced morale promises need further development.
- Assists are not derived from the engine event chain yet.
- Competition rules currently ship with the engine's five-substitution / three-window policy; arbitrary league policy variants are not validated.
- No Supabase/cloud sync, account system, telemetry or ranked/multiplayer authority. Cloud saves are optional in the brief and are not exposed as working.
- No thousands-of-match or hundreds-of-full-engine-season calibration claim. Structural transition tests and one complete real-engine season have narrower scope.

## Important implemented safeguards

Canonical IDs distinguish same-named players. Transfer receipts/debits balance. Rug numbers remain unique. Save schema and checksums reject malformed/corrupt files. Equal-revision conflicts are rejected. Active-match navigation restricts conflicting gameplay edits. Replay loops stop at full time. Extra time continues players, discipline, fatigue and substitutions. Emergency academy cover prevents an AI fixture from blocking the calendar solely because all its keepers are unavailable. Generated emergency players have zero value and cannot be sold this season. Build-generated offline caches include application/worker/font chunks; updates wait for controllerchange. These safeguards still require real-browser verification.
