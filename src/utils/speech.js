let isMuted = false;
let preferredVoice = null;
let ambientAudio = null;

/**
 * Inicializa el motor de voz de sistema (Web Speech API) - Gratis
 */
export const initSpeech = () => {
  if ('speechSynthesis' in window) {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const esVoices = voices.filter(v => v.lang.includes('es-MX') || v.lang.includes('es-419') || v.lang.startsWith('es'));
      preferredVoice = esVoices.find(v =>
        v.name.includes('Jorge') || v.name.includes('Juan') || v.name.includes('Diego') || v.name.toLowerCase().includes('male')
      ) || esVoices[0] || voices.find(v => v.lang.startsWith('es')) || voices[0];
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
};

export const toggleMute = () => {
  isMuted = !isMuted;
  if (isMuted) {
    stopSpeech();
    pauseAmbient();
  } else {
    resumeAmbient();
  }
  return isMuted;
};

export const getIsMuted = () => isMuted;

/**
 * Narra el texto usando la voz de sistema (costo $0)
 */
export const speakText = (text) => {
  if (isMuted || !text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.lang = 'es-MX';
  utterance.pitch = 0.75;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Música ambiental espiritual de fondo
 */
export const startAmbientMusic = () => {
  if (ambientAudio) return; // ya está sonando
  ambientAudio = new Audio('/ambient.wav');
  ambientAudio.loop = true;
  ambientAudio.volume = 0.20; // Volumen sutil pero audible
  ambientAudio.addEventListener('canplaythrough', () => {
    console.log("🎵 Música ambiental cargada y reproduciéndose");
  });
  ambientAudio.play().catch(e => console.warn("Ambient music blocked:", e));
};

export const pauseAmbient = () => {
  if (ambientAudio) ambientAudio.pause();
};

export const resumeAmbient = () => {
  if (ambientAudio && !isMuted) {
    ambientAudio.play().catch(() => {});
  }
};

export const stopAmbient = () => {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio = null;
  }
};
