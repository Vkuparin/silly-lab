import { additions, learned, roster, catalog, type Rules } from './content.ts';
import {
  buttons,
  returnRoster,
  scenes,
  sceneIndex,
  story,
  textCharacters,
  cannonRewards,
} from './campaigns.ts';
import { campaignUnlocked, progressKey, type Store } from './storage.ts';
import type { Game } from './core.ts';
import { translate, finger, keyLabel, type Word } from './i18n.ts';
import { escapeHtml as esc, leaderboard } from './ui.ts';

export interface ViewState {
  store: Store;
  screen: string;
  level: number;
  game: Game | null;
  decision: string;
  scoreBusy: boolean;
  completed: boolean;
  pending: number;
  unlocked: number;
  proEligible: boolean;
  rehearsalPage: number;
  rehearsed: Set<string>;
  replayRules: Rules;
  board: string;
  selectedBoard: string;
}
export function screenHtml(v: ViewState) {
  const { store, screen, level, game: g } = v,
    d = store.data,
    s = d.settings;
  const t = (k: Word) => translate(s.lang, k);
  const title = (i: number) =>
    (s.campaign === 'return' ? returnRoster : roster)[i - 1][s.lang === 'en' ? 0 : 1];
  const btn = (k: Word, a: string, primary = false, disabled = false) =>
    `<button data-action="${a}" class="${primary ? 'primary' : ''}" ${disabled ? 'disabled' : ''}>${t(k)}</button>`;
  const select = (id: string, k: Word, opts: string[], val: string) =>
    `<div class="field"><label for="${id}">${t(k)}</label><select id="${id}">${opts.map((o) => `<option value="${esc(o)}" ${o === val ? 'selected' : ''}>${o === 'fi' && id === 'layout' ? 'Suomi / Svenska QWERTY' : o === 'us' ? 'US QWERTY' : o === 'fi' ? 'Suomi' : o.includes('x') && /^\d/.test(o) ? o.replace('x', ' × ') : t(o as Word)}</option>`).join('')}</select></div>`;
  const check = (id: string, k: Word, on: boolean) =>
    `<label class="check"><input id="${id}" type="checkbox" ${on ? 'checked' : ''}>${t(k)}</label>`;
  const profile = () =>
    select(
      'mouseProfile',
      'mouseProfile',
      ['primary', 'two-buttons', 'extended'],
      s.primaryOnly ? 'primary' : s.mouseProfile,
    );
  const campaign = () => select('campaign', 'campaign', ['defense', 'return'], s.campaign);
  const corpus = () =>
    s.campaign === 'return' && s.track !== 'mouse'
      ? select('textLang', 'textLang', s.layout === 'us' ? ['en'] : ['fi', 'en'], s.textLang)
      : '';
  const back = (heading: Word) =>
    `<div class="actions">${btn('back', 'home')}<h2 style="margin:0">${t(heading)}</h2></div>`;
  if (screen === 'home')
    return `<section class="stage"><canvas aria-label="Helsinki"></canvas><div class="home-overlay"><div class="hero"><div class="eyebrow">${t('tagline')}</div><h1>KEYSTRIKE${s.lang === 'fi' ? '<span class="subtitle">NÄPPÄINISKU</span>' : ''}</h1><p>${t('intro')}</p><div class="actions">${btn('play', 'setup', true)}</div><nav class="home-nav">${btn('hangar', 'hangar')}${btn('scores', 'scores')}${btn('settings', 'settings')}${btn('exit', 'exit')}</nav><span class="hero-tag">${t('defense')} + ${t('return')}</span></div></div></section>`;
  if (screen === 'setup') {
    const p = d.progress[progressKey(s)],
      allowed = campaignUnlocked(s, d);
    return `<div class="screen">${back('play')}<div class="columns"><section class="panel">${campaign()}${select('track', 'track', ['keyboard', 'mouse', 'mixed'], s.track)}${select('rules', 'rules', ['standard', 'relaxed', 'pro'], s.rules)}${select('layout', 'layout', ['fi', 'us'], s.layout)}${corpus()}${s.track !== 'keyboard' ? profile() : ''}${check('anyShift', 'anyShift', s.anyShift)}<p>${t(s.track === 'keyboard' ? 'homeGuide' : s.track === 'mixed' ? 'mixedGuide' : 'mouseGuide')}</p>${!allowed ? `<p class="alert">${t('campaignLocked')}</p>` : ''}</section><section class="panel"><div class="eyebrow">${t('level')} / ${t(s.campaign)}</div><div class="level-grid">${roster.map((_, i) => `<button class="level-tile ${level === i + 1 ? 'selected' : ''}" data-level="${i + 1}" ${!allowed || i + 1 > v.unlocked ? 'disabled' : ''}><span class="level-no">${String(i + 1).padStart(2, '0')}</span><span class="level-name">${esc(title(i + 1))}</span><span class="stars">${'★'.repeat(p?.stars[`${s.rules}:${i + 1}`] ?? 0) || '· · ·'}</span></button>`).join('')}</div><div class="actions">${btn('continue', 'briefing', true, !allowed || level > v.unlocked || (s.rules === 'pro' && !v.proEligible))}</div>${s.rules === 'pro' && !v.proEligible ? `<p class="alert">${t('proLocked')}</p>` : ''}</section></div></div>`;
  }
  if (screen === 'briefing') {
    let all = additions(s.track, level, s.layout);
    if (!all.length) all = learned(s.track, level, s.layout).slice(0, 4);
    if (s.campaign === 'return' && s.track !== 'mouse') {
      const previous =
        level === 1
          ? learned(s.track, 12, s.layout)
          : textCharacters(s.track, level - 1, s.textLang, s.layout);
      all = textCharacters(s.track, level, s.textLang, s.layout).filter(
        (k) => !previous.includes(k),
      );
      if (!all.length) all = textCharacters(s.track, level, s.textLang, s.layout).slice(0, 4);
    }
    if (s.campaign === 'defense' && s.rules === 'pro' && s.track !== 'mouse' && level >= 11)
      all = [...new Set([...all, 'ShiftLeft', 'w', 'Space'])];
    const pages = Math.max(1, Math.ceil(all.length / 4)),
      keys = all.slice(v.rehearsalPage * 4, v.rehearsalPage * 4 + 4);
    const bs = buttons(s.track, level, s.primaryOnly ? 'primary' : s.mouseProfile, s.campaign);
    const names: Record<number, Word> = { 0: 'primary', 1: 'middle', 2: 'secondary', 3: 'fourth' };
    const hardwareReady =
      s.mouseProfile !== 'extended' ||
      s.track === 'keyboard' ||
      bs.every((b) => v.rehearsed.has(`Mouse${b}`));
    return `<div class="screen"><div class="actions">${btn('back', 'setup')}<span class="eyebrow">${t('briefing')} / ${level}</span></div><div class="columns"><section class="panel"><div class="eyebrow">${esc(scenes[sceneIndex(s.campaign, level)][s.lang === 'en' ? 0 : 1])}</div><h2>${esc(title(level))}</h2><p>${esc(story(s.campaign, level, s.lang))}</p><p>${t(s.campaign === 'return' && s.track !== 'mouse' ? 'wordHelp' : s.track === 'keyboard' ? 'homeGuide' : s.track === 'mixed' ? 'mixedGuide' : 'mouseGuide')}</p>${s.campaign === 'defense' && s.rules === 'pro' && level >= 11 && s.track !== 'mouse' ? `<p class="alert">${t('pairHelp')}</p>` : ''}${s.campaign === 'return' ? `<p>◆ ${esc(cannonRewards[level - 1][s.lang === 'en' ? 0 : 1])}</p>` : ''}</section><section class="panel"><div class="eyebrow">${t('rehearsal')} / ${v.rehearsalPage + 1} · ${pages}</div><p>${t('rehearseHelp')}</p><div class="rehearsal-grid">${keys.map((k) => `<div class="key-card ${v.rehearsed.has(k) ? 'done' : ''}" data-key="${esc(k)}"><strong>${esc(keyLabel(k))}</strong><span>${t(finger(k))}</span></div>`).join('')}</div>${s.track !== 'keyboard' ? `<p>${s.mouseProfile === 'extended' ? t('capability') : t('deviceCheck')}</p><div class="actions">${bs.map((b) => `<div tabindex="0" class="rehearsal-zone ${v.rehearsed.has(`Mouse${b}`) ? 'checked' : ''}" data-button="${b}">${t(names[b])}</div>`).join('')}</div>` : ''}<div class="input-test" id="input-seen">${t('deviceCheck')} —</div><p>${t('releaseStart')}</p><div class="actions">${v.rehearsalPage + 1 < pages ? btn('continue', 'rehearsalNext', true) : btn('start', 'launch', true, !hardwareReady)}</div></section></div></div>`;
  }
  if (screen === 'playing')
    return `<div class="arena-wings"><section class="stage combat-stage"><div class="hud">${(['level', 'score', 'shield', 'salvage', 'streak'] as Word[]).map((k) => `<div class="hud-stat"><span>${t(k)}</span><b id="${k === 'salvage' ? 'balance' : k}">${k === 'level' ? String(level).padStart(2, '0') : ''}</b></div>`).join('')}<button class="small" data-action="pause">${t('pause')} · ESC</button></div><div class="wave-hud"><span id="wave-label">${t('waveProgress')}</span><progress id="wave-progress" max="1" value="0"></progress></div><div class="arena"><canvas id="playfield" tabindex="0" aria-label="${t('play')}"></canvas><div class="encounter" id="encounter"></div><div id="game-overlay"></div><section id="text-encounter" class="combat-text-status" hidden><label for="typing" class="sr-only">${t('typing')}</label><p id="word-prompt" class="sr-only" aria-live="polite"></p><div id="word-buffer" class="sr-only"></div><input id="typing" class="combat-text-input" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="45" aria-describedby="word-prompt"></section></div><div class="guide" id="guide"></div></section></div><div class="progress-text" id="pending"></div>`;
  if (screen === 'outro' && g)
    return `<section class="panel outro"><canvas aria-label="${t('outro')}"></canvas><div class="outro-caption"><div class="eyebrow">${t('victory')}</div><h2>${t('outro')}</h2><p>${t(g.campaign === 'return' ? 'kingFinal' : 'kingVow')}</p>${g.campaign === 'defense' ? `<p>${t('unlockReturn')}</p>` : ''}${btn('continue', 'outroContinue', true)}${btn('skip', 'outroContinue')}</div></section>`;
  if (screen === 'results' && g) {
    const final = g.config.level === 12 && g.bossKilled && g.shield > 0;
    const p =
      d.progress[progressKey({ ...s, ...g.config, campaign: g.campaign, mouseProfile: g.profile })];
    const canPro = !!p?.completed.includes(g.config.level);
    const canNext = g.config.level < 12 && g.shield > 0;
    const nextPrimary = canNext && !p?.completed.includes(g.config.level + 1);
    const rows = d.scores.filter((r) => r.board === g.board);
    const samples = [...g.responses].sort((a, b) => a - b);
    return `<div class="screen"><section class="panel result-heading"><div class="eyebrow">${t(g.campaign)} / ${g.config.level} · ${t(g.config.track)} · ${t(g.config.rules)}</div><h2>${t(final ? 'victory' : g.shield <= 0 ? 'depleted' : g.bossKilled ? 'defeated' : 'escaped')}</h2><span class="stars">${'★'.repeat(g.stars)}${'☆'.repeat(3 - g.stars)}</span>${final && g.campaign === 'defense' && v.completed ? `<p>${t('unlockReturn')}</p>` : ''}</section><div class="columns"><section class="panel"><h3>${t('scores')}</h3>${leaderboard(rows, t)}${!v.decision ? `<div class="candidate"><span>${t('unsavedScore')}</span><b>${g.score.toLocaleString(s.lang)}</b></div>` : ''}<div class="field"><label for="nickname">${t('nickname')}</label><input id="nickname" value="${esc(s.remember ? s.nickname : '')}" maxlength="80" autocomplete="off"></div><details><summary>${t('onScreen')}</summary><div class="osk">${'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ0123456789'
      .split('')
      .map((k) => `<button data-letter="${k}" class="small">${k}</button>`)
      .join(
        '',
      )}<button data-letter=" " class="small">␣</button><button data-letter="backspace" class="small">⌫</button></div></details>${check('remember', 'remember', s.remember)}<div class="actions">${btn('save', 'save', true, !!v.decision || v.scoreBusy)}${btn('skip', 'skip', false, !!v.decision)}</div><p id="score-status" role="status">${v.decision ? t(v.decision as Word) : ''}</p></section><section class="panel">${canPro && g.config.rules !== 'pro' ? `<h3>${t('replayPro')}</h3>` : ''}${select('replayRules', 'replayRules', canPro ? ['standard', 'relaxed', 'pro'] : ['standard', 'relaxed'], v.replayRules)}<div class="actions">${btn('retry', 'retry', !nextPrimary)}${canNext ? btn('next', 'next', nextPrimary) : ''}${btn('hangar', 'hangar')}${btn('home', 'home')}</div>${v.pending || !v.completed ? `<div class="notice">${t('writeFailed')}${btn('retrySave', 'retryRewards')}</div>` : ''}<details class="attempt-details"><summary>${t('details')}</summary><div class="metrics">${(
      [
        ['score', g.score],
        ['accuracy', g.accuracy === null ? '—' : Math.round(g.accuracy * 100) + '%'],
        ['destroyed', `${g.destroyed} / ${g.spawned}`],
        ['impacts', g.impacts],
        ['shield', g.shield],
        ['bestStreak', g.bestStreak],
        [
          'response',
          samples.length ? samples[Math.floor(samples.length / 2)].toFixed(2) + ' s' : '—',
        ],
        ['earned', g.salvage],
        ['pending', v.pending],
      ] as [Word, string | number][]
    )
      .map(([k, value]) => `<div class="metric">${t(k)}<b>${esc(value)}</b></div>`)
      .join('')}</div></details></section></div></div>`;
  }
  if (screen === 'hangar')
    return `<div class="screen">${back('hangar')}<span class="balance">◆ ${d.balance} ${t('salvage')}</span><div class="columns"><section class="panel"><canvas class="preview-canvas" aria-label="${t('cannon')}"></canvas><p>${t('cosmetic')}</p><div class="field"><label for="cannonName">${t('cannonName')}</label><input id="cannonName" value="${esc(d.cannonName)}" maxlength="80"></div>${btn('saveName', 'saveName')}<h3>${t('earnedLooks')}</h3><div class="earned-roster"><button data-appearance="" class="${!d.appearance ? 'primary' : ''}">${t('defaultLook')}</button>${cannonRewards.map((n, i) => `<button data-appearance="return-${i + 1}" class="${d.appearance === `return-${i + 1}` ? 'primary' : ''}" ${!d.earned.includes(`return-${i + 1}`) ? 'disabled' : ''}>${i + 1} · ${esc(n[s.lang === 'en' ? 0 : 1])}${!d.earned.includes(`return-${i + 1}`) ? ` · ${t('locked')}` : ''}</button>`).join('')}</div></section><section class="panel shop-list">${catalog.map((c) => `<div class="shop-row"><div><h3>${s.lang === 'en' ? c.en : c.fi}</h3><span>${d.owned[c.id] + 1} / ${c.names.length}</span></div><div class="shop-options">${c.names.map((n, i) => `<button class="shop-item ${d.equipped[c.id] === i ? 'primary' : ''}" data-shop="${c.id}:${i}" ${i > d.owned[c.id] && (i !== d.owned[c.id] + 1 || d.balance < c.prices[i]) ? 'disabled' : ''}><b>${esc(n[s.lang === 'en' ? 0 : 1])}</b><span>${d.equipped[c.id] === i ? t('equipped') : i <= d.owned[c.id] ? t('equip') : `◆ ${c.prices[i]} · ${t(i === d.owned[c.id] + 1 ? 'buy' : 'locked')}`}</span></button>`).join('')}</div></div>`).join('')}</section></div></div>`;
  if (screen === 'scores') {
    const current = v.selectedBoard || v.board,
      all = [...new Set([v.board, ...d.scores.map((r) => r.board)])];
    return `<div class="screen">${back('scores')}<section class="panel"><div class="actions">${campaign()}${select('track', 'track', ['keyboard', 'mouse', 'mixed'], s.track)}${select('rules', 'rules', ['standard', 'relaxed', 'pro'], s.rules)}<div class="field"><label for="boardLevel">${t('level')}</label><select id="boardLevel">${roster.map((_, i) => `<option value="${i + 1}" ${level === i + 1 ? 'selected' : ''}>${i + 1} · ${esc(title(i + 1))}</option>`).join('')}</select></div></div>${corpus()}${s.track !== 'keyboard' ? profile() : ''}<details><summary>${t('legacy')}</summary><select id="savedBoard" aria-label="${t('scores')}">${all.map((b) => `<option value="${esc(b)}" ${b === current ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></details>${leaderboard(
      d.scores.filter((r) => r.board === current),
      t,
    )}</section></div>`;
  }
  if (screen === 'settings')
    return `<div class="screen">${back('settings')}<div class="columns"><section class="panel">${check('motion', 'motion', s.motion)}${check('guide', 'guide', s.guide)}${check('mute', 'mute', s.mute)}${(['sfx', 'music'] as const).map((k) => `<div class="field"><label for="${k}">${t(k)} · ${Math.round(s[k] * 100)}%</label><input id="${k}" type="range" min="0" max="1" step=".05" value="${s[k]}"></div>`).join('')}${select('layout', 'layout', ['fi', 'us'], s.layout)}${profile()}${check('anyShift', 'anyShift', s.anyShift)}${select('resolution', 'resolution', ['1200x860', '1280x800', '1920x1080', '2560x1440', '3440x1440', '5120x1440', 'fullscreen'], s.resolution)}${btn('exitFullscreen', 'exitFullscreen')}</section><section class="panel"><h3>${t('dataLocation')}</h3><p class="data-path">${esc(store.location)}</p><p>${t('portable')}</p><div class="actions">${btn('export', 'export')}${btn('import', 'import')}</div><input id="importFile" type="file" accept=".json,application/json" hidden><h3>${t('reset')}</h3><div class="actions">${(['scores', 'lessons', 'cosmetics', 'settings'] as const).map((k) => `<button class="small" data-reset="${k}">${t(k)}</button>`).join('')}</div>${store.notice ? btn('retrySave', 'retrySettings') : ''}</section></div></div>`;
  return '';
}
