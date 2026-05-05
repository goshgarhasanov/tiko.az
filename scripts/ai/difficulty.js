// AI çətinlik səviyyələri — eyni minimax-ı fərqli parametrlərlə işlədir.

import { bestMove } from "./minimax.js";
import { emptyCells, placeMark, detectWinner } from "../core/board.js";

/**
 * Verilmiş çətinliyə uyğun gedişi qaytarır.
 * @param {Object} board
 * @param {"X"|"O"} mark  AI-nin işarəsi.
 * @param {"easy"|"medium"|"hard"|"impossible"} difficulty
 * @returns {number}
 */
export function pickMove(board, mark, difficulty) {
  switch (difficulty) {
    case "easy":
      return easyMove(board, mark);
    case "medium":
      return mediumMove(board, mark);
    case "hard":
      return bestMove(board, mark, { maxDepth: 4, timeBudgetMs: 500 });
    case "impossible":
    default:
      return bestMove(board, mark, { maxDepth: 9, timeBudgetMs: 2500 });
  }
}

/**
 * Asan: təsadüfi gediş, lakin dərhal qələbə imkanı varsa götürür.
 */
function easyMove(board, mark) {
  const empties = emptyCells(board);
  if (empties.length === 0) return -1;

  // Dərhal qələbə imkanı varsa al.
  const winning = findImmediate(board, empties, mark);
  if (winning >= 0) return winning;

  // Təsadüfi
  return empties[Math.floor(Math.random() * empties.length)];
}

/**
 * Orta: dərhal qələbəni alır, rəqibin qələbəsini blok edir, qalanı təsadüfidir.
 */
function mediumMove(board, mark) {
  const empties = emptyCells(board);
  if (empties.length === 0) return -1;

  const opp = mark === "X" ? "O" : "X";

  const win = findImmediate(board, empties, mark);
  if (win >= 0) return win;

  const block = findImmediate(board, empties, opp);
  if (block >= 0) return block;

  // Mərkəz boşdursa götür.
  const center = Math.floor(board.size * board.size / 2);
  if (board.cells[center] === null) return center;

  return empties[Math.floor(Math.random() * empties.length)];
}

/** Bir gedişlik qələbə imkanını tapır. */
function findImmediate(board, empties, mark) {
  for (const idx of empties) {
    const next = placeMark(board, idx, mark);
    const result = detectWinner(next, idx);
    if (result.winner === mark) return idx;
  }
  return -1;
}
