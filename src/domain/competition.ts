import type { Fixture, World, Standing } from "./model";
export function fixtures(
  ids: string[],
  season: number,
  start: number,
  league = "nl-1",
): Fixture[] {
  const rotation = [...ids];
  if (rotation.length % 2) rotation.push("__bye");
  const half: Fixture[] = [];
  const n = rotation.length;
  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      let home = rotation[i],
        away = rotation[n - 1 - i];
      if ((round + i) % 2) [home, away] = [away, home];
      if (home !== "__bye" && away !== "__bye")
        half.push({
          id: `${season}:${league}:${round}:${i}`,
          season,
          league,
          round,
          day: start + 4 + round * 7,
          home,
          away,
        });
    }
    rotation.splice(1, 0, rotation.pop()!);
  }
  return [
    ...half,
    ...half.map((f) => ({
      ...f,
      id: f.id + ":return",
      round: f.round + n - 1,
      day: f.day + (n - 1) * 7,
      home: f.away,
      away: f.home,
    })),
  ];
}
export function table(w: World, league: string): Standing[] {
  const rows = new Map(
    w.clubs
      .filter((c) => c.league === league)
      .map((c) => [
        c.id,
        {
          club: c.id,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          points: 0,
        },
      ]),
  );
  for (const f of w.fixtures) {
    if (f.league !== league || f.cup || f.season !== w.season || !f.result)
      continue;
    const a = rows.get(f.home),
      b = rows.get(f.away);
    if (!a || !b) continue;
    const { home: h, away: v } = f.result;
    a.played++;
    b.played++;
    a.gf += h;
    a.ga += v;
    b.gf += v;
    b.ga += h;
    if (h > v) {
      a.won++;
      b.lost++;
      a.points += 3;
    } else if (v > h) {
      b.won++;
      a.lost++;
      b.points += 3;
    } else {
      a.drawn++;
      b.drawn++;
      a.points++;
      b.points++;
    }
  }
  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.gf - b.ga - (a.gf - a.ga) ||
      b.gf - a.gf ||
      a.club.localeCompare(b.club),
  );
}
export function cupDraw(w: World, ids: string[], round = 0): Fixture[] {
  return ids.reduce<Fixture[]>((out, home, i) => {
    if (i % 2 === 0 && ids[i + 1])
      out.push({
        id: `${w.season}:cup:${round}:${i}`,
        league: "cup",
        cup: true,
        season: w.season,
        round,
        day: w.seasonStart + 8 + round * 21,
        home,
        away: ids[i + 1],
      });
    return out;
  }, []);
}
