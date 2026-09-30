import test from 'node:test';
import assert from 'node:assert/strict';
import { Store, fresh, validate, cleanName } from '../src/storage.ts';
import { Game } from '../src/core.ts';
let entries = new Map<string, string>();
let failWrites = false;
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => entries.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (failWrites) throw Error('read only');
      entries.set(k, v);
    },
  },
  configurable: true,
});
test('atomic economy, idempotent rewards, restart, score decision independent', async () => {
  entries.clear();
  const s = new Store();
  await s.load();
  assert(await s.begin('a'));
  assert(await s.reward('a', 1, 10));
  assert(await s.reward('a', 1, 10));
  assert.equal(s.data.balance, 10);
  assert(await s.purchase('color', 1));
  assert.equal(s.data.balance, 2);
  assert.equal(s.data.owned.color, 1);
  await assert.rejects(s.purchase('color', 1));
  assert.equal(s.data.balance, 2);
  const g = new Game({
    track: 'keyboard',
    rules: 'standard',
    level: 1,
    layout: 'fi',
    primaryOnly: false,
    anyShift: false,
    seed: 1,
  });
  g.finished = true;
  g.bossKilled = true;
  g.correct = 4;
  g.score = 1000;
  await s.complete('a', g);
  assert.equal(s.data.scores.length, 0);
  assert.equal(Object.values(s.data.progress)[0].unlocked, 2);
  await s.saveScore('a', g, '  Ääni\u0000 ');
  await s.saveScore('a', g, 'other');
  assert.equal(s.data.scores.length, 1);
  assert.equal(s.data.scores[0].name, 'Ääni');
  const loaded = new Store();
  await loaded.load();
  assert.equal(loaded.data.balance, 2);
  assert.equal(loaded.data.owned.color, 1);
  assert.equal(loaded.data.scores.length, 1);
  await assert.rejects(loaded.reward('a', 2, 50));
});
test('failed purchase does not spend or grant; failed reward remains retryable once', async () => {
  entries.clear();
  const s = new Store();
  await s.begin('b');
  await s.reward('b', 1, 20);
  failWrites = true;
  assert.equal(await s.purchase('color', 1), false);
  assert.equal(s.data.balance, 20);
  assert.equal(s.data.owned.color, 0);
  assert.equal(await s.reward('b', 2, 10), false);
  failWrites = false;
  assert(await s.reward('b', 2, 10));
  assert(await s.reward('b', 2, 10));
  assert.equal(s.data.balance, 30);
});
test('corrupt primary uses backup and interrupted attempts seal without replay', async () => {
  entries.clear();
  const s = new Store();
  await s.begin('c');
  await s.reward('c', 1, 10);
  await s.change(() => {});
  entries.set('keystrike-v1', '{broken');
  const recovered = new Store();
  await recovered.load();
  assert.equal(recovered.data.balance, 10);
  assert.equal(recovered.data.active, null);
  assert.equal(recovered.data.scores.length, 0);
});
test('bounded schema rejects invalid balances, unsafe names, equipment and score duplicates', () => {
  for (const mutate of [
    (d: any) => (d.balance = -1),
    (d: any) => (d.settings.sfx = NaN),
    (d: any) => (d.equipped.skin = 2),
    (d: any) => (d.settings.nickname = '<script>\u0000'),
    (d: any) => (d.active = { id: 'a', receipts: [1, 1] }),
    (d: any) => (d.progress.x = { unlocked: 99 }),
  ]) {
    const d = fresh();
    mutate(d);
    assert.throws(() => validate(d));
  }
  assert.equal(
    [...new Intl.Segmenter('fi', { granularity: 'grapheme' }).segment(cleanName('a'.repeat(20)))]
      .length,
    16,
  );
});
test('serial transactions cannot overspend a shared balance', async () => {
  entries.clear();
  const s = new Store();
  await s.begin('d');
  await s.reward('d', 1, 10);
  const results = await Promise.allSettled([s.purchase('color', 1), s.purchase('shape', 1)]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(s.data.balance, 2);
});
