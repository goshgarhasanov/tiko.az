// Heuristik qiymətləndirmə — böyük lövhələrdə tam minimax mümkün olmadıqda istifadə olunur.
// Hər potensial xətti ayrı qiymətləndirib mənfi/müsbət bal toplayır.

import { rcToIndex } from "../core/board.js";

/**
 * Lövhənin verilmiş oyunçu üçün dəyərini qaytarır.
 * Müsbət ədəd = bizim oyunçumuz üçün üstündür.
 * @param {Object} board
 * @param {"X"|"O"} maximizer  Qiymətləndirilən oyunçu.
 */
export function evaluate(board, maximizer) {
  const opponent = maximizer === "X" ? "O" : "X";
  const lines = enumerateLines(board);
  let score = 0;
  for (const line of lines) {
    score += scoreLine(line, board.cells, maximizer, opponent, board.winLength);
  }
  return score;
}

/** Lövhədəki bütün potensial xətləri (qalib şərti uzunluğunda) qaytarır. */
function enumerateLines(board) {
  const { size, winLength } = board;
  const lines = [];
  // Üfüqi
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      lines.push(Array.from({ length: winLength }, (_, k) => rcToIndex(r, c + k, size)));
    }
  }
  // Şaquli
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winLength; r++) {
      lines.push(Array.from({ length: winLength }, (_, k) => rcToIndex(r + k, c, size)));
    }
  }
  // ↘ diaqonal
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      lines.push(Array.from({ length: winLength }, (_, k) => rcToIndex(r + k, c + k, size)));
    }
  }
  // ↗ diaqonal
  for (let r = winLength - 1; r < size; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      lines.push(Array.from({ length: winLength }, (_, k) => rcToIndex(r - k, c + k, size)));
    }
  }
  return lines;
}

/**
 * Bir xətti qiymətləndirir. Yalnız bir oyunçunun simvolları (və boşluq) varsa balla.
 * Eksponensial: 1 → 1, 2 → 10, 3 → 100, 4 → 1000.
 */
function scoreLine(line, cells, me, opp, winLength) {
  let mine = 0;
  let theirs = 0;
  for (const idx of line) {
    if (cells[idx] === me) mine += 1;
    else if (cells[idx] === opp) theirs += 1;
  }
  if (mine > 0 && theirs > 0) return 0; // qarışıq xətt — heç kim qazana bilməz
  if (mine === winLength) return 1_000_000;
  if (theirs === winLength) return -1_000_000;
  if (mine > 0) return 10 ** mine;
  if (theirs > 0) return -(10 ** theirs);
  return 0;
}
