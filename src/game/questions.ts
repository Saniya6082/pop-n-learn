import type { ModeConfig, LevelConfig } from "./types";

export interface Question {
  prompt: string;   // shown on target card
  answer: string;   // correct balloon label
  pool: string[];   // distractor pool (may include the answer)
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const WORDS = [
  "CAT","DOG","SUN","BOOK","BALL","FISH","BIRD","TREE","STAR","MOON",
  "CAR","BUS","CUP","HAT","MILK","CAKE","FROG","LION","BEAR","DUCK",
  "RAIN","SNOW","LEAF","ROSE","KITE","SHIP","FROG","GOLD","WIND","ROCK",
];
const CONFUSABLES: Record<string, string[]> = {
  O: ["Q","0","C","D"], Q: ["O","0","G"], I: ["L","1","T","J"], L: ["I","1","J","T"],
  B: ["R","8","E","P"], R: ["B","P","K"], S: ["5","Z","8"], "5": ["S","6","2"],
  "8": ["B","3","0"], "0": ["O","Q","8","6"], "1": ["I","L","7"], "6": ["9","0","8"],
  "9": ["6","0","8"], W: ["M","V","N"], M: ["W","N","H"], N: ["M","H","V"],
  E: ["F","B","P"], F: ["E","T","P"], P: ["F","R","B"], U: ["V","O"], V: ["U","Y","W"],
  C: ["G","O","Q"], G: ["C","Q","O"], Y: ["V","T","X"],
};

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function distractorsForLetter(answer: string, challenge: boolean): string[] {
  if (challenge && CONFUSABLES[answer]) {
    const base = [...CONFUSABLES[answer], ...ALPHABET];
    return Array.from(new Set(base.filter(x => x !== answer)));
  }
  return ALPHABET.filter(x => x !== answer);
}

function nearbyNumbers(n: number, min: number, max: number, count = 12): string[] {
  const set = new Set<number>();
  let tries = 0;
  while (set.size < count && tries < 80) {
    const delta = randInt(1, Math.max(3, Math.floor((max - min) / 6)));
    const sign = Math.random() < 0.5 ? -1 : 1;
    const v = n + sign * delta;
    if (v >= min && v <= max && v !== n) set.add(v);
    tries++;
  }
  // also include random values in range
  while (set.size < count) {
    const v = randInt(min, max);
    if (v !== n) set.add(v);
  }
  return Array.from(set).map(String);
}

export function generateQuestion(mode: ModeConfig, level: LevelConfig): Question {
  const challenge = level.challenge;
  if (mode.category === "english") {
    if (mode.english === "letters") {
      const answer = rand(ALPHABET);
      return { prompt: answer, answer, pool: distractorsForLetter(answer, challenge) };
    }
    const answer = rand(WORDS);
    return { prompt: answer, answer, pool: WORDS.filter(w => w !== answer) };
  }
  // math
  const r = mode.range ?? { label: "1-10", min: 1, max: 10 };
  if (mode.math === "numbers") {
    const n = randInt(r.min, r.max);
    return { prompt: String(n), answer: String(n), pool: nearbyNumbers(n, r.min, r.max) };
  }
  let a: number, b: number, ans: number, op: string;
  switch (mode.math) {
    case "add":
      a = randInt(r.min, r.max); b = randInt(r.min, r.max);
      ans = a + b; op = "+"; break;
    case "sub":
      a = randInt(r.min, r.max); b = randInt(r.min, Math.min(a, r.max));
      ans = a - b; op = "−"; break;
    case "mul":
      a = randInt(r.min, r.max); b = randInt(r.min, r.max);
      ans = a * b; op = "×"; break;
    case "div": {
      b = randInt(Math.max(1, r.min), r.max);
      const q = randInt(r.min, r.max);
      a = b * q; ans = q; op = "÷"; break;
    }
    default:
      a = 1; b = 1; ans = 2; op = "+";
  }
  const lo = Math.max(0, ans - Math.max(5, Math.floor(ans * 0.4)));
  const hi = ans + Math.max(5, Math.floor(ans * 0.4) + 5);
  return { prompt: `${a} ${op} ${b}`, answer: String(ans), pool: nearbyNumbers(ans, lo, hi) };
}
