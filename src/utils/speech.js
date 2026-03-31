let isMuted = false;
let currentAudio = null;
let preferredSystemVoice = null;

/**
 * Inicializador: Carga voces de sistema para el FALLBACK
 */
export const initSpeech = () => {
  if ('speechSynthesis' in window) {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const mxVoices = voices.filter(v => v.lang.includes('es-MX') || v.lang.includes('es-419') || v.lang.startsWith('es'));
      preferredSystemVoice = mxVoices.find(v => 
          v.name.includes('Jorge') || v.name.includes('Juan') || v.name.includes('Diego') || v.name.toLowerCase().includes('male')
      ) || mxVoices[0] || voices[0];
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  console.log("Human Voice Engine (ElevenLabs) Initialized with System Fallback.");
};

export const toggleMute = () => {
  isMuted = !isMuted;
  if (isMuted) {
    stopSpeech();
  }
  return isMuted;
};

export const getIsMuted = () => isMuted;

export const speakText = async (text) => {
  if (isMuted || !text) return;
  
  stopSpeech();
  
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (response.status !== 200) {
        console.error(`Error TTS: Codigo ${response.status}. Intentando Fallback...`);
        if (response.status === 402) console.warn("Cuota agotada o Voz premium restringida.");
        speakSystemFallback(text);
        return;
    }

    if (!response.ok) {
        throw new Error("Falla en la respuesta de TTS");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    currentAudio = new Audio(url);
    currentAudio.play().catch(e => {
        console.error("Error al reproducir audio humano:", e);
        speakSystemFallback(text);
    });
    
  } catch (error) {
    console.error("Error en ElevenLabs TTS, usando sistema:", error);
    speakSystemFallback(text);
  }
};

/**
 * Voz de respaldo si ElevenLabs falla
 */
const speakSystemFallback = (text) => {
    if (!('speechSynthesis' in window) || isMuted) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (preferredSystemVoice) utterance.voice = preferredSystemVoice;
    utterance.lang = 'es-MX';
    utterance.pitch = 0.75;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
