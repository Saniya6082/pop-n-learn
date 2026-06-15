export type Category = "english" | "math";
export type EnglishMode = "letters" | "words";
export type MathMode = "numbers" | "add" | "sub" | "mul" | "div";
export type Range = { label: string; min: number; max: number };

export interface ModeConfig {
  category: Category;
  english?: EnglishMode;
  math?: MathMode;
  range?: Range;
}

export interface LevelConfig {
  level: number;        // 1..5
  goal: number;         // correct pops to clear
  lives: number;
  spawnEveryMs: number; // spawn interval
  riseDurationMs: number; // time to cross screen
  maxOnScreen: number;
  challenge: boolean;   // similar-looking distractors
}

export const LEVELS: LevelConfig[] = [
  { level: 1, goal: 10, lives: 5, spawnEveryMs: 1500, riseDurationMs: 11000, maxOnScreen: 4, challenge: false },
  { level: 2, goal: 15, lives: 5, spawnEveryMs: 1300, riseDurationMs: 9500,  maxOnScreen: 5, challenge: false },
  { level: 3, goal: 20, lives: 4, spawnEveryMs: 1100, riseDurationMs: 8500,  maxOnScreen: 6, challenge: true  },
  { level: 4, goal: 25, lives: 4, spawnEveryMs: 950,  riseDurationMs: 7500,  maxOnScreen: 7, challenge: true  },
  { level: 5, goal: 30, lives: 3, spawnEveryMs: 800,  riseDurationMs: 6500,  maxOnScreen: 8, challenge: true  },
];

export interface ProgressData {
  // per modeKey -> highest unlocked level and stars[1..5]
  unlocked: Record<string, number>;
  stars: Record<string, number[]>;
  bestScore: Record<string, number>;
}

export const modeKey = (m: ModeConfig): string => {
  if (m.category === "english") return `english.${m.english}`;
  const r = m.range ? `.${m.range.min}-${m.range.max}` : "";
  return `math.${m.math}${r}`;
};

export const modeTitle = (m: ModeConfig): string => {
  if (m.category === "english") return m.english === "letters" ? "Letters" : "Words";
  const map: Record<MathMode, string> = { numbers: "Numbers", add: "Addition", sub: "Subtraction", mul: "Multiplication", div: "Division" };
  const base = map[m.math!];
  return m.range ? `${base} ${m.range.label}` : base;
};
