# Execution ledger

User authorized build of the supplied master prompt and selected Render instead of Vercel.

- Discovery: pinned MIT engine at 39529b19c40868d66aa47db084ebc9ea29c86e70. Inspected unlicensed mobile reference without copying its code. GPL reference not imported.
- Architecture: pure domain World, deterministic match adapter, worker protocol, IndexedDB envelopes, Next static export.
- Implementation: integrated core and management screens, transactional saves and fictional development world. Not a complete production release; see RELEASE-GAPS.md.
- Tests first: core rules, simulations, persistence, imports, ownership regressions and review regressions were introduced before corresponding fixes. Initial scaffolding tests failed on missing modules; some UI/config work was verified after implementation. Do not describe the whole effort as strict per-function TDD.
- Review: independent source-based reviewer identified seven Important issues (calendar availability, active match input mutation, invalid checkpoint loops, equal-revision conflict, extra-time reset, bench mismatch, offline/update coherence). Regression tests cover core fixes; browser-only behavior remains unverified.
- Additional fix: cup matches originally collided with league dates. Cup scheduling was offset and a collision regression was added.
- Additional fix: post-match appearances use actual participants, not stale AI lineup metadata.

Ruling: Render supersedes original Vercel target by explicit user choice.
Ruling: use a labelled fictional development world until a licensed dataset is supplied; never claim real player coverage.
Ruling: no browser automation was available; record the verification boundary and withhold production readiness.
Ruling: do not write into an unrelated GitHub repository merely to bypass the missing create-repository operation.

Costs if wrong: fictional data blocks the intended real-player release; local-only saves can be lost if users erase site storage without exporting; unverified browser behavior can still block mobile/PWA release. These are explicit release gaps rather than accepted production risks.
