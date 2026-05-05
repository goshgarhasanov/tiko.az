// Lövhənin DOM nümayəndəsi — render və hadisə bağlama.

import { indexToNotation } from "../core/notation.js";

const X_SYMBOL = "✕";
const O_SYMBOL = "◯";

/**
 * Lövhəni DOM-da qurur.
 * @param {HTMLElement} root
 * @param {Object} board
 * @param {(index: number) => void} onCellClick
 */
export function renderBoard(root, board, onCellClick) {
  root.style.gridTemplateColumns = `repeat(${board.size}, 1fr)`;
  // Hər ölçü üçün cell-size avtomatik tənzimlənir.
  const cellSize = computeCellSize(board.size);
  root.style.setProperty("--cell-size-runtime", `${cellSize}px`);

  // Mövcud xanaları silirik və yenilərini yaradırıq.
  root.replaceChildren();
  for (let i = 0; i < board.cells.length; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = String(i);
    cell.dataset.notation = indexToNotation(i, board.size);
    cell.style.setProperty("--cell-size", `${cellSize}px`);
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", `Xana ${cell.dataset.notation}`);
    cell.addEventListener("click", () => onCellClick(i));
    root.appendChild(cell);
  }
}

/** Tək xananı yeniləyir (mark, vurğu, ipucu). */
export function updateCell(root, index, { mark, last, winning, hint, preview } = {}) {
  const cell = root.querySelector(`.cell[data-index="${index}"]`);
  if (!cell) return;

  if (mark) {
    cell.dataset.mark = mark;
    cell.textContent = mark === "X" ? X_SYMBOL : O_SYMBOL;
    cell.disabled = true;
    cell.setAttribute("aria-label", `${cell.dataset.notation}: ${mark}`);
  } else if (mark === null) {
    delete cell.dataset.mark;
    cell.textContent = "";
    cell.disabled = false;
  }

  if (last !== undefined) {
    if (last) cell.dataset.last = "true";
    else delete cell.dataset.last;
  }
  if (winning !== undefined) {
    if (winning) cell.dataset.winning = "true";
    else delete cell.dataset.winning;
  }
  if (hint !== undefined) {
    if (hint) cell.dataset.hint = "true";
    else delete cell.dataset.hint;
  }
  if (preview !== undefined) {
    cell.dataset.preview = preview === "X" ? X_SYMBOL : preview === "O" ? O_SYMBOL : "";
  }
}

/** Bütün xanalardan vurğuları silir. */
export function clearHighlights(root) {
  root.querySelectorAll(".cell").forEach((cell) => {
    delete cell.dataset.last;
    delete cell.dataset.winning;
    delete cell.dataset.hint;
  });
}

/** Lövhəni tam yeniləyir (vəziyyətə əsasən). */
export function syncFromBoard(root, board, { winningLine = null, lastIndex = -1 } = {}) {
  for (let i = 0; i < board.cells.length; i++) {
    const mark = board.cells[i];
    updateCell(root, i, {
      mark,
      last: i === lastIndex,
      winning: winningLine ? winningLine.includes(i) : false,
    });
  }
}

/** Lövhənin viewport-a uyğun xana ölçüsünü hesablayır. */
function computeCellSize(size) {
  const maxBoard = Math.min(window.innerWidth - 80, 540);
  const totalGaps = (size - 1) * 6 + 24; // padding + gap
  return Math.max(48, Math.floor((maxBoard - totalGaps) / size));
}
