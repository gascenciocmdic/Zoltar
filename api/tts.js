
export const maxDuration = 60; // Timeout extendido para streams largos

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la API Key de ElevenLabs en las variables de entorno.' });
  }

  // Antoni (Estándar) - Único ID que no lanza error 402 en la cuenta del usuario
  const voiceId = "ErXwobaYiN019PkySvjV"; 
  const modelId = "eleven_multilingual_v2";

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.75, // Mayor estabilidad para un tono espiritual
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API Error Body:', errorData);
      return res.status(response.status).json(errorData);
    }

    // Retornamos el audio como un stream binario
    res.setHeader('Content-Type', 'audio/mpeg');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));

  } catch (error) {
    console.error('Server TTS Error:', error);
    res.status(500).json({ error: 'Error interno conectando con ElevenLabs' });
  }
}
