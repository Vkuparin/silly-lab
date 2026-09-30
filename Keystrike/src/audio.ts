import type { Game } from './core.ts';
import { levelMelodies, bossMelodies, sceneIndex } from './campaigns.ts';
import type { Settings } from './storage.ts';
export class Audio {
  context: AudioContext | null = null;
  voices = 0;
  nextNote = 0;
  note = 0;
  lastMiss = -10;
  theme = '';
  duckUntil = 0;
  musicNodes = new Set<OscillatorNode>();
  unlock() {
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
    } catch {}
  }
  suspend() {
    this.nextNote = 0;
    try {
      void this.context?.suspend();
    } catch {}
  }
  tone(
    freq: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'square',
    end?: number,
    music = false,
  ) {
    const c = this.context;
    if (!c || c.state !== 'running' || this.voices >= 12 || volume <= 0) return;
    try {
      const o = c.createOscillator(),
        g = c.createGain();
      if (music) this.musicNodes.add(o);
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime);
      if (end) o.frequency.exponentialRampToValueAtTime(end, c.currentTime + duration);
      g.gain.setValueAtTime(Math.min(0.13, volume * 0.13), c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
      o.connect(g);
      g.connect(c.destination);
      this.voices++;
      o.onended = () => {
        this.musicNodes.delete(o);
        this.voices--;
        o.disconnect();
        g.disconnect();
      };
      o.start();
      o.stop(c.currentTime + duration);
    } catch {}
  }
  effect(kind: string, s: Settings, pack = 0, commander?: number) {
    if (s.mute) return;
    const v = s.sfx;
    if (kind === 'hit' && commander) {
      this.duckUntil = (this.context?.currentTime ?? 0) + 0.2;
      this.tone(
        170 + commander * 19,
        0.12 + (commander % 4) * 0.03,
        v * 0.6,
        ['triangle', 'sawtooth', 'sine'][commander % 3] as OscillatorType,
        70 + commander * 7,
      );
    }
    if (kind === 'hit' || kind === 'character')
      this.tone(
        [740, 980, 420, 180][pack],
        0.13,
        v,
        ['square', 'sawtooth', 'sine', 'triangle'][pack] as OscillatorType,
        100,
      );
    if (kind === 'kill') {
      this.tone(220, 0.28, v, 'triangle', 65);
      this.tone(880, 0.1, v * 0.5, 'sine');
    }
    if (kind === 'impact') this.tone(100, 0.35, v, 'sawtooth', 35);
    if (kind === 'miss' && this.context && this.context.currentTime - this.lastMiss > 0.12) {
      this.lastMiss = this.context.currentTime;
      this.tone(110, 0.08, v * 0.3, 'sine');
    }
    if (kind === 'milestone' || kind === 'done') {
      [523, 659, 784].forEach((f) => this.tone(f, 0.5, v * 0.35, 'triangle'));
    }
  }
  update(s: Settings, game: Game, boss: boolean) {
    const c = this.context;
    if (!c || c.state !== 'running' || s.mute || s.music === 0) return;
    const index = sceneIndex(game.campaign, game.config.level),
      theme = `${index}:${boss}`;
    if (theme !== this.theme) {
      for (const node of this.musicNodes) {
        try {
          node.stop(c.currentTime + 0.03);
        } catch {}
      }
      this.theme = theme;
      this.note = 0;
      this.nextNote = c.currentTime + 0.04;
    }
    if (c.currentTime < this.nextNote) return;
    const beat = (boss ? 0.2 : 0.27) - (index % 12) * 0.002;
    this.nextNote = c.currentTime + beat;
    const melody = (boss ? bossMelodies : levelMelodies)[index],
      root = boss ? 196 : 261.63;
    const hz = (n: number) => root * Math.pow(2, n / 12);
    const duck = c.currentTime < this.duckUntil ? 0.4 : 1;
    this.tone(
      hz(melody[this.note % 16]),
      beat * 0.8,
      s.music * 0.3 * duck,
      index % 3 === 0 ? 'triangle' : index % 3 === 1 ? 'sine' : 'square',
      undefined,
      true,
    );
    if (this.note % 2 === 0)
      this.tone(
        hz(melody[Math.floor(this.note / 4) % 16] - 12),
        beat * 0.9,
        s.music * 0.15 * duck,
        'sine',
        undefined,
        true,
      );
    this.note = (this.note + 1) % 64;
  }
}
