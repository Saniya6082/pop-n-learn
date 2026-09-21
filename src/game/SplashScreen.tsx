import { useEffect, useState } from "react";

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

  return (
    <button
      onClick={handleClick}
      className={`kids-splash absolute inset-0 z-50 overflow-hidden transition-opacity duration-500 ${exiting ? "pointer-events-none opacity-0" : "opacity-100"}`}
      aria-label="Start game"
    >
      <div className="sticker sticker-star" aria-hidden="true">★</div>
      <div className="sticker sticker-letter" aria-hidden="true">A</div>
      <div className="sticker sticker-number" aria-hidden="true">7</div>
      <div className="sticker sticker-sum" aria-hidden="true">2+3</div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-7 pb-20 text-center">
        <div className="mascot-balloon animate-bounce-gentle" aria-hidden="true">
          <span className="mascot-shine" />
          <span className="mascot-eyes">● &nbsp; ●</span>
          <span className="mascot-smile">⌣</span>
        </div>
        <h1 className="kids-logo mt-8 font-display leading-none"><span>Pop</span> &amp; Learn</h1>
        <p className="mt-4 max-w-64 text-lg font-bold leading-tight text-muted-foreground">Pop balloons. Grow your super brain!</p>
      </div>

      <div className={`absolute bottom-9 left-1/2 z-20 w-56 -translate-x-1/2 transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100 animate-pulse-soft"}`}>
        <span className="play-sticker">Tap to play <span aria-hidden="true">▶</span></span>
      </div>
    </button>
  );
}
