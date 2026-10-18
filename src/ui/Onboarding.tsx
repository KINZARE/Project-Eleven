"use client";
import { useState } from "react";
import { ArrowRight, FolderOpen, RotateCcw } from "lucide-react";
import { createWorld } from "../domain/world";
import { useGame } from "./store";
import { euro, ClubMark, Field } from "./shared";
export default function Onboarding() {
  const [name, setName] = useState(""),
    [club, setClub] = useState(0),
    [difficulty, setDifficulty] = useState<"normal" | "hard">("normal");
  const [choosing, setChoosing] = useState(false);
  const { slots, resume, install, busy, error } = useGame();
  const world = createWorld("Manager", 0, 1);
  async function start() {
    try {
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      const w = createWorld(name, club, seed);
      w.difficulty = difficulty;
      if (difficulty === "hard") w.confidence = 50;
      await install(w);
    } catch {}
  }
  return (
    <main className="onboarding">
      <header className="brand">
        <span className="brand-symbol">XI</span>
        <span>PROJECT ELEVEN</span>
      </header>
      <div className="onboard-intro">
        <h1>
          Jouw club.
          <br />
          <em>Jouw koers.</em>
        </h1>
        <p>
          Het elftal, de keuzes, de spanning.
          <br />
          Een voetbalwereld die met jou meegroeit.
        </p>
      </div>
      <div className="onboard-form">
        <h2>Begin je managerscarrière</h2>
        <p className="subtle">
          Fictieve ontwikkelwereld · 16 clubs · 2 divisies
        </p>
        <Field label="Jouw naam">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Naam van de manager"
            autoComplete="given-name"
          />
        </Field>
        <Field label="Uitdaging">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "normal" | "hard")}
          >
            <option value="normal">Normaal — ruimte om te bouwen</option>
            <option value="hard">Streng bestuur — minder krediet</option>
          </select>
        </Field>
        <button
          className="selected-club"
          onClick={() => setChoosing(!choosing)}
        >
          <ClubMark w={world} id={`club-${club}`} large />
          <span>
            <strong>{world.clubs[club].name}</strong>
            <small>
              {
                world.leagues.find((l) => l.id === world.clubs[club].league)
                  ?.name
              }{" "}
              · {euro(world.clubs[club].balance)} budget
            </small>
          </span>
          <span>Wijzig</span>
        </button>
        {choosing ? (
          <div className="club-choices">
            {world.clubs.map((c, i) => (
              <button
                key={c.id}
                aria-pressed={i === club}
                onClick={() => {
                  setClub(i);
                  setChoosing(false);
                }}
              >
                <ClubMark w={world} id={c.id} />
                <span>
                  {c.name}
                  <small>
                    {euro(c.balance)} · doel: top {c.target}
                  </small>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <button
          className="primary wide"
          disabled={!name.trim() || busy}
          onClick={start}
        >
          Begin carrière <ArrowRight size={19} />
        </button>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
        <p className="micro">
          Geen account nodig. Je carrière wordt op dit apparaat opgeslagen.
        </p>
      </div>
      {slots.length ? (
        <section className="continue-careers">
          <h2>Verder waar je was</h2>
          {slots.map((s) => (
            <div className="save-row" key={s.id}>
              <button onClick={() => resume(s.id)} disabled={busy}>
                <FolderOpen size={19} />
                <span>
                  {s.name}
                  <small>
                    {new Date(s.updated).toLocaleDateString("nl-NL")}
                  </small>
                </span>
              </button>
              <button
                className="icon-button"
                aria-label={`Vorige save herstellen van ${s.name}`}
                onClick={() => resume(s.id, true)}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          ))}
        </section>
      ) : null}
      <footer>
        Fictieve clubs en spelers. Echte spelers worden pas toegevoegd via jouw
        aangeleverde dataset.
      </footer>
    </main>
  );
}
