let isMuted = false;
let currentAudio = null;

/**
 * Inicializador (ahora simplificado ya que no depende de voces locales)
 */
export const initSpeech = () => {
  console.log("Human Voice Engine (ElevenLabs) Initialized.");
};

export const toggleMute = () => {
  isMuted = !isMuted;
  if (isMuted) {
    stopSpeech();
  }
  return isMuted;
};

export const getIsMuted = () => isMuted;

/**
 * Llama al endpoint de backend para obtener el audio humano y reproducirlo.
 */
export const speakText = async (text) => {
  if (isMuted || !text) return;
  
  // Detener audio previo
  stopSpeech();
  
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
        throw new Error("Falla en la respuesta de TTS");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    currentAudio = new Audio(url);
    currentAudio.play().catch(e => console.error("Error al reproducir audio:", e));
    
  } catch (error) {
    console.error("Error en ElevenLabs TTS:", error);
    // Fallback silencioso (no interrumpir la experiencia visual)
  }
};

export const stopSpeech = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};
