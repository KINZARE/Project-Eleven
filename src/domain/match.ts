import Engine, {
  type MatchSnapshot,
  type TeamSide,
} from "../../vendor/football-simulator/RealTimeEngine";
import SimPlayer, {
  type PlayerAttributes,
} from "../../vendor/football-simulator/Player";
import Team from "../../vendor/football-simulator/Team";
import { Position as Role } from "../../vendor/football-simulator/enums/Position";
import {
  type World,
  type Player,
  type Tactic,
  type Result,
  type Fixture,
  type StoredEvent,
  rng,
  hash,
  clamp,
} from "./model";
import { autoLineup, formationRoles, squad, eligible } from "./world";
import { assertLineup } from "./validation";
const fields = [
  "aggression",
  "anticipation",
  "bravery",
  "composure",
  "concentration",
  "decisions",
  "determination",
  "flair",
  "leadership",
  "offTheBall",
  "positioning",
  "teamwork",
  "vision",
  "workRate",
  "acceleration",
  "agility",
  "balance",
  "jumpingReach",
  "naturalFitness",
  "pace",
  "stamina",
  "strength",
  "corners",
  "crossing",
  "dribbling",
  "finishing",
  "firstTouch",
  "freeKickTaking",
  "heading",
  "longShots",
  "longThrows",
  "marking",
  "passing",
  "penaltyTaking",
  "tackling",
  "technique",
  "aerialReach",
  "commandOfArea",
  "communication",
  "eccentricity",
  "handling",
  "oneOnOnes",
  "reflexes",
  "rushingOut",
  "tendencyToPunch",
  "throwing",
] as const;
function roles(formation: string) {
  const lines = formation.split("-").map(Number);
  return [
    Role.GK,
    ...lines.flatMap((n, i) =>
      Array.from({ length: n }, (_, j) =>
        i === 0
          ? n >= 4
            ? j === 0
              ? Role.LB
              : j === n - 1
                ? Role.RB
                : j === 1
                  ? Role.LCB
                  : Role.RCB
            : [Role.LCB, Role.CB, Role.RCB][j]
          : i === lines.length - 1
            ? n === 3
              ? [Role.LW, Role.ST, Role.RW][j]
              : Role.ST
            : j === 0
              ? Role.LCM
              : j === n - 1
                ? Role.RCM
                : Role.CM,
      ),
    ),
  ];
}
function simPlayer(p: Player, role: Role): SimPlayer {
  const suitability =
    p.position === "GK DEF MID ATT".split(" ")[formationRolesForRole(role)]
      ? 1
      : 0.78;
  const factor =
    (0.65 + p.fitness * 0.0035) * (0.88 + p.morale * 0.0012) * suitability;
  const attributes = Object.fromEntries(
    fields.map((k) => [k, clamp((p.ability / 5) * factor, 1, 20)]),
  ) as unknown as PlayerAttributes;
  for (const [source, targets] of Object.entries({
    pace: ["pace", "acceleration"],
    passing: ["passing", "vision", "firstTouch"],
    finishing: ["finishing", "longShots", "penaltyTaking"],
    defending: ["tackling", "marking", "positioning"],
    goalkeeping: ["handling", "reflexes", "oneOnOnes", "aerialReach"],
    stamina: ["stamina", "naturalFitness"],
    decisions: ["decisions", "anticipation", "composure"],
  })) {
    for (const target of targets)
      attributes[target as keyof PlayerAttributes] = clamp(
        (p.attributes[source as keyof Player["attributes"]] / 5) * factor,
        1,
        20,
      );
  }
  return new SimPlayer(
    { name: p.name, number: p.number },
    { height: 180, weight: 76 },
    attributes,
    role,
  );
}
function formationRolesForRole(r: Role) {
  return r === Role.GK
    ? 0
    : [
          Role.LB,
          Role.LCB,
          Role.CB,
          Role.RCB,
          Role.RB,
          Role.LWB,
          Role.RWB,
        ].includes(r)
      ? 1
      : [Role.LW, Role.RW, Role.ST, Role.CF, Role.LF, Role.RF].includes(r)
        ? 3
        : 2;
}
export class MatchSession {
  engine: Engine;
  world: World;
  fixture: Fixture;
  seed: number;
  ids: Record<string, string> = {};
  last!: MatchSnapshot;
  extraPlayed = false;
  starters: { home: string[]; away: string[] } = { home: [], away: [] };
  commands: NonNullable<World["activeMatch"]>["commands"] = [];
  constructor(w: World, fixtureId: string) {
    this.world = w;
    this.fixture = w.fixtures.find((f) => f.id === fixtureId)!;
    if (!this.fixture || this.fixture.result)
      throw new Error("Deze wedstrijd kan niet gestart worden.");
    this.seed = hash(`${w.seed}:${fixtureId}`);
    const teams = ([this.fixture.home, this.fixture.away] as const).map(
      (cid, i) => {
        const c = w.clubs.find((c) => c.id === cid)!;
        const lineup = cid === w.club ? c.tactic.lineup : autoLineup(w, cid);
        this.starters[i === 0 ? "home" : "away"] = [...lineup];
        if (lineup.length !== 11)
          throw new Error(`${c.name} heeft niet genoeg inzetbare spelers.`);
        if (cid === w.club) assertLineup(w, cid);
        const bench =
          cid === w.club
            ? c.tactic.bench
                .map((id) => w.players.find((p) => p.id === id))
                .filter((p): p is Player =>
                  Boolean(
                    p &&
                    p.club === cid &&
                    eligible(p, w) &&
                    !lineup.includes(p.id),
                  ),
                )
            : squad(w, cid)
                .filter((p) => eligible(p, w) && !lineup.includes(p.id))
                .slice(0, 9);
        const positions = roles(c.tactic.formation);
        const team = new Team(i === 0, c.name, [
          ...lineup.map((id, j) =>
            simPlayer(
              w.players.find((p) => p.id === id)!,
              positions[j],
            ),
          ),
          ...bench.map((p) =>
            simPlayer(
              p,
              p.position === "GK"
                ? Role.GK
                : p.position === "DEF"
                  ? Role.CB
                  : p.position === "MID"
                    ? Role.CM
                    : Role.ST,
            ),
          ),
        ]);
        return team;
      },
    );
    this.engine = new Engine(teams[0], teams[1], {
      random: rng(this.seed),
      homeTactics: w.clubs.find((c) => c.id === this.fixture.home)!.tactic,
      awayTactics: w.clubs.find((c) => c.id === this.fixture.away)!.tactic,
    });
    for (const side of ["home", "away"] as const) {
      const cid = side === "home" ? this.fixture.home : this.fixture.away;
      if (
        cid === w.club &&
        w.clubs.find((c) => c.id === cid)!.tactic.bench.length === 0
      )
        this.engine.state.bench[side] = [];
    }
    this.last = this.engine.start();
    for (const p of [
      ...this.engine.state.players,
      ...this.engine.state.bench.home,
      ...this.engine.state.bench.away,
    ]) {
      const club = p.side === "home" ? this.fixture.home : this.fixture.away;
      const canonical = w.players.find(
        (x) => x.club === club && x.number === p.player.info.number,
      );
      if (canonical) this.ids[canonical.id] = p.id;
    }
    for (const p of this.engine.state.players) {
      const original = w.players.find((x) => this.ids[x.id] === p.id);
      if (original) p.stamina = original.fitness;
    }
  }
  step(seconds = 60) {
    const until = this.engine.state.time + seconds;
    let guard = 0;
    while (
      this.engine.state.time < until &&
      this.engine.state.period !== "ended"
    ) {
      this.last = this.engine.tick().snapshot;
      if (this.engine.snapshots.length > 4)
        this.engine.snapshots.splice(0, this.engine.snapshots.length - 1);
      if (++guard > 40000)
        throw new Error("Wedstrijd overschrijdt de simulatielimiet.");
    }
    if (
      this.engine.state.period === "ended" &&
      this.fixture.cup &&
      !this.extraPlayed &&
      this.engine.state.score.home === this.engine.state.score.away
    ) {
      this.extraPlayed = true;
      this.engine.beginExtraTime();
    }
    return {
      snapshot: this.last,
      events: this.events(),
      finished: this.engine.state.period === "ended",
    };
  }
  events(): StoredEvent[] {
    return this.engine.events
      .filter((e) =>
        [
          "goal",
          "shot",
          "save",
          "miss",
          "yellow_card",
          "red_card",
          "injury",
          "substitution",
          "half_time",
          "full_time",
          "tactical_change",
          "penalty",
        ].includes(e.type),
      )
      .map((e) => ({
        type: e.type,
        time: e.time,
        side: e.teamSide,
        player: e.player?.info.name,
        playerId: Object.keys(this.ids).find(
          (id) => this.ids[id] === e.playerId,
        ),
        secondary: e.secondaryPlayer?.info.name,
        home: e.score.home,
        away: e.score.away,
      }));
  }
  tactic(side: TeamSide, t: Partial<Tactic>) {
    this.engine.applyTacticalChange(side, t, "manager_request");
    this.commands.push({
      time: this.engine.state.time,
      type: "tactic",
      tactic: t,
    });
  }
  substitute(side: TeamSide, out: string, incoming: string) {
    if (!this.ids[out] || !this.ids[incoming])
      throw new Error("Speler niet gevonden.");
    this.engine.requestSubstitution(side, this.ids[out], this.ids[incoming]);
    this.commands.push({
      time: this.engine.state.time,
      type: "sub",
      out,
      incoming,
    });
  }
  result(): Result {
    if (this.engine.state.period !== "ended")
      throw new Error("De wedstrijd is nog bezig.");
    const events = this.events();
    const passes = this.engine.events.filter((e) => e.type === "pass");
    const home = passes.filter((e) => e.teamSide === "home").length;
    const possession = passes.length
      ? Math.round((home / passes.length) * 100)
      : 50;
    return {
      participants: {
        home: [
          ...new Set([
            ...this.starters.home,
            ...events
              .filter(
                (e) =>
                  e.type === "substitution" && e.side === "home" && e.playerId,
              )
              .map((e) => e.playerId!),
          ]),
        ],
        away: [
          ...new Set([
            ...this.starters.away,
            ...events
              .filter(
                (e) =>
                  e.type === "substitution" && e.side === "away" && e.playerId,
              )
              .map((e) => e.playerId!),
          ]),
        ],
      },
      home: this.engine.state.score.home,
      away: this.engine.state.score.away,
      events,
      seed: this.seed,
      stats: {
        shots: [
          events.filter((e) => e.type === "shot" && e.side === "home").length,
          events.filter((e) => e.type === "shot" && e.side === "away").length,
        ],
        possession: [possession, 100 - possession],
      },
    };
  }
}
export function finishCup(session: MatchSession): Result {
  const w = session.world,
    f = session.fixture,
    r = session.result();
  if (!f.cup || r.home !== r.away) return r;
  const random = rng(r.seed + 77),
    score: [number, number] = [0, 0];
  const takers = [f.home, f.away].map((cid) =>
    squad(w, cid)
      .filter((p) => eligible(p, w) && p.position !== "GK")
      .sort((a, b) => b.attributes.finishing - a.attributes.finishing),
  );
  for (let round = 0; round < 30; round++) {
    for (let side = 0; side < 2; side++) {
      const p = takers[side][round % takers[side].length];
      const opposingKeeper = squad(w, side === 0 ? f.away : f.home).find(
        (p) => p.position === "GK",
      );
      const chance = clamp(
        0.7 +
          p.attributes.finishing * 0.002 -
          (opposingKeeper?.attributes.goalkeeping || 50) * 0.001,
        0.45,
        0.9,
      );
      if (random() < chance) score[side]++;
    }
    if (round >= 4 && score[0] !== score[1]) break;
    if (round === 29) {
      score[random() < 0.5 ? 0 : 1]++;
    }
  }
  return { ...r, penalties: score };
}
export function simulateFixture(w: World, id: string): Result {
  const session = new MatchSession(w, id);
  while (session.engine.state.period !== "ended") session.step(600);
  return finishCup(session);
}
