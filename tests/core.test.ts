import { describe, it, expect } from "vitest";
import { createWorld, squad, autoLineup } from "../src/domain/world";
import { fixtures, table } from "../src/domain/competition";
import {
  advanceDay,
  nextSeason,
  finalizeMatch,
} from "../src/domain/progression";
import {
  offerTransfer,
  acceptTransfer,
  renewContract,
  train,
  invest,
  hire,
  scout,
  promote,
} from "../src/domain/management";
import { validateWorld } from "../src/domain/validation";
describe("world and calendar invariants", () => {
  it("is reproducible and has unique players", () => {
    const a = createWorld("Kwin", 0, 42);
    expect(a).toEqual(createWorld("Kwin", 0, 42));
    expect(new Set(a.players.map((p) => p.id)).size).toBe(a.players.length);
    expect(validateWorld(a)).toEqual([]);
  });
  it("schedules every pair home and away with one fixture per round", () => {
    const fs = fixtures(["a", "b", "c", "d"], 1, 0);
    expect(fs).toHaveLength(12);
    for (let r = 0; r < 6; r++) {
      const round = fs.filter((f) => f.round === r);
      expect(new Set(round.flatMap((f) => [f.home, f.away])).size).toBe(4);
    }
    expect(new Set(fs.map((f) => f.home + f.away)).size).toBe(12);
  });
  it("derives the table from results", () => {
    const w = createWorld("Test", 0, 42);
    const f = w.fixtures[0];
    f.result = {
      home: 2,
      away: 1,
      events: [],
      stats: { shots: [4, 3], possession: [55, 45] },
      seed: 1,
    };
    const t = table(w, w.clubs[0].league);
    expect(t.find((t) => t.club === f.home)?.points).toBe(3);
    expect(t.reduce((s, t) => s + t.gf, 0)).toBe(3);
  });
  it("applies a day idempotently and never mutates input", () => {
    const w = createWorld("Test", 0, 42);
    const old = JSON.stringify(w);
    const n = advanceDay(w, "cmd-1");
    expect(n.day).toBe(1);
    expect(advanceDay(n, "cmd-1")).toEqual(n);
    expect(JSON.stringify(w)).toBe(old);
  });
  it("selects eleven unique eligible players and a goalkeeper", () => {
    const w = createWorld("Test", 0, 42);
    w.players[0].injuredUntil = 40;
    const ids = autoLineup(w, w.club);
    expect(ids).toHaveLength(11);
    expect(new Set(ids).size).toBe(11);
    expect(ids).not.toContain(w.players[0].id);
    expect(w.players.find((p) => p.id === ids[0])?.position).toBe("GK");
  });
  it("does not record a result twice", () => {
    const w = createWorld("Test", 0, 42);
    const f = w.fixtures[0];
    const result = {
      home: 1,
      away: 0,
      events: [],
      stats: {
        shots: [4, 2] as [number, number],
        possession: [50, 50] as [number, number],
      },
      seed: 1,
    };
    const a = finalizeMatch(w, f.id, result);
    expect(finalizeMatch(a, f.id, result)).toEqual(a);
  });
  it("will not start a new season with unfinished matches", () => {
    expect(() => nextSeason(createWorld("Test", 0, 42), "season")).toThrow();
  });
});
describe("management transactions", () => {
  it("transfers one player once and balances both clubs", () => {
    let w = createWorld("Test", 0, 42);
    const p = squad(w, w.clubs[1].id).find((p) => p.position !== "GK")!;
    const before = w.clubs.reduce((s, c) => s + c.balance, 0);
    w = offerTransfer(w, p.id, Math.ceil(p.value * 1.3), p.wage, 3, "buy");
    const bid = w.transfers[0];
    w = acceptTransfer(w, bid.id);
    expect(w.players.find((x) => x.id === p.id)?.club).toBe(w.club);
    expect(w.clubs.reduce((s, c) => s + c.balance, 0)).toBe(before);
    expect(acceptTransfer(w, bid.id)).toEqual(w);
    expect(validateWorld(w)).toEqual([]);
  });
  it("rejects negative and nonfinite bids without changing state", () => {
    const w = createWorld("Test", 0, 42),
      p = w.players.find((p) => p.club !== w.club)!;
    for (const fee of [-1, NaN, Infinity])
      expect(() => offerTransfer(w, p.id, fee, p.wage, 3, "bad")).toThrow();
  });
  it("rejects unaffordable transfers", () => {
    const w = createWorld("Test", 0, 42),
      p = w.players.find((p) => p.club !== w.club)!;
    expect(() => offerTransfer(w, p.id, 1e14, p.wage, 3, "bad")).toThrow();
  });
  it("renews a player contract with real wage consequences", () => {
    const w = createWorld("Test", 0, 42),
      p = squad(w, w.club)[0];
    const n = renewContract(w, p.id, p.wage * 2, 4);
    expect(n.players.find((x) => x.id === p.id)?.wage).toBe(p.wage * 2);
    expect(n.players.find((x) => x.id === p.id)?.contractUntil).toBe(
      w.season + 4,
    );
  });
  it("assigns training and scouting, and records investment costs", () => {
    let w = createWorld("Test", 0, 42);
    const p = squad(w, w.club)[0];
    w = train(w, p.id, "passing");
    expect(w.players.find((x) => x.id === p.id)?.focus).toBe("passing");
    const balance = w.clubs[0].balance;
    w = invest(w, "academy");
    expect(w.clubs[0].balance).toBeLessThan(balance);
    const target = w.players.find((p) => p.club !== w.club)!;
    w = scout(w, target.id);
    expect(w.scouting).toHaveLength(1);
  });
  it("youth promotion changes selection eligibility", () => {
    let w = createWorld("Test", 0, 42);
    const p = squad(w, w.club).find((p) => p.youth)!;
    w = promote(w, p.id);
    expect(w.players.find((x) => x.id === p.id)?.youth).toBe(false);
  });
});
it("gives incoming transfers a free shirt number in the buying club", () => {
  let w = createWorld("Numbers", 0, 42);
  const p = squad(w, w.clubs[1].id).find((p) => p.position === "MID")!;
  w = offerTransfer(w, p.id, Math.ceil(p.value * 1.3), p.wage, 3, "numbers");
  w = acceptTransfer(w, "numbers");
  const numbers = squad(w, w.club).map((p) => p.number);
  expect(new Set(numbers).size).toBe(numbers.length);
});
it("attributes goals by canonical ID even when names are identical", () => {
  const w = createWorld("IDs", 0, 42),
    f = w.fixtures[0];
  const ps = squad(w, f.home);
  ps[1].name = ps[0].name;
  const n = finalizeMatch(w, f.id, {
    home: 1,
    away: 0,
    seed: 1,
    stats: { shots: [1, 0], possession: [50, 50] },
    events: [
      {
        type: "goal",
        time: 5,
        side: "home",
        player: ps[1].name,
        playerId: ps[1].id,
        home: 1,
        away: 0,
      },
    ],
  });
  expect(n.players.find((p) => p.id === ps[1].id)?.goals).toBe(1);
  expect(n.players.find((p) => p.id === ps[0].id)?.goals).toBe(0);
});
it("never schedules a club twice on the same date across league and cup", () => {
  const w = createWorld("Calendar clashes", 0, 42);
  const seen = new Set<string>();
  for (const f of w.fixtures) {
    for (const id of [f.home, f.away]) {
      const key = f.day + ":" + id;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  }
});
it("credits appearances to actual match participants rather than a stale saved lineup", () => {
  const w = createWorld("Participants", 0, 42),
    f = w.fixtures[0],
    club = w.clubs.find((c) => c.id === f.home)!,
    p = squad(w, f.home).find(
      (p) => !club.tactic.lineup.includes(p.id) && !p.youth,
    )!;
  const result = {
    home: 0,
    away: 0,
    seed: 1,
    stats: {
      shots: [0, 0] as [number, number],
      possession: [50, 50] as [number, number],
    },
    events: [],
    participants: { home: [p.id], away: [] },
  };
  const n = finalizeMatch(w, f.id, result);
  expect(n.players.find((x) => x.id === p.id)?.appearances).toBe(1);
  expect(
    n.players.find((x) => x.id === club.tactic.lineup[0])?.appearances,
  ).toBe(0);
});
it("rejects kickoff before it locks a career into an invalid lineup", async () => {
  const progression = await import("../src/domain/progression");
  const w = createWorld("Kickoff validation", 0, 2),
    f = w.fixtures.find((f) => [f.home, f.away].includes(w.club))!;
  w.day = f.day;
  const c = w.clubs.find((c) => c.id === w.club)!;
  w.players.find((p) => p.id === c.tactic.lineup[0])!.injuredUntil = w.day + 30;
  expect(typeof progression.beginMatch).toBe("function");
  expect(() => progression.beginMatch(w, f.id)).toThrow("niet-inzetbare");
  expect(w.activeMatch).toBeUndefined();
});
