import type { Lang, Layout, Track } from './content.ts';

export type Campaign = 'defense' | 'return';
export type MouseProfile = 'primary' | 'two-buttons' | 'extended';
export const campaignNames = {
  defense: ['The Shiny Metal Siege', 'Kiiltävän metallin piiritys'],
  return: ['The Scrap King Returns', 'Romukuningas palaa'],
} as const;
export const returnRoster = [
  ['Spark Sneak', 'Kipinähiipijä'],
  ['Captain Coil', 'Kapteeni Kela'],
  ['Tin Twins', 'Tina-kaksoset'],
  ['Storm Sprocket', 'Myrskyratas'],
  ['Crystal Claw', 'Kristallikoura'],
  ['Furnace Finn', 'Ahjo-Aapo'],
  ['Echo Empress', 'Kaikukeisarinna'],
  ['Orbit Otto', 'Kiertorata-Otto'],
  ['Chrome Kraken', 'Kromikalmari'],
  ['Void Vicky', 'Tyhjiö-Viivi'],
  ['Royal Recycler', 'Kuninkaallinen kierrättäjä'],
  ['Scrap King Returns', 'Romukuningas palaa'],
] as const;
// Scene identities, not a random palette swap. Each scene has its own geometry,
// weather, fleet density and melodic phrase; the renderer shares layer machinery.
export const scenes = [
  ['Harbour Lights', 'Sataman valot', '#071323', '#123c44', 'aurora'],
  ['Copper Docks', 'Kuparilaiturit', '#181b30', '#67483a', 'cranes'],
  ['Blue Ice', 'Sininen jää', '#081a35', '#315774', 'ice'],
  ['Neon Market', 'Neontori', '#241534', '#653958', 'neon'],
  ['Magnetic Fog', 'Magneettisumu', '#122a2d', '#396054', 'fog'],
  ['Drillworks', 'Poratehdas', '#29182a', '#71472d', 'industry'],
  ['Stormfront', 'Myrskyrintama', '#111b38', '#383f65', 'rain'],
  ['Nebula Gate', 'Tähtisumuportti', '#201333', '#564274', 'nebula'],
  ['Clockwork Bay', 'Ratasten lahti', '#211e29', '#62583c', 'gears'],
  ['Comet Watch', 'Komeettavartio', '#27112d', '#654257', 'comets'],
  ['Blockade', 'Saarto', '#101629', '#354755', 'fleet'],
  ['The Crown Above', 'Kruunu taivaalla', '#220f25', '#6a3e40', 'crown'],
  ['Afterglow', 'Jälkihehku', '#12273b', '#4e6c63', 'aurora'],
  ['Coil Towers', 'Kelatornit', '#1c2443', '#536375', 'cranes'],
  ['Frozen Signal', 'Jäinen signaali', '#14243e', '#476c88', 'ice'],
  ['Electric Square', 'Sähköaukio', '#361444', '#734a8b', 'neon'],
  ['Crystal Mist', 'Kristallisumu', '#123842', '#467e78', 'fog'],
  ['Ember Foundry', 'Hiillosvalimo', '#351b28', '#855139', 'industry'],
  ['Echo Tempest', 'Kaikumyrsky', '#182044', '#4a5380', 'rain'],
  ['Orbital Garden', 'Kiertoradan puutarha', '#241744', '#655b8a', 'nebula'],
  ['Chrome Depths', 'Kromisyvyydet', '#1b2938', '#627b81', 'gears'],
  ['Void Crossing', 'Tyhjiön ylitys', '#200e32', '#624269', 'comets'],
  ['Royal Armada', 'Kuninkaallinen armada', '#251c30', '#655a58', 'fleet'],
  ['Last Shiny Stand', 'Viimeinen kiiltävä puolustus', '#34112f', '#85474e', 'crown'],
] as const;
// Original 16-note phrases in semitones. Boss phrases are separately authored.
export const levelMelodies = [
  [0, 4, 7, 12, 7, 4, 2, 7, -1, 2, 7, 11, 7, 2, 0, 4],
  [0, 7, 3, 5, 10, 7, 5, 3, 0, 3, 7, 10, 5, 7, 3, 0],
  [0, 2, 7, 9, 7, 2, 4, 2, 0, 4, 9, 7, 4, 2, -3, 2],
  [0, 3, 7, 10, 12, 10, 7, 3, 5, 8, 12, 15, 12, 8, 5, 3],
  [0, 5, 7, 5, 2, 0, -3, 2, 0, 7, 10, 7, 5, 2, 0, -3],
  [0, 0, 7, 3, 0, 5, 8, 5, 3, 3, 10, 7, 5, 3, 2, 0],
  [0, 2, 3, 7, 8, 7, 3, 2, -5, 0, 3, 5, 7, 5, 3, 0],
  [0, 7, 11, 14, 11, 7, 4, 7, 2, 9, 12, 16, 12, 9, 5, 2],
  [0, 3, 0, 7, 3, 10, 7, 5, 2, 5, 2, 9, 5, 12, 9, 7],
  [0, 12, 7, 3, 10, 7, 2, 5, 0, 10, 5, 2, 8, 5, 0, 3],
  [0, -5, 0, 3, 7, 3, 0, -2, 0, 5, 8, 5, 3, 0, -2, -5],
  [0, 3, 7, 8, 7, 3, 2, -1, 0, 7, 10, 8, 7, 5, 3, 0],
  [0, 4, 9, 12, 9, 7, 4, 2, 0, 2, 4, 7, 9, 7, 4, 0],
  [0, 2, 5, 9, 5, 2, 7, 5, 0, 5, 9, 12, 9, 7, 5, 2],
  [0, 7, 2, 9, 4, 11, 7, 2, 0, 4, 2, 7, 9, 7, 4, 2],
  [0, 3, 8, 12, 8, 5, 3, 0, 2, 5, 10, 14, 10, 7, 5, 2],
  [0, 5, 9, 7, 4, 2, 0, 4, 7, 12, 9, 5, 4, 2, -3, 0],
  [0, 7, 0, 3, 8, 3, 10, 5, 0, 8, 3, 7, 2, 5, 0, -2],
  [0, 2, 7, 3, 8, 5, 10, 7, 3, 0, -2, 3, 5, 7, 3, 0],
  [0, 4, 11, 7, 14, 11, 9, 7, 2, 5, 12, 9, 16, 12, 9, 5],
  [0, 3, 7, 0, 10, 5, 8, 3, 2, 5, 9, 2, 12, 7, 10, 5],
  [0, 12, 3, 10, 5, 8, 2, 7, 0, 10, 2, 8, 3, 7, 0, 5],
  [0, 3, 0, -5, 7, 0, 3, -2, 8, 3, 5, 0, 7, 2, 0, -5],
  [0, 7, 3, 8, 0, 10, 7, 5, 3, 12, 8, 7, 5, 3, 2, 0],
] as const;
export const bossMelodies = [
  [0, 7, 3, 10, 0, 12, 5, 10, 0, 7, 5, 12, 3, 10, 7, 15],
  [0, 3, 0, 8, 7, 3, 10, 5, 0, 7, 3, 12, 8, 7, 5, 3],
  [0, 2, 8, 7, 0, 3, 9, 8, 2, 5, 10, 9, 3, 7, 12, 10],
  [0, 3, 7, 3, 10, 7, 12, 10, 5, 8, 12, 8, 15, 12, 10, 7],
  [0, -2, 5, 7, 0, 5, 8, 7, 2, 0, 7, 10, 5, 3, 2, 0],
  [0, 0, 3, 7, 0, 0, 5, 8, 3, 3, 7, 10, 5, 5, 8, 12],
  [0, 1, 7, 8, 3, 2, 8, 9, 5, 3, 10, 11, 7, 5, 12, 10],
  [0, 7, 11, 7, 14, 11, 16, 14, 4, 9, 12, 9, 16, 12, 11, 7],
  [0, 7, 0, 3, 10, 3, 5, 12, 2, 9, 2, 5, 12, 5, 7, 14],
  [0, 12, 10, 7, 3, 10, 8, 5, 0, 10, 8, 5, 2, 8, 7, 3],
  [0, 0, -5, 3, 7, 7, 3, 0, 5, 5, 0, 8, 10, 8, 5, 3],
  [0, 7, 3, 8, 0, 10, 5, 12, 3, 8, 7, 10, 5, 12, 8, 15],
  [0, 4, 7, 11, 0, 9, 4, 12, 2, 7, 9, 14, 4, 11, 7, 16],
  [0, 2, 9, 5, 0, 7, 12, 9, 5, 2, 10, 7, 9, 5, 14, 12],
  [0, 7, 2, 8, 0, 9, 3, 10, 2, 10, 4, 11, 5, 12, 7, 14],
  [0, 3, 8, 7, 12, 8, 10, 7, 5, 8, 13, 10, 15, 12, 10, 8],
  [0, 5, 9, 4, 12, 7, 5, 2, 4, 9, 14, 7, 12, 9, 5, 0],
  [0, 0, 8, 3, 7, 0, 10, 5, 3, 3, 12, 7, 10, 5, 8, 0],
  [0, 1, 8, 3, 10, 5, 11, 7, 3, 2, 9, 5, 12, 8, 10, 7],
  [0, 7, 14, 11, 16, 9, 12, 7, 4, 11, 16, 12, 19, 14, 11, 9],
  [0, 3, 10, 7, 12, 5, 8, 3, 2, 5, 12, 9, 14, 7, 10, 5],
  [0, 12, 3, 10, 0, 8, 2, 7, 5, 15, 8, 12, 7, 10, 3, 8],
  [0, -5, 0, 7, 3, 10, 5, 8, 0, 7, 3, 12, 5, 10, 7, 15],
  [0, 7, 3, 8, 0, 10, 5, 12, 3, 15, 8, 12, 5, 14, 10, 19],
] as const;
export const wordPools = {
  en: [
    ['coast', 'stars', 'orbit', 'shine'],
    ['ship', 'star', 'moon', 'wave'],
    ['bolt', 'gear', 'glow', 'lamp'],
    ['metal', 'light', 'spark', 'shore'],
    ['silver', 'cannon', 'signal', 'shield'],
    ['engine', 'harbor', 'rocket', 'planet'],
    ['captain', 'beacon', 'thunder', 'crystal'],
    ['aurora', 'orbit', 'comet', 'meteor'],
    ['harbour', 'courage', 'chrome', 'machine'],
    ['starlight', 'waterfront', 'spaceship', 'adventure'],
    ['recycling', 'friendship', 'discovery', 'defenders'],
    ['helsinki', 'treasure', 'teamwork', 'victory'],
  ],
  fi: [
    ['satama', 'tähti', 'ranta', 'hohde'],
    ['laiva', 'tähti', 'valo', 'aalto'],
    ['pultti', 'ratas', 'hohde', 'lamppu'],
    ['metalli', 'ranta', 'kipinä', 'taivas'],
    ['hopea', 'tykki', 'kilpi', 'viesti'],
    ['moottori', 'satama', 'raketti', 'planeetta'],
    ['kapteeni', 'majakka', 'ukkonen', 'kristalli'],
    ['revontuli', 'kiertorata', 'komeetta', 'meteori'],
    ['satama', 'rohkeus', 'kromi', 'koneisto'],
    ['tähtivalo', 'rantakatu', 'avaruuslaiva', 'seikkailu'],
    ['kierrätys', 'ystävyys', 'löytöretki', 'puolustajat'],
    ['helsinki', 'aarre', 'yhteistyö', 'voitto'],
  ],
} as const;
export const miniWordPools = {
  en: [
    ['sea', 'sun', 'sky', 'bay'],
    ['ship', 'moon', 'wave', 'star'],
    ['bolt', 'gear', 'glow', 'lamp'],
    ['metal', 'light', 'spark', 'shore'],
    ['beam', 'guard', 'steel', 'city'],
    ['engine', 'rocket', 'planet', 'harbor'],
    ['signal', 'beacon', 'storm', 'fleet'],
    ['aurora', 'orbit', 'comet', 'meteor'],
    ['chrome', 'courage', 'machine', 'harbour'],
    ['starlit', 'seaside', 'flight', 'journey'],
    ['recycle', 'friends', 'defend', 'discover'],
    ['crown', 'silver', 'teamwork', 'victory'],
  ],
  fi: [
    ['meri', 'kuu', 'maa', 'yö'],
    ['laiva', 'valo', 'aalto', 'tähti'],
    ['pultti', 'ratas', 'hohde', 'lamppu'],
    ['ranta', 'kipinä', 'taivas', 'romu'],
    ['hopea', 'tykki', 'kilpi', 'viesti'],
    ['satama', 'raketti', 'kone', 'tähti'],
    ['majakka', 'ukkonen', 'viesti', 'laivue'],
    ['komeetta', 'meteori', 'kierto', 'rata'],
    ['rohkeus', 'kromi', 'satama', 'koneisto'],
    ['tähti', 'rannikko', 'matka', 'lento'],
    ['ystävyys', 'löytö', 'kierrätä', 'puolusta'],
    ['kruunu', 'hopea', 'voitto', 'aarre'],
  ],
} as const;
export const sentences = {
  en: [
    'our shiny city stands together',
    'the stars shine over our harbour',
    'we defend helsinki with teamwork',
  ],
  fi: [
    'kiiltävä kaupunkimme pysyy turvassa',
    'tähdet loistavat satamamme yllä',
    'puolustamme helsinkiä yhdessä',
  ],
} as const;
export const cannonRewards = [
  ['Signal fins', 'Signaalievät'],
  ['Coil rails', 'Kelakiskot'],
  ['Twin antenna', 'Kaksoisantenni'],
  ['Storm vanes', 'Myrskysiivekkeet'],
  ['Crystal guard', 'Kristallisuoja'],
  ['Furnace vents', 'Ahjoventtiilit'],
  ['Echo dish', 'Kaikulautanen'],
  ['Orbit rings', 'Kiertorenkaat'],
  ['Chrome claws', 'Kromikourat'],
  ['Comet wings', 'Komeettasiivet'],
  ['Royal crest', 'Kuninkaallinen merkki'],
  ['City crown', 'Kaupungin kruunu'],
] as const;
export function sceneIndex(campaign: Campaign, level: number) {
  return (campaign === 'return' ? 12 : 0) + level - 1;
}
export function buttons(
  track: Track,
  level: number,
  profile: MouseProfile,
  campaign: Campaign = 'defense',
) {
  if (profile === 'primary' || track === 'keyboard') return [0];
  const effectiveLevel = campaign === 'return' ? 12 : level;
  const result = effectiveLevel >= (track === 'mixed' ? 4 : 3) ? [0, 2] : [0];
  // Mixed L7/L9 have no new keyboard group. Campaign-two text rehearsals
  // never introduce hardware: it uses the already-rehearsed campaign-one set.
  if (profile === 'extended' && effectiveLevel >= 7) result.push(1);
  if (profile === 'extended' && effectiveLevel >= 9) result.push(3);
  return result;
}
export function textCharacters(track: Track, level: number, lang: Lang, layout: Layout): string[] {
  if (track === 'mouse') return [];
  const corpus =
    wordPools[lang].slice(0, level).flat().join('') +
    miniWordPools[lang].slice(0, level).flat().join('') +
    (level === 12 ? sentences[lang].join('') : '');
  const chars = [...new Set(Array.from(corpus))];
  if (layout === 'us' && chars.some((c) => 'äöå'.includes(c)))
    throw Error('Finnish corpus requires FI/SV layout');
  return chars.map((c) => (c === ' ' ? 'Space' : c));
}
export function story(campaign: Campaign, level: number, lang: Lang) {
  const scene = scenes[sceneIndex(campaign, level)][lang === 'en' ? 0 : 1];
  return lang === 'en'
    ? campaign === 'defense'
      ? `${scene}: the scavenger fleet is closing on the city's metal stores. Hold the waterfront.`
      : `${scene}: the king's rebuilt fleet follows a stolen signal. Break their coded weak points and protect our city.`
    : campaign === 'defense'
      ? `${scene}: romulaivue lähestyy kaupungin metallivarastoja. Pidä ranta turvassa.`
      : `${scene}: kuninkaan uusi laivue seuraa varastettua signaalia. Murra koodatut heikot kohdat ja suojele kaupunkia.`;
}
export function validateCampaigns() {
  if (
    scenes.length !== 24 ||
    levelMelodies.length !== 24 ||
    bossMelodies.length !== 24 ||
    returnRoster.length !== 12 ||
    cannonRewards.length !== 12
  )
    throw Error('Incomplete campaigns');
  for (const lang of ['en', 'fi'] as Lang[]) {
    if (wordPools[lang].length !== 12 || sentences[lang].length < 3)
      throw Error('Incomplete corpus');
    for (const pool of wordPools[lang])
      for (const word of pool) if (!/^[a-zäöå]{2,12}$/.test(word)) throw Error('Unsafe word');
    if (miniWordPools[lang].length !== 12) throw Error('Incomplete miniboss corpus');
    for (const pool of miniWordPools[lang])
      for (const word of pool)
        if (!/^[a-zäöå]{2,8}$/.test(word)) throw Error('Unsafe miniboss word');
    for (const sentence of sentences[lang])
      if (!/^[a-zäöå ]{25,45}$/.test(sentence)) throw Error('Unsafe sentence');
    textCharacters('mixed', 12, lang, lang === 'fi' ? 'fi' : 'us');
  }
}
