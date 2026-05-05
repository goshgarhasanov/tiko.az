// İstifadəçi tənzimləmələrinin localStorage-də saxlanması.

const STORAGE_KEY = "tiko.az/settings/v1";

/** Standart tənzimləmələr. */
export const DEFAULT_SETTINGS = {
  mode: "pvc",            // "pvp" | "pvc" | "cvc"
  difficulty: "hard",     // "easy" | "medium" | "hard" | "impossible"
  boardSize: 3,
  winLength: 3,
  nameX: "Oyunçu 1",
  nameO: "Oyunçu 2",
  theme: "dark",          // "dark" | "light"
  skin: "classic",        // "classic" | "neon" | "minimal"
  moveTime: 0,            // saniyə (0 = limitsiz)
  matchLength: 1,         // 1 | 3 | 5 | 7
  sound: true,
  animations: true,
  hints: false,
  confetti: true,
};

/** Saxlanmış tənzimləmələri yükləyir. */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const data = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Tənzimləmələri saxlayır. */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/** Standart dəyərlərə qaytarır. */
export function resetSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}
