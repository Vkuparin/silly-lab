import { useEffect, useRef, useState } from "react";
import { loadLang, saveLang, type Lang } from "./i18n";
import { text, type UIKey } from "./ui-i18n";
import { MODES, duration, makeTape, type Mode } from "./modes";
import {
  newRound,
  begin,
  advance,
  pause,
  resume,
  capture,
  release,
  changeLevel,
  clickAccuracy,
  type Round,
  type Press,
} from "./round";
import {
  read,
  write,
  legacy,
  getStorage,
  fresh,
  fold,
  category,
  stickersFor,
  STICKERS,
  deleteProfile,
  type SaveData,
  type Profile,
  type Settings,
  type Sticker,
} from "./storage";
import {
  createMatch,
  finishTurn,
  rematch,
  winners,
  type Match,
  type Player,
} from "./match";
import {
  isMuted,
  setMuted,
  setEffectVolume,
  playHit,
  playGolden,
  playBomb,
} from "./sound";
import {
  isMusicEnabled,
  setMusicEnabled,
  pauseMusic,
  resumeMusic,
  setMusicVolume,
} from "./music";
import { saveDifficulty, sanitizeName, type Difficulty } from "./game";
import { exitApp, toggleFullscreen } from "./native";
import { Mole, AVATARS } from "./Art";

type Screen =
  | "home"
  | "rules"
  | "play"
  | "results"
  | "settings"
  | "help"
  | "collection"
  | "records"
  | "family"
  | "handoff"
  | "familyResults";
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const uid = () => crypto.randomUUID();
const levels = [1, 2, 3, 4, 5] as const;
const iconFor = (mode: Mode) =>
  ({ practice: "☀", garden: "❀", harvest: "★", classic: "⚡" })[mode];
const goalFor = (mode: Mode) => (mode === "harvest" ? 10 : 5);
function Button({
  children,
  onClick,
  primary = false,
  action,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  action?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-action={action}
      className={`button ${primary ? "primary" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [loaded] = useState(read);
  const [data, setData] = useState<SaveData>(loaded.data),
    dataRef = useRef(data);
  const writable = useRef(loaded.writable);
  const [warning, setWarning] = useState(loaded.warning);
  const [lang, setLanguage] = useState<Lang>(loadLang);
  const [screen, setScreen] = useState<Screen>("home"),
    screenRef = useRef(screen);
  const [round, setRound] = useState<Round | null>(null),
    roundRef = useRef(round);
  const [mode, setMode] = useState<Mode>(data.settings.mode);
  const [practiceHoles, setPracticeHoles] = useState<4 | 9>(4);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [muted, setMutedState] = useState(isMuted),
    [music, setMusicState] = useState(isMusicEnabled);
  const [returnTo, setReturnTo] = useState<Screen>("home");
  const [helpStep, setHelpStep] = useState(0);
  const [profileName, setProfileName] = useState(""),
    [avatar, setAvatar] = useState(0);
  const [guestName, setGuestName] = useState(""),
    [saved, setSaved] = useState(false);
  const [details, setDetails] = useState(false),
    [unlocked, setUnlocked] = useState<Sticker[]>([]);
  const [newBest, setNewBest] = useState(false),
    [message, setMessage] = useState("");
  const [match, setMatch] = useState<Match | null>(null),
    matchRef = useRef(match);
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 2 }, (_, i) => ({
      name: "",
      avatar: i,
      profile: null,
      level: data.settings.level,
    })),
  );
  const [handicap, setHandicap] = useState(false);
  const [popup, setPopup] = useState<{
    hole: number;
    delta: number;
    serial: number;
  } | null>(null);
  const pointer = useRef<{ press: Press; pointerId: number } | null>(null);
  const clock = useRef(performance.now());
  const finished = useRef(new Set<string>());
  const visits = useRef(0),
    [showBreak, setShowBreak] = useState(false);
  const [oldScores, setOldScores] = useState(legacy);
  const tr = (key: UIKey, n?: number) => text(lang, key, n);
  const profile = data.profiles.find((p) => p.id === data.selected);
  const settings = data.settings;
  const activePlayer = match
    ? match.players[Math.min(match.turn, match.players.length - 1)]
    : null;

  function go(next: Screen) {
    screenRef.current = next;
    setScreen(next);
    setMessage("");
  }
  function commit(next: Round | null) {
    roundRef.current = next;
    setRound(next);
  }
  function setMatchBoth(next: Match | null) {
    matchRef.current = next;
    setMatch(next);
  }
  function persist(next: SaveData) {
    dataRef.current = next;
    setData(next);
    if (!writable.current || !write(next)) setWarning(true);
  }
  function updateSettings(patch: Partial<Settings>) {
    persist({
      ...dataRef.current,
      settings: { ...dataRef.current.settings, ...patch },
    });
  }
  function language(next: Lang) {
    setLanguage(next);
    saveLang(next);
  }
  function openSettings() {
    if (roundRef.current?.phase === "playing") commit(pause(roundRef.current));
    pointer.current = null;
    pauseMusic();
    setReturnTo(screenRef.current);
    go("settings");
  }
  function leaveHome() {
    const s = roundRef.current;
    if (
      s &&
      ["playing", "paused", "ready"].includes(s.phase) &&
      !window.confirm(tr("leaveConfirm"))
    )
      return;
    setCountdown(null);
    pointer.current = null;
    commit(null);
    setMatchBoth(null);
    pauseMusic();
    go("home");
  }
  function prepare(selectedMode = mode) {
    setMatchBoth(null);
    setMode(selectedMode);
    setUnlocked([]);
    setSaved(false);
    setDetails(false);
    setGuestName("");
    setShowBreak(false);
    if (selectedMode !== "practice") updateSettings({ mode: selectedMode });
    go("rules");
  }
  function start(
    tape?: Round["tape"],
    selectedMode = mode,
    level = settings.level,
  ) {
    const s = newRound(
      selectedMode,
      level,
      matchRef.current || selectedMode === "practice"
        ? "mouse"
        : dataRef.current.settings.input,
      matchRef.current?.seed ?? seed(),
      uid(),
      practiceHoles,
      tape,
    );
    setUnlocked([]);
    setSaved(false);
    setDetails(false);
    setPopup(null);
    setNewBest(false);
    pointer.current = null;
    commit(s);
    go("play");
    if (selectedMode === "practice") {
      commit(begin(s));
      clock.current = performance.now();
      resumeMusic();
    } else setCountdown(3);
  }
  function launchTurn() {
    const m = matchRef.current!;
    const p = m.players[m.turn];
    const tape = m.handicap
      ? makeTape("garden", p.level, m.seed + m.turn)
      : m.tape;
    start(tape, "garden", p.level);
  }
  function saveResult(
    s: Round,
    name: string,
    profileId: string | null,
    isMatch = false,
  ) {
    const result = fold(dataRef.current, s, profileId, name, isMatch);
    persist(result.data);
    setUnlocked(result.unlocked);
    setSaved(true);
  }
  function completed(s: Round) {
    if (finished.current.has(s.id)) return;
    finished.current.add(s.id);
    pauseMusic();
    pointer.current = null;
    const m = matchRef.current;
    if (m) {
      const p = m.players[m.turn];
      saveResult(s, p.name, p.profile, true);
      setMatchBoth(finishTurn(m, s.score));
    } else {
      visits.current++;
      setShowBreak(visits.current === 3);
      const p = dataRef.current.profiles.find(
        (p) => p.id === dataRef.current.selected,
      );
      setNewBest(
        !!p && !s.reasons.length && s.score > (p.best[category(s)] ?? -1),
      );
      if (p) saveResult(s, p.name, p.id);
    }
    go("results");
  }
  function apply(
    press: Press,
    hole: number,
    input: "mouse" | "keyboard",
    touch = false,
  ) {
    let s = roundRef.current;
    if (!s || screenRef.current !== "play" || countdown !== null) return;
    const now = performance.now(),
      gap = now - clock.current;
    if (gap > 250 && s.phase === "playing") {
      commit(pause(s));
      pauseMusic();
      pointer.current = null;
      return;
    }
    if (s.phase === "playing") {
      s = advance(s, s.elapsed + Math.max(0, gap));
      clock.current = now;
    }
    if (s.phase === "over") {
      commit(s);
      completed(s);
      return;
    }
    if (matchRef.current && input !== "mouse") {
      commit(pause(s));
      pauseMusic();
      setMessage(tr("matchWarning"));
      return;
    }
    if (touch) s = { ...s, reasons: [...new Set([...s.reasons, "touch"])] };
    const result = release(s, press, hole, input);
    commit(result.state);
    if (result.event === "normal") playHit();
    if (result.event === "golden" || result.event === "star") playGolden();
    if (result.event === "bomb") playBomb();
    if (result.event && result.event !== "miss")
      setPopup({ hole, delta: result.delta, serial: Date.now() });
    if (result.state.mode === "practice") {
      const p = dataRef.current.profiles.find(
        (p) => p.id === dataRef.current.selected,
      );
      if (p) {
        const ids = stickersFor(result.state, p);
        if (ids.length) {
          persist({
            ...dataRef.current,
            profiles: dataRef.current.profiles.map((item) =>
              item.id === p.id
                ? { ...item, stickers: [...item.stickers, ...ids] }
                : item,
            ),
          });
          setUnlocked(ids);
        }
      }
    }
  }
  useEffect(() => {
    setEffectVolume(settings.sfxVolume);
    setMusicVolume(settings.musicVolume);
  }, [settings.sfxVolume, settings.musicVolume]);
  useEffect(() => {
    if (countdown === null) return;
    const id = window.setTimeout(() => {
      if (countdown > 1) setCountdown(countdown - 1);
      else {
        const s = roundRef.current;
        if (s) commit(s.phase === "paused" ? resume(s) : begin(s));
        clock.current = performance.now();
        setCountdown(null);
        resumeMusic();
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown]);
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now(),
        gap = now - clock.current;
      clock.current = now;
      const s = roundRef.current;
      if (!s || s.phase !== "playing" || screenRef.current !== "play") return;
      if (gap > 250) {
        pointer.current = null;
        commit(pause(s));
        pauseMusic();
        return;
      }
      const next = advance(s, s.elapsed + gap);
      commit(next);
      if (next.phase === "over") completed(next);
    }, 40);
    const stop = () => {
      const s = roundRef.current;
      if (s?.phase === "playing") commit(pause(s));
      if (s?.phase === "ready") commit({ ...s, phase: "paused" });
      setCountdown(null);
      pointer.current = null;
      pauseMusic();
    };
    const hidden = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      clearInterval(id);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.shiftKey ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)
      )
        return;
      const s = roundRef.current;
      if (e.key === "Escape" && s?.phase === "playing") {
        e.preventDefault();
        commit(pause(s));
        pointer.current = null;
        pauseMusic();
      }
      if (
        /^[1-9]$/.test(e.key) &&
        s &&
        s.phase === "playing" &&
        screen === "play"
      ) {
        const hole = Number(e.key) - 1;
        if (hole >= (s.mode === "practice" ? s.practiceHoles : 9)) return;
        e.preventDefault();
        apply(capture(s, hole), hole, "keyboard");
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [screen, countdown, lang]);
  useEffect(() => {
    if (!popup) return;
    const id = setTimeout(() => setPopup(null), 550);
    return () => clearTimeout(id);
  }, [popup]);

  function pace(current: Difficulty, update: (level: Difficulty) => void) {
    return (
      <div className="pace">
        <span>{tr("level")}</span>
        <div role="group" aria-label={tr("level")}>
          {levels.map((l) => (
            <button
              type="button"
              key={l}
              aria-pressed={current === l}
              title={tr(`pace${l}`)}
              onClick={() => update(l)}
            >
              {l}
            </button>
          ))}
        </div>
        <small>{tr(`pace${current}`)}</small>
      </div>
    );
  }
  function playerPicker() {
    return (
      <div className="player-picker" role="group" aria-label={tr("profile")}>
        <button
          aria-pressed={!data.selected}
          onClick={() => persist({ ...dataRef.current, selected: null })}
        >
          {tr("guest")}
        </button>
        {data.profiles.map((p) => (
          <button
            key={p.id}
            aria-pressed={data.selected === p.id}
            onClick={() => persist({ ...dataRef.current, selected: p.id })}
          >
            {AVATARS[p.avatar]} {p.name}
          </button>
        ))}
      </div>
    );
  }
  function roundRule(m: Mode) {
    return tr(
      m === "practice"
        ? "noTimer"
        : m === "garden"
          ? "ruleGarden"
          : m === "harvest"
            ? "ruleHarvest"
            : "ruleClassic",
    );
  }
  async function windowAction(action: "exit" | "full") {
    try {
      if (action === "exit") {
        if (!(await exitApp())) setMessage(tr("webExit"));
      } else await toggleFullscreen();
    } catch {
      setMessage(tr("nativeError"));
    }
  }

  return (
    <div
      className={`world theme-${settings.theme} ${settings.reduced ? "reduced" : ""}`}
    >
      <div className="scenery" aria-hidden="true">
        <div className="sun" />
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="hill h1" />
        <div className="hill h2" />
        <div className="flowers">
          ✿ <span>✿</span> ✿ <span>✿</span> ✿
        </div>
        <div className="orbit" />
      </div>
      <header className="topbar">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            leaveHome();
          }}
          className="brand"
        >
          <span>❀</span> Whack-a-Mole <small>1.0</small>
        </a>
        <div className="top-actions">
          <button
            onClick={() => language(lang === "fi" ? "en" : "fi")}
            aria-label={tr("language")}
          >
            {lang.toUpperCase()}
          </button>
          {screen !== "play" && (
            <button
              data-action="settings"
              onClick={openSettings}
              aria-label={tr("settings")}
            >
              ⚙
            </button>
          )}
        </div>
      </header>
      {warning && (
        <div className="storage-notice" role="status">
          {tr("sessionOnly")} {loaded.warning && tr("recovery")}
        </div>
      )}
      {message && (
        <p className="message" role="status">
          {message}
        </p>
      )}
      <main className={`main screen-${screen}`}>
        {screen === "home" && (
          <>
            <section className="hero">
              <div className="eyebrow">{tr("tagline")}</div>
              <h1>{tr("welcome")}</h1>
              <p>{tr("intro")}</p>
              <div className="hero-mole">
                <Mole />
                <div className="hero-flower">✿</div>
              </div>
              {playerPicker()}
              <div className="actions">
                <Button primary action="play" onClick={() => prepare()}>
                  {tr("play")} <span>➜</span>
                </Button>
                <Button action="practice" onClick={() => prepare("practice")}>
                  {tr("practice")}
                </Button>
                <Button
                  action="family"
                  onClick={() => {
                    setMatchBoth(null);
                    go("family");
                  }}
                >
                  {tr("together")}
                </Button>
              </div>
            </section>
            <section className="home-bottom">
              <div className="mode-cards">
                {MODES.map((m) => (
                  <button
                    data-mode={m}
                    key={m}
                    className={`mode-card ${mode === m ? "selected" : ""}`}
                    onClick={() => prepare(m)}
                  >
                    <span className={`mode-icon ${m}`}>{iconFor(m)}</span>
                    <strong>{tr(m)}</strong>
                    <small>{tr(`${m}Desc`)}</small>
                  </button>
                ))}
              </div>
              <div className="home-links">
                <Button action="collection" onClick={() => go("collection")}>
                  {tr("collection")}
                </Button>
                <Button onClick={() => go("records")}>{tr("records")}</Button>
                <Button
                  onClick={() => {
                    setHelpStep(0);
                    go("help");
                  }}
                >
                  {tr("help")}
                </Button>
                <Button
                  action="fullscreen"
                  onClick={() => {
                    void windowAction("full");
                  }}
                >
                  {tr("fullscreen")}
                </Button>
                <Button
                  action="exit"
                  onClick={() => {
                    void windowAction("exit");
                  }}
                >
                  {tr("exit")}
                </Button>
              </div>
            </section>
          </>
        )}
        {screen === "rules" && (
          <section className="panel rule-panel">
            <div className="eyebrow">
              {profile
                ? `${AVATARS[profile.avatar]} ${profile.name}`
                : tr("guest")}
            </div>
            <h1>{tr(mode)}</h1>
            <div className="rule-art">
              <Mole />
              <Mole kind="golden" />
              {mode !== "practice" && (
                <Mole kind={mode === "harvest" ? "star" : "bomb"} />
              )}
            </div>
            <p>{roundRule(mode)}</p>
            {mode !== "practice" ? (
              <>
                {pace(settings.level, (level) => {
                  updateSettings({ level });
                  saveDifficulty(level);
                })}
                <label className="field">
                  {tr("input")}
                  <select
                    value={settings.input}
                    onChange={(e) =>
                      updateSettings({
                        input: e.target.value as Settings["input"],
                      })
                    }
                  >
                    <option value="mouse">{tr("mouse")}</option>
                    <option value="keyboard">{tr("keyboard")}</option>
                  </select>
                </label>
                <div className="goal">✿ {tr("goal", goalFor(mode))}</div>
              </>
            ) : (
              <label className="field">
                {tr("practiceSize")}
                <select
                  value={practiceHoles}
                  onChange={(e) =>
                    setPracticeHoles(Number(e.target.value) as 4 | 9)
                  }
                >
                  <option value={4}>{tr("four")}</option>
                  <option value={9}>{tr("nine")}</option>
                </select>
              </label>
            )}
            <p className="hint">
              {tr(
                settings.input === "keyboard" && mode !== "practice"
                  ? "keyboardHint"
                  : "mouseHint",
              )}
            </p>
            <div className="actions">
              <Button onClick={() => go("home")}>{tr("back")}</Button>
              <Button primary action="start" onClick={() => start()}>
                {tr("ready")}
              </Button>
            </div>
          </section>
        )}
        {screen === "play" && round && (
          <section className="game-shell">
            <div className="game-heading">
              <strong>{tr(round.mode)}</strong>
              <span>
                {activePlayer
                  ? `${AVATARS[activePlayer.avatar]} ${activePlayer.name}`
                  : profile
                    ? `${AVATARS[profile.avatar]} ${profile.name}`
                    : tr("guest")}
              </span>
            </div>
            <div className="hud">
              <div>
                <small>{tr("score")}</small>
                <strong data-stat="score">{round.score}</strong>
              </div>
              <div>
                <small>
                  {round.mode === "practice" ? tr("hits") : tr("time")}
                </small>
                <strong>
                  {round.mode === "practice"
                    ? round.hits
                    : `${Math.ceil((duration(round.mode) - round.elapsed) / 1000)}s`}
                </strong>
              </div>
              <div className="combo">
                <small>{tr("combo")}</small>
                <strong>{round.streak}</strong>
              </div>
              <button
                className="button"
                data-action="pause"
                onClick={() => {
                  commit({ ...roundRef.current!, phase: "paused" });
                  setCountdown(null);
                  pointer.current = null;
                  pauseMusic();
                }}
              >
                {tr("pause")} Ⅱ
              </button>
            </div>
            <div className="time-track">
              <div
                style={{
                  width: `${round.mode === "practice" ? Math.min(100, (round.hits % 5 || (round.hits ? 5 : 0)) * 20) : 100 - (round.elapsed / duration(round.mode)) * 100}%`,
                }}
              />
            </div>
            <div
              className={`board ${round.mode === "practice" && round.practiceHoles === 4 ? "four" : ""}`}
              aria-label={tr("board")}
            >
              {Array.from(
                { length: round.mode === "practice" ? round.practiceHoles : 9 },
                (_, hole) => {
                  const target = round.targets.find((t) => t.hole === hole);
                  const upcoming = round.tape[round.index];
                  const cue =
                    upcoming &&
                    upcoming.at - round.elapsed <= 180 &&
                    upcoming.targets.some((t) => t.hole === hole);
                  return (
                    <button
                      type="button"
                      className={`hole ${cue ? "cue" : ""} ${target ? `occupied ${target.kind}` : ""}`}
                      key={hole}
                      data-hole={hole}
                      data-kind={target?.kind ?? ""}
                      data-appearance={target?.id ?? ""}
                      aria-label={`${tr("hole", hole + 1)}: ${tr(target?.kind ?? "noTarget")}`}
                      onContextMenu={(e) => e.preventDefault()}
                      onPointerDown={(e) => {
                        if (e.button !== 0 || countdown !== null) return;
                        pointer.current = {
                          press: capture(roundRef.current!, hole),
                          pointerId: e.pointerId,
                        };
                      }}
                      onPointerUp={(e) => {
                        const p = pointer.current;
                        pointer.current = null;
                        if (p && p.pointerId === e.pointerId && e.button === 0)
                          apply(
                            p.press,
                            hole,
                            e.pointerType === "mouse" ? "mouse" : "keyboard",
                            e.pointerType !== "mouse",
                          );
                      }}
                      onPointerLeave={() => {
                        pointer.current = null;
                      }}
                      onPointerCancel={() => {
                        pointer.current = null;
                      }}
                      onClick={(e) => {
                        if (e.detail === 0 && countdown === null)
                          apply(
                            capture(roundRef.current!, hole),
                            hole,
                            "keyboard",
                          );
                      }}
                    >
                      <span className="soil" />
                      {target && <Mole key={target.id} kind={target.kind} />}
                      {popup?.hole === hole && (
                        <span key={popup.serial} className="score-pop">
                          {popup.delta >= 0 ? "+" : ""}
                          {popup.delta}
                          <span className="spark">✦</span>
                        </span>
                      )}
                      {round.input === "keyboard" && (
                        <span className="keyhint">{hole + 1}</span>
                      )}
                    </button>
                  );
                },
              )}
              {(countdown !== null || round.phase === "paused") && (
                <div className="board-overlay">
                  <div role="status">
                    <h2>{countdown !== null ? countdown : tr("paused")}</h2>
                    {countdown !== null ? (
                      <Button
                        action="skip-countdown"
                        onClick={() => {
                          const s = roundRef.current!;
                          commit(s.phase === "paused" ? resume(s) : begin(s));
                          clock.current = performance.now();
                          setCountdown(null);
                          resumeMusic();
                        }}
                      >
                        {tr("skip")}
                      </Button>
                    ) : (
                      <>
                        <Button
                          primary
                          action="resume"
                          onClick={() => {
                            if (!round.targets.length && round.elapsed === 0)
                              commit({ ...round, phase: "ready" });
                            setCountdown(3);
                            clock.current = performance.now();
                          }}
                        >
                          {tr("resume")}
                        </Button>
                        <Button onClick={openSettings}>{tr("settings")}</Button>
                        {match && (
                          <Button onClick={launchTurn}>
                            {tr("restartTurn")}
                          </Button>
                        )}
                        <Button onClick={leaveHome}>{tr("home")}</Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <p className="game-foot">
              {round.mode === "practice"
                ? round.hits >= 5
                  ? `✿ ${tr("goalDone")} ${tr("practiceGoal")}`
                  : tr("noTimer")
                : roundRule(round.mode)}
            </p>
            <span className="resize-note">{tr("resized")}</span>
          </section>
        )}
        {screen === "results" && round && (
          <section className="panel results-panel">
            <div className="eyebrow">
              {tr(round.mode)} · {tr(round.input)}
            </div>
            <h1>{tr("finished")}</h1>
            <div className="result-score">
              {round.score}
              <small>{tr("score")}</small>
            </div>
            <p>
              {round.hits ? tr("observation", round.goldens) : tr("noHits")}
            </p>
            {round.hits >= goalFor(round.mode) && (
              <div className="ribbon">✿ {tr("goalDone")}</div>
            )}
            {newBest && <div className="ribbon">★ {tr("best")}</div>}
            {round.reasons.length > 0 && <p>{tr("unranked")}</p>}
            {unlocked.slice(0, 2).map((id) => (
              <div className="unlock" key={id}>
                ✦ {tr("newSticker")} <strong>{tr(`sticker_${id}`)}</strong>
              </div>
            ))}
            <Button onClick={() => setDetails(!details)}>
              {tr(details ? "less" : "details")}
            </Button>
            {details && (
              <dl className="stats">
                {(
                  ["hits", "misses", "bombs", "goldens", "escapes"] as const
                ).map((k) => (
                  <div key={k}>
                    <dt>{tr(k)}</dt>
                    <dd>{round[k]}</dd>
                  </div>
                ))}
                <div>
                  <dt>
                    {tr(
                      round.mode === "classic" ? "classicAccuracy" : "accuracy",
                    )}
                  </dt>
                  <dd>
                    {clickAccuracy(round) === null
                      ? "—"
                      : `${clickAccuracy(round)}%`}
                  </dd>
                </div>
                <div>
                  <dt>{tr("combo")}</dt>
                  <dd>{round.bestStreak}</dd>
                </div>
              </dl>
            )}
            {!match && !profile && !saved && (
              <div className="guest-save">
                <label>
                  {tr("nickname")}
                  <input
                    maxLength={16}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </label>
                <Button
                  action="save"
                  onClick={() =>
                    saveResult(round, guestName.trim() || tr("guest"), null)
                  }
                >
                  {tr("save")}
                </Button>
                <Button onClick={() => setSaved(true)}>{tr("skip")}</Button>
              </div>
            )}
            {saved && <small>{tr(warning ? "sessionOnly" : "saved")}</small>}
            {showBreak && !match && <p className="hint">{tr("break")}</p>}
            <div className="actions">
              {match ? (
                <Button
                  primary
                  action="next-turn"
                  onClick={() =>
                    go(
                      match.turn >= match.players.length
                        ? "familyResults"
                        : "handoff",
                    )
                  }
                >
                  {tr(match.turn >= match.players.length ? "results" : "next")}
                </Button>
              ) : (
                <Button primary action="again" onClick={() => start()}>
                  {tr("again")}
                </Button>
              )}
              <Button onClick={leaveHome}>{tr("home")}</Button>
            </div>
          </section>
        )}
        {screen === "settings" && (
          <section className="panel settings-panel">
            <h1>{tr("settings")}</h1>
            <div className="settings-grid">
              <label>
                {tr("language")}
                <select
                  value={lang}
                  onChange={(e) => language(e.target.value as Lang)}
                >
                  <option value="fi">Suomi</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label>
                {tr("theme")}
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    updateSettings({
                      theme: e.target.value as Settings["theme"],
                    })
                  }
                >
                  <option value="garden">{tr("garden")}</option>
                  <option value="snow">{tr("snow")}</option>
                  <option value="space">{tr("space")}</option>
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.reduced}
                  onChange={(e) =>
                    updateSettings({ reduced: e.target.checked })
                  }
                />
                {tr("reduced")}
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={!muted}
                  onChange={(e) => {
                    setMuted(!e.target.checked);
                    setMutedState(!e.target.checked);
                  }}
                />
                {tr("sound")}
              </label>
              <label>
                {tr("sound")} · {tr("volume")}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) =>
                    updateSettings({ sfxVolume: Number(e.target.value) })
                  }
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={music}
                  onChange={(e) => {
                    setMusicEnabled(e.target.checked);
                    pauseMusic();
                    setMusicState(e.target.checked);
                  }}
                />
                {tr("music")}
              </label>
              <label>
                {tr("music")} · {tr("volume")}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) =>
                    updateSettings({ musicVolume: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            {round?.phase === "paused" &&
              round.mode !== "practice" &&
              !match && (
                <>
                  <p className="hint">{tr("changeWarning")}</p>
                  {pace(round.level, (level) =>
                    commit(changeLevel(roundRef.current!, level)),
                  )}
                </>
              )}
            {match && <p>{tr("matchWarning")}</p>}
            <div className="actions">
              <Button
                onClick={() => {
                  void windowAction("full");
                }}
              >
                {tr("fullscreen")}
              </Button>
              <Button
                action="exit"
                onClick={() => {
                  void windowAction("exit");
                }}
              >
                {tr("exit")}
              </Button>
            </div>
            <details className="data-settings">
              <summary>{tr("records")}</summary>
              <Button
                onClick={() => {
                  if (confirm(tr("clearConfirm"))) {
                    writable.current = true;
                    const next = fresh();
                    persist(next);
                    setWarning(!write(next));
                    commit(null);
                    setMatchBoth(null);
                    go("home");
                  }
                }}
              >
                {tr("clear")}
              </Button>
              <Button
                onClick={() => {
                  if (confirm(tr("clearConfirm"))) {
                    try {
                      getStorage()?.setItem("whackamole.scores.v1", "[]");
                      setOldScores([]);
                    } catch {
                      setMessage(tr("sessionOnly"));
                    }
                  }
                }}
              >
                {tr("clearLegacy")}
              </Button>
            </details>
            <Button primary onClick={() => go(returnTo)}>
              {tr("back")}
            </Button>
          </section>
        )}
        {screen === "help" && (
          <section className="panel tutorial">
            <div className="eyebrow">
              {tr("help")} · {helpStep + 1}/3
            </div>
            <h1>
              {tr((["tutorial1", "tutorial2", "tutorial3"] as const)[helpStep])}
            </h1>
            <div className={`tutorial-art step-${helpStep}`}>
              <Mole kind={helpStep === 2 ? "golden" : "normal"} />
              {helpStep === 2 ? (
                <Mole kind="bomb" />
              ) : (
                <span className="demo-pointer">➚</span>
              )}
            </div>
            <div className="actions">
              <Button
                onClick={() =>
                  helpStep ? setHelpStep(helpStep - 1) : go("home")
                }
              >
                {tr("back")}
              </Button>
              <Button
                primary
                onClick={() =>
                  helpStep < 2 ? setHelpStep(helpStep + 1) : prepare("practice")
                }
              >
                {tr(helpStep < 2 ? "next" : "practice")}
              </Button>
              <Button onClick={() => go("home")}>{tr("skip")}</Button>
            </div>
          </section>
        )}
        {screen === "collection" && (
          <section className="panel collection-panel">
            <h1>{tr("collection")}</h1>
            <p>{tr("stickerTitle")}</p>
            {playerPicker()}
            <div className="profile-form">
              <label>
                {tr("nickname")}
                <input
                  value={profileName}
                  maxLength={16}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </label>
              <div
                className="avatar-picker"
                role="group"
                aria-label={tr("profile")}
              >
                {AVATARS.map((a, i) => (
                  <button
                    key={a}
                    aria-pressed={avatar === i}
                    onClick={() => setAvatar(i)}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <Button
                disabled={data.profiles.length >= 6}
                onClick={() => {
                  const p: Profile = {
                    id: uid(),
                    name: sanitizeName(
                      profileName.trim() ||
                        tr("playerN", data.profiles.length + 1),
                    ),
                    avatar,
                    stickers: [],
                    rounds: 0,
                    hits: 0,
                    modes: [],
                    best: {},
                  };
                  persist({
                    ...dataRef.current,
                    selected: p.id,
                    profiles: [...dataRef.current.profiles, p],
                  });
                  setProfileName("");
                }}
              >
                {tr("create")}
              </Button>
            </div>
            <div className="stickers">
              {STICKERS.map((id, i) => (
                <article
                  key={id}
                  className={
                    profile?.stickers.includes(id) ? "earned" : "locked"
                  }
                >
                  <span>{["✿", "❀", "♛", "◎", "✦", "☀", "★", "⚑"][i]}</span>
                  <strong>{tr(`sticker_${id}`)}</strong>
                  <small>{tr(`goal_${id}`)}</small>
                </article>
              ))}
            </div>
            {profile && (
              <>
                <p>
                  {AVATARS[profile.avatar]} {profile.name} · {tr("rounds")}:{" "}
                  {profile.rounds} · {tr("totalHits")}: {profile.hits}
                </p>
                <Button
                  onClick={() => {
                    if (confirm(tr("deleteConfirm")))
                      persist(deleteProfile(dataRef.current, profile.id));
                  }}
                >
                  {tr("delete")}
                </Button>
              </>
            )}
            <Button primary onClick={() => go("home")}>
              {tr("home")}
            </Button>
          </section>
        )}
        {screen === "records" && (
          <section className="panel records-panel">
            <h1>{tr("records")}</h1>
            {playerPicker()}
            <label>
              {tr("level")}
              <select
                value={settings.level}
                onChange={(e) =>
                  updateSettings({
                    level: Number(e.target.value) as Difficulty,
                  })
                }
              >
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l} · {tr(`pace${l}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {tr("input")}
              <select
                value={settings.input}
                onChange={(e) =>
                  updateSettings({ input: e.target.value as Settings["input"] })
                }
              >
                <option value="mouse">{tr("mouse")}</option>
                <option value="keyboard">{tr("keyboard")}</option>
              </select>
            </label>
            <div className="record-columns">
              {(["garden", "harvest", "classic"] as const).map((m) => {
                const key = category(
                  newRound(m, settings.level, settings.input, 0, "preview"),
                );
                const rows = data.boards[key] ?? [];
                return (
                  <section key={m}>
                    <h2>{tr(m)}</h2>
                    {profile && <p>★ {profile.best[key] ?? "—"}</p>}
                    {!rows.length && <p>{tr("empty")}</p>}
                    <ol>
                      {rows.map((e, i) => (
                        <li key={e.id}>
                          <span>
                            {rows.findIndex((row) => row.score === e.score) + 1}
                            . {e.name}
                          </span>
                          <strong>{e.score}</strong>
                          <span className="sr-only">{i + 1}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
            <details>
              <summary>{tr("legacy")}</summary>
              <ol>
                {oldScores.map((e, i) => (
                  <li key={`${i}-${e.date}`}>
                    {e.name} — {e.score}
                  </li>
                ))}
              </ol>
            </details>
            <Button primary onClick={() => go("home")}>
              {tr("home")}
            </Button>
          </section>
        )}
        {screen === "family" && (
          <section className="panel family-panel">
            <h1>{tr("together")}</h1>
            <p>{tr(handicap ? "handicapDesc" : "matchDesc")}</p>
            <label>
              {tr("players")}
              <select
                value={players.length}
                onChange={(e) =>
                  setPlayers(
                    Array.from(
                      { length: Number(e.target.value) },
                      (_, i) =>
                        players[i] ?? {
                          name: "",
                          avatar: i,
                          profile: null,
                          level: settings.level,
                        },
                    ),
                  )
                }
              >
                <option>2</option>
                <option>3</option>
                <option>4</option>
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={handicap}
                onChange={(e) => setHandicap(e.target.checked)}
              />
              {tr("handicap")}
            </label>
            {!handicap &&
              pace(players[0].level, (level) =>
                setPlayers(players.map((p) => ({ ...p, level }))),
              )}
            <div className="family-players">
              {players.map((p, i) => (
                <section key={i}>
                  <strong>
                    {AVATARS[p.avatar]} {tr("playerN", i + 1)}
                  </strong>
                  <label>
                    {tr("profile")}
                    <select
                      value={p.profile ?? ""}
                      onChange={(e) => {
                        const chosen = data.profiles.find(
                          (profile) => profile.id === e.target.value,
                        );
                        setPlayers(
                          players.map((item, index) =>
                            index === i
                              ? {
                                  ...item,
                                  profile: chosen?.id ?? null,
                                  name: chosen?.name ?? "",
                                  avatar: chosen?.avatar ?? i,
                                }
                              : item,
                          ),
                        );
                      }}
                    >
                      <option value="">{tr("guest")}</option>
                      {data.profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!p.profile && (
                    <>
                      <div
                        className="avatar-picker"
                        role="group"
                        aria-label={tr("profile")}
                      >
                        {AVATARS.map((symbol, avatarIndex) => (
                          <button
                            type="button"
                            key={symbol}
                            aria-pressed={p.avatar === avatarIndex}
                            onClick={() =>
                              setPlayers(
                                players.map((item, index) =>
                                  index === i
                                    ? { ...item, avatar: avatarIndex }
                                    : item,
                                ),
                              )
                            }
                          >
                            {symbol}
                          </button>
                        ))}
                      </div>
                      <label>
                        {tr("nickname")}
                        <input
                          maxLength={16}
                          value={p.name}
                          placeholder={tr("playerN", i + 1)}
                          onChange={(e) =>
                            setPlayers(
                              players.map((item, index) =>
                                index === i
                                  ? { ...item, name: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </label>
                    </>
                  )}
                  {handicap &&
                    pace(p.level, (level) =>
                      setPlayers(
                        players.map((item, index) =>
                          index === i ? { ...item, level } : item,
                        ),
                      ),
                    )}
                </section>
              ))}
            </div>
            <div className="actions">
              <Button onClick={() => go("home")}>{tr("home")}</Button>
              <Button
                primary
                action="match-start"
                onClick={() => {
                  setMatchBoth(
                    createMatch(
                      players.map((p, i) => ({
                        ...p,
                        name: sanitizeName(
                          p.name.trim() || tr("playerN", i + 1),
                        ),
                      })),
                      handicap,
                      seed(),
                    ),
                  );
                  go("handoff");
                }}
              >
                {tr("ready")}
              </Button>
            </div>
          </section>
        )}
        {screen === "handoff" && match && (
          <section className="panel handoff">
            <div className="eyebrow">
              {tr(match.handicap ? "handicap" : "sameRound")} · {tr("turn")}{" "}
              {match.turn + 1}/{match.players.length}
            </div>
            <h1>{tr("pass")}</h1>
            <div className="large-avatar">
              {AVATARS[match.players[match.turn].avatar]}
            </div>
            <h2>{match.players[match.turn].name}</h2>
            <p>{tr(`pace${match.players[match.turn].level}`)}</p>
            <div className="actions">
              <Button onClick={leaveHome}>{tr("finishMatch")}</Button>
              <Button primary action="turn-ready" onClick={launchTurn}>
                {tr("ready")}
              </Button>
            </div>
          </section>
        )}
        {screen === "familyResults" && match && (
          <section className="panel family-results">
            <div className="eyebrow">
              {tr(match.handicap ? "handicap" : "sameRound")}
            </div>
            <h1>{tr("results")}</h1>
            <h2>
              {tr(winners(match).length > 1 ? "joint" : "winner")}:{" "}
              {winners(match)
                .map(
                  (i) =>
                    `${AVATARS[match.players[i].avatar]} ${match.players[i].name}`,
                )
                .join(", ")}
            </h2>
            <ol>
              {match.players.map((p, i) => (
                <li key={i}>
                  {AVATARS[p.avatar]} {p.name}
                  <strong>{match.scores[i]}</strong>
                </li>
              ))}
            </ol>
            <div className="actions">
              <Button onClick={leaveHome}>{tr("home")}</Button>
              <Button
                primary
                action="rematch"
                onClick={() => {
                  setMatchBoth(rematch(match, seed()));
                  go("handoff");
                }}
              >
                {tr("rematch")}
              </Button>
            </div>
          </section>
        )}
      </main>
      <footer>❀ {tr("tagline")}</footer>
    </div>
  );
}
