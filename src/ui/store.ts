"use client";
import { create } from "zustand";
import type { World } from "../domain/model";
import { saveWorld, loadWorld, listSaves } from "../persistence/saves";
interface State {
  world: World | null;
  screen: string;
  busy: boolean;
  error: string | null;
  notice: string | null;
  ready: boolean;
  slots: Awaited<ReturnType<typeof listSaves>>;
  setScreen: (screen: string) => void;
  boot: () => Promise<void>;
  install: (w: World) => Promise<void>;
  change: (fn: (w: World) => World) => Promise<void>;
  resume: (id: string, backup?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
  fail: (s: string) => void;
}
export const useGame = create<State>((set, get) => ({
  world: null,
  screen: "home",
  busy: false,
  error: null,
  notice: null,
  ready: false,
  slots: [],
  setScreen: (screen) =>
    set({
      screen:
        get().world?.activeMatch && !["match", "saves"].includes(screen)
          ? "match"
          : screen,
    }),
  fail: (error) => set({ error, busy: false }),
  clear: () => set({ error: null, notice: null }),
  refresh: async () => set({ slots: await listSaves() }),
  boot: async () => {
    try {
      set({ slots: await listSaves(), ready: true });
    } catch {
      set({
        ready: true,
        error:
          "Lokale opslag is niet beschikbaar. Sta opslag toe in je browser en probeer opnieuw.",
      });
    }
  },
  install: async (w) => {
    if (get().busy) return;
    set({ busy: true, error: null });
    try {
      await saveWorld(w);
      set({ world: w, busy: false, screen: "home" });
      await get().refresh();
    } catch (e) {
      set({
        busy: false,
        error:
          e instanceof Error
            ? e.message
            : "Opslaan mislukt. Controleer vrije opslagruimte.",
      });
      throw e;
    }
  },
  change: async (fn) => {
    if (get().busy) throw new Error("Wacht tot de vorige actie is opgeslagen.");
    const old = get().world;
    if (!old) return;
    set({ busy: true, error: null });
    try {
      const n = fn(old);
      await saveWorld(n);
      set({ world: n, busy: false });
    } catch (e) {
      set({
        busy: false,
        error:
          e instanceof Error
            ? e.message
            : "Opslaan mislukt. Je vorige save blijft bewaard.",
      });
      throw e;
    }
  },
  resume: async (id, backup = false) => {
    set({ busy: true, error: null });
    try {
      const world = await loadWorld(id, backup);
      if (backup) await saveWorld(world);
      set({ world, busy: false, screen: world.activeMatch ? "match" : "home" });
    } catch (e) {
      set({
        busy: false,
        error:
          e instanceof Error
            ? e.message
            : "Openen mislukt. Gebruik Herstellen bij deze save.",
      });
    }
  },
}));
