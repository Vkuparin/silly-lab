// Finnish/English string tables for v0.2.0 (design §13).
// Pure module — no React, no DOM. localStorage access is wrapped in
// try/catch and degrades to the default language ("fi").

export type Lang = "en" | "fi";

export const en = {
  title: "Whack-a-Mole",
  subtitle: "Whack the mole, dodge the bombs — the clock is ticking!",
  play: "Play",
  playAgain: "Play again",
  score: "Score",
  time: "Time",
  streak: "Streak",
  highScores: "High Scores",
  highScoresEmpty: "No scores yet — be the first!",
  gameOver: "Game over",
  hits: "Hits",
  misses: "Misses",
  accuracy: "Accuracy",
  bestStreak: "Best streak",
  goldens: "Goldens",
  bombs: "Bombs",
  yourName: "Your name",
  namePlaceholder: "Anonymous",
  saveScore: "Save score",
  skip: "Skip",
  savedRank: "#{rank} on the board",
  soundOn: "Unmute sound",
  soundOff: "Mute sound",
  goldenHint: "Golden mole: +3 points",
  bombHint: "Bomb: −2 points",
  langLabel: "Language",
  hole: "Hole {n}",
  difficulty: "Difficulty",
  level: "Level {n}",
  musicOn: "Music on",
  musicOff: "Music off",
};

export type StrKey = keyof typeof en;

export const fi: Record<StrKey, string> = {
  title: "Whack-a-Mole",
  subtitle: "Klikkaa myyrää, vältä pommeja — kello käy!",
  play: "Pelaa",
  playAgain: "Pelaa uudelleen",
  score: "Pisteet",
  time: "Aika",
  streak: "Putki",
  highScores: "Parhaat tulokset",
  highScoresEmpty: "Ei tuloksia vielä — ole ensimmäinen!",
  gameOver: "Peli loppui",
  hits: "Osumat",
  misses: "Hudit",
  accuracy: "Tarkkuus",
  bestStreak: "Paras putki",
  goldens: "Kultamyyrät",
  bombs: "Pommit",
  yourName: "Nimesi",
  namePlaceholder: "_____",
  saveScore: "Tallenna tulos",
  skip: "Ohita",
  savedRank: "Listasija #{rank}",
  soundOn: "Äänet päälle",
  soundOff: "Äänet pois",
  goldenHint: "Kultainen myyrä: +3 pistettä",
  bombHint: "Pommi: −2 pistettä",
  langLabel: "Kieli",
  hole: "Reikä {n}",
  difficulty: "Vaikeustaso",
  level: "Taso {n}",
  musicOn: "Musiikki päälle",
  musicOff: "Musiikki pois",
};

export const LANG_KEY = "whackamole.lang.v1";

export function t(lang: Lang, key: StrKey): string {
  return (lang === "en" ? en : fi)[key];
}

export function loadLang(): Lang {
  try {
    return globalThis.localStorage?.getItem(LANG_KEY) === "en" ? "en" : "fi";
  } catch {
    return "fi";
  }
}

export function saveLang(lang: Lang): void {
  try {
    globalThis.localStorage?.setItem(LANG_KEY, lang);
  } catch {
    // Persisting the preference is best-effort.
  }
}
