// Oyun axını idarəsi — növbə, qalib aşkarı, tarixçə inteqrasiyası.

import { createBoard, placeMark, detectWinner } from "./board.js";
import { createHistory, pushMove, undo as histUndo, redo as histRedo, clearHistory, activeMoves, moveCount } from "./history.js";

/** @typedef {"playing"|"won"|"draw"} GameStatus */

/**
 * Yeni oyun yaradır.
 * @param {Object} opts
 * @param {number} opts.size
 * @param {number} opts.winLength
 * @param {"X"|"O"} [opts.firstMark]  Kim başlayır.
 */
export function createGame({ size = 3, winLength = 3, firstMark = "X" } = {}) {
  return {
    board: createBoard(size, winLength),
    history: createHistory(),
    current: firstMark,
    firstMark,
    status: /** @type {GameStatus} */ ("playing"),
    winner: /** @type {"X"|"O"|null} */ (null),
    winningLine: /** @type {number[]|null} */ (null),
    startedAt: Date.now(),
    endedAt: /** @type {number|null} */ (null),
  };
}

/** Növbədəki oyunçunu dəyişir. */
function nextMark(mark) {
  return mark === "X" ? "O" : "X";
}

/**
 * Cari oyunçu üçün xanaya gediş edir.
 * @param {Object} game
 * @param {number} index
 * @returns {Object} yenilənmiş oyun (mutated, return convenience).
 */
export function makeMove(game, index) {
  if (game.status !== "playing") {
    throw new Error("Oyun bitib — gediş etmək olmaz");
  }
  game.board = placeMark(game.board, index, game.current);
  pushMove(game.history, {
    index,
    mark: game.current,
    at: Date.now(),
  });

  const result = detectWinner(game.board, index);
  if (result.winner) {
    game.status = "won";
    game.winner = result.winner;
    game.winningLine = result.line;
    game.endedAt = Date.now();
  } else if (result.draw) {
    game.status = "draw";
    game.endedAt = Date.now();
  } else {
    game.current = nextMark(game.current);
  }
  return game;
}

/** Sonuncu gedişi geri alır. Oyun bitmiş olsa belə davam edir. */
export function undoMove(game) {
  const move = histUndo(game.history);
  if (!move) return null;
  // Lövhədəki xananı boşaldır və status-u sıfırlayır.
  game.board.cells[move.index] = null;
  game.status = "playing";
  game.winner = null;
  game.winningLine = null;
  game.endedAt = null;
  game.current = move.mark; // həmin oyunçu yenidən gediş edə bilər
  return move;
}

/** Geri alınmış gedişi yenidən tətbiq edir. */
export function redoMove(game) {
  const move = histRedo(game.history);
  if (!move) return null;
  game.board.cells[move.index] = move.mark;
  const result = detectWinner(game.board, move.index);
  if (result.winner) {
    game.status = "won";
    game.winner = result.winner;
    game.winningLine = result.line;
    game.endedAt = Date.now();
  } else if (result.draw) {
    game.status = "draw";
    game.endedAt = Date.now();
  } else {
    game.current = nextMark(move.mark);
  }
  return move;
}

/** Oyunu eyni parametrlərlə sıfırlayır. */
export function resetGame(game, { firstMark } = {}) {
  game.board = createBoard(game.board.size, game.board.winLength);
  clearHistory(game.history);
  const starter = firstMark ?? game.firstMark;
  game.current = starter;
  game.firstMark = starter;
  game.status = "playing";
  game.winner = null;
  game.winningLine = null;
  game.startedAt = Date.now();
  game.endedAt = null;
  return game;
}

/** Aktiv gediş sayını qaytarır. */
export function totalMoves(game) {
  return moveCount(game.history);
}

/** Aktiv gedişlər. */
export function moves(game) {
  return activeMoves(game.history);
}
