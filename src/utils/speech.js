let isMuted = false;
let currentUtterance = null;
let voicesLoaded = false;
let preferredVoice = null;

export const initSpeech = () => {
  if (!('speechSynthesis' in window)) return;
  
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Buscar una voz femenina joven, suave, mexicana o latinoamericana
      const mxVoices = voices.filter(v => v.lang.includes('es-MX') || v.lang.includes('es-419'));
      preferredVoice = mxVoices.find(v => v.name.includes('Paulina') || v.name.includes('Sabina') || v.name.includes('Mia') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('mujer')) 
        || mxVoices[0] 
        || voices.find(v => v.lang.startsWith('es'))
        || voices[0];
      voicesLoaded = true;
    }
  };

  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
};

export const toggleMute = () => {
  isMuted = !isMuted;
  if (isMuted && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  return isMuted;
};

export const getIsMuted = () => isMuted;

export const speakText = (text) => {
  if (!('speechSynthesis' in window) || isMuted || !text) return;
  
  // Limpiar/cancelar cualquier audio previo para no hacer cola
  window.speechSynthesis.cancel();
  
  // Pequeña pausa para asegurar limpieza de buffer en ciertos navegadores (ej. Safari)
  setTimeout(() => {
    // Si la web speech framework está mudo externamente o si mute es true, salir de emergencia
    if (isMuted) return;

    currentUtterance = new SpeechSynthesisUtterance(text);
    
    if (preferredVoice) {
      currentUtterance.voice = preferredVoice;
    }
    
    currentUtterance.lang = 'es-MX'; // Forzar metadata
    currentUtterance.pitch = 1.4; // Tono más alto para sonar más joven y suave
    currentUtterance.rate = 0.95; // Velocidad fluida y juvenil
    currentUtterance.volume = 0.85; // Voz suave y delicada
    
    window.speechSynthesis.speak(currentUtterance);
  }, 50);
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
