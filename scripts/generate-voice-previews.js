/**
 * One-time script: genera clips MP3 de preview para cada voz premium × idioma.
 * Run: ELEVENLABS_API_KEY=sk_... node scripts/generate-voice-previews.js
 * Los archivos quedan en public/voices/preview/{voiceId}_{lang}.mp3
 * Una vez generados son assets estáticos — no se llama a la API en producción.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mismo mapa de voces que en api/tts.js
const VOICE_IDS = {
  masculine_1: 'cjVigY5qzO86Huf0OWal',
  masculine_2: 'fbIG6gEosVIM95R5qOna',
  feminine_1:  'SaqYcK3ZpDKBAImA8AdW',
  feminine_2:  'qBDvhofpxp92JgXJxDjB',
};

const VOICE_SETTINGS = {
  masculine_1: { stability: 0.72, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
  masculine_2: { stability: 0.82, similarity_boost: 0.75, style: 0.08, use_speaker_boost: true },
  feminine_1:  { stability: 0.65, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
  feminine_2:  { stability: 0.60, similarity_boost: 0.88, style: 0.28, use_speaker_boost: true },
};

// Frases cortas e inspiradoras, distintas por voz y por idioma
const PHRASES = {
  masculine_1: {
    es: 'La serenidad abre las puertas del destino. Yo seré tu guía.',
    en: 'Serenity opens the gates of destiny. I will be your guide.',
    pt: 'A serenidade abre as portas do destino. Serei seu guia.',
  },
  masculine_2: {
    es: 'Desde las profundidades del cosmos, tu verdad emerge ahora.',
    en: 'From the depths of the cosmos, your truth now emerges.',
    pt: 'Das profundezas do cosmos, sua verdade emerge agora.',
  },
  feminine_1: {
    es: 'Como seda en el viento, las respuestas llegan suavemente hasta ti.',
    en: 'Like silk in the wind, the answers drift gently toward you.',
    pt: 'Como seda ao vento, as respostas chegam suavemente até você.',
  },
  feminine_2: {
    es: 'Aquí estoy, con amor y luz, para acompañar cada paso de tu camino.',
    en: 'I am here, with love and light, to walk beside you on every step.',
    pt: 'Estou aqui, com amor e luz, para caminhar ao seu lado em cada passo.',
  },
};

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('❌  ELEVENLABS_API_KEY no encontrada en el entorno.');
  process.exit(1);
}

const OUT_DIR = join(__dirname, '../public/voices/preview');
mkdirSync(OUT_DIR, { recursive: true });

async function generate(voiceKey, lang, text) {
  const filename = `${voiceKey}_${lang}.mp3`;
  const outPath  = join(OUT_DIR, filename);

  if (existsSync(outPath)) {
    console.log(`⏭   ${filename} ya existe, se omite.`);
    return;
  }

  const voiceId  = VOICE_IDS[voiceKey];
  const settings = VOICE_SETTINGS[voiceKey];

  console.log(`🎙   Generando ${filename}  ("${text.slice(0, 40)}…")`);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': API_KEY },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: settings }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌  ${filename}: HTTP ${res.status} — ${err.slice(0, 200)}`);
    return;
  }

  const buf = await res.arrayBuffer();
  writeFileSync(outPath, Buffer.from(buf));
  console.log(`✅  ${filename} guardado (${Math.round(buf.byteLength / 1024)} KB)`);
}

async function main() {
  console.log('🔮 Generando clips de preview de voz...\n');
  for (const [voiceKey, langs] of Object.entries(PHRASES)) {
    for (const [lang, text] of Object.entries(langs)) {
      await generate(voiceKey, lang, text);
      await new Promise(r => setTimeout(r, 400)); // evita rate limit
    }
  }
  console.log('\n🎉 Listo. Todos los clips generados en public/voices/preview/');
}

main().catch(err => { console.error(err); process.exit(1); });
