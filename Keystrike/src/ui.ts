import { sortScores, type Score } from './storage.ts';
import type { Word } from './i18n.ts';
export const escapeHtml = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function leaderboard(rows: Score[], t: (key: Word) => string) {
  return rows.length
    ? `<table class="score-table"><thead><tr><th>#</th><th>${t('nickname')}</th><th>${t('score')}</th><th>${t('accuracy')}</th></tr></thead><tbody>${[
        ...rows,
      ]
        .sort(sortScores)
        .map(
          (r, i) =>
            `<tr><td>${i + 1}</td><td>${escapeHtml(r.name || t('anonymous'))}</td><td>${r.score.toLocaleString()}</td><td>${r.accuracy === null ? '—' : Math.round(r.accuracy * 100) + '%'}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : `<p>${t('noScores')}</p>`;
}
