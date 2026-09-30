import {
  buttons,
  wordPools,
  miniWordPools,
  sentences,
  type Campaign,
  type MouseProfile,
} from './campaigns.ts';
import {
  learned,
  pacing,
  VERSION,
  type Track,
  type Rules,
  type Layout,
  type Lang,
} from './content.ts';
export interface Config {
  track: Track;
  rules: Rules;
  level: number;
  layout: Layout;
  primaryOnly: boolean;
  anyShift: boolean;
  campaign?: Campaign;
  mouseProfile?: MouseProfile;
  textLang?: Lang;
  seed: number;
}
export type Prompt =
  | { kind: 'key'; key: string }
  | { kind: 'mouse'; button: number }
  | { kind: 'pair'; key: string }
  | { kind: 'text'; text: string };
export type Phase =
  'countdown' | 'waveA' | 'drainA' | 'mini' | 'waveB' | 'drainB' | 'entrance' | 'boss' | 'done';
export interface Target {
  id: number;
  kind: 'scout' | 'drifter' | 'armor' | 'mini' | 'boss';
  x: number;
  y: number;
  originX: number;
  born: number;
  deadline: number;
  duration: number;
  steps: Prompt[];
  pip: number;
  ready: number;
  radius: number;
  phaseIndex: number;
  phaseCount: number;
  gateUntil: number;
  textBuffer: string;
  pathSeed: number;
  partial?: { member: string; time: number };
}
export type Action =
  | { kind: 'text'; text: string }
  | { kind: 'backspace' }
  | { kind: 'key'; key: string; held?: string[] }
  | { kind: 'mouse'; button: number; x: number; y: number };
export type Event = {
  kind:
    | 'hit'
    | 'kill'
    | 'impact'
    | 'phase'
    | 'miss'
    | 'pair'
    | 'milestone'
    | 'done'
    | 'bossPhase'
    | 'character';
  target?: Target;
  amount?: number;
  x?: number;
  y?: number;
  overcharge?: boolean;
};
export class Game {
  config: Readonly<Config>;
  textCorrect = 0;
  textMisses = 0;
  time = 0;
  phase: Phase = 'countdown';
  phaseStart = 0;
  nextSpawn = 0;
  targets: Target[] = [];
  events: Event[] = [];
  score = 0;
  shield: number;
  startShield: number;
  streak = 0;
  bestStreak = 0;
  correct = 0;
  misses = 0;
  impacts = 0;
  spawned = 0;
  destroyed = 0;
  salvage = 0;
  bossKilled = false;
  finished = false;
  pairHint = false;
  responses: number[] = [];
  observations: Record<string, { hits: number; misses: number }> = {};
  private id = 0;
  private randomState: number;
  private promptIndex = 0;
  private milestones = new Set<number>();
  constructor(config: Config) {
    if (
      !Number.isInteger(config.level) ||
      config.level < 1 ||
      config.level > 12 ||
      !['standard', 'relaxed', 'pro'].includes(config.rules)
    )
      throw Error('Invalid mission');
    if (
      config.campaign === 'return' &&
      config.track !== 'mouse' &&
      config.layout === 'us' &&
      config.textLang === 'fi'
    )
      throw Error('Unsupported corpus');
    this.config = Object.freeze({ ...config });
    this.startShield = config.rules === 'relaxed' ? 7 : 5;
    this.shield = this.startShield;
    this.randomState = config.seed >>> 0 || 1;
  }
  random() {
    let s = this.randomState;
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    this.randomState = s >>> 0;
    return this.randomState / 4294967296;
  }
  get campaign(): Campaign {
    return this.config.campaign ?? 'defense';
  }
  get profile(): MouseProfile {
    return this.config.primaryOnly ? 'primary' : (this.config.mouseProfile ?? 'two-buttons');
  }
  get textLang(): Lang {
    return this.config.textLang ?? (this.config.layout === 'fi' ? 'fi' : 'en');
  }
  get keys() {
    return learned(this.config.track, this.config.level, this.config.layout);
  }
  get textTarget() {
    return this.targets.find((t) => t.steps[t.pip]?.kind === 'text');
  }
  get waveProgress() {
    const p = pacing[this.config.level - 1];
    return ['drainA', 'drainB'].includes(this.phase)
      ? 1
      : Math.min(
          1,
          Math.max(
            0,
            (this.time - this.phaseStart) /
              ((p[0] / 2) * (this.config.rules === 'relaxed' ? 1.5 : 1)),
          ),
        );
  }
  get multiplier() {
    return this.config.rules === 'relaxed' ? 1.5 : this.config.rules === 'pro' ? 0.75 : 1;
  }
  get accuracy() {
    return this.correct + this.textCorrect + this.misses
      ? (this.correct + this.textCorrect) / (this.correct + this.textCorrect + this.misses)
      : null;
  }
  get stars() {
    if (!this.finished || this.shield <= 0) return 0;
    if (this.bossKilled && this.shield === this.startShield && (this.accuracy ?? 0) >= 0.95)
      return 3;
    if (this.bossKilled && this.shield / this.startShield >= 0.6 && (this.accuracy ?? 0) >= 0.8)
      return 2;
    return 1;
  }
  get board() {
    const c = this.config;
    return [
      VERSION,
      this.campaign,
      c.track,
      c.rules,
      c.level,
      c.track === 'mouse' ? 'pointer' : c.layout,
      c.track === 'keyboard' ? 'keys' : this.profile,
      c.rules === 'pro' && c.track !== 'mouse'
        ? c.anyShift
          ? 'any-shift'
          : 'left-shift'
        : 'basic',
      this.campaign === 'return' && c.track !== 'mouse' ? this.textLang : 'buttons',
      this.campaign === 'return' && c.track !== 'mouse' ? `words-${c.seed % 4}` : 'pointer',
      this.campaign === 'return' && c.track !== 'mouse' && c.level === 12
        ? `sentence-${c.seed % sentences[this.textLang].length}`
        : 'fixed',
    ].join(':');
  }
  get currentPrompt() {
    return this.targets.length ? this.targets[0].steps[this.targets[0].pip] : undefined;
  }
  reservations(p: Prompt): string[] {
    return p.kind === 'key' ? [p.key] : p.kind === 'pair' ? ['ShiftLeft', p.key] : [];
  }
  prompt(index: number): Prompt {
    const c = this.config;
    if (c.track === 'mouse' || (c.track === 'mixed' && index % 5 >= (c.level <= 2 ? 2 : 3)))
      return {
        kind: 'mouse',
        button: buttons(c.track, c.level, this.profile, this.campaign)[
          [0, 0, 1, 0, 2, 1, 3, 0, 1, 2, 0, 3][index % 12] %
            buttons(c.track, c.level, this.profile, this.campaign).length
        ],
      };
    const keys = this.keys;
    return { kind: 'key', key: keys[index % keys.length] ?? 'f' };
  }
  spawn(kind: Target['kind'], count = 1) {
    const p = pacing[this.config.level - 1];
    const encounter = kind === 'mini' || kind === 'boss';
    const startIndex = this.promptIndex;
    const patterns = [
      [0, 0, 1, 2],
      [2, 1, 2, 0, 1],
      [0, 3, 1, 2, 3, 0],
    ];
    const steps = Array.from({ length: count }, (_, i) => {
      const phase =
        kind === 'boss'
          ? Math.min(
              this.config.level === 1 ? 1 : 2,
              Math.floor((i * (this.config.level === 1 ? 2 : 3)) / count),
            )
          : 0;
      const pattern = patterns[phase];
      return this.prompt(
        encounter ? startIndex + pattern[i % pattern.length] + i * (phase + 1) : startIndex + i,
      );
    });
    this.promptIndex += count;
    if (this.campaign === 'return' && encounter && this.config.track !== 'mouse') {
      const pool = (kind === 'mini' ? miniWordPools : wordPools)[this.textLang][
        this.config.level - 1
      ];
      const wordCount =
        kind === 'mini'
          ? 2 + Math.floor((this.config.level - 1) / 4)
          : 4 + Math.floor((this.config.level - 1) / 2);
      steps.splice(
        0,
        steps.length,
        ...Array.from({ length: wordCount }, (_, i) => ({
          kind: 'text' as const,
          text: pool[(i + this.config.seed) % pool.length],
        })),
      );
      if (kind === 'boss' && this.config.level === 12)
        steps.push({
          kind: 'text',
          text: sentences[this.textLang][this.config.seed % sentences[this.textLang].length],
        });
      count = steps.length;
    }
    if (
      this.campaign === 'defense' &&
      kind === 'boss' &&
      this.config.rules === 'pro' &&
      this.config.track !== 'mouse' &&
      this.config.level >= 11
    ) {
      steps[Math.floor(count / 3)] = { kind: 'pair', key: 'w' };
      if (this.config.level === 12)
        steps[Math.floor((count * 2) / 3)] = { kind: 'pair', key: 'Space' };
    }
    // Reserve all steps in a multi-hit regular so future prompts cannot collide.
    const reserved = steps.flatMap((x) => this.reservations(x));
    if (
      !encounter &&
      this.targets.some((t) =>
        t.steps
          .slice(t.pip)
          .flatMap((x) => this.reservations(x))
          .some((k) => reserved.includes(k)),
      )
    )
      return false;
    const radius = this.config.rules === 'relaxed' ? 38 : this.config.level < 5 ? 34 : 26;
    const lanes = [130, 300, 470, 640, 810, 940];
    const used = this.targets.map((t) => t.originX);
    const available = lanes.filter((x) => !used.includes(x));
    const lane = available[Math.floor(this.random() * available.length)];
    if (lane === undefined) return false;
    const duration = encounter
      ? (steps.some((p) => p.kind === 'text')
          ? 8 +
            steps.reduce((n, p) => n + (p.kind === 'text' ? Array.from(p.text).length : 1), 0) *
              (this.config.rules === 'pro' ? 0.7 : 1.4)
          : this.config.rules === 'pro'
            ? 6 + 2.5 * count
            : 8 + 4 * count) * (this.config.rules === 'relaxed' ? 1.5 : 1)
      : p[2] * this.multiplier;
    const target: Target = {
      id: ++this.id,
      phaseIndex: 0,
      phaseCount: kind === 'boss' ? (this.config.level === 1 ? 2 : 3) : 1,
      gateUntil: 0,
      textBuffer: '',
      pathSeed: this.random(),
      kind,
      x: encounter ? 540 : lane,
      originX: encounter ? 540 : lane,
      y: 100,
      born: this.time,
      deadline: this.time + duration,
      duration,
      steps,
      pip: 0,
      ready: this.time + 0.15,
      radius,
    };
    this.targets.push(target);
    this.spawned++;
    return true;
  }
  transition(phase: Phase) {
    this.phase = phase;
    this.phaseStart = this.time;
    this.nextSpawn = this.time;
    this.events.push({ kind: 'phase' });
    if (phase === 'mini') this.spawn('mini', pacing[this.config.level - 1][4]);
    if (phase === 'boss') this.spawn('boss', pacing[this.config.level - 1][5]);
  }
  step(dt: number) {
    if (this.finished) return;
    if (dt < 0 || dt > 0.1) throw Error('Use fixed simulation steps; large gaps must pause');
    this.time += dt;
    const c = this.config,
      p = pacing[c.level - 1];
    for (const t of this.targets) {
      if (t.partial && this.time - t.partial.time > 0.8 + 1e-9) {
        delete t.partial;
        this.fail(t);
      }
      if (this.time < t.gateUntil) {
        t.deadline += dt;
        t.born += dt;
        continue;
      }
      const fraction = Math.min(1, Math.max(0, (this.time - t.born) / t.duration));
      t.y = 100 + fraction * (t.steps.some((p) => p.kind === 'text') ? 330 : 390);
      if (t.kind === 'boss') {
        const phase = t.phaseIndex;
        const amplitude = c.rules === 'relaxed' ? 35 : 65 + phase * 55 + c.level * 3;
        const destination =
          540 + Math.sin((this.time - t.born) * (0.6 + phase * 0.25) + t.pathSeed * 6) * amplitude;
        t.x += Math.max(-dt * 140, Math.min(dt * 140, destination - t.x));
      } else if (c.rules !== 'relaxed') {
        const amplitude = (c.rules === 'pro' ? 35 : 20) + c.level;
        t.x =
          t.originX +
          Math.sin((this.time - t.born) * (1 + t.pathSeed) + t.pathSeed * 6) * amplitude +
          Math.sin((this.time - t.born) * 0.43) * amplitude * 0.3;
      }
    }
    for (const t of [...this.targets])
      if (this.time >= t.deadline && this.time >= t.gateUntil) this.impact(t);
    if (this.finished) return;
    if (this.phase === 'countdown' && this.time - this.phaseStart >= 3) this.transition('waveA');
    if (this.phase === 'waveA' || this.phase === 'waveB') {
      if (this.time - this.phaseStart >= (p[0] / 2) * (c.rules === 'relaxed' ? 1.5 : 1))
        this.transition(this.phase === 'waveA' ? 'drainA' : 'drainB');
      else if (this.time >= this.nextSpawn) {
        const unfinished = this.targets.reduce((n, t) => n + t.steps.length - t.pip, 0);
        const cap = c.level < 4 ? 2 : c.level < 7 ? 5 : c.level < 10 ? 8 : 12;
        if (this.targets.length < p[3] && unfinished + (c.level >= 7 ? 2 : 1) <= cap)
          this.spawn(
            c.level >= 7 && this.id % 3 === 0 ? 'armor' : c.level >= 4 ? 'drifter' : 'scout',
            c.level >= 7 && this.id % 3 === 0 ? 2 : 1,
          );
        this.nextSpawn = this.time + p[1] * (c.rules === 'pro' ? 0.8 : this.multiplier);
      }
    }
    if (this.phase === 'drainA' && !this.targets.length) this.transition('mini');
    if (this.phase === 'mini' && !this.targets.length) this.transition('waveB');
    if (this.phase === 'drainB' && !this.targets.length) this.transition('entrance');
    if (this.phase === 'entrance' && this.time - this.phaseStart >= 2) this.transition('boss');
    if (this.phase === 'boss' && !this.targets.length) this.finish();
  }
  fail(t?: Target) {
    this.misses++;
    this.streak = 0;
    this.events.push({ kind: 'miss' });
    if (t) {
      const p = t.steps[t.pip];
      const k = p.kind === 'mouse' ? 'mouse' : p.kind === 'text' ? 'text' : p.key;
      const o = (this.observations[k] ??= { hits: 0, misses: 0 });
      o.misses++;
    }
  }
  action(a: Action) {
    if (this.finished || ['countdown', 'entrance'].includes(this.phase)) return false;
    this.pairHint = false;
    const textTarget = this.textTarget;
    if (textTarget) {
      if (this.time < textTarget.ready || this.time < textTarget.gateUntil) return false;
      if (a.kind === 'backspace') {
        textTarget.textBuffer = Array.from(textTarget.textBuffer).slice(0, -1).join('');
        return false;
      }
      if (a.kind !== 'text') return false;
      const prompt = textTarget.steps[textTarget.pip];
      if (prompt.kind !== 'text') return false;
      const input = a.text.normalize('NFC').toLocaleLowerCase(this.textLang);
      if (Array.from(input).length !== 1) return false;
      const next = textTarget.textBuffer + input;
      if (!prompt.text.startsWith(next)) {
        this.textMisses++;
        this.fail(textTarget);
        return false;
      }
      textTarget.textBuffer = next;
      if (next !== prompt.text) {
        this.textCorrect++;
        this.events.push({
          kind: 'character',
          target: { ...textTarget },
          x: textTarget.x,
          y: textTarget.y,
        });
        return true;
      }
      textTarget.textBuffer = '';
      return this.hit(textTarget);
    }
    if (a.kind === 'text' || a.kind === 'backspace') return false;
    const eligible = this.targets
      .filter((t) => this.time >= t.ready && this.time >= t.gateUntil)
      .sort((a, b) => a.deadline - b.deadline || a.id - b.id);
    const t = eligible.find((t) => {
      const p = t.steps[t.pip];
      return p.kind === 'mouse'
        ? a.kind === 'mouse' &&
            a.button === p.button &&
            Math.hypot(a.x - t.x, a.y - t.y) <= t.radius
        : a.kind === 'key' && this.reservations(p).includes(a.key);
    });
    if (!t) {
      if (this.targets.some((t) => this.time < t.ready)) return false;
      for (const t of eligible)
        if (t.partial) {
          delete t.partial;
          this.fail(t);
          return false;
        }
      if (eligible.length && (a.kind === 'mouse' || this.keys.includes(a.key)))
        this.fail(eligible[0]);
      return false;
    }
    const p = t.steps[t.pip];
    if (p.kind === 'pair' && a.kind === 'key') {
      if (a.held?.some((k) => k !== a.key && this.reservations(p).includes(k))) {
        this.pairHint = true;
        return false;
      }
      if (!t.partial) {
        t.partial = { member: a.key, time: this.time };
        this.events.push({ kind: 'pair' });
        return false;
      }
      if (t.partial.member === a.key) return false;
      delete t.partial;
    }
    return this.hit(t);
  }
  private hit(t: Target) {
    const p = t.steps[t.pip];
    const elapsed = this.time - t.ready;
    this.responses.push(Math.max(0, elapsed));
    const k = p.kind === 'mouse' ? 'mouse' : p.kind === 'text' ? 'text' : p.key;
    const o = (this.observations[k] ??= { hits: 0, misses: 0 });
    o.hits++;
    const overcharge = this.correct > 0 && this.correct % 8 === 0;
    this.score += 100 + 5 * Math.min(this.streak, 10);
    this.correct++;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.events.push({ kind: 'hit', x: t.x, y: t.y, target: { ...t }, overcharge });
    t.pip++;
    t.ready = this.time + 0.15;
    const phaseIndex = Math.min(
      t.phaseCount - 1,
      Math.floor((t.pip * t.phaseCount) / t.steps.length),
    );
    if (t.pip < t.steps.length && phaseIndex !== t.phaseIndex) {
      t.phaseIndex = phaseIndex;
      t.gateUntil = this.time + 0.65;
      t.ready = t.gateUntil + 0.15;
      this.events.push({ kind: 'bossPhase', target: { ...t } });
    }
    if ([10, 25, 50].includes(this.streak) && !this.milestones.has(this.streak)) {
      this.milestones.add(this.streak);
      this.events.push({ kind: 'milestone', amount: this.streak });
    }
    if (t.pip === t.steps.length) {
      if (this.config.rules !== 'relaxed')
        this.score += Math.max(
          0,
          Math.min(50, Math.floor((50 * (t.deadline - this.time)) / t.duration)),
        );
      this.targets = this.targets.filter((x) => x.id !== t.id);
      this.destroyed++;
      const amount =
        t.kind === 'boss'
          ? this.config.level <= 6
            ? 25
            : 50
          : t.kind === 'mini'
            ? 10
            : t.steps.length;
      this.salvage += amount;
      if (t.kind === 'boss') this.bossKilled = true;
      this.events.push({ kind: 'kill', target: { ...t }, amount, x: t.x, y: t.y });
    }
    return true;
  }
  impact(t: Target) {
    this.targets = this.targets.filter((x) => x.id !== t.id);
    this.shield--;
    this.impacts++;
    this.streak = 0;
    this.events.push({ kind: 'impact', target: { ...t } });
    if (this.shield <= 0) this.finish();
  }
  finish() {
    if (this.finished) return;
    this.finished = true;
    this.phase = 'done';
    if (this.shield > 0) this.score += 100 * this.shield;
    this.events.push({ kind: 'done' });
  }
  clearPartial() {
    for (const t of this.targets) delete t.partial;
    this.pairHint = false;
  }
  takeEvents() {
    return this.events.splice(0);
  }
}
