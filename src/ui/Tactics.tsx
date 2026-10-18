"use client";
import { useState, useRef } from "react";
import { useGame } from "./store";
import { formations, type Tactic, type World } from "../domain/model";
import { autoLineup, squad, formationRoles, eligible } from "../domain/world";
import { edit } from "../domain/management";
import { Heading, Field, Sheet, PlayerRow } from "./shared";
export default function Tactics() {
  const { world: w, change, busy } = useGame();
  const [slot, setSlot] = useState<number | null>(null),
    [tacticName, setTacticName] = useState("Mijn tactiek");
  const drag = useRef<{ slot: number; x: number; y: number } | null>(null);
  if (!w) return null;
  const club = w.clubs.find((c) => c.id === w.club)!,
    t = club.tactic;
  const act = (fn: (w: World) => World) => change(fn).catch(() => {});
  const update = (patch: Partial<Tactic>) =>
    act((w) =>
      edit(w, (n) => {
        Object.assign(n.clubs.find((c) => c.id === n.club)!.tactic, patch);
      }),
    );
  function reset(formation = t.formation) {
    act((w) =>
      edit(w, (n) => {
        const c = n.clubs.find((c) => c.id === n.club)!;
        c.tactic.formation = formation;
        c.tactic.lineup = autoLineup(n, c.id, formation);
        c.tactic.bench = squad(n, c.id)
          .filter((p) => eligible(p, n) && !c.tactic.lineup.includes(p.id))
          .slice(0, 9)
          .map((p) => p.id);
      }),
    );
  }
  function select(id: string) {
    if (slot === null) return;
    act((w) =>
      edit(w, (n) => {
        const t = n.clubs.find((c) => c.id === n.club)!.tactic;
        const index = t.lineup.indexOf(id);
        const old = t.lineup[slot];
        if (index >= 0) t.lineup[index] = old;
        t.lineup[slot] = id;
        t.bench = squad(n, n.club)
          .filter((p) => eligible(p, n) && !t.lineup.includes(p.id))
          .slice(0, 9)
          .map((p) => p.id);
      }),
    );
    setSlot(null);
  }
  const lines = [1, ...t.formation.split("-").map(Number)];
  let index = 0;
  const positions = lines.flatMap((count, line) =>
    Array.from({ length: count }, (_, j) => ({
      slot: index++,
      x: ((j + 1) / (count + 1)) * 100,
      y: 90 - (line / (lines.length - 1)) * 76,
    })),
  );
  const selectedPlayers = t.lineup.map((id) =>
    w.players.find((p) => p.id === id),
  );
  const invalid =
    selectedPlayers.length !== 11 ||
    selectedPlayers.some((p) => !p || !eligible(p, w));
  return (
    <>
      <Heading title="Jouw speelwijze">
        <span>{t.formation}</span>
      </Heading>
      <div className="tactics-grid">
        <section>
          <div className="pitch tactic-pitch">
            <div className="pitch-lines">
              <span className="center-circle" />
              <span className="halfway" />
              <span className="box top" />
              <span className="box bottom" />
            </div>
            {positions.map((pos) => {
              const p = selectedPlayers[pos.slot];
              return (
                <button
                  key={pos.slot}
                  data-slot={pos.slot}
                  className="position"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  aria-label={`${formationRoles(t.formation)[pos.slot]}: ${p?.name || "Lege positie"}, wijzig speler`}
                  onPointerDown={(e) => {
                    drag.current = {
                      slot: pos.slot,
                      x: e.clientX,
                      y: e.clientY,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerUp={(e) => {
                    const d = drag.current;
                    drag.current = null;
                    const drop = document
                      .elementFromPoint(e.clientX, e.clientY)
                      ?.closest("[data-slot]");
                    const to = drop
                      ? Number(drop.getAttribute("data-slot"))
                      : pos.slot;
                    if (d && to !== d.slot) {
                      act((w) =>
                        edit(w, (n) => {
                          const t = n.clubs.find(
                            (c) => c.id === n.club,
                          )!.tactic;
                          [t.lineup[d.slot], t.lineup[to]] = [
                            t.lineup[to],
                            t.lineup[d.slot],
                          ];
                        }),
                      );
                      return;
                    }
                    setSlot(pos.slot);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSlot(pos.slot);
                    }
                  }}
                >
                  <span className={!p || !eligible(p, w) ? "unavailable" : ""}>
                    {p?.number || "+"}
                  </span>
                  <small>
                    {p?.name.split(" ").slice(-1)[0] || "Kies speler"}
                  </small>
                </button>
              );
            })}
          </div>
          <p className="micro">
            Tik op een positie om te kiezen. Sleep tussen twee posities om te
            wisselen.
          </p>
          <button className="wide" disabled={busy} onClick={() => reset()}>
            Selecteer het beste elftal
          </button>
          {invalid ? (
            <p role="alert" className="error">
              Controleer je basiselftal: niet alle posities zijn inzetbaar.
            </p>
          ) : null}
          <h3>Wisselspelers</h3>
          {t.bench.map((id) => {
            const p = w.players.find((p) => p.id === id);
            return p ? (
              <div className="row" key={id}>
                <span>
                  {p.number} · {p.name}
                </span>
                <span>
                  {p.position} · {Math.round(p.fitness)}%
                </span>
              </div>
            ) : null;
          })}
        </section>
        <section className="tactic-settings">
          <h2>Het plan</h2>
          <Field label="Formatie">
            <select
              value={t.formation}
              disabled={busy}
              onChange={(e) => reset(e.target.value)}
            >
              {formations.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Field label="Speelstijl">
            <select
              value={t.style}
              disabled={busy}
              onChange={(e) =>
                update({ style: e.target.value as Tactic["style"] })
              }
            >
              {[
                "balanced",
                "possession",
                "direct",
                "counter",
                "low_block",
                "high_press",
              ].map((s, i) => (
                <option value={s} key={s}>
                  {
                    [
                      "Gebalanceerd",
                      "Balbezit",
                      "Direct",
                      "Counter",
                      "Laag blok",
                      "Hoge druk",
                    ][i]
                  }
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mentaliteit">
            <select
              value={t.mentality}
              disabled={busy}
              onChange={(e) =>
                update({ mentality: e.target.value as Tactic["mentality"] })
              }
            >
              <option value="defensive">Verdedigend</option>
              <option value="balanced">Gebalanceerd</option>
              <option value="attacking">Aanvallend</option>
            </select>
          </Field>
          {(
            ["tempo", "press", "width", "defensiveLine", "compactness"] as const
          ).map((key, i) => (
            <Field
              key={key}
              label={`${["Tempo", "Druk zetten", "Breedte", "Verdedigingslijn", "Compactheid"][i]} · ${t[key]}`}
            >
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                defaultValue={t[key]}
                disabled={busy}
                onPointerUp={(e) =>
                  update({ [key]: Number(e.currentTarget.value) })
                }
                onKeyUp={(e) => {
                  if (e.key.startsWith("Arrow"))
                    update({ [key]: Number(e.currentTarget.value) });
                }}
              />
            </Field>
          ))}
          <Field label="Aanvalsrichting">
            <select
              value={t.focus}
              onChange={(e) =>
                update({ focus: e.target.value as Tactic["focus"] })
              }
            >
              <option value="balanced">Gevarieerd</option>
              <option value="wide">Via de flanken</option>
              <option value="central">Door het midden</option>
            </select>
          </Field>
          <h3>Tactieken bewaren</h3>
          <Field label="Naam">
            <input
              value={tacticName}
              maxLength={40}
              onChange={(e) => setTacticName(e.target.value)}
            />
          </Field>
          <button
            className="wide"
            disabled={!tacticName.trim() || busy}
            onClick={() =>
              act((w) =>
                edit(w, (n) => {
                  n.savedTactics = n.savedTactics.filter(
                    (s) => s.name !== tacticName.trim(),
                  );
                  n.savedTactics.push({
                    name: tacticName.trim(),
                    tactic: structuredClone(t),
                  });
                }),
              )
            }
          >
            Tactiek opslaan
          </button>
          {w.savedTactics.map((s) => (
            <button
              key={s.name}
              className="row row-button"
              onClick={() => update(structuredClone(s.tactic))}
            >
              {s.name}
              <span>Laden</span>
            </button>
          ))}
        </section>
      </div>
      {slot !== null ? (
        <Sheet
          title={`Kies ${formationRoles(t.formation)[slot]}`}
          onClose={() => setSlot(null)}
        >
          {squad(w, w.club)
            .filter(
              (p) =>
                eligible(p, w) &&
                (slot === 0 ? p.position === "GK" : p.position !== "GK"),
            )
            .sort((a, b) => b.ability - a.ability)
            .map((p) => (
              <PlayerRow key={p.id} p={p} w={w} onClick={() => select(p.id)} />
            ))}
        </Sheet>
      ) : null}
    </>
  );
}
