// Minimax + alfa-beta budama. 3×3 üçün tam həll, daha böyük lövhələrdə dərinlik məhdudiyyəti.

import { cloneBoard, placeMark, detectWinner, emptyCells, isFull } from "../core/board.js";
import { evaluate } from "./heuristic.js";

const WIN_SCORE = 10_000_000;

/**
 * Verilmiş oyunçu üçün ən yaxşı gedişin indeksini qaytarır.
 * @param {Object} board
 * @param {"X"|"O"} maximizer
 * @param {Object} [opts]
 * @param {number} [opts.maxDepth]  Təxmin üçün maksimum dərinlik (sonsuz üçün Infinity).
 * @param {number} [opts.timeBudgetMs]  Vaxt limiti (ms). Dolarsa, dayan və ən yaxşını qaytar.
 * @returns {number} ən yaxşı xananın indeksi.
 */
export function bestMove(board, maximizer, { maxDepth = 8, timeBudgetMs = 1500 } = {}) {
  const candidates = orderedMoves(board, maximizer);
  if (candidates.length === 0) return -1;
  if (candidates.length === 1) return candidates[0];

  // 3×3 üçün dərinlik kifayət edir, sonsuz axtar.
  const depthCap = board.size === 3 && board.winLength === 3
    ? Infinity
    : Math.min(maxDepth, Math.max(2, 12 - board.size));

  const deadline = performance.now() + timeBudgetMs;
  let bestIndex = candidates[0];
  let bestScore = -Infinity;

  for (const move of candidates) {
    if (performance.now() > deadline && bestScore > -Infinity) break;
    const next = applyMove(board, move, maximizer);
    const score = minimax(next, opp(maximizer), maximizer, 1, depthCap, -Infinity, Infinity, deadline);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = move;
    }
    // Dərhal qələbə tapılsa, dayanırıq.
    if (bestScore >= WIN_SCORE - 100) break;
  }

  return bestIndex;
}

/** Rekursiv minimax. */
function minimax(board, turn, maximizer, depth, depthCap, alpha, beta, deadline) {
  // Terminal yoxlaması — sonuncu gediş indeksini bilmirik, ona görə hər lövhəni tam yoxlayırıq.
  const result = detectWinner(board);
  if (result.winner === maximizer) return WIN_SCORE - depth;
  if (result.winner && result.winner !== maximizer) return -WIN_SCORE + depth;
  if (isFull(board)) return 0;

  if (depth >= depthCap) return evaluate(board, maximizer);
  if (performance.now() > deadline) return evaluate(board, maximizer);

  const moves = orderedMoves(board, turn);
  if (turn === maximizer) {
    let value = -Infinity;
    for (const m of moves) {
      const next = applyMove(board, m, turn);
      const score = minimax(next, opp(turn), maximizer, depth + 1, depthCap, alpha, beta, deadline);
      if (score > value) value = score;
      if (value > alpha) alpha = value;
      if (alpha >= beta) break; // alfa-beta budama
    }
    return value;
  } else {
    let value = Infinity;
    for (const m of moves) {
      const next = applyMove(board, m, turn);
      const score = minimax(next, opp(turn), maximizer, depth + 1, depthCap, alpha, beta, deadline);
      if (score < value) value = score;
      if (value < beta) beta = value;
      if (alpha >= beta) break;
    }
    return value;
  }
}

function applyMove(board, index, mark) {
  const next = cloneBoard(board);
  next.cells[index] = mark;
  return next;
}

function opp(mark) {
  return mark === "X" ? "O" : "X";
}

/**
 * Boş xanaları, daha "perspektivli" olanlarını əvvələ gətirərək sıralayır.
 * Bu, alfa-beta budamanın səmərəliliyini artırır.
 */
function orderedMoves(board, mark) {
  const empties = emptyCells(board);
  const center = (board.size * board.size - 1) / 2;
  return empties
    .map((i) => ({
      i,
      // Mərkəzə yaxınlıq — daha əhəmiyyətli olduğu fərz olunur.
      score: -manhattanFromCenter(i, board.size),
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.i);
}

function manhattanFromCenter(index, size) {
  const r = Math.floor(index / size);
  const c = index % size;
  const center = (size - 1) / 2;
  return Math.abs(r - center) + Math.abs(c - center);
}
