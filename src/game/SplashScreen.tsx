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
      className={`island-splash absolute inset-0 z-50 overflow-hidden transition-opacity duration-500 ${exiting ? "pointer-events-none opacity-0" : "opacity-100"}`}
      aria-label="Start game"
    >
      <div className="island-sun" />
      <div className="island-leaf island-leaf-left" />
      <div className="island-leaf island-leaf-right" />
      <div className="island-route" aria-hidden="true">• · • · • · •</div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="splash-stamp animate-bounce-gentle">
          <span className="splash-stamp-small">THE GREAT</span>
          <span className="splash-stamp-main">POP</span>
          <span className="splash-stamp-small">EXPEDITION</span>
        </div>
        <h1 className="mt-8 font-display text-5xl uppercase leading-none text-primary">Pop & Learn</h1>
        <p className="mt-3 max-w-52 text-lg font-semibold leading-tight text-foreground/70">Two islands. A world of letters and numbers.</p>
      </div>

      <div className={`absolute bottom-10 left-1/2 z-20 -translate-x-1/2 transition-opacity duration-300 ${exiting ? "opacity-0" : "opacity-100 animate-pulse-soft"}`}>
        <span className="map-ticket">TAP TO EXPLORE →</span>
      </div>
    </button>
  );
}
