"use client";
import type { ReactNode } from "react";
import { X, ArrowRight } from "lucide-react";
import type { World, Player } from "../domain/model";
import { date, age } from "../domain/model";
import { useEffect, useRef } from "react";
export const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    notation: Math.abs(n) > 999999 ? "compact" : "standard",
  }).format(n);
export const fullDate = (day: number) =>
  new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date(day)));
export const cname = (w: World, id: string | null) =>
  w.clubs.find((c) => c.id === id)?.name || "Transfervrij";
export function ClubMark({
  w,
  id,
  large = false,
}: {
  w: World;
  id: string;
  large?: boolean;
}) {
  const c = w.clubs.find((c) => c.id === id)!;
  return (
    <span
      className={`club-mark ${large ? "large" : ""}`}
      style={{ color: c?.color }}
      aria-hidden="true"
    >
      {c?.short}
    </span>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
export function Heading({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      {children}
    </div>
  );
}
export function Row({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return onClick ? (
    <button className="row row-button" onClick={onClick}>
      {children}
      <ArrowRight size={17} />
    </button>
  ) : (
    <div className="row">{children}</div>
  );
}
export function PlayerRow({
  p,
  w,
  onClick,
  detail,
}: {
  p: Player;
  w: World;
  onClick: () => void;
  detail?: string;
}) {
  const unavailable =
    p.injuredUntil > w.day
      ? "Geblesseerd"
      : p.suspended
        ? "Geschorst"
        : p.youth
          ? "Jeugd"
          : null;
  return (
    <button className="player-row" onClick={onClick}>
      <span className="shirt">{p.number}</span>
      <span className="player-name">
        <strong>{p.name}</strong>
        <small>
          {p.position} · {age(p, w.day)} jaar{" "}
          {unavailable ? `· ${unavailable}` : ""}
        </small>
      </span>
      <span className="player-detail">
        {detail || `${Math.round(p.fitness)}% fit`}
      </span>
      <span className="rating">{Math.round(p.ability)}</span>
    </button>
  );
}
export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet-inner">
        <header>
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Sluiten"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
