import { prepareMatchDay } from "./emergency";
import { assertLineup } from "./validation";
import { type World, type Result, rng, hash, clamp } from "./model";
import { autoLineup, squad, makePlayer, eligible } from "./world";
import { fixtures, table, cupDraw } from "./competition";
import { edit, note, money, applyTraining, transferOpen } from "./management";
export function due(w: World) {
  return w.fixtures.filter(
    (f) => f.season === w.season && !f.result && f.day <= w.day,
  );
}
export function nextFixture(w: World, club = w.club) {
  return w.fixtures
    .filter(
      (f) =>
        f.season === w.season &&
        !f.result &&
        (f.home === club || f.away === club),
    )
    .sort((a, b) => a.day - b.day)[0];
}
function daily(n: World) {
  applyTraining(n);
  for (const c of n.clubs) {
    if (c.investment && c.investment.ready <= n.day) {
      c[c.investment.type]++;
      c.investment = undefined;
      if (c.id === n.club)
        note(
          n,
          "Uitbreiding gereed",
          "De nieuwe faciliteiten zijn beschikbaar.",
          "finances",
        );
    }
    if (n.day % 7 === 0) {
      const wages =
        squad(n, c.id).reduce((s, p) => s + p.wage, 0) +
        n.staff.filter((s) => s.club === c.id).reduce((s, x) => s + x.wage, 0);
      money(
        n,
        c.id,
        -wages,
        "wages",
        "Wekelijkse salarissen",
        `${c.id}:${n.day}:wages`,
      );
      money(
        n,
        c.id,
        c.reputation * 2200,
        "sponsor",
        "Wekelijkse sponsorbijdrage",
        `${c.id}:${n.day}:sponsor`,
      );
      money(
        n,
        c.id,
        -10000 - c.academy * 3000 - c.training * 3000,
        "operations",
        "Faciliteiten en exploitatie",
        `${c.id}:${n.day}:operations`,
      );
    }
    if (c.id !== n.club) {
      c.tactic.style =
        c.profile === "youth"
          ? "possession"
          : c.profile === "seller"
            ? "counter"
            : c.profile === "contender"
              ? "high_press"
              : "balanced";
      c.tactic.lineup = autoLineup(n, c.id);
      c.tactic.bench = squad(n, c.id)
        .filter((p) => eligible(p, n) && !c.tactic.lineup.includes(p.id))
        .slice(0, 9)
        .map((p) => p.id);
    }
  }
  for (const r of n.scouting.filter(
    (r) => r.ready === n.day && r.club === n.club,
  )) {
    const p = n.players.find((p) => p.id === r.player);
    if (p)
      note(
        n,
        "Scoutingrapport gereed",
        `${p.name} is beoordeeld. Bekijk het rapport.`,
        "scouting",
      );
  }
  for (const p of n.players) {
    if (p.injuredUntil === n.day && p.club === n.club)
      note(n, "Speler hersteld", `${p.name} kan weer spelen.`, "squad");
  }
  if (n.day % 14 === 0 && transferOpen(n)) aiMarket(n);
  if (n.day % 28 === 0) {
    const club = n.clubs.find((c) => c.id === n.club)!;
    const rank = table(n, club.league).findIndex((r) => r.club === club.id) + 1;
    n.confidence = clamp(
      n.confidence +
        (rank <= club.target ? 2 : -3) * (n.difficulty === "hard" ? 1.5 : 1) -
        (club.balance < 0 ? 5 : 0),
    );
    note(
      n,
      "Bestuursupdate",
      `Het vertrouwen is ${Math.round(n.confidence)}%. Bekijk je resultaten en financiële positie.`,
      "manager",
    );
    if (n.confidence < 15 && n.employed) {
      n.employed = false;
      note(
        n,
        "Het bestuur beëindigt je contract",
        "Je carrière blijft bewaard. Kies een nieuwe club via Manager.",
        "manager",
      );
    }
  }
}
function aiMarket(n: World) {
  const random = rng(hash(`${n.seed}:market:${n.day}`));
  for (const seller of n.clubs) {
    if (
      seller.id !== n.club &&
      squad(n, seller.id).filter((p) => !p.youth).length > 20
    ) {
      const candidate = squad(n, seller.id)
        .filter(
          (p) =>
            !p.youth &&
            !p.owner &&
            p.position !== "GK" &&
            !p.id.startsWith("emergency:"),
        )
        .sort((a, b) => a.ability - b.ability)[0];
      if (candidate) candidate.listed = true;
    }
    const candidates = squad(n, seller.id).filter(
      (p) => !p.youth && !p.owner && (p.listed || p.loanListed),
    );
    if (squad(n, seller.id).filter((p) => !p.youth).length <= 18) continue;
    const p = candidates[Math.floor(random() * candidates.length)];
    if (!p) continue;
    const buyer = n.clubs.filter(
      (c) =>
        c.id !== seller.id &&
        c.id !== n.club &&
        c.balance > p.value * 1.1 &&
        squad(n, c.id).length < 36 &&
        squad(n, c.id).reduce((s, x) => s + x.wage, 0) + p.wage < c.wageBudget,
    )[Math.floor(random() * 4)];
    if (!buyer) continue;
    const fee = Math.round(p.value * (0.95 + random() * 0.2));
    if (n.transfers.some((t) => t.player === p.id && t.status === "accepted"))
      continue;
    const id = `ai:${n.day}:${p.id}`;
    if (seller.id === n.club) {
      n.transfers.unshift({
        id,
        player: p.id,
        from: seller.id,
        to: buyer.id,
        fee,
        wage: p.wage,
        years: 3,
        type: p.loanListed ? "loan" : "buy",
        status: "accepted",
        replyDay: n.day,
      });
      note(
        n,
        "Bod ontvangen",
        `${buyer.name} wil ${p.name} overnemen. Beoordeel het bod.`,
        "transfers",
      );
    } else {
      money(n, buyer.id, -fee, "transfer", `Aankoop ${p.name}`, id + ":debit");
      money(n, seller.id, fee, "transfer", `Verkoop ${p.name}`, id + ":credit");
      p.club = buyer.id;
      const numbers = new Set(
        squad(n, buyer.id)
          .filter((x) => x.id !== p.id)
          .map((x) => x.number),
      );
      p.number =
        Array.from({ length: 999 }, (_, i) => i + 1).find(
          (x) => !numbers.has(x),
        ) || 999;
      p.contractUntil = n.season + 3;
      n.transfers.unshift({
        id,
        player: p.id,
        from: seller.id,
        to: buyer.id,
        fee,
        wage: p.wage,
        years: 3,
        type: "buy",
        status: "completed",
        replyDay: n.day,
      });
    }
  }
}
export function advanceDay(w: World, command: string): World {
  if (w.processed.includes(command)) return w;
  if (due(w).length)
    throw new Error("Rond eerst de wedstrijden van vandaag af.");
  const advanced = edit(w, (n) => {
    n.day++;
    n.processed.push(command);
    daily(n);
  });
  return due(advanced).length ? prepareMatchDay(advanced) : advanced;
}
export function beginMatch(w: World, id: string): World {
  const f = w.fixtures.find((f) => f.id === id);
  if (!f || f.result || f.day > w.day || ![f.home, f.away].includes(w.club))
    throw new Error("Deze wedstrijd kan nog niet worden gestart.");
  const prepared = prepareMatchDay(w);
  assertLineup(prepared, prepared.club);
  return edit(prepared, (n) => {
    n.activeMatch = { fixture: id, commands: [], time: 0 };
  });
}
export function finalizeMatch(w: World, id: string, result: Result): World {
  const f = w.fixtures.find((f) => f.id === id);
  if (!f) throw new Error("Wedstrijd niet gevonden.");
  if (f.result) return w;
  if (
    !Number.isInteger(result.home) ||
    !Number.isInteger(result.away) ||
    result.home < 0 ||
    result.away < 0 ||
    result.home > 100 ||
    result.away > 100
  )
    throw new Error("Ongeldige wedstrijduitslag.");
  return edit(w, (n) => {
    const fix = n.fixtures.find((x) => x.id === id)!;
    fix.result = structuredClone(result);
    if (fix.cup) {
      if (result.home === result.away && !result.penalties)
        throw new Error("De bekerwedstrijd heeft een winnaar nodig.");
      fix.winner =
        result.home === result.away
          ? result.penalties![0] > result.penalties![1]
            ? fix.home
            : fix.away
          : result.home > result.away
            ? fix.home
            : fix.away;
    }
    const random = rng(result.seed);
    for (const cid of [fix.home, fix.away]) {
      const club = n.clubs.find((c) => c.id === cid)!;
      const won =
        cid === fix.home
          ? result.home - result.away
          : result.away - result.home;
      for (const p of squad(n, cid)) {
        if (p.suspended > 0) p.suspended--;
        if (
          !(result.participants
            ? result.participants[cid === fix.home ? "home" : "away"].includes(
                p.id,
              )
            : club.tactic.lineup.includes(p.id)) &&
          !result.events.some(
            (e) => e.type === "substitution" && e.playerId === p.id,
          )
        )
          continue;
        p.appearances++;
        p.fitness = clamp(p.fitness - 17 - random() * 8);
        p.morale = clamp(p.morale + (won > 0 ? 7 : won < 0 ? -5 : 0));
        p.form = clamp(
          p.form * 0.75 + (won > 0 ? 7.4 : won < 0 ? 5.8 : 6.5) * 0.25,
          1,
          10,
        );
      }
      for (const e of result.events.filter(
        (e) => e.side === (cid === fix.home ? "home" : "away"),
      )) {
        const p = n.players.find(
          (p) =>
            p.club === cid &&
            (e.playerId ? p.id === e.playerId : p.name === e.player),
        );
        if (!p) continue;
        if (e.type === "goal") p.goals++;
        if (e.type === "red_card") p.suspended = Math.max(p.suspended, 2);
        if (e.type === "injury") {
          p.injuredUntil = n.day + 4 + Math.floor(random() * 21);
          if (cid === n.club)
            note(
              n,
              "Blessure",
              `${p.name} is voorlopig niet inzetbaar.`,
              "squad",
            );
        }
      }
    }
    money(
      n,
      fix.home,
      80000 + n.clubs.find((c) => c.id === fix.home)!.reputation * 2000,
      "matchday",
      "Kaartverkoop en wedstrijddag",
      `${id}:revenue`,
    );
    if ([fix.home, fix.away].includes(n.club)) {
      const diff =
        n.club === fix.home
          ? result.home - result.away
          : result.away - result.home;
      n.confidence = clamp(n.confidence + (diff > 0 ? 3 : diff < 0 ? -3 : 0));
      note(
        n,
        "Wedstrijd afgelopen",
        `${n.clubs.find((c) => c.id === fix.home)!.name} ${result.home}–${result.away} ${n.clubs.find((c) => c.id === fix.away)!.name}`,
        "competition",
      );
    }
    const cup = n.fixtures.filter(
      (f) => f.cup && f.season === n.season && f.round === fix.round,
    );
    if (fix.cup && cup.every((f) => f.result)) {
      const winners = cup.map((f) => f.winner!);
      if (winners.length > 1) {
        const next = cupDraw(n, winners, fix.round + 1).map((f) => ({
          ...f,
          day: Math.max(f.day, n.day + 7),
        }));
        for (const x of next)
          if (!n.fixtures.some((f) => f.id === x.id)) n.fixtures.push(x);
      } else {
        const winner = winners[0];
        money(
          n,
          winner,
          1000000,
          "prize",
          "Bekerwinst",
          `${n.season}:cup-prize`,
        );
        if (winner === n.club)
          n.trophies.push({ season: n.season, name: "Nationale Beker" });
        note(
          n,
          "Bekerwinnaar bekend",
          `${n.clubs.find((c) => c.id === winner)!.name} wint de Nationale Beker.`,
          "competition",
        );
      }
    }
    n.activeMatch = undefined;
  });
}
export function nextSeason(w: World, command: string): World {
  if (w.processed.includes(command)) return w;
  if (w.fixtures.some((f) => f.season === w.season && !f.result))
    throw new Error("Er staan nog wedstrijden open.");
  return edit(w, (n) => {
    const rankings = new Map(n.leagues.map((l) => [l.id, table(n, l.id)]));
    for (const l of n.leagues) {
      const ranking = rankings.get(l.id)!;
      n.history.push({
        season: n.season,
        league: l.id,
        champion: ranking[0].club,
        standings: ranking.map((r) => ({
          club: r.club,
          points: r.points,
          gf: r.gf,
          ga: r.ga,
        })),
      });
      const pos = ranking.findIndex((r) => r.club === n.club);
      if (pos >= 0) {
        n.managerHistory.push({
          season: n.season,
          club: n.club,
          position: pos + 1,
        });
        n.reputation = clamp(n.reputation + (pos < 3 ? 8 : 2));
        if (pos === 0) n.trophies.push({ season: n.season, name: l.name });
      }
      ranking.forEach((r, i) =>
        money(
          n,
          r.club,
          (ranking.length - i) * 200000,
          "prize",
          `Eindklassering ${i + 1}`,
          `${n.season}:${l.id}:${r.club}:prize`,
        ),
      );
    }
    for (const l of n.leagues) {
      const rank = rankings.get(l.id)!;
      if (l.parent)
        for (const r of rank.slice(0, l.promotion))
          n.clubs.find((c) => c.id === r.club)!.league = l.parent;
      if (l.child)
        for (const r of rank.slice(-l.relegation))
          n.clubs.find((c) => c.id === r.club)!.league = l.child;
    }
    const end = n.seasonStart + 365;
    while (n.day < end) {
      n.day++;
      daily(n);
    }
    n.season++;
    n.seasonStart = n.day;
    const random = rng(hash(`${n.seed}:youth:${n.season}`));
    for (const p of n.players) {
      p.history.push({
        season: n.season - 1,
        club: p.club || "free",
        goals: p.goals,
        appearances: p.appearances,
      });
      p.goals = 0;
      p.assists = 0;
      p.appearances = 0;
      p.suspended = 0;
      if (p.owner && p.loanUntil! <= n.season) {
        p.club = p.owner;
        const used = new Set(
          n.players
            .filter((x) => x.club === p.club && x.id !== p.id)
            .map((x) => x.number),
        );
        p.number =
          Array.from({ length: 999 }, (_, i) => i + 1).find(
            (x) => !used.has(x),
          ) || 999;
        p.owner = undefined;
        p.loanUntil = undefined;
      }
      if (p.contractUntil <= n.season) {
        if (p.club === n.club) {
          note(
            n,
            "Contract afgelopen",
            `${p.name} heeft de club transfervrij verlaten.`,
            "squad",
          );
          p.club = null;
          p.wage = 0;
        } else if (p.club) {
          p.contractUntil = n.season + 2;
          p.wage = Math.round(p.wage * 1.02);
        }
      }
      p.fitness = 95;
    }
    for (const c of n.clubs) {
      for (let i = 0; i < 3; i++) {
        const used = new Set(squad(n, c.id).map((p) => p.number));
        const number =
          Array.from({ length: 999 }, (_, j) => j + 1).find(
            (j) => !used.has(j),
          ) || 999;
        n.players.push(
          makePlayer(
            `${c.id}:y${n.season}:${i}`,
            c.id,
            number,
            35 + c.academy * 3 + random() * 10,
            random,
            n.season,
            true,
          ),
        );
      }
      if (c.id !== n.club) {
        c.tactic.style =
          c.profile === "youth"
            ? "possession"
            : c.profile === "seller"
              ? "counter"
              : c.profile === "contender"
                ? "high_press"
                : "balanced";
        for (const p of squad(n, c.id)
          .filter((p) => p.youth && p.ability > 45)
          .slice(0, 3))
          p.youth = false;
      }
      c.tactic.lineup = autoLineup(n, c.id);
      c.tactic.bench = squad(n, c.id)
        .filter((p) => eligible(p, n) && !c.tactic.lineup.includes(p.id))
        .slice(0, 9)
        .map((p) => p.id);
    }
    n.fixtures = [
      ...n.fixtures,
      ...n.leagues.flatMap((l) =>
        fixtures(
          n.clubs.filter((c) => c.league === l.id).map((c) => c.id),
          n.season,
          n.day,
          l.id,
        ),
      ),
      ...cupDraw(
        n,
        n.clubs.map((c) => c.id),
      ),
    ];
    n.processed.push(command);
    note(
      n,
      "Een nieuw seizoen",
      "Het speelschema staat klaar. Bekijk de jeugdinstroom en je contracten.",
      "home",
    );
  });
}
export function takeJob(w: World, club: string) {
  if (w.employed) throw new Error("Je hebt nog een contract.");
  if (!w.clubs.some((c) => c.id === club))
    throw new Error("Club niet gevonden.");
  return edit(w, (n) => {
    n.club = club;
    n.employed = true;
    n.confidence = 60;
    note(n, "Nieuwe uitdaging", "Je bent aangesteld als manager.", "home");
  });
}
