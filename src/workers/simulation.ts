import { prepareMatchDay } from "../domain/emergency";
import { MatchSession, finishCup, simulateFixture } from "../domain/match";
import { finalizeMatch } from "../domain/progression";
import type { World } from "../domain/model";
let session: MatchSession | undefined;
self.onmessage = (event) => {
  const m = event.data;
  try {
    if (m.type === "start") {
      session = new MatchSession(m.world, m.fixture);
      for (const command of m.world.activeMatch?.commands || []) {
        while (
          session.engine.state.time < command.time &&
          session.engine.state.period !== "ended"
        )
          session.step(Math.min(30, command.time - session.engine.state.time));
        if (session.engine.state.time < command.time)
          throw new Error("Ongeldig wedstrijdcheckpoint.");
        const side = session.fixture.home === m.world.club ? "home" : "away";
        if (command.type === "tactic") session.tactic(side, command.tactic);
        else session.substitute(side, command.out, command.incoming);
      }
      while (
        session.engine.state.time < (m.world.activeMatch?.time || 0) &&
        session.engine.state.period !== "ended"
      )
        session.step(
          Math.min(
            30,
            (m.world.activeMatch?.time || 0) - session.engine.state.time,
          ),
        );
      self.postMessage({
        type: "ready",
        ...session.step(0.25),
        commands: session.commands,
      });
    } else if (m.type === "step" && session) {
      const data = session.step(m.seconds || 30);
      self.postMessage({
        type: "frame",
        ...data,
        result: data.finished ? finishCup(session) : undefined,
        commands: session.commands,
      });
    } else if (m.type === "tactic" && session) {
      session.tactic(m.side, m.tactic);
      self.postMessage({ type: "changed", commands: session.commands });
    } else if (m.type === "sub" && session) {
      session.substitute(m.side, m.out, m.incoming);
      self.postMessage({ type: "changed", commands: session.commands });
    } else if (m.type === "batch") {
      let world: World = prepareMatchDay(m.world);
      for (let i = 0; i < m.fixtures.length; i++) {
        const id = m.fixtures[i];
        world = finalizeMatch(world, id, simulateFixture(world, id));
        self.postMessage({
          type: "progress",
          done: i + 1,
          total: m.fixtures.length,
        });
      }
      self.postMessage({ type: "batchDone", world });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Simulatie mislukt.",
    });
  }
};
