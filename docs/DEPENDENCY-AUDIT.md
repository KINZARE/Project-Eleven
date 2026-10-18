# Dependency and source audit — 2026-10-18
- football-simulator: inspected upstream commit 39529b19c40868d66aa47db084ebc9ea29c86e70. MIT, copyright Tobias Bleckert 2026. Vendored source and required license retained. RealTimeEngine exposes seeded random, incremental tick, snapshots, tactical changes, auto substitutions (5 / 3 windows). Manual substitutions and competition variations need adapter extension and tests. No claim of production maturity from stars alone.
- JorgeQuijano/football-manager: inspected commit 7cfa8ce6f6c224007afcfad32202a1730918992f. No root LICENSE found; package private:true does not grant redistribution permission. No code, assets, text, or UI imported.
- openfootmanager/openfootmanager: GPL-3.0 shown by repository. Reference only; no code imported.
- Next.js, React, Zustand, Dexie, Zod, Lucide and events: direct package licenses must also be verified from installed metadata and recorded by tooling. Lockfile pins transitive graph.
- Real-world players / club badges / imagery: no dataset received, none distributed. Fictional world contains game-generated simulation values.
