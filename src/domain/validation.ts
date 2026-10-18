import type { World } from "./model";
import { worldSchema } from "./schema";
export function validateWorld(w: World): string[] {
  const errors: string[] = [];
  const shape = worldSchema.safeParse(w);
  if (!shape.success)
    return ["Ongeldige spelstructuur: " + shape.error.issues[0].path.join(".")];
  if (w.activeMatch) {
    const active = w.fixtures.find((f) => f.id === w.activeMatch!.fixture);
    if (
      !active ||
      active.result ||
      active.season !== w.season ||
      ![active.home, active.away].includes(w.club)
    )
      errors.push("Ongeldige actieve wedstrijd.");
    let previous = 0;
    for (const command of w.activeMatch.commands) {
      if (command.time < previous || command.time > 7800)
        errors.push("Ongeldige wedstrijdcheckpoint.");
      previous = command.time;
    }
    if ((w.activeMatch.time || 0) > 7800)
      errors.push("Ongeldige wedstrijdtijd.");
  }
  if (w.schema !== 1) errors.push("Onbekende saveversie.");
  if (!w.clubs.some((c) => c.id === w.club))
    errors.push("Managerclub ontbreekt.");
  for (const key of ["players", "clubs", "fixtures"] as const) {
    const items = w[key];
    if (new Set(items.map((x) => x.id)).size !== items.length)
      errors.push(`Dubbele identifiers: ${key}`);
  }
  for (const p of w.players) {
    if (p.club && !w.clubs.some((c) => c.id === p.club))
      errors.push(`Club ontbreekt voor ${p.id}`);
    if (p.owner && !w.clubs.some((c) => c.id === p.owner))
      errors.push(`Eigenaar ontbreekt voor ${p.id}`);
    if (
      !Number.isFinite(p.ability) ||
      p.ability < 0 ||
      p.ability > 100 ||
      p.wage < 0 ||
      !Number.isFinite(p.wage)
    )
      errors.push(`Ongeldige speler: ${p.id}`);
  }
  for (const c of w.clubs) {
    const numbers = w.players
      .filter((p) => p.club === c.id)
      .map((p) => p.number);
    if (new Set(numbers).size !== numbers.length)
      errors.push(`Dubbele rugnummers: ${c.id}`);
    const total =
      c.openingBalance +
      w.ledger.filter((t) => t.club === c.id).reduce((s, t) => s + t.amount, 0);
    if (total !== c.balance) errors.push(`Grootboek sluit niet aan: ${c.id}`);
  }
  for (const f of w.fixtures) {
    if (
      f.home === f.away ||
      !w.clubs.some((c) => c.id === f.home) ||
      !w.clubs.some((c) => c.id === f.away)
    )
      errors.push(`Ongeldige wedstrijd: ${f.id}`);
  }
  return errors;
}
export function assertLineup(w: World, club: string) {
  const c = w.clubs.find((c) => c.id === club);
  if (!c) throw new Error("Club ontbreekt.");
  if (c.tactic.lineup.length !== 11 || new Set(c.tactic.lineup).size !== 11)
    throw new Error("Selecteer elf verschillende spelers.");
  const players = c.tactic.lineup.map((id) =>
    w.players.find((p) => p.id === id),
  );
  if (
    players.some(
      (p) =>
        !p ||
        p.club !== club ||
        p.youth ||
        p.injuredUntil > w.day ||
        p.suspended > 0 ||
        p.fitness < 25,
    )
  )
    throw new Error("Je opstelling bevat een niet-inzetbare speler.");
  if (players[0]?.position !== "GK")
    throw new Error("Selecteer een keeper op de eerste positie.");
  if (c.tactic.bench.some((id) => c.tactic.lineup.includes(id)))
    throw new Error("Een speler staat zowel in de basis als op de bank.");
}
