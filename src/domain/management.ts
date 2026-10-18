import { type World, type Focus, integer, hash, rng, clamp } from "./model";
import { squad } from "./world";
export function edit(w: World, fn: (n: World) => void): World {
  const n = structuredClone(w);
  fn(n);
  n.revision++;
  return n;
}
export function note(w: World, title: string, body: string, screen = "home") {
  w.messages.unshift({
    id: `m-${w.revision}-${w.messages.length}-${w.day}`,
    day: w.day,
    title,
    body,
    screen,
    read: false,
  });
  if (w.messages.length > 300) w.messages.length = 300;
}
export function money(
  w: World,
  club: string,
  amount: number,
  category: string,
  description: string,
  id?: string,
) {
  integer(Math.abs(amount));
  const key = id || `tx-${w.revision}-${w.ledger.length}-${w.day}`;
  if (w.ledger.some((t) => t.id === key)) return;
  const c = w.clubs.find((c) => c.id === club);
  if (!c) throw new Error("Club niet gevonden.");
  c.balance += amount;
  w.ledger.push({ id: key, club, amount, category, description, day: w.day });
}
export function transferOpen(w: World) {
  const day = (w.day - w.seasonStart) % 365;
  return day <= 60 || (day >= 184 && day <= 214);
}
export function offerTransfer(
  w: World,
  player: string,
  fee: number,
  wage: number,
  years: number,
  command: string,
  type: "buy" | "loan" = "buy",
): World {
  integer(fee);
  integer(wage, 1);
  integer(years, 1, 5);
  if (w.processed.includes(command)) return w;
  const p = w.players.find((p) => p.id === player),
    buyer = w.clubs.find((c) => c.id === w.club)!;
  if (!w.employed) throw new Error("Neem eerst een baan aan.");
  if (
    !p ||
    p.id.startsWith("emergency:") ||
    p.club === w.club ||
    p.youth ||
    p.owner
  )
    throw new Error("Deze speler is niet beschikbaar.");
  if (!transferOpen(w)) throw new Error("De transferperiode is gesloten.");
  if (fee > buyer.balance) throw new Error("Onvoldoende transferbudget.");
  if (
    squad(w, w.club).reduce((s, p) => s + p.wage, 0) + wage >
    buyer.wageBudget
  )
    throw new Error("Dit salaris past niet binnen het loonbudget.");
  if (
    w.transfers.some(
      (t) => t.player === player && ["pending", "accepted"].includes(t.status),
    )
  )
    throw new Error("Er loopt al een bod op deze speler.");
  return edit(w, (n) => {
    const seller = p.club ? n.clubs.find((c) => c.id === p.club) : null;
    const enoughSquad =
      !seller || squad(n, seller.id).filter((p) => !p.youth).length > 18;
    const accepted =
      enoughSquad &&
      fee >=
        (seller ? (type === "loan" ? p.value * 0.08 : p.value * 1.05) : 0) &&
      wage >= p.wage;
    const bid = {
      id: command,
      player,
      from: p.club,
      to: w.club,
      fee,
      wage,
      years,
      type,
      status: (accepted ? "accepted" : "rejected") as "accepted" | "rejected",
      replyDay: n.day + 1,
    };
    n.transfers.unshift(bid);
    n.processed.push(command);
    note(
      n,
      accepted ? "Bod geaccepteerd" : "Bod afgewezen",
      accepted
        ? `${p.name}: club en speler gaan akkoord. Bevestig om de overgang af te ronden.`
        : `${p.name}: het bod of salaris is onvoldoende, of de verkopende club houdt te weinig spelers over.`,
      "transfers",
    );
  });
}
export function acceptTransfer(w: World, id: string): World {
  const bid = w.transfers.find((t) => t.id === id);
  if (!bid) throw new Error("Bod niet gevonden.");
  if (bid.status === "completed") return w;
  if (bid.status !== "accepted")
    throw new Error("Dit bod is niet geaccepteerd.");
  const p = w.players.find((p) => p.id === bid.player)!;
  const c = w.clubs.find((c) => c.id === bid.to)!;
  if (p.club !== bid.from)
    throw new Error(
      "De club van de speler is gewijzigd. Dien opnieuw een bod in.",
    );
  if (!transferOpen(w)) throw new Error("De transferperiode is gesloten.");
  if (c.balance < bid.fee) throw new Error("Het budget is inmiddels te laag.");
  if (squad(w, c.id).reduce((s, p) => s + p.wage, 0) + bid.wage > c.wageBudget)
    throw new Error("Het loonbudget is inmiddels te laag.");
  return edit(w, (n) => {
    const t = n.transfers.find((t) => t.id === id)!,
      player = n.players.find((p) => p.id === t.player)!;
    money(
      n,
      t.to,
      -t.fee,
      "transfer",
      `${t.type === "loan" ? "Huur" : "Aankoop"} ${player.name}`,
      `${id}:debit`,
    );
    if (t.from)
      money(
        n,
        t.from,
        t.fee,
        "transfer",
        `Vertrek ${player.name}`,
        `${id}:credit`,
      );
    if (t.type === "loan") {
      player.owner = t.from || undefined;
      player.loanUntil = n.season + 1;
    } else {
      player.contractUntil = n.season + t.years;
      player.owner = undefined;
      player.loanUntil = undefined;
    }
    player.club = t.to;
    const used = new Set(
      n.players
        .filter((p) => p.club === t.to && p.id !== player.id)
        .map((p) => p.number),
    );
    player.number =
      Array.from({ length: 999 }, (_, i) => i + 1).find(
        (number) => !used.has(number),
      ) || 999;
    player.wage = t.wage;
    player.listed = false;
    player.loanListed = false;
    t.status = "completed";
    for (const club of n.clubs) {
      club.tactic.lineup = club.tactic.lineup.filter(
        (pid) => pid !== player.id,
      );
      club.tactic.bench = club.tactic.bench.filter((pid) => pid !== player.id);
    }
    note(
      n,
      "Transfer afgerond",
      `${player.name} heeft zich bij de selectie aangesloten.`,
      "squad",
    );
  });
}
export function renewContract(
  w: World,
  id: string,
  wage: number,
  years: number,
): World {
  integer(wage, 1);
  integer(years, 1, 5);
  const p = w.players.find((p) => p.id === id);
  if (!p || p.club !== w.club || p.owner)
    throw new Error("Deze speler kun je geen contract aanbieden.");
  if (wage < p.wage * 0.9)
    throw new Error("De speler vraagt minimaal 90% van zijn huidige salaris.");
  const c = w.clubs.find((c) => c.id === w.club)!;
  if (
    squad(w, c.id).reduce((s, x) => s + x.wage, 0) - p.wage + wage >
    c.wageBudget
  )
    throw new Error("Dit contract overschrijdt het loonbudget.");
  return edit(w, (n) => {
    const x = n.players.find((p) => p.id === id)!;
    x.wage = wage;
    x.contractUntil = n.season + years;
    x.morale = clamp(x.morale + 10);
    note(
      n,
      "Contract verlengd",
      `${x.name} tekent tot ${x.contractUntil}.`,
      "squad",
    );
  });
}
export function train(w: World, id: string, focus: Focus): World {
  if (
    !["balanced", "passing", "finishing", "defending", "fitness"].includes(
      focus,
    )
  )
    throw new Error("Ongeldige trainingsfocus.");
  return edit(w, (n) => {
    const p = n.players.find((p) => p.id === id && p.club === w.club);
    if (!p) throw new Error("Speler niet gevonden.");
    p.focus = focus;
  });
}
export function invest(
  w: World,
  type: "academy" | "training" | "scouting",
): World {
  if (!["academy", "training", "scouting"].includes(type))
    throw new Error("Ongeldige investering.");
  const c = w.clubs.find((c) => c.id === w.club)!;
  if (c.investment) throw new Error("Er loopt al een investering.");
  const cost = c[type] * 500000;
  if (c.balance < cost) throw new Error("Onvoldoende saldo.");
  return edit(w, (n) => {
    const club = n.clubs.find((c) => c.id === w.club)!;
    money(n, club.id, -cost, "investment", `Uitbreiding ${type}`);
    club.investment = { type, ready: n.day + 30 };
    note(
      n,
      "Investering gestart",
      "De uitbreiding is over 30 dagen gereed.",
      "finances",
    );
  });
}
export function hire(w: World, id: string): World {
  const s = w.staff.find((s) => s.id === id),
    c = w.clubs.find((c) => c.id === w.club)!;
  if (!s || s.club) throw new Error("Deze medewerker is niet beschikbaar.");
  if (w.staff.filter((s) => s.club === w.club).length >= 8)
    throw new Error("Er kunnen maximaal 8 stafleden bij je club werken.");
  if (c.balance < s.wage * 4)
    throw new Error("Onvoldoende saldo voor de aanstellingskosten.");
  return edit(w, (n) => {
    const s = n.staff.find((s) => s.id === id)!;
    s.club = w.club;
    money(n, w.club, -s.wage * 4, "staff", `Aanstellen ${s.name}`);
  });
}
export function fire(w: World, id: string): World {
  return edit(w, (n) => {
    const s = n.staff.find((s) => s.id === id && s.club === w.club);
    if (!s) throw new Error("Medewerker niet gevonden.");
    const c = n.clubs.find((c) => c.id === w.club)!;
    if (c.balance < s.wage * 4)
      throw new Error("Onvoldoende saldo voor de ontslagvergoeding.");
    money(n, w.club, -s.wage * 4, "staff", `Ontslag ${s.name}`);
    s.club = null;
  });
}
export function scout(w: World, id: string): World {
  if (w.scouting.some((r) => r.player === id && r.club === w.club))
    throw new Error("Deze speler staat al bij je scouting.");
  if (!w.players.some((p) => p.id === id && p.club !== w.club))
    throw new Error("Kies een speler van een andere club.");
  const c = w.clubs.find((c) => c.id === w.club)!;
  if (c.balance < 2500) throw new Error("Onvoldoende saldo.");
  return edit(w, (n) => {
    money(n, w.club, -2500, "scouting", "Scoutingopdracht");
    n.scouting.push({
      id: `report-${id}-${n.day}`,
      player: id,
      ready: n.day + Math.max(2, 8 - c.scouting),
      confidence: clamp(
        55 +
          c.scouting * 8 +
          (n.staff.find((s) => s.club === w.club && s.role === "scout")
            ?.skill || 0) *
            0.2,
      ),
      club: w.club,
    });
    note(
      n,
      "Scout op pad",
      "Je ontvangt een rapport zodra de opdracht klaar is.",
      "scouting",
    );
  });
}
export function promote(w: World, id: string): World {
  return edit(w, (n) => {
    const p = n.players.find((p) => p.id === id && p.club === w.club);
    if (!p || !p.youth) throw new Error("Jeugdspeler niet gevonden.");
    p.youth = false;
    note(
      n,
      "Jeugdspeler doorgeschoven",
      `${p.name} kan vanaf nu geselecteerd worden.`,
      "squad",
    );
  });
}
export function listPlayer(w: World, id: string, loan = false): World {
  return edit(w, (n) => {
    const p = n.players.find((p) => p.id === id && p.club === w.club);
    if (!p || p.owner || p.id.startsWith("emergency:"))
      throw new Error("Speler niet beschikbaar.");
    if (loan) p.loanListed = !p.loanListed;
    else p.listed = !p.listed;
  });
}
export function applyTraining(w: World) {
  const random = rng(hash(`${w.seed}:training:${w.day}`));
  for (const p of w.players) {
    if (!p.club) continue;
    const c = w.clubs.find((c) => c.id === p.club)!;
    const coaches = w.staff
      .filter((s) => s.club === c.id && s.role === "coach")
      .reduce((a, s) => a + s.skill, 0);
    p.fitness = clamp(
      p.fitness + (p.injuredUntil > w.day ? 1 : 3 + c.training * 0.5),
    );
    if (
      w.day % 7 === 0 &&
      p.injuredUntil > w.day &&
      w.staff.some((s) => s.club === c.id && s.role === "physio")
    )
      p.injuredUntil = Math.max(w.day, p.injuredUntil - 1);
    if (w.day % 7 === 0 && p.injuredUntil <= w.day) {
      const youthBonus = p.youth ? 1.6 : 1;
      const growth =
        ((0.025 + c.training * 0.012 + coaches * 0.0002) *
          youthBonus *
          (p.potential - p.ability)) /
        15;
      p.ability = Math.min(p.potential, p.ability + growth);
      const focus =
        p.focus === "fitness"
          ? "stamina"
          : p.focus === "balanced"
            ? "decisions"
            : p.focus;
      if (p.attributes[focus] !== undefined)
        p.attributes[focus] = clamp(p.attributes[focus] + growth);
      p.value = Math.round(p.ability ** 3 * (p.youth ? 2 : 4));
      if (w.day % 28 === 0)
        p.development.push({ day: w.day, ability: p.ability });
      if (random() < 0.008)
        p.injuredUntil = w.day + 3 + Math.floor(random() * 14);
    }
  }
}
