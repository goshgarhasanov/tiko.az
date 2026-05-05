// Bütün UI strinqləri — Azərbaycan dilində.
// Yeni sətir əlavə edilərkən burada açar yaradılır və UI-də t("açar") ilə çağrılır.

export const STRINGS = {
  // Status mesajları
  "status.newGame":        "Yeni oyun. {mark} başlayır.",
  "status.turn":           "{name} ({mark}) növbəsi",
  "status.thinking":       "AI düşünür…",
  "status.win":            "Qalib: {name} ({mark})",
  "status.draw":           "Bərabərə — heç kim qalib gəlmədi",
  "status.timeout":        "Vaxt bitdi! {name} gediş etmədi",

  // Düymələr
  "btn.start":             "Başla",
  "btn.restart":           "Yenidən",
  "btn.undo":              "Geri",
  "btn.redo":              "İrəli",
  "btn.menu":              "Menyu",
  "btn.close":             "Bağla",
  "btn.save":              "Yadda saxla və başla",
  "btn.reset":             "Standart",
  "btn.playAgain":         "Yenidən oyna",
  "btn.replay":            "Təkrar oxut",

  // Rejimlər
  "mode.pvp":              "İnsan vs İnsan",
  "mode.pvc":              "İnsan vs AI",
  "mode.cvc":              "AI vs AI",

  // Çətinlik
  "diff.easy":             "Asan",
  "diff.medium":           "Orta",
  "diff.hard":             "Çətin",
  "diff.impossible":       "Mümkünsüz",

  // Oyunçu rolları
  "role.human":            "İnsan",
  "role.ai":               "AI",

  // Vəziyyətlər
  "state.turn":            "Növbə",
  "state.waiting":         "Gözləyir",
  "state.won":             "Qalib",
  "state.lost":            "Uduzdu",
  "state.drew":            "Bərabərə",

  // Statistika başlıqları
  "stat.totalGames":       "Ümumi oyun",
  "stat.wins":             "Qələbələr",
  "stat.losses":           "Məğlubiyyətlər",
  "stat.draws":            "Bərabərə",
  "stat.winRate":          "Qələbə faizi",
  "stat.bestStreak":       "Ən uzun seriya",
  "stat.currentStreak":    "Cari seriya",
  "stat.avgMoves":         "Orta gediş",
  "stat.fastestWin":       "Ən sürətli qələbə",
  "stat.totalMoves":       "Ümumi gediş",
  "stat.timePlayed":       "Oynama vaxtı",

  // Oyun bitdi
  "result.youWin":         "Qələbə!",
  "result.youLose":        "Məğlubiyyət",
  "result.draw":           "Bərabərə!",
  "result.winInMoves":     "{n} gedişdə qələbə",
  "result.allCellsFull":   "Lövhə doldu — heç kim üstün gəlmədi",
  "result.matchOver":      "Qarşılaşma bitdi!",

  // Bildirişlər
  "toast.settingsSaved":   "Tənzimləmələr saxlanıldı",
  "toast.statsReset":      "Statistika sıfırlandı",
  "toast.replayStart":     "Təkrar oxutma başladı",
  "toast.cantUndo":        "Geri almaq mümkün deyil",
  "toast.cellTaken":       "Bu xana artıq doludur",
  "toast.notYourTurn":     "Sizin növbəniz deyil",

  // Tarixçə
  "history.empty":         "Hələ heç bir gediş edilməyib",
  "history.move":          "{n}.",

  // Naqqaş
  "achievement.firstWin":  "İlk Qələbə",
  "achievement.streak3":   "3 ardıcıl qələbə",
  "achievement.streak10":  "10 ardıcıl qələbə",
  "achievement.fastWin":   "Sürətli qələbə (5 gedişdən az)",
  "achievement.beatHard":  "Çətin AI-ni məğlub etdi",
  "achievement.beatImp":   "Mümkünsüz AI-ni məğlub etdi",
  "achievement.bigBoard":  "5×5 lövhədə qalib gəldi",

  // Qarşılaşma
  "match.gameNumber":      "Oyun {current} / {total}",
  "match.leadingX":        "X öndədir",
  "match.leadingO":        "O öndədir",
  "match.tied":            "Bərabər vəziyyət",
};

/**
 * Açara görə tərcüməni qaytarır. Dəyişənləri {ad} formatında dəyişdirir.
 * @param {string} key
 * @param {Object<string, string|number>} [vars]
 * @returns {string}
 */
export function t(key, vars = {}) {
  let s = STRINGS[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}
