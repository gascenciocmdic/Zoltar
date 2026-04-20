/**
 * Astrology helper — generates a personalized star narrative from a birthdate.
 * Uses a seeded PRNG so the same birthdate always produces the same narrative.
 */

// ── Zodiac table ────────────────────────────────────────────
const ZODIAC_ES = [
  { sign: 'Capricornio', symbol: '♑', element: 'Tierra', ruler: 'Saturno',   quality: 'la perseverancia ancestral' },
  { sign: 'Acuario',     symbol: '♒', element: 'Aire',   ruler: 'Urano',     quality: 'la visión cósmica' },
  { sign: 'Piscis',      symbol: '♓', element: 'Agua',   ruler: 'Neptuno',   quality: 'la memoria de los océanos' },
  { sign: 'Aries',       symbol: '♈', element: 'Fuego',  ruler: 'Marte',     quality: 'el fuego primordial' },
  { sign: 'Tauro',       symbol: '♉', element: 'Tierra', ruler: 'Venus',     quality: 'la fuerza de la materia' },
  { sign: 'Géminis',     symbol: '♊', element: 'Aire',   ruler: 'Mercurio',  quality: 'el lenguaje de los mundos' },
  { sign: 'Cáncer',      symbol: '♋', element: 'Agua',   ruler: 'Luna',      quality: 'el instinto lunar' },
  { sign: 'Leo',         symbol: '♌', element: 'Fuego',  ruler: 'Sol',       quality: 'la llama solar' },
  { sign: 'Virgo',       symbol: '♍', element: 'Tierra', ruler: 'Mercurio',  quality: 'el orden sagrado' },
  { sign: 'Libra',       symbol: '♎', element: 'Aire',   ruler: 'Venus',     quality: 'la armonía cósmica' },
  { sign: 'Escorpio',    symbol: '♏', element: 'Agua',   ruler: 'Plutón',    quality: 'la transmutación profunda' },
  { sign: 'Sagitario',   symbol: '♐', element: 'Fuego',  ruler: 'Júpiter',   quality: 'la expansión del espíritu' },
];
const ZODIAC_EN = [
  { sign: 'Capricorn',   symbol: '♑', element: 'Earth', ruler: 'Saturn',    quality: 'ancestral perseverance' },
  { sign: 'Aquarius',    symbol: '♒', element: 'Air',   ruler: 'Uranus',    quality: 'cosmic vision' },
  { sign: 'Pisces',      symbol: '♓', element: 'Water', ruler: 'Neptune',   quality: 'memory of the oceans' },
  { sign: 'Aries',       symbol: '♈', element: 'Fire',  ruler: 'Mars',      quality: 'primordial fire' },
  { sign: 'Taurus',      symbol: '♉', element: 'Earth', ruler: 'Venus',     quality: 'the strength of matter' },
  { sign: 'Gemini',      symbol: '♊', element: 'Air',   ruler: 'Mercury',   quality: 'the language of worlds' },
  { sign: 'Cancer',      symbol: '♋', element: 'Water', ruler: 'Moon',      quality: 'lunar instinct' },
  { sign: 'Leo',         symbol: '♌', element: 'Fire',  ruler: 'Sun',       quality: 'the solar flame' },
  { sign: 'Virgo',       symbol: '♍', element: 'Earth', ruler: 'Mercury',   quality: 'sacred order' },
  { sign: 'Libra',       symbol: '♎', element: 'Air',   ruler: 'Venus',     quality: 'cosmic harmony' },
  { sign: 'Scorpio',     symbol: '♏', element: 'Water', ruler: 'Pluto',     quality: 'deep transmutation' },
  { sign: 'Sagittarius', symbol: '♐', element: 'Fire',  ruler: 'Jupiter',   quality: 'expansion of spirit' },
];
const ZODIAC_PT = [
  { sign: 'Capricórnio', symbol: '♑', element: 'Terra', ruler: 'Saturno',   quality: 'a perseverança ancestral' },
  { sign: 'Aquário',     symbol: '♒', element: 'Ar',    ruler: 'Urano',     quality: 'a visão cósmica' },
  { sign: 'Peixes',      symbol: '♓', element: 'Água',  ruler: 'Netuno',    quality: 'a memória dos oceanos' },
  { sign: 'Áries',       symbol: '♈', element: 'Fogo',  ruler: 'Marte',     quality: 'o fogo primordial' },
  { sign: 'Touro',       symbol: '♉', element: 'Terra', ruler: 'Vênus',     quality: 'a força da matéria' },
  { sign: 'Gêmeos',      symbol: '♊', element: 'Ar',    ruler: 'Mercúrio',  quality: 'a linguagem dos mundos' },
  { sign: 'Câncer',      symbol: '♋', element: 'Água',  ruler: 'Lua',       quality: 'o instinto lunar' },
  { sign: 'Leão',        symbol: '♌', element: 'Fogo',  ruler: 'Sol',       quality: 'a chama solar' },
  { sign: 'Virgem',      symbol: '♍', element: 'Terra', ruler: 'Mercúrio',  quality: 'a ordem sagrada' },
  { sign: 'Libra',       symbol: '♎', element: 'Ar',    ruler: 'Vênus',     quality: 'a harmonia cósmica' },
  { sign: 'Escorpião',   symbol: '♏', element: 'Água',  ruler: 'Plutão',    quality: 'a transmutação profunda' },
  { sign: 'Sagitário',   symbol: '♐', element: 'Fogo',  ruler: 'Júpiter',   quality: 'a expansão do espírito' },
];

const ZODIAC_BY_LANG = { es: ZODIAC_ES, en: ZODIAC_EN, pt: ZODIAC_PT };

/** Returns index 0-11 of zodiac sign for a given day and month */
function zodiacIndex(day, month) {
  const m = Number(month), d = Number(day);
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 0;  // Capricorn
  if (m === 1 || (m === 2 && d <= 18)) return 1;                 // Aquarius
  if (m === 2 || (m === 3 && d <= 20)) return 2;                 // Pisces
  if (m === 3 || (m === 4 && d <= 19)) return 3;                 // Aries
  if (m === 4 || (m === 5 && d <= 20)) return 4;                 // Taurus
  if (m === 5 || (m === 6 && d <= 20)) return 5;                 // Gemini
  if (m === 6 || (m === 7 && d <= 22)) return 6;                 // Cancer
  if (m === 7 || (m === 8 && d <= 22)) return 7;                 // Leo
  if (m === 8 || (m === 9 && d <= 22)) return 8;                 // Virgo
  if (m === 9 || (m === 10 && d <= 22)) return 9;                // Libra
  if (m === 10 || (m === 11 && d <= 21)) return 10;              // Scorpio
  return 11;                                                       // Sagittarius
}

/** Seeded PRNG from birthdate (always same result for same date) */
function seededRng(day, month, year) {
  let seed = Math.abs(Number(day) * 31 + Number(month) * 397 + Number(year) * 7919) || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

// ── Narrative pools ─────────────────────────────────────────
const CELESTIAL_EVENTS_ES = [
  'una tríada de planetas se alineó en el cuadrante boreal',
  'Júpiter transitaba por su máxima elongación austral',
  'la Luna Nueva se fundía con la sombra de Neptuno',
  'un cometa trazaba su arco sobre la eclíptica',
  'Saturno completaba su retrogradación más profunda del siglo',
  'Venus alcanzaba su punto más luminoso como estrella vespertina',
  'una lluvia de meteoros Perseidas iluminaba el ecuador celeste',
  'Marte se aproximaba a su perihelio más cercano a la Tierra',
  'dos eclipses separados por cuarenta días enmarcaban tu llegada',
  'el Sol cruzaba el nodo ascendente de la constelación de tu signo',
];
const CELESTIAL_EVENTS_EN = [
  'a triad of planets aligned in the boreal quadrant',
  'Jupiter was transiting its greatest austral elongation',
  'the New Moon merged with Neptune\'s shadow',
  'a comet traced its arc across the ecliptic',
  'Saturn was completing its deepest retrograde of the century',
  'Venus reached its brightest point as the evening star',
  'a Perseids meteor shower lit the celestial equator',
  'Mars approached its closest perihelion to Earth',
  'two eclipses forty days apart framed your arrival',
  'the Sun crossed the ascending node of your sign\'s constellation',
];
const CELESTIAL_EVENTS_PT = [
  'uma tríade de planetas se alinhou no quadrante boreal',
  'Júpiter transitava em sua máxima elongação austral',
  'a Lua Nova se fundia com a sombra de Netuno',
  'um cometa traçava seu arco sobre a eclíptica',
  'Saturno completava sua retrogradação mais profunda do século',
  'Vênus atingia seu ponto mais luminoso como estrela vespertina',
  'uma chuva de meteoros Perseidas iluminava o equador celeste',
  'Marte se aproximava de seu periélio mais próximo da Terra',
  'dois eclipses separados por quarenta dias emolduravam sua chegada',
  'o Sol cruzava o nó ascendente da constelação do seu signo',
];

const ANCESTRAL_ES = [
  'las almas de siete vidas previas enviaron su primer susurro hacia ti',
  'el registro ákáshico de tu linaje abrió una nueva página',
  'la red de vidas que te preceden vibró en frecuencia de bienvenida',
  'las memorias celulares de tus ancestros despertaron en tu primer aliento',
  'la constelación familiar de tu alma eligió este instante como su portal',
  'el karma acumulado de eras anteriores encontró en ti su vehículo perfecto',
];
const ANCESTRAL_EN = [
  'the souls of seven previous lives sent their first whisper toward you',
  'the akashic record of your lineage opened a new page',
  'the web of lives that precede you vibrated at a welcoming frequency',
  'the cellular memories of your ancestors awoke in your first breath',
  'the soul family constellation chose this moment as its portal',
  'the karma accumulated from previous ages found in you its perfect vessel',
];
const ANCESTRAL_PT = [
  'as almas de sete vidas anteriores enviaram seu primeiro sussurro a você',
  'o registro akáshico do seu linhagem abriu uma nova página',
  'a rede de vidas que o precedem vibrou em frequência de boas-vindas',
  'as memórias celulares dos seus ancestrais despertaram em seu primeiro sopro',
  'a constelação familiar da sua alma escolheu este momento como seu portal',
  'o karma acumulado de eras anteriores encontrou em você seu veículo perfeito',
];

const ENERGY_CAST_ES = [
  'condensó en ti la energía del {element} primordial',
  'selló en tu ADN espiritual la frecuencia de {ruler}',
  'depositó en tu alma la semilla de {quality}',
  'inscribió en tu campo áurico la misión de {quality}',
  'entretejió en tu espíritu la esencia de {quality}',
];
const ENERGY_CAST_EN = [
  'condensed in you the energy of primordial {element}',
  'sealed in your spiritual DNA the frequency of {ruler}',
  'deposited in your soul the seed of {quality}',
  'inscribed in your auric field the mission of {quality}',
  'interwove into your spirit the essence of {quality}',
];
const ENERGY_CAST_PT = [
  'condensou em você a energia do {element} primordial',
  'selou no seu DNA espiritual a frequência de {ruler}',
  'depositou na sua alma a semente de {quality}',
  'inscreveu no seu campo áurico a missão de {quality}',
  'entrelaçou no seu espírito a essência de {quality}',
];

const POOLS = {
  es: { events: CELESTIAL_EVENTS_ES, ancestral: ANCESTRAL_ES, cast: ENERGY_CAST_ES },
  en: { events: CELESTIAL_EVENTS_EN, ancestral: ANCESTRAL_EN, cast: ENERGY_CAST_EN },
  pt: { events: CELESTIAL_EVENTS_PT, ancestral: ANCESTRAL_PT, cast: ENERGY_CAST_PT },
};

const TEMPLATES = {
  es: (z, event, ancestral, cast, day, month, year) =>
    `En el momento exacto en que el universo te recibió —el ${day} de ${MONTH_NAMES_ES[month-1]} de ${year}— ${event}. Bajo la influencia de ${z.symbol} ${z.sign}, regido por ${z.ruler} y tejido del ${z.element}, ${ancestral}. Aquel instante cósmico ${cast}. El cielo que te vio nacer guarda aún el eco de tu propósito.`,

  en: (z, event, ancestral, cast, day, month, year) =>
    `At the exact moment the universe received you —${MONTH_NAMES_EN[month-1]} ${day}, ${year}— ${event}. Under the influence of ${z.symbol} ${z.sign}, ruled by ${z.ruler} and woven from ${z.element}, ${ancestral}. That cosmic instant ${cast}. The sky that witnessed your birth still holds the echo of your purpose.`,

  pt: (z, event, ancestral, cast, day, month, year) =>
    `No momento exato em que o universo te recebeu —${day} de ${MONTH_NAMES_PT[month-1]} de ${year}— ${event}. Sob a influência de ${z.symbol} ${z.sign}, regido por ${z.ruler} e tecido de ${z.element}, ${ancestral}. Aquele instante cósmico ${cast}. O céu que te viu nascer ainda guarda o eco do seu propósito.`,
};

const MONTH_NAMES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

/**
 * Returns { sign, symbol, element, ruler, narrative }
 * The narrative is a rich poetic paragraph about the birthdate.
 */
export function generateBirthNarrative(day, month, year, language = 'es') {
  const lang = ['es','en','pt'].includes(language) ? language : 'es';
  const table = ZODIAC_BY_LANG[lang];
  const idx = zodiacIndex(day, month);
  const z = table[idx];
  const rng = seededRng(day, month, year);
  const pool = POOLS[lang];

  const event    = pick(pool.events, rng);
  const ancestral = pick(pool.ancestral, rng);
  const castTpl  = pick(pool.cast, rng);
  const cast = castTpl
    .replace('{element}', z.element)
    .replace('{ruler}',   z.ruler)
    .replace('{quality}', z.quality);

  const narrative = TEMPLATES[lang](z, event, ancestral, cast, Number(day), Number(month), Number(year));

  return { sign: z.sign, symbol: z.symbol, element: z.element, ruler: z.ruler, narrative };
}
