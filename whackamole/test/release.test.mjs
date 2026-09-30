import { test } from "node:test";
import assert from "node:assert/strict";
import { makeTape, duration } from "../src/modes.ts";
import {
  newRound,
  begin,
  advance,
  capture,
  release,
  pause,
  resume,
  changeLevel,
  clickAccuracy,
} from "../src/round.ts";
import {
  fresh,
  read,
  write,
  fold,
  category,
  stickersFor,
  deleteProfile,
  KEY,
} from "../src/storage.ts";
import { createMemoryStorage, popIntervalMs } from "../src/game.ts";
import { createMatch, finishTurn, rematch, winners } from "../src/match.ts";
import { english, finnish } from "../src/ui-i18n.ts";

const round = (mode = "garden", level = 3) =>
  begin(newRound(mode, level, "mouse", 1234, "round1"));
const hit = (s) =>
  release(s, capture(s, s.targets[0].hole), s.targets[0].hole, "mouse").state;
const profile = () => ({
  id: "child",
  name: "Sunflower",
  avatar: 0,
  stickers: [],
  rounds: 0,
  hits: 0,
  modes: [],
  best: {},
});
test("all complete tapes: levels, intervals, holes, IDs, safety and reliable surprises", () => {
  for (const mode of ["garden", "harvest"])
    for (let level = 1; level <= 5; level++)
      for (let seed = 0; seed < 25; seed++) {
        const tape = makeTape(mode, level, seed),
          ids = new Set();
        assert.equal(tape[0].at, 0);
        assert.equal(tape[0].targets[0].kind, "normal");
        let previous = [],
          bomb = false;
        for (const wave of tape) {
          assert(wave.at < duration(mode));
          assert.equal(
            wave.targets.length,
            mode === "harvest" && wave.at >= 15000 ? 2 : 1,
          );
          const bombs = wave.targets.filter((t) => t.kind === "bomb");
          assert(bombs.length <= 1);
          assert(!(bomb && bombs.length));
          if (wave.at < (mode === "garden" ? 6000 : 8000))
            assert.equal(bombs.length, 0);
          for (const target of wave.targets) {
            assert(!ids.has(target.id));
            ids.add(target.id);
            assert(!previous.includes(target.hole));
            assert(target.until > wave.at);
            assert(target.until <= duration(mode));
          }
          assert.equal(
            new Set(wave.targets.map((t) => t.hole)).size,
            wave.targets.length,
          );
          previous = wave.targets.map((t) => t.hole);
          bomb = !!bombs.length;
        }
        for (const at of mode === "garden" ? [10000, 20000] : [12000, 30000]) {
          const wave = tape.find((w) => w.at >= at);
          assert.equal(
            wave.targets[0].kind,
            mode === "harvest" && at === 12000 ? "star" : "golden",
          );
        }
        assert.deepEqual(tape, makeTape(mode, level, seed));
      }
});
test("same tape independent of radically different hit histories and pauses", () => {
  let a = round("harvest"),
    b = round("harvest");
  for (const wave of a.tape) {
    a = advance(a, wave.at);
    b = advance(b, wave.at);
    assert.deepEqual(a.targets, b.targets);
    while (a.targets.length) a = hit(a);
    b = resume(pause(b));
  }
  assert.deepEqual(a.tape, b.tape);
});
test("Classic integrated pace and first target preserve five levels", () => {
  for (let level = 1; level <= 5; level++) {
    let s = round("classic", level);
    assert.equal(s.targets[0].kind, "normal");
    assert.equal(s.nextHop, popIntervalMs(0, level));
    s = hit(s);
    assert.equal(s.score, 1);
    assert.equal(s.targets.length, 0);
    s = advance(s, s.nextHop - 1);
    assert.equal(s.targets.length, 0);
    s = advance(s, s.nextHop);
    assert.equal(s.targets.length, 1);
    for (const score of [5, 12, 20]) {
      s = { ...s, score };
      const at = s.nextHop;
      s = advance(s, at);
      assert.equal(s.nextHop - at, popIntervalMs(score, level));
    }
  }
});
test("duplicates, press/release identity, grace and stale replay IDs", () => {
  const s = round(),
    hole = s.targets[0].hole,
    press = capture(s, hole);
  const once = release(s, press, hole, "mouse").state;
  assert.equal(once.score, 1);
  assert.equal(release(once, press, hole, "mouse").state.score, 1);
  assert.equal(
    release(once, capture(once, hole), hole, "mouse").state.misses,
    0,
  );
  const later = advance(once, 250);
  assert.equal(
    release(later, capture(later, hole), hole, "mouse").state.misses,
    1,
  );
  assert.deepEqual(release(s, press, (hole + 1) % 9, "mouse").state, s);
  assert.deepEqual(
    release({ ...s, id: "replay" }, press, hole, "mouse").state,
    { ...s, id: "replay" },
  );
  const expired = advance(s, s.targets[0].until);
  assert.deepEqual(release(expired, press, hole, "mouse").state, expired);
  const empty = (hole + 1) % 9,
    emptyPress = capture(s, empty);
  const replacement = {
    ...s,
    targets: [{ id: 99, hole: empty, kind: "golden", until: 9999 }],
  };
  assert.equal(release(replacement, emptyPress, empty, "mouse").state.score, 0);
});
test("two active targets each score once without a global click throttle", () => {
  let s = advance(round("harvest"), 16000);
  assert.equal(s.targets.length, 2);
  const targets = [...s.targets];
  for (const t of targets)
    s = release(s, capture(s, t.hole), t.hole, "mouse").state;
  assert.equal(s.hits + s.bombs, 2);
});
test("combo reward boundaries and harmless bomb escape", () => {
  let s = { ...round("harvest"), streak: 4, score: 7 };
  const hole = s.targets[0].hole;
  s = release(s, capture(s, hole), hole, "mouse").state;
  assert.equal(s.score, 10);
  assert.equal(s.streak, 5);
  const nextAt = s.tape[s.index].at;
  s = { ...s, targets: [{ id: 999, hole: 8, kind: "bomb", until: nextAt }] };
  assert.equal(advance(s, nextAt).streak, 5);
  s = { ...s, targets: [{ id: 999, hole: 8, kind: "normal", until: nextAt }] };
  assert.equal(advance(s, nextAt).streak, 0);
});
test("pause cannot advance or resolve; end boundary wins; accuracy definitions", () => {
  const s = round(),
    paused = pause(s);
  assert.deepEqual(advance(paused, 30000), paused);
  assert.equal(release(paused, capture(paused, 0), 0, "mouse").delta, 0);
  assert.deepEqual(resume(paused), s);
  const ended = advance(s, 30000);
  assert.equal(ended.phase, "over");
  assert.equal(ended.targets.length, 0);
  assert.equal(
    release(ended, capture(s, s.targets[0].hole), s.targets[0].hole, "mouse")
      .delta,
    0,
  );
  assert.equal(clickAccuracy({ ...s, hits: 8, misses: 1, bombs: 1 }), 80);
  assert.equal(
    clickAccuracy({ ...s, mode: "classic", hits: 8, misses: 1, bombs: 1 }),
    89,
  );
  assert.equal(clickAccuracy(s), null);
});
test("Practice remains untimed, stays until hit, alternates holes and fifth is gold", () => {
  let s = round("practice");
  assert.deepEqual(advance(s, 999000).targets, s.targets);
  for (let i = 0; i < 5; i++) {
    assert.equal(s.targets[0].kind, i === 4 ? "golden" : "normal");
    const hole = s.targets[0].hole;
    s = hit(s);
    assert.equal(s.score, i + 1);
    assert.equal(s.targets.length, 0);
    s = advance(s, s.nextHop);
    assert.notEqual(s.targets[0].hole, hole);
  }
  assert.deepEqual(stickersFor(s, profile()), ["first"]);
});
test("changed pace remains ineligible and never reuses consumed appearance IDs", () => {
  let s = hit(round());
  s = changeLevel(s, 5);
  s = changeLevel(s, 3);
  assert(s.reasons.includes("level"));
  const next = advance(s, s.tape[s.index].at);
  assert(!s.consumed.includes(next.targets[0].id));
});
test("boards, personal bests, stickers and completion fold exactly once", () => {
  const data = fresh();
  data.profiles.push(profile());
  const s = { ...round(), phase: "over", score: 22, hits: 12, goldens: 3 };
  const result = fold(data, s, "child", "Sunflower");
  assert.equal(result.data.profiles[0].rounds, 1);
  assert.equal(result.data.boards[category(s)][0].score, 22);
  assert.equal(result.data.profiles[0].best[category(s)], 22);
  assert.deepEqual(
    new Set(result.unlocked),
    new Set(["first", "garden", "golden", "careful"]),
  );
  assert.deepEqual(
    fold(result.data, s, "child", "Sunflower").data,
    result.data,
  );
  assert.equal(
    Object.keys(
      fold(data, { ...s, reasons: ["level"] }, "child", "Sunflower").data
        .boards,
    ).length,
    0,
  );
  assert.equal(
    Object.keys(fold(data, s, "child", "Sunflower", true).data.boards).length,
    0,
  );
  assert.deepEqual(
    fold(data, { ...s, reasons: ["debug"] }, "child", "Sunflower").data,
    data,
  );
  assert.equal(deleteProfile(result.data, "child").profiles.length, 0);
  assert.equal(
    deleteProfile(result.data, "child").boards[category(s)].length,
    0,
  );
});
test("stickers: Harvest and Explorer boundary and aborted rounds", () => {
  const s = {
    ...round("harvest"),
    phase: "over",
    hits: 15,
    stars: 1,
    bestStreak: 5,
  };
  assert(stickersFor(s, profile()).includes("star"));
  assert(stickersFor(s, profile()).includes("combo"));
  assert(stickersFor(s, profile()).includes("harvest"));
  assert(!stickersFor({ ...s, phase: "paused" }, profile()).length);
  assert(
    stickersFor(
      { ...s, mode: "classic" },
      { ...profile(), modes: ["garden", "harvest"] },
    ).includes("explorer"),
  );
});
test("schema rejects corrupt/future/malformed data without overwriting; write failure is honest", () => {
  const memory = createMemoryStorage();
  const d = fresh();
  d.profiles.push(profile());
  assert(write(d, memory));
  assert.deepEqual(read(memory).data, d);
  for (const raw of [
    "{",
    JSON.stringify({ ...d, schema: 2 }),
    JSON.stringify({ ...d, settings: { ...d.settings, sfxVolume: -2 } }),
    JSON.stringify({ ...d, profiles: [{ ...profile(), rounds: -1 }] }),
  ]) {
    memory.setItem(KEY, raw);
    assert.equal(read(memory).writable, false);
    assert.equal(memory.getItem(KEY), raw);
  }
  const throwing = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("quota");
    },
  };
  assert.equal(read(throwing).warning, true);
  assert.equal(write(d, throwing), false);
  memory.setItem("whackamole.scores.v1", "legacy");
  write(d, memory);
  assert.equal(memory.getItem("whackamole.scores.v1"), "legacy");
});
test("bounded records, category isolation and personal best outside top ten", () => {
  let d = fresh();
  d.profiles.push(profile());
  for (let i = 0; i < 120; i++)
    d = fold(
      d,
      { ...round(), id: `r${i}`, phase: "over", score: 200 - i },
      null,
      "Guest",
    ).data;
  assert.equal(d.recent.length, 100);
  assert.equal(d.boards[category(round())].length, 10);
  d = fold(
    d,
    { ...round(), id: "personal", phase: "over", score: 5 },
    "child",
    "Sunflower",
  ).data;
  assert.equal(d.profiles[0].best[category(round())], 5);
  d = fold(
    d,
    { ...round("garden", 5), id: "other", phase: "over", score: 1 },
    null,
    "Guest",
  ).data;
  assert.equal(Object.keys(d.boards).length, 2);
});
test("Family tape, duplicate turn completion, handicap, ties and rotating rematch", () => {
  for (let n = 2; n <= 4; n++) {
    const players = Array.from({ length: n }, (_, i) => ({
      name: `P${i}`,
      avatar: i,
      profile: null,
      level: i + 1,
    }));
    let m = createMatch(players, false, 123);
    assert(m.players.every((p) => p.level === 1));
    for (let i = 0; i < n; i++) m = finishTurn(m, 10);
    assert.equal(m.turn, n);
    assert.equal(winners(m).length, n);
    const again = rematch(m, 456);
    assert.equal(again.players[0].name, "P1");
    assert.equal(again.scores.length, 0);
    assert.notDeepEqual(again.tape, m.tape);
    assert.equal(createMatch(players, true, 123).players[n - 1].level, n);
  }
});
test("all new English and Finnish keys have nonempty parity", () => {
  assert.deepEqual(Object.keys(english).sort(), Object.keys(finnish).sort());
  assert(
    Object.values(english).every((s) => typeof s === "string" && s.length),
  );
  assert(
    Object.values(finnish).every((s) => typeof s === "string" && s.length),
  );
});
test("new reward and bomb scoring, mixed-input eligibility and turn deduplication", () => {
  for (const mode of ["garden", "harvest", "classic"])
    for (const kind of ["normal", "golden", "star", "bomb"]) {
      let s = {
        ...round(mode),
        score: 10,
        targets: [{ id: 99, hole: 4, kind, until: 1000 }],
      };
      s = release(s, capture(s, 4), 4, "mouse").state;
      assert.equal(
        s.score,
        10 +
          { normal: 1, golden: 3, star: 2, bomb: mode === "garden" ? -1 : -2 }[
            kind
          ],
      );
    }
  const s = round();
  const hole = s.targets[0].hole;
  const mixed = release(s, capture(s, hole), hole, "keyboard").state;
  assert.equal(mixed.input, "mixed");
  assert(mixed.reasons.includes("mixed"));
  let m = createMatch(
    [
      { name: "A", avatar: 0, profile: null, level: 1 },
      { name: "B", avatar: 1, profile: null, level: 1 },
    ],
    false,
    42,
  );
  m = finishTurn(m, 12, 0);
  assert.deepEqual(finishTurn(m, 12, 0), m);
});
