"use client";
import { useState } from "react";
import { useGame } from "./store";
import { squad, eligible, age } from "../domain/world";
import {
  edit,
  train,
  renewContract,
  listPlayer,
  offerTransfer,
  scout,
  promote,
} from "../domain/management";
import type { Player, Focus, World } from "../domain/model";
import {
  PlayerRow,
  Heading,
  Sheet,
  Field,
  euro,
  Empty,
  cname,
  fullDate,
} from "./shared";
export function PlayerSheet({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { world: w, change, busy } = useGame();
  const p = w!.players.find((p) => p.id === id)!;
  const [fee, setFee] = useState(Math.ceil(p.value * 1.1)),
    [wage, setWage] = useState(p.wage || 1000),
    [years, setYears] = useState(3),
    [loan, setLoan] = useState(false);
  if (!w) return null;
  const own = p.club === w.club;
  const act = (fn: (w: World) => World) => change(fn).catch(() => {});
  return (
    <Sheet title={p.name} onClose={onClose}>
      <div className="player-summary">
        <span className="big-shirt">{p.number}</span>
        <div>
          <strong>
            {p.position} · {age(p, w.day)} jaar
          </strong>
          <p>
            {cname(w, p.club)} · {p.nationality}
          </p>
          <p>
            {p.injuredUntil > w.day
              ? `Geblesseerd tot ${fullDate(p.injuredUntil)}`
              : p.suspended
                ? `${p.suspended} wedstrijden geschorst`
                : "Beschikbaar"}
          </p>
        </div>
        <span className="rating large-rating">{Math.round(p.ability)}</span>
      </div>
      <div className="data-grid">
        <div>
          <span>Waarde</span>
          <strong>{euro(p.value)}</strong>
        </div>
        <div>
          <span>Salaris / week</span>
          <strong>{euro(p.wage)}</strong>
        </div>
        <div>
          <span>Contract tot</span>
          <strong>{p.contractUntil}</strong>
        </div>
        <div>
          <span>Fitheid</span>
          <strong>{Math.round(p.fitness)}%</strong>
        </div>
        <div>
          <span>Moraal</span>
          <strong>{Math.round(p.morale)}%</strong>
        </div>
        <div>
          <span>Vorm</span>
          <strong>{p.form.toFixed(1)}</strong>
        </div>
      </div>
      <h3>Spelersprofiel</h3>
      <div className="attributes">
        {Object.entries(p.attributes).map(([key, val]) => (
          <div key={key}>
            <span>
              {
                {
                  pace: "Snelheid",
                  passing: "Passing",
                  finishing: "Afwerken",
                  defending: "Verdedigen",
                  goalkeeping: "Keepen",
                  stamina: "Uithouding",
                  decisions: "Beslissingen",
                }[key]
              }
            </span>
            <strong>{Math.round(val)}</strong>
            <meter value={val} min={0} max={100} />
          </div>
        ))}
      </div>
      <p className="micro">
        Attributen, potentieel en waardes zijn spelberekeningen.
      </p>
      <h3>Dit seizoen</h3>
      <div className="data-grid">
        <div>
          <span>Wedstrijden</span>
          <strong>{p.appearances}</strong>
        </div>
        <div>
          <span>Doelpunten</span>
          <strong>{p.goals}</strong>
        </div>
        <div>
          <span>Assists</span>
          <strong>{p.assists}</strong>
        </div>
      </div>
      {own ? (
        <>
          <h3>Speler beheren</h3>
          <Field label="Trainingsfocus">
            <select
              value={p.focus}
              disabled={busy}
              onChange={(e) =>
                act((w) => train(w, id, e.target.value as Focus))
              }
            >
              {["balanced", "passing", "finishing", "defending", "fitness"].map(
                (f, i) => (
                  <option key={f} value={f}>
                    {
                      [
                        "Allround",
                        "Passing",
                        "Afwerken",
                        "Verdedigen",
                        "Fitheid",
                      ][i]
                    }
                  </option>
                ),
              )}
            </select>
          </Field>
          {p.youth ? (
            <button
              className="primary wide"
              onClick={() => act((w) => promote(w, id))}
            >
              Doorschuiven naar het eerste elftal
            </button>
          ) : (
            <div className="button-grid">
              <button
                disabled={busy || !eligible(p, w)}
                onClick={() =>
                  act((w) =>
                    edit(w, (n) => {
                      const c = n.clubs.find((c) => c.id === n.club)!;
                      if (c.tactic.lineup.includes(id)) return;
                      const index = c.tactic.lineup.findIndex(
                        (pid) =>
                          n.players.find((p) => p.id === pid)?.position ===
                          p.position,
                      );
                      if (index < 0)
                        throw new Error("Pas je opstelling aan via Tactiek.");
                      const old = c.tactic.lineup[index];
                      c.tactic.lineup[index] = id;
                      c.tactic.bench = c.tactic.bench.filter((x) => x !== id);
                      c.tactic.bench.push(old);
                    }),
                  )
                }
              >
                Zet in de basis
              </button>
              <button
                disabled={busy}
                onClick={() => act((w) => listPlayer(w, id))}
              >
                {p.listed ? "Van transferlijst" : "Op transferlijst"}
              </button>
              <button
                disabled={busy}
                onClick={() => act((w) => listPlayer(w, id, true))}
              >
                {p.loanListed ? "Niet meer verhuren" : "Te huur aanbieden"}
              </button>
            </div>
          )}
          <h3>Contract verlengen</h3>
        </>
      ) : (
        <>
          <h3>Een bod uitbrengen</h3>
          <Field label="Transfersom (€)">
            <input
              type="number"
              min={0}
              step={1000}
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
            />
          </Field>
          <Field label="Overgang">
            <select
              value={loan ? "loan" : "buy"}
              onChange={(e) => setLoan(e.target.value === "loan")}
            >
              <option value="buy">Definitieve transfer</option>
              <option value="loan">Huur tot volgend seizoen</option>
            </select>
          </Field>
        </>
      )}
      <div className="form-grid">
        <Field label="Salaris per week (€)">
          <input
            type="number"
            min={1}
            value={wage}
            onChange={(e) => setWage(Number(e.target.value))}
          />
        </Field>
        <Field label="Contractduur">
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                {y} jaar
              </option>
            ))}
          </select>
        </Field>
      </div>
      <button
        className="primary wide"
        disabled={busy}
        onClick={() =>
          act((w) =>
            own
              ? renewContract(w, id, wage, years)
              : offerTransfer(
                  w,
                  id,
                  fee,
                  wage,
                  years,
                  crypto.randomUUID(),
                  loan ? "loan" : "buy",
                ),
          )
        }
      >
        {own ? "Contract aanbieden" : "Bod versturen"}
      </button>
      {!own ? (
        <button
          className="wide"
          disabled={busy}
          onClick={() => act((w) => scout(w, id))}
        >
          Scoutingopdracht starten · € 2.500
        </button>
      ) : null}
      {p.development.length ? (
        <>
          <h3>Ontwikkeling</h3>
          <p>
            {p.development
              .slice(-5)
              .map((x) => `${fullDate(x.day)}: ${x.ability.toFixed(1)}`)
              .join(" · ")}
          </p>
        </>
      ) : null}
      {p.history.length ? (
        <>
          <h3>Loopbaan</h3>
          {p.history.slice(-5).map((h) => (
            <div className="row" key={`${h.season}-${h.club}`}>
              <span>
                {h.season} · {cname(w, h.club)}
              </span>
              <span>
                {h.appearances} duels · {h.goals} goals
              </span>
            </div>
          ))}
        </>
      ) : null}
    </Sheet>
  );
}
export default function Squad({ youth = false }: { youth?: boolean }) {
  const { world: w } = useGame();
  const [query, setQuery] = useState(""),
    [position, setPosition] = useState("all"),
    [sort, setSort] = useState("ability"),
    [selected, setSelected] = useState<string | null>(null);
  if (!w) return null;
  const players = squad(w, w.club)
    .filter(
      (p) =>
        p.youth === youth &&
        p.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
        (position === "all" || p.position === position),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "age"
          ? a.born.localeCompare(b.born)
          : sort === "value"
            ? b.value - a.value
            : sort === "fitness"
              ? b.fitness - a.fitness
              : sort === "contract"
                ? a.contractUntil - b.contractUntil
                : sort === "potential"
                  ? b.potential - a.potential
                  : b.ability - a.ability,
    );
  return (
    <>
      <Heading title={youth ? "De volgende generatie" : "Jouw selectie"}>
        <span>{players.length} spelers</span>
      </Heading>
      <div className="filters">
        <input
          aria-label="Speler zoeken"
          placeholder="Zoek een speler…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Positie filteren"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="all">Alle posities</option>
          {["GK", "DEF", "MID", "ATT"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select
          aria-label="Sorteren"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {[
            "ability",
            "name",
            "age",
            "value",
            "fitness",
            "potential",
            "contract",
          ].map((s, i) => (
            <option key={s} value={s}>
              {
                [
                  "Kwaliteit",
                  "Naam",
                  "Leeftijd",
                  "Waarde",
                  "Fitheid",
                  "Potentieel",
                  "Contract",
                ][i]
              }
            </option>
          ))}
        </select>
      </div>
      <div className="list-caption">
        <span>Speler / positie</span>
        <span>Fitheid · kwaliteit</span>
      </div>
      {players.map((p) => (
        <PlayerRow key={p.id} p={p} w={w} onClick={() => setSelected(p.id)} />
      ))}
      {!players.length ? (
        <Empty title="Geen spelers gevonden">
          Pas je zoekopdracht of positiefilter aan.
        </Empty>
      ) : null}
      {selected ? (
        <PlayerSheet id={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
