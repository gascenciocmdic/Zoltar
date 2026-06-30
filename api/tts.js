import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// 4 premium voices from the Zoltar ElevenLabs agent
const VOICE_IDS = {
  masculine_1: 'cjVigY5qzO86Huf0OWal', // Eric — natural masculine
  masculine_2: 'fbIG6gEosVIM95R5qOna', // Deep Calm Zolta — deep & mystical
  feminine_1:  'SaqYcK3ZpDKBAImA8AdW', // Fem Smooth Voice — ethereal feminine
  feminine_2:  'qBDvhofpxp92JgXJxDjB', // Empathy fem voice — warm feminine
  // Legacy fallbacks for any old sessions that stored 'masculine'/'feminine'
  masculine:   'cjVigY5qzO86Huf0OWal',
  feminine:    'SaqYcK3ZpDKBAImA8AdW',
};

const VOICE_SETTINGS = {
  masculine_1: { stability: 0.72, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
  masculine_2: { stability: 0.82, similarity_boost: 0.75, style: 0.08, use_speaker_boost: true },
  feminine_1:  { stability: 0.65, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
  feminine_2:  { stability: 0.60, similarity_boost: 0.88, style: 0.28, use_speaker_boost: true },
  masculine:   { stability: 0.72, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
  feminine:    { stability: 0.65, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
};

async function logElevenLabsUsage({ charsSent, voiceId, userId = null }) {
  try {
    const costPerChar = 0.00022; // plan Creator: $22/100k chars
    const costEst = charsSent * costPerChar;

    await supabaseAdmin().from('api_usage_log').insert({
      user_id:       userId,
      proveedor:     'elevenlabs',
      chars_sent:    charsSent,
      modelo:        voiceId,
      costo_usd_est: costEst,
    });
  } catch (err) {
    console.warn('[tts] No se pudo loguear uso en api_usage_log:', err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, voiceProfile } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la API Key de ElevenLabs.' });
  }

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Missing or empty text field.' });
  }

  // Accept any of the 4 voice profiles; fall back to masculine_1 for unknowns
  const profile = VOICE_IDS[voiceProfile] ? voiceProfile : 'masculine_1';
  const voiceId        = VOICE_IDS[profile];
  const voice_settings = VOICE_SETTINGS[profile];
  const modelId = 'eleven_multilingual_v2';

  // Obtener userId para logging (no bloquea si falla)
  let userId = null;
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) {
      const { data } = await supabaseAdmin().auth.getUser(token);
      userId = data?.user?.id || null;
    }
  } catch (_) {}

  // Log fire-and-forget (no bloquea la respuesta de audio)
  logElevenLabsUsage({ charsSent: text.length, voiceId, userId }).catch(() => {});

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({ text, model_id: modelId, voice_settings }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API Error:', errorData);
      return res.status(response.status).json(errorData);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Server TTS Error:', error);
    res.status(500).json({ error: 'Error interno conectando con ElevenLabs' });
  }
}
