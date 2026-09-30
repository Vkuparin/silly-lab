export type Track = 'keyboard' | 'mouse' | 'mixed';
export type Rules = 'standard' | 'relaxed' | 'pro';
export type Layout = 'fi' | 'us';
export type Lang = 'fi' | 'en';
export const VERSION = '3.2.3'; // gameplay.scoring.content; change when comparable rules change
export const roster = [
  ['The Wobbler', 'Vaappuja'],
  ['Rusty Rex', 'Ruoste-Rex'],
  ['Zorp the Collector', 'Keräilijä Zorp'],
  ['Disco Dax', 'Disko-Dax'],
  ['Magnet Molli', 'Magneetti-Molli'],
  ['Drill Duke', 'Poraherttua'],
  ['Bolt Baron', 'Pulttiparoni'],
  ['Nebula Nelli', 'Tähtisumu-Nelli'],
  ['Gear Gert', 'Ratas-Gert'],
  ['Comet Kiki', 'Komeetta-Kiki'],
  ['Admiral Clank', 'Amiraali Kolina'],
  ['Scrap King', 'Romukuningas'],
];
// v1.1: 50% more wave time and encounter inputs, keeping spawn/travel pressure.
export const pacing = [
  [20, 5, 10, 1, 2, 4],
  [24, 4, 10, 2, 2, 5],
  [24, 3.5, 9, 2, 2, 6],
  [28, 3, 9, 3, 3, 7],
  [28, 2.6, 8, 3, 3, 8],
  [30, 2.4, 8, 3, 3, 10],
  [30, 2.2, 8, 4, 4, 11],
  [32, 2, 7.5, 4, 4, 12],
  [32, 1.8, 7.5, 4, 4, 13],
  [34, 1.6, 7, 5, 4, 15],
  [34, 1.4, 7, 5, 5, 16],
  [36, 1.2, 6.5, 6, 5, 20],
].map(([wave, interval, travel, cap, mini, boss]) => [
  wave * 1.5,
  interval,
  travel,
  cap,
  Math.ceil(mini * 1.5),
  Math.ceil(boss * 1.5),
]);
export function additions(track: Track, level: number, layout: Layout): string[] {
  const fi = layout === 'fi';
  const keyboard = [
    ['f', 'j'],
    ['d', 'k'],
    ['s', 'l'],
    ['a', fi ? 'ö' : ';'],
    ['g', 'h'],
    ['Space', fi ? 'ä' : "'"],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i'],
    ['o', 'p', ...(fi ? ['å'] : [])],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
    [fi ? '-' : '/'],
    [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '0',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'ShiftLeft',
    ],
    [],
  ];
  const mixed = [
    ['a', 'd'],
    ['w', 's'],
    ['q', 'e'],
    [],
    ['f', 'Space'],
    ['z', 'x', 'c'],
    [],
    [],
    [],
    [],
    ['ShiftLeft'],
    [],
  ];
  return track === 'mouse' ? [] : (track === 'mixed' ? mixed : keyboard)[level - 1];
}
export function learned(track: Track, level: number, layout: Layout): string[] {
  return Array.from({ length: level }, (_, i) => additions(track, i + 1, layout)).flat();
}
export const catalog = [
  {
    id: 'color',
    en: 'Beam color',
    fi: 'Säteen väri',
    names: [
      ['Mint', 'Minttu'],
      ['Cyan', 'Syaani'],
      ['Violet', 'Violetti'],
      ['Rainbow', 'Sateenkaari'],
    ],
    prices: [0, 8, 23, 53],
  },
  {
    id: 'shape',
    en: 'Beam shape',
    fi: 'Säteen muoto',
    names: [
      ['Single', 'Yksi'],
      ['Wide core', 'Leveä'],
      ['Twin', 'Kaksi'],
      ['Pulse', 'Pulssi'],
    ],
    prices: [0, 15, 38, 75],
  },
  {
    id: 'impact',
    en: 'Impact',
    fi: 'Osumatehoste',
    names: [
      ['Sparks', 'Kipinät'],
      ['Glow trail', 'Hohtovana'],
      ['Starburst', 'Tähtipurkaus'],
      ['Spectacle', 'Ilotulitus'],
    ],
    prices: [0, 15, 45, 90],
  },
  {
    id: 'sound',
    en: 'Sound',
    fi: 'Ääni',
    names: [
      ['Blip', 'Piip'],
      ['Zap', 'Sähkö'],
      ['Hum', 'Humina'],
      ['Deep boom', 'Jyrähdys'],
    ],
    prices: [0, 15, 38, 68],
  },
  {
    id: 'skin',
    en: 'Cannon skin',
    fi: 'Tykin ulkoasu',
    names: [
      ['Coastal cannon', 'Rannikkotykki'],
      ['Railgun', 'Raidetykki'],
      ['Heavy cannon', 'Raskas tykki'],
    ],
    prices: [0, 38, 90],
  },
] as const;
export type Category = (typeof catalog)[number]['id'];
export function validateContent() {
  if (roster.length !== 12 || pacing.length !== 12)
    throw Error('Campaign requires twelve commanders');
  for (const track of ['keyboard', 'mouse', 'mixed'] as Track[])
    for (const layout of ['fi', 'us'] as Layout[])
      for (let l = 1; l <= 12; l++) {
        const keys = learned(track, l, layout);
        if (new Set(keys).size !== keys.length) throw Error('Duplicate curriculum key');
        if (
          track === 'mixed' &&
          l < 11 &&
          keys.some((k) => !['a', 'd', 'w', 's', 'q', 'e', 'f', 'Space', 'z', 'x', 'c'].includes(k))
        )
          throw Error('Mixed curriculum');
        if (pacing[l - 1][5] > 30 || pacing[l - 1][3] > 6) throw Error('Entity budget');
      }
  for (const c of catalog)
    if (
      c.names.length !== c.prices.length ||
      c.prices.some((p, i) => i > 0 && p <= c.prices[i - 1])
    )
      throw Error('Invalid catalog');
}
