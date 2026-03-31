let isMuted = false;
let currentUtterance = null;
let voicesLoaded = false;
let preferredVoice = null;

export const initSpeech = () => {
  if (!('speechSynthesis' in window)) return;
  
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Buscar una voz masculina joven, profunda y humana (México/Latino)
      const mxVoices = voices.filter(v => v.lang.includes('es-MX') || v.lang.includes('es-419') || v.lang.startsWith('es'));
      preferredVoice = mxVoices.find(v => 
          v.name.includes('Jorge') || v.name.includes('Juan') || v.name.includes('Alonso') || 
          v.name.includes('Diego') || v.name.includes('Carlos') || v.name.includes('Manuel') ||
          v.name.includes('Enrique') || v.name.includes('Sabino') || v.name.includes('David') || 
          v.name.includes('Mateo') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('hombre')
      ) 
        || mxVoices[0] 
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
    currentUtterance.pitch = 0.75; // Baja el tono para que sea profundo pero joven
    currentUtterance.rate = 0.9; // Velocidad pausada y humana
    currentUtterance.volume = 1.0; 
    
    window.speechSynthesis.speak(currentUtterance);
  }, 50);
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
