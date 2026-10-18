// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { it, expect, beforeAll, afterEach } from "vitest";
import {
  render,
  screen,
  within,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/ui/App";
import { useGame } from "../src/ui/store";
import { listSaves } from "../src/persistence/saves";
beforeAll(() => {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);
it("creates a career through the UI, edits a player training focus, and reloads its persisted save", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "Begin je managerscarrière" });
  await user.type(screen.getByLabelText("Jouw naam"), "UI Manager");
  await user.click(screen.getByRole("button", { name: /Begin carrière/ }));
  await screen.findByRole("heading", { name: "Goed bezig, UI." });
  const nav = within(
    screen.getByRole("navigation", { name: "Hoofdnavigatie mobiel" }),
  );
  await user.click(nav.getByRole("button", { name: "Selectie" }));
  await screen.findByRole("heading", { name: "Jouw selectie" });
  const first = useGame
    .getState()
    .world!.players.find(
      (p) => p.club === useGame.getState().world!.club && !p.youth,
    )!;
  await user.type(
    screen.getByRole("textbox", { name: "Speler zoeken" }),
    first.name,
  );
  await user.click(
    screen.getAllByRole("button", { name: new RegExp(first.name) })[0],
  );
  const focus = await screen.findByLabelText("Trainingsfocus");
  await user.selectOptions(focus, "passing");
  await waitFor(() =>
    expect(
      useGame.getState().world!.players.find((p) => p.id === first.id)!.focus,
    ).toBe("passing"),
  );
  await waitFor(() => expect(useGame.getState().busy).toBe(false));
  const id = useGame.getState().world!.id;
  expect((await listSaves()).some((s) => s.id === id)).toBe(true);
  await useGame.getState().resume(id);
  expect(
    useGame.getState().world!.players.find((p) => p.id === first.id)!.focus,
  ).toBe("passing");
});
