import type { World } from "./model";
import { rng, hash } from "./model";
import { makePlayer, squad, eligible } from "./world";
import { note } from "./management";
/** All clubs may register academy cover when injuries would prevent a fixture. */
export function prepareMatchDay(w: World): World {
  let changed = false;
  const n = structuredClone(w);
  for (const club of n.clubs) {
    let available = squad(n, club.id).filter((p) => eligible(p, n));
    const needKeeper = !available.some((p) => p.position === "GK");
    const count = Math.max(needKeeper ? 1 : 0, 12 - available.length);
    if (count <= 0) continue;
    for (let i = 0; i < count; i++) {
      const id = `emergency:${n.season}:${club.id}:${n.day}:${i}`;
      if (n.players.some((p) => p.id === id)) continue;
      const numbers = new Set(squad(n, club.id).map((p) => p.number));
      const number = Array.from({ length: 999 }, (_, i) => i + 1).find(
        (i) => !numbers.has(i),
      )!;
      const p = makePlayer(
        id,
        club.id,
        number,
        32 + club.academy * 2,
        rng(hash(id)),
        n.season,
        true,
      );
      p.position = needKeeper && i === 0 ? "GK" : i % 2 ? "MID" : "DEF";
      p.attributes.goalkeeping = p.position === "GK" ? p.ability : 10;
      p.youth = false;
      p.value = 0;
      p.wage = 500;
      p.contractUntil = n.season + 1;
      p.born = `${n.season - 18}-01-01`;
      n.players.push(p);
      changed = true;
      if (club.id === n.club)
        note(
          n,
          "Noodaanvulling uit de academie",
          `${p.name} is tijdelijk speelgerechtigd zodat de wedstrijd door kan gaan. Deze noodspeler kan dit seizoen niet worden verkocht.`,
          "squad",
        );
    }
    available = squad(n, club.id).filter((p) => eligible(p, n));
  }
  if (changed) {
    n.revision++;
    return n;
  }
  return w;
}
