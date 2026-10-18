import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { createWorld } from "../src/domain/world";
import {
  saveWorld,
  loadWorld,
  listSaves,
  parseSave,
  exportSave,
  deleteSave,
} from "../src/persistence/saves";
it("roundtrips a career with backup and rejects stale overwrites", async () => {
  const w = createWorld("Test", 0, 334);
  await saveWorld(w);
  expect(await loadWorld(w.id)).toEqual(w);
  const n = { ...w, revision: 1, day: 1 };
  await saveWorld(n);
  expect(await loadWorld(w.id, true)).toEqual({ ...w, revision: 2 });
  await expect(saveWorld(w)).rejects.toThrow();
  expect((await listSaves()).some((s) => s.id === w.id)).toBe(true);
  await deleteSave(w.id);
});
it("rejects corruption and unsupported save versions", async () => {
  const w = createWorld("Test", 0, 44);
  expect(await parseSave(await exportSave(w))).toEqual(w);
  await expect(parseSave('{"schema":9}')).rejects.toThrow();
  const e = JSON.parse(await exportSave(w));
  e.world.manager = "tampered";
  await expect(parseSave(JSON.stringify(e))).rejects.toThrow();
});
it("rejects valid-checksum files with malformed nested fields", async () => {
  const w = createWorld("Bad fields", 0, 9);
  (w as unknown as { messages: unknown }).messages = "invalid";
  await expect(exportSave(w)).rejects.toThrow();
});
it("refuses two different saves at the same revision", async () => {
  const w = createWorld("Two tabs", 0, 778);
  await saveWorld(w);
  await expect(saveWorld({ ...w, manager: "Another tab" })).rejects.toThrow();
  await deleteSave(w.id);
});
it("rejects missing active match references and out-of-bounds replay commands", async () => {
  const w = createWorld("Broken match", 0, 779);
  w.activeMatch = { fixture: "missing", commands: [] };
  await expect(exportSave(w)).rejects.toThrow();
  w.activeMatch = {
    fixture: w.fixtures[0].id,
    commands: [{ time: 1e12, type: "tactic", tactic: { press: 90 } }],
  };
  await expect(exportSave(w)).rejects.toThrow();
});
