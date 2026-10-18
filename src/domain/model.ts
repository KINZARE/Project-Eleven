export type Position = "GK" | "DEF" | "MID" | "ATT";
export type Focus =
  "balanced" | "passing" | "finishing" | "defending" | "fitness";
export type Style =
  "balanced" | "possession" | "direct" | "counter" | "low_block" | "high_press";
export interface Attributes {
  pace: number;
  passing: number;
  finishing: number;
  defending: number;
  goalkeeping: number;
  stamina: number;
  decisions: number;
}
export interface Player {
  id: string;
  externalId?: string;
  name: string;
  club: string | null;
  nationality: string;
  born: string;
  position: Position;
  number: number;
  ability: number;
  potential: number;
  attributes: Attributes;
  fitness: number;
  morale: number;
  form: number;
  value: number;
  wage: number;
  contractUntil: number;
  youth: boolean;
  injuredUntil: number;
  suspended: number;
  focus: Focus;
  listed: boolean;
  loanListed: boolean;
  owner?: string;
  loanUntil?: number;
  goals: number;
  assists: number;
  appearances: number;
  history: {
    season: number;
    club: string;
    goals: number;
    appearances: number;
  }[];
  development: { day: number; ability: number }[];
}
export interface Tactic {
  formation: string;
  style: Style;
  mentality: "defensive" | "balanced" | "attacking";
  tempo: number;
  press: number;
  width: number;
  defensiveLine: number;
  compactness: number;
  focus: "balanced" | "wide" | "central";
  lineup: string[];
  bench: string[];
  captain: string | null;
  setPieces: string | null;
}
export interface Club {
  id: string;
  name: string;
  short: string;
  league: string;
  color: string;
  balance: number;
  openingBalance: number;
  wageBudget: number;
  reputation: number;
  target: number;
  academy: number;
  training: number;
  scouting: number;
  tactic: Tactic;
  profile: "youth" | "seller" | "balanced" | "contender";
  investment?: { type: "academy" | "training" | "scouting"; ready: number };
}
export interface League {
  id: string;
  name: string;
  country: string;
  tier: number;
  promotion: number;
  relegation: number;
  parent?: string;
  child?: string;
  substitutions: number;
  subWindows: number;
}
export interface StoredEvent {
  type: string;
  time: number;
  side?: "home" | "away";
  player?: string;
  playerId?: string;
  secondary?: string;
  home: number;
  away: number;
}
export interface Result {
  participants?: { home: string[]; away: string[] };
  home: number;
  away: number;
  penalties?: [number, number];
  events: StoredEvent[];
  stats: { shots: [number, number]; possession: [number, number] };
  seed: number;
}
export interface Fixture {
  id: string;
  league: string;
  season: number;
  round: number;
  day: number;
  home: string;
  away: string;
  cup?: boolean;
  result?: Result;
  winner?: string;
}
export interface Ledger {
  id: string;
  club: string;
  day: number;
  amount: number;
  category: string;
  description: string;
}
export interface Transfer {
  id: string;
  player: string;
  from: string | null;
  to: string;
  fee: number;
  wage: number;
  years: number;
  type: "buy" | "loan";
  status: "accepted" | "rejected" | "completed" | "pending";
  replyDay: number;
}
export interface Staff {
  id: string;
  name: string;
  role: "coach" | "scout" | "physio";
  skill: number;
  wage: number;
  club: string | null;
}
export interface Message {
  id: string;
  day: number;
  title: string;
  body: string;
  screen: string;
  read: boolean;
}
export interface ScoutReport {
  id: string;
  player: string;
  ready: number;
  confidence: number;
  club: string;
}
export interface World {
  schema: 1;
  engineVersion: string;
  id: string;
  revision: number;
  name: string;
  manager: string;
  nationality: string;
  difficulty: "normal" | "hard";
  club: string;
  day: number;
  season: number;
  seasonStart: number;
  seed: number;
  clubs: Club[];
  leagues: League[];
  players: Player[];
  fixtures: Fixture[];
  ledger: Ledger[];
  transfers: Transfer[];
  staff: Staff[];
  scouting: ScoutReport[];
  messages: Message[];
  processed: string[];
  confidence: number;
  reputation: number;
  employed: boolean;
  history: {
    season: number;
    league: string;
    champion: string;
    standings: { club: string; points: number; gf: number; ga: number }[];
  }[];
  managerHistory: { season: number; club: string; position: number }[];
  trophies: { season: number; name: string }[];
  savedTactics: { name: string; tactic: Tactic }[];
  provenance: {
    type: "fictional" | "licensed";
    source: string;
    version: string;
    simulationFields: string[];
  };
  activeMatch?: {
    fixture: string;
    time?: number;
    commands: {
      time: number;
      type: "tactic" | "sub";
      tactic?: Partial<Tactic>;
      out?: string;
      incoming?: string;
    }[];
  };
}
export interface Standing {
  club: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}
export const formations = [
  "4-3-3",
  "4-2-3-1",
  "4-4-2",
  "4-1-4-1",
  "3-5-2",
  "3-4-3",
  "5-3-2",
  "4-4-1-1",
];
export const clamp = (n: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, n));
export function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x += 0x6d2b79f5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(s: string) {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++)
    n = Math.imul(n ^ s.charCodeAt(i), 16777619);
  return n >>> 0;
}
export function integer(n: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(n) || n < min || n > max)
    throw new Error("Voer een geldig positief geheel getal in.");
  return n;
}
export function date(day: number) {
  return new Date(Date.UTC(2026, 6, 1 + day)).toISOString().slice(0, 10);
}
export function age(p: Player, day: number) {
  const d = new Date(date(day)),
    b = new Date(p.born);
  return (
    d.getUTCFullYear() -
    b.getUTCFullYear() -
    (d.toISOString().slice(5, 10) < p.born.slice(5, 10) ? 1 : 0)
  );
}
