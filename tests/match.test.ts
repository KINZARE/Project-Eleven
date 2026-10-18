import { it, expect } from "vitest";
import { createWorld } from "../src/domain/world";
import { MatchSession, simulateFixture } from "../src/domain/match";
it("runs actual reproducible pitch simulation and reacts to tactical input", () => {
  const w = createWorld("Test", 0, 77),
    id = w.fixtures[0].id;
  const a = new MatchSession(w, id),
    b = new MatchSession(w, id);
  const first = a.step(30),
    same = b.step(30);
  expect(first.snapshot.players).toHaveLength(22);
  expect(first.snapshot).toEqual(same.snapshot);
  expect(first.snapshot.time).toBeGreaterThan(0);
  a.tactic("home", { style: "high_press", press: 95, tempo: 95 });
  expect(a.step(30).snapshot).not.toEqual(b.step(30).snapshot);
});
it("uses requested substitutes and refuses players who are not on the bench", () => {
  const w = createWorld("Test", 0, 77),
    f = w.fixtures[0],
    s = new MatchSession(w, f.id),
    c = w.clubs.find((c) => c.id === f.home)!;
  s.step(20);
  s.substitute("home", c.tactic.lineup[6], c.tactic.bench[2]);
  expect(s.engine.state.substitutionsUsed.home).toBe(1);
  expect(() => s.substitute("home", "invalid", "invalid")).toThrow();
});
it("completes a full deterministic ninety-minute match", () => {
  const w = createWorld("Test", 0, 77),
    id = w.fixtures[0].id;
  const r = simulateFixture(w, id);
  expect(r.home).toBeGreaterThanOrEqual(0);
  expect(r.events.some((e) => e.type === "full_time")).toBe(true);
  expect(r).toEqual(simulateFixture(w, id));
}, 120000);
it("uses the saved named bench rather than choosing a different one", () => {
  const w = createWorld("Bench", 0, 3),
    f = w.fixtures[0],
    c = w.clubs.find((c) => c.id === w.club)!;
  const p = w.players
    .filter(
      (p) => p.club === w.club && !p.youth && !c.tactic.lineup.includes(p.id),
    )
    .at(-1)!;
  c.tactic.bench = [p.id];
  const s = new MatchSession(w, f.id);
  const side = f.home === w.club ? "home" : "away";
  expect(s.engine.state.bench[side]).toHaveLength(1);
  expect(s.engine.state.bench[side][0].player.info.number).toBe(p.number);
});
it("preserves the same on-field players, cards and substitutions into extra time", () => {
  const w = createWorld("Extra", 0, 2),
    s = new MatchSession(w, w.fixtures[0].id);
  s.step(5);
  s.engine.state.substitutionsUsed.home = 2;
  s.engine.state.players[0].yellowCards = 1;
  const players = s.engine.state.players;
  s.engine.state.period = "ended";
  s.engine.state.time = 5500;
  s.engine.beginExtraTime();
  expect(s.engine.state.players).toBe(players);
  expect(s.engine.state.players[0].yellowCards).toBe(1);
  expect(s.engine.state.substitutionsUsed.home).toBe(2);
  expect(s.engine.state.period).toBe(1);
  expect(s.step(1).snapshot.time).toBeGreaterThan(5500);
});
it("does not invent engine-only substitutes when the registered bench is empty", () => {
  const w = createWorld("No bench", 0, 5),
    c = w.clubs.find((c) => c.id === w.club)!;
  c.tactic.bench = [];
  const f = w.fixtures[0],
    s = new MatchSession(w, f.id);
  expect(
    s.engine.state.bench[f.home === w.club ? "home" : "away"],
  ).toHaveLength(0);
});
