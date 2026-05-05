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
  const cellSize = computeCellSize(board.size);
  root.style.setProperty("--cell-size-runtime", `${cellSize}px`);

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

  // Qalib xətti üçün SVG overlay (sonradan yenilənir).
  let svg = root.querySelector(".board__strike");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "board__strike");
    svg.setAttribute("aria-hidden", "true");
    root.appendChild(svg);
  }
}

/** Qalib xanaların ortasından SVG xətt çəkir.
 *  @param {HTMLElement} root
 *  @param {number[]|null} winningLine  Qalib xanalarının indeks massivi
 */
export function drawWinningLine(root, winningLine) {
  let svg = root.querySelector(".board__strike");
  if (!svg) return;
  // Köhnə xətti silirik
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  if (!winningLine || winningLine.length < 2) return;

  // Lövhənin koordinatlarını alırıq
  const rect = root.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
  svg.setAttribute("width", rect.width);
  svg.setAttribute("height", rect.height);

  // Birinci və sonuncu xananın mərkəzi
  const first = root.querySelector(`.cell[data-index="${winningLine[0]}"]`);
  const last  = root.querySelector(`.cell[data-index="${winningLine[winningLine.length - 1]}"]`);
  if (!first || !last) return;

  const fr = first.getBoundingClientRect();
  const lr = last.getBoundingClientRect();
  const x1 = fr.left + fr.width / 2 - rect.left;
  const y1 = fr.top  + fr.height / 2 - rect.top;
  const x2 = lr.left + lr.width / 2 - rect.left;
  const y2 = lr.top  + lr.height / 2 - rect.top;

  // Qradient üçün defs
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  const gid = "strikeGrad";
  grad.setAttribute("id", gid);
  grad.setAttribute("x1", "0%"); grad.setAttribute("y1", "0%");
  grad.setAttribute("x2", "100%"); grad.setAttribute("y2", "100%");
  for (const [off, color] of [["0%", "#6366F1"], ["50%", "#D946EF"], ["100%", "#F59E0B"]]) {
    const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", off);
    stop.setAttribute("stop-color", color);
    grad.appendChild(stop);
  }
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Xətt — animasiya ilə uzanır
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1); line.setAttribute("y1", y1);
  line.setAttribute("x2", x1); line.setAttribute("y2", y1);
  line.setAttribute("stroke", `url(#${gid})`);
  line.setAttribute("stroke-width", Math.max(8, fr.width * 0.12));
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("filter", "drop-shadow(0 0 12px rgba(217, 70, 239, 0.7))");
  svg.appendChild(line);

  // Animasiya — bir frame sonra son nöqtəyə uzanır
  requestAnimationFrame(() => {
    line.style.transition = "all 480ms cubic-bezier(0.16, 1, 0.3, 1)";
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
  });
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
