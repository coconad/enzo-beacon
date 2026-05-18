import { STAGE_FIT, SIGNAL_WEIGHT } from '../data/seed.js';

export const TODAY = new Date("2026-05-18");

export function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function daysSince(d) {
  const dt = new Date(d);
  return Math.max(0, Math.round((TODAY - dt) / 86400000));
}

export function freshness(d) {
  return Math.exp(-daysSince(d) / 18);
}

export function scoreFor(r, weights) {
  const f = freshness(r.signalDate);
  const s = STAGE_FIT[r.stage] ?? 0.5;
  const g = r.soeu ? 1.0 : 0.35;
  const q = SIGNAL_WEIGHT[r.signalType] ?? 0.6;
  return Math.round((f * weights.fresh + s * weights.stage + g * weights.soeu + q * weights.signal));
}

export function stageTone(stage) {
  if (stage === "Pre-seed" || stage === "Stealth") return "olive";
  if (stage === "Seed" || stage === "Seed extension") return "gold";
  if (stage === "Series A") return "sea";
  return "";
}

export function signalTone(s) {
  if (s === "Funding") return "gold";
  if (s === "Stealth exit") return "accent";
  if (s === "Career move") return "olive";
  if (s === "Launch") return "sea";
  return "";
}

export function isEarliest(r) {
  return r.stage === "Stealth" || r.stage === "Pre-seed";
}

export function normaliseStatus(s) {
  if (!s) return "New";
  const KSTAGES = ["New", "Researching", "Reached out", "Meeting", "Pass"];
  const m = { "Reached Out": "Reached out", "Active": "Meeting" };
  return KSTAGES.includes(s) ? s : (m[s] || "New");
}
