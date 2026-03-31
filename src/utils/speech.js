let isMuted = false;
let preferredVoice = null;
let ambientAudio = null;

/**
 * Inicializa el motor de voz de sistema (Web Speech API) - Gratis
 */
export const initSpeech = (lang = 'es') => {
  if ('speechSynthesis' in window) {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const langMap = {
        'es': 'es',
        'en': 'en',
        'pt': 'pt'
      };
      const targetLang = langMap[lang] || 'es';
      
      const filteredVoices = voices.filter(v => v.lang.startsWith(targetLang));
      
      // Try to find a male/deep voice if possible
      preferredVoice = filteredVoices.find(v =>
        v.name.toLowerCase().includes('male') || v.name.includes('Google') || v.name.includes('Natural')
      ) || filteredVoices[0] || voices.find(v => v.lang.startsWith(targetLang)) || voices[0];
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
export const speakText = (text, lang = 'es') => {
  if (isMuted || !text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  if (preferredVoice) utterance.voice = preferredVoice;
  
  const langMap = {
    'es': 'es-MX',
    'en': 'en-US',
    'pt': 'pt-BR'
  };
  utterance.lang = langMap[lang] || 'es-MX';
  
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
