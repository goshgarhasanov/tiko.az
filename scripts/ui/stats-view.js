// Statistika modalının məzmununu HTML kimi qurur.

import { t } from "../i18n/az.js";

/**
 * Statistika modalının body-sini doldurur.
 * @param {HTMLElement} container
 * @param {Object} stats
 */
export function renderStats(container, stats) {
  const totalGames = stats.totalGames || 1;
  const winRate = stats.totalGames === 0
    ? 0
    : Math.round((stats.xWins / totalGames) * 100);
  const avgMoves = stats.totalGames === 0
    ? 0
    : Math.round(stats.totalMoves / stats.totalGames * 10) / 10;
  const playedSec = Math.floor(stats.totalDurationMs / 1000);
  const playedTxt = formatDuration(playedSec);

  const xPct = pct(stats.xWins, totalGames);
  const oPct = pct(stats.oWins, totalGames);
  const dPct = 100 - xPct - oPct;

  container.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card__label">${t("stat.totalGames")}</div>
        <div class="stat-card__value">${stats.totalGames}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">${t("stat.wins")} (X)</div>
        <div class="stat-card__value">${stats.xWins}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">${t("stat.wins")} (O)</div>
        <div class="stat-card__value">${stats.oWins}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">${t("stat.draws")}</div>
        <div class="stat-card__value">${stats.draws}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">${t("stat.winRate")} (X)</div>
        <div class="stat-card__value">${winRate}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">${t("stat.bestStreak")}</div>
        <div class="stat-card__value">${stats.bestStreak}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">${t("stat.avgMoves")}</div>
        <div class="stat-card__value">${avgMoves}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">${t("stat.fastestWin")}</div>
        <div class="stat-card__value">${stats.fastestWinMoves ?? "—"}</div>
      </div>
    </div>

    <div>
      <div class="bar" aria-label="Nəticə paylanması">
        <div class="bar__seg bar__seg--x" style="width:${xPct}%"></div>
        <div class="bar__seg bar__seg--draw" style="width:${dPct}%"></div>
        <div class="bar__seg bar__seg--o" style="width:${oPct}%"></div>
      </div>
      <div class="legend" style="margin-top:8px">
        <span><span class="legend__dot" style="background: var(--color-x)"></span>X qələbələri ${xPct}%</span>
        <span><span class="legend__dot" style="background: var(--color-text-dim)"></span>Bərabərə ${dPct}%</span>
        <span><span class="legend__dot" style="background: var(--color-o)"></span>O qələbələri ${oPct}%</span>
      </div>
    </div>

    ${renderDifficulty(stats.byDifficulty)}
    ${renderAchievements(stats.achievements)}

    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; color: var(--color-text-muted); font-size: 13px;">
      <span>⏱ Oynama vaxtı: <b style="color: var(--color-text)">${playedTxt}</b></span>
      <span>🎯 Cari seriya: <b style="color: var(--color-text)">${stats.currentStreak}</b></span>
    </div>
  `;
}

function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function renderDifficulty(byDiff) {
  const rows = [
    ["Asan",        byDiff.easy],
    ["Orta",        byDiff.medium],
    ["Çətin",       byDiff.hard],
    ["Mümkünsüz",   byDiff.impossible],
  ].map(([label, d]) => {
    const games = d.games || 0;
    const wins = d.humanWins || 0;
    const rate = games ? Math.round((wins / games) * 100) : 0;
    return `
      <div class="stat-card" style="text-align:left">
        <div class="stat-card__label">${label}</div>
        <div style="display:flex; align-items:baseline; justify-content:space-between; margin-top:4px">
          <span style="font-family: var(--font-mono); font-size: 14px;">${wins}/${games}</span>
          <span style="color: var(--color-text-muted); font-size: 12px;">${rate}%</span>
        </div>
      </div>
    `;
  }).join("");
  return `<div class="stat-grid">${rows}</div>`;
}

function renderAchievements(unlocked) {
  if (!unlocked || !unlocked.length) {
    return `<p style="color: var(--color-text-muted); font-size: 13px;">🏅 Hələ heç bir naqqaş qazanılmayıb. Daha çox oyna!</p>`;
  }
  const items = unlocked.map((a) => {
    const label = t(a.key);
    return `<span style="background: var(--color-bg-elevated); padding: 6px 12px; border-radius: var(--radius-pill); font-size: 12px;">🏅 ${label}</span>`;
  }).join("");
  return `
    <div>
      <div class="stat-card__label" style="margin-bottom: 8px;">Naqqaşlar (${unlocked.length})</div>
      <div style="display:flex; flex-wrap: wrap; gap: 6px;">${items}</div>
    </div>
  `;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}d ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}s ${m % 60}d`;
}
