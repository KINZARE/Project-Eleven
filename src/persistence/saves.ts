import Dexie, { type Table } from "dexie";
import type { World } from "../domain/model";
import { validateWorld } from "../domain/validation";
interface Envelope {
  format: "eleven-save";
  version: 1;
  checksum: string;
  world: World;
}
interface Slot {
  id: string;
  name: string;
  updated: number;
  revision: number;
  data: string;
  backup?: string;
}
class SaveDB extends Dexie {
  slots!: Table<Slot, string>;
  constructor() {
    super("project-eleven");
    this.version(1).stores({ slots: "id,updated,revision" });
  }
}
let database: SaveDB;
function db() {
  return database || (database = new SaveDB());
}
async function checksum(s: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(s),
  );
  return [...new Uint8Array(digest)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
export async function exportSave(w: World) {
  const errors = validateWorld(w);
  if (errors.length) throw new Error(errors[0]);
  const envelope: Envelope = {
    format: "eleven-save",
    version: 1,
    checksum: await checksum(JSON.stringify(w)),
    world: w,
  };
  return JSON.stringify(envelope);
}
export async function parseSave(raw: string): Promise<World> {
  if (new TextEncoder().encode(raw).length > 30 * 1024 * 1024)
    throw new Error("Savebestand is te groot (maximaal 30 MB).");
  let data: Envelope;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Het savebestand is geen geldige JSON.");
  }
  if (data?.format !== "eleven-save" || data.version !== 1)
    throw new Error("Niet-ondersteunde saveversie.");
  if (
    !data.world ||
    data.world.schema !== 1 ||
    typeof data.world.manager !== "string" ||
    typeof data.world.id !== "string" ||
    !Array.isArray(data.world.players) ||
    !Array.isArray(data.world.clubs) ||
    !Array.isArray(data.world.fixtures) ||
    !Array.isArray(data.world.ledger)
  )
    throw new Error("Savebestand is onvolledig.");
  if ((await checksum(JSON.stringify(data.world))) !== data.checksum)
    throw new Error("Het savebestand is beschadigd. Herstel de vorige save.");
  let errors: string[];
  try {
    errors = validateWorld(data.world);
  } catch {
    throw new Error("Savebestand bevat ongeldige speldata.");
  }
  if (errors.length) throw new Error(errors[0]);
  return data.world;
}
export async function saveWorld(w: World) {
  const data = await exportSave(w);
  await db().transaction("rw", db().slots, async () => {
    const previous = await db().slots.get(w.id);
    if (
      previous &&
      (previous.revision > w.revision ||
        (previous.revision === w.revision && previous.data !== data))
    )
      throw new Error(
        "Er is een nieuwere save. Herlaad om overschrijven te voorkomen.",
      );
    await db().slots.put({
      id: w.id,
      name: w.name,
      updated: Date.now(),
      revision: w.revision,
      data,
      backup: previous?.data || previous?.backup,
    });
  });
}
export async function loadWorld(id: string, backup = false) {
  const slot = await db().slots.get(id);
  if (!slot) throw new Error("Save niet gevonden.");
  const raw = backup ? slot.backup : slot.data;
  if (!raw) throw new Error("Geen herstelsave beschikbaar.");
  const w = await parseSave(raw);
  if (backup) w.revision = slot.revision + 1;
  return w;
}
export async function listSaves() {
  return (await db().slots.orderBy("updated").reverse().toArray()).map(
    ({ id, name, updated, revision }) => ({ id, name, updated, revision }),
  );
}
export async function deleteSave(id: string) {
  await db().slots.delete(id);
}
