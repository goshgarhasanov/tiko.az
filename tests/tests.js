// Brauzerdə işə düşən sadə test sistemi.
// Hər test sinxron funksiyadır; throw atılarsa uğursuzdur.

import { createBoard, placeMark, detectWinner, isFull, emptyCells } from "../scripts/core/board.js";
import { createGame, makeMove, undoMove, totalMoves } from "../scripts/core/game.js";
import { indexToNotation, notationToIndex } from "../scripts/core/notation.js";
import { pickMove } from "../scripts/ai/difficulty.js";
import { evaluate } from "../scripts/ai/heuristic.js";

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg || "bərabər deyil"}: gözlənilirdi ${e}, gəldi ${a}`);
}
function truthy(v, msg) { if (!v) throw new Error(msg || "yanlış"); }

// ────────────────────────────────────────────────────────────
//  Lövhə
// ────────────────────────────────────────────────────────────
test("createBoard 3×3 boş yaradır", () => {
  const b = createBoard(3, 3);
  eq(b.size, 3);
  eq(b.cells.length, 9);
  truthy(b.cells.every((c) => c === null));
});

test("placeMark hədəfə işarə qoyur, orijinala toxunmur (immutable)", () => {
  const b = createBoard(3, 3);
  const next = placeMark(b, 4, "X");
  eq(next.cells[4], "X");
  eq(b.cells[4], null);
});

test("placeMark dolu xanada xəta atır", () => {
  let threw = false;
  try {
    let b = createBoard(3, 3);
    b = placeMark(b, 0, "X");
    placeMark(b, 0, "O");
  } catch { threw = true; }
  truthy(threw);
});

test("detectWinner sətri tapır", () => {
  let b = createBoard(3, 3);
  b = placeMark(b, 0, "X");
  b = placeMark(b, 1, "X");
  b = placeMark(b, 2, "X");
  const r = detectWinner(b, 2);
  eq(r.winner, "X");
  eq(r.line.sort(), [0, 1, 2]);
});

test("detectWinner sütunu tapır", () => {
  let b = createBoard(3, 3);
  b = placeMark(b, 0, "O");
  b = placeMark(b, 3, "O");
  b = placeMark(b, 6, "O");
  const r = detectWinner(b, 6);
  eq(r.winner, "O");
});

test("detectWinner diaqonalı tapır", () => {
  let b = createBoard(3, 3);
  b = placeMark(b, 0, "X");
  b = placeMark(b, 4, "X");
  b = placeMark(b, 8, "X");
  const r = detectWinner(b, 8);
  eq(r.winner, "X");
});

test("detectWinner bərabərə yarış aşkarlayır", () => {
  let b = createBoard(3, 3);
  // X O X
  // X O X
  // O X O
  const seq = [
    [0, "X"], [1, "O"], [2, "X"],
    [3, "X"], [4, "O"], [5, "X"],
    [7, "X"], [6, "O"], [8, "O"],
  ];
  for (const [i, m] of seq) b = placeMark(b, i, m);
  const r = detectWinner(b, 8);
  eq(r.winner, null);
  truthy(r.draw);
  truthy(isFull(b));
});

test("4×4 lövhədə 4-lük qalib", () => {
  let b = createBoard(4, 4);
  b = placeMark(b, 0, "X");
  b = placeMark(b, 1, "X");
  b = placeMark(b, 2, "X");
  b = placeMark(b, 3, "X");
  const r = detectWinner(b, 3);
  eq(r.winner, "X");
});

test("5×5 lövhədə 4-lük qalib şərtilə işləyir", () => {
  let b = createBoard(5, 4);
  b = placeMark(b, 6, "O");
  b = placeMark(b, 12, "O");
  b = placeMark(b, 18, "O");
  b = placeMark(b, 24, "O");
  const r = detectWinner(b, 24);
  eq(r.winner, "O");
});

// ────────────────────────────────────────────────────────────
//  Notasiya
// ────────────────────────────────────────────────────────────
test("indexToNotation 3×3 düzgün", () => {
  eq(indexToNotation(0, 3), "A1");
  eq(indexToNotation(4, 3), "B2");
  eq(indexToNotation(8, 3), "C3");
});

test("notationToIndex tərs çevrilir", () => {
  eq(notationToIndex("A1", 3), 0);
  eq(notationToIndex("c3", 3), 8);
});

// ────────────────────────────────────────────────────────────
//  Oyun axını
// ────────────────────────────────────────────────────────────
test("makeMove növbəni dəyişir", () => {
  const g = createGame({ size: 3, winLength: 3 });
  eq(g.current, "X");
  makeMove(g, 0);
  eq(g.current, "O");
  makeMove(g, 1);
  eq(g.current, "X");
});

test("makeMove qalibdən sonra status dəyişir", () => {
  const g = createGame({ size: 3, winLength: 3 });
  makeMove(g, 0); // X
  makeMove(g, 3); // O
  makeMove(g, 1); // X
  makeMove(g, 4); // O
  makeMove(g, 2); // X — qələbə
  eq(g.status, "won");
  eq(g.winner, "X");
});

test("undoMove sonuncu gedişi geri qaytarır", () => {
  const g = createGame();
  makeMove(g, 4);
  eq(totalMoves(g), 1);
  const m = undoMove(g);
  eq(m.index, 4);
  eq(g.board.cells[4], null);
  eq(totalMoves(g), 0);
});

// ────────────────────────────────────────────────────────────
//  AI
// ────────────────────────────────────────────────────────────
test("AI mümkünsüz çətinlikdə qələbə imkanını həmişə görür", () => {
  let b = createBoard(3, 3);
  // X iki simvol — birini tamamlamaq üçün 2-ci xananı götürməlidir
  b = placeMark(b, 0, "X");
  b = placeMark(b, 1, "X");
  b = placeMark(b, 4, "O");
  const move = pickMove(b, "X", "impossible");
  eq(move, 2, "AI 2-ci xanaya qoyub qalib olmalıdır");
});

test("AI mümkünsüz çətinlikdə rəqibin qələbəsini blok edir", () => {
  let b = createBoard(3, 3);
  // O iki simvol — X blok etməlidir
  b = placeMark(b, 0, "O");
  b = placeMark(b, 1, "O");
  b = placeMark(b, 4, "X");
  const move = pickMove(b, "X", "impossible");
  eq(move, 2, "X 2-ci xananı blok etməlidir");
});

test("AI mümkünsüz çətinlikdə özünü uduzdurmur (3×3 boş başlanğıc)", () => {
  // Mümkünsüz vs mümkünsüz — həmişə bərabərə.
  const g = createGame();
  for (let i = 0; i < 9; i++) {
    if (g.status !== "playing") break;
    const idx = pickMove(g.board, g.current, "impossible");
    makeMove(g, idx);
  }
  truthy(g.winner === null, "Mümkünsüz vs mümkünsüz bərabərə bitməlidir");
});

test("Heuristik dolu xəttə müsbət bal verir", () => {
  let b = createBoard(3, 3);
  b = placeMark(b, 0, "X");
  b = placeMark(b, 1, "X");
  truthy(evaluate(b, "X") > 0, "X üçün müsbət bal");
  truthy(evaluate(b, "O") < 0, "O üçün mənfi bal");
});

// ────────────────────────────────────────────────────────────
//  İcra və hesabat
// ────────────────────────────────────────────────────────────
const root = document.getElementById("results");
let pass = 0, fail = 0;

for (const t of tests) {
  const li = document.createElement("li");
  li.className = "test";
  try {
    t.fn();
    li.classList.add("ok");
    li.innerHTML = `<span class="pill ok">✓ KEÇDİ</span> ${escapeHtml(t.name)}`;
    pass += 1;
  } catch (err) {
    li.classList.add("fail");
    li.innerHTML = `<span class="pill fail">✗ UĞURSUZ</span> ${escapeHtml(t.name)}<pre>${escapeHtml(String(err && err.message || err))}</pre>`;
    fail += 1;
  }
  root.appendChild(li);
}

document.getElementById("summary").textContent =
  `${pass}/${tests.length} test keçir · ${fail} uğursuz`;
document.getElementById("summary").className = fail === 0 ? "ok" : "fail";

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
