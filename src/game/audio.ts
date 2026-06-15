// Lightweight synth-based audio (no asset files needed)
let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
    catch { return null; }
  }
  return ctx;
}

export const audio = {
  setMuted(v: boolean) { muted = v; },
  isMuted() { return muted; },
  resume() { const c = ac(); if (c && c.state === "suspended") c.resume(); },

  pop() {
    if (muted) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.25);

    // noise burst
    const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const n = c.createBufferSource(); n.buffer = buf;
    const ng = c.createGain(); ng.gain.value = 0.15;
    n.connect(ng).connect(c.destination); n.start(t);
  },

  wrong() {
    if (muted) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(110, t + 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.32);
  },

  tone(freq: number, dur = 0.15, type: OscillatorType = "sine", vol = 0.25) {
    if (muted) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },

  victory() {
    if (muted) return;
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, "triangle", 0.3), i * 120));
  },
  levelComplete() {
    if (muted) return;
    [659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, "triangle", 0.3), i * 100));
  },
  gameOver() {
    if (muted) return;
    [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, "sawtooth", 0.25), i * 140));
  },
  countdown() { this.tone(660, 0.1, "sine", 0.3); },
  go() { this.tone(1046, 0.25, "triangle", 0.35); },
  combo() {
    if (muted) return;
    [784, 988, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, "triangle", 0.28), i * 60));
  },
};
