import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { LEVELS, modeKey, modeTitle, type LevelConfig, type ModeConfig, type ProgressData, type Range } from "./types";
import { generateQuestion, type Question } from "./questions";
import { audio } from "./audio";
import { loadProgress, recordLevel, loadAudio, saveAudio, totalStars, bestOverall } from "./storage";
import { SplashScreen } from "./SplashScreen";


type Screen =
  | { name: "splash" }
  | { name: "home" }
  | { name: "english" }
  | { name: "math" }
  | { name: "numRange" }
  | { name: "opRange"; op: "add" | "sub" | "mul" | "div" }
  | { name: "levels"; mode: ModeConfig }
  | { name: "play"; mode: ModeConfig; level: number }
  | { name: "complete"; mode: ModeConfig; level: number; score: number; stars: number }
  | { name: "gameover"; mode: ModeConfig; level: number; score: number }
  | { name: "victory"; mode: ModeConfig; score: number };

const BALLOON_COLORS = [
  "#ff5e7e","#ffb84d","#ffe24a","#7be07b","#4dc0ff","#9b6bff","#ff8acb","#5ee0c5",
];

const RANGES_NUM: Range[] = [
  { label: "1-10", min: 1, max: 10 },
  { label: "1-30", min: 1, max: 30 },
  { label: "1-50", min: 1, max: 50 },
  { label: "1-100", min: 1, max: 100 },
  { label: "1-500", min: 1, max: 500 },
  { label: "1-1000", min: 1, max: 1000 },
];
const RANGES_OP: Range[] = [
  { label: "1-10", min: 1, max: 10 },
  { label: "1-20", min: 1, max: 20 },
  { label: "1-50", min: 1, max: 50 },
];

export default function BalloonGameApp() {
  const [screen, setScreen] = useState<Screen>({ name: "splash" });
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());
  const [muted, setMuted] = useState<boolean>(() => loadAudio().muted);

  useEffect(() => { audio.setMuted(muted); saveAudio({ muted }); }, [muted]);

  const goto = (s: Screen) => { audio.resume(); setScreen(s); };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden sky-bg select-none no-scroll">
      <Clouds />
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute top-3 right-3 z-50 h-10 w-10 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center text-lg"
        aria-label="Toggle sound"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {screen.name === "home" && (
        <Home progress={progress} onPickCategory={(c) => goto({ name: c === "english" ? "english" : "math" })} />
      )}
      {screen.name === "english" && (
        <CategoryPicker
          title="📚 English"
          back={() => goto({ name: "home" })}
          options={[
            { label: "🔤 Letters", colors: ["#ff8acb","#9b6bff"], onPick: () => goto({ name: "levels", mode: { category: "english", english: "letters" } }) },
            { label: "📖 Words", colors: ["#4dc0ff","#5ee0c5"], onPick: () => goto({ name: "levels", mode: { category: "english", english: "words" } }) },
          ]}
        />
      )}
      {screen.name === "math" && (
        <CategoryPicker
          title="🔢 Mathematics"
          back={() => goto({ name: "home" })}
          options={[
            { label: "🔢 Numbers", colors: ["#ffb84d","#ff5e7e"], onPick: () => goto({ name: "numRange" }) },
            { label: "➕ Addition", colors: ["#7be07b","#4dc0ff"], onPick: () => goto({ name: "opRange", op: "add" }) },
            { label: "➖ Subtraction", colors: ["#ff8acb","#9b6bff"], onPick: () => goto({ name: "opRange", op: "sub" }) },
            { label: "✖ Multiplication", colors: ["#ffe24a","#ffb84d"], onPick: () => goto({ name: "opRange", op: "mul" }) },
            { label: "➗ Division", colors: ["#5ee0c5","#4dc0ff"], onPick: () => goto({ name: "opRange", op: "div" }) },
          ]}
        />
      )}
      {screen.name === "numRange" && (
        <RangePicker title="🔢 Numbers" ranges={RANGES_NUM} back={() => goto({ name: "math" })}
          onPick={(r) => goto({ name: "levels", mode: { category: "math", math: "numbers", range: r } })}
        />
      )}
      {screen.name === "opRange" && (
        <RangePicker
          title={({ add: "➕ Addition", sub: "➖ Subtraction", mul: "✖ Multiplication", div: "➗ Division" } as const)[screen.op]}
          ranges={RANGES_OP}
          back={() => goto({ name: "math" })}
          onPick={(r) => goto({ name: "levels", mode: { category: "math", math: screen.op, range: r } })}
        />
      )}
      {screen.name === "levels" && (
        <Levels
          mode={screen.mode}
          progress={progress}
          back={() => goto(screen.mode.category === "english" ? { name: "english" } : (screen.mode.math === "numbers" ? { name: "numRange" } : { name: "opRange", op: screen.mode.math as any }))}
          onPick={(lvl) => goto({ name: "play", mode: screen.mode, level: lvl })}
        />
      )}
      {screen.name === "play" && (
        <Play
          key={`${modeKey(screen.mode)}-${screen.level}`}
          mode={screen.mode}
          level={screen.level}
          onComplete={(score, stars) => {
            const next = recordLevel(progress, modeKey(screen.mode), screen.level, stars, score);
            setProgress(next);
            audio.levelComplete();
            if (screen.level >= 5) {
              audio.victory();
              goto({ name: "victory", mode: screen.mode, score });
            } else {
              goto({ name: "complete", mode: screen.mode, level: screen.level, score, stars });
            }
          }}
          onGameOver={(score) => {
            audio.gameOver();
            goto({ name: "gameover", mode: screen.mode, level: screen.level, score });
          }}
          onQuit={() => goto({ name: "levels", mode: screen.mode })}
        />
      )}
      {screen.name === "complete" && (
        <ResultScreen
          title="🎉 LEVEL COMPLETE"
          subtitle={`Level ${screen.level} — ${modeTitle(screen.mode)}`}
          score={screen.score}
          stars={screen.stars}
          accent="#7be07b"
          buttons={[
            { label: "Continue", primary: true, onClick: () => goto({ name: "play", mode: screen.mode, level: Math.min(5, screen.level + 1) }) },
            { label: "Levels", onClick: () => goto({ name: "levels", mode: screen.mode }) },
            { label: "Home", onClick: () => goto({ name: "home" }) },
          ]}
        />
      )}
      {screen.name === "gameover" && (
        <ResultScreen
          title="🎮 GAME OVER"
          subtitle={`Reached Level ${screen.level}`}
          score={screen.score}
          stars={0}
          accent="#ff5e7e"
          buttons={[
            { label: "Play Again", primary: true, onClick: () => goto({ name: "play", mode: screen.mode, level: screen.level }) },
            { label: "Levels", onClick: () => goto({ name: "levels", mode: screen.mode }) },
            { label: "Home", onClick: () => goto({ name: "home" }) },
          ]}
        />
      )}
      {screen.name === "victory" && (
        <ResultScreen
          title="🏆 YOU WIN!"
          subtitle={`Mastered ${modeTitle(screen.mode)}`}
          score={screen.score}
          stars={3}
          accent="#ffb84d"
          showConfetti
          buttons={[
            { label: "Play Again", primary: true, onClick: () => goto({ name: "play", mode: screen.mode, level: 1 }) },
            { label: "Home", onClick: () => goto({ name: "home" }) },
          ]}
        />
      )}
    </div>
  );
}

/* ---------- Backgrounds ---------- */
function Clouds() {
  const clouds = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    id: i,
    top: 8 + i * 14 + (i % 2 === 0 ? 0 : 6),
    size: 60 + (i % 3) * 30,
    dur: 40 + (i * 7) % 25,
    delay: -i * 8,
    opacity: 0.6 + (i % 3) * 0.12,
  })), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {clouds.map(c => (
        <div key={c.id} className="cloud cloud-drift"
          style={{ top: `${c.top}%`, width: c.size, height: c.size * 0.45,
                   animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s`,
                   opacity: c.opacity }} />
      ))}
    </div>
  );
}

/* ---------- Home ---------- */
function Home({ progress, onPickCategory }: {
  progress: ProgressData;
  onPickCategory: (c: "english" | "math") => void;
}) {
  const best = bestOverall(progress);
  const stars = totalStars(progress);
  return (
    <div className="relative h-full w-full flex flex-col items-center px-5 pt-10 pb-6">
      <div className="text-center mb-4 bounce-in">
        <div className="text-4xl mb-1">🎈</div>
        <h1 className="text-3xl font-extrabold rainbow shadow-text">Balloon Pop</h1>
        <p className="text-sm text-foreground/70 font-semibold">Learn & Play</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-5">
        <StatCard icon="🏆" label="Best" value={best} bg="#fff3d6" />
        <StatCard icon="⭐" label="Stars" value={stars} bg="#ffe0ea" />
      </div>
      <div className="w-full max-w-sm space-y-4 mt-2">
        <BigCard
          gradient="linear-gradient(135deg,#ff8acb,#9b6bff)"
          onClick={() => onPickCategory("english")}
          emoji="📚" title="English"
          subtitle="Letters & Words"
        />
        <BigCard
          gradient="linear-gradient(135deg,#4dc0ff,#5ee0c5)"
          onClick={() => onPickCategory("math")}
          emoji="🔢" title="Mathematics"
          subtitle="Numbers & Operations"
        />
      </div>
      <div className="mt-auto text-xs text-foreground/50 font-semibold">Tap a category to begin</div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: string; label: string; value: number; bg: string }) {
  return (
    <div className="card-3d p-3 flex items-center gap-3 bounce-in" style={{ background: bg }}>
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-foreground/60 font-bold">{label}</div>
        <div className="text-xl font-extrabold leading-none">{value}</div>
      </div>
    </div>
  );
}

function BigCard({ gradient, onClick, emoji, title, subtitle }: {
  gradient: string; onClick: () => void; emoji: string; title: string; subtitle: string;
}) {
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-3xl p-5 text-white shadow-xl active:scale-[0.98] transition pulse-soft"
      style={{ background: gradient, boxShadow: "0 14px 30px rgba(80,60,140,0.35), inset 0 -6px 0 rgba(0,0,0,0.12)" }}>
      <div className="flex items-center gap-4">
        <div className="text-5xl drop-shadow">{emoji}</div>
        <div>
          <div className="text-2xl font-extrabold shadow-text">{title}</div>
          <div className="text-sm font-semibold opacity-90">{subtitle}</div>
        </div>
        <div className="ml-auto text-3xl">›</div>
      </div>
    </button>
  );
}

/* ---------- Pickers ---------- */
function TopBar({ title, back }: { title: string; back: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button onClick={back} className="h-10 w-10 rounded-full bg-white/80 shadow flex items-center justify-center text-xl">←</button>
      <h2 className="text-2xl font-extrabold shadow-text rainbow">{title}</h2>
    </div>
  );
}

function CategoryPicker({ title, back, options }: {
  title: string; back: () => void;
  options: { label: string; colors: [string, string]; onPick: () => void }[];
}) {
  return (
    <div className="relative h-full w-full px-5 pt-10 pb-6 overflow-y-auto">
      <TopBar title={title} back={back} />
      <div className="space-y-3 max-w-sm mx-auto">
        {options.map((o, i) => (
          <button key={i} onClick={o.onPick}
            className="w-full rounded-2xl p-5 text-white text-xl font-extrabold shadow-lg active:scale-[0.98] bounce-in shadow-text"
            style={{ background: `linear-gradient(135deg, ${o.colors[0]}, ${o.colors[1]})`, animationDelay: `${i * 60}ms` }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangePicker({ title, ranges, back, onPick }: {
  title: string; ranges: Range[]; back: () => void; onPick: (r: Range) => void;
}) {
  return (
    <div className="relative h-full w-full px-5 pt-10 pb-6 overflow-y-auto">
      <TopBar title={title} back={back} />
      <p className="text-sm text-foreground/70 font-semibold mb-3 max-w-sm mx-auto">Pick a range</p>
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {ranges.map((r, i) => (
          <button key={r.label} onClick={() => onPick(r)}
            className="rounded-2xl py-6 text-white font-extrabold text-xl shadow-lg active:scale-[0.98] bounce-in shadow-text"
            style={{
              background: `linear-gradient(135deg, ${BALLOON_COLORS[i % BALLOON_COLORS.length]}, ${BALLOON_COLORS[(i + 3) % BALLOON_COLORS.length]})`,
              animationDelay: `${i * 50}ms`,
            }}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Levels ---------- */
function Levels({ mode, progress, back, onPick }: {
  mode: ModeConfig; progress: ProgressData; back: () => void; onPick: (lvl: number) => void;
}) {
  const k = modeKey(mode);
  const unlocked = progress.unlocked[k] ?? 1;
  const starsArr = progress.stars[k] ?? [];
  const total = starsArr.reduce((a, b) => a + (b || 0), 0);
  const pct = Math.round((total / 15) * 100);
  return (
    <div className="relative h-full w-full px-5 pt-10 pb-6 overflow-y-auto">
      <TopBar title={modeTitle(mode)} back={back} />
      <div className="card-3d p-4 mb-4 max-w-sm mx-auto">
        <div className="flex justify-between text-xs font-bold text-foreground/70 mb-1">
          <span>Progress</span><span>{pct}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#ff8acb,#9b6bff,#4dc0ff)" }} />
        </div>
        <div className="flex justify-between mt-2 text-xs font-semibold text-foreground/70">
          <span>⭐ {total}/15</span>
          <span>Unlocked: {Math.min(5, unlocked)}/5</span>
        </div>
      </div>
      <div className="space-y-3 max-w-sm mx-auto">
        {LEVELS.map((l) => {
          const locked = l.level > unlocked;
          const stars = starsArr[l.level - 1] ?? 0;
          const best = progress.bestScore[`${k}.L${l.level}`] ?? 0;
          return (
            <button key={l.level}
              disabled={locked}
              onClick={() => !locked && onPick(l.level)}
              className={`w-full rounded-2xl p-4 flex items-center gap-4 text-left shadow-lg bounce-in ${locked ? "bg-white/50 text-foreground/40" : "bg-white active:scale-[0.98]"}`}>
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-md"
                style={{ background: locked ? "#bbb" : `linear-gradient(135deg, ${BALLOON_COLORS[l.level % 8]}, ${BALLOON_COLORS[(l.level + 2) % 8]})` }}>
                {locked ? "🔒" : l.level}
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-lg">Level {l.level}</div>
                <div className="text-xs text-foreground/60 font-semibold">Goal {l.goal} · {l.challenge ? "Challenge" : "Standard"}</div>
                {!locked && best > 0 && <div className="text-xs text-foreground/60">Best: {best}</div>}
              </div>
              <div className="text-xl">
                {[1,2,3].map(i => <span key={i}>{i <= stars ? "⭐" : "☆"}</span>)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Gameplay ---------- */
interface BalloonInst {
  id: number;
  label: string;
  isTarget: boolean;
  color: string;
  startX: number;     // % of width
  drift: number;      // px sway amplitude
  spawnAt: number;
  durationMs: number;
  state: "alive" | "popped" | "shaking";
  shakeKey?: number;
}

interface Floater { id: number; x: number; y: number; text: string; color: string; }

function Play({ mode, level, onComplete, onGameOver, onQuit }: {
  mode: ModeConfig; level: number;
  onComplete: (score: number, stars: number) => void;
  onGameOver: (score: number) => void;
  onQuit: () => void;
}) {
  const cfg: LevelConfig = LEVELS[level - 1];
  const fieldRef = useRef<HTMLDivElement>(null);

  // Countdown
  const [count, setCount] = useState<3 | 2 | 1 | 0 | -1>(3); // -1 = playing
  useEffect(() => {
    if (count === -1) return;
    if (count === 0) {
      audio.go();
      const t = setTimeout(() => setCount(-1), 700);
      return () => clearTimeout(t);
    }
    audio.countdown();
    const t = setTimeout(() => setCount((c) => (c as number) - 1 as any), 800);
    return () => clearTimeout(t);
  }, [count]);

  const [paused, setPaused] = useState(false);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(mode, cfg));
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0); // correct pops
  const [lives, setLives] = useState(cfg.lives);
  const [wrongs, setWrongs] = useState(0);
  const [combo, setCombo] = useState(0);
  const [balloons, setBalloons] = useState<BalloonInst[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const balloonIdRef = useRef(1);
  const floaterIdRef = useRef(1);
  const questionRef = useRef(question);
  useEffect(() => { questionRef.current = question; }, [question]);

  const playing = count === -1 && !paused;

  // helper: spawn one balloon
  const spawnBalloon = useCallback((forceTarget?: boolean) => {
    const q = questionRef.current;
    const isTarget = forceTarget ?? (Math.random() < 0.45);
    const label = isTarget ? q.answer : (q.pool[Math.floor(Math.random() * q.pool.length)] ?? q.answer);
    const id = balloonIdRef.current++;
    const startX = 5 + Math.random() * 90;
    const drift = 10 + Math.random() * 30;
    const duration = cfg.riseDurationMs * (0.85 + Math.random() * 0.3);
    setBalloons(prev => [...prev, {
      id, label, isTarget: label === q.answer, color: BALLOON_COLORS[id % BALLOON_COLORS.length],
      startX, drift, spawnAt: performance.now(), durationMs: duration, state: "alive",
    }]);
  }, [cfg.riseDurationMs]);

  // spawn loop
  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setBalloons(prev => {
        // remove off-screen
        const now = performance.now();
        const alive = prev.filter(b => b.state !== "popped" && (now - b.spawnAt) < b.durationMs + 600);
        // miss target detection: if a target balloon expired -> lose a life
        const missedTargets = prev.filter(b => b.isTarget && b.state === "alive" && (now - b.spawnAt) >= b.durationMs);
        if (missedTargets.length > 0) {
          // handle outside setter
          setTimeout(() => {
            setLives(l => {
              const nl = Math.max(0, l - missedTargets.length);
              if (nl === 0) setTimeout(() => doGameOver(), 0);
              return nl;
            });
            setCombo(0);
            setWrongs(w => w + missedTargets.length);
          }, 0);
        }
        return alive;
      });
    };
    const cleanup = setInterval(tick, 250);

    const spawner = setInterval(() => {
      setBalloons(prev => {
        if (prev.length >= cfg.maxOnScreen) return prev;
        return prev;
      });
      spawnBalloon();
    }, cfg.spawnEveryMs);

    // guaranteed target keeper
    const keeper = setInterval(() => {
      setBalloons(prev => {
        const now = performance.now();
        const hasTarget = prev.some(b => b.isTarget && b.state === "alive" && (now - b.spawnAt) < b.durationMs - 1500);
        if (!hasTarget) setTimeout(() => spawnBalloon(true), 0);
        return prev;
      });
    }, 700);

    // initial seed
    spawnBalloon(true);
    const seed = setTimeout(() => { spawnBalloon(); spawnBalloon(); }, 300);

    return () => { cancelled = true; clearInterval(cleanup); clearInterval(spawner); clearInterval(keeper); clearTimeout(seed); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, cfg.spawnEveryMs, cfg.maxOnScreen, spawnBalloon]);

  const doGameOver = useCallback(() => {
    onGameOver(score);
  }, [onGameOver, score]);

  const popBalloon = (b: BalloonInst, x: number, y: number) => {
    if (!playing || b.state !== "alive") return;
    if (b.isTarget) {
      audio.pop();
      const newCombo = combo + 1;
      const bonus = newCombo >= 5 ? 5 : newCombo >= 3 ? 2 : 0;
      const add = 1 + bonus;
      setBalloons(prev => prev.map(x2 => x2.id === b.id ? { ...x2, state: "popped" } : x2));
      const text = bonus ? `+${add} ${newCombo >= 5 ? "SUPER!" : "COMBO!"}` : `+${add}`;
      addFloater(x, y, text, "#7be07b");
      setScore(s => s + add);
      setCombo(newCombo);
      if (bonus) audio.combo();
      setProgress(p => {
        const np = p + 1;
        if (np >= cfg.goal) {
          // level complete
          setTimeout(() => {
            const accuracy = np / Math.max(1, np + wrongs);
            const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
            onComplete(score + add, stars);
          }, 250);
        }
        return np;
      });
      // spawn replacement target if needed
      setTimeout(() => spawnBalloon(true), 120);
    } else {
      audio.wrong();
      const sk = Math.random();
      setBalloons(prev => prev.map(x2 => x2.id === b.id ? { ...x2, state: "shaking", shakeKey: sk } : x2));
      setTimeout(() => setBalloons(prev => prev.map(x2 => x2.id === b.id ? { ...x2, state: "alive" } : x2)), 420);
      addFloater(x, y, "❌", "#ff5e7e");
      setCombo(0);
      setWrongs(w => w + 1);
      setLives(l => {
        const nl = Math.max(0, l - 1);
        if (nl === 0) setTimeout(() => doGameOver(), 250);
        return nl;
      });
    }
  };

  const addFloater = (x: number, y: number, text: string, color: string) => {
    const id = floaterIdRef.current++;
    setFloaters(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 1000);
  };

  // regenerate question whenever progress changes (after correct)
  useEffect(() => {
    if (progress > 0 && progress < cfg.goal) {
      const q = generateQuestion(mode, cfg);
      setQuestion(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // animation rendering tick (for smooth balloon Y positions)
  const [, force] = useState(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => { force(n => (n + 1) % 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // pause overlay
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* HUD */}
      <div className="relative z-20 px-3 pt-3 pb-2 flex items-start gap-2">
        <div className="card-3d px-3 py-2 text-sm font-extrabold flex items-center gap-1" style={{ background: "#fff3d6" }}>
          🏆 <span>L{level}</span>
        </div>
        <div className="card-3d flex-1 px-3 py-2 flex flex-col items-center" style={{ background: "linear-gradient(135deg,#fff,#ffe7f4)" }}>
          <div className="text-[10px] uppercase font-bold text-foreground/60">Target</div>
          <div className="text-2xl font-extrabold leading-tight rainbow">{question.prompt}{mode.category === "math" && mode.math !== "numbers" ? " = ?" : ""}</div>
        </div>
        <div className="card-3d px-3 py-2 text-sm font-extrabold flex items-center gap-1" style={{ background: "#e0f4ff" }}>
          ⭐ <span>{score}</span>
        </div>
      </div>
      <div className="relative z-20 px-3 pb-2 flex items-center gap-2">
        <div className="flex gap-1 text-lg">
          {Array.from({ length: cfg.lives }, (_, i) => (
            <span key={i} style={{ filter: i < lives ? "none" : "grayscale(1) opacity(0.4)" }}>❤️</span>
          ))}
        </div>
        <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
          <div className="h-full" style={{ width: `${Math.min(100, (progress / cfg.goal) * 100)}%`, background: "linear-gradient(90deg,#7be07b,#4dc0ff)" }} />
        </div>
        <div className="text-xs font-bold text-foreground/70">{progress}/{cfg.goal}</div>
        <button onClick={() => setPaused(p => !p)} className="h-9 w-9 rounded-full bg-white/90 shadow flex items-center justify-center font-extrabold">
          {paused ? "▶" : "❚❚"}
        </button>
      </div>
      <div className="px-3 pb-1 text-[11px] font-bold text-foreground/60 flex justify-between">
        <span>Wrong: {wrongs}/5</span>
        {combo >= 2 && <span className="text-success font-extrabold">🔥 Combo x{combo}</span>}
      </div>

      {/* Playfield */}
      <div ref={fieldRef} className="relative flex-1 overflow-hidden">
        {balloons.map(b => <Balloon key={b.id} b={b} onPop={(x, y) => popBalloon(b, x, y)} paused={!playing} />)}
        {floaters.map(f => (
          <div key={f.id} className="float-up absolute text-lg font-extrabold shadow-text" style={{ left: f.x, top: f.y, color: f.color }}>
            {f.text}
          </div>
        ))}

        {/* Countdown */}
        {count !== -1 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-30">
            <div key={count} className="countdown-pop text-white font-extrabold text-[120px] shadow-text"
              style={{ WebkitTextStroke: "3px rgba(0,0,0,0.2)" }}>
              {count === 0 ? "GO!" : count}
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {paused && count === -1 && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
            <div className="card-3d p-6 w-72 text-center bounce-in">
              <div className="text-2xl font-extrabold mb-4">Paused</div>
              <button onClick={() => setPaused(false)} className="btn-3d w-full mb-2" style={{ background: "linear-gradient(135deg,#7be07b,#4dc0ff)" }}>Resume</button>
              <button onClick={onQuit} className="btn-3d w-full" style={{ background: "linear-gradient(135deg,#ff8acb,#9b6bff)" }}>Quit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Balloon({ b, onPop, paused }: { b: BalloonInst; onPop: (x: number, y: number) => void; paused: boolean; }) {
  const now = performance.now();
  const t = Math.min(1, (now - b.spawnAt) / b.durationMs);
  // travel from bottom (100%) to top (-20%)
  const yPct = 100 - t * 130;
  const sway = Math.sin((now - b.spawnAt) / 600) * b.drift;
  const handle = (e: React.MouseEvent | React.TouchEvent) => {
    if (paused) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const parent = (e.currentTarget as HTMLElement).offsetParent as HTMLElement;
    const px = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
    onPop(rect.left - px.left + rect.width / 2, rect.top - px.top);
  };
  return (
    <div className={`balloon-wrap ${b.state === "popped" ? "balloon-pop" : ""}`}
      style={{ left: `calc(${b.startX}% + ${sway}px)`, top: `${yPct}%`, transform: "translate(-50%, -50%)" }}>
      <div
        onClick={handle}
        onTouchStart={handle}
        className={`balloon ${b.state === "shaking" ? "balloon-shake" : "balloon-sway"}`}
        style={{ background: `radial-gradient(circle at 30% 28%, #ffffffaa, ${b.color} 55%, ${shade(b.color, -25)})`, color: b.color }}
      >
        <span style={{ color: "white" }}>{b.label}</span>
      </div>
      <div className="balloon-string" />
    </div>
  );
}

function shade(hex: string, percent: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  let r = (n >> 16) + percent;
  let g = ((n >> 8) & 0xff) + percent;
  let b = (n & 0xff) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

/* ---------- Result Screens ---------- */
function ResultScreen({ title, subtitle, score, stars, accent, buttons, showConfetti }: {
  title: string; subtitle: string; score: number; stars: number; accent: string; showConfetti?: boolean;
  buttons: { label: string; primary?: boolean; onClick: () => void }[];
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5 z-40 bg-black/30">
      {(showConfetti || stars > 0) && <Confetti count={showConfetti ? 80 : 40} />}
      <div className="card-3d w-full max-w-sm p-6 text-center bounce-in" style={{ background: "linear-gradient(180deg,#fff,#fff5f9)" }}>
        <div className="text-3xl font-extrabold mb-1 rainbow shadow-text">{title}</div>
        <div className="text-sm font-semibold text-foreground/70 mb-4">{subtitle}</div>
        <div className="flex justify-center gap-1 text-4xl mb-4">
          {[1,2,3].map(i => <span key={i} className="bounce-in" style={{ animationDelay: `${i * 120}ms` }}>{i <= stars ? "⭐" : "☆"}</span>)}
        </div>
        <div className="text-5xl font-extrabold mb-1" style={{ color: accent }}>{score}</div>
        <div className="text-xs font-bold uppercase text-foreground/60 mb-5">Score</div>
        <div className="space-y-2">
          {buttons.map((b, i) => (
            <button key={i} onClick={b.onClick}
              className="btn-3d w-full"
              style={{
                background: b.primary ? `linear-gradient(135deg,${accent},#9b6bff)` : "linear-gradient(135deg,#bbb,#999)",
              }}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Confetti({ count }: { count: number }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: BALLOON_COLORS[i % BALLOON_COLORS.length],
    delay: Math.random() * 0.6,
    dur: 2 + Math.random() * 2.5,
    rot: Math.random() * 360,
  })), [count]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece"
          style={{
            left: `${p.left}%`, background: p.color,
            animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
            transform: `rotate(${p.rot}deg)`,
            borderRadius: p.id % 3 === 0 ? "50%" : "2px",
          }} />
      ))}
    </div>
  );
}
