import type { Settings } from './storage.ts';
export class Audio {
  context: AudioContext | null = null;
  voices = 0;
  nextNote = 0;
  note = 0;
  lastMiss = -10;
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
  ) {
    const c = this.context;
    if (!c || c.state !== 'running' || this.voices >= 12 || volume <= 0) return;
    try {
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime);
      if (end) o.frequency.exponentialRampToValueAtTime(end, c.currentTime + duration);
      g.gain.setValueAtTime(Math.min(0.13, volume * 0.13), c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
      o.connect(g);
      g.connect(c.destination);
      this.voices++;
      o.onended = () => {
        this.voices--;
        o.disconnect();
        g.disconnect();
      };
      o.start();
      o.stop(c.currentTime + duration);
    } catch {}
  }
  effect(kind: string, s: Settings, pack = 0) {
    if (s.mute) return;
    const v = s.sfx;
    if (kind === 'hit')
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
  update(s: Settings, boss: boolean) {
    const c = this.context;
    if (!c || c.state !== 'running' || s.mute || s.music === 0) return;
    if (c.currentTime < this.nextNote) return;
    this.nextNote = c.currentTime + 0.25;
    const melody = boss
      ? [
          220, 330, 261.63, 392, 220, 440, 311.13, 392, 220, 330, 293.66, 440, 261.63, 392, 330,
          493.88,
        ]
      : [
          261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 392, 246.94, 293.66, 392, 493.88, 392,
          293.66, 261.63, 329.63,
        ];
    this.tone(melody[this.note % 16], 0.19, s.music * 0.3, 'triangle');
    if (this.note % 2 === 0)
      this.tone(melody[Math.floor(this.note / 16) % 16] / 2, 0.23, s.music * 0.18, 'sine');
    this.note = (this.note + 1) % 128;
  }
}
