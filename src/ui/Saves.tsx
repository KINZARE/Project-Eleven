"use client";
import { useState, useRef } from "react";
import { Download, Upload, RotateCcw, Trash2, Plus } from "lucide-react";
import { useGame } from "./store";
import { edit } from "../domain/management";
import { exportSave, parseSave, deleteSave } from "../persistence/saves";
import { parseDataset, applyDataset } from "../domain/import";
import { Heading, Field, euro } from "./shared";
function download(data: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([data], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export default function Saves() {
  const {
    world: w,
    slots,
    change,
    install,
    resume,
    refresh,
    busy,
    fail,
  } = useGame();
  const [name, setName] = useState(w?.name || "");
  const input = useRef<HTMLInputElement>(null),
    dataInput = useRef<HTMLInputElement>(null);
  if (!w) return null;
  async function importSave(file: File) {
    try {
      if (file.size > 30 * 1024 * 1024)
        throw new Error("Dit bestand is te groot (maximaal 30 MB).");
      const n = await parseSave(await file.text());
      n.id = `career-${crypto.randomUUID()}`;
      n.revision = 0;
      n.name += " · import";
      await install(n);
    } catch (e) {
      fail(e instanceof Error ? e.message : "Importeren mislukt.");
    }
  }
  async function importData(file: File) {
    try {
      if (file.size > 20e6) throw new Error("Dataset is te groot.");
      const dataset = parseDataset(
        await file.text(),
        file.name.endsWith(".csv") ? "csv" : "json",
      );
      await change((w) => applyDataset(w, dataset));
    } catch (e) {
      fail(e instanceof Error ? e.message : "Dataset importeren mislukt.");
    }
  }
  return (
    <>
      <Heading title="Je carrière bewaren" />
      <p className="subtle">
        Je voortgang wordt na elke actie opgeslagen op dit apparaat. Exporteer
        regelmatig een reservekopie; lokale saves synchroniseren niet tussen
        apparaten.
      </p>
      <Field label="Naam van de carrière">
        <input
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <button
        className="primary"
        disabled={busy || !name.trim()}
        onClick={() =>
          change((w) =>
            edit(w, (n) => {
              n.name = name.trim();
            }),
          )
            .then(refresh)
            .catch(() => {})
        }
      >
        Naam bewaren en opslaan
      </button>
      <div className="button-grid section">
        <button
          onClick={() =>
            exportSave(w)
              .then((s) => download(s, `project-eleven-${w.season}.json`))
              .catch((e) => fail(e.message))
          }
        >
          <Download size={18} /> Save exporteren
        </button>
        <button onClick={() => input.current?.click()}>
          <Upload size={18} /> Save importeren
        </button>
        <button
          onClick={() => {
            useGame.setState({ world: null, screen: "home" });
            refresh();
          }}
        >
          <Plus size={18} /> Nieuwe carrière
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importSave(f);
          e.target.value = "";
        }}
      />
      <section className="section">
        <h2>Opgeslagen carrières</h2>
        {slots.map((s) => (
          <div className="save-row" key={s.id}>
            <button disabled={busy} onClick={() => resume(s.id)}>
              <span>
                {s.name}
                <small>{new Date(s.updated).toLocaleString("nl-NL")}</small>
              </span>
            </button>
            <button
              className="icon-button"
              aria-label={`Herstel ${s.name}`}
              onClick={() => {
                if (
                  confirm(
                    "Herstel de vorige versie? Je huidige save blijft als reserve beschikbaar.",
                  )
                )
                  resume(s.id, true);
              }}
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="icon-button"
              aria-label={`Verwijder ${s.name}`}
              onClick={() => {
                if (confirm(`Carrière ${s.name} definitief verwijderen?`))
                  deleteSave(s.id)
                    .then(() => {
                      if (s.id === w.id) useGame.setState({ world: null });
                      refresh();
                    })
                    .catch((e) => fail(e.message));
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </section>
      <section className="section">
        <h2>Jouw spelersdatabase</h2>
        <p>
          Huidige bron: <strong>{w.provenance.source}</strong> · versie{" "}
          {w.provenance.version}
        </p>
        <p className="subtle">
          Importeer alleen een dataset die je mag gebruiken. Vereist:
          externalId, name, club en position (GK, DEF, MID, ATT). Gebruik de
          club-ID’s uit de mapping. Iedere club heeft minimaal 18 spelers en 2
          keepers nodig. Een dataset kan alleen worden ingeladen voordat een
          carrière wedstrijden heeft gespeeld.
        </p>
        <div className="button-grid">
          <button
            onClick={() =>
              download(
                JSON.stringify(
                  {
                    source: "Naam van jouw gelicentieerde bron",
                    version: "1",
                    clubs: w.clubs.map((c) => ({ id: c.id, name: c.name })),
                    requiredPlayerFields: {
                      externalId: "provider-id",
                      name: "Spelersnaam",
                      club: w.club,
                      position: "MID",
                      born: "2000-01-01",
                    },
                  },
                  null,
                  2,
                ),
                "project-eleven-import-mapping.json",
              )
            }
          >
            Mapping downloaden
          </button>
          <button
            disabled={
              busy || Boolean(w.activeMatch) || w.fixtures.some((f) => f.result)
            }
            onClick={() => dataInput.current?.click()}
          >
            CSV / JSON inladen
          </button>
        </div>
        <input
          ref={dataInput}
          type="file"
          hidden
          accept=".csv,.json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
            e.target.value = "";
          }}
        />
        <p className="micro">
          Ontbrekende attributen, waardes en salarissen worden als speldata
          berekend. Clubnamen en competitie-indeling in deze ontwikkelversie
          zijn fictief.
        </p>
      </section>
      <section className="section">
        <h2>Over Project Eleven</h2>
        <a href="/third-party-notices.txt" target="_blank" rel="noreferrer">
          Open-source licenties
        </a>
        <p>Ontwikkelversie 0.1.0 · {w.engineVersion}</p>
        <p className="subtle">
          Met de MIT football-simulator van Tobias Bleckert. Geen officiële
          Football Manager-game. Cloudopslag is niet ingeschakeld.
        </p>
      </section>
    </>
  );
}
