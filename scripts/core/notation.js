// Şahmat üslubunda gediş notasiyası: A1, B2, C3...
// Sütunlar A-Z (sol→sağ), sətirlər 1-N (yuxarı→aşağı).

import { indexToRC } from "./board.js";

const COLS = "ABCDEFGHIJKLMNOPQRS";

/**
 * İndeksi notasiya sətirinə çevirir (məs. (3, 0) → "A3").
 * @param {number} index
 * @param {number} size
 * @returns {string}
 */
export function indexToNotation(index, size) {
  const { row, col } = indexToRC(index, size);
  return `${COLS[col]}${row + 1}`;
}

/**
 * Notasiya sətrini indeksə çevirir.
 * @param {string} notation
 * @param {number} size
 * @returns {number}
 */
export function notationToIndex(notation, size) {
  const m = notation.toUpperCase().match(/^([A-Z])(\d+)$/);
  if (!m) throw new Error(`Yanlış notasiya: ${notation}`);
  const col = COLS.indexOf(m[1]);
  const row = Number(m[2]) - 1;
  if (col < 0 || row < 0 || col >= size || row >= size) {
    throw new RangeError(`Lövhə hüdudundan kənar: ${notation}`);
  }
  return row * size + col;
}
