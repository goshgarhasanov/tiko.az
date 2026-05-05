// Gediş tarixçəsi və geri/irəli (undo/redo) idarəsi.
// Hər giriş: { index: number, mark: "X"|"O", at: timestamp }

/**
 * Tarixçə obyektini yaradır.
 */
export function createHistory() {
  return {
    moves: [],
    cursor: 0, // moves[cursor] növbəti tətbiq olunacaq gediş (redo üçün).
  };
}

/** Yeni gediş əlavə edir; cursor sonradan başqa gedişlər varsa onları silir. */
export function pushMove(history, move) {
  history.moves = history.moves.slice(0, history.cursor);
  history.moves.push(move);
  history.cursor = history.moves.length;
  return history;
}

/** Bir gediş geri qayıdır. */
export function undo(history) {
  if (history.cursor === 0) return null;
  history.cursor -= 1;
  return history.moves[history.cursor];
}

/** Bir gediş irəli (redo). */
export function redo(history) {
  if (history.cursor >= history.moves.length) return null;
  const move = history.moves[history.cursor];
  history.cursor += 1;
  return move;
}

/** Aktiv gedişlərin sayı. */
export function moveCount(history) {
  return history.cursor;
}

/** Aktiv gedişlər (təkrar oxutma üçün). */
export function activeMoves(history) {
  return history.moves.slice(0, history.cursor);
}

/** Tarixçəni sıfırlayır. */
export function clearHistory(history) {
  history.moves = [];
  history.cursor = 0;
  return history;
}
