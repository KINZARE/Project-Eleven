import { it, expect } from "vitest";
import { createWorld, squad, autoLineup } from "../src/domain/world";
import { prepareMatchDay } from "../src/domain/emergency";
import { validateWorld } from "../src/domain/validation";
it("allows an opponent to continue when both goalkeepers are unavailable", () => {
  const w = createWorld("Emergency", 0, 12);
  for (const p of squad(w, "club-1"))
    if (p.position === "GK") p.injuredUntil = 100;
  const n = prepareMatchDay(w);
  const ids = autoLineup(n, "club-1");
  expect(ids).toHaveLength(11);
  expect(n.players.find((p) => p.id === ids[0])?.position).toBe("GK");
  expect(prepareMatchDay(n)).toEqual(n);
  expect(validateWorld(n)).toEqual([]);
});
