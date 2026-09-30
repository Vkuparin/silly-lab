import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, type Config, type Target } from '../src/core.ts';
import { learned, validateContent, type Track, type Rules, type Layout } from '../src/content.ts';
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
function act(g: Game, t: Target) {
  const p = t.steps[t.pip];
  if (p.kind === 'key') g.action({ kind: 'key', key: p.key });
  else if (p.kind === 'mouse') g.action({ kind: 'mouse', button: p.button, x: t.x, y: t.y });
  else {
    g.action({ kind: 'key', key: 'ShiftLeft', held: ['ShiftLeft'] });
    g.action({ kind: 'key', key: p.key, held: [p.key] });
  }
}
function play(c: Config) {
  const g = new Game(c);
  const rewards = new Set<number>();
  let mini = false,
    boss = false,
    pairs = 0;
  for (let i = 0; i < 20000 && !g.finished; i++) {
    for (const t of [...g.targets])
      if (g.time >= t.ready) {
        if (t.kind === 'mini') mini = true;
        if (t.kind === 'boss') boss = true;
        if (t.steps[t.pip].kind === 'pair') pairs++;
        act(g, t);
      }
    g.step(1 / 60);
    for (const e of g.takeEvents())
      if (e.kind === 'kill') {
        assert(!rewards.has(e.target!.id));
        rewards.add(e.target!.id);
      }
    const reserved = g.targets.flatMap((t) => [
      ...new Set(
        (t.kind === 'mini' || t.kind === 'boss'
          ? t.steps.slice(t.pip, t.pip + 1)
          : t.steps.slice(t.pip)
        ).flatMap((p) => g.reservations(p)),
      ),
    ]);
    assert.equal(
      new Set(reserved).size,
      reserved.length,
      'input ownership must be disjoint between ships',
    );
  }
  assert(g.finished, 'campaign terminates');
  assert(mini && boss, 'both encounters');
  assert.equal(g.shield, g.startShield);
  assert.equal(g.stars, 3);
  assert.equal(g.accuracy, 1);
  assert(g.salvage >= 35);
  if (c.rules === 'pro' && c.track !== 'mouse' && c.level >= 11)
    assert.equal(pairs, c.level === 11 ? 1 : 2);
  return g;
}
test('content validation and profile curricula', () => {
  validateContent();
  assert(learned('keyboard', 12, 'fi').includes('ö'));
  assert(!learned('keyboard', 12, 'us').includes('ö'));
  assert(!learned('mixed', 12, 'fi').includes('j'));
});
for (const track of ['keyboard', 'mouse', 'mixed'] as Track[])
  for (const rules of ['standard', 'relaxed', 'pro'] as Rules[])
    for (const layout of ['fi', 'us'] as Layout[])
      for (let level = 1; level <= 12; level++)
        test(`${track} ${rules} ${layout} L${level}: full campaign loop`, () => {
          play(config({ track, rules, layout, level }));
        });
test('deterministic seed gives identical full attempts', () => {
  const a = play(config({ level: 12 })),
    b = play(config({ level: 12 }));
  assert.deepEqual(
    [a.score, a.time, a.salvage, a.responses],
    [b.score, b.time, b.salvage, b.responses],
  );
});
test('neutral misses, settle input and duplicate hits', () => {
  const g = new Game(config());
  g.transition('waveA');
  g.spawn('scout');
  const t = g.targets[0];
  assert.equal(g.action({ kind: 'key', key: 'f' }), false);
  assert.equal(g.misses, 0);
  g.step(0.1);
  g.step(0.1);
  g.action({ kind: 'key', key: 'j' });
  assert.equal(g.shield, 5);
  assert.equal(g.misses, 1);
  g.action({ kind: 'key', key: 'f' });
  const score = g.score,
    salvage = g.salvage;
  g.action({ kind: 'key', key: 'f' });
  assert.equal(g.score, score);
  assert.equal(g.salvage, salvage);
  assert.equal(t.pip, 1);
});
test('hit wins before simultaneous impact; escape pays nothing and unlock outcome remains success', () => {
  const g = new Game(config());
  g.transition('boss');
  const t = g.targets[0];
  t.pip = 3;
  t.ready = 0;
  g.time = t.deadline;
  act(g, t);
  g.step(1 / 60);
  assert.equal(g.shield, 5);
  assert(g.bossKilled);
  const escape = new Game(config());
  escape.transition('boss');
  for (let i = 0; i < 1500 && !escape.finished; i++) escape.step(1 / 60);
  assert(escape.finished);
  assert.equal(escape.shield, 4);
  assert.equal(escape.salvage, 0);
  assert.equal(escape.stars, 1);
  assert.equal(escape.score, 400);
});
test('zero shield terminates immediately and awards no defense points', () => {
  const g = new Game(config());
  g.shield = 1;
  g.transition('mini');
  const t = g.targets[0];
  g.time = t.deadline;
  g.step(1 / 60);
  assert(g.finished);
  assert.equal(g.score, 0);
  assert.equal(g.stars, 0);
  assert.equal(g.phase, 'done');
});
test('release-separated Pro pair both orders, overlap hint, timeout exactly one miss', () => {
  for (const first of ['ShiftLeft', 'w']) {
    const g = new Game(config({ rules: 'pro', level: 11 }));
    g.transition('boss');
    const t = g.targets[0];
    t.pip = Math.floor(t.steps.length / 3);
    g.step(0.1);
    g.step(0.1);
    const second = first === 'w' ? 'ShiftLeft' : 'w';
    g.action({ kind: 'key', key: first, held: [first] });
    g.action({ kind: 'key', key: second, held: [first, second] });
    assert(g.pairHint);
    assert.equal(g.correct, 0);
    g.action({ kind: 'key', key: second, held: [second] });
    assert.equal(g.correct, 1);
    assert.equal(g.misses, 0);
  }
  const g = new Game(config({ rules: 'pro', level: 11 }));
  g.transition('boss');
  const t = g.targets[0];
  t.pip = Math.floor(t.steps.length / 3);
  g.step(0.1);
  g.step(0.1);
  g.action({ kind: 'key', key: 'w' });
  for (let i = 0; i < 48; i++) g.step(1 / 60);
  assert.equal(g.misses, 0, 'inclusive .8 second boundary');
  g.step(1 / 60);
  assert.equal(g.misses, 1);
  for (let i = 0; i < 120; i++) g.step(1 / 60);
  assert.equal(g.misses, 1);
});
test('pause clears partial without miss; primary-only substitutes every level', () => {
  const g = new Game(config({ rules: 'pro', level: 12 }));
  g.transition('boss');
  const t = g.targets[0];
  t.pip = 6;
  g.step(0.1);
  g.step(0.1);
  g.action({ kind: 'key', key: 'w' });
  g.clearPartial();
  assert.equal(g.misses, 0);
  assert(!t.partial);
  for (let l = 1; l <= 12; l++) {
    const mouse = new Game(config({ track: 'mouse', level: l, primaryOnly: true }));
    mouse.transition('boss');
    assert(mouse.targets[0].steps.every((p) => p.kind === 'mouse' && p.button === 0));
  }
});
test('Practice keeps targets still and never awards salvage, ranks or stars', () => {
  const g = new Game(config({ rules: 'practice', practiceKeys: ['f'] }));
  g.transition('boss');
  for (let i = 0; i < 6000; i++) g.step(1 / 60);
  assert.equal(g.shield, 5);
  assert.equal(g.targets[0].y, 140);
  for (let i = 0; i < 4; i++) {
    act(g, g.targets[0]);
    g.step(0.1);
    g.step(0.1);
  }
  assert.equal(g.salvage, 0);
  assert.equal(g.stars, 0);
});
test('large wall gaps are rejected instead of inflicting catch-up damage', () => {
  const g = new Game(config());
  assert.throws(() => g.step(10));
  assert.equal(g.time, 0);
});
test('custom Practice pairs use the selected window, remain unranked and payout-free', () => {
  const g = new Game(
    config({ rules: 'practice', practiceKeys: ['a'], practicePairs: true, practiceWindow: 1.5 }),
  );
  g.transition('mini');
  const t = g.targets[0];
  assert.deepEqual(t.steps[0], { kind: 'pair', key: 'a' });
  g.step(0.1);
  g.step(0.1);
  g.action({ kind: 'key', key: 'a', held: ['a'] });
  for (let i = 0; i < 70; i++) g.step(1 / 60);
  g.action({ kind: 'key', key: 'ShiftLeft', held: ['ShiftLeft'] });
  assert.equal(g.correct, 1);
  assert.equal(g.misses, 0);
  assert.equal(g.salvage, 0);
});
