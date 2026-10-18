"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Home as HomeIcon,
  Users,
  ChartNoAxesColumn,
  ArrowLeftRight,
  Menu,
  X,
  ArrowRight,
  NotebookPen,
  ClipboardList,
  Wallet,
  Search,
  CalendarDays,
  HeartPulse,
  GraduationCap,
  Save,
  UserRound,
  Mail,
  Settings2,
} from "lucide-react";
import { useGame } from "./store";
import Onboarding from "./Onboarding";
import Home from "./Home";
import Squad from "./Squad";
import Tactics from "./Tactics";
import {
  Transfers,
  Competition,
  Finances,
  Staff,
  Training,
  Scouting,
  Inbox,
  Manager,
} from "./Management";
import Saves from "./Saves";
import { advanceDay, due, nextSeason } from "../domain/progression";
import { fullDate, ClubMark } from "./shared";
const Match = dynamic(() => import("./Match"), {
  ssr: false,
  loading: () => <p className="subtle">Het stadion wordt voorbereid…</p>,
});
const nav = [
  { id: "home", name: "Clubhuis", icon: HomeIcon },
  { id: "squad", name: "Selectie", icon: Users },
  { id: "match", name: "Wedstrijd", icon: CalendarDays },
  { id: "transfers", name: "Transfers", icon: ArrowLeftRight },
  { id: "more", name: "Meer", icon: Menu },
];
const more = [
  { id: "tactics", name: "Tactiek", icon: ClipboardList },
  { id: "competition", name: "Competities", icon: ChartNoAxesColumn },
  { id: "scouting", name: "Scouting", icon: Search },
  { id: "training", name: "Training", icon: HeartPulse },
  { id: "youth", name: "Jeugd", icon: GraduationCap },
  { id: "finances", name: "Financiën", icon: Wallet },
  { id: "staff", name: "Staf", icon: Users },
  { id: "inbox", name: "Inbox", icon: Mail },
  { id: "manager", name: "Manager", icon: UserRound },
  { id: "saves", name: "Savegames", icon: Save },
];
export default function App() {
  const {
    world: w,
    screen,
    setScreen,
    boot,
    ready,
    busy,
    error,
    clear,
    change,
    install,
    fail,
  } = useGame();
  const [progress, setProgress] = useState<{
      done: number;
      total: number;
    } | null>(null),
    [update, setUpdate] = useState<ServiceWorker | null>(null);
  const batch = useRef<Worker | null>(null);
  useEffect(() => {
    boot();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (reg.waiting) setUpdate(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (
                worker.state === "installed" &&
                navigator.serviceWorker.controller
              )
                setUpdate(worker);
            });
          });
        })
        .catch(() => {});
    }
    return () => batch.current?.terminate();
  }, [boot]);
  async function continuing() {
    if (!w || busy || progress) return;
    if (w.activeMatch) {
      setScreen("match");
      return;
    }
    const pending = due(w);
    if (pending.some((f) => f.home === w.club || f.away === w.club)) {
      setScreen("match");
      return;
    }
    if (pending.length) {
      const worker = new Worker(
        new URL("../workers/simulation.ts", import.meta.url),
      );
      batch.current = worker;
      setProgress({ done: 0, total: pending.length });
      const timeout = setTimeout(() => {
        worker.terminate();
        setProgress(null);
        fail(
          "De speelronde duurt te lang. Je vorige save is veilig. Probeer opnieuw.",
        );
      }, 120000);
      worker.onmessage = async (e) => {
        const m = e.data;
        if (m.type === "progress")
          setProgress({ done: m.done, total: m.total });
        if (m.type === "batchDone") {
          clearTimeout(timeout);
          worker.terminate();
          batch.current = null;
          setProgress(null);
          try {
            await install(m.world);
          } catch {}
        }
        if (m.type === "error") {
          clearTimeout(timeout);
          worker.terminate();
          batch.current = null;
          setProgress(null);
          fail(m.message);
        }
      };
      worker.onerror = () => {
        clearTimeout(timeout);
        worker.terminate();
        setProgress(null);
        fail("Simulatie onderbroken. Probeer de speelronde opnieuw.");
      };
      worker.postMessage({
        type: "batch",
        world: w,
        fixtures: pending.map((f) => f.id),
      });
      return;
    }
    try {
      if (
        w.fixtures.filter((f) => f.season === w.season).every((f) => f.result)
      )
        await change((w) => nextSeason(w, `season-${w.season}`));
      else {
        await change((w) => advanceDay(w, `day-${w.day + 1}`));
        const n = useGame.getState().world!;
        if (due(n).some((f) => f.home === n.club || f.away === n.club))
          setScreen("match");
      }
    } catch {}
  }
  if (!ready)
    return (
      <main className="boot">
        <span className="brand-symbol">XI</span>
        <h1>Project Eleven</h1>
        <p>Je carrières worden geopend…</p>
        <button
          onClick={() => {
            useGame.setState({ ready: true });
            boot();
          }}
        >
          Opnieuw proberen
        </button>
      </main>
    );
  if (!w) return <Onboarding />;
  const c = w.clubs.find((c) => c.id === w.club)!;
  let content;
  switch (screen) {
    case "home":
      content = <Home onContinue={continuing} />;
      break;
    case "squad":
      content = <Squad />;
      break;
    case "tactics":
      content = <Tactics />;
      break;
    case "match":
      content = <Match />;
      break;
    case "transfers":
      content = <Transfers />;
      break;
    case "competition":
      content = <Competition />;
      break;
    case "finances":
      content = <Finances />;
      break;
    case "staff":
      content = <Staff />;
      break;
    case "training":
      content = <Training />;
      break;
    case "scouting":
      content = <Scouting />;
      break;
    case "youth":
      content = <Squad youth />;
      break;
    case "inbox":
      content = <Inbox />;
      break;
    case "manager":
      content = <Manager />;
      break;
    case "saves":
      content = <Saves />;
      break;
    default:
      content = (
        <>
          <div className="page-heading">
            <h1>Jouw club, van binnenuit.</h1>
          </div>
          <div className="more-menu">
            {more.map((n) => (
              <button key={n.id} onClick={() => setScreen(n.id)}>
                <n.icon size={22} />
                <span>{n.name}</span>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
        </>
      );
  }
  return (
    <div className="game-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setScreen("home")}>
          <span className="brand-symbol">XI</span>
          <span>
            PROJECT
            <br />
            ELEVEN
          </span>
        </button>
        <div className="sidebar-club">
          <ClubMark w={w} id={w.club} />
          <strong>{c.name}</strong>
        </div>
        <nav aria-label="Hoofdnavigatie desktop">
          {[...nav.filter((n) => n.id !== "more"), ...more].map((n) => (
            <button
              key={n.id}
              aria-current={screen === n.id ? "page" : undefined}
              onClick={() => setScreen(n.id)}
            >
              <n.icon size={19} />
              {n.name}
              {n.id === "inbox" && w.messages.some((m) => !m.read) ? (
                <span className="unread-dot" />
              ) : null}
            </button>
          ))}
        </nav>
        <span className="sidebar-footer">
          Seizoen {w.season}
          <br />
          Fictieve ontwikkelwereld
        </span>
      </aside>
      <div className="main-shell">
        <header className="app-header">
          <button className="header-club" onClick={() => setScreen("home")}>
            <ClubMark w={w} id={w.club} />
            <span>
              {c.name}
              <small>{fullDate(w.day)}</small>
            </span>
          </button>
          <div className="header-actions">
            <span className="save-status" aria-live="polite">
              {busy ? "Opslaan…" : "Opgeslagen"}
            </span>
            <button
              className="icon-button"
              aria-label="Inbox openen"
              onClick={() => setScreen("inbox")}
            >
              <Mail size={20} />
            </button>
            {screen !== "match" ? (
              <button
                className="primary continue-small"
                disabled={busy || Boolean(progress)}
                onClick={continuing}
              >
                Doorgaan <ArrowRight size={18} />
              </button>
            ) : null}
          </div>
        </header>
        {update ? (
          <div className="update-banner">
            Een nieuwe spelversie is beschikbaar. Je save blijft bewaard.
            <button
              onClick={() => {
                navigator.serviceWorker.addEventListener(
                  "controllerchange",
                  () => location.reload(),
                  { once: true },
                );
                update.postMessage({ type: "ACTIVATE" });
              }}
            >
              Bijwerken
            </button>
          </div>
        ) : null}
        {w.provenance.type === "fictional" ? (
          <div className="dev-notice">
            Ontwikkelwereld met fictieve spelers en clubs
          </div>
        ) : null}
        {error ? (
          <div className="alert" role="alert">
            <span>{error}</span>
            <button
              className="icon-button"
              aria-label="Melding sluiten"
              onClick={clear}
            >
              <X size={19} />
            </button>
          </div>
        ) : null}
        <main className="game-content" id="main-content">
          {content}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Hoofdnavigatie mobiel">
        {nav.map((n) => (
          <button
            key={n.id}
            aria-current={
              screen === n.id ||
              (n.id === "more" && more.some((x) => x.id === screen))
                ? "page"
                : undefined
            }
            onClick={() => setScreen(n.id)}
          >
            <n.icon size={21} />
            <span>{n.name}</span>
          </button>
        ))}
      </nav>
      {progress ? (
        <div className="processing" role="status" aria-live="polite">
          <div>
            <h2>De speelronde wordt gespeeld</h2>
            <p>
              {progress.done} van {progress.total} wedstrijden afgerond
            </p>
            <progress value={progress.done} max={progress.total} />
            <button
              onClick={() => {
                batch.current?.terminate();
                batch.current = null;
                setProgress(null);
              }}
            >
              Annuleren · vorige save behouden
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
