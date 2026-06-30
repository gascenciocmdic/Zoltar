let isMuted = false;
let preferredVoice = null;
let ambientAudio = null;
let premiumAudio = null;

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
export const speakText = (text, lang = 'es', onEnd = null) => {
  if (isMuted || !text || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd; // avoid stuck state on error
  }
  
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

/**
 * Preview de voces estándar: resuelve la voz en el momento (sin cache),
 * filtrando por idioma y luego por género. Pitch refuerza el carácter
 * cuando no hay voz nativa del género disponible.
 */
export const speakPreviewStd = (text, lang = 'en', gender = 'masculine') => {
  if (!text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const bcp47   = { es: 'es-MX', en: 'en-US', pt: 'pt-BR' };
  const prefix  = { es: 'es',    en: 'en',    pt: 'pt'    };
  const latinMX = { es: 'es_MX', en: 'en-US', pt: 'pt-BR' };
  utterance.lang = bcp47[lang] || 'en-US';

  const voices  = window.speechSynthesis.getVoices();
  const forLang = voices.filter(v => v.lang.startsWith(prefix[lang] || 'en'));

  // Preferir variante latina (es_MX, pt_BR) sobre España/Portugal
  const latinPref = latinMX[lang];
  const latin   = forLang.filter(v => v.lang.replace('-', '_').startsWith(latinPref));
  const pool    = latin.length ? latin : forLang;

  // Voces masculinas y femeninas conocidas (macOS/iOS/Chrome/Windows)
  const femKeys  = ['female', 'woman', 'samantha', 'karen', 'victoria', 'susan',
                    'alice', 'kate', 'moira', 'tessa', 'veena', 'ava', 'allison',
                    'fiona', 'monica', 'mónica', 'paulina', 'luciana', 'joana',
                    'flo', 'sandy', 'shelley', 'grandma', 'zuzana', 'laura',
                    'ioana', 'sinji', 'tingting'];
  const mascKeys = ['male', 'man', 'alex', 'daniel', 'thomas', 'oliver',
                    'jorge', 'diego', 'juan', 'carlos', 'felix', 'reed', 'albert',
                    'rocko', 'grandpa', 'eddy', 'fred', 'ralph', 'bruce',
                    'kanya', 'luca', 'magnus', 'nicolas', 'aaron'];

  const wantKeys = gender === 'feminine' ? femKeys  : mascKeys;
  const skipKeys = gender === 'feminine' ? mascKeys : femKeys;

  // 1. Primera prioridad explícita por género/idioma
  const firstPick = (gender === 'masculine') ? 'rocko' : null;
  let voice = firstPick ? pool.find(v => v.name.toLowerCase().includes(firstPick)) : null;
  // 2. Fallback: voz con nombre del género correcto
  if (!voice) voice = pool.find(v => wantKeys.some(k => v.name.toLowerCase().includes(k)));
  // 2. Fallback: voz sin nombre del género contrario en variante latina
  if (!voice) voice = pool.find(v => !skipKeys.some(k => v.name.toLowerCase().includes(k)));
  // 3. Fallback: cualquier voz del idioma (pool completo)
  if (!voice) voice = pool[0] ?? forLang[0];
  if (voice) utterance.voice = voice;

  utterance.pitch = gender === 'feminine' ? 1.35 : 1.20;
  utterance.rate  = gender === 'feminine' ? 0.92 : 0.88;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (premiumAudio) {
    premiumAudio.pause();
    premiumAudio = null;
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

/**
 * Narra el texto usando ElevenLabs (voz premium).
 * Si la API falla, hace fallback a speakText silenciosamente.
 * @param {string} text
 * @param {'masculine'|'feminine'} voiceProfile
 * @param {string} lang  BCP-47 language code (default 'es')
 * @param {Function|null} onEnd  Called when audio ends or on error
 */
export const speakPremium = async (text, voiceProfile = 'masculine', lang = 'es', onEnd = null) => {
  if (isMuted || !text) {
    if (onEnd) onEnd();
    return;
  }

  // Stop any Web Speech synthesis and any previous premium audio BEFORE starting
  // ElevenLabs, so the two voices never overlap.
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (premiumAudio) {
    premiumAudio.pause();
    premiumAudio = null;
  }

  // Pre-create and register the Audio element BEFORE any await so it is
  // associated with the current user-gesture context.  Browsers (especially
  // Safari) block audio.play() that is called after an async gap unless the
  // audio element was created within the original gesture.
  const audio = new Audio();
  premiumAudio = audio;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceProfile }),
    });

    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);

    // Assign src after fetch so we can reuse the pre-created element
    audio.src = url;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      premiumAudio = null;
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      premiumAudio = null;
      console.warn('[speakPremium] Audio playback error, falling back to speakText');
      speakText(text, lang, onEnd);
    };

    await audio.play();
  } catch (e) {
    console.warn('[speakPremium] ElevenLabs unavailable, falling back to speakText:', e.message);
    premiumAudio = null;
    speakText(text, lang, onEnd);
  }
};
