import { z } from "zod";
const text = z.string().max(300),
  id = z.string().min(1).max(180),
  num = z.number().finite(),
  positive = num.min(0),
  count = positive.int(),
  percent = num.min(0).max(100),
  ids = z.array(id).max(20000);
const tactic = z.object({
  formation: z.enum([
    "4-3-3",
    "4-2-3-1",
    "4-4-2",
    "4-1-4-1",
    "3-5-2",
    "3-4-3",
    "5-3-2",
    "4-4-1-1",
  ]),
  style: z.enum([
    "balanced",
    "possession",
    "direct",
    "counter",
    "low_block",
    "high_press",
  ]),
  mentality: z.enum(["defensive", "balanced", "attacking"]),
  tempo: percent,
  press: percent,
  width: percent,
  defensiveLine: percent,
  compactness: percent,
  focus: z.enum(["balanced", "wide", "central"]),
  lineup: z.array(id).max(11),
  bench: z.array(id).max(15),
  captain: id.nullable(),
  setPieces: id.nullable(),
});
const attributes = z.object({
  pace: percent,
  passing: percent,
  finishing: percent,
  defending: percent,
  goalkeeping: percent,
  stamina: percent,
  decisions: percent,
});
const player = z.object({
  id,
  externalId: id.optional(),
  name: text,
  club: id.nullable(),
  nationality: text,
  born: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  position: z.enum(["GK", "DEF", "MID", "ATT"]),
  number: count,
  ability: percent,
  potential: percent,
  attributes,
  fitness: percent,
  morale: percent,
  form: num.min(0).max(10),
  value: positive,
  wage: positive,
  contractUntil: count,
  youth: z.boolean(),
  injuredUntil: count,
  suspended: count,
  focus: z.enum(["balanced", "passing", "finishing", "defending", "fitness"]),
  listed: z.boolean(),
  loanListed: z.boolean(),
  owner: id.optional(),
  loanUntil: count.optional(),
  goals: count,
  assists: count,
  appearances: count,
  history: z
    .array(
      z.object({ season: count, club: id, goals: count, appearances: count }),
    )
    .max(500),
  development: z.array(z.object({ day: count, ability: percent })).max(5000),
});
const club = z.object({
  id,
  name: text,
  short: text,
  league: id,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  balance: num,
  openingBalance: num,
  wageBudget: positive,
  reputation: percent,
  target: count,
  academy: count,
  training: count,
  scouting: count,
  tactic,
  profile: z.enum(["youth", "seller", "balanced", "contender"]),
  investment: z
    .object({ type: z.enum(["academy", "training", "scouting"]), ready: count })
    .optional(),
});
const event = z.object({
  type: text,
  time: positive,
  side: z.enum(["home", "away"]).optional(),
  player: text.optional(),
  playerId: text.optional(),
  secondary: text.optional(),
  home: count,
  away: count,
});
const result = z.object({
  participants: z.object({ home: ids, away: ids }).optional(),
  home: count.max(100),
  away: count.max(100),
  penalties: z.tuple([count, count]).optional(),
  events: z.array(event).max(10000),
  stats: z.object({
    shots: z.tuple([count, count]),
    possession: z.tuple([percent, percent]),
  }),
  seed: count,
});
export const worldSchema = z.object({
  schema: z.literal(1),
  engineVersion: text,
  id,
  revision: count,
  name: text,
  manager: text,
  nationality: text,
  difficulty: z.enum(["normal", "hard"]),
  club: id,
  day: count,
  season: count,
  seasonStart: count,
  seed: count,
  clubs: z.array(club).min(2).max(500),
  players: z.array(player).min(22).max(20000),
  leagues: z
    .array(
      z.object({
        id,
        name: text,
        country: text,
        tier: count,
        promotion: count,
        relegation: count,
        parent: id.optional(),
        child: id.optional(),
        substitutions: count,
        subWindows: count,
      }),
    )
    .min(1)
    .max(100),
  fixtures: z
    .array(
      z.object({
        id,
        league: id,
        season: count,
        round: count,
        day: count,
        home: id,
        away: id,
        cup: z.boolean().optional(),
        result: result.optional(),
        winner: id.optional(),
      }),
    )
    .max(300000),
  ledger: z
    .array(
      z.object({
        id,
        club: id,
        day: count,
        amount: num,
        category: text,
        description: text,
      }),
    )
    .max(500000),
  transfers: z
    .array(
      z.object({
        id,
        player: id,
        from: id.nullable(),
        to: id,
        fee: positive,
        wage: positive,
        years: count,
        type: z.enum(["buy", "loan"]),
        status: z.enum(["accepted", "rejected", "completed", "pending"]),
        replyDay: count,
      }),
    )
    .max(100000),
  staff: z
    .array(
      z.object({
        id,
        name: text,
        role: z.enum(["coach", "scout", "physio"]),
        skill: percent,
        wage: positive,
        club: id.nullable(),
      }),
    )
    .max(5000),
  scouting: z
    .array(
      z.object({ id, player: id, ready: count, confidence: percent, club: id }),
    )
    .max(20000),
  messages: z
    .array(
      z.object({
        id,
        day: count,
        title: text,
        body: z.string().max(3000),
        screen: text,
        read: z.boolean(),
      }),
    )
    .max(1000),
  processed: ids,
  confidence: percent,
  reputation: percent,
  employed: z.boolean(),
  history: z
    .array(
      z.object({
        season: count,
        league: id,
        champion: id,
        standings: z.array(
          z.object({ club: id, points: count, gf: count, ga: count }),
        ),
      }),
    )
    .max(1000),
  managerHistory: z
    .array(z.object({ season: count, club: id, position: count }))
    .max(500),
  trophies: z.array(z.object({ season: count, name: text })).max(1000),
  savedTactics: z.array(z.object({ name: text, tactic })).max(200),
  provenance: z.object({
    type: z.enum(["fictional", "licensed"]),
    source: text,
    version: text,
    simulationFields: z.array(text).max(100),
  }),
  activeMatch: z
    .object({
      fixture: id,
      time: positive.optional(),
      commands: z
        .array(
          z.object({
            time: positive,
            type: z.enum(["tactic", "sub"]),
            tactic: tactic.partial().optional(),
            out: id.optional(),
            incoming: id.optional(),
          }),
        )
        .max(500),
    })
    .optional(),
});
