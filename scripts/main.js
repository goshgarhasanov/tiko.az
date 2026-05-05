// Tətbiqin giriş nöqtəsi — bütün modulları birləşdirir, hadisələri bağlayır.

import { createGame, makeMove, undoMove, redoMove, resetGame, totalMoves, moves } from "./core/game.js";
import { indexToNotation } from "./core/notation.js";
import { pickMove } from "./ai/difficulty.js";
import { renderBoard, syncFromBoard, updateCell, clearHighlights, drawWinningLine } from "./ui/board-view.js";
import { burst as confettiBurst } from "./ui/confetti.js";
import { openModal, closeModal, wireDataCloseButtons } from "./ui/modal.js";
import { showToast, setToastElement } from "./ui/toast.js";
import { renderStats } from "./ui/stats-view.js";
import { playPlace, playWin, playDraw, playError, playClick, setSoundEnabled } from "./ui/sound.js";
import { loadSettings, saveSettings, resetSettings, DEFAULT_SETTINGS } from "./store/settings.js";
import { loadStats, saveStats, resetStats, recordGame, checkAchievements } from "./store/stats.js";
import { t } from "./i18n/az.js";

// ────────────────────────────────────────────────────────────
//  Vəziyyət
// ────────────────────────────────────────────────────────────
const state = {
  settings: loadSettings(),
  stats: loadStats(),
  game: null,
  matchScore: { X: 0, O: 0, draws: 0 },
  matchGameNumber: 1,
  aiBusy: false,
  isReplaying: false,
  replayTimerId: null,
  pendingAiTimerId: null,
  timer: { elapsedMs: 0, startedAt: null, intervalId: null, moveDeadline: null },
};

// ────────────────────────────────────────────────────────────
//  DOM istinadları
// ────────────────────────────────────────────────────────────
const dom = {
  board:        document.getElementById("board"),
  statusText:   document.getElementById("status-text"),
  timer:        document.getElementById("timer"),
  cardX:        document.getElementById("card-x"),
  cardO:        document.getElementById("card-o"),
  nameX:        document.getElementById("name-x"),
  nameO:        document.getElementById("name-o"),
  roleX:        document.getElementById("role-x"),
  roleO:        document.getElementById("role-o"),
  scoreX:       document.getElementById("score-x"),
  scoreO:       document.getElementById("score-o"),
  statusX:      document.getElementById("status-x"),
  statusO:      document.getElementById("status-o"),
  metaXWins:    document.getElementById("meta-x-wins"),
  metaOWins:    document.getElementById("meta-o-wins"),
  metaDraws:    document.getElementById("meta-draws"),
  metaMoves:    document.getElementById("meta-moves"),
  metaStreak:   document.getElementById("meta-streak"),
  ariaStatus:   document.getElementById("aria-status"),
  confetti:     document.getElementById("confetti"),
  // Düymələr
  btnRestart:   document.getElementById("btn-restart"),
  btnUndo:      document.getElementById("btn-undo"),
  btnRedo:      document.getElementById("btn-redo"),
  btnMenu:      document.getElementById("btn-menu"),
  btnSettings:  document.getElementById("btn-settings"),
  btnStats:     document.getElementById("btn-stats"),
  btnHistory:   document.getElementById("btn-history"),
  btnTheme:     document.getElementById("btn-theme"),
  btnSound:     document.getElementById("btn-sound"),
  // Modallar
  modalSettings:  document.getElementById("modal-settings"),
  modalStats:     document.getElementById("modal-stats"),
  modalHistory:   document.getElementById("modal-history"),
  modalResult:    document.getElementById("modal-result"),
  resultIcon:     document.getElementById("result-icon"),
  resultTitle:    document.getElementById("result-title"),
  resultSub:      document.getElementById("result-sub"),
  btnPlayAgain:   document.getElementById("btn-play-again"),
  btnResultMenu:  document.getElementById("btn-result-menu"),
  btnResultReplay: document.getElementById("btn-result-replay"),
  btnReplay:      document.getElementById("btn-replay"),
  moveTimeRange:  document.getElementById("moveTimeRange"),
  moveTimeValue:  document.getElementById("moveTimeValue"),
  winLengthHint:  document.getElementById("winLengthHint"),
  sizeGrids:      null, // dynamically queried after wireUp
  btnStatsReset:  document.getElementById("btn-stats-reset"),
  historyList:    document.getElementById("history-list"),
  statsBody:      document.getElementById("stats-body"),
};

// ────────────────────────────────────────────────────────────
//  Tətbiqi başlat
// ────────────────────────────────────────────────────────────
function init() {
  setToastElement(document.getElementById("toast"));
  buildSizePickGrids();
  applySettingsToDOM();
  setSoundEnabled(state.settings.sound);
  wireDataCloseButtons(document);
  bindEvents();
  bindMenuControls();
  startNewGame();
  // Pəncərə ölçüsü dəyişəndə lövhəni yenilə (cell-size).
  window.addEventListener("resize", debounce(rerenderBoard, 120));
}

/** Settings modal-da hər size-pick üçün kiçik grid preview-i yaradır. */
function buildSizePickGrids() {
  document.querySelectorAll(".size-pick__grid").forEach((grid) => {
    const size = Number(grid.dataset.size || 3);
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.replaceChildren();
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("i");
      grid.appendChild(cell);
    }
  });
}

/** Menyu daxilindəki dinamik kontrollar — slider, hint, asılılıqlar. */
function bindMenuControls() {
  const form = dom.modalSettings.querySelector("form");

  // Vaxt sliderının dəyər etiketi
  const updateTimeLabel = () => {
    const v = Number(dom.moveTimeRange.value);
    dom.moveTimeValue.textContent = v === 0 ? "Limitsiz" : `${v} san`;
  };
  dom.moveTimeRange.addEventListener("input", updateTimeLabel);
  updateTimeLabel();

  // Lövhə ölçüsü dəyişdikdə qalib şərti seçimlərini məhdudlaşdırır
  const updateWinLengthOptions = () => {
    const size = Number(form.elements.boardSize.value);
    const winInputs = form.querySelectorAll('input[name="winLength"]');
    let activeWin = Number(form.elements.winLength.value);
    winInputs.forEach((inp) => {
      const v = Number(inp.value);
      const wrap = inp.closest(".seg__opt");
      if (v > size) {
        wrap.style.display = "none";
        if (v === activeWin) {
          // başqa keçərli dəyər seç
          form.elements.winLength.value = String(Math.min(size, 3));
          activeWin = Number(form.elements.winLength.value);
        }
      } else {
        wrap.style.display = "";
      }
    });
    if (dom.winLengthHint) {
      dom.winLengthHint.textContent = `Qalib: ${activeWin} ardıcıl`;
    }
  };
  form.querySelectorAll('input[name="boardSize"]').forEach((inp) => {
    inp.addEventListener("change", updateWinLengthOptions);
  });
  form.querySelectorAll('input[name="winLength"]').forEach((inp) => {
    inp.addEventListener("change", () => {
      if (dom.winLengthHint) {
        dom.winLengthHint.textContent = `Qalib: ${form.elements.winLength.value} ardıcıl`;
      }
    });
  });
  updateWinLengthOptions();

  // Rejim dəyişdikdə body data-mode-u yeniləyir (CSS asılılıqları üçün)
  const updateModeAttr = () => {
    document.body.dataset.mode = form.elements.mode.value;
  };
  form.querySelectorAll('input[name="mode"]').forEach((inp) => {
    inp.addEventListener("change", updateModeAttr);
  });
  updateModeAttr();

  // Mövzu / skin canlı önizləmə
  form.querySelectorAll('input[name="theme"]').forEach((inp) => {
    inp.addEventListener("change", () => {
      document.body.dataset.theme = form.elements.theme.value;
    });
  });
  form.querySelectorAll('input[name="skin"]').forEach((inp) => {
    inp.addEventListener("change", () => {
      document.body.dataset.skin = form.elements.skin.value;
    });
  });
}

function bindEvents() {
  dom.btnRestart.addEventListener("click", () => { playClick(); resetMatch(); });
  dom.btnUndo.addEventListener("click", onUndo);
  dom.btnRedo.addEventListener("click", onRedo);
  dom.btnMenu.addEventListener("click", () => openModal(dom.modalSettings));
  dom.btnSettings.addEventListener("click", () => openModal(dom.modalSettings));
  dom.btnStats.addEventListener("click", openStats);
  dom.btnHistory.addEventListener("click", openHistory);
  dom.btnTheme.addEventListener("click", toggleTheme);
  dom.btnSound.addEventListener("click", toggleSound);
  dom.btnPlayAgain.addEventListener("click", () => { closeModal(dom.modalResult); nextGameInMatch(); });
  dom.btnResultMenu.addEventListener("click", () => { closeModal(dom.modalResult); openModal(dom.modalSettings); });
  dom.btnResultReplay.addEventListener("click", () => { closeModal(dom.modalResult); replayGame(); });
  dom.btnReplay.addEventListener("click", () => { closeModal(dom.modalHistory); replayGame(); });
  dom.btnStatsReset.addEventListener("click", () => {
    state.stats = resetStats();
    renderStats(dom.statsBody, state.stats);
    showToast(t("toast.statsReset"));
  });

  // Tənzimləmələr formu
  const form = dom.modalSettings.querySelector("form");
  form.addEventListener("submit", (e) => {
    if (e.submitter && e.submitter.value === "confirm") {
      e.preventDefault();
      saveFromForm(form);
      closeModal(dom.modalSettings);
      resetMatch();
    }
  });
  // Standart düyməsi
  document.getElementById("btn-reset-settings").addEventListener("click", (e) => {
    e.preventDefault();
    state.settings = resetSettings();
    fillFormFromSettings(form);
    showToast(t("toast.settingsSaved"));
  });

  // Klaviatura qısayolları
  document.addEventListener("keydown", onKeydown);
}

// ────────────────────────────────────────────────────────────
//  Yeni oyun
// ────────────────────────────────────────────────────────────
function startNewGame(firstMark = null) {
  state.game = createGame({
    size: Number(state.settings.boardSize),
    winLength: Number(state.settings.winLength),
    firstMark: firstMark || (state.matchGameNumber % 2 === 1 ? "X" : "O"),
  });
  rerenderBoard();
  updatePlayerCards();
  updateMeta();
  updateStatus();
  startTimer();

  // Əgər birinci gediş AI-də olarsa, dərhal işə salırıq.
  maybeTriggerAi();
}

function rerenderBoard() {
  renderBoard(dom.board, state.game.board, onCellClick);
  syncFromBoard(dom.board, state.game.board, {
    winningLine: state.game.winningLine,
    lastIndex: lastMoveIndex(),
  });
  // Lövhə yenidən qurulanda strikethrough silinir; əgər oyun bitibsə, yenidən çəkilir.
  drawWinningLine(dom.board, state.game.status === "won" ? state.game.winningLine : null);
}

function lastMoveIndex() {
  const m = moves(state.game);
  return m.length ? m[m.length - 1].index : -1;
}

// ────────────────────────────────────────────────────────────
//  Oyunçu gedişi
// ────────────────────────────────────────────────────────────
function onCellClick(index) {
  if (state.aiBusy) return;
  if (state.game.status !== "playing") return;
  if (state.game.board.cells[index] !== null) {
    playError();
    showToast(t("toast.cellTaken"));
    return;
  }

  const currentRole = roleForMark(state.game.current);
  if (currentRole !== "human") {
    showToast(t("toast.notYourTurn"));
    return;
  }

  applyMove(index);
}

function applyMove(index) {
  const mark = state.game.current;
  makeMove(state.game, index);
  playPlace(mark);
  syncFromBoard(dom.board, state.game.board, {
    winningLine: state.game.winningLine,
    lastIndex: index,
  });
  updatePlayerCards();
  updateMeta();
  updateStatus();

  if (state.game.status !== "playing") {
    onGameEnd();
    return;
  }

  maybeTriggerAi();
}

// ────────────────────────────────────────────────────────────
//  AI növbəsi
// ────────────────────────────────────────────────────────────
function maybeTriggerAi() {
  if (state.isReplaying) return;
  if (state.game.status !== "playing") return;
  const role = roleForMark(state.game.current);
  if (role !== "ai") return;
  state.aiBusy = true;
  dom.statusText.textContent = t("status.thinking");
  // Kiçik gecikmə — istifadəçi düşüncənin canlılığını hiss etsin.
  if (state.pendingAiTimerId) clearTimeout(state.pendingAiTimerId);
  state.pendingAiTimerId = setTimeout(() => {
    state.pendingAiTimerId = null;
    if (state.isReplaying) { state.aiBusy = false; return; }
    const idx = pickMove(state.game.board, state.game.current, state.settings.difficulty);
    state.aiBusy = false;
    if (idx >= 0) applyMove(idx);
  }, 320);
}

function roleForMark(mark) {
  switch (state.settings.mode) {
    case "pvp": return "human";
    case "cvc": return "ai";
    case "pvc":
    default:    return mark === "X" ? "human" : "ai";
  }
}

// ────────────────────────────────────────────────────────────
//  Oyun bitdi
// ────────────────────────────────────────────────────────────
function onGameEnd() {
  stopTimer();
  if (state.game.winner) {
    state.matchScore[state.game.winner] += 1;
    playWin();
    if (state.settings.confetti) confettiBurst(dom.confetti);
    // Qalib xanaların üzərindən parlaq qradient xətt çək
    drawWinningLine(dom.board, state.game.winningLine);
  } else {
    state.matchScore.draws += 1;
    playDraw();
  }

  state.stats = recordGame(state.stats, state.game, {
    humanMark: state.settings.mode === "pvc" ? "X" : "X",
    difficulty: state.settings.difficulty,
    boardSize: Number(state.settings.boardSize),
  });
  const newAchievements = checkAchievements(state.stats, state.game, {
    humanMark: "X",
    difficulty: state.settings.difficulty,
    boardSize: Number(state.settings.boardSize),
  });
  saveStats(state.stats);
  if (newAchievements.length) {
    showToast(`🏅 ${t(newAchievements[0])}`);
  }

  // Pop-up 3 saniyədən sonra göstərilir — istifadəçi qalib xəttini görsün
  setTimeout(() => showResultModal(), 3000);
  updatePlayerCards();
  updateMeta();
}

function showResultModal() {
  const isMatchOver = isMatchFinished();
  if (state.game.winner) {
    const winnerName = state.game.winner === "X" ? state.settings.nameX : state.settings.nameO;
    dom.resultIcon.textContent = isMatchOver ? "🏆" : "✓";
    dom.resultTitle.textContent = t("status.win", { name: winnerName, mark: state.game.winner });
    dom.resultSub.textContent = t("result.winInMoves", { n: totalMoves(state.game) });
  } else {
    dom.resultIcon.textContent = "🤝";
    dom.resultTitle.textContent = t("result.draw");
    dom.resultSub.textContent = t("result.allCellsFull");
  }
  if (isMatchOver) {
    dom.resultSub.textContent += " · " + t("result.matchOver");
  }
  openModal(dom.modalResult);
}

function isMatchFinished() {
  const need = Math.ceil(Number(state.settings.matchLength) / 2);
  return state.matchScore.X >= need || state.matchScore.O >= need;
}

function nextGameInMatch() {
  if (isMatchFinished()) {
    state.matchScore = { X: 0, O: 0, draws: 0 };
    state.matchGameNumber = 1;
    updatePlayerCards();
    startNewGame("X");
    return;
  }
  state.matchGameNumber += 1;
  // Növbəti oyunda başlayan dəyişir.
  startNewGame(state.matchGameNumber % 2 === 1 ? "X" : "O");
}

function resetMatch() {
  state.matchScore = { X: 0, O: 0, draws: 0 };
  state.matchGameNumber = 1;
  startNewGame("X");
}

// ────────────────────────────────────────────────────────────
//  UI yeniləmələri
// ────────────────────────────────────────────────────────────
function updatePlayerCards() {
  dom.nameX.textContent = state.settings.nameX || "Oyunçu 1";
  dom.nameO.textContent = state.settings.mode === "pvc" ? "AI" : (state.settings.nameO || "Oyunçu 2");
  dom.roleX.textContent = roleForMark("X") === "ai" ? `${t("role.ai")} · ${t(`diff.${state.settings.difficulty}`)}` : t("role.human");
  dom.roleO.textContent = roleForMark("O") === "ai" ? `${t("role.ai")} · ${t(`diff.${state.settings.difficulty}`)}` : t("role.human");
  dom.scoreX.textContent = state.matchScore.X;
  dom.scoreO.textContent = state.matchScore.O;

  const active = state.game.status === "playing" ? state.game.current : null;
  dom.cardX.dataset.active = active === "X" ? "true" : "false";
  dom.cardO.dataset.active = active === "O" ? "true" : "false";
  dom.statusX.textContent = active === "X" ? t("state.turn") : (state.game.winner === "X" ? t("state.won") : t("state.waiting"));
  dom.statusO.textContent = active === "O" ? t("state.turn") : (state.game.winner === "O" ? t("state.won") : t("state.waiting"));
}

function updateMeta() {
  dom.metaXWins.textContent = state.stats.xWins;
  dom.metaOWins.textContent = state.stats.oWins;
  dom.metaDraws.textContent = state.stats.draws;
  dom.metaMoves.textContent = state.stats.totalMoves;
  dom.metaStreak.textContent = state.stats.currentStreak;
}

function updateStatus() {
  if (state.game.status === "playing") {
    const name = state.game.current === "X" ? (state.settings.nameX || "Oyunçu 1") : (roleForMark("O") === "ai" ? "AI" : (state.settings.nameO || "Oyunçu 2"));
    if (state.matchScore.X + state.matchScore.O + state.matchScore.draws === 0 && totalMoves(state.game) === 0) {
      dom.statusText.textContent = t("status.newGame", { mark: state.game.current });
    } else {
      dom.statusText.textContent = t("status.turn", { name, mark: state.game.current });
    }
    if (Number(state.settings.matchLength) > 1) {
      dom.statusText.textContent += " · " + t("match.gameNumber", {
        current: state.matchScore.X + state.matchScore.O + state.matchScore.draws + 1,
        total: state.settings.matchLength,
      });
    }
  } else if (state.game.winner) {
    const name = state.game.winner === "X" ? state.settings.nameX : (roleForMark("O") === "ai" ? "AI" : state.settings.nameO);
    dom.statusText.textContent = t("status.win", { name, mark: state.game.winner });
  } else {
    dom.statusText.textContent = t("status.draw");
  }
  dom.ariaStatus.textContent = dom.statusText.textContent;
}

// ────────────────────────────────────────────────────────────
//  Geri / İrəli
// ────────────────────────────────────────────────────────────
function onUndo() {
  if (state.aiBusy) return;
  // İnsan vs AI rejimində iki gediş geri qayıdaq (insan + AI cüt-cütdür).
  const result = undoMove(state.game);
  if (!result) { showToast(t("toast.cantUndo")); return; }
  if (state.settings.mode === "pvc" && state.game.status === "playing" && state.game.current === "O") {
    undoMove(state.game);
  }
  syncFromBoard(dom.board, state.game.board, { winningLine: null, lastIndex: lastMoveIndex() });
  updatePlayerCards();
  updateStatus();
  playClick();
}

function onRedo() {
  if (state.aiBusy) return;
  const result = redoMove(state.game);
  if (!result) return;
  if (state.settings.mode === "pvc" && state.game.status === "playing") {
    redoMove(state.game);
  }
  syncFromBoard(dom.board, state.game.board, { winningLine: state.game.winningLine, lastIndex: lastMoveIndex() });
  updatePlayerCards();
  updateStatus();
  playClick();
}

// ────────────────────────────────────────────────────────────
//  Mövzu və səs toggle
// ────────────────────────────────────────────────────────────
function toggleTheme() {
  state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
  applySettingsToDOM();
  saveSettings(state.settings);
  playClick();
}

function toggleSound() {
  state.settings.sound = !state.settings.sound;
  setSoundEnabled(state.settings.sound);
  saveSettings(state.settings);
  dom.btnSound.setAttribute("aria-pressed", state.settings.sound ? "true" : "false");
  dom.btnSound.textContent = state.settings.sound ? "🔔" : "🔕";
}

// ────────────────────────────────────────────────────────────
//  Tarixçə
// ────────────────────────────────────────────────────────────
function openHistory() {
  const list = dom.historyList;
  list.replaceChildren();
  const items = moves(state.game);
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = t("history.empty");
    li.style.gridColumn = "1/-1";
    li.style.color = "var(--color-text-dim)";
    list.appendChild(li);
  } else {
    items.forEach((m, i) => {
      const li = document.createElement("li");
      li.dataset.mark = m.mark;
      const note = indexToNotation(m.index, state.game.board.size);
      li.textContent = `${i + 1}. ${m.mark}·${note}`;
      list.appendChild(li);
    });
  }
  openModal(dom.modalHistory);
}

function replayGame() {
  // Növbədə olan AI gedişini ləğv et və replay-i başlat.
  if (state.pendingAiTimerId) {
    clearTimeout(state.pendingAiTimerId);
    state.pendingAiTimerId = null;
  }
  if (state.replayTimerId) {
    clearTimeout(state.replayTimerId);
    state.replayTimerId = null;
  }
  state.aiBusy = false;
  state.isReplaying = true;

  // Bütün gedişləri əvvəldən kopyalayırıq (resetGame tarixçəni təmizləyir).
  const all = moves(state.game).map((m) => ({ index: m.index, mark: m.mark }));

  if (all.length === 0) {
    state.isReplaying = false;
    showToast(t("history.empty"));
    return;
  }

  // Lövhəni sıfırla — başlayan həmin oyundakı kimi qalsın.
  resetGame(state.game, { firstMark: all[0].mark });
  rerenderBoard();
  updatePlayerCards();
  updateStatus();
  showToast(t("toast.replayStart"));

  let i = 0;
  const tick = () => {
    state.replayTimerId = null;
    if (i >= all.length) {
      state.isReplaying = false;
      return;
    }
    const m = all[i++];
    // makeMove cari oyunçunun işarəsini qoyur — bu, sıralı X→O→X olduğu üçün
    // m.mark ilə üst-üstə düşür. Lakin bütövlükdə doğruluğu təmin etmək üçün
    // game.current-i məcburi olaraq m.mark-a bərabərləşdiririk.
    state.game.current = m.mark;
    try {
      makeMove(state.game, m.index);
      playPlace(m.mark);
    } catch (e) {
      // Xanaya artıq qoyulubsa, sadəcə keçid edirik.
      console.error("Replay xətası:", e);
    }
    syncFromBoard(dom.board, state.game.board, {
      winningLine: state.game.winningLine,
      lastIndex: m.index,
    });
    updatePlayerCards();
    updateStatus();
    if (i < all.length) {
      state.replayTimerId = setTimeout(tick, 520);
    } else {
      state.isReplaying = false;
    }
  };
  state.replayTimerId = setTimeout(tick, 320);
}

// ────────────────────────────────────────────────────────────
//  Statistika
// ────────────────────────────────────────────────────────────
function openStats() {
  renderStats(dom.statsBody, state.stats);
  openModal(dom.modalStats);
}

// ────────────────────────────────────────────────────────────
//  Tənzimləmələr — DOM ilə sinxron
// ────────────────────────────────────────────────────────────
function applySettingsToDOM() {
  document.body.dataset.theme = state.settings.theme;
  document.body.dataset.skin = state.settings.skin;
  document.body.dataset.animations = state.settings.animations ? "on" : "off";
  dom.btnSound.setAttribute("aria-pressed", state.settings.sound ? "true" : "false");
  dom.btnSound.textContent = state.settings.sound ? "🔔" : "🔕";
  fillFormFromSettings(dom.modalSettings.querySelector("form"));
}

function fillFormFromSettings(form) {
  if (!form) return;
  form.querySelector(`input[name="mode"][value="${state.settings.mode}"]`)?.click?.();
  form.elements.mode.value = state.settings.mode;
  form.elements.difficulty.value = state.settings.difficulty;
  form.elements.boardSize.value = String(state.settings.boardSize);
  form.elements.winLength.value = String(state.settings.winLength);
  form.elements.nameX.value = state.settings.nameX;
  form.elements.nameO.value = state.settings.nameO;
  form.elements.theme.value = state.settings.theme;
  form.elements.skin.value = state.settings.skin;
  form.elements.moveTime.value = state.settings.moveTime;
  form.elements.matchLength.value = String(state.settings.matchLength);
  form.elements.sound.checked = state.settings.sound;
  form.elements.animations.checked = state.settings.animations;
  form.elements.hints.checked = state.settings.hints;
  form.elements.confetti.checked = state.settings.confetti;
}

function saveFromForm(form) {
  state.settings.mode = form.elements.mode.value;
  state.settings.difficulty = form.elements.difficulty.value;
  state.settings.boardSize = Number(form.elements.boardSize.value);
  state.settings.winLength = Math.min(Number(form.elements.winLength.value), state.settings.boardSize);
  state.settings.nameX = (form.elements.nameX.value || "").trim() || "Oyunçu 1";
  state.settings.nameO = (form.elements.nameO.value || "").trim() || "Oyunçu 2";
  state.settings.theme = form.elements.theme.value;
  state.settings.skin = form.elements.skin.value;
  state.settings.moveTime = Number(form.elements.moveTime.value);
  state.settings.matchLength = Number(form.elements.matchLength.value);
  state.settings.sound = form.elements.sound.checked;
  state.settings.animations = form.elements.animations.checked;
  state.settings.hints = form.elements.hints.checked;
  state.settings.confetti = form.elements.confetti.checked;
  setSoundEnabled(state.settings.sound);
  saveSettings(state.settings);
  applySettingsToDOM();
  showToast(t("toast.settingsSaved"));
}

// ────────────────────────────────────────────────────────────
//  Klaviatura qısayolları
// ────────────────────────────────────────────────────────────
function onKeydown(e) {
  if (e.target.matches("input, textarea, select")) return;
  if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    e.shiftKey ? onRedo() : onUndo();
    return;
  }
  if (e.key === "r" || e.key === "R") {
    resetMatch();
    return;
  }
  if (e.key === "Escape" && state.modalSettingsOpen) {
    closeModal(dom.modalSettings);
  }
}

// ────────────────────────────────────────────────────────────
//  Vaxt sayğacı
// ────────────────────────────────────────────────────────────
function startTimer() {
  stopTimer();
  state.timer.startedAt = performance.now();
  state.timer.elapsedMs = 0;
  state.timer.intervalId = setInterval(() => {
    const ms = performance.now() - state.timer.startedAt;
    state.timer.elapsedMs = ms;
    dom.timer.textContent = formatMs(ms);
  }, 250);
}

function stopTimer() {
  if (state.timer.intervalId) clearInterval(state.timer.intervalId);
  state.timer.intervalId = null;
}

function formatMs(ms) {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ────────────────────────────────────────────────────────────
//  Köməkçilər
// ────────────────────────────────────────────────────────────
function debounce(fn, delay) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), delay);
  };
}

// ────────────────────────────────────────────────────────────
//  Demo / screenshot rejimi (?demo=settings, ?demo=mid, ?demo=win, ?demo=stats)
// ────────────────────────────────────────────────────────────
function maybeRunDemo() {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get("demo");
  if (!demo) return;

  setTimeout(() => {
    if (demo === "settings") {
      openModal(dom.modalSettings);
    } else if (demo === "stats") {
      // Bir az statistika doldurur ki, modal mənalı görünsün.
      state.stats.totalGames = 24;
      state.stats.xWins = 14;
      state.stats.oWins = 7;
      state.stats.draws = 3;
      state.stats.totalMoves = 156;
      state.stats.bestStreak = 5;
      state.stats.currentStreak = 3;
      state.stats.fastestWinMoves = 5;
      state.stats.totalDurationMs = 18 * 60 * 1000;
      state.stats.byDifficulty.easy = { games: 4, humanWins: 4 };
      state.stats.byDifficulty.medium = { games: 8, humanWins: 6 };
      state.stats.byDifficulty.hard = { games: 9, humanWins: 4 };
      state.stats.byDifficulty.impossible = { games: 3, humanWins: 0 };
      state.stats.achievements = [
        { key: "achievement.firstWin", unlockedAt: Date.now() },
        { key: "achievement.streak3", unlockedAt: Date.now() },
        { key: "achievement.fastWin", unlockedAt: Date.now() },
        { key: "achievement.beatHard", unlockedAt: Date.now() },
      ];
      openStats();
    } else if (demo === "mid") {
      // Bir neçə gediş simulyasiya edirik.
      [4, 0, 8, 2].forEach((i) => {
        try { applyMove(i); } catch {}
      });
    } else if (demo === "win") {
      // X qələbə qazanır (qalib xətti vurğulanır).
      [4, 0, 1, 5, 7, 3].forEach((i) => {
        try { applyMove(i); } catch {}
      });
    } else if (demo === "history") {
      [4, 0, 8, 2, 1].forEach((i) => {
        try { applyMove(i); } catch {}
      });
      openHistory();
    }
  }, 250);
}

// İşə sal
init();
maybeRunDemo();
