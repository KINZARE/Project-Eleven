import {
  type World,
  type Club,
  type Player,
  type Tactic,
  type Position,
  rng,
  clamp,
  age,
} from "./model";
import { fixtures, cupDraw } from "./competition";
export const defaultTactic = (): Tactic => ({
  formation: "4-3-3",
  style: "balanced",
  mentality: "balanced",
  tempo: 50,
  press: 50,
  width: 55,
  defensiveLine: 50,
  compactness: 55,
  focus: "balanced",
  lineup: [],
  bench: [],
  captain: null,
  setPieces: null,
});
const clubNames = [
  "Amsterdam Noord",
  "Rotterdam Haven",
  "Utrecht Stad",
  "Haarlem United",
  "Arnhem Rijn",
  "Eindhoven Licht",
  "Breda Zuid",
  "Groningen Groen",
  "Delft Blauw",
  "Zwolle IJssel",
  "Leiden Sport",
  "Maastricht Maas",
  "Alkmaar Duin",
  "Enschede Oost",
  "Tilburg Oranje",
  "Deventer Rood",
];
const first = [
  "Milan",
  "Daan",
  "Noah",
  "Luca",
  "Sem",
  "Finn",
  "Jesse",
  "Bram",
  "Levi",
  "Adam",
  "Niek",
  "Ravi",
  "Timo",
  "Omar",
  "Joep",
  "Sven",
  "Ilias",
  "Ruben",
  "Lars",
  "Thijs",
  "Max",
  "Yuri",
  "Noud",
  "Abel",
];
const last = [
  "Vermeer",
  "Bakker",
  "de Vries",
  "Jansen",
  "van Dijk",
  "Visser",
  "Meijer",
  "de Wit",
  "Smit",
  "Bos",
  "Mulder",
  "de Groot",
  "Vos",
  "Peters",
  "Kok",
  "Jacobs",
  "van Leeuwen",
  "Hendriks",
  "de Jong",
  "Dekker",
];
export function eligible(p: Player, w: World) {
  return (
    !p.youth &&
    p.injuredUntil <= w.day &&
    p.suspended === 0 &&
    p.fitness >= 25 &&
    p.club !== null
  );
}
export function squad(w: World, club: string) {
  return w.players.filter((p) => p.club === club);
}
export function formationRoles(formation: string): Position[] {
  const lines = formation.split("-").map(Number);
  return [
    "GK",
    ...lines.flatMap((n, i) =>
      Array<Position>(n).fill(
        i === 0 ? "DEF" : i === lines.length - 1 ? "ATT" : "MID",
      ),
    ),
  ];
}
export function autoLineup(w: World, club: string, formation?: string) {
  const c = w.clubs.find((c) => c.id === club)!;
  const pool = squad(w, club).filter((p) => eligible(p, w));
  const picked: string[] = [];
  for (const role of formationRoles(formation || c.tactic.formation)) {
    const candidates = pool
      .filter(
        (p) =>
          !picked.includes(p.id) &&
          (role === "GK" ? p.position === "GK" : p.position !== "GK"),
      )
      .sort(
        (a, b) =>
          b.ability * (b.position === role ? 1 : 0.68) +
          b.fitness * 0.12 -
          (a.ability * (a.position === role ? 1 : 0.68) + a.fitness * 0.12),
      );
    if (candidates[0]) picked.push(candidates[0].id);
  }
  return picked;
}
export function makePlayer(
  id: string,
  club: string | null,
  number: number,
  quality: number,
  random: () => number,
  season = 2026,
  youth = false,
): Player {
  const a = clamp(Math.round(quality + (random() - 0.5) * 15), 20, 92);
  const position: Position = youth
    ? (["GK", "DEF", "MID", "ATT"] as const)[(number - 1) % 4]
    : number < 3
      ? "GK"
      : number < 11
        ? "DEF"
        : number < 19
          ? "MID"
          : "ATT";
  const attributes = {
    pace: a,
    passing: a,
    finishing: position === "ATT" ? a : Math.round(a * 0.65),
    defending: position === "DEF" ? a : Math.round(a * 0.65),
    goalkeeping: position === "GK" ? a : 10,
    stamina: clamp(a + 10),
    decisions: a,
  };
  for (const k of Object.keys(attributes) as (keyof typeof attributes)[])
    attributes[k] = clamp(
      attributes[k] + Math.round((random() - 0.5) * 12),
      5,
      99,
    );
  return {
    id,
    name: `${first[Math.floor(random() * first.length)]} ${last[Math.floor(random() * last.length)]}`,
    club,
    number,
    nationality: "Nederland",
    born: `${season - (youth ? 16 + Math.floor(random() * 3) : 19 + Math.floor(random() * 15))}-${String(1 + Math.floor(random() * 12)).padStart(2, "0")}-15`,
    position,
    ability: a,
    potential: clamp(a + Math.round(random() * (youth ? 25 : 12)), a, 95),
    attributes,
    fitness: 95,
    morale: 70,
    form: 6.5,
    value: Math.round(a * a * a * (youth ? 2 : 4)),
    wage: Math.round(a * a * 0.7),
    contractUntil: season + 2 + Math.floor(random() * 3),
    youth,
    injuredUntil: 0,
    suspended: 0,
    focus: "balanced",
    listed: false,
    loanListed: false,
    goals: 0,
    assists: 0,
    appearances: 0,
    history: [],
    development: [],
  };
}
export function createWorld(manager: string, clubIndex = 0, seed = 42): World {
  if (!manager.trim() || manager.trim().length > 60)
    throw new Error("Vul een managernaam van 1–60 tekens in.");
  const random = rng(seed);
  const clubs: Club[] = clubNames.map((name, i) => ({
    id: `club-${i}`,
    name,
    short: name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 3),
    league: i < 8 ? "nl-1" : "nl-2",
    color: ["#b9ef79", "#f2b27c", "#a9bfff", "#e3a6da"][i % 4],
    balance: i < 8 ? 28000000 : 12000000,
    openingBalance: i < 8 ? 28000000 : 12000000,
    wageBudget: i < 8 ? 150000 : 100000,
    reputation: 65 - i,
    target: i < 3 ? 3 : i < 8 ? 6 : 5,
    academy: 1,
    training: 1,
    scouting: 1,
    tactic: defaultTactic(),
    profile: (["contender", "balanced", "youth", "seller"] as const)[i % 4],
  }));
  const w: World = {
    schema: 1,
    engineVersion: "bleckert-39529b1+eleven-1",
    id: `career-${seed}`,
    revision: 0,
    name: `${manager} · ${clubs[clubIndex]?.name || clubs[0].name}`,
    manager: manager.trim(),
    nationality: "Nederland",
    difficulty: "normal",
    club: clubs[clubIndex]?.id || clubs[0].id,
    day: 0,
    season: 2026,
    seasonStart: 0,
    seed,
    clubs,
    leagues: [
      {
        id: "nl-1",
        name: "Nationale Liga",
        country: "Nederland",
        tier: 1,
        promotion: 0,
        relegation: 2,
        child: "nl-2",
        substitutions: 5,
        subWindows: 3,
      },
      {
        id: "nl-2",
        name: "Eerste Liga",
        country: "Nederland",
        tier: 2,
        promotion: 2,
        relegation: 0,
        parent: "nl-1",
        substitutions: 5,
        subWindows: 3,
      },
    ],
    players: clubs.flatMap((c, i) =>
      Array.from({ length: 28 }, (_, n) =>
        makePlayer(
          `${c.id}:p${n}`,
          c.id,
          n + 1,
          (i < 8 ? 68 : 55) - (i % 8) * 1.5,
          random,
          2026,
          n >= 24,
        ),
      ),
    ),
    fixtures: [],
    ledger: [],
    transfers: [],
    staff: Array.from({ length: 40 }, (_, i) => ({
      id: `staff-${i}`,
      name: `${first[i % first.length]} ${last[(i + 5) % last.length]}`,
      role: (["coach", "scout", "physio"] as const)[i % 3],
      skill: 45 + Math.floor(random() * 45),
      wage: 800 + Math.floor(random() * 1200),
      club: i < clubs.length ? clubs[i].id : null,
    })),
    scouting: [],
    messages: [
      {
        id: "welcome",
        day: 0,
        title: "Welkom bij je nieuwe club",
        body: "Stel je elftal samen, bekijk de tactiek en bereid de eerste wedstrijd voor. Dit is een fictieve ontwikkelwereld.",
        screen: "squad",
        read: false,
      },
    ],
    processed: [],
    confidence: 70,
    reputation: 25,
    employed: true,
    history: [],
    managerHistory: [],
    trophies: [],
    savedTactics: [],
    provenance: {
      type: "fictional",
      source: "Project Eleven development world",
      version: "1",
      simulationFields: ["all"],
    },
  };
  for (const c of clubs) {
    c.tactic.lineup = autoLineup(w, c.id);
    c.tactic.bench = squad(w, c.id)
      .filter((p) => !p.youth && !c.tactic.lineup.includes(p.id))
      .slice(0, 9)
      .map((p) => p.id);
    c.tactic.captain = c.tactic.lineup[5];
    c.tactic.setPieces = c.tactic.lineup[10];
  }
  w.fixtures = [
    ...w.leagues.flatMap((l) =>
      fixtures(
        clubs.filter((c) => c.league === l.id).map((c) => c.id),
        w.season,
        0,
        l.id,
      ),
    ),
    ...cupDraw(
      w,
      clubs.map((c) => c.id),
    ),
  ];
  return w;
}
export { age };
