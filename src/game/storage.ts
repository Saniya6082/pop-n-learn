import type { ProgressData } from "./types";

const KEY = "bpg.progress.v1";
const AUDIO_KEY = "bpg.audio.v1";

const empty: ProgressData = { unlocked: {}, stars: {}, bestScore: {} };

export function loadProgress(): ProgressData {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch { return empty; }
}

export function saveProgress(p: ProgressData) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function recordLevel(p: ProgressData, key: string, level: number, stars: number, score: number): ProgressData {
  const next: ProgressData = {
    unlocked: { ...p.unlocked },
    stars: { ...p.stars },
    bestScore: { ...p.bestScore },
  };
  const arr = [...(next.stars[key] ?? [])];
  arr[level - 1] = Math.max(arr[level - 1] ?? 0, stars);
  next.stars[key] = arr;
  next.unlocked[key] = Math.max(next.unlocked[key] ?? 1, Math.min(5, level + 1));
  const totalScoreKey = `${key}.L${level}`;
  next.bestScore[totalScoreKey] = Math.max(next.bestScore[totalScoreKey] ?? 0, score);
  saveProgress(next);
  return next;
}

export function loadAudio(): { muted: boolean } {
  if (typeof window === "undefined") return { muted: false };
  try { return JSON.parse(localStorage.getItem(AUDIO_KEY) || '{"muted":false}'); }
  catch { return { muted: false }; }
}
export function saveAudio(s: { muted: boolean }) {
  try { localStorage.setItem(AUDIO_KEY, JSON.stringify(s)); } catch {}
}

export function totalStars(p: ProgressData): number {
  let n = 0;
  for (const k in p.stars) for (const s of p.stars[k]) n += s || 0;
  return n;
}
export function bestOverall(p: ProgressData): number {
  let n = 0;
  for (const k in p.bestScore) if (p.bestScore[k] > n) n = p.bestScore[k];
  return n;
}
