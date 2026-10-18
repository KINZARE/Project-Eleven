"use client";
import { useState } from "react";
import { useGame } from "./store";
import {
  edit,
  acceptTransfer,
  scout,
  invest,
  hire,
  fire,
  train,
} from "../domain/management";
import { takeJob } from "../domain/progression";
import { table } from "../domain/competition";
import { squad } from "../domain/world";
import type { World, Focus } from "../domain/model";
import {
  Heading,
  PlayerRow,
  Field,
  Empty,
  euro,
  cname,
  fullDate,
  Row,
  Sheet,
} from "./shared";
import { PlayerSheet } from "./Squad";
export function Transfers() {
  const { world: w, change, busy } = useGame();
  const [query, setQuery] = useState(""),
    [pos, setPos] = useState("all"),
    [selected, setSelected] = useState<string | null>(null),
    [limit, setLimit] = useState(35);
  if (!w) return null;
  const players = w.players
    .filter(
      (p) =>
        p.club !== w.club &&
        !p.youth &&
        p.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
        (pos === "all" || p.position === pos),
    )
    .sort((a, b) => b.ability - a.ability);
  return (
    <>
      <Heading title="De transfermarkt">
        <span>Zoek jouw versterking</span>
      </Heading>
      <section className="section offers">
        <h2>Onderhandelingen</h2>
        {w.transfers
          .filter((t) => t.from === w.club || t.to === w.club)
          .slice(0, 15)
          .map((t) => (
            <div className="offer-row" key={t.id}>
              <span>
                <strong>
                  {w.players.find((p) => p.id === t.player)?.name}
                </strong>
                <small>
                  {cname(w, t.from)} → {cname(w, t.to)} · {euro(t.fee)}{" "}
                  {t.type === "loan" ? "· huur" : ""}
                </small>
              </span>
              {t.status === "accepted" ? (
                <div className="inline-actions">
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      change((w) => acceptTransfer(w, t.id)).catch(() => {})
                    }
                  >
                    Bevestig
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      change((w) =>
                        edit(w, (n) => {
                          n.transfers.find((x) => x.id === t.id)!.status =
                            "rejected";
                        }),
                      ).catch(() => {})
                    }
                  >
                    Afwijzen
                  </button>
                </div>
              ) : (
                <span className="subtle">
                  {
                    {
                      completed: "Afgerond",
                      rejected: "Afgewezen",
                      pending: "In behandeling",
                      accepted: "Akkoord",
                    }[t.status]
                  }
                </span>
              )}
            </div>
          ))}
        {!w.transfers.some((t) => t.from === w.club || t.to === w.club) ? (
          <p className="subtle">
            Je hebt nog geen bod uitgebracht. Kies hieronder een speler.
          </p>
        ) : null}
      </section>
      <div className="filters">
        <input
          aria-label="Zoek speler op de markt"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(35);
          }}
          placeholder="Zoek een speler…"
        />
        <select
          aria-label="Positie op de markt"
          value={pos}
          onChange={(e) => setPos(e.target.value)}
        >
          <option value="all">Alle posities</option>
          {["GK", "DEF", "MID", "ATT"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <p className="subtle">
        {players.length} spelers · salarissen zijn bedragen per week
      </p>
      {players.slice(0, limit).map((p) => (
        <PlayerRow
          key={p.id}
          p={p}
          w={w}
          detail={euro(p.value)}
          onClick={() => setSelected(p.id)}
        />
      ))}
      {players.length > limit ? (
        <button className="wide" onClick={() => setLimit(limit + 35)}>
          Meer spelers tonen
        </button>
      ) : null}
      {!players.length ? (
        <Empty title="Geen spelers gevonden">
          Probeer een andere naam of positie.
        </Empty>
      ) : null}
      {selected ? (
        <PlayerSheet id={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
export function Competition() {
  const { world: w } = useGame();
  const [league, setLeague] = useState(""),
    [tab, setTab] = useState("table"),
    [report, setReport] = useState<string | null>(null);
  if (!w) return null;
  const current = league || w.clubs.find((c) => c.id === w.club)!.league;
  const rows = table(w, current);
  const fs = w.fixtures
    .filter(
      (f) =>
        f.season === w.season && (tab === "cup" ? f.cup : f.league === current),
    )
    .sort((a, b) => a.day - b.day);
  const f = w.fixtures.find((f) => f.id === report);
  return (
    <>
      <Heading title="Alles om voor te spelen">
        <span>
          Seizoen {w.season} / {w.season + 1}
        </span>
      </Heading>
      <div className="tabs">
        {["table", "fixtures", "cup", "history"].map((t, i) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {["Stand", "Programma", "Beker", "Historie"][i]}
          </button>
        ))}
      </div>
      {tab !== "cup" && tab !== "history" ? (
        <Field label="Competitie">
          <select value={current} onChange={(e) => setLeague(e.target.value)}>
            {w.leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {tab === "table" ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Club</th>
                <th>G</th>
                <th>W</th>
                <th>GL</th>
                <th>V</th>
                <th>+/-</th>
                <th>Pnt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.club}
                  className={r.club === w.club ? "own-club" : ""}
                >
                  <td>{i + 1}</td>
                  <th>{cname(w, r.club)}</th>
                  <td>{r.played}</td>
                  <td>{r.won}</td>
                  <td>{r.drawn}</td>
                  <td>{r.lost}</td>
                  <td>{r.gf - r.ga}</td>
                  <td>
                    <strong>{r.points}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "history" ? (
        w.history.length ? (
          w.history.map((h) => (
            <section className="section" key={h.season + h.league}>
              <h2>
                {h.season} · {w.leagues.find((l) => l.id === h.league)?.name}
              </h2>
              <p>Kampioen: {cname(w, h.champion)}</p>
              {h.standings.map((r, i) => (
                <Row key={r.club}>
                  <span>
                    {i + 1}. {cname(w, r.club)}
                  </span>
                  <strong>{r.points} pnt</strong>
                </Row>
              ))}
            </section>
          ))
        ) : (
          <Empty title="De geschiedenis begint hier">
            Na het eerste seizoen vind je hier de eindstanden.
          </Empty>
        )
      ) : (
        fs.map((f) => (
          <div
            className={`fixture-row ${[f.home, f.away].includes(w.club) ? "own-fixture" : ""}`}
            key={f.id}
          >
            <small>
              {fullDate(f.day)}
              {f.cup ? ` · ronde ${f.round + 1}` : ""}
            </small>
            <div>
              <span>{cname(w, f.home)}</span>
              {f.result ? (
                <button
                  aria-label={`Wedstrijdverslag ${cname(w, f.home)} tegen ${cname(w, f.away)}`}
                  onClick={() => setReport(f.id)}
                >
                  <strong>
                    {f.result.home}–{f.result.away}
                  </strong>
                  {f.result.penalties ? (
                    <small>pen. {f.result.penalties.join("–")}</small>
                  ) : null}
                </button>
              ) : (
                <span className="subtle">–</span>
              )}
              <span>{cname(w, f.away)}</span>
            </div>
          </div>
        ))
      )}
      {f?.result ? (
        <Sheet title="Wedstrijdverslag" onClose={() => setReport(null)}>
          <h2>
            {cname(w, f.home)} {f.result.home}–{f.result.away}{" "}
            {cname(w, f.away)}
          </h2>
          <p>
            Schoten: {f.result.stats.shots.join(" – ")} · Balbezit:{" "}
            {f.result.stats.possession.join("% – ")}%
          </p>
          {f.result.events
            .filter((e) =>
              ["goal", "injury", "red_card", "substitution"].includes(e.type),
            )
            .map((e, i) => (
              <Row key={i}>
                <span>
                  {Math.ceil(e.time / 60)}′ · {e.type}
                </span>
                <span>{e.player}</span>
              </Row>
            ))}
        </Sheet>
      ) : null}
      <section className="section">
        <h2>Topscorers</h2>
        {w.players
          .filter(
            (p) =>
              p.goals > 0 &&
              w.clubs.find((c) => c.id === p.club)?.league === current,
          )
          .sort((a, b) => b.goals - a.goals)
          .slice(0, 8)
          .map((p) => (
            <Row key={p.id}>
              <span>
                {p.name}
                <small>{cname(w, p.club)}</small>
              </span>
              <strong>{p.goals}</strong>
            </Row>
          ))}
      </section>
    </>
  );
}
export function Finances() {
  const { world: w, change, busy } = useGame();
  if (!w) return null;
  const c = w.clubs.find((c) => c.id === w.club)!,
    ledger = w.ledger.filter((t) => t.club === w.club),
    wages =
      squad(w, w.club).reduce((s, p) => s + p.wage, 0) +
      w.staff.filter((s) => s.club === w.club).reduce((s, p) => s + p.wage, 0);
  return (
    <>
      <Heading title="Een gezonde club">
        <span>Financiën</span>
      </Heading>
      <div className="balance">
        <span>Clubsaldo</span>
        <h2>{euro(c.balance)}</h2>
        <p>Beginsaldo {euro(c.openingBalance)} + alle inkomsten en uitgaven</p>
      </div>
      <div className="data-grid">
        <div>
          <span>Salarissen / week</span>
          <strong>{euro(wages)}</strong>
        </div>
        <div>
          <span>Loonbudget / week</span>
          <strong>{euro(c.wageBudget)}</strong>
        </div>
        <div>
          <span>Netto mutatie</span>
          <strong>{euro(ledger.reduce((s, t) => s + t.amount, 0))}</strong>
        </div>
      </div>
      <section className="section">
        <h2>Bouwen aan de toekomst</h2>
        {(["training", "academy", "scouting"] as const).map((type, i) => (
          <div className="offer-row" key={type}>
            <span>
              <strong>
                {["Trainingscomplex", "Jeugdacademie", "Scoutingnetwerk"][i]}
              </strong>
              <small>Niveau {c[type]} · uitbreiding duurt 30 dagen</small>
            </span>
            <button
              disabled={busy || Boolean(c.investment)}
              onClick={() => change((w) => invest(w, type)).catch(() => {})}
            >
              Investeer {euro(c[type] * 500000)}
            </button>
          </div>
        ))}
        {c.investment ? (
          <p className="subtle">
            Uitbreiding gereed op {fullDate(c.investment.ready)}.
          </p>
        ) : null}
      </section>
      <section className="section">
        <h2>Grootboek</h2>
        {ledger.length ? (
          ledger
            .slice(-60)
            .reverse()
            .map((t) => (
              <Row key={t.id}>
                <span>
                  {t.description}
                  <small>{fullDate(t.day)}</small>
                </span>
                <strong className={t.amount >= 0 ? "positive" : "negative"}>
                  {t.amount >= 0 ? "+" : ""}
                  {euro(t.amount)}
                </strong>
              </Row>
            ))
        ) : (
          <Empty title="Nog geen mutaties">
            Inkomsten, transfers en salarissen verschijnen hier automatisch.
          </Empty>
        )}
      </section>
    </>
  );
}
export function Staff() {
  const { world: w, change, busy } = useGame();
  if (!w) return null;
  const roles = { coach: "Trainer", scout: "Scout", physio: "Fysiotherapeut" };
  return (
    <>
      <Heading title="Jouw technische staf" />
      <p className="subtle">
        Trainers versnellen de ontwikkeling. Scouts verbeteren rapporten. Je
        staf ontvangt wekelijks salaris.
      </p>
      {w.staff
        .filter((s) => s.club === w.club)
        .map((s) => (
          <div className="offer-row" key={s.id}>
            <span>
              <strong>{s.name}</strong>
              <small>
                {roles[s.role]} · kwaliteit {s.skill} · {euro(s.wage)} / week
              </small>
            </span>
            <button
              disabled={busy}
              onClick={() => {
                if (confirm(`Ontsla ${s.name} voor ${euro(s.wage * 4)}?`))
                  change((w) => fire(w, s.id)).catch(() => {});
              }}
            >
              Ontslaan
            </button>
          </div>
        ))}
      <section className="section">
        <h2>Beschikbaar op de markt</h2>
        {w.staff
          .filter((s) => !s.club)
          .map((s) => (
            <div className="offer-row" key={s.id}>
              <span>
                <strong>{s.name}</strong>
                <small>
                  {roles[s.role]} · kwaliteit {s.skill} · {euro(s.wage)} / week
                </small>
              </span>
              <button
                disabled={busy}
                onClick={() => change((w) => hire(w, s.id)).catch(() => {})}
              >
                Aannemen · {euro(s.wage * 4)}
              </button>
            </div>
          ))}
      </section>
    </>
  );
}
export function Training() {
  const { world: w, change, busy } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  if (!w) return null;
  return (
    <>
      <Heading title="Elke dag een beetje beter" />
      <p className="subtle">
        Training en herstel worden toegepast als je de kalender verder zet. Je
        faciliteiten en trainers bepalen de ontwikkeling.
      </p>
      <Field label="Focus voor het hele eerste elftal">
        <select
          defaultValue=""
          disabled={busy}
          onChange={(e) => {
            const focus = e.target.value as Focus;
            change((w) =>
              edit(w, (n) => {
                for (const p of n.players.filter(
                  (p) => p.club === n.club && !p.youth,
                ))
                  p.focus = focus;
              }),
            ).catch(() => {});
          }}
        >
          <option value="" disabled>
            Kies een teamfocus
          </option>
          {["balanced", "passing", "finishing", "defending", "fitness"].map(
            (f, i) => (
              <option key={f} value={f}>
                {
                  ["Allround", "Passing", "Afwerken", "Verdedigen", "Fitheid"][
                    i
                  ]
                }
              </option>
            ),
          )}
        </select>
      </Field>
      {squad(w, w.club)
        .filter((p) => !p.youth)
        .map((p) => (
          <PlayerRow
            key={p.id}
            p={p}
            w={w}
            detail={
              {
                balanced: "Allround",
                passing: "Passing",
                finishing: "Afwerken",
                defending: "Verdedigen",
                fitness: "Fitheid",
              }[p.focus]
            }
            onClick={() => setSelected(p.id)}
          />
        ))}
      {selected ? (
        <PlayerSheet id={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
export function Scouting() {
  const { world: w, setScreen } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  if (!w) return null;
  const reports = w.scouting.filter((r) => r.club === w.club);
  return (
    <>
      <Heading title="Ogen op de toekomst" />
      <p className="subtle">
        Start een scoutingopdracht vanuit een spelersprofiel op de
        transfermarkt.
      </p>
      <button className="primary" onClick={() => setScreen("transfers")}>
        Spelers zoeken
      </button>
      <section className="section">
        {reports.length ? (
          reports.map((r) => {
            const p = w.players.find((p) => p.id === r.player)!;
            return (
              <button
                className="report-row"
                key={r.id}
                onClick={() => setSelected(p.id)}
              >
                <strong>{p.name}</strong>
                {r.ready > w.day ? (
                  <p>Opdracht loopt · gereed {fullDate(r.ready)}</p>
                ) : (
                  <>
                    <p>
                      Kwaliteit circa {Math.round(p.ability / 5) * 5} ·
                      potentieel circa {Math.round(p.potential / 5) * 5}
                    </p>
                    <p>
                      Betrouwbaarheid {Math.round(r.confidence)}% · {p.position}{" "}
                      · {euro(p.value)}
                    </p>
                  </>
                )}
              </button>
            );
          })
        ) : (
          <Empty title="Nog geen scout op pad">
            Zoek een speler en stuur een scout om een rapport op te bouwen.
          </Empty>
        )}
      </section>
      {selected ? (
        <PlayerSheet id={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
export function Inbox() {
  const { world: w, change } = useGame();
  const [opened, setOpened] = useState<string | null>(null);
  if (!w) return null;
  return (
    <>
      <Heading title="De post is binnen">
        <button
          onClick={() =>
            change((w) =>
              edit(w, (n) => {
                n.messages.forEach((m) => (m.read = true));
              }),
            ).catch(() => {})
          }
        >
          Alles gelezen
        </button>
      </Heading>
      {w.messages.map((m) => (
        <div className={`inbox-item ${m.read ? "read" : ""}`} key={m.id}>
          <button
            onClick={() => {
              setOpened(opened === m.id ? null : m.id);
              if (!m.read)
                change((w) =>
                  edit(w, (n) => {
                    n.messages.find((x) => x.id === m.id)!.read = true;
                  }),
                ).catch(() => {});
            }}
          >
            <span>
              <strong>{m.title}</strong>
              <small>{fullDate(m.day)}</small>
            </span>
            <span>{opened === m.id ? "−" : "+"}</span>
          </button>
          {opened === m.id ? (
            <div>
              <p>{m.body}</p>
              <button
                className="text-button"
                onClick={() => useGame.getState().setScreen(m.screen)}
              >
                Bekijken →
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}
export function Manager() {
  const { world: w, change, busy } = useGame();
  if (!w) return null;
  return (
    <>
      <Heading title={w.manager}>
        <span>Managerprofiel</span>
      </Heading>
      <div className="data-grid">
        <div>
          <span>Reputatie</span>
          <strong>{Math.round(w.reputation)} / 100</strong>
        </div>
        <div>
          <span>Bestuursvertrouwen</span>
          <strong>{Math.round(w.confidence)}%</strong>
        </div>
        <div>
          <span>Aanstelling</span>
          <strong>{w.employed ? "Actief" : "Op zoek"}</strong>
        </div>
      </div>
      <h2>{cname(w, w.club)}</h2>
      <p>
        Het bestuur verwacht een plek bij de eerste{" "}
        {w.clubs.find((c) => c.id === w.club)?.target}.
      </p>
      {!w.employed ? (
        <section className="section">
          <h2>Een nieuwe kans</h2>
          {w.clubs
            .filter((c) => c.id !== w.club)
            .map((c) => (
              <Row key={c.id}>
                <span>{c.name}</span>
                <button
                  disabled={busy}
                  onClick={() =>
                    change((w) => takeJob(w, c.id)).catch(() => {})
                  }
                >
                  Baan aannemen
                </button>
              </Row>
            ))}
        </section>
      ) : null}
      <section className="section">
        <h2>Prijzenkast</h2>
        {w.trophies.length ? (
          w.trophies.map((t, i) => (
            <Row key={i}>
              <strong>{t.name}</strong>
              <span>{t.season}</span>
            </Row>
          ))
        ) : (
          <p className="subtle">Je eerste trofee wacht nog.</p>
        )}
      </section>
      <section className="section">
        <h2>Loopbaan</h2>
        {w.managerHistory.map((h, i) => (
          <Row key={i}>
            <span>
              {h.season} · {cname(w, h.club)}
            </span>
            <strong>#{h.position}</strong>
          </Row>
        ))}
      </section>
    </>
  );
}
