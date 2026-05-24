export const maxDuration = 60;

const VOICE_IDS = {
  masculine: process.env.ELEVENLABS_VOICE_ID_MALE   || 'ErXwobaYiN019PkySvjV', // Antoni
  feminine:  process.env.ELEVENLABS_VOICE_ID_FEMALE || 'EXAVITQu4vr4xnSDxMaL', // Bella
};

const VOICE_SETTINGS = {
  masculine: { stability: 0.72, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
  feminine:  { stability: 0.65, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, voiceProfile } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la API Key de ElevenLabs.' });
  }

  const profile = voiceProfile === 'feminine' ? 'feminine' : 'masculine';
  const voiceId       = VOICE_IDS[profile];
  const voice_settings = VOICE_SETTINGS[profile];
  const modelId = 'eleven_multilingual_v2';

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
