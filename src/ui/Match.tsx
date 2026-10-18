"use client";
import { eligible } from "../domain/world";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, FastForward, ArrowRight } from "lucide-react";
import { useGame } from "./store";
import type { MatchSnapshot } from "../../vendor/football-simulator/RealTimeEngine";
import type { StoredEvent, Result, Tactic } from "../domain/model";
import { edit } from "../domain/management";
import { nextFixture, finalizeMatch, beginMatch } from "../domain/progression";
import { ClubMark, cname, Heading, Field, Empty, fullDate } from "./shared";
const labels: Record<string, string> = {
  goal: "Doelpunt",
  shot: "Schot",
  save: "Redding",
  miss: "Naast",
  yellow_card: "Gele kaart",
  red_card: "Rode kaart",
  injury: "Blessure",
  substitution: "Wissel",
  half_time: "Rust",
  full_time: "Afgelopen",
  tactical_change: "Tactiek aangepast",
  penalty: "Strafschop",
};
export default function Match() {
  const { world: w, change, setScreen, busy, fail } = useGame();
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null),
    [events, setEvents] = useState<StoredEvent[]>([]),
    [done, setDone] = useState<Result | null>(null),
    [unsavedResult, setUnsavedResult] = useState<Result | null>(null),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(16),
    [out, setOut] = useState(""),
    [incoming, setIncoming] = useState(""),
    [localError, setLocalError] = useState("");
  const worker = useRef<Worker | null>(null),
    playRef = useRef(false),
    speedRef = useRef(16),
    pending = useRef(false),
    lastCheckpoint = useRef(-1);
  const fixture =
    w?.fixtures.find((f) => f.id === w.activeMatch?.fixture) ||
    (w ? nextFixture(w) : null);
  const fixtureId = w?.activeMatch?.fixture;
  useEffect(() => {
    const initialWorld = useGame.getState().world;
    if (!fixtureId || !initialWorld) return;
    const sim = new Worker(
      new URL("../workers/simulation.ts", import.meta.url),
    );
    worker.current = sim;
    let timer: ReturnType<typeof setTimeout>,
      watchdog: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (playRef.current && !pending.current) {
        pending.current = true;
        sim.postMessage({ type: "step", seconds: speedRef.current * 2 });
        watchdog = setTimeout(() => {
          setLocalError(
            "De simulatie reageert niet. Pauzeer en open de wedstrijd opnieuw; je vorige checkpoint blijft bewaard.",
          );
          setPlaying(false);
          playRef.current = false;
          pending.current = false;
        }, 15000);
      }
    };
    sim.onmessage = async (event) => {
      clearTimeout(watchdog);
      const m = event.data;
      if (m.type === "error") {
        pending.current = false;
        setLocalError(m.message);
        setPlaying(false);
        playRef.current = false;
        return;
      }
      if (m.snapshot) {
        setSnapshot(m.snapshot);
        setEvents(m.events || []);
        if (m.finished && m.result) {
          playRef.current = false;
          setPlaying(false);
          pending.current = false;
          try {
            await useGame
              .getState()
              .change((w) => finalizeMatch(w, fixtureId, m.result));
            setDone(m.result);
          } catch {
            setUnsavedResult(m.result);
            setLocalError(
              "Het wedstrijdresultaat kon niet worden opgeslagen. Maak ruimte vrij en probeer opnieuw.",
            );
          }
          return;
        }
        if (
          m.snapshot.time - lastCheckpoint.current >= 60 ||
          m.type === "changed"
        ) {
          lastCheckpoint.current = m.snapshot.time;
          try {
            await useGame.getState().change((w) =>
              edit(w, (n) => {
                n.activeMatch = {
                  fixture: fixtureId,
                  commands: m.commands || n.activeMatch?.commands || [],
                  time: m.snapshot.time,
                };
              }),
            );
          } catch {
            playRef.current = false;
            setPlaying(false);
          }
        }
      } else if (m.type === "changed") {
        try {
          await useGame.getState().change((w) =>
            edit(w, (n) => {
              if (n.activeMatch) n.activeMatch.commands = m.commands;
            }),
          );
        } catch {}
      }
      pending.current = false;
      if (playRef.current) timer = setTimeout(tick, 100);
    };
    sim.onerror = () => {
      setLocalError(
        "De wedstrijdwerker is gestopt. Open de wedstrijd opnieuw om vanaf je checkpoint te hervatten.",
      );
      playRef.current = false;
      setPlaying(false);
    };
    sim.postMessage({ type: "start", world: initialWorld, fixture: fixtureId });
    const handle = setInterval(() => {
      if (playRef.current && !pending.current) tick();
    }, 250);
    return () => {
      clearTimeout(timer);
      clearTimeout(watchdog);
      clearInterval(handle);
      sim.terminate();
      worker.current = null;
    };
  }, [fixtureId]);
  useEffect(() => {
    playRef.current = playing;
    speedRef.current = speed;
  }, [playing, speed]);
  if (!w) return null;
  if (done)
    return (
      <>
        <Heading title="Het laatste fluitsignaal" />
        <section className="result-screen">
          <h2>
            {done.home} <span>–</span> {done.away}
          </h2>
          {done.penalties ? (
            <p>Strafschoppen: {done.penalties.join("–")}</p>
          ) : null}
          <p>De uitslag, spelersstatistieken en inkomsten zijn opgeslagen.</p>
          <div className="data-grid">
            <div>
              <span>Schoten</span>
              <strong>{done.stats.shots.join(" – ")}</strong>
            </div>
            <div>
              <span>Balbezit</span>
              <strong>{done.stats.possession.join("% – ")}%</strong>
            </div>
          </div>
          <button className="primary wide" onClick={() => setScreen("home")}>
            Terug naar het clubhuis <ArrowRight size={18} />
          </button>
        </section>
      </>
    );
  if (!fixture)
    return (
      <Empty title="Geen volgende wedstrijd">
        Het seizoen is afgelopen. Ga naar het clubhuis om het volgende seizoen
        te starten.
      </Empty>
    );
  const side = fixture.home === w.club ? "home" : "away";
  const onPitch =
    snapshot?.players.filter((p) => p.teamSide === side && !p.redCard) || [];
  const bench = w.clubs
    .find((c) => c.id === w.club)!
    .tactic.bench.filter((id) => {
      const p = w.players.find((p) => p.id === id);
      return (
        p &&
        !snapshot?.players.some(
          (s) => s.teamSide === side && s.playerNumber === p.number,
        )
      );
    });
  const act = (t: Partial<Tactic>) => {
    setPlaying(false);
    playRef.current = false;
    worker.current?.postMessage({ type: "tactic", side, tactic: t });
  };
  return (
    <>
      <Heading title="Wedstrijddag">
        <span>{fixture.cup ? "Nationale Beker" : "Competitie"}</span>
      </Heading>
      <section className="match-board">
        <div className="scoreboard">
          <div>
            <ClubMark w={w} id={fixture.home} />
            <strong>{cname(w, fixture.home)}</strong>
          </div>
          <div className="score">
            <strong>
              {snapshot?.score.home || 0}
              <span> – </span>
              {snapshot?.score.away || 0}
            </strong>
            <small>
              {snapshot
                ? `${Math.floor(snapshot.time / 60)}:${String(Math.floor(snapshot.time % 60)).padStart(2, "0")}`
                : fullDate(fixture.day)}
            </small>
          </div>
          <div>
            <ClubMark w={w} id={fixture.away} />
            <strong>{cname(w, fixture.away)}</strong>
          </div>
        </div>
        {!fixtureId ? (
          <div className="match-prep">
            <p>
              {fixture.day > w.day
                ? "Bereid je elftal voor. Ga verder in de kalender tot de wedstrijddag."
                : "Het stadion is er klaar voor. Controleer je basiselftal voor de aftrap."}
            </p>
            <div className="button-grid">
              <button onClick={() => setScreen("tactics")}>
                Opstelling controleren
              </button>
              <button
                className="primary"
                disabled={busy || fixture.day > w.day}
                onClick={() =>
                  change((w) => beginMatch(w, fixture.id)).catch(() => {})
                }
              >
                Aftrap <Play size={17} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="live-pitch pitch">
              <svg
                viewBox="0 0 105 68"
                role="img"
                aria-label={`Live veld, ${Math.floor((snapshot?.time || 0) / 60)} minuten gespeeld`}
              >
                <g fill="none" stroke="rgba(235,245,230,.3)" strokeWidth=".35">
                  <rect x="1" y="1" width="103" height="66" />
                  <path d="M52.5 1V67" />
                  <circle cx="52.5" cy="34" r="9.15" />
                  <path d="M1 13.84h16.5v40.32H1M104 13.84H87.5v40.32H104M1 24.84h5.5v18.32H1M104 24.84h-5.5v18.32H104" />
                </g>
                {snapshot?.players.map((p) => (
                  <g
                    key={p.id}
                    className="live-player"
                    style={{ transform: `translate(${p.x}px,${p.y}px)` }}
                  >
                    <circle
                      r="1.6"
                      fill={p.teamSide === "home" ? "#b9ef79" : "#f2b27c"}
                      stroke="#102316"
                      strokeWidth=".3"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="1.5"
                      fill="#102316"
                    >
                      {p.playerNumber}
                    </text>
                  </g>
                ))}
                {snapshot ? (
                  <circle
                    className="live-ball"
                    cx={snapshot.ball.x}
                    cy={snapshot.ball.y}
                    r=".6"
                    fill="white"
                    stroke="#15261a"
                    strokeWidth=".2"
                  />
                ) : null}
              </svg>
            </div>
            <div className="match-controls">
              <button className="primary" onClick={() => setPlaying(!playing)}>
                {playing ? <Pause size={18} /> : <Play size={18} />}{" "}
                {playing ? "Pauze" : "Spelen"}
              </button>
              <select
                aria-label="Wedstrijdsnelheid"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                {[1, 4, 16, 64].map((s) => (
                  <option key={s} value={s}>
                    {s}× snelheid
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setPlaying(false);
                  playRef.current = false;
                  worker.current?.postMessage({ type: "step", seconds: 9000 });
                }}
              >
                <FastForward size={17} />
                <span>Afronden</span>
              </button>
            </div>
          </>
        )}
        {localError ? (
          <p className="error" role="alert">
            {localError}
          </p>
        ) : null}
        {unsavedResult ? (
          <button
            className="primary wide"
            onClick={() =>
              change((w) => finalizeMatch(w, fixture.id, unsavedResult))
                .then(() => {
                  setDone(unsavedResult);
                  setUnsavedResult(null);
                })
                .catch(() => {})
            }
          >
            Resultaat opnieuw opslaan
          </button>
        ) : null}
      </section>
      {fixtureId ? (
        <div className="match-details">
          <section>
            <h2>Jouw ingrepen</h2>
            <p className="subtle">
              Wijzigingen pauzeren het spel en gelden vanaf dit moment.
            </p>
            <Field label="Speelwijze">
              <select
                defaultValue="balanced"
                onChange={(e) =>
                  act({ mentality: e.target.value as Tactic["mentality"] })
                }
              >
                <option value="defensive">Verdedigend</option>
                <option value="balanced">Gebalanceerd</option>
                <option value="attacking">Aanvallend</option>
              </select>
            </Field>
            <Field label="Van het veld">
              <select value={out} onChange={(e) => setOut(e.target.value)}>
                <option value="">Kies een basisspeler</option>
                {onPitch.map((p) => (
                  <option
                    key={p.id}
                    value={
                      w.players.find(
                        (x) => x.club === w.club && x.number === p.playerNumber,
                      )?.id
                    }
                  >
                    {p.playerName} · {Math.round(p.stamina)}%
                  </option>
                ))}
              </select>
            </Field>
            <Field label="In het veld">
              <select
                value={incoming}
                onChange={(e) => setIncoming(e.target.value)}
              >
                <option value="">Kies een wisselspeler</option>
                {bench.map((id) => (
                  <option key={id} value={id}>
                    {w.players.find((p) => p.id === id)?.name}
                  </option>
                ))}
              </select>
            </Field>
            <button
              className="wide"
              disabled={!out || !incoming}
              onClick={() => {
                setPlaying(false);
                playRef.current = false;
                worker.current?.postMessage({
                  type: "sub",
                  side,
                  out,
                  incoming,
                });
                setIncoming("");
                setOut("");
              }}
            >
              Wissel doorvoeren
            </button>
          </section>
          <section className="commentary">
            <h2>Langs de lijn</h2>
            {events.length ? (
              events
                .slice(-35)
                .reverse()
                .map((e, i) => (
                  <div
                    className={`commentary-event ${e.type === "goal" ? "goal" : ""}`}
                    key={`${e.time}-${i}`}
                  >
                    <time>{Math.ceil(e.time / 60)}′</time>
                    <span>
                      <strong>{labels[e.type] || e.type}</strong>
                      <small>
                        {e.player || ""}
                        {e.secondary ? ` voor ${e.secondary}` : ""}
                      </small>
                    </span>
                  </div>
                ))
            ) : (
              <p className="subtle">
                Het verslag verschijnt zodra de wedstrijd begint.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
