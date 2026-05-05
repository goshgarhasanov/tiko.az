// Lifetime statistika və naqqaş (achievement) saxlanması.

const STORAGE_KEY = "tiko.az/stats/v1";

/** Standart sıfır statistika. */
export const EMPTY_STATS = {
  totalGames: 0,
  xWins: 0,
  oWins: 0,
  draws: 0,
  totalMoves: 0,
  totalDurationMs: 0,
  bestStreak: 0,
  currentStreak: 0,
  fastestWinMoves: null,    // ən az gediş ilə qələbə
  achievements: [],         // [{ key, unlockedAt }]
  byDifficulty: {
    easy:        { games: 0, humanWins: 0 },
    medium:      { games: 0, humanWins: 0 },
    hard:        { games: 0, humanWins: 0 },
    impossible:  { games: 0, humanWins: 0 },
  },
  byBoardSize: {},          // { "3": { games, wins }, "4": ... }
};

/** Saxlanmış statistikanı yükləyir. */
export function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(EMPTY_STATS);
    const data = JSON.parse(raw);
    return mergeStats(structuredClone(EMPTY_STATS), data);
  } catch {
    return structuredClone(EMPTY_STATS);
  }
}

function mergeStats(base, override) {
  for (const k of Object.keys(override)) {
    if (k === "byDifficulty" || k === "byBoardSize") {
      base[k] = { ...base[k], ...override[k] };
    } else {
      base[k] = override[k];
    }
  }
  return base;
}

/** Statistikanı saxlayır. */
export function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

/** Statistikanı tam sıfırlayır. */
export function resetStats() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return structuredClone(EMPTY_STATS);
}

/**
 * Bitmiş bir oyunu statistikaya yazır.
 * @param {Object} stats
 * @param {Object} game
 * @param {Object} ctx  Kontekst: { humanMark, difficulty, boardSize }
 */
export function recordGame(stats, game, { humanMark = "X", difficulty = "hard", boardSize = 3 } = {}) {
  stats.totalGames += 1;
  const moves = game.history.cursor;
  stats.totalMoves += moves;
  if (game.endedAt && game.startedAt) {
    stats.totalDurationMs += Math.max(0, game.endedAt - game.startedAt);
  }

  if (game.winner === "X") stats.xWins += 1;
  else if (game.winner === "O") stats.oWins += 1;
  else stats.draws += 1;

  // İnsan baxımından seriya.
  if (game.winner === humanMark) {
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak;
    if (stats.fastestWinMoves === null || moves < stats.fastestWinMoves) {
      stats.fastestWinMoves = moves;
    }
  } else if (game.winner) {
    stats.currentStreak = 0;
  }

  // Çətinlik bölgüsü
  if (!stats.byDifficulty[difficulty]) stats.byDifficulty[difficulty] = { games: 0, humanWins: 0 };
  stats.byDifficulty[difficulty].games += 1;
  if (game.winner === humanMark) stats.byDifficulty[difficulty].humanWins += 1;

  // Lövhə ölçüsü bölgüsü
  const sizeKey = String(boardSize);
  if (!stats.byBoardSize[sizeKey]) stats.byBoardSize[sizeKey] = { games: 0, wins: 0 };
  stats.byBoardSize[sizeKey].games += 1;
  if (game.winner === humanMark) stats.byBoardSize[sizeKey].wins += 1;

  return stats;
}

/** Naqqaşları yoxlayır və yeni qazanılanları qaytarır. */
export function checkAchievements(stats, lastGame, ctx) {
  const now = Date.now();
  const owned = new Set(stats.achievements.map((a) => a.key));
  const unlocks = [];

  function unlock(key) {
    if (owned.has(key)) return;
    stats.achievements.push({ key, unlockedAt: now });
    unlocks.push(key);
  }

  if (stats.xWins + stats.oWins === 1 && lastGame.winner === ctx.humanMark) {
    unlock("achievement.firstWin");
  }
  if (stats.bestStreak >= 3) unlock("achievement.streak3");
  if (stats.bestStreak >= 10) unlock("achievement.streak10");
  if (stats.fastestWinMoves !== null && stats.fastestWinMoves <= 5) {
    unlock("achievement.fastWin");
  }
  if (lastGame.winner === ctx.humanMark && ctx.difficulty === "hard") {
    unlock("achievement.beatHard");
  }
  if (lastGame.winner === ctx.humanMark && ctx.difficulty === "impossible") {
    unlock("achievement.beatImp");
  }
  if (lastGame.winner === ctx.humanMark && ctx.boardSize >= 5) {
    unlock("achievement.bigBoard");
  }

  return unlocks;
}
