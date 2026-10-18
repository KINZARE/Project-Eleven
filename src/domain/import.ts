import { z } from "zod";
import type { World } from "./model";
import { hash, rng } from "./model";
import { makePlayer, autoLineup, squad } from "./world";
const playerSchema = z.object({
  externalId: z.string().min(1).max(150),
  name: z.string().min(1).max(120),
  club: z.string().min(1),
  position: z.enum(["GK", "DEF", "MID", "ATT"]),
  born: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  nationality: z.string().max(80).optional(),
  ability: z.coerce.number().min(1).max(99).optional(),
});
export interface Dataset {
  source: string;
  version: string;
  players: z.infer<typeof playerSchema>[];
}
function csv(raw: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (quoted && raw[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && raw[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Ongesloten aanhalingsteken in CSV.");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  const header = rows.shift()?.map((h) => h.trim());
  if (!header) throw new Error("CSV is leeg.");
  return rows.map((r) =>
    Object.fromEntries(header.map((h, i) => [h, r[i]?.trim() || undefined])),
  );
}
export function parseDataset(raw: string, format: "csv" | "json"): Dataset {
  if (raw.length > 20e6)
    throw new Error("Dataset is te groot (maximaal 20 MB).");
  const data =
    format === "json"
      ? JSON.parse(raw)
      : { source: "User-supplied CSV", version: "1", players: csv(raw) };
  const parsed = z
    .object({
      source: z.string().min(1),
      version: z.string().default("1"),
      players: z.array(playerSchema).min(1).max(20000),
    })
    .safeParse(data);
  if (!parsed.success)
    throw new Error(
      "Dataset ongeldig: " +
        parsed.error.issues
          .slice(0, 4)
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
    );
  if (
    new Set(parsed.data.players.map((p) => p.externalId)).size !==
    parsed.data.players.length
  )
    throw new Error("Dubbele externe speler-ID in de dataset.");
  return parsed.data;
}
export function applyDataset(w: World, data: Dataset): World {
  if (w.activeMatch || w.fixtures.some((f) => f.result))
    throw new Error(
      "Gebruik een nieuwe carrière voor een nieuwe dataset. Lopende carrières blijven intact.",
    );
  const validated = parseDataset(JSON.stringify(data), "json");
  for (const c of w.clubs) {
    const roster = validated.players.filter((p) => p.club === c.id);
    if (
      roster.length < 18 ||
      roster.filter((p) => p.position === "GK").length < 2
    )
      throw new Error(
        `${c.name}: minimaal 18 spelers en 2 keepers vereist. Gebruik club-ID ${c.id}.`,
      );
  }
  if (validated.players.some((p) => !w.clubs.some((c) => c.id === p.club)))
    throw new Error("Onbekende club-ID. Download eerst de mappings.");
  const n = structuredClone(w);
  n.players = validated.players.map((p, i) => {
    const random = rng(hash(p.externalId));
    const generated = makePlayer(
      `licensed:${p.externalId}`,
      p.club,
      (i % 100) + 1,
      p.ability || 60,
      random,
      n.season,
    );
    return {
      ...generated,
      ...p,
      id: `licensed:${p.externalId}`,
      ability: p.ability || generated.ability,
      externalId: p.externalId,
      youth: false,
      born: p.born || generated.born,
    };
  });
  for (const c of n.clubs) {
    squad(n, c.id).forEach((p, i) => (p.number = i + 1));
    c.tactic.lineup = autoLineup(n, c.id);
    c.tactic.bench = squad(n, c.id)
      .filter((p) => !c.tactic.lineup.includes(p.id))
      .slice(0, 9)
      .map((p) => p.id);
  }
  n.provenance = {
    type: "licensed",
    source: validated.source,
    version: validated.version,
    simulationFields: [
      "attributes",
      "potential",
      "valuation",
      "salary",
      "missing_birthdate",
      "missing_ability",
    ],
  };
  n.revision++;
  return n;
}
