import { useEffect, useState } from "react";

const BALLOON_COLORS = ["#ff5e7e", "#ffb84d", "#ffe24a", "#7be07b", "#4dc0ff", "#9b6bff"];

interface Sparkle { id: number; left: number; top: number; delay: number; color: string; size: number; }

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(onDone, 600);
    }, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  const handleClick = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onDone, 600);
  };

  const sparkles: Sparkle[] = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: 8 + (i * 37) % 84,
    top: 12 + (i * 17) % 66,
    delay: i * 0.18,
    color: BALLOON_COLORS[i % BALLOON_COLORS.length],
    size: 6 + (i % 3) * 3,
  }));

  return (
    <button
      onClick={handleClick}
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center sky-bg overflow-hidden transition-opacity duration-500 ${exiting ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      aria-label="Start game"
    >
      {/* Sparkles */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s`, color: s.color, fontSize: s.size }}
        />
      ))}

      {/* Floating Balloons */}
      <div className="absolute left-[10%] bottom-[-120px] splash-balloon" style={{ animationDelay: "0s", color: "#ff5e7e" }}>
        <div className="splash-balloon-body">A</div>
        <div className="splash-balloon-string" />
      </div>
      <div className="absolute right-[12%] bottom-[-120px] splash-balloon" style={{ animationDelay: "0.6s", color: "#4dc0ff" }}>
        <div className="splash-balloon-body">2</div>
        <div className="splash-balloon-string" />
      </div>
      <div className="absolute left-[72%] bottom-[-120px] splash-balloon" style={{ animationDelay: "1.2s", color: "#7be07b" }}>
        <div className="splash-balloon-body">+</div>
        <div className="splash-balloon-string" />
      </div>
      <div className="absolute right-[68%] bottom-[-120px] splash-balloon" style={{ animationDelay: "1.8s", color: "#ffb84d" }}>
        <div className="splash-balloon-body">?</div>
        <div className="splash-balloon-string" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center animate-bounce-gentle">
        <div className="relative mb-4">
          <div className="w-32 h-40 rounded-[50%_50%_48%_48%/55%_55%_45%_45%] flex items-center justify-center text-5xl font-extrabold text-white shadow-2xl splash-logo-balloon"
               style={{ background: "linear-gradient(135deg,#ff5e7e,#ffb84d)", boxShadow: "inset -14px -18px 28px rgba(0,0,0,0.2), inset 10px 12px 20px rgba(255,255,255,0.35), 0 16px 32px rgba(0,0,0,0.2)" }}>
            🎈
          </div>
          <div className="splash-logo-string" />
        </div>

        <h1 className="text-5xl font-extrabold rainbow shadow-text tracking-tight">Pop & Learn</h1>
        <p className="mt-2 text-lg font-semibold text-foreground/70">Learn English & Math</p>
      </div>

      {/* Tap hint */}
      <div className={`absolute bottom-16 flex flex-col items-center transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100 animate-pulse-soft"}`}>
        <div className="h-12 w-12 rounded-full bg-white/80 backdrop-blur shadow-md flex items-center justify-center text-2xl mb-2">👆</div>
        <span className="text-sm font-bold text-foreground/60">Tap to start</span>
      </div>
    </button>
  );
}
