import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, type Config, type Target } from '../src/core.ts';
import {
  buttons,
  validateCampaigns,
  sentences,
  textCharacters,
  type MouseProfile,
} from '../src/campaigns.ts';
import { fresh, validate, Store, progressKey, campaignUnlocked } from '../src/storage.ts';
import type { Track, Rules, Lang } from '../src/content.ts';
const config = (patch: Partial<Config> = {}): Config => ({
  track: 'keyboard',
  rules: 'standard',
  level: 1,
  layout: 'fi',
  primaryOnly: false,
  anyShift: false,
  seed: 42,
  ...patch,
});
function hit(g: Game, t: Target) {
  const p = t.steps[t.pip];
  if (p.kind === 'text')
    for (const text of p.text.slice(t.textBuffer.length)) g.action({ kind: 'text', text });
  else if (p.kind === 'mouse') g.action({ kind: 'mouse', button: p.button, x: t.x, y: t.y });
  else if (p.kind === 'pair') {
    g.action({ kind: 'key', key: 'ShiftLeft', held: ['ShiftLeft'] });
    g.action({ kind: 'key', key: p.key, held: [p.key] });
  } else g.action({ kind: 'key', key: p.key });
}
test('all 24 scene/music/word inventories and taught characters are valid', () => {
  validateCampaigns();
  assert.throws(() => textCharacters('mixed', 12, 'fi', 'us'));
  assert(textCharacters('mixed', 12, 'fi', 'fi').includes('Space'));
});
for (const track of ['keyboard', 'mixed', 'mouse'] as Track[])
  for (const rules of ['standard', 'relaxed', 'pro'] as Rules[])
    for (const lang of ['fi', 'en'] as Lang[])
      for (const profile of (track === 'keyboard'
        ? ['two-buttons']
        : ['primary', 'two-buttons', 'extended']) as MouseProfile[])
        for (let level = 1; level <= 12; level++)
          test(`return ${track} ${rules} ${lang} ${profile} L${level}`, () => {
            const g = new Game(
              config({
                campaign: 'return',
                track,
                rules,
                textLang: lang,
                layout: lang === 'fi' ? 'fi' : 'us',
                mouseProfile: profile,
                primaryOnly: profile === 'primary',
                level,
              }),
            );
            const phases = new Set<number>(),
              rewards = new Set<number>();
            let text = false;
            for (let i = 0; i < 30000 && !g.finished; i++) {
              for (const t of [...g.targets])
                if (g.time >= t.ready) {
                  if (t.kind === 'boss') phases.add(t.phaseIndex);
                  text ||= t.steps[t.pip].kind === 'text';
                  hit(g, t);
                }
              g.step(1 / 60);
              for (const e of g.takeEvents())
                if (e.kind === 'kill') {
                  assert(!rewards.has(e.target!.id));
                  rewards.add(e.target!.id);
                }
            }
            assert(g.finished && g.bossKilled);
            assert.equal(g.shield, g.startShield);
            assert.equal(g.accuracy, 1);
            assert.equal(g.stars, 3);
            assert.equal(text, track !== 'mouse');
            assert.equal(phases.size, level === 1 ? 2 : 3);
          });
test('phase gate preserves active time and rejects input until settle completes', () => {
  const g = new Game(config({ track: 'mouse', level: 9 }));
  g.transition('boss');
  const t = g.targets[0];
  while (t.phaseIndex === 0) {
    if (g.time >= t.ready) hit(g, t);
    g.step(1 / 60);
  }
  const pip = t.pip,
    remaining = t.deadline - g.time;
  hit(g, t);
  assert.equal(t.pip, pip);
  for (let i = 0; i < 30; i++) g.step(1 / 60);
  assert(Math.abs(t.deadline - g.time - remaining) < 0.02);
  while (g.time < t.ready) g.step(1 / 60);
  hit(g, t);
  assert.equal(t.pip, pip + 1);
});
test('text has exclusive ownership, NFC/case normalization, corrections and no bulk win', () => {
  const g = new Game(config({ campaign: 'return' }));
  g.transition('mini');
  const t = g.targets[0];
  t.steps = [
    { kind: 'text', text: 'yö' },
    { kind: 'text', text: 'meri' },
  ];
  t.ready = 0;
  assert.equal(g.action({ kind: 'key', key: 'y' }), false);
  assert.equal(g.action({ kind: 'text', text: 'yö' }), false);
  assert.equal(t.pip, 0);
  g.action({ kind: 'text', text: 'Y' });
  assert.equal(t.textBuffer, 'y');
  g.action({ kind: 'text', text: 'x' });
  assert.equal(g.misses, 1);
  assert.equal(g.shield, 5);
  g.action({ kind: 'backspace' });
  assert.equal(t.textBuffer, '');
  g.action({ kind: 'text', text: 'y' });
  g.action({ kind: 'text', text: 'o\u0308' });
  assert.equal(t.pip, 1);
  const before = g.score;
  g.action({ kind: 'text', text: 'm' });
  assert.equal(g.score, before);
  assert.equal(t.textBuffer, '');
});
test('hardware profiles teach only allowed buttons and phase decks are not alternating', () => {
  assert.deepEqual(buttons('mouse', 6, 'extended'), [0, 2]);
  assert.deepEqual(buttons('mixed', 7, 'extended'), [0, 2, 1]);
  assert.deepEqual(buttons('mouse', 9, 'extended'), [0, 2, 1, 3]);
  for (const profile of ['primary', 'two-buttons', 'extended'] as MouseProfile[]) {
    const g = new Game(
      config({
        track: 'mouse',
        level: 12,
        mouseProfile: profile,
        primaryOnly: profile === 'primary',
      }),
    );
    g.transition('boss');
    const ps = g.targets[0].steps;
    assert(ps.every((p) => p.kind === 'mouse' && buttons('mouse', 12, profile).includes(p.button)));
    assert(
      ps.some(
        (p, i) =>
          i > 0 &&
          p.kind === 'mouse' &&
          ps[i - 1].kind === 'mouse' &&
          p.button === (ps[i - 1] as { button: number }).button,
      ),
    );
  }
});
test('attempt context is copied/frozen; text locale and sentence variants separate boards', () => {
  const c = config({ campaign: 'return', level: 12 });
  const g = new Game(c),
    board = g.board;
  c.rules = 'pro';
  assert.equal(g.board, board);
  const boards = new Set(
    sentences.fi.map((_, seed) => new Game(config({ campaign: 'return', level: 12, seed })).board),
  );
  assert.equal(boards.size, 3);
  assert.notEqual(board, new Game(config({ campaign: 'return', level: 12, textLang: 'en' })).board);
  assert.throws(() => new Game(config({ rules: 'practice' as Rules })));
});
function legacy() {
  const d = structuredClone(fresh()) as any;
  d.schema = 1;
  delete d.earned;
  delete d.appearance;
  delete d.outroSeen;
  for (const key of ['campaign', 'mouseProfile', 'textLang', 'resolution']) delete d.settings[key];
  d.settings.intensity = 'calm';
  d.settings.rules = 'practice';
  d.progress = {
    'keyboard:fi:two-buttons': { unlocked: 12, stars: { 'standard:12': 1 }, completed: [12] },
  };
  return d;
}
test('schema migration preserves ownership and escape progress without invented victory', () => {
  const old = legacy();
  old.balance = 37;
  old.owned.color = 2;
  old.equipped.color = 1;
  const d = validate(old);
  assert.equal(d.schema, 2);
  assert.equal(d.balance, 37);
  assert.equal(d.owned.color, 2);
  assert.equal(d.settings.rules, 'relaxed');
  assert(d.settings.motion);
  assert.equal(d.progress[progressKey(d.settings)].unlocked, 12);
  assert(!campaignUnlocked({ ...d.settings, campaign: 'return' }, d));
  assert.equal(old.schema, 1);
  old.progress['keyboard:fi:two-buttons'].stars['standard:12'] = 2;
  assert(campaignUnlocked({ ...d.settings, campaign: 'return' }, validate(old)));
  old.balance = -1;
  assert.throws(() => validate(old));
});
test('final victory unlocks exact route independently of saving scores; earned looks commit once', async () => {
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => entries.get(k) ?? null,
      setItem: (k: string, v: string) => entries.set(k, v),
    },
  });
  const s = new Store();
  const g = new Game(config({ level: 12 }));
  g.finished = true;
  g.bossKilled = true;
  g.correct = 5;
  await s.begin('king');
  await s.complete('king', g);
  assert.equal(s.data.scores.length, 0);
  assert(campaignUnlocked({ ...s.data.settings, campaign: 'return' }, s.data));
  assert(!campaignUnlocked({ ...s.data.settings, campaign: 'return', track: 'mouse' }, s.data));
  const text = new Game(config({ campaign: 'return', level: 1 }));
  text.finished = true;
  text.bossKilled = true;
  text.correct = 5;
  for (const id of ['first', 'replay']) {
    await s.begin(id);
    await s.complete(id, text);
  }
  assert.deepEqual(s.data.earned, ['return-1']);
  assert(
    s.data.progress[progressKey({ ...s.data.settings, campaign: 'return' })].commanders.includes(1),
  );
});

test('v1.1 retains wave pressure while adding 50% encounter work in every preset/campaign', () => {
  const old = [
    [20, 2, 4],
    [24, 2, 5],
    [24, 2, 6],
    [28, 3, 7],
    [28, 3, 8],
    [30, 3, 10],
    [30, 4, 11],
    [32, 4, 12],
    [32, 4, 13],
    [34, 4, 15],
    [34, 5, 16],
    [36, 5, 20],
  ];
  for (const campaign of ['defense', 'return'] as const)
    for (const rules of ['standard', 'relaxed', 'pro'] as const)
      for (let level = 1; level <= 12; level++) {
        const g = new Game(config({ campaign, rules, level, track: 'mouse' }));
        g.transition('waveA');
        const expected = (old[level - 1][0] / 2) * 1.5 * (rules === 'relaxed' ? 1.5 : 1);
        g.time = expected - 0.1;
        g.step(1 / 60);
        assert.equal(g.phase, 'waveA');
        g.time = expected;
        g.step(1 / 60);
        assert.equal(g.phase, 'drainA');
        for (const kind of ['mini', 'boss'] as const) {
          const fight = new Game(config({ campaign, rules, level, track: 'mouse' }));
          fight.transition(kind);
          assert.equal(
            fight.targets[0].steps.length,
            Math.ceil(old[level - 1][kind === 'mini' ? 1 : 2] * 1.5),
          );
        }
        const text = new Game(config({ campaign: 'return', rules, level }));
        for (const kind of ['mini', 'boss'] as const) {
          text.targets = [];
          text.transition(kind);
          const oldWords =
            kind === 'mini' ? 2 + Math.floor((level - 1) / 4) : 4 + Math.floor((level - 1) / 2);
          assert.equal(
            text.targets[0].steps.length,
            Math.ceil(oldWords * 1.5) + (kind === 'boss' && level === 12 ? 1 : 0),
          );
        }
      }
});
