import './style.css';
import {
  additions,
  learned,
  roster,
  catalog,
  validateContent,
  type Track,
  type Rules,
  type Category,
} from './content.ts';
import { Game, type Config, type Action } from './core.ts';
import {
  Store,
  fresh,
  cleanName,
  validate,
  progressKey,
  sortScores,
  type Settings,
} from './storage.ts';
import { translate, keyLabel, finger, type Word } from './i18n.ts';
import { Renderer, W, H } from './render.ts';
import { Audio } from './audio.ts';

validateContent();
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
  rehearsed = new Set<string>(),
  practiceKeys = '',
  practiceWindow = 1.5,
  practicePairs = false;
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
const title = (i: number) => roster[i - 1][store.data.settings.lang === 'en' ? 0 : 1];
const btn = (key: Word, action: string, primary = false, disabled = false) =>
  `<button data-action="${action}" class="${primary ? 'primary' : ''}" ${disabled ? 'disabled' : ''}>${t(key)}</button>`;
function select(id: string, label: Word, options: string[], value: string) {
  return `<div class="field"><label for="${id}">${t(label)}</label><select id="${id}">${options.map((v) => `<option value="${v}" ${v === value ? 'selected' : ''}>${v === 'fi' ? 'Suomi / Svenska QWERTY' : v === 'us' ? 'US QWERTY' : t(v as Word)}</option>`).join('')}</select></div>`;
}
const check = (id: string, label: Word, value: boolean) =>
  `<label class="check"><input id="${id}" type="checkbox" ${value ? 'checked' : ''}>${t(label)}</label>`;
function notice() {
  return store.notice ? `<div class="notice" role="status">${t(store.notice as Word)}</div>` : '';
}
function language() {
  return `<div class="top-right"><span class="chip"><span class="status-dot"></span>OFFLINE</span><button class="small ghost" data-action="language" aria-label="${t('language')}">${store.data.settings.lang === 'fi' ? 'ENGLISH' : 'SUOMI'}</button></div>`;
}
function layout(body: string) {
  app.innerHTML = `<main class="shell"><header class="topbar"><div class="brand"><span class="mark">⌁</span>KEYSTRIKE</div>${language()}</header>${notice()}${body}<footer class="footer"><span>${t('version')}</span><span>HELSINKI / 60°10′ N &nbsp; · &nbsp; ${t('quiet')}</span></footer></main>`;
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
    sessionUnlock,
    store.data.progress[progressKey(store.data.settings)]?.unlocked ?? 1,
  );
}
function proEligible() {
  return !!store.data.progress[progressKey(store.data.settings)]?.completed.includes(level);
}
function render() {
  const s = store.data.settings;
  if (screen === 'home') {
    layout(
      `<section class="stage"><canvas aria-label="Helsinki night waterfront"></canvas><div class="home-overlay"><div class="hero"><div class="eyebrow">${t('tagline')}</div><h1>KEYSTRIKE<span style="display:block;color:#a6f3c1;font-size:.47em;letter-spacing:-1px;margin-top:12px">NÄPPÄINISKU</span></h1><p>${t('intro')}</p><div class="actions">${btn('play', 'setup', true)}${btn('practice', 'practice')}</div><nav class="home-nav">${btn('hangar', 'hangar')}${btn('scores', 'scores')}${btn('settings', 'settings')}</nav><span class="hero-tag">${t('offline')}</span></div></div></section>`,
    );
    mountCanvas();
  } else if (screen === 'setup' || screen === 'practice') {
    const p = store.data.progress[progressKey(s)];
    layout(
      `<div class="screen"><div class="actions">${btn('back', 'home')}<h2 style="margin:0">${t(screen === 'practice' ? 'practice' : 'play')}</h2></div><div class="columns"><section class="panel"><div class="eyebrow">01 / ${t('track')}</div>${select('track', 'track', ['keyboard', 'mouse', 'mixed'], s.track)}${screen === 'practice' ? `<p>${t('practiceHelp')}</p><div class="field"><label for="practiceKeys">${t('practiceKeys')}</label><input id="practiceKeys" value="${esc(practiceKeys || learned(s.track, level, s.layout).join(' '))}"></div>` : select('rules', 'rules', ['standard', 'relaxed', 'pro'], s.rules === 'practice' ? 'standard' : s.rules)}${select('layout', 'layout', ['fi', 'us'], s.layout)}${s.track !== 'keyboard' ? check('primaryOnly', 'primaryOnly', s.primaryOnly) : ''}${check('anyShift', 'anyShift', s.anyShift)}<p>${t(s.track === 'keyboard' ? 'homeGuide' : s.track === 'mixed' ? 'mixedGuide' : 'mouseGuide')}</p></section><section class="panel"><div class="eyebrow">02 / ${t('level')}</div><div class="level-grid">${roster.map((_, i) => `<button class="level-tile ${level === i + 1 ? 'selected' : ''}" data-level="${i + 1}" ${screen !== 'practice' && i + 1 > unlocked() ? 'disabled' : ''}><span class="level-no">${String(i + 1).padStart(2, '0')} ${screen !== 'practice' && i + 1 > unlocked() ? '⌑' : ''}</span><span class="level-name">${esc(title(i + 1))}</span><span class="stars">${'★'.repeat(p?.stars[`${s.rules}:${i + 1}`] ?? 0) || '· · ·'}</span></button>`).join('')}</div><div class="actions" style="margin-top:22px">${btn('continue', 'briefing', true, screen !== 'practice' && s.rules === 'pro' && !proEligible())}</div>${s.rules === 'pro' && !proEligible() ? `<p class="alert" style="margin-top:15px">${t('proLocked')}</p>` : ''}</section></div></div>`,
    );
    if (screen === 'practice' && s.track !== 'mouse') {
      app
        .querySelector('#practiceKeys')
        ?.closest('.field')
        ?.insertAdjacentHTML(
          'afterend',
          `${check('practicePairs', 'practicePairs', practicePairs)}<div class="field"><label for="practiceWindow">${t('pairWindow')}</label><input id="practiceWindow" type="number" min=".3" max="3" step=".1" value="${practiceWindow}"></div>`,
        );
      app.querySelector<HTMLInputElement>('#practicePairs')!.onchange = (e) => {
        practicePairs = (e.target as HTMLInputElement).checked;
      };
      app.querySelector<HTMLInputElement>('#practiceWindow')!.onchange = (e) => {
        practiceWindow = Math.min(
          3,
          Math.max(0.3, Number((e.target as HTMLInputElement).value) || 1.5),
        );
      };
    }
  } else if (screen === 'briefing') {
    const keys = additions(s.track, level, s.layout);
    let all = keys.length ? keys : learned(s.track, level, s.layout).slice(0, 4);
    if (s.rules === 'practice') {
      all = practiceKeys.split(/\s+/).filter(Boolean);
      if (practicePairs && s.track !== 'mouse')
        all = [
          ...new Set([
            ...all,
            'ShiftLeft',
            all.find((k) => ['w', 'a', 's', 'd', 'q', 'e', 'Space'].includes(k)) ?? 'w',
          ]),
        ];
    }
    if (s.rules === 'pro' && s.track !== 'mouse' && level >= 11)
      all = [...new Set([...all, 'ShiftLeft', 'w', 'Space'])];
    const pages = Math.max(1, Math.ceil(all.length / 4)),
      current = all.slice(rehearsalPage * 4, rehearsalPage * 4 + 4);
    const secondary = !s.primaryOnly && level >= (s.track === 'mixed' ? 4 : 3);
    layout(
      `<div class="screen"><div class="actions">${btn('back', 'setup')}<span class="eyebrow" style="margin:0">${t('briefing')} / ${String(level).padStart(2, '0')}</span></div><div class="columns"><section class="panel"><h2>${esc(title(level))}</h2><p>${s.lang === 'en' ? `The ${title(level)} has spotted our waterfront cannon. Protect the city, then collect the fleet's scrap.` : `${title(level)} on löytänyt rannikkotykkimme. Suojele kaupunkia ja kerää laivueen romut.`}</p><p>${t(s.track === 'keyboard' ? 'homeGuide' : s.track === 'mixed' ? 'mixedGuide' : 'mouseGuide')}</p><div class="actions"><span class="chip">${t('mini')} · ${[2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5][level - 1]} ×</span><span class="chip">${t('boss')} · ${[4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 20][level - 1]} ×</span></div>${s.rules === 'pro' && level >= 11 && s.track !== 'mouse' ? `<p class="alert" style="margin-top:20px">${t('pairHelp')}</p>` : ''}</section><section class="panel"><div class="eyebrow">${t('rehearsal')} / ${rehearsalPage + 1} · ${pages}</div><p>${t('rehearseHelp')}</p><div class="rehearsal-grid">${current.map((k) => `<div class="key-card ${rehearsed.has(k) ? 'done' : ''}" data-key="${esc(k)}"><strong>${esc(keyLabel(k))}</strong><span>${t(finger(k))}</span></div>`).join('')}</div>${s.track !== 'keyboard' ? `<div class="actions"><div class="rehearsal-zone" data-button="0">${t('primary')}</div>${secondary ? `<div class="rehearsal-zone" data-button="2">${t('secondary')}</div>` : ''}</div>` : ''}<div class="input-test" id="input-seen">${t('deviceCheck')} —</div><p class="progress-text">${t('releaseStart')}</p><div class="actions">${rehearsalPage + 1 < pages ? btn('continue', 'rehearsalNext', true) : btn('start', 'launch', true)}</div></section></div></div>`,
    );
  } else if (screen === 'playing') {
    layout(
      `<section class="stage combat-stage"><div class="hud"><div class="hud-stat"><span>${t('level')}</span><b>${String(level).padStart(2, '0')}</b></div><div class="hud-stat"><span>${t('score')}</span><b id="score">0</b></div><div class="hud-stat"><span>${t('shield')}</span><b id="shield"></b></div><div class="hud-stat gold"><span>${t('salvage')}</span><b id="balance"></b></div><div class="hud-stat"><span>${t('streak')}</span><b id="streak">0</b></div><button class="small" data-action="pause">${t('pause')} · ESC</button>${s.rules === 'practice' ? btn('practiceEnd', 'practiceEnd') : ''}</div><div style="position:relative"><canvas id="playfield" tabindex="0" aria-label="${t('play')}"></canvas><div class="encounter" id="encounter"></div><div id="game-overlay"></div></div><div class="guide" id="guide"></div></section><div class="progress-text" id="pending" style="margin-top:10px"></div>`,
    );
    mountCanvas();
    document.querySelector<HTMLCanvasElement>('canvas')!.focus();
    updateHud();
  } else if (screen === 'results' && game) {
    const g = game;
    const outcome =
      g.config.rules === 'practice'
        ? 'practice'
        : g.shield <= 0
          ? 'depleted'
          : g.bossKilled
            ? 'defeated'
            : 'escaped';
    const samples = [...g.responses].sort((a, b) => a - b),
      median = samples.length ? samples[Math.floor(samples.length / 2)].toFixed(2) + ' s' : '—';
    const suggestions = Object.entries(g.observations)
      .filter(([, o]) => o.hits + o.misses >= 3 && o.misses > 0)
      .sort((a, b) => b[1].misses - a[1].misses)
      .slice(0, 2)
      .map(([k]) => (k === 'mouse' ? t('mouse') : keyLabel(k)));
    layout(`<div class="screen"><div class="columns"><section class="panel"><div class="eyebrow">${esc(title(level))} / ${t('done')}</div><h2>${t(outcome)}</h2><div class="stars" style="font-size:26px">${'★'.repeat(g.stars)}${'☆'.repeat(3 - g.stars)}</div><div class="result-score">${g.score.toLocaleString(s.lang)}</div><div class="metrics">${[
      ['accuracy', g.accuracy === null ? '—' : Math.round(g.accuracy * 100) + '%'],
      ['destroyed', `${g.destroyed} / ${g.spawned}`],
      ['impacts', g.impacts],
      ['shield', g.shield],
      ['bestStreak', g.bestStreak],
      ['response', median],
      ['earned', g.salvage],
      ['pending', pending.reduce((n, r) => n + r.amount, 0)],
    ]
      .map(([k, v]) => `<div class="metric">${t(k as Word)}<b>${esc(v)}</b></div>`)
      .join(
        '',
      )}</div>${suggestions.length ? `<p style="margin-top:15px">${t('suggestion')}: ${esc(suggestions.join(', '))}</p>` : ''}</section><section class="panel"><h3>${t('scores')}</h3>${
      g.config.rules === 'practice'
        ? `<p>${t('practiceHelp')}</p>`
        : `<div class="field"><label for="nickname">${t('nickname')}</label><input id="nickname" value="${esc(s.remember ? s.nickname : '')}" maxlength="80" autocomplete="off"></div><details><summary>${t('onScreen')}</summary><div class="osk">${'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ0123456789'
            .split('')
            .map((k) => `<button data-letter="${k}" class="small">${k}</button>`)
            .join(
              '',
            )}<button data-letter=" " class="small">␣</button><button data-letter="backspace" class="small">⌫</button></div></details>${check('remember', 'remember', s.remember)}<div class="actions">${btn('save', 'save', true, !!decision || scoreBusy)}${btn('skip', 'skip', false, !!decision)}</div><p id="score-status" role="status" style="margin-top:15px">${decision ? t(decision as Word) : ''}</p>`
    }
  ${pending.length || !completed ? `<div class="notice">${t('writeFailed')}<div class="actions" style="margin-top:10px">${btn('retrySave', 'retryRewards')}</div></div>` : ''}<div class="actions" style="margin-top:28px">${btn('retry', 'retry')}${level < 12 && g.shield > 0 && g.config.rules !== 'practice' ? btn('next', 'next', true) : ''}${btn('hangar', 'hangar')}${btn('home', 'home')}</div></section></div></div>`);
  } else if (screen === 'hangar') {
    layout(
      `<div class="screen"><div class="actions">${btn('back', 'home')}<h2 style="margin:0">${t('hangar')}</h2><span class="balance">◆ ${store.data.balance} ${t('salvage')}</span></div><div class="columns"><section class="panel"><canvas class="preview-canvas" aria-label="${t('cannon')}"></canvas><p style="margin-top:15px">${t('cosmetic')}</p><div class="field"><label for="cannonName">${t('cannonName')}</label><input id="cannonName" value="${esc(store.data.cannonName)}" maxlength="80"></div>${btn('saveName', 'saveName')}</section><section class="panel shop-list">${catalog
        .map(
          (c) =>
            `<div class="shop-row"><div><h3>${s.lang === 'en' ? c.en : c.fi}</h3><span class="progress-text">${store.data.owned[c.id] + 1} / ${c.names.length}</span></div><div class="shop-options">${c.names
              .map((names, i) => {
                const equipped = store.data.equipped[c.id] === i,
                  owned = store.data.owned[c.id] >= i,
                  canBuy = i === store.data.owned[c.id] + 1;
                return `<button class="shop-item ${equipped ? 'primary' : ''}" data-shop="${c.id}:${i}" ${!owned && (!canBuy || store.data.balance < c.prices[i]) ? 'disabled' : ''}><b>${esc(names[s.lang === 'en' ? 0 : 1])}</b><span>${equipped ? t('equipped') : owned ? t('equip') : canBuy ? `${t('buy')} · ◆ ${c.prices[i]}` : `${t('locked')} · ◆ ${c.prices[i]}`}</span></button>`;
              })
              .join('')}</div></div>`,
        )
        .join('')}</section></div></div>`,
    );
    mountCanvas();
  } else if (screen === 'scores') {
    const config = makeConfig(),
      board = new Game(config).board;
    const rows = store.data.scores.filter((r) => r.board === board).sort(sortScores);
    layout(
      `<div class="screen"><div class="actions">${btn('back', 'home')}<h2 style="margin:0">${t('scores')}</h2></div><section class="panel"><div class="actions">${select('track', 'track', ['keyboard', 'mouse', 'mixed'], s.track)}${select('rules', 'rules', ['standard', 'relaxed', 'pro'], s.rules === 'practice' ? 'standard' : s.rules)}<div class="field"><label for="boardLevel">${t('level')}</label><select id="boardLevel">${roster.map((_, i) => `<option value="${i + 1}" ${i + 1 === level ? 'selected' : ''}>${i + 1} · ${esc(title(i + 1))}</option>`).join('')}</select></div></div><p class="progress-text">${esc(board)}</p>${rows.length ? `<table class="score-table"><thead><tr><th>#</th><th>${t('nickname')}</th><th>${t('score')}</th><th>${t('accuracy')}</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name || t('anonymous'))}</td><td>${r.score}</td><td>${r.accuracy === null ? '—' : Math.round(r.accuracy * 100) + '%'}</td></tr>`).join('')}</tbody></table>` : `<p>${t('noScores')}</p>`}</section></div>`,
    );
  } else if (screen === 'settings') {
    layout(
      `<div class="screen"><div class="actions">${btn('back', 'home')}<h2 style="margin:0">${t('settings')}</h2></div><div class="columns"><section class="panel">${select('intensity', 'intensity', ['calm', 'standard', 'spectacular'], s.intensity)}${check('motion', 'motion', s.motion)}${check('guide', 'guide', s.guide)}${check('mute', 'mute', s.mute)}${(['sfx', 'music'] as const).map((k) => `<div class="field"><label for="${k}">${t(k)} · ${Math.round(s[k] * 100)}%</label><input id="${k}" type="range" min="0" max="1" step=".05" value="${s[k]}"></div>`).join('')}${select('layout', 'layout', ['fi', 'us'], s.layout)}${check('primaryOnly', 'primaryOnly', s.primaryOnly)}${check('anyShift', 'anyShift', s.anyShift)}</section><section class="panel"><h3>${t('dataLocation')}</h3><p class="data-path">${esc(store.location)}</p><p>${t('portable')}</p><div class="actions">${btn('export', 'export')}${btn('import', 'import')}</div><input id="importFile" type="file" accept=".json,application/json" hidden><h3 style="margin-top:30px">${t('reset')}</h3><div class="actions">${(['scores', 'lessons', 'cosmetics', 'settings'] as const).map((domain) => `<button class="small" data-reset="${domain}">${t(domain)}</button>`).join('')}</div>${store.notice ? `<div class="actions" style="margin-top:20px">${btn('retrySave', 'retrySettings')}</div>` : ''}</section></div></div>`,
    );
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
    seed: level * 7919 + (s.track === 'keyboard' ? 0 : s.track === 'mouse' ? 13 : 29),
    practiceKeys: practiceKeys.split(/\s+/).filter(Boolean),
    practiceWindow,
    practicePairs,
  };
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
    if (store.data.settings.rules === 'practice') await changeSettings({ rules: 'standard' });
    level = Math.min(level, unlocked());
  }
  if (destination === 'practice') await changeSettings({ rules: 'practice' });
  render();
}
async function launch() {
  if (held.size) {
    waiting = 'launch';
    return;
  }
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
  game = new Game(makeConfig());
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
    'intensity',
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
        await changeSettings({ [id]: value });
        if (id === 'track' || id === 'layout' || id === 'primaryOnly') sessionUnlock = 1;
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
            sessionUnlock = 1;
          }
          if (b.dataset.reset === 'cosmetics') {
            d.balance = 0;
            d.owned = f.owned;
            d.equipped = f.equipped;
            d.cannonName = '';
          }
          if (b.dataset.reset === 'settings') d.settings = f.settings;
          d.active = null;
        });
        render();
      }),
  );
  const boardLevel = app.querySelector<HTMLSelectElement>('#boardLevel');
  if (boardLevel)
    boardLevel.onchange = () => {
      level = Number(boardLevel.value);
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
      if (e.button === Number(zone.dataset.button)) zone.style.borderStyle = 'solid';
    };
  });
  const canvas = app.querySelector<HTMLCanvasElement>('#playfield');
  if (canvas) {
    canvas.onpointerdown = (e) => {
      if (paused || resuming > 0 || !game) return;
      if (game.finished && celebration < 0.5) {
        celebration = 0;
        return;
      }
      canvas.focus();
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W,
        y = ((e.clientY - rect.top) / rect.height) * H;
      if (e.button !== 0 && e.button !== 2) return;
      e.preventDefault();
      combat({ kind: 'mouse', button: e.button, x, y });
    };
    canvas.oncontextmenu = (e) => {
      if (!paused) e.preventDefault();
    };
  }
}
async function action(name: string) {
  if (['home', 'setup', 'hangar', 'scores', 'settings', 'practice'].includes(name)) {
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
    const input = app.querySelector<HTMLInputElement>('#practiceKeys');
    if (input) {
      const supported = learned(store.data.settings.track, 12, store.data.settings.layout);
      practiceKeys =
        input.value
          .split(/\s+/)
          .filter((k) => supported.includes(k))
          .join(' ') || supported.slice(0, 2).join(' ');
    }
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
  if (name === 'practiceEnd') {
    game?.finish();
    consumeEvents();
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
  if (name === 'retry' || name === 'next') {
    if (!(await leavePending())) return;
    if (name === 'next') level++;
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
    audio.effect(e.kind, store.data.settings, store.data.equipped.sound);
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
      celebration = 1.5;
      if (game.shield > 0 && game.config.rules !== 'practice')
        sessionUnlock = Math.min(12, Math.max(sessionUnlock, level + 1));
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
      ? `${ship.kind === 'boss' ? esc(title(level)) : t('mini')} <span style="opacity:.7">/ ${t('phase')} ${ship.steps.length === 2 ? 1 : Math.min(3, Math.floor(ship.pip / Math.ceil(ship.steps.length / 3)) + 1)}</span><div class="pips">${ship.steps.map((_, i) => `<span class="pip ${i < ship.pip ? 'filled' : ''}"></span>`).join('')}</div><div class="deadline"><i style="width:${Math.max(0, (100 * (ship.deadline - g.time)) / ship.duration)}%"></i></div>`
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
          ? `${t(g.config.rules === 'practice' ? 'pairPracticeHelp' : 'pairHelp')} ${g.config.rules === 'practice' ? `${g.config.practiceWindow ?? 1.5} s` : ''} ${g.targets[0]?.partial ? '◐' : ''}`
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
          : '';
    }
  }
}
window.addEventListener('keydown', (e) => {
  const key = normalize(e);
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
        screen = 'results';
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
      audio.update(store.data.settings, game.phase === 'boss' || game.phase === 'mini');
    updateHud();
  }
  if (renderer) {
    const data = Object.keys(previewTier).length
      ? { ...store.data, equipped: { ...store.data.equipped, ...previewTier } }
      : store.data;
    renderer.draw(screen === 'playing' ? game : null, data, dt);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only development inspection for integration tests; never included in the release bundle.
if (import.meta.env.DEV)
  Object.defineProperty(window, '__keystrike', { get: () => ({ game, store, screen, pending }) });
