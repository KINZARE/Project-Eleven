"use client";
import {
  ArrowRight,
  CalendarDays,
  HeartPulse,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useGame } from "./store";
import { nextFixture } from "../domain/progression";
import { squad } from "../domain/world";
import { table } from "../domain/competition";
import { cname, ClubMark, fullDate, Heading, Row, euro } from "./shared";
export default function Home({ onContinue }: { onContinue: () => void }) {
  const { world: w, setScreen, busy } = useGame();
  if (!w) return null;
  const club = w.clubs.find((c) => c.id === w.club)!;
  const next = nextFixture(w),
    position = table(w, club.league).findIndex((r) => r.club === w.club) + 1;
  const players = squad(w, w.club).filter((p) => !p.youth);
  const injured = players.filter(
    (p) => p.injuredUntil > w.day || p.suspended > 0,
  );
  const unread = w.messages.filter((m) => !m.read);
  const last = w.fixtures
    .filter((f) => f.result && (f.home === w.club || f.away === w.club))
    .slice(-5);
  return (
    <>
      <Heading title={`Goed bezig, ${w.manager.split(" ")[0]}.`}>
        <span className="date">{fullDate(w.day)}</span>
      </Heading>
      <div className="home-grid">
        <section className="match-feature">
          <div className="section-line">
            <span>
              {next?.cup
                ? "Nationale Beker"
                : w.leagues.find((l) => l.id === club.league)?.name}
            </span>
            <span>
              {next
                ? `${next.day - w.day} dagen tot aftrap`
                : "Seizoen voltooid"}
            </span>
          </div>
          {next ? (
            <>
              <div className="versus">
                <div>
                  <ClubMark w={w} id={next.home} large />
                  <strong>{cname(w, next.home)}</strong>
                </div>
                <span className="vs">vs</span>
                <div>
                  <ClubMark w={w} id={next.away} large />
                  <strong>{cname(w, next.away)}</strong>
                </div>
              </div>
              <p className="match-date">
                <CalendarDays size={16} />
                {fullDate(next.day)} ·{" "}
                {next.home === w.club ? "Thuiswedstrijd" : "Uitwedstrijd"}
              </p>
            </>
          ) : (
            <div className="empty">
              <h2>De laatste fluit heeft geklonken.</h2>
              <p>Tijd voor de volgende uitdaging.</p>
            </div>
          )}
          <button className="primary wide" onClick={onContinue} disabled={busy}>
            {next && next.day <= w.day
              ? "Naar de wedstrijd"
              : next
                ? "Doorgaan"
                : "Volgend seizoen"}
            <ArrowRight size={19} />
          </button>
        </section>
        <section className="club-pulse">
          <h2>De stand van je club</h2>
          <dl>
            <div>
              <dt>Competitiepositie</dt>
              <dd>
                {position}
                <small> / 8</small>
              </dd>
            </div>
            <div>
              <dt>Bestuursvertrouwen</dt>
              <dd>
                {Math.round(w.confidence)}
                <small>%</small>
              </dd>
            </div>
            <div>
              <dt>Beschikbaar saldo</dt>
              <dd className="money">{euro(club.balance)}</dd>
            </div>
          </dl>
          <button
            className="text-button"
            onClick={() => setScreen("competition")}
          >
            Bekijk de competitie <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <section className="section">
        <div className="section-line">
          <h2>Vandaag op jouw bureau</h2>
          <span>{unread.length} ongelezen</span>
        </div>
        <Row onClick={() => setScreen("squad")}>
          <HeartPulse size={20} />
          <span>
            <strong>
              {injured.length
                ? `${injured.length} spelers niet inzetbaar`
                : "Je selectie is beschikbaar"}
            </strong>
            <small>
              Gemiddeld{" "}
              {Math.round(
                players.reduce((s, p) => s + p.fitness, 0) / players.length,
              )}
              % fit · bekijk de selectie
            </small>
          </span>
        </Row>
        <Row onClick={() => setScreen("tactics")}>
          <ShieldCheck size={20} />
          <span>
            <strong>
              {club.tactic.formation} ·{" "}
              {club.tactic.mentality === "attacking"
                ? "Aanvallend"
                : club.tactic.mentality === "defensive"
                  ? "Verdedigend"
                  : "Gebalanceerd"}
            </strong>
            <small>{club.tactic.lineup.length} basisspelers geselecteerd</small>
          </span>
        </Row>
        {unread.slice(0, 3).map((m) => (
          <Row key={m.id} onClick={() => setScreen("inbox")}>
            <Mail size={20} />
            <span>
              <strong>{m.title}</strong>
              <small>{m.body}</small>
            </span>
          </Row>
        ))}
      </section>
      {last.length ? (
        <section className="section">
          <h2>Recente wedstrijden</h2>
          {last.reverse().map((f) => (
            <Row key={f.id} onClick={() => setScreen("competition")}>
              <span>
                {cname(w, f.home)} — {cname(w, f.away)}
              </span>
              <strong>
                {f.result!.home}–{f.result!.away}
              </strong>
            </Row>
          ))}
        </section>
      ) : null}
    </>
  );
}
