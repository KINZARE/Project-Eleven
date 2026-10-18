import { it, expect } from "vitest";
import { parseDataset, applyDataset } from "../src/domain/import";
import { createWorld } from "../src/domain/world";
it("reports duplicates and never installs a partial roster", () => {
  const w = createWorld("Test", 0, 1);
  expect(() =>
    parseDataset(
      JSON.stringify({
        source: "Licensed source",
        players: [
          {
            externalId: "a",
            name: "Real Player",
            club: "club-0",
            position: "MID",
          },
          {
            externalId: "a",
            name: "Duplicate",
            club: "club-0",
            position: "MID",
          },
        ],
      }),
      "json",
    ),
  ).toThrow();
  expect(() =>
    applyDataset(w, { source: "License", version: "1", players: [] }),
  ).toThrow();
});
it("accepts CSV quoting and preserves canonical external IDs", () => {
  const d = parseDataset(
    'externalId,name,club,position,born\n123,"Name, Last",club-0,MID,2001-01-01',
    "csv",
  );
  expect(d.players[0].name).toBe("Name, Last");
  expect(d.players[0].externalId).toBe("123");
});
