import { invoke, isTauri } from '@tauri-apps/api/core';
import {
  catalog,
  type Category,
  type Lang,
  type Track,
  type Rules,
  type Layout,
} from './content.ts';
import type { Game } from './core.ts';
export interface Settings {
  lang: Lang;
  track: Track;
  rules: Rules;
  layout: Layout;
  primaryOnly: boolean;
  anyShift: boolean;
  intensity: 'calm' | 'standard' | 'spectacular';
  motion: boolean;
  guide: boolean;
  sfx: number;
  music: number;
  mute: boolean;
  remember: boolean;
  nickname: string;
}
export interface Score {
  id: string;
  board: string;
  name: string;
  score: number;
  defended: boolean;
  boss: boolean;
  impacts: number;
  at: number;
  accuracy: number | null;
}
export interface Snapshot {
  schema: 1;
  revision: number;
  settings: Settings;
  balance: number;
  owned: Record<Category, number>;
  equipped: Record<Category, number>;
  cannonName: string;
  progress: Record<
    string,
    { unlocked: number; stars: Record<string, number>; completed: number[] }
  >;
  scores: Score[];
  active: { id: string; receipts: number[] } | null;
}
export function fresh(): Snapshot {
  return {
    schema: 1,
    revision: 0,
    settings: {
      lang: 'fi',
      track: 'keyboard',
      rules: 'standard',
      layout: 'fi',
      primaryOnly: false,
      anyShift: false,
      intensity: 'standard',
      motion: false,
      guide: true,
      sfx: 0.6,
      music: 0.3,
      mute: false,
      remember: false,
      nickname: '',
    },
    balance: 0,
    owned: { color: 0, shape: 0, impact: 0, sound: 0, skin: 0 },
    equipped: { color: 0, shape: 0, impact: 0, sound: 0, skin: 0 },
    cannonName: '',
    progress: {},
    scores: [],
    active: null,
  };
}
export function cleanName(value: string) {
  const text = value.replace(/[\p{Cc}\p{Cf}]/gu, '').trim();
  return Array.from(
    new Intl.Segmenter('fi', { granularity: 'grapheme' }).segment(text),
    (x) => x.segment,
  )
    .slice(0, 16)
    .join('');
}
const int = (n: unknown, max: number) =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max;
export function validate(value: unknown): Snapshot {
  const v = value as Snapshot;
  if (
    !v ||
    v.schema !== 1 ||
    !int(v.revision, Number.MAX_SAFE_INTEGER) ||
    !int(v.balance, 1e9) ||
    !v.settings ||
    !v.progress ||
    !v.owned ||
    !v.equipped
  )
    throw Error('Invalid data schema');
  const s = v.settings;
  if (
    !['fi', 'en'].includes(s.lang) ||
    !['keyboard', 'mouse', 'mixed'].includes(s.track) ||
    !['standard', 'relaxed', 'pro', 'practice'].includes(s.rules) ||
    !['fi', 'us'].includes(s.layout) ||
    !['calm', 'standard', 'spectacular'].includes(s.intensity)
  )
    throw Error('Invalid settings');
  for (const k of ['primaryOnly', 'anyShift', 'motion', 'guide', 'mute', 'remember'] as const)
    if (typeof s[k] !== 'boolean') throw Error('Invalid setting');
  for (const k of ['sfx', 'music'] as const)
    if (typeof s[k] !== 'number' || !Number.isFinite(s[k]) || s[k] < 0 || s[k] > 1)
      throw Error('Invalid volume');
  if (
    typeof s.nickname !== 'string' ||
    s.nickname !== cleanName(s.nickname) ||
    typeof v.cannonName !== 'string' ||
    v.cannonName !== cleanName(v.cannonName)
  )
    throw Error('Invalid name');
  for (const c of catalog)
    if (!int(v.owned[c.id], c.prices.length - 1) || !int(v.equipped[c.id], v.owned[c.id]))
      throw Error('Invalid equipment');
  if (Object.keys(v.progress).length > 100) throw Error('Oversized progress');
  for (const [key, p] of Object.entries(v.progress)) {
    if (
      !/^(keyboard|mouse|mixed):(fi|us):(primary|two-buttons)$/.test(key) ||
      !p ||
      !int(p.unlocked, 12) ||
      p.unlocked < 1 ||
      !Array.isArray(p.completed) ||
      p.completed.some((l) => !int(l, 12) || l < 1) ||
      !p.stars ||
      Object.keys(p.stars).length > 100 ||
      Object.entries(p.stars).some(
        ([k, n]) => !/^(standard|relaxed|pro):\d{1,2}$/.test(k) || !int(n, 3),
      )
    )
      throw Error('Invalid progress');
  }
  if (!Array.isArray(v.scores) || v.scores.length > 10000) throw Error('Invalid boards');
  const ids = new Set<string>();
  const counts = new Map<string, number>();
  for (const r of v.scores) {
    if (
      !r ||
      typeof r.id !== 'string' ||
      r.id.length > 100 ||
      ids.has(r.id) ||
      typeof r.board !== 'string' ||
      r.board.length > 150 ||
      typeof r.name !== 'string' ||
      r.name !== cleanName(r.name) ||
      !int(r.score, 1e9) ||
      !int(r.impacts, 100) ||
      !int(r.at, Number.MAX_SAFE_INTEGER) ||
      typeof r.defended !== 'boolean' ||
      typeof r.boss !== 'boolean' ||
      (r.accuracy !== null &&
        (typeof r.accuracy !== 'number' ||
          !Number.isFinite(r.accuracy) ||
          r.accuracy < 0 ||
          r.accuracy > 1))
    )
      throw Error('Invalid score');
    ids.add(r.id);
    counts.set(r.board, (counts.get(r.board) ?? 0) + 1);
    if (counts.get(r.board)! > 10) throw Error('Oversized board');
  }
  if (
    v.active !== null &&
    (!v.active ||
      typeof v.active.id !== 'string' ||
      v.active.id.length > 100 ||
      !Array.isArray(v.active.receipts) ||
      v.active.receipts.length > 500 ||
      new Set(v.active.receipts).size !== v.active.receipts.length ||
      v.active.receipts.some((n) => !int(n, 1000)))
  )
    throw Error('Invalid ledger');
  return v;
}
export function progressKey(s: Settings) {
  return `${s.track}:${s.layout}:${s.track === 'keyboard' ? 'two-buttons' : s.primaryOnly ? 'primary' : 'two-buttons'}`;
}
export function sortScores(a: Score, b: Score) {
  return (
    b.score - a.score ||
    Number(b.defended) - Number(a.defended) ||
    Number(b.boss) - Number(a.boss) ||
    a.impacts - b.impacts ||
    a.at - b.at ||
    a.id.localeCompare(b.id)
  );
}
export class Store {
  data = fresh();
  location = 'Browser preview (separate localStorage)';
  notice = '';
  private queue = Promise.resolve();
  async load() {
    let raw: string[] = [];
    try {
      if (isTauri()) {
        const result = await invoke<{ location: string; candidates: string[] }>('load_data');
        this.location = result.location;
        raw = result.candidates;
      } else
        raw = [
          localStorage.getItem('keystrike-v1') ?? '',
          localStorage.getItem('keystrike-v1-backup') ?? '',
        ];
      const valid = raw
        .flatMap((x) => {
          try {
            return [validate(JSON.parse(x))];
          } catch {
            return [];
          }
        })
        .sort((a, b) => b.revision - a.revision);
      if (valid.length) {
        this.data = valid[0];
        if (raw[0] && raw[0] !== JSON.stringify(valid[0])) this.notice = 'recovered';
      } else if (raw.some(Boolean)) this.notice = 'corrupt';
      // Interrupted combat is never resumed or replayed for currency.
      if (this.data.active)
        await this.change((d) => {
          d.active = null;
        });
    } catch {
      this.notice = 'writeFailed';
    }
  }
  change(mutator: (d: Snapshot) => void): Promise<boolean> {
    let result = false;
    const job = this.queue.then(async () => {
      const d = structuredClone(this.data);
      mutator(d);
      d.revision++;
      validate(d);
      try {
        const text = JSON.stringify(d);
        if (isTauri()) await invoke('save_data', { text, expected: this.data.revision });
        else {
          const old = localStorage.getItem('keystrike-v1');
          if (old) localStorage.setItem('keystrike-v1-backup', old);
          localStorage.setItem('keystrike-v1', text);
        }
        this.data = d;
        this.notice = '';
        result = true;
      } catch {
        this.notice = 'writeFailed';
      }
    });
    this.queue = job.catch(() => {});
    return job.then(() => result);
  }
  begin(id: string) {
    return this.change((d) => {
      d.active = { id, receipts: [] };
    });
  }
  reward(id: string, ship: number, amount: number) {
    return this.change((d) => {
      if (d.active?.id !== id) throw Error('Sealed attempt');
      if (!d.active.receipts.includes(ship)) {
        d.balance += amount;
        d.active.receipts.push(ship);
      }
    });
  }
  complete(id: string, g: Game) {
    return this.change((d) => {
      if (d.active?.id !== id) throw Error('Sealed attempt');
      if (g.config.rules !== 'practice' && g.shield > 0) {
        const key = progressKey(d.settings);
        const p = (d.progress[key] ??= { unlocked: 1, stars: {}, completed: [] });
        p.unlocked = Math.min(12, Math.max(p.unlocked, g.config.level + 1));
        const sk = `${g.config.rules}:${g.config.level}`;
        p.stars[sk] = Math.max(p.stars[sk] ?? 0, g.stars);
        if (
          ['standard', 'relaxed'].includes(g.config.rules) &&
          !p.completed.includes(g.config.level)
        )
          p.completed.push(g.config.level);
      }
      d.active = null;
    });
  }
  purchase(category: Category, tier: number) {
    return this.change((d) => {
      const c = catalog.find((x) => x.id === category)!;
      if (tier !== d.owned[category] + 1 || tier >= c.prices.length || d.balance < c.prices[tier])
        throw Error('Invalid purchase');
      d.balance -= c.prices[tier];
      d.owned[category] = tier;
    });
  }
  saveScore(id: string, g: Game, name: string) {
    return this.change((d) => {
      if (g.config.rules === 'practice' || d.scores.some((s) => s.id === id)) return;
      const row: Score = {
        id,
        board: g.board,
        name: cleanName(name),
        score: g.score,
        defended: g.shield > 0,
        boss: g.bossKilled,
        impacts: g.impacts,
        at: Date.now(),
        accuracy: g.accuracy,
      };
      const board = [...d.scores.filter((x) => x.board === g.board), row]
        .sort(sortScores)
        .slice(0, 10);
      d.scores = [...d.scores.filter((x) => x.board !== g.board), ...board];
    });
  }
}
