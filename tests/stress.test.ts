import { prepareMatchDay } from "../src/domain/emergency";
import { it, expect } from "vitest";
import { createWorld, autoLineup, squad } from "../src/domain/world";
import { fixtures, table } from "../src/domain/competition";
import {
  advanceDay,
  nextSeason,
  finalizeMatch,
} from "../src/domain/progression";
import { simulateFixture } from "../src/domain/match";
import { validateWorld } from "../src/domain/validation";
import type { Result, World } from "../src/domain/model";
it("validates 100 independent generated worlds and round-robin schedules", () => {
  for (let seed = 0; seed < 100; seed++) {
    const w = createWorld("Stress", seed % 16, seed);
    expect(validateWorld(w)).toEqual([]);
    for (const league of w.leagues) {
      const fs = w.fixtures.filter((f) => f.league === league.id);
      expect(fs.length).toBe(56);
      expect(new Set(fs.map((f) => `${f.home}:${f.away}`)).size).toBe(56);
    }
  }
});
it("survives 100 season transitions with histories, youth and reconciled ledgers", () => {
  for (let seed = 0; seed < 20; seed++) {
    let w = createWorld("Season", seed % 16, seed);
    for (let season = 0; season < 5; season++) {
      for (const f of w.fixtures.filter((f) => f.season === w.season)) {
        f.result = {
          home: 1,
          away: 0,
          events: [],
          stats: { shots: [1, 0], possession: [50, 50] },
          seed: 1,
        };
        if (f.cup) f.winner = f.home;
      }
      w = nextSeason(w, `transition-${w.season}`);
      expect(validateWorld(w)).toEqual([]);
      expect(w.history).toHaveLength((season + 1) * 2);
      expect(w.fixtures.filter((f) => f.season === w.season)).toHaveLength(120);
    }
  }
}, 120000);
it("plays one complete season using the real engine and starts the next", () => {
  let w = createWorld("Full career", 0, 99);
  let matches = 0;
  while (w.fixtures.some((f) => f.season === w.season && !f.result)) {
    const next = w.fixtures
      .filter((f) => !f.result && f.season === w.season)
      .sort((a, b) => a.day - b.day)[0];
    while (w.day < next.day) w = advanceDay(w, `stress-day-${w.day + 1}`);
    w = prepareMatchDay(w);
    for (const club of w.clubs) {
      club.tactic.lineup = autoLineup(w, club.id);
      club.tactic.bench = squad(w, club.id)
        .filter(
          (p) =>
            !p.youth &&
            !club.tactic.lineup.includes(p.id) &&
            p.injuredUntil <= w.day &&
            !p.suspended,
        )
        .slice(0, 9)
        .map((p) => p.id);
    }
    const result = simulateFixture(w, next.id);
    w = finalizeMatch(w, next.id, result);
    matches++;
  }
  expect(matches).toBe(127);
  for (const l of w.leagues)
    expect(table(w, l.id).every((r) => r.played === 14)).toBe(true);
  expect(validateWorld(w)).toEqual([]);
  w = nextSeason(w, "season-next");
  expect(w.season).toBe(2027);
  expect(validateWorld(w)).toEqual([]);
}, 600000);
