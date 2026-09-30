import { scenes, sceneIndex } from './campaigns.ts';
import type { Game, Target, Event } from './core.ts';
import type { Snapshot } from './storage.ts';
import { keyLabel } from './i18n.ts';
export const W = 1080,
  H = 620;
const colors = ['#72f6ba', '#65d9ff', '#b696ff', '#ff97cb'];
export class Renderer {
  ctx: CanvasRenderingContext2D;
  effects: {
    kind: string;
    x: number;
    y: number;
    age: number;
    big: boolean;
    target?: Target;
    amount: number;
  }[] = [];
  clock = 0;
  pointer = { x: 540, y: 100 };
  muzzle = { x: 540, y: 506 };
  aim(x: number, y: number) {
    this.pointer = { x, y };
  }
  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    canvas.width = W * 2;
    canvas.height = H * 2;
    this.ctx.scale(2, 2);
  }
  events(events: Event[]) {
    for (const e of events)
      if (e.kind === 'hit' || e.kind === 'kill' || e.kind === 'character')
        this.effects.push({
          kind: e.kind === 'character' ? 'hit' : e.kind,
          x: e.x!,
          y: e.y!,
          age: 0,
          big: !!e.overcharge,
          target: e.target,
          amount: e.amount ?? 0,
        });
    this.effects = this.effects.slice(-40);
  }
  draw(g: Game | null, d: Snapshot, dt: number, outro = false) {
    const c = this.ctx,
      s = d.settings;
    this.clock += dt;
    const motion = s.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const calm = motion;
    const index = sceneIndex(g?.campaign ?? s.campaign, g?.config.level ?? 1),
      scene = scenes[index];
    const t = calm ? 0 : this.clock;
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, scene[2]);
    sky.addColorStop(0.7, scene[3]);
    sky.addColorStop(1, scene[3]);
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < 75; i++) {
      const x = (i * 137 + 53) % W,
        y = (i * 73 + 19) % 380;
      c.globalAlpha = 0.25 + (i % 5) * 0.12;
      c.fillStyle = '#d7efff';
      c.fillRect(x, y, i % 3 === 0 ? 2 : 1, 2);
    }
    c.globalAlpha = 1;
    c.fillStyle = '#bedbcf';
    c.beginPath();
    c.arc(870, 105, 30, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#0b1c2d';
    c.beginPath();
    c.arc(882, 97, 29, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.globalAlpha = 0.1;
    c.strokeStyle = '#64efba';
    c.lineWidth = 25;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(70, 140 + i * 18);
      c.bezierCurveTo(350, 20 + Math.sin(t * 0.2) * 15, 560, 240, 950, 80 + i * 10);
      c.stroke();
    }
    c.restore();
    c.fillStyle = '#1d3b4c';
    c.beginPath();
    c.ellipse(250, 75, 70, 13, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#305865';
    c.fillRect(229, 56, 42, 17);
    c.fillStyle = '#82a39f';
    for (let i = 0; i < 5; i++) c.fillRect(212 + i * 18, 76, 5, 2);
    this.sceneLayers(index, t);
    // Islands, harbour cranes, cathedral dome and illuminated city blocks.
    c.fillStyle = '#112936';
    c.beginPath();
    c.moveTo(0, 455);
    for (let x = 0; x <= W; x += 30) c.lineTo(x, 445 + Math.sin(x * 0.04) * 8);
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.fill();
    for (let i = 0; i < 26; i++) {
      const x = i * 44 - 10,
        h = 40 + ((i * 29 + index * 17) % (74 + index * 2)),
        y = 500 - h;
      c.fillStyle = i % 2 ? '#193743' : '#21454f';
      c.fillRect(x, y, 39, h);
      c.fillStyle = '#142d39';
      c.fillRect(x - 3, y, 45, 6);
      for (let row = 0; row < h / 15 - 1; row++)
        for (let col = 0; col < 3; col++) {
          c.fillStyle = (i + row + col) % 4 ? '#cda75d' : '#32626b';
          c.globalAlpha = 0.45;
          c.fillRect(x + 6 + col * 11, y + 13 + row * 15, 4, 6);
        }
      c.globalAlpha = 1;
    }
    c.fillStyle = '#b1c0b5';
    c.fillRect(710, 416, 130, 66);
    c.fillStyle = '#809f98';
    c.fillRect(730, 392, 90, 30);
    c.fillStyle = '#76aa9d';
    c.beginPath();
    c.arc(775, 392, 26, Math.PI, 0);
    c.fill();
    c.fillRect(772, 355, 6, 15);
    c.fillStyle = '#d9d6b5';
    for (let i = 0; i < 6; i++) c.fillRect(720 + i * 20, 432, 7, 40);
    c.fillStyle = '#173b42';
    c.fillRect(765, 450, 20, 30);
    c.fillRect(726, 485, 100, 5);
    c.strokeStyle = '#4d7278';
    c.lineWidth = 4;
    for (const x of [125, 950]) {
      c.beginPath();
      c.moveTo(x, 490);
      c.lineTo(x, 395);
      c.lineTo(x + 65, 395);
      c.lineTo(x + 15, 380);
      c.lineTo(x, 395);
      c.moveTo(x + 60, 395);
      c.lineTo(x + 60, 430);
      c.stroke();
    }
    c.fillStyle = '#0e303b';
    c.fillRect(0, 500, W, 120);
    c.fillStyle = '#1b5e64';
    for (let i = 0; i < 55; i++) {
      c.globalAlpha = 0.2;
      c.fillRect((i * 41 + t * 4) % W, 509 + (i % 7) * 13, 20 + (i % 9) * 3, 2);
    }
    c.globalAlpha = 1;
    c.save();
    c.strokeStyle = '#f4ce8a';
    c.setLineDash([12, 10]);
    c.globalAlpha = 0.6;
    c.beginPath();
    c.moveTo(0, 490);
    c.lineTo(W, 490);
    c.stroke();
    c.setLineDash([]);
    c.font = '14px monospace';
    c.fillStyle = '#f4ce8a';
    c.fillText(s.lang === 'en' ? 'CITY METAL STORES' : 'KAUPUNGIN METALLIVARASTOT', 20, 550);
    for (const bx of [180, 850]) {
      c.fillRect(bx, 505, 50, 30);
      c.fillStyle = '#2c4a56';
      c.fillRect(bx + 8, 512, 34, 6);
      c.fillStyle = '#f4ce8a';
    }
    c.restore();
    c.fillStyle = '#345459';
    c.fillRect(410, 568, 260, 52);
    c.fillStyle = '#718b82';
    c.fillRect(410, 568, 260, 6);
    const hit = [...this.effects].reverse().find((e) => e.kind === 'hit');
    const aim = g?.config.track === 'keyboard' ? (hit ?? { x: 540, y: 0 }) : this.pointer;
    this.cannon(
      d,
      540,
      570 + (calm ? 0 : this.effects.some((e) => e.kind === 'hit' && e.age < 0.1) ? 3 : 0),
      Math.atan2(aim.y - 545, aim.x - 540) + Math.PI / 2,
    );
    if (outro && g)
      this.ship(
        {
          kind: 'boss',
          x: calm ? 750 : Math.min(1250, 540 + this.clock * 95),
          y: calm ? 160 : 220 - this.clock * 25,
          pip: 9,
          steps: Array(10).fill({ kind: 'key', key: 'f' }),
          radius: 30,
          phaseIndex: 2,
        } as Target,
        index + 1,
        calm,
      );
    else if (g) for (const ship of g.targets) this.ship(ship, index + 1, calm);
    else {
      this.ship(
        {
          kind: 'boss',
          x: 560,
          y: 220,
          pip: 0,
          steps: [{ kind: 'key', key: 'f' }],
          radius: 30,
        } as Target,
        1,
        true,
      );
    }
    const beamColor = colors[d.equipped.color];
    if (!g) {
      c.save();
      c.globalAlpha = 0.5;
      c.strokeStyle = beamColor;
      c.lineWidth = d.equipped.shape === 1 ? 7 : 3;
      for (const offset of d.equipped.shape === 2 ? [-5, 5] : [0]) {
        c.beginPath();
        c.moveTo(540 + offset, 500);
        c.lineTo(554 + offset, 280);
        c.stroke();
      }
      c.restore();
    }
    let particles = 0;
    const cap = calm ? 40 : 240;
    for (const e of this.effects) {
      e.age += dt;
      if (e.kind === 'hit' && e.age < 0.15) {
        c.save();
        if (d.equipped.color === 3) {
          const rainbow = c.createLinearGradient(540, 531, e.x, e.y);
          rainbow.addColorStop(0, '#ff97cb');
          rainbow.addColorStop(0.5, '#f5d791');
          rainbow.addColorStop(1, '#72f6ba');
          c.strokeStyle = rainbow;
        } else c.strokeStyle = beamColor;
        c.lineWidth =
          d.equipped.shape === 1
            ? 7
            : d.equipped.shape === 3 && !calm
              ? 3 + Math.sin(e.age * 40) * 3
              : 3;
        if (!calm) {
          c.shadowColor = beamColor;
          c.shadowBlur = 24;
        }
        c.globalAlpha = 1 - e.age / 0.15;
        for (const offset of d.equipped.shape === 2 ? [-5, 5] : [0]) {
          c.beginPath();
          c.moveTo(this.muzzle.x + offset, this.muzzle.y);
          c.lineTo(e.x + offset, e.y);
          c.stroke();
        }
        if (e.big) {
          c.lineWidth = 10;
          c.globalAlpha *= 0.35;
          c.beginPath();
          c.moveTo(this.muzzle.x, this.muzzle.y);
          c.lineTo(e.x, e.y);
          c.stroke();
        }
        c.restore();
      }
      if (e.kind === 'kill' && e.age < 1.4 && e.target) {
        c.save();
        if (e.target.id % 3 === 0 || e.target.kind === 'mini') {
          c.globalAlpha = Math.max(0, 1 - e.age / 1.4);
          const wreck = {
            ...e.target,
            x: e.x + (calm ? 0 : e.age * 180),
            y: e.y + (calm ? 0 : e.age * 70),
          };
          this.ship(wreck, index + 1, true);
          c.fillStyle = '#8997a0';
          for (let i = 0; i < (calm ? 2 : 8); i++)
            c.fillRect(wreck.x - i * 12, wreck.y - 15 - i * 6, 8 + i, 8 + i);
        } else if (e.target.kind === 'boss') {
          c.strokeStyle = beamColor;
          c.lineWidth = 5;
          c.globalAlpha = Math.max(0, 1 - e.age / 1.4);
          c.beginPath();
          c.ellipse(
            e.x,
            e.y,
            calm ? 55 : 35 + e.age * 130,
            calm ? 35 : 20 + e.age * 90,
            ((index % 4) * Math.PI) / 4,
            0,
            Math.PI * 2,
          );
          c.stroke();
        }
        c.font = 'bold 20px monospace';
        c.fillStyle = '#ffdf96';
        c.textAlign = 'center';
        c.globalAlpha = Math.max(0, 1 - e.age / 1.4);
        c.fillText(`+${e.amount} ◆`, e.x, e.y - 70 - (calm ? 0 : e.age * 25));
        c.restore();
      }
      if (e.kind === 'kill' && e.age < 0.6) {
        const n = Math.min(cap - particles, calm ? 4 : 24 + d.equipped.impact * 6);
        particles += n;
        c.fillStyle = beamColor;
        for (let j = 0; j < n; j++) {
          const a = (j / n) * Math.PI * 2,
            r = calm ? 25 : e.age * (70 + d.equipped.impact * 25);
          c.globalAlpha = 1 - e.age / 0.6;
          c.fillRect(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 3, 3);
          if (!calm && d.equipped.impact >= 1) {
            c.strokeStyle = beamColor;
            c.lineWidth = d.equipped.impact >= 2 ? 2 : 1;
            c.beginPath();
            c.moveTo(e.x + Math.cos(a) * r * 0.7, e.y + Math.sin(a) * r * 0.7);
            c.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
            c.stroke();
          }
        }
        c.globalAlpha = 1;
        if (!calm) {
          c.fillStyle = '#f4e0b6';
          c.fillRect(e.x - 7, e.y - e.age * 140, 14, 10);
          c.fillStyle = '#6ee7b4';
          c.fillRect(e.x - 4, e.y - e.age * 140 + 2, 8, 4);
        }
      }
    }
    this.effects = this.effects.filter((e) => e.age < 1.4);
    // Draw actionable labels last, above decoration.
    if (g) for (const ship of g.targets) this.prompt(ship, g);
  }
  sceneLayers(index: number, t: number) {
    const c = this.ctx,
      motif = scenes[index][4],
      threat = index % 12;
    c.save();
    c.globalAlpha = 0.25;
    c.strokeStyle = scenes[index][3];
    c.fillStyle = '#bfdadf';
    c.lineWidth = 3;
    if (motif === 'ice')
      for (let i = 0; i < 12; i++) {
        c.beginPath();
        c.moveTo(i * 100, 500);
        c.lineTo(i * 100 + 35, 370 + (i % 3) * 25);
        c.lineTo(i * 100 + 80, 500);
        c.fill();
      }
    if (motif === 'neon')
      for (let i = 0; i < 8; i++) {
        c.strokeStyle = i % 2 ? '#ff91d7' : '#63e4ff';
        c.strokeRect(80 + i * 130, 260 + (i % 3) * 25, 60, 140);
      }
    if (motif === 'fog')
      for (let i = 0; i < 4; i++) {
        c.fillStyle = '#afcfca';
        c.globalAlpha = 0.06;
        c.fillRect(0, 280 + i * 40, W, 25);
      }
    if (motif === 'rain')
      for (let i = 0; i < 65; i++) {
        const x = (i * 53 + t * 30) % W,
          y = (i * 73 + t * 120) % 450;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 8, y + 20);
        c.stroke();
      }
    if (motif === 'nebula') {
      for (let i = 0; i < 5; i++) {
        c.strokeStyle = i % 2 ? '#c99bea' : '#779ade';
        c.beginPath();
        c.ellipse(540, 170, 80 + i * 70, 20 + i * 25, -0.3, 0, Math.PI * 2);
        c.stroke();
      }
    }
    if (motif === 'gears')
      for (let i = 0; i < 4; i++) {
        c.save();
        c.translate(150 + i * 250, 330);
        c.rotate(t * 0.1 * (i % 2 ? 1 : -1));
        for (let j = 0; j < 8; j++) {
          c.rotate(Math.PI / 4);
          c.fillRect(35, -7, 15, 14);
        }
        c.restore();
      }
    if (motif === 'comets')
      for (let i = 0; i < 8; i++) {
        const x = (i * 179 + t * 15) % W,
          y = 60 + i * 33;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 80, y - 35);
        c.stroke();
      }
    if (motif === 'industry' || motif === 'cranes')
      for (let i = 0; i < 6; i++) {
        const x = 70 + i * 180;
        c.fillRect(x, 300 + (i % 3) * 30, 15, 180);
        c.fillRect(x, 300 + (i % 3) * 30, 100, 8);
        if (motif === 'industry') {
          c.fillStyle = '#e8a777';
          c.fillRect(x - 10, 470, 60, 15);
        }
      }
    if (motif === 'crown') {
      c.strokeStyle = '#f1c976';
      c.beginPath();
      c.moveTo(150, 240);
      c.lineTo(200, 110);
      c.lineTo(420, 180);
      c.lineTo(540, 55);
      c.lineTo(660, 180);
      c.lineTo(880, 110);
      c.lineTo(930, 240);
      c.stroke();
    }
    c.globalAlpha = 0.35;
    c.fillStyle = '#829eac';
    for (let i = 0; i < threat + (index >= 12 ? 3 : 0); i++) {
      const x = (100 + i * 113 + t * (i % 2 ? 3 : -3) + W) % W;
      c.beginPath();
      c.ellipse(x, 60 + (i % 4) * 35, 18 + (i % 3) * 6, 5, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  cannon(d: Snapshot, x: number, y: number, angle = 0) {
    this.muzzle = { x: x + Math.sin(angle) * 50, y: y - 25 - Math.cos(angle) * 50 };
    const c = this.ctx,
      color = colors[d.equipped.color],
      skin = d.equipped.skin;
    c.save();
    c.translate(x, y);
    c.fillStyle = '#0d222c';
    c.fillRect(-55, -12, 110, 40);
    c.fillStyle = '#587f7d';
    c.fillRect(-46, -22, 92, 35);
    c.fillStyle = '#9cbbac';
    c.fillRect(-35, -30, 70, 16);
    c.save();
    c.translate(0, -25);
    c.rotate(angle);
    c.translate(0, 25);
    c.fillStyle = '#284852';
    c.fillRect(-14, -62, 28, 45);
    c.fillStyle = color;
    c.fillRect(-6, -58, 12, 32);
    if (skin === 1) {
      c.fillStyle = '#7b9c9c';
      c.fillRect(-22, -77, 10, 55);
      c.fillRect(12, -77, 10, 55);
      c.fillStyle = color;
      c.fillRect(-22, -77, 10, 4);
      c.fillRect(12, -77, 10, 4);
    }
    if (skin === 2) {
      c.fillStyle = '#6b8f8c';
      c.fillRect(-29, -67, 58, 20);
      c.fillStyle = color;
      c.fillRect(-24, -63, 48, 6);
    }
    const appearance = Number(d.appearance.split('-')[1]) || 0;
    if (appearance) {
      c.strokeStyle = color;
      c.lineWidth = 3;
      if (appearance % 3 === 0) {
        c.beginPath();
        c.ellipse(0, -46, 35 + appearance, 20, 0, 0, Math.PI * 2);
        c.stroke();
      } else if (appearance % 3 === 1) {
        c.fillStyle = color;
        c.fillRect(-35 - appearance, -60, 10, 40);
        c.fillRect(25 + appearance, -60, 10, 40);
      } else {
        c.fillStyle = color;
        for (let i = 0; i < appearance; i++) c.fillRect(-30 + i * 5, -80 - (i % 2) * 8, 4, 15);
      }
    }
    c.restore();
    c.fillStyle = '#b7d5ba';
    c.fillRect(-49, 16, 98, 3);
    c.fillStyle = '#c4e1ce';
    c.fillRect(-38, 24, 13, 5);
    c.fillRect(25, 24, 13, 5);
    c.restore();
  }
  ship(ship: Target, level: number, motion: boolean) {
    const c = this.ctx,
      { x, y, kind } = ship;
    const boss = kind === 'boss',
      mini = kind === 'mini';
    const scale = boss ? 1.8 : mini ? 1.35 : 1;
    const palette = [
      '#a3b3b5',
      '#c4826c',
      '#afc69c',
      '#cba2d9',
      '#8cc2b3',
      '#c3b08a',
      '#adaed6',
      '#8aadc8',
      '#beab79',
      '#be95b9',
      '#92b8ad',
      '#d7b765',
    ][(level - 1) % 12];
    c.save();
    const lastHit = [...this.effects]
      .reverse()
      .find((e) => e.kind === 'hit' && e.target?.id === ship.id && e.age < 0.12);
    c.translate(x + (motion ? 0 : lastHit ? Math.sin(lastHit.age * 100) * 4 : 0), y);
    c.scale(scale, scale);
    if (!motion) c.translate(0, Math.sin(this.clock * 2 + level) * 2);
    c.fillStyle = '#0b1826';
    c.fillRect(-49, -19, 98, 40);
    c.fillStyle = palette;
    c.fillRect(-40, -23, 80, 12);
    c.fillRect(-54, -8, 108, 20);
    c.fillStyle = '#506777';
    c.fillRect(-42, 12, 84, 8);
    c.fillStyle = '#ddba67';
    for (const sx of [-31, 0, 31]) c.fillRect(sx - 4, 15, 8, 4);
    c.fillStyle = '#253d4a';
    c.fillRect(-23, -38, 46, 18);
    c.fillStyle = '#92d3c1';
    c.fillRect(-19, -33, 38, 13);
    c.fillStyle = '#f0efc5';
    c.fillRect(-11, -30, 6, 6);
    c.fillRect(5, -30, 6, 6);
    c.fillStyle = '#152632';
    c.fillRect(-8, -28, 2, 3);
    c.fillRect(8, -28, 2, 3);
    if (boss) {
      c.fillStyle = palette;
      switch (((level - 1) % 12) + 1) {
        case 1:
          c.fillRect(-7, -46, 14, 8);
          break;
        case 2:
          c.fillRect(-42, 20, 84, 10);
          c.fillStyle = '#e7d1ad';
          for (let i = 0; i < 6; i++) c.fillRect(-35 + i * 13, 24, 6, 9);
          break;
        case 3:
          c.fillRect(-70, -10, 16, 55);
          c.fillRect(-70, 35, 30, 8);
          break;
        case 4:
          for (let i = 0; i < 7; i++) {
            c.fillStyle = i % 2 ? '#72d8cb' : '#cf8cc7';
            c.fillRect(-42 + i * 13, -6, 9, 9);
          }
          break;
        case 5:
          c.fillRect(-70, -35, 16, 50);
          c.fillRect(54, -35, 16, 50);
          break;
        case 6:
          c.beginPath();
          c.moveTo(-19, 20);
          c.lineTo(0, 54);
          c.lineTo(19, 20);
          c.fill();
          break;
        case 7:
        case 12:
          for (let i = 0; i < 3; i++) {
            c.fillRect(-27 + i * 22, -51, 11, 13);
          }
          c.fillRect(-27, -41, 55, 7);
          if (level === 12) {
            c.fillRect(64, -45, 8, 80);
            c.fillRect(32, -45, 40, 7);
          }
          break;
        case 8:
          c.strokeStyle = palette;
          c.lineWidth = 5;
          c.beginPath();
          c.ellipse(0, 0, 73, 34, 0, 0, Math.PI * 2);
          c.stroke();
          break;
        case 9:
          for (let i = 0; i < 8; i++) {
            c.save();
            c.rotate((i * Math.PI) / 4);
            c.fillRect(50, -7, 15, 14);
            c.restore();
          }
          break;
        case 10:
          c.beginPath();
          c.moveTo(-50, 0);
          c.lineTo(-80, -40);
          c.lineTo(-55, 15);
          c.moveTo(50, 0);
          c.lineTo(80, -40);
          c.lineTo(55, 15);
          c.fill();
          break;
        case 11:
          c.fillRect(-66, -12, 132, 10);
          c.fillRect(-50, -50, 4, 40);
          c.fillRect(46, -50, 4, 40);
          break;
      }
    }
    if (level > 12) {
      c.strokeStyle = ['#90d9ff', '#ffc47e', '#dba3ff'][level % 3];
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(-60, -20);
      c.lineTo(-75, -35 - (level % 5) * 4);
      c.lineTo(-55, 25);
      c.moveTo(60, -20);
      c.lineTo(75, -35 - (level % 5) * 4);
      c.lineTo(55, 25);
      c.stroke();
      c.fillStyle = palette;
      for (let i = 0; i < (level % 4) + 1; i++) c.fillRect(-25 + i * 15, -52, 8, 10);
    }
    if (ship.pip > 0 && ship.steps.length > 1) {
      const damage = ship.pip / ship.steps.length;
      c.strokeStyle = '#18202d';
      c.lineWidth = 3;
      for (let i = 0; i < Math.ceil(damage * 5); i++) {
        const dx = -35 + i * 16;
        c.beginPath();
        c.moveTo(dx, -15);
        c.lineTo(dx + 7, -5);
        c.lineTo(dx - 2, 4);
        c.lineTo(dx + 8, 14);
        c.stroke();
      }
      if (damage >= 0.6) {
        c.fillStyle = '#52636d';
        c.globalAlpha = 0.7;
        for (let i = 0; i < 3; i++) c.fillRect(28 + i * 5, -30 - i * 12, 10, 10);
        c.globalAlpha = 1;
      }
    }
    if (boss && ship.phaseIndex > 0) {
      c.strokeStyle = ship.phaseIndex === 1 ? '#ffdf96' : '#ffa1c9';
      c.lineWidth = 3;
      c.strokeRect(-57, -13, 114, 29);
    }
    if (kind === 'armor') {
      c.strokeStyle = '#d4ba7b';
      c.lineWidth = 5;
      c.strokeRect(-50, -15, 100, 35);
    }
    c.restore();
  }
  prompt(ship: Target, g: Game) {
    const c = this.ctx,
      p = ship.steps[ship.pip];
    if (!p) return;
    if (p.kind === 'text') {
      c.save();
      const width = p.text.includes(' ')
        ? Math.min(720, p.text.length * 19)
        : Math.max(160, p.text.length * 25);
      const left = Math.max(12, Math.min(W - width - 12, ship.x - width / 2));
      const top = ship.y + 60,
        lineLength = Math.floor(width / 19);
      const lines = Array.from({ length: Math.ceil(p.text.length / lineLength) }, (_, i) =>
        p.text.slice(i * lineLength, (i + 1) * lineLength),
      );
      c.fillStyle = '#071a29ed';
      c.fillRect(left - 8, top - 22, width + 16, lines.length * 30 + 20);
      c.font = 'bold 25px ui-monospace,monospace';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      let index = 0;
      for (let row = 0; row < lines.length; row++)
        for (let col = 0; col < lines[row].length; col++) {
          c.fillStyle =
            index < ship.textBuffer.length
              ? '#78f6bc'
              : index === ship.textBuffer.length
                ? '#ffdf96'
                : '#e3eef6';
          c.fillText(
            lines[row][col],
            left + (width - lines[row].length * 19) / 2 + col * 19,
            top + row * 30,
          );
          if (index === ship.textBuffer.length) {
            c.strokeStyle = '#ffdf96';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(left + (width - lines[row].length * 19) / 2 + col * 19, top + 14 + row * 30);
            c.lineTo(
              left + (width - lines[row].length * 19) / 2 + col * 19 + 16,
              top + 14 + row * 30,
            );
            c.stroke();
          }
          index++;
        }
      c.restore();
      return;
    }
    const pair = p.kind === 'pair';
    const label =
      p.kind === 'mouse'
        ? (['● L', '● M', 'R ●', '● 4'][p.button] ?? '●')
        : p.kind === 'pair'
          ? `L ⇧ → ${keyLabel(p.key)}`
          : keyLabel(p.key);
    c.save();
    c.translate(ship.x, ship.y);
    c.fillStyle = '#091c2b';
    c.strokeStyle = this.clock < 0 ? '#fff' : pair && ship.partial ? '#ffc978' : '#a8f7d0';
    c.lineWidth = 2;
    c.beginPath();
    if (p.kind === 'mouse') c.arc(0, 0, ship.radius, 0, Math.PI * 2);
    else c.roundRect(pair ? -80 : -30, -25, pair ? 160 : 60, 50, 8);
    c.fill();
    c.stroke();
    c.fillStyle = '#f1fbef';
    c.font = `700 ${pair ? 20 : 27}px ui-monospace,monospace`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, 0, 1);
    if (p.kind === 'mouse') {
      c.strokeStyle = '#e5f4e7';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-6, -11);
      c.lineTo(6, -11);
      c.stroke();
    }
    if (ship.steps.length > 1) {
      c.font = '12px monospace';
      c.fillStyle = '#f6db93';
      c.fillText(`${ship.pip + 1} / ${ship.steps.length}`, 0, ship.radius + 17);
    }
    c.restore();
  }
}
