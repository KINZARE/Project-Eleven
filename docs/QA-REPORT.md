# QA report — 2026-10-18

**Release decision: development checkpoint only. Full licensed production acceptance is NOT met.**

| Check | Actual result |
|---|---|
| Complete project test command | 36 / 36 passing across 7 files; final run 281.53 seconds |
| Domain and transactions | Fixture scheduling, table derivation, idempotent day/result, eligibility, transfers, ownership/numbers, contracts, training, scouting, investments, promotion and actual participant attribution |
| Match integration | Seed reproducibility, real 22-player snapshots, tactical trajectory changes, explicit substitutions, preserved state in extra time, named/empty benches |
| Real-engine season | 127 matches including league and cup; league clubs finish 14 games; valid standings/ledger; next season starts |
| Structural stress | 100 independently seeded starting worlds; 100 season transitions using synthetic completed fixture records across 20 independent worlds × 5 seasons |
| Persistence | Roundtrip, backup, recovery revisions, stale/equal revision conflicts, corruption/version/nested schema and invalid active checkpoint rejection |
| Data | CSV quoting, duplicate external IDs, rejecting incomplete rosters |
| UI integration | jsdom/Testing Library: onboarding, selection, player training focus and persisted reload. This is not a real-browser E2E test |
| TypeScript | Passing |
| ESLint | Passing |
| Production build | Passing in final isolated build, Next static export |
| Export resources | 41 precached resources; application chunks, workers, CSS/fonts, manifest icons and HTML-linked files exist |
| Production dependency audit | 0 reported vulnerabilities at audit time; development dependencies are outside this statement |
| Direct dependency licenses | Installed metadata recorded in INSTALLED-LICENSES.md; MIT vendored engine notice retained and served |
| Render configuration | Passed current official Blueprint JSON Schema through ajv-cli draft2020. URI format warnings were ignored by that validator; the authored file contains no URI fields. No Render CLI/platform validation or deployment performed |
| Independent review | Source-based review found seven Important issues; core regression fixes implemented. No visual approval is claimed |
| Browser/mobile/PWA | Not executed: no browser/control capability available. 320/360/390/430/tablet/desktop CSS is authored, not visually verified |
| Live deployment and smoke test | Not executed; no supported remote repository exists for this new project |
| Licensed players | Not executed; authorized dataset not supplied |

## Failures investigated and fixed

- Unavailable AI keepers could stop the calendar: introduced deterministic academy emergency registration rules and a regression.
- Live matches could be edited through other screens: conflicting navigation is restricted and kickoff validates the lineup before locking a career.
- Invalid replay times could loop past full time: schema/reference checks and engine-ended guards bound replay.
- Equal-revision writes could overwrite progress: transactional conflict detection rejects distinct same-revision saves.
- Extra time created a fresh XI: same engine session now continues player/card/fatigue/substitution state.
- Bench shown in UI differed from match selection: managed team uses its named bench; empty bench no longer creates engine-only players.
- Offline/update packaging omitted app resources: generated content-keyed precache includes all required assets; activation reload waits for controllerchange.
- Duplicate shirt numbers, same-named goals, stale participant attribution, and league/cup date collisions have regression coverage.
- Concurrent build attempts raced over output artifacts. The final build was rerun in isolation and its exported files verified. Only that isolated result is reported as the build evidence.
- Formatting changed service-worker template quotes/line breaks. Generator replacement was made quote/line-break tolerant and export verification rerun.

## Acceptance still outstanding

Read RELEASE-GAPS.md before publishing. In particular, this is one fictional national competition system with simplified advanced management, not the complete five-country real-player game. Real-browser flows, mobile layout, offline/install/update behavior, storage/network failures and a live smoke test are release gates. No claim of thousands of matches, hundreds of complete engine seasons, physical-device testing or production readiness is made.
