import { invoke, isTauri } from '@tauri-apps/api/core';
import { screenHtml } from './screens.ts';
import { bindTextInput } from './text-input.ts';
import { buttons, validateCampaigns, returnRoster, type MouseProfile } from './campaigns.ts';
import { campaignUnlocked } from './storage.ts';
import './style.css';
import { learned, roster, validateContent, type Rules, type Category } from './content.ts';
import { Game, type Config, type Action } from './core.ts';
import { Store, fresh, cleanName, validate, progressKey, type Settings } from './storage.ts';
import { translate, keyLabel, finger, type Word } from './i18n.ts';
import { Renderer, W, H } from './render.ts';
import { Audio } from './audio.ts';

validateContent();
validateCampaigns();
const app = document.querySelector<HTMLDivElement>('#app')!;
const store = new Store();
await store.load();
const audio = new Audio();
let screen = 'home',
  level = 1,
  game: Game | null = null,
  renderer: Renderer | null = null,
  paused = false,
  resuming = 0,
  attempt = '',
  decision = '',
  scoreBusy = false,
  completed = false;
let pending: { ship: number; amount: number }[] = [],
  rewardQueue = Promise.resolve(),
  sessionUnlock = 1;
let rehearsalPage = 0,
  rehearsed = new Set<string>();
let replayRules: Rules = 'standard',
  selectedBoard = '',
  lastTextTarget = 0;
let celebration = 0,
  resultReady = false;
let previewTier: Partial<Record<Category, number>> = {};
let waiting: 'launch' | 'resume' | null = null;
const held = new Set<string>();
let lastTime = performance.now(),
  accumulator = 0;
const t = (key: Word) => translate(store.data.settings.lang, key);
const esc = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const title = (i: number) =>
  (game?.campaign === 'return' || (!game && store.data.settings.campaign === 'return')
    ? returnRoster
    : roster)[i - 1][store.data.settings.lang === 'en' ? 0 : 1];
const btn = (key: Word, action: string, primary = false, disabled = false) =>
  `<button data-action="${action}" class="${primary ? 'primary' : ''}" ${disabled ? 'disabled' : ''}>${t(key)}</button>`;
function notice() {
  return store.notice ? `<div class="notice" role="status">${t(store.notice as Word)}</div>` : '';
}
function language() {
  return `<div class="top-right"><button class="small ghost" data-action="language" aria-label="${t('language')}">${store.data.settings.lang === 'fi' ? 'ENGLISH' : 'SUOMI'}</button></div>`;
}
function layout(body: string) {
  app.innerHTML = `<main class="shell" data-rules="${screen === 'playing' || screen === 'results' ? (game?.config.rules ?? store.data.settings.rules) : store.data.settings.rules}"><header class="topbar"><div class="brand"><span class="mark">⌁</span>KEYSTRIKE</div>${screen === 'home' ? '' : `<span class="preset-badge">${{ standard: '◆', relaxed: '◉', pro: '▲' }[screen === 'playing' || screen === 'results' ? (game?.config.rules ?? store.data.settings.rules) : store.data.settings.rules]} ${t(screen === 'playing' || screen === 'results' ? (game?.config.rules ?? store.data.settings.rules) : store.data.settings.rules)}</span>`}${language()}</header>${notice()}${body}<footer class="footer"><span>${t('version')}</span><span>HELSINKI / 60°10′ N &nbsp; · &nbsp; ${t('quiet')}</span></footer></main>`;
  document.documentElement.lang = store.data.settings.lang;
  renderer = null;
  bind();
}
function mountCanvas() {
  const c = document.querySelector<HTMLCanvasElement>('canvas');
  if (c) renderer = new Renderer(c);
}
function unlocked() {
  return Math.max(
    campaignUnlocked(store.data.settings, store.data) ? sessionUnlock : 0,
    store.data.progress[progressKey(store.data.settings)]?.unlocked ?? 1,
  );
}
function proEligible(targetLevel = level, settings = store.data.settings) {
  return !!store.data.progress[progressKey(settings)]?.completed.includes(targetLevel);
}
function render() {
  if (screen === 'results' && replayRules === 'pro' && !proEligible()) replayRules = 'standard';
  const body = screenHtml({
    store,
    screen,
    level,
    game,
    decision,
    scoreBusy,
    completed,
    pending: pending.reduce((n, p) => n + p.amount, 0),
    unlocked: unlocked(),
    proEligible: proEligible(),
    rehearsalPage,
    rehearsed,
    replayRules,
    board: new Game(makeConfig()).board,
    selectedBoard,
  });
  layout(body);
  mountCanvas();
  if (screen === 'playing') {
    const input = app.querySelector<HTMLInputElement>('#typing');
    if (input)
      bindTextInput(input, (a) => {
        if (!paused && !resuming && game?.textTarget) combat(a);
      });
    lastTextTarget = 0;
    document.querySelector<HTMLCanvasElement>('#playfield')?.focus();
    updateHud();
  }
}
function makeConfig(): Config {
  const s = store.data.settings;
  return {
    track: s.track,
    rules: s.rules,
    level,
    layout: s.layout,
    primaryOnly: s.primaryOnly,
    anyShift: s.anyShift,
    campaign: s.campaign,
    mouseProfile: s.mouseProfile,
    textLang: s.layout === 'us' ? 'en' : s.textLang,
    seed: level * 7919 + (s.track === 'keyboard' ? 0 : s.track === 'mouse' ? 13 : 29),
  };
}
async function display(preset: string) {
  try {
    if (isTauri()) await invoke('set_display', { preset });
    else if (preset === 'fullscreen') await document.documentElement.requestFullscreen();
    else if (document.fullscreenElement) await document.exitFullscreen();
    await changeSettings({ resolution: preset });
  } catch {
    alert(t('displayFailed'));
  }
}
function normalize(e: KeyboardEvent) {
  if (e.key === 'Shift')
    return store.data.settings.anyShift || e.code === 'ShiftLeft' ? 'ShiftLeft' : 'ShiftRight';
  if (e.key === ' ') return 'Space';
  return e.key.length === 1 ? e.key.toLocaleLowerCase('fi') : e.key;
}
async function changeSettings(patch: Partial<Settings>) {
  const ok = await store.change((d) => {
    Object.assign(d.settings, patch);
  });
  if (!ok) Object.assign(store.data.settings, patch); // explicit temporary settings, visible notice
}
async function retryRewards() {
  await rewardQueue;
  if (store.data.active?.id !== attempt) {
    if (!(await store.begin(attempt))) return false;
  }
  const remaining = [];
  for (const p of pending) {
    try {
      if (!(await store.reward(attempt, p.ship, p.amount))) remaining.push(p);
    } catch {
      remaining.push(p);
    }
  }
  pending = remaining;
  if (game?.finished && pending.length === 0) {
    completed = await store.complete(attempt, game);
  }
  return pending.length === 0 && (!game?.finished || completed);
}
async function leavePending() {
  if (pending.length || (!completed && game?.finished)) {
    if (!(await retryRewards()) && !confirm(t('discard'))) return false;
    pending = [];
  }
  return true;
}
async function navigate(destination: string) {
  if (screen === 'results') {
    if (!(await leavePending())) return;
    if (!decision) decision = 'skipped';
  }
  held.clear();
  paused = false;
  audio.suspend();
  screen = destination;
  previewTier = {};
  if (destination === 'setup') {
    level = Math.min(level, unlocked());
  }

  render();
}
async function launch() {
  if (held.size) {
    waiting = 'launch';
    return;
  }
  const settings = store.data.settings;
  if (
    !campaignUnlocked(settings, store.data) ||
    level > unlocked() ||
    (settings.rules === 'pro' && !proEligible())
  )
    return;
  if (
    settings.mouseProfile === 'extended' &&
    settings.track !== 'keyboard' &&
    !buttons(settings.track, level, settings.mouseProfile, settings.campaign).every((b) =>
      rehearsed.has(`Mouse${b}`),
    )
  )
    return;
  waiting = null;
  audio.unlock();
  pending = [];
  decision = '';
  completed = false;
  scoreBusy = false;
  celebration = 0;
  resultReady = false;
  attempt = crypto.randomUUID();
  await store.begin(attempt);
  game = new Game({ ...makeConfig(), seed: crypto.getRandomValues(new Uint32Array(1))[0] });
  paused = false;
  resuming = 0;
  accumulator = 0;
  lastTime = performance.now();
  screen = 'playing';
  render();
}
function pause() {
  if (screen !== 'playing' || !game || game.finished || paused) return;
  paused = true;
  held.clear();
  game.clearPartial();
  audio.suspend();
  showPause();
}
function showPause() {
  const box = document.querySelector('#game-overlay');
  if (box)
    box.innerHTML = `<div class="overlay"><section class="panel"><div class="eyebrow">HELSINKI / HOLD POSITION</div><h2>${t('paused')}</h2><p>${t('releaseStart')}</p><div class="actions" style="justify-content:center">${btn('resume', 'resume', true)}${btn('leave', 'leave')}</div>${store.notice ? `<p class="alert" style="margin-top:15px">${t('writeFailed')}</p>` : ''}</section></div>`;
  bindActions(box!);
  (box?.querySelector('button') as HTMLButtonElement)?.focus();
}
function resume() {
  if (held.size) {
    waiting = 'resume';
    return;
  }
  waiting = null;
  game?.clearPartial();
  paused = false;
  resuming = 3;
  accumulator = 0;
  audio.unlock();
  document.querySelector<HTMLCanvasElement>('canvas')?.focus();
}
function bindActions(root: ParentNode) {
  root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(
    (b) =>
      (b.onclick = () => {
        void action(b.dataset.action!);
      }),
  );
}
function bind() {
  bindActions(app);
  app.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(
    (b) =>
      (b.onclick = () => {
        level = Number(b.dataset.level);
        render();
      }),
  );
  for (const id of [
    'track',
    'rules',
    'layout',
    'campaign',
    'mouseProfile',
    'textLang',
    'resolution',
    'primaryOnly',
    'anyShift',
    'motion',
    'guide',
    'mute',
    'sfx',
    'music',
  ]) {
    const el = app.querySelector<HTMLInputElement | HTMLSelectElement>('#' + id);
    if (el)
      el.onchange = async () => {
        const value =
          el instanceof HTMLInputElement && el.type === 'checkbox'
            ? el.checked
            : ['sfx', 'music'].includes(id)
              ? Number(el.value)
              : el.value;
        if (id === 'resolution') {
          await display(String(value));
          render();
          return;
        }
        await changeSettings({
          [id]: value,
          ...(id === 'mouseProfile' ? { primaryOnly: value === 'primary' } : {}),
          ...(id === 'layout' && value === 'us' ? { textLang: 'en' } : {}),
        });
        selectedBoard = '';
        if (
          id === 'track' ||
          id === 'layout' ||
          id === 'primaryOnly' ||
          id === 'mouseProfile' ||
          id === 'campaign'
        ) {
          sessionUnlock = 1;
          level = Math.max(1, Math.min(level, unlocked()));
        }
        render();
      };
  }
  app.querySelectorAll<HTMLButtonElement>('[data-shop]').forEach((b) => {
    b.onpointerenter = () => {
      const [cat, tier] = b.dataset.shop!.split(':');
      previewTier = { [cat]: Number(tier) };
    };
    b.onpointerleave = () => {
      previewTier = {};
    };
    b.onclick = async () => {
      const [cat, n] = b.dataset.shop!.split(':');
      const category = cat as Category,
        tier = Number(n);
      b.disabled = true;
      try {
        if (tier > store.data.owned[category]) await store.purchase(category, tier);
        else
          await store.change((d) => {
            d.equipped[category] = tier;
          });
      } catch {}
      previewTier = {};
      render();
    };
  });
  app.querySelectorAll<HTMLButtonElement>('[data-letter]').forEach(
    (b) =>
      (b.onclick = () => {
        const el = app.querySelector<HTMLInputElement>('#nickname')!;
        el.value =
          b.dataset.letter === 'backspace'
            ? Array.from(el.value).slice(0, -1).join('')
            : cleanName(el.value + (b.dataset.letter === ' ' ? ' ' : b.dataset.letter!));
      }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-reset]').forEach(
    (b) =>
      (b.onclick = async () => {
        if (!confirm(t('resetConfirm'))) return;
        await store.change((d) => {
          const f = fresh();
          if (b.dataset.reset === 'scores') d.scores = [];
          if (b.dataset.reset === 'lessons') {
            d.progress = {};
            d.outroSeen = [];
            d.settings.campaign = 'defense';
            sessionUnlock = 1;
          }
          if (b.dataset.reset === 'cosmetics') {
            d.balance = 0;
            d.owned = f.owned;
            d.equipped = f.equipped;
            d.cannonName = '';
            d.earned = [];
            d.appearance = '';
          }
          if (b.dataset.reset === 'settings') d.settings = f.settings;
          d.active = null;
        });
        render();
      }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-appearance]').forEach(
    (b) =>
      (b.onclick = async () => {
        await store.change((d) => {
          if (b.dataset.appearance && !d.earned.includes(b.dataset.appearance))
            throw Error('Unowned');
          d.appearance = b.dataset.appearance!;
        });
        render();
      }),
  );
  const replay = app.querySelector<HTMLSelectElement>('#replayRules');
  if (replay)
    replay.onchange = () => {
      replayRules = replay.value as Rules;
    };
  const boards = app.querySelector<HTMLSelectElement>('#savedBoard');
  if (boards)
    boards.onchange = () => {
      selectedBoard = boards.value;
      render();
    };
  const boardLevel = app.querySelector<HTMLSelectElement>('#boardLevel');
  if (boardLevel)
    boardLevel.onchange = () => {
      level = Number(boardLevel.value);
      selectedBoard = '';
      render();
    };
  const input = app.querySelector<HTMLInputElement>('#importFile');
  if (input)
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        if (file.size > 2e6) throw Error('Too big');
        const data = validate(JSON.parse(await file.text()));
        if (
          !confirm(
            `${t('importConfirm')}\n◆ ${data.balance} · ${data.scores.length} ${t('scores')}`,
          )
        )
          return;
        await store.change((d) => {
          const revision = d.revision;
          Object.assign(d, data);
          d.revision = revision;
          d.active = null;
        });
        sessionUnlock = 1;
        render();
      } catch {
        alert(t('invalidImport'));
      }
    };
  app.querySelectorAll<HTMLElement>('[data-button]').forEach((zone) => {
    zone.oncontextmenu = (e) => e.preventDefault();
    zone.onpointerdown = (e) => {
      e.preventDefault();
      audio.unlock();
      const seen = document.querySelector('#input-seen')!;
      seen.textContent = `${t('inputSeen')}: ${e.button === 0 ? t('primary') : e.button === 2 ? t('secondary') : e.button}`;
      if (e.button === Number(zone.dataset.button)) {
        rehearsed.add(`Mouse${e.button}`);
        zone.classList.add('checked');
        if (
          buttons(
            store.data.settings.track,
            level,
            store.data.settings.mouseProfile,
            store.data.settings.campaign,
          ).every((b) => rehearsed.has(`Mouse${b}`))
        ) {
          const launchButton = app.querySelector<HTMLButtonElement>('[data-action=launch]');
          if (launchButton) launchButton.disabled = false;
        }
      }
    };
  });
  const canvas = app.querySelector<HTMLCanvasElement>('#playfield');
  if (canvas) {
    canvas.onauxclick = (e) => e.preventDefault();
    canvas.onpointermove = (e) => {
      const r = canvas.getBoundingClientRect();
      renderer?.aim(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
    };
    canvas.onpointerdown = (e) => {
      if (paused || resuming > 0 || !game) return;
      if (game.finished && celebration < 0.5) {
        celebration = 0;
        return;
      }
      if (!game.textTarget) canvas.focus();
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W,
        y = ((e.clientY - rect.top) / rect.height) * H;
      if (![0, 1, 2, 3].includes(e.button)) return;
      e.preventDefault();
      combat({ kind: 'mouse', button: e.button, x, y });
    };
    canvas.oncontextmenu = (e) => {
      if (!paused) e.preventDefault();
    };
  }
}
async function action(name: string) {
  if (name === 'exit') {
    audio.suspend();
    if (isTauri()) await invoke('exit_game');
    else {
      if (document.fullscreenElement) await document.exitFullscreen();
      window.close();
    }
    return;
  }
  if (['home', 'setup', 'hangar', 'scores', 'settings'].includes(name)) {
    await navigate(name);
    return;
  }
  if (name === 'language') {
    await changeSettings({ lang: store.data.settings.lang === 'fi' ? 'en' : 'fi' });
    render();
    if (paused) showPause();
    return;
  }
  if (name === 'briefing') {
    rehearsalPage = 0;
    rehearsed.clear();
    screen = 'briefing';
    render();
    return;
  }
  if (name === 'rehearsalNext') {
    rehearsalPage++;
    render();
    return;
  }
  if (name === 'launch') {
    await launch();
    return;
  }
  if (name === 'pause') {
    pause();
    return;
  }
  if (name === 'resume') {
    resume();
    return;
  }
  if (name === 'leave') {
    if (!confirm(t('leaveConfirm'))) return;
    if (!(await leavePending())) return;
    await store.change((d) => {
      d.active = null;
    });
    game = null;
    await navigate('home');
    return;
  }
  if (name === 'save' && game && !decision && !scoreBusy) {
    scoreBusy = true;
    const el = app.querySelector<HTMLInputElement>('#nickname')!;
    const remember = app.querySelector<HTMLInputElement>('#remember')!.checked;
    const nickname = cleanName(el.value);
    await changeSettings({ remember, nickname: remember ? nickname : '' });
    const ok = await store.saveScore(attempt, game, nickname);
    scoreBusy = false;
    if (ok) decision = store.data.scores.some((s) => s.id === attempt) ? 'saved' : 'notRetained';
    render();
    return;
  }
  if (name === 'skip') {
    decision = 'skipped';
    render();
    return;
  }
  if (name === 'exitFullscreen') {
    await display('1200x860');
    render();
    return;
  }
  if (name === 'outroContinue') {
    if (game && completed)
      await store.change((d) => {
        const key = progressKey({
          ...d.settings,
          ...game!.config,
          campaign: game!.campaign,
          mouseProfile: game!.profile,
        });
        if (!d.outroSeen.includes(key)) d.outroSeen.push(key);
      });
    screen = 'results';
    render();
    return;
  }
  if (name === 'retry' || name === 'next') {
    if (!(await leavePending())) return;
    if (!decision) decision = 'skipped';
    if (game) {
      const nextLevel = name === 'next' ? game.config.level + 1 : game.config.level;
      const route = {
        ...store.data.settings,
        ...game.config,
        campaign: game.campaign,
        mouseProfile: game.profile,
      };
      const rules =
        name === 'retry'
          ? replayRules
          : game.config.rules === 'pro' && !proEligible(nextLevel, route)
            ? 'standard'
            : game.config.rules;
      await changeSettings({
        track: game.config.track,
        layout: game.config.layout,
        campaign: game.campaign,
        mouseProfile: game.profile,
        primaryOnly: game.config.primaryOnly,
        textLang: game.textLang,
        rules,
      });
      level = nextLevel;
    }
    rehearsalPage = 0;
    rehearsed.clear();
    screen = 'briefing';
    render();
    return;
  }
  if (name === 'retryRewards') {
    await retryRewards();
    render();
    return;
  }
  if (name === 'retrySettings') {
    await store.change(() => {});
    render();
    return;
  }
  if (name === 'saveName') {
    await store.change((d) => {
      d.cannonName = cleanName(app.querySelector<HTMLInputElement>('#cannonName')!.value);
    });
    render();
    return;
  }
  if (name === 'export') {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Keystrike-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }
  if (name === 'import') {
    app.querySelector<HTMLInputElement>('#importFile')!.click();
    return;
  }
}
function combat(a: Action) {
  game?.action(a);
  consumeEvents();
  updateHud();
}
function consumeEvents() {
  if (!game) return;
  const events = game.takeEvents();
  renderer?.events(events);
  for (const e of events) {
    audio.effect(
      e.kind,
      store.data.settings,
      store.data.equipped.sound,
      e.target?.kind === 'boss'
        ? (game.campaign === 'return' ? 12 : 0) + game.config.level
        : undefined,
    );
    if (e.kind === 'kill' && e.amount) {
      const ship = e.target!.id,
        amount = e.amount;
      rewardQueue = rewardQueue.then(async () => {
        try {
          if (!(await store.reward(attempt, ship, amount))) pending.push({ ship, amount });
        } catch {
          pending.push({ ship, amount });
        }
        if (pending.length >= 500) pause();
      });
    }
    if (e.kind === 'done') {
      celebration = game.bossKilled ? 2.5 : 1.5;
      replayRules = game.config.rules === 'standard' && game.shield > 0 ? 'pro' : game.config.rules;
      if (game.shield > 0) sessionUnlock = Math.min(12, Math.max(sessionUnlock, level + 1));
      void (async () => {
        await rewardQueue;
        if (!pending.length) {
          try {
            completed = await store.complete(attempt, game!);
          } catch {
            completed = false;
          }
        }
        resultReady = true;
      })();
    }
  }
}
function updateHud() {
  if (!game || screen !== 'playing') return;
  const g = game;
  for (const [id, v] of [
    ['score', g.score],
    ['shield', `${'◆'.repeat(g.shield)}${'◇'.repeat(g.startShield - g.shield)}`],
    ['balance', store.data.balance],
    ['streak', g.streak],
  ] as [string, string | number][]) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(v);
  }
  const encounter = document.querySelector('#encounter');
  if (encounter) {
    const ship = g.targets.find((t) => t.kind === 'mini' || t.kind === 'boss');
    encounter.innerHTML = ship
      ? `${ship.kind === 'boss' ? esc(title(level)) : t('mini')} <span style="opacity:.7">/ ${t('phase')} ${ship.phaseIndex + 1}</span><div class="pips">${ship.steps.map((_, i) => `<span class="pip ${i < ship.pip ? 'filled' : ''}"></span>`).join('')}</div><div class="deadline"><i style="width:${Math.max(0, (100 * (ship.deadline - g.time)) / ship.duration)}%"></i></div>`
      : `${t(g.phase === 'mini' ? 'mini' : g.phase === 'boss' ? 'boss' : (g.phase as Word))}`;
  }
  const guide = document.querySelector('#guide');
  if (guide) {
    const p = g.currentPrompt;
    const relevant = g.targets.flatMap((t) => g.reservations(t.steps[t.pip]));
    guide.innerHTML = store.data.settings.guide
      ? g.pairHint
        ? t('releaseHint')
        : p?.kind === 'pair'
          ? `${t('pairHelp')}  ${g.targets[0]?.partial ? '◐' : ''}`
          : p?.kind === 'text'
            ? t('wordHelp')
            : g.config.track === 'mouse'
              ? `${t('mouseGuide')}`
              : `${t(g.config.track === 'mixed' ? 'mixedGuide' : 'finger')} &nbsp; ${g.keys.map((k) => `<kbd class="${relevant.includes(k) ? 'active' : ''}" title="${t(finger(k))}">${esc(keyLabel(k))}</kbd>`).join('')}${p?.kind === 'key' ? ` &nbsp; ${t(finger(p.key))}` : ''}`
      : '';
  }
  const p = document.querySelector('#pending');
  if (p)
    p.textContent = pending.length
      ? `${t('pending')}: ${pending.reduce((n, r) => n + r.amount, 0)} · ${t('writeFailed')}`
      : store.data.cannonName;
  if (!paused) {
    const overlay = document.querySelector('#game-overlay');
    if (overlay) {
      const count =
        resuming > 0
          ? Math.ceil(resuming)
          : g.phase === 'countdown'
            ? Math.max(1, 3 - Math.floor(g.time))
            : 0;
      overlay.innerHTML = g.finished
        ? `<div class="celebration"><h2>${t(g.shield <= 0 ? 'depleted' : g.bossKilled ? 'defeated' : 'done')}</h2>${celebration < 0.5 ? `<span>${t('celebrationHint')}</span>` : ''}</div>`
        : count
          ? `<div class="overlay"><div class="big-count">${count}</div></div>`
          : g.phase === 'entrance'
            ? `<div class="boss-intro"><span>${t('entrance')}</span><h2>${esc(title(level))}</h2></div>`
            : g.targets.some((t) => g.time < t.gateUntil)
              ? `<div class="phase-banner">${t('phaseChange')}</div>`
              : '';
    }
  }
}
function updateTextHud() {
  if (!game || screen !== 'playing') return;
  const target = game.textTarget,
    panel = document.querySelector<HTMLElement>('#text-encounter'),
    input = document.querySelector<HTMLInputElement>('#typing');
  if (panel) panel.hidden = !target;
  if (target && input) {
    const prompt = target.steps[target.pip];
    if (prompt.kind === 'text') {
      document.querySelector('#word-prompt')!.textContent = prompt.text;
      document.querySelector('#word-buffer')!.textContent = target.textBuffer || '…';
      input.disabled = paused || resuming > 0 || game.time < target.ready;
      if (!input.disabled && document.activeElement?.id !== 'typing') input.focus();
      lastTextTarget = target.id;
    }
  } else if (lastTextTarget && !paused) {
    lastTextTarget = 0;
    document.querySelector<HTMLCanvasElement>('#playfield')?.focus();
  }
  const progress = document.querySelector<HTMLProgressElement>('#wave-progress');
  if (progress) {
    progress.value = game.waveProgress;
    progress.hidden = !['waveA', 'waveB', 'drainA', 'drainB'].includes(game.phase);
  }
  const label = document.querySelector('#wave-label');
  if (label)
    label.textContent = ['drainA', 'drainB'].includes(game.phase)
      ? `${t('clearing')}: ${game.targets.length}`
      : t(['waveA', 'waveB'].includes(game.phase) ? 'waveProgress' : 'objective');
}
for (const kind of ['mousedown', 'mouseup', 'auxclick'] as const)
  document.addEventListener(
    kind,
    (e) => {
      if (['playing', 'briefing'].includes(screen) && [1, 3, 4].includes(e.button))
        e.preventDefault();
    },
    true,
  );
// The preview also has one document. Browser Back from a fourth mouse button
// bypasses ordinary mouse-event defaults in Chromium; request cancellation
// where supported. The full-browser smoke separately clears browser history.
// The packaged app additionally enforces this in the native navigation hook.
(window as Window & { navigation?: EventTarget }).navigation?.addEventListener('navigate', (e) => {
  if (['playing', 'briefing'].includes(screen) && e.cancelable) e.preventDefault();
});
window.addEventListener('keydown', (e) => {
  const key = normalize(e);
  if (e.repeat && (e.target as HTMLElement)?.id === 'typing') e.preventDefault();
  if (e.isComposing || e.key === 'Dead' || e.repeat || held.has(key)) return;
  held.add(key);
  if (screen === 'briefing' && !(e.target instanceof HTMLInputElement)) {
    if (e.target instanceof HTMLButtonElement && ['Space', 'Enter'].includes(key)) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (
      [
        'Space',
        'Enter',
        ...learned(store.data.settings.track, 12, store.data.settings.layout),
      ].includes(key)
    )
      e.preventDefault();
    rehearsed.add(key);
    document.querySelector(`[data-key="${CSS.escape(key)}"]`)?.classList.add('done');
    const seen = document.querySelector('#input-seen');
    if (seen) seen.textContent = `${t('inputSeen')}: ${keyLabel(key)} · ${t(finger(key))}`;
    return;
  }
  if (screen !== 'playing') return;
  if (game?.finished && celebration < 0.5 && ['Space', 'Enter'].includes(key)) {
    e.preventDefault();
    celebration = 0;
    return;
  }
  if (key === 'Escape') {
    e.preventDefault();
    pause();
    return;
  }
  if ((e.target as HTMLElement)?.id === 'typing') {
    if (key === 'Tab') pause();
    return;
  }
  if (
    paused ||
    resuming > 0 ||
    document.activeElement?.id !== 'playfield' ||
    e.ctrlKey ||
    e.altKey ||
    e.metaKey
  )
    return;
  if (key === 'Tab') {
    pause();
    return;
  }
  if (game?.textTarget) return;
  if (game?.keys.includes(key) || key === 'ShiftLeft') {
    e.preventDefault();
    if (
      e.shiftKey &&
      key !== 'ShiftLeft' &&
      [...held].every((k) => k !== 'ShiftLeft') &&
      !store.data.settings.anyShift
    )
      return;
    combat({ kind: 'key', key, held: [...held] });
  }
});
window.addEventListener('keyup', (e) => {
  held.delete(normalize(e));
  if (!held.size) {
    if (waiting === 'launch') void launch();
    if (waiting === 'resume') resume();
  }
});
window.addEventListener('blur', () => {
  held.clear();
  pause();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});
window.addEventListener('resize', () => pause());
window.addEventListener('beforeunload', (e) => {
  if (pending.length) {
    e.preventDefault();
  }
});
render();
function frame(now: number) {
  const gap = (now - lastTime) / 1000;
  lastTime = now;
  if (gap > 0.25 && screen === 'playing') pause();
  const dt = Math.min(gap, 0.05);
  if (screen === 'playing' && game && !paused) {
    if (game.finished) {
      celebration = Math.max(0, celebration - dt);
      if (celebration === 0 && resultReady) {
        screen = completed && game.bossKilled && game.config.level === 12 ? 'outro' : 'results';
        audio.suspend();
        render();
      }
    } else if (resuming > 0) resuming = Math.max(0, resuming - dt);
    else {
      accumulator += dt;
      while (accumulator >= 1 / 60 && !game.finished) {
        game.step(1 / 60);
        accumulator -= 1 / 60;
        consumeEvents();
      }
    }
    if (!game.finished)
      audio.update(store.data.settings, game, game.phase === 'entrance' || game.phase === 'boss');
    updateHud();
    updateTextHud();
  }
  if (renderer) {
    const data = Object.keys(previewTier).length
      ? { ...store.data, equipped: { ...store.data.equipped, ...previewTier } }
      : store.data;
    renderer.draw(
      screen === 'playing' || screen === 'outro' ? game : null,
      data,
      dt,
      screen === 'outro',
    );
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only development inspection for integration tests; never included in the release bundle.
if (import.meta.env.DEV)
  Object.defineProperty(window, '__keystrike', { get: () => ({ game, store, screen, pending }) });
