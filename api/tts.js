
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

  // Usaremos la voz 'Antoni' (ID: ErXw9S9iW7E6fRtep5V7) que es profunda y masculina en español.
  // Alternativa: 'Marcus' (ID: bVMeS97Y496Uf859Enf8)
  const voiceId = "ErXw9S9iW7E6fRtep5V7"; 
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
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ElevenLabs API Error:', errorData);
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
