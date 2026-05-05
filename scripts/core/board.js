// Lövhə vəziyyəti və qalib aşkarlanması.
// İmmutable: hər funksiya yeni vəziyyət qaytarır.

/** @typedef {("X"|"O"|null)} CellMark */
/** @typedef {{ size: number, winLength: number, cells: CellMark[] }} BoardState */

/**
 * Boş lövhə yaradır.
 * @param {number} size  Tərəf uzunluğu (məs. 3, 4, 5).
 * @param {number} winLength  Qalib üçün ardıcıl simvol sayı.
 * @returns {BoardState}
 */
export function createBoard(size = 3, winLength = 3) {
  if (size < 3 || size > 9) throw new RangeError("Lövhə ölçüsü 3-9 aralığında olmalıdır");
  if (winLength < 3 || winLength > size) {
    throw new RangeError("Qalib şərti 3-dən kiçik və ya lövhədən böyük ola bilməz");
  }
  return {
    size,
    winLength,
    cells: new Array(size * size).fill(null),
  };
}

/** Verilmiş lövhənin dərin nüsxəsini qaytarır. */
export function cloneBoard(board) {
  return { size: board.size, winLength: board.winLength, cells: board.cells.slice() };
}

/** İndeksdən sətir/sütuna çevirir. */
export function indexToRC(index, size) {
  return { row: Math.floor(index / size), col: index % size };
}

/** Sətir/sütundan indeksə çevirir. */
export function rcToIndex(row, col, size) {
  return row * size + col;
}

/** Verilmiş indeksə işarəni qoyur, yeni lövhə qaytarır. Doludursa istisna. */
export function placeMark(board, index, mark) {
  if (index < 0 || index >= board.cells.length) {
    throw new RangeError(`Yanlış xana indeksi: ${index}`);
  }
  if (board.cells[index] !== null) {
    throw new Error("Bu xana artıq doludur");
  }
  const next = cloneBoard(board);
  next.cells[index] = mark;
  return next;
}

/** Boş xanaların indekslərini qaytarır. */
export function emptyCells(board) {
  const out = [];
  for (let i = 0; i < board.cells.length; i++) {
    if (board.cells[i] === null) out.push(i);
  }
  return out;
}

/** Lövhədə heç bir boş xana qalmayıbsa true. */
export function isFull(board) {
  return board.cells.every((c) => c !== null);
}

/** Bir xananın üzərindən keçən bütün xəttləri (üfüqi/şaquli/iki diaqonal) qaytarır. */
export function linesThrough(board, index) {
  const { size } = board;
  const { row, col } = indexToRC(index, size);
  const lines = [
    // Üfüqi
    rangeIndices(row, 0, size, 0, 1, size).filter((p) => p !== null),
    // Şaquli
    rangeIndices(0, col, size, 1, 0, size).filter((p) => p !== null),
    // Diaqonal ↘
    diagonal(row, col, size, 1, 1),
    // Diaqonal ↗
    diagonal(row, col, size, -1, 1),
  ];
  return lines.map((line) => line.map(([r, c]) => rcToIndex(r, c, size)));
}

function rangeIndices(startRow, startCol, count, dr, dc, size) {
  const out = [];
  let r = startRow, c = startCol;
  for (let i = 0; i < count; i++) {
    if (r < 0 || c < 0 || r >= size || c >= size) {
      out.push(null);
    } else {
      out.push([r, c]);
    }
    r += dr; c += dc;
  }
  return out;
}

/** Bir xanadan keçən diaqonalın bütün xanalarını sırada qaytarır (kənarlardan-kənara). */
function diagonal(row, col, size, dr, dc) {
  // Diaqonalın başlanğıcına qayıdırıq.
  let r = row, c = col;
  while (r - dr >= 0 && c - dc >= 0 && r - dr < size && c - dc < size) {
    r -= dr; c -= dc;
  }
  const out = [];
  while (r >= 0 && c >= 0 && r < size && c < size) {
    out.push([r, c]);
    r += dr; c += dc;
  }
  return out;
}

/**
 * Sonuncu gedişdən sonra qalib xəttini axtarır.
 * @param {BoardState} board
 * @param {number} lastIndex  Sonuncu yerləşdirilmiş gedişin indeksi.
 * @returns {{ winner: ("X"|"O"|null), line: number[]|null, draw: boolean }}
 */
export function detectWinner(board, lastIndex = -1) {
  const { winLength } = board;
  const candidates = lastIndex >= 0
    ? linesThrough(board, lastIndex)
    : allLines(board);

  for (const line of candidates) {
    const win = scanLine(line, board.cells, winLength);
    if (win) return { winner: win.mark, line: win.indices, draw: false };
  }

  return { winner: null, line: null, draw: isFull(board) };
}

/** Lövhədəki BÜTÜN potensial xətləri qaytarır (tarixçə yoxlaması üçün). */
function allLines(board) {
  const { size } = board;
  const lines = [];
  // Üfüqi
  for (let r = 0; r < size; r++) {
    lines.push(Array.from({ length: size }, (_, c) => rcToIndex(r, c, size)));
  }
  // Şaquli
  for (let c = 0; c < size; c++) {
    lines.push(Array.from({ length: size }, (_, r) => rcToIndex(r, c, size)));
  }
  // ↘ diaqonallar
  for (let k = -(size - 1); k <= size - 1; k++) {
    const line = [];
    for (let r = 0; r < size; r++) {
      const c = r + k;
      if (c >= 0 && c < size) line.push(rcToIndex(r, c, size));
    }
    if (line.length) lines.push(line);
  }
  // ↗ diaqonallar
  for (let k = 0; k <= 2 * (size - 1); k++) {
    const line = [];
    for (let r = 0; r < size; r++) {
      const c = k - r;
      if (c >= 0 && c < size) line.push(rcToIndex(r, c, size));
    }
    if (line.length) lines.push(line);
  }
  return lines;
}

/** Bir xəttdə `winLength` ardıcıl eyni simvol axtarır. */
function scanLine(line, cells, winLength) {
  let run = 0;
  let mark = null;
  let runStart = 0;
  for (let i = 0; i < line.length; i++) {
    const c = cells[line[i]];
    if (c !== null && c === mark) {
      run += 1;
      if (run >= winLength) {
        return { mark, indices: line.slice(runStart, runStart + winLength) };
      }
    } else {
      mark = c;
      run = c !== null ? 1 : 0;
      runStart = i;
    }
  }
  return null;
}
