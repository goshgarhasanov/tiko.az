// Web Audio ilə generasiya olunan səslər — heç bir audio fayl lazım deyil.

let ctx = null;
let enabled = true;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

/** Səs effektlərini açıb-bağlayır. */
export function setSoundEnabled(value) {
  enabled = !!value;
}

/** Səslər aktivdirsə true. */
export function isSoundEnabled() {
  return enabled;
}

/** Bir not (sinusoid) çalır. */
function tone(freq, durationMs, { type = "sine", volume = 0.18, attack = 8, release = 60 } = {}) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack / 1000);
  gain.gain.linearRampToValueAtTime(0, now + (durationMs + release) / 1000);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + (durationMs + release) / 1000);
}

/** Gediş səsi. */
export function playPlace(mark) {
  const freq = mark === "X" ? 660 : 520;
  tone(freq, 90, { type: "triangle", volume: 0.16 });
}

/** Qalib səsi (akkord). */
export function playWin() {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((f, i) => {
    setTimeout(() => tone(f, 220, { type: "sawtooth", volume: 0.14, release: 200 }), i * 90);
  });
}

/** Bərabərə səsi. */
export function playDraw() {
  tone(220, 220, { type: "sine", volume: 0.14 });
  setTimeout(() => tone(196, 280, { type: "sine", volume: 0.14 }), 140);
}

/** Xəta / yanlış gediş səsi. */
export function playError() {
  tone(140, 140, { type: "square", volume: 0.10 });
}

/** Düymə kliki. */
export function playClick() {
  tone(880, 35, { type: "sine", volume: 0.08, attack: 1, release: 30 });
}
