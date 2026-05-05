import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './App.css';
import VortexCanvas from './vortex/VortexCanvas';
import Card from './components/Card';
import { interpretCards, generateIntrospection, generateAnchoring, generateDeepening } from './api/gemini';
import { cardsData } from './data/cards';
import { initSpeech, toggleMute, speakText, stopSpeech, startAmbientMusic, stopAmbient } from './utils/speech';
import { I18N } from './data/translations';
import TypewriterText from './components/TypewriterText';
import Dragonfly from './components/Dragonfly';
import ConstellationCanvas from './components/ConstellationCanvas';
import { supabase } from './lib/supabase';
import { fetchBalance, deductCredits, refundCredits, CREDIT_COSTS } from './lib/credits';
import { generateBirthNarrative } from './lib/astrology';
import AuthModal from './components/AuthModal';
import CreditWidget from './components/CreditWidget';
import PurchaseModal from './components/PurchaseModal';
import ReferralWidget from './components/ReferralWidget';
import PaymentSuccessModal from './components/PaymentSuccessModal';
import UnlockModal from './components/UnlockModal';
import InviteWidget from './components/InviteWidget';
import { trackEvent } from './lib/analytics';

const splitFirstSentence = (text) => {
  if (!text) return null;
  let idx = text.indexOf('. ');
  if (idx === -1) idx = text.indexOf('.\n');
  if (idx === -1) {
    const p = text.indexOf('.');
    if (p !== -1 && p < text.length - 1) idx = p;
  }
  if (idx === -1 || idx >= text.length - 1) {
    if (text.length <= 80) return null;
    const cut = text.slice(0, 140).lastIndexOf(' ');
    const at = cut > 20 ? cut : 100;
    return { visible: text.slice(0, at), blurred: text.slice(at + 1) };
  }
  return { visible: text.slice(0, idx + 1), blurred: text.slice(idx + 1).trimStart() };
};

function App() {
  console.log("=== ZOLTAR INITIALIZING ===");
  console.log("Supabase configured:", !!supabase);
  
  const [language, setLanguage] = useState(''); // Default empty to trigger selection
  const [phase, setPhase] = useState('languageSelection'); // languageSelection, threshold, synchrony, introspection, revelation, anchoring
  
  const [textIndices, setTextIndices] = useState({
    greeting: 0,
    askName: 0,
    waitMsg: 0,
    askReason: 0,
    askDichotomy: 0,
    askQuestion: 0
  });

  const translations = useMemo(() => I18N[language] || I18N.es, [language]);

  const sessionTexts = useMemo(() => {
    const pool = I18N[language] || I18N.es;
    return {
      greeting: pool.greetings[textIndices.greeting % pool.greetings.length] || pool.greetings[0],
      askName: pool.sessionTexts?.askName || pool.ask_names[textIndices.askName % pool.ask_names.length] || pool.ask_names[0],
      askBirthDate: pool.sessionTexts?.askBirthDate || "{name}, fecha...",
      waitMsg: pool.wait_messages[textIndices.waitMsg % pool.wait_messages.length] || pool.wait_messages[0],
      askReason: pool.sessionTexts?.askReason || pool.ask_reasons[textIndices.askReason % pool.ask_reasons.length] || pool.ask_reasons[0],
      askDichotomy: pool.ask_dichotomies[textIndices.askDichotomy % pool.ask_dichotomies.length] || pool.ask_dichotomies[0],
      askQuestion: pool.ask_questions[textIndices.askQuestion % pool.ask_questions.length] || pool.ask_questions[0]
    };
  }, [language, textIndices]);

  // Recalculate random indices whenever we enter the threshold phase OR language changes
  useEffect(() => {
    if (phase === 'threshold' || phase === 'languageSelection') {
      const pool = I18N[language] || I18N.es;
      setTextIndices({
        greeting: Math.floor(Math.random() * pool.greetings.length),
        askName: Math.floor(Math.random() * pool.ask_names.length),
        waitMsg: Math.floor(Math.random() * pool.wait_messages.length),
        askReason: Math.floor(Math.random() * pool.ask_reasons.length),
        askDichotomy: Math.floor(Math.random() * pool.ask_dichotomies.length),
        askQuestion: Math.floor(Math.random() * pool.ask_questions.length)
      });
    }
  }, [language, phase]);

  const [vibe, setVibe] = useState('healing_blue');
  const [selectedCards, setSelectedCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState(null);
  const [introspectionMessage, setIntrospectionMessage] = useState('');
  const [isFading, setIsFading] = useState(false);
  
  const [showSynchronyPopup, setShowSynchronyPopup] = useState(false);
  const [isPopupFading, setIsPopupFading] = useState(false);

  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [isInfoFading, setIsInfoFading] = useState(false);

  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [clarifications, setClarifications] = useState({});
  
  const [revealedStage, setRevealedStage] = useState(0); // 0: overview, 1: card1, 2: card2, 3: card3
  const [thresholdStep, setThresholdStep] = useState(0); // 0: intro, 1: name, 2: reason, 3: dichotomy, 4: question
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [birthNarrative, setBirthNarrative] = useState(null);
  const [visitReason, setVisitReason] = useState('');
  const [dichotomousChoice, setDichotomousChoice] = useState('');
  const [cardsFlippedCount, setCardsFlippedCount] = useState(0);
  const [autoRevealStarted, setAutoRevealStarted] = useState(false);
  const [revelationReady, setRevelationReady] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [creditFlash, setCreditFlash] = useState(null); // { amount: -40, id: n }
  const [synthEmailState, setSynthEmailState] = useState('idle'); // idle | sending | sent | error
  const [deepeningActive, setDeepeningActive] = useState(null); // cardId while loading deepening
  const [anchoringLoading, setAnchoringLoading] = useState(false);
  const [consultTier, setConsultTier] = useState(null); // null | 'standard' | 'full'
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  
  const [isMutedState, setIsMutedState] = useState(false);
  const [lastDebug, setLastDebug] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // ── Auth & Credits ─────────────────────────────────────
  const [authUser,          setAuthUser]          = useState(null);
  const [authSession,       setAuthSession]       = useState(null);
  const [credits,           setCredits]           = useState(null);
  const [referralCode,      setReferralCode]      = useState(null);
  const [urlRef,            setUrlRef]            = useState(null);
  const [consultCount,      setConsultCount]      = useState(0);

  // ── Modal visibility ───────────────────────────────────
  const [showAuthModal,      setShowAuthModal]      = useState(false);
  const [showPurchaseModal,  setShowPurchaseModal]  = useState(false);
  const [showReferralWidget, setShowReferralWidget] = useState(false);
  const [purchaseReason,     setPurchaseReason]     = useState('');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentIsVerifying, setPaymentIsVerifying] = useState(false);
  const [paymentCredits,     setPaymentCredits]     = useState(0);
  const [pendingAction,      setPendingAction]      = useState(null);

  // Refrescar créditos cuando la ventana recupera el foco (ej: al volver de Stripe)
  useEffect(() => {
    const handleFocus = async () => {
      if (!authSession) return;
      const bal = await fetchBalance(authSession);
      if (bal !== null) setCredits(bal);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [authSession]);

  useEffect(() => {
    initSpeech(language);
    return () => { stopSpeech(); stopAmbient(); };
  }, [language]);

  useEffect(() => {
    const deck = [...cardsData];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setShuffledDeck(deck);
  }, []);

  useEffect(() => {
    if (phase === 'revelation' && !loading && revelationReady) {
      if (cardsFlippedCount < 3) {
        const timer = setTimeout(() => {
          setCardsFlippedCount(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (!autoRevealStarted) {
        setAutoRevealStarted(true); // marks the end of the reveal sequence
      }
    }
  }, [phase, loading, cardsFlippedCount, autoRevealStarted, revelationReady]);

  useEffect(() => {
    if (phase === 'revelation' && !loading) {
      const timer = setTimeout(() => {
        setRevelationReady(true);
      }, Math.floor(Math.random() * 2000) + 3000);
      return () => clearTimeout(timer);
    } else {
      setRevelationReady(false);
    }
  }, [phase, loading]);

  // ── Auth: inicializar sesión, URL params, listener ───────
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const ref       = params.get('ref');
    const verified  = params.get('verified');
    const payment   = params.get('payment');
    const creditsPurchased = parseInt(params.get('credits') || '0', 10);
    const stripeSessionId  = params.get('sid');

    if (ref) setUrlRef(ref);

    // ── 1. Detectar retorno de Stripe INMEDIATAMENTE (sin esperar sesión) ──

    // Función reutilizable para restaurar estado guardado
    const restoreSnapshot = () => {
      try {
        const snapshot = sessionStorage.getItem('zoltar_purchase_snapshot');
        if (!snapshot) return null;
        const s = JSON.parse(snapshot);
        if (s.language)              setLanguage(s.language);
        if (s.phase)                 setPhase(s.phase);
        if (s.userName)              setUserName(s.userName);
        if (s.birthDate)             setBirthDate(s.birthDate);
        if (s.birthNarrative)        setBirthNarrative(s.birthNarrative);
        if (s.visitReason)           setVisitReason(s.visitReason);
        if (s.dichotomousChoice)     setDichotomousChoice(s.dichotomousChoice);
        if (s.thresholdStep)         setThresholdStep(s.thresholdStep);
        if (s.selectedCards?.length) setSelectedCards(s.selectedCards);
        if (s.interpretation)        setInterpretation(s.interpretation);
        if (s.introspectionMessage)  setIntrospectionMessage(s.introspectionMessage);
        if (s.clarifications)        setClarifications(s.clarifications);
        if (s.revealedStage)         setRevealedStage(s.revealedStage);
        if (s.consultCount)          setConsultCount(s.consultCount);
        if (s.autoRevealStarted)     setAutoRevealStarted(s.autoRevealStarted);
        // Restaurar canProceed para fases que necesitan el botón inmediatamente
        if (s.phase === 'portalEntrance' || s.phase === 'revelation') setCanProceed(true);
        sessionStorage.removeItem('zoltar_purchase_snapshot');
        return s;
      } catch(e) { console.warn('State restore error:', e); return null; }
    };

    if (payment === 'success') {
      setPaymentCredits(creditsPurchased);
      setPaymentIsVerifying(true);
      setShowPaymentSuccess(true);

      // Timer de seguridad: cierra el spinner en 6s pase lo que pase
      setTimeout(() => setPaymentIsVerifying(false), 6000);

      restoreSnapshot();

      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname + (ref ? `?ref=${ref}` : ''));
    }

    if (payment === 'cancelled') {
      restoreSnapshot();
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname + (ref ? `?ref=${ref}` : ''));
    }

    if (!supabase) {
      // Sin Supabase: resolver modal de inmediato si venía de pago
      if (payment === 'success') setPaymentIsVerifying(false);
      return;
    }

    // ── 2. Helpers de sesión ──────────────────────────────────
    const loadProfile = async (session) => {
      if (!supabase) return;
      const bal = await fetchBalance(session);
      setCredits(bal);
      const { data: profile } = await supabase
        .from('profiles').select('referral_code').eq('id', session.user.id).single();
      if (profile?.referral_code) setReferralCode(profile.referral_code);
      return bal;
    };

    // ── 3. Listener de cambios de auth ────────────────────────
    let subscription = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        setAuthSession(session);
        setAuthUser(session?.user || null);
        if (session) {
          if (event === 'SIGNED_IN') await initializeProfile(session, ref || '', false);
          await loadProfile(session);
        } else {
          setCredits(null);
          setReferralCode(null);
        }
      });
      subscription = data.subscription;
    }

    // ── 4. Sesión inicial + polling de créditos post-pago ─────
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          setAuthSession(session);
          setAuthUser(session.user);
          if (verified === '1') await initializeProfile(session, ref || '', true);
          await loadProfile(session);

          if (payment === 'success') {
            // Espera 4s (webhook suele llegar en 1-3s), refresca saldo y cierra spinner.
            // Si el webhook falló, verify-purchase acredita los créditos directamente.
            const refreshAndClose = async (delay) => {
              await new Promise(r => setTimeout(r, delay));
              try {
                if (stripeSessionId) {
                  const vr = await fetch('/api/verify-purchase', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ sessionId: stripeSessionId }),
                  });
                  const vd = await vr.json();
                  if (vd.credits != null) { setCredits(vd.credits); setPaymentIsVerifying(false); return; }
                }
                const bal = await fetchBalance(session);
                if (bal !== null) setCredits(bal);
              } catch(e) { /* no-op */ }
              setPaymentIsVerifying(false);
            };
            refreshAndClose(4000);
          }
        } else if (payment === 'success') {
          // Sin sesión: cerrar spinner después de 4s igual
          setTimeout(() => setPaymentIsVerifying(false), 4000);
        }

        if (verified) {
          window.history.replaceState({}, '', window.location.pathname + (ref ? `?ref=${ref}` : ''));
        }
      }).catch((err) => {
        console.warn('[Auth] getSession error:', err);
        // El timer de seguridad ya se encargará de cerrar el spinner
      });
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeProfile = async (session, refCode = '', isNewRegistration = false) => {
    try {
      await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'initialize', referralCode: refCode, isNewRegistration }),
      });
    } catch (e) { console.error('initializeProfile error:', e); }
  };

  const handlePostAuth = useCallback(async (session) => {
    setAuthSession(session);
    setAuthUser(session.user);
    if (supabase) {
      // onAuthStateChange ya llama initializeProfile en SIGNED_IN — no duplicar aquí
      const bal = await fetchBalance(session);
      setCredits(bal);
      const { data: profile } = await supabase
        .from('profiles').select('referral_code').eq('id', session.user.id).single();
      if (profile?.referral_code) setReferralCode(profile.referral_code);
    }
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      if (action.type === 'start_consultation') {
        setTimeout(() => _doEnterPortal(), 300);
      } else if (action.type === 'unlock' || action.type === 'purchase_reading') {
        // Re-abrir UnlockModal — ahora el usuario está autenticado y puede elegir tier
        setShowUnlockModal(true);
      }
      // 'deepening': el botón sigue visible en la fase revelation; el usuario lo pulsa de nuevo
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction, urlRef]);

  // Lógica interna de entrada al portal (sin gate)
  const _doEnterPortal = useCallback(() => {
    initSpeech(language);
    startAmbientMusic();
    setIsFading(true);
    setTimeout(() => {
      setPhase('threshold');
      setIsFading(false);
      setTimeout(() => {
        setCanProceed(false);
        speakText(sessionTexts.greeting, language, () => setCanProceed(true));
      }, 600);
    }, Math.floor(Math.random() * 2000) + 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, sessionTexts]);

  // Portal es libre — sin cobro ni verificación de créditos
  const handleEnterPortalGated = useCallback(() => {
    _doEnterPortal();
  }, [_doEnterPortal]);

  const flashCredit = useCallback((amount) => {
    setCreditFlash({ amount, id: Date.now() });
    setTimeout(() => setCreditFlash(null), 2000);
  }, []);

  // Guarda el estado de la consulta en sessionStorage antes de redirigir a Stripe
  const saveStateForPurchase = useCallback(() => {
    try {
      const snapshot = {
        phase, language, selectedCards, userName, birthDate, birthNarrative,
        visitReason, dichotomousChoice, thresholdStep,
        interpretation, introspectionMessage, clarifications,
        revealedStage, consultCount, autoRevealStarted,
      };
      sessionStorage.setItem('zoltar_purchase_snapshot', JSON.stringify(snapshot));
    } catch(e) { console.warn('State save error:', e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, language, selectedCards, userName, birthDate, visitReason,
      dichotomousChoice, thresholdStep, interpretation, introspectionMessage,
      clarifications, revealedStage, consultCount, autoRevealStarted, birthNarrative]);

  const handleSendSynthesis = async () => {
    if (!authSession || synthEmailState !== 'idle') return;
    if ((credits ?? 0) < CREDIT_COSTS.synthesis_email) {
      setPurchaseReason(`Necesitas ${CREDIT_COSTS.synthesis_email} créditos para enviar la síntesis.`);
      setShowPurchaseModal(true);
      return;
    }
    setSynthEmailState('sending');
    try {
      const res = await fetch('/api/send-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
        body: JSON.stringify({ language, userName, selectedCards, interpretation, clarifications, birthNarrative }),
      });
      const data = await res.json();
      if (res.ok) {
        setCredits(data.credits);
        flashCredit(-CREDIT_COSTS.synthesis_email);
        setSynthEmailState('sent');
      } else if (data.error === 'insufficient_credits') {
        setPurchaseReason(`Créditos insuficientes. Necesitas ${CREDIT_COSTS.synthesis_email}.`);
        setShowPurchaseModal(true);
        setSynthEmailState('idle');
      } else {
        const detail = data.resend_error || data.error || 'Error desconocido';
        console.error('[synthesis email] API error:', data);
        alert(`Error al enviar el correo:\n${detail}`);
        if (data.credits !== undefined) setCredits(data.credits);
        setSynthEmailState('error');
      }
    } catch (e) {
      setSynthEmailState('error');
    }
  };

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    setPhase('portalEntrance');
    setCanProceed(false);
    trackEvent('session_started', { language: lang, is_guest: !authSession }, authSession);
    const welcomeMsg = I18N[lang].greetings[Math.floor(Math.random() * I18N[lang].greetings.length)];
    speakText(welcomeMsg, lang, () => setCanProceed(true));
  };

  const handleStart = () => {
    setConsultTier(null);
    setIsFading(true);
    speakText(sessionTexts.askName, language);
    setTimeout(() => {
      setThresholdStep(1);
      setIsFading(false);
    }, Math.floor(Math.random() * 2000) + 3000);
  };

  const handleNextThreshold = () => {
    if (thresholdStep === 1 && !userName) return alert(translations.ui.your_name_placeholder);
    if (thresholdStep === 2) {
      const { day, month, year } = birthDate;
      if (!day || !month || !year) return alert(translations.ui.birthdate_placeholder || 'Ingresa tu fecha de nacimiento completa');
      const d = Number(day), m = Number(month), y = Number(year);
      if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear())
        return alert('Fecha inválida. Verifica día (1-31), mes (1-12) y año.');
      // Generar narrativa astrológica una sola vez
      const narrative = generateBirthNarrative(d, m, y, language);
      setBirthNarrative(narrative);
    }
    if (thresholdStep === 3 && !visitReason) return alert(translations.ui.what_inquires_you);
    
    setIsFading(true);
    
    // Narradores
    setCanProceed(false);
    if (thresholdStep === 1) {
      speakText(sessionTexts.askBirthDate.replace('{name}', userName), language, () => setCanProceed(true));
    } else if (thresholdStep === 2) {
      speakText(sessionTexts.askReason.replace('{name}', userName), language, () => setCanProceed(true));
    } else if (thresholdStep === 3) {
      speakText(sessionTexts.askDichotomy, language, () => setCanProceed(true));
    } else if (thresholdStep === 4) {
      speakText(sessionTexts.askQuestion, language);
    }

    setTimeout(() => {
      if (thresholdStep < 5) {
        setThresholdStep(thresholdStep + 1);
      } else {
        setPhase('synchrony');
        setVibe('revelation_gold');
        setShowSynchronyPopup(true);
        setCanProceed(false);
        speakText(translations.ui.call_p1.replace(/"/g, ''), language, () => setCanProceed(true));
      }
      setIsFading(false);
    }, Math.floor(Math.random() * 2000) + 3000); 
  };

  const handleSelectCard = (card) => {
    if (loading) return; // Prevent selection during transition
    const isAlreadySelected = selectedCards.find(c => c.id === card.id);
    if (isAlreadySelected) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleGoToAstralAlignment = async () => {
    setLoading(true);
    setVibe('karmic_red'); 
    speakText(sessionTexts.waitMsg, language);
    try {
       const bdStr = birthDate.day ? `${birthDate.day}/${birthDate.month}/${birthDate.year}` : '';
       const userContext = { name: userName, birthDate: bdStr, reason: visitReason };
       const result = await generateIntrospection(selectedCards, null, userContext, language);
       setIntrospectionMessage(result.mensajeAstral || result.mensajeGuia); // Backward compatible
       setInterpretation(prev => ({...prev, constelacion: result.nombreConstelacion }));
       setPhase('astral_alignment');
       setLoading(false);
       setVibe('healing_blue');
       setCanProceed(false);
       if (result.__IS_FALLBACK__) {
         setLastDebug(result._debug || { error: "FALLBACK TRIGGERED (Astral failed)" });
         setShowDebug(true);
       }
       speakText(result.mensajeAstral || result.mensajeGuia, language, () => setCanProceed(true));
    } catch (error) {
       console.error("Astral Error:", error);
       setIntrospectionMessage(translations.ui.oracle_misfire);
       setPhase('astral_alignment');
       setLoading(false);
       setVibe('healing_blue');
    }
  };


  const handleStartRevelation = async ({ introspectionAnswer = '' } = {}) => {
    setLoading(true);
    setVibe('karmic_red'); 
    speakText(sessionTexts.waitMsg, language);
    
    setTimeout(async () => {
      setPhase('revelation');
      setRevealedStage(0);
      setCardsFlippedCount(0);
      setAutoRevealStarted(false);
      setConsultTier(null);
      trackEvent('revelation_viewed', {
        cards: selectedCards.map(c => c.id),
        language,
        is_guest: !authSession,
      }, authSession);

      try {
        const bdStr2 = birthDate.day ? `${birthDate.day}/${birthDate.month}/${birthDate.year}` : '';
        const userContext = { name: userName, birthDate: bdStr2, reason: visitReason, preference: dichotomousChoice, introspectionAnswer, tier: 'ancestral_ritual' };

        // Fetch the full (ancestral) interpretation once — both standard and full tiers unblur this same text
        const result = await interpretCards(selectedCards, visitReason, null, userContext, language);
        setInterpretation({
          ...result,
          decreto: result.decreto || translations.ui.default_decree,
          tarea_terrenal: result.tarea_terrenal || translations.ui.default_task
        });

        setConsultTier(null); // It's free but blurred
        setVibe(result.vibe || 'healing_blue');
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener revelación:", error);
        setInterpretation({
          narrativaAncestral: [translations.ui.oracle_misfire, translations.ui.oracle_misfire, translations.ui.oracle_misfire],
          conclusionFinal: translations.ui.oracle_misfire,
          decreto: translations.ui.default_decree,
          tarea_terrenal: translations.ui.default_task,
          vibe: 'healing_blue'
        });
        setLoading(false);
      }
    }, Math.floor(Math.random() * 2000) + 3000); 
  };

  const handlePurchaseReading = async (tier = 'consultation') => {
    if (!authSession) {
      setPendingAction({ type: 'purchase_reading', tier });
      setShowAuthModal(true);
      return;
    }
    
    const cost = CREDIT_COSTS[tier];
    if ((credits ?? 0) < cost) {
      setPurchaseReason(`Necesitas ${cost} créditos para esta lectura profunda. Tienes ${credits ?? 0}.`);
      setShowPurchaseModal(true);
      return;
    }

    setLoading(true);
    setVibe('karmic_red');
    speakText(sessionTexts.waitMsg, language);

    try {
      const resultDeduct = await deductCredits(authSession, tier);
      if (!resultDeduct.ok) {
        setLoading(false);
        setVibe('healing_blue');
        const errMsg = resultDeduct.error === 'insufficient_credits'
          ? `Créditos insuficientes (tienes ${resultDeduct.credits ?? 0}, necesitas ${cost}).`
          : `Error al descontar créditos: ${resultDeduct.error || 'desconocido'}`;
        alert(errMsg);
        return;
      }
      setCredits(resultDeduct.credits);
      flashCredit(-cost);

      if (tier === 'consultation') {
        // Standard reading already exists from the preview, just unblur it
        setConsultTier('standard');
        setLoading(false);
        setVibe(interpretation?.vibe || 'healing_blue');
        speakText(interpretation.narrativaAncestral[revealedStage - 1], language, () => setCanProceed(true));
        return;
      }

      // Fetch Full Interpretation for Ancestral Ritual
      const bdStr2 = birthDate.day ? `${birthDate.day}/${birthDate.month}/${birthDate.year}` : '';
      const userContext = {
        name: userName,
        birthDate: bdStr2,
        reason: visitReason,
        preference: dichotomousChoice,
        tier
      };

      const result = await interpretCards(selectedCards, visitReason, null, userContext, language);
      setInterpretation({
        ...result,
        decreto: result.decreto || translations.ui.default_decree,
        tarea_terrenal: result.tarea_terrenal || translations.ui.default_task
      });

      setConsultTier('full');
      setVibe(result.vibe || 'healing_blue');
      setLoading(false);
      
      // Speak the new interpretation for the current stage
      speakText(result.narrativaAncestral[revealedStage - 1], language, () => setCanProceed(true));
      
    } catch (error) {
      console.error("Error en la lectura pagada:", error);
      setLoading(false);
      setVibe('healing_blue');
    }
  };

  const handleUnlock = async (tier) => {
    if (!authSession) {
      setPendingAction({ type: 'unlock', tier });
      setShowAuthModal(true);
      return;
    }

    const creditKey = tier === 'full' ? 'ancestral_ritual' : 'consultation';
    const cost = CREDIT_COSTS[creditKey];

    if ((credits ?? 0) < cost) {
      setPurchaseReason(`Necesitas ${cost} créditos. Tienes ${credits ?? 0}.`);
      setShowPurchaseModal(true);
      return;
    }

    setShowUnlockModal(false);
    setLoading(true);
    setVibe('karmic_red');
    speakText(sessionTexts.waitMsg, language);

    let resultDeduct;
    try {
      resultDeduct = await deductCredits(authSession, creditKey);
    } catch (e) {
      setLoading(false);
      setVibe('healing_blue');
      alert(`Error al procesar el pago: ${e.message}`);
      return;
    }
    if (!resultDeduct.ok) {
      setLoading(false);
      setVibe('healing_blue');
      const errMsg = resultDeduct.error === 'insufficient_credits'
        ? `Créditos insuficientes (tienes ${resultDeduct.credits ?? 0}, necesitas ${cost}).`
        : `Error al descontar créditos: ${resultDeduct.error || 'desconocido'}`;
      alert(errMsg);
      return;
    }
    setCredits(resultDeduct.credits);
    flashCredit(-cost);

    setConsultTier(tier);
    setLoading(false);

    if (revealedStage > 0) {
      const fullText = Array.isArray(interpretation.narrativaAncestral)
        ? interpretation.narrativaAncestral[revealedStage - 1]
        : interpretation.narrativaAncestral;
      speakText(fullText, language, () => setCanProceed(true));
    }

    trackEvent('reading_unlocked', { tier, credits_spent: cost }, authSession);
  };

  const handleNextStage = async () => {
    // Reembolsar 10 créditos si el usuario inició profundización pero avanza sin usarla
    if (revealedStage > 0 && revealedStage <= 3 && authSession && supabase) {
      const currentCardId = selectedCards[revealedStage - 1]?.id;
      const clar = clarifications[currentCardId];
      if (clar && clar.step === 'question') {
        // La profundización fue iniciada (pagada) pero no completada — reembolsar
        const refundResult = await refundCredits(authSession, CREDIT_COSTS.deepening, 'deepening_unused');
        if (refundResult.ok) {
          setCredits(refundResult.credits);
          flashCredit(+CREDIT_COSTS.deepening);
          // Limpiar la profundización abandonada
          setClarifications(prev => { const next = { ...prev }; delete next[currentCardId]; return next; });
        }
      }
    }

    if (revealedStage < 3) {
      setIsFading(true);
      setTimeout(() => {
        const nextStage = revealedStage + 1;
        setRevealedStage(nextStage);
        setIsFading(false);
        
        // Speak the new reading
        if (interpretation && interpretation.narrativaAncestral) {
          const textToRead = Array.isArray(interpretation.narrativaAncestral) 
            ? interpretation.narrativaAncestral[nextStage - 1] 
            : interpretation.narrativaAncestral;
            
          let prefix = "";
          if (nextStage === 1) prefix = translations.ui.origin_karmic + ". ";
          if (nextStage === 2) prefix = translations.ui.present_blockage + ". ";
          if (nextStage === 3) prefix = translations.ui.healing_advice + ". ";
          const audioText = consultTier !== null
            ? prefix + textToRead
            : prefix + textToRead.split('. ')[0] + '.';
          setCanProceed(false);
          speakText(audioText, language, () => setCanProceed(true));
        }
      }, Math.floor(Math.random() * 2000) + 3000);
    } else {
      // Ir al anclaje sin delay — el texto aparece con animación CSS
      setPhase('anchoring');
      setAnchoringLoading(true);
      setIsFading(false);
      generateAnchoring(selectedCards, visitReason, dichotomousChoice, userName, clarifications, null, language)
        .then(finalSynthesis => {
          setInterpretation(prev => ({
            ...prev,
            ...finalSynthesis,
            decreto: finalSynthesis.decreto || prev.decreto || translations.ui.default_decree,
            tarea_terrenal: finalSynthesis.tarea_terrenal || prev.tarea_terrenal || translations.ui.default_task
          }));
          if (finalSynthesis.__IS_FALLBACK__) {
            setLastDebug(finalSynthesis._debug || { error: "FALLBACK TRIGGERED (Anchoring failed)" });
            setShowDebug(true);
          }
          // Small pause so the transition from loading to content feels ceremonial
          setTimeout(() => {
            setAnchoringLoading(false);
            const synthText = consultTier !== null
              ? `${translations.ui.great_synthesis.replace('{name}', userName)} ${finalSynthesis.conclusionFinal || ''} ${translations.ui.healing_decree}: ${finalSynthesis.decreto || translations.ui.default_decree}. ${translations.ui.earthly_task}: ${finalSynthesis.tarea_terrenal || translations.ui.default_task}`
              : `${translations.ui.great_synthesis.replace('{name}', userName)} ${(finalSynthesis.conclusionFinal || '').split('. ')[0]}.`;
            speakText(synthText, language);
          }, 500);
        })
        .catch(error => {
          console.error("Anchoring failed:", error);
          setAnchoringLoading(false);
          setInterpretation(prev => ({
            ...prev,
            conclusionFinal: translations.ui.oracle_misfire,
            decreto: translations.ui.default_decree,
            tarea_terrenal: translations.ui.default_task
          }));
        });
    }
  };

  // -------------- DEEPENING FLOW HANDLERS --------------
  const initDeepening = async (cardId) => {
    // Full tier: deepening gratis para las 3 cartas
    if (consultTier === 'full') {
      setClarifications(prev => ({
        ...prev,
        [cardId]: { step: 'question', question: '', extraCard: null, extraResponse: '' }
      }));
      return;
    }

    if (supabase) {
      if (!authSession) {
        setPendingAction({ type: 'deepening', cardId });
        setShowAuthModal(true);
        return;
      }
      const cost = CREDIT_COSTS.deepening;
      const currentCredits = credits ?? 0;
      if (currentCredits < cost) {
        setPurchaseReason(`Necesitas ${cost} créditos para profundizar esta carta. Tienes ${currentCredits}.`);
        setShowPurchaseModal(true);
        return;
      }
      const result = await deductCredits(authSession, 'deepening');
      if (!result.ok) {
        if (result.error === 'insufficient_credits') {
          setPurchaseReason(`Créditos insuficientes para profundizar.`);
          setShowPurchaseModal(true);
        }
        return;
      }
      setCredits(result.credits);
      flashCredit(-CREDIT_COSTS.deepening);
    }
    setClarifications(prev => ({
      ...prev,
      [cardId]: { step: 'question', question: '', extraCard: null, extraResponse: '' }
    }));
  };

  const submitDeepenQuestion = (cardId, questionText) => {
    if (!questionText.trim()) return alert(translations.ui.revelation_confession);
    setIsFading(true);
    speakText(translations.ui.deepen_loading, language);
    setTimeout(() => {
      setClarifications(prev => ({
        ...prev,
        [cardId]: { ...prev[cardId], question: questionText, step: 'selectCard' }
      }));
      setIsFading(false);
    }, Math.floor(Math.random() * 2000) + 3000);
  };

  const submitDeepenCardSelect = async (cardId, extraCard) => {
    // Step 1: Show oracle-thinking overlay immediately (clear screen, show blinking message)
    setDeepeningActive(cardId);
    setClarifications(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], extraCard, step: 'loading' }
    }));
    speakText(translations.ui.deepen_loading, language);

    // Wait 4-5 seconds (ceremonial pause), then call API
    const ceremonyDelay = Math.floor(Math.random() * 1000) + 4000;
    await new Promise(resolve => setTimeout(resolve, ceremonyDelay));

    const originalCard = selectedCards.find(c => c.id === cardId);
    const clarState = clarifications[cardId];
    if (originalCard && clarState) {
      try {
        const readingIndex = selectedCards.findIndex(c => c.id === cardId);
        const previousReadingText = interpretation?.narrativaAncestral 
          ? (Array.isArray(interpretation.narrativaAncestral) ? interpretation.narrativaAncestral[readingIndex] : interpretation.narrativaAncestral)
          : '';
        
        const resp = await generateDeepening(originalCard, extraCard, clarState.question, previousReadingText, {userName}, null, language);
        
        const finalResponse = resp === "misfire" ? translations.ui.oracle_misfire : resp;

        // Step 2: Hide overlay, show result with fade-in animation
        setDeepeningActive(null);
        setClarifications(prev => ({
          ...prev,
          [cardId]: { ...prev[cardId], extraResponse: finalResponse, step: 'done' }
        }));
        if (resp.__IS_FALLBACK__) {
          setLastDebug(resp._debug || { error: "FALLBACK TRIGGERED (Deepening failed)" });
          setShowDebug(true);
        }
        // Voice reads: only the deepening whisper
        speakText(`${translations.ui.deepen_subtitle}. ${finalResponse}`, language);
      } catch (e) {
        console.error("Deepening failed:", e);
        setDeepeningActive(null);
        setClarifications(prev => ({
          ...prev,
          [cardId]: { ...prev[cardId], extraResponse: translations.ui.oracle_misfire, step: 'done' }
        }));
        speakText(`${translations.ui.deepen_subtitle}. ${translations.ui.oracle_misfire}`, language);
      }
    }
  };

  return (
    <div className="app-container">
      <VortexCanvas vibe={vibe} />
      
      {/* Global Logo - Persistent unless in specific high-z-index phases */}
      {phase !== 'languageSelection' && phase !== 'portalEntrance' && <div className="global-logo" />}

      {!language ? (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'transparent', backdropFilter: 'blur(30px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{ width: '280px', height: '150px', backgroundImage: "url('/zoltar-logo.jpg')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', marginBottom: '20px', mixBlendMode: 'screen' }} />
          <h2 style={{color: '#ffd700', letterSpacing: '3px', marginBottom: '45px', textTransform: 'uppercase', fontSize: '1.8rem', textAlign: 'center'}}>{I18N.es.ui.title}</h2>
          <div className="language-buttons">
            <button className="language-button" onClick={() => handleSelectLanguage('es')}>
              <span className="flag-icon">🇪🇸</span> ESPAÑOL
            </button>
            <button className="language-button" onClick={() => handleSelectLanguage('en')}>
              <span className="flag-icon">🇺🇸</span> ENGLISH
            </button>
            <button className="language-button" onClick={() => handleSelectLanguage('pt')}>
              <span className="flag-icon">🇧🇷</span> PORTUGUÊS
            </button>
          </div>
        </div>
      ) : phase === 'portalEntrance' ? (
        <div className="portal-entrance-content transparent-layer" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh'
        }}>
          <p className="welcome-text">
            <TypewriterText text={`"${sessionTexts.greeting}"`} speed={45} />
          </p>
          {canProceed && (
            <button className="start-button blinking-button action-button-reveal" onClick={handleEnterPortalGated}>
              {translations.ui.enter_portal}
            </button>
          )}
        </div>
      ) : null}

      {/* Botón Silenciar Global */}
      <button
        onClick={() => setIsMutedState(toggleMute())}
        title={isMutedState ? translations.ui.unmute : translations.ui.mute}
        style={{
          position: 'fixed', top: '25px', right: '25px', zIndex: 9999,
          background: 'rgba(20,22,28,0.8)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '50%',
          width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center',
          cursor: 'pointer', color: '#ffd700', fontSize: '1.4rem', boxShadow: '0 0 15px rgba(0,0,0,0.8)'
        }}
      >
        {isMutedState ? '🔇' : '🔊'}
      </button>

      {/* Modal de pago exitoso */}
      <PaymentSuccessModal
        isOpen={showPaymentSuccess}
        purchasedCredits={paymentCredits}
        newBalance={credits}
        isVerifying={paymentIsVerifying}
        language={language || 'es'}
        onContinue={async () => {
          setShowPaymentSuccess(false);
          if (authSession) {
            const bal = await fetchBalance(authSession);
            if (bal !== null) setCredits(bal);
          }
        }}
      />

      {/* Widget de créditos */}
      <CreditWidget
        user={authUser}
        credits={credits}
        flash={creditFlash}
        onBuy={() => { setPurchaseReason(''); setShowPurchaseModal(true); }}
        onShare={() => setShowReferralWidget(true)}
        onRefresh={async () => {
          if (!authSession) return;
          const bal = await fetchBalance(authSession);
          if (bal !== null) setCredits(bal);
        }}
        onLogout={() => {
          // Limpiar sesión de Supabase sin esperar respuesta
          supabase?.auth.signOut().catch(() => {});
          // Eliminar tokens del localStorage directamente
          const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
          keys.forEach(k => localStorage.removeItem(k));
          window.location.reload();
        }}
      />

      {/* Main Content Wrapper with profound fade transitions */}
      <div style={{ 
        width: '100%', 
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        opacity: isFading ? 0 : 1, 
        transition: 'opacity 1.5s ease-in-out' 
      }}>

      {phase === 'threshold' && (
        <div className="threshold-content">
          {thresholdStep === 0 && (
            <>
              <p className="welcome-text">
                <TypewriterText text={`"${sessionTexts.greeting}"`} speed={45} />
              </p>
              {canProceed && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {supabase && authSession && (
                    <p style={{ color: 'rgba(255,215,0,0.6)', fontSize: '0.82rem', letterSpacing: '1px', margin: 0 }}>
                      💎 {consultCount === 0 ? CREDIT_COSTS.consultation : CREDIT_COSTS.reconsultation} {translations.ui.credits_label || 'créditos'}
                    </p>
                  )}
                  <button className="start-button blinking-button action-button-reveal" onClick={handleStart}>
                    {translations.ui.allow}
                  </button>
                </div>
              )}
              
              <div style={{ marginTop: '30px' }}>
                <button 
                  style={{ background: 'transparent', border: 'none', color: '#ffd700', opacity: 0.5, fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer', fontStyle: 'italic', letterSpacing: '1px', transition: 'opacity 0.3s ease' }}
                  onMouseEnter={(e) => e.target.style.opacity = 0.9}
                  onMouseLeave={(e) => e.target.style.opacity = 0.5}
                  onClick={() => setShowInfoPopup(true)}
                >
                  {translations.ui.what_is_oracle}
                </button>
              </div>
            </>
          )}

          {thresholdStep === 1 && (
            <>
              <p className="welcome-text"><TypewriterText text={`"${sessionTexts.askName}"`} speed={45} /></p>
              <input 
                type="text" 
                className="soul-input" 
                placeholder={translations.ui.your_name_placeholder}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <button className="start-button" onClick={handleNextThreshold}>{translations.ui.continue}</button>
            </>
          )}

          {thresholdStep === 2 && (
            <>
              <p className="welcome-text"><TypewriterText text={`"${sessionTexts.askBirthDate.replace('{name}', userName)}"`} speed={45} /></p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '16px 0' }}>
                <input
                  type="number" className="soul-input birthdate-field"
                  placeholder={translations.ui.birthdate_day || 'DD'}
                  min="1" max="31" maxLength={2}
                  value={birthDate.day}
                  onChange={(e) => setBirthDate(prev => ({ ...prev, day: e.target.value }))}
                  style={{ width: '64px', textAlign: 'center' }}
                />
                <input
                  type="number" className="soul-input birthdate-field"
                  placeholder={translations.ui.birthdate_month || 'MM'}
                  min="1" max="12" maxLength={2}
                  value={birthDate.month}
                  onChange={(e) => setBirthDate(prev => ({ ...prev, month: e.target.value }))}
                  style={{ width: '64px', textAlign: 'center' }}
                />
                <input
                  type="number" className="soul-input birthdate-field"
                  placeholder={translations.ui.birthdate_year || 'AAAA'}
                  min="1900" max={new Date().getFullYear()} maxLength={4}
                  value={birthDate.year}
                  onChange={(e) => setBirthDate(prev => ({ ...prev, year: e.target.value }))}
                  style={{ width: '88px', textAlign: 'center' }}
                />
              </div>
              <button className="start-button" onClick={handleNextThreshold}>{translations.ui.continue}</button>
            </>
          )}

          {thresholdStep === 3 && (
            <>
              <p className="welcome-text"><TypewriterText text={`"${sessionTexts.askReason.replace('{name}', userName)}"`} speed={45} /></p>
              <input 
                type="text" 
                className="soul-input" 
                placeholder={translations.ui.what_inquires_you}
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
              />
              <button className="start-button" onClick={handleNextThreshold}>{translations.ui.continue}</button>
            </>
          )}

          {thresholdStep === 4 && (
            <>
              <p className="welcome-text"><TypewriterText text={`"${sessionTexts.askDichotomy}"`} speed={45} /></p>
              <div className="dichotomy-buttons">
                <button className={`choice-button ${dichotomousChoice === 'direct' ? 'selected' : ''}`} onClick={() => setDichotomousChoice('direct')}>{translations.ui.direct_truth}</button>
                <button className={`choice-button ${dichotomousChoice === 'metaphor' ? 'selected' : ''}`} onClick={() => setDichotomousChoice('metaphor')}>{translations.ui.metaphoric_whisper}</button>
              </div>
              <button className="start-button" onClick={handleNextThreshold} disabled={!dichotomousChoice}>{translations.ui.continue}</button>
            </>
          )}

          {thresholdStep === 5 && (
            <>
              <p className="welcome-text">
                <TypewriterText text={`"${sessionTexts.askQuestion}"`} speed={45} />
              </p>
              
              <button className="start-button" onClick={handleNextThreshold} style={{ marginTop: '2rem' }}>{translations.ui.choose_cards}</button>
            </>
          )}
        </div>
      )}

      {showInfoPopup && (
        <div className={`popup-overlay ${isInfoFading ? 'fade-out-text' : 'fade-in-text'}`} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="popup-box" style={{
             background: 'rgba(20,22,28,0.95)', padding: '50px', borderRadius: '20px',
             maxWidth: '90%', width: '500px', textAlign: 'center', border: '1px solid rgba(255,215,0,0.3)',
             boxShadow: '0 0 50px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,215,0,0.05)'
          }}>
            <h3 style={{color: '#ffd700', marginBottom: '20px', fontSize: '1.4rem', letterSpacing: '2px', textTransform: 'uppercase'}}>{translations.ui.info_popup_title}</h3>
            <p style={{fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic', color: '#b0b0b5', fontWeight: '300'}}>
              {translations.ui.info_popup_p1}
            </p>
            <p style={{fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '35px', fontStyle: 'italic', color: '#b0b0b5', fontWeight: '300'}}>
              {translations.ui.info_popup_p2}
            </p>
            <button className="start-button blinking-button" onClick={() => {
              setIsInfoFading(true);
              setTimeout(() => {
                setShowInfoPopup(false);
                setIsInfoFading(false);
              }, 800);
            }}>{translations.ui.understanding}</button>
          </div>
        </div>
      )}

      {showSynchronyPopup && phase === 'synchrony' && (
        <div className={`popup-overlay ${isPopupFading ? 'fade-out-text' : 'fade-in-text'}`} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="popup-box" style={{
             background: 'rgba(20,22,28,0.95)', padding: '50px', borderRadius: '20px',
             maxWidth: '500px', textAlign: 'center', border: '1px solid rgba(255,215,0,0.3)',
             boxShadow: '0 0 50px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,215,0,0.05)'
          }}>
            <h3 style={{color: '#ffd700', marginBottom: '20px', fontSize: '1.6rem', letterSpacing: '2px', textTransform: 'uppercase'}}>{translations.ui.call_title}</h3>
            <p style={{fontSize: '1.2rem', lineHeight: '1.8', marginBottom: '40px', fontStyle: 'italic', color: '#e0e0e0', fontWeight: '300'}}>
              {translations.ui.call_p1}
            </p>
            <button className="start-button blinking-button" onClick={() => {
              setIsPopupFading(true);
              setTimeout(() => {
                setShowSynchronyPopup(false);
                setIsPopupFading(false);
              }, 800);
            }}>{translations.ui.accept}</button>
          </div>
        </div>
      )}

      {phase === 'synchrony' && (
        <div className="synchrony-content">
          <h2 className="phase-title">{translations.ui.synchrony_title}</h2>
          <>
            <p className="subtitle" style={{ fontSize: '0.9rem', marginBottom: '30px' }}>{translations.ui.card_selection_subtitle} ({selectedCards.length}/3).</p>
            
            <div className="card-grid" style={{ position: 'relative' }}>
              <Dragonfly visible={true} />
              {shuffledDeck.map((card, index) => {
                const seed = index * 137.5;
                const spreadX = Math.sin(seed) * 40;
                const spreadY = Math.cos(seed) * 30;
                const rotation = Math.sin(seed * 2) * 18;
                
                return (
                  <Card 
                    key={card.id} 
                    card={card} 
                    isSelected={selectedCards.find(c => c.id === card.id)}
                    onSelect={handleSelectCard}
                    style={{
                      '--scatter-transform': `translate(${spreadX}px, ${spreadY}px) rotate(${rotation}deg)`
                    }}
                  />
                );
              })}
            </div>
            
            {selectedCards.length === 3 && (
              <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '100%', maxWidth: '300px' }}>
                <button className="start-button blinking-button" onClick={handleGoToAstralAlignment} disabled={loading} style={{ background: 'rgba(20,22,28,0.95)', padding: '15px 50px', boxShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.4)', display: 'block', margin: '0 auto', width: '100%' }}>
                  {translations.ui.continue}
                </button>
              </div>
            )}
          </>
        </div>
      )}

      {phase === 'astral_alignment' && (
        <div className="astral-content threshold-content">
          <h2 className="phase-title" style={{ fontSize: '1.5rem', color: '#c084fc' }}>
            {birthNarrative ? `${birthNarrative.symbol} ${birthNarrative.sign}` : (interpretation?.constelacion || '✦')}
          </h2>

          <div className="constellation-wrapper">
            <ConstellationCanvas seed={birthNarrative?.sign || interpretation?.constelacion || userName} />
          </div>

          {/* Narrativa astrológica basada en fecha de nacimiento */}
          {birthNarrative && (
            <div className="narrative-container" style={{ margin: '0 auto 10px auto', maxWidth: '620px' }}>
              <div className="brain-bubble narrative fade-in-text astral-bubble" style={{ borderLeftColor: '#a78bfa', background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(20,22,28,0))' }}>
                <p className="narrative-meta" style={{ color: '#c084fc', fontSize: '0.78rem', marginBottom: '8px', letterSpacing: '1px' }}>
                  ✦ {birthNarrative.element} · {birthNarrative.ruler} ✦
                </p>
                <p style={{ fontStyle: 'italic', lineHeight: '1.7', color: '#e5e4e7', margin: 0, fontSize: '0.93rem' }}>
                  <span className="reveal-text">{birthNarrative.narrative}</span>
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ marginTop: '20px' }}>
              <p className="welcome-text" style={{ fontSize: '1.2rem', animation: 'slowFadePulse 4s infinite ease-in-out', textAlign: 'center' }}>
                <TypewriterText text={sessionTexts.waitMsg} speed={45} showCursor={false} />
              </p>
              <p className="subtitle" style={{ textAlign: 'center' }}><TypewriterText text={translations.ui.wait_silence} speed={40} showCursor={false} /></p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '10px' }}>
                {introspectionMessage && (
                  <div className="narrative-container" style={{ margin: '0 auto 20px auto', maxWidth: '600px' }}>
                    <div className="brain-bubble narrative fade-in-text astral-bubble" style={{ borderLeftColor: '#c084fc' }}>
                      <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: '#e5e4e7', margin: 0 }}>
                        <span className="reveal-text">{introspectionMessage}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
 
              {canProceed && (
                <button className="start-button blinking-button fade-in-text" onClick={() => handleStartRevelation()} style={{ marginTop: '20px' }}>
                  {translations.ui.continue_to_revelation}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {phase === 'revelation' && (
        <div className="revelation-content">
          <h2 className="phase-title">{translations.ui.revelation_title}</h2>
          
          {/* === ORACLE THINKING OVERLAY for Deepening === */}
          {deepeningActive ? (
            <div className="oracle-thinking-overlay" style={{ animation: 'fadeIn 1s ease' }}>
              <p className="oracle-thinking-text">
                {translations.ui.oracle_thinking}
              </p>
            </div>
          ) : (() => {
            const clarifyingCardId = Object.keys(clarifications).find(id => clarifications[id]?.step === 'selectCard');
            
            if (clarifyingCardId) {
              return (
                <div style={{ animation: 'fadeIn 1s ease' }}>
                  <p className="subtitle" style={{ fontSize: '1.2rem', color: '#ffd700', marginBottom: '30px' }}>
                    {translations.ui.deepen_loading}
                  </p>
                  <div className="card-grid" style={{ position: 'relative' }}>
                    <Dragonfly visible={true} />
                    {shuffledDeck.map((c, i) => {
                      if (selectedCards.find(sc => sc.id === c.id)) return null; // Exclude already selected
                      
                      const seed = i * 137.5;
                      const spreadX = Math.sin(seed) * 40;
                      const spreadY = Math.cos(seed) * 30;
                      const rotation = Math.sin(seed * 2) * 18;
                      const isTentativelySelected = clarifications[clarifyingCardId]?.tentativeCard?.id === c.id;

                      return (
                        <Card 
                          key={c.id} 
                          card={c} 
                          isSelected={isTentativelySelected}
                          onSelect={() => setClarifications(prev => ({
                            ...prev,
                            [clarifyingCardId]: { ...prev[clarifyingCardId], tentativeCard: c }
                          }))}
                          style={{
                            '--scatter-transform': `translate(${spreadX}px, ${spreadY}px) rotate(${rotation}deg)`
                          }}
                          className={isTentativelySelected ? 'selected-card-glow' : ''}
                        />
                      );
                    })}
                  </div>
                  {clarifications[clarifyingCardId]?.tentativeCard && (
                    <div style={{ marginTop: '40px' }}>
                       <button className="start-button blinking-button" onClick={() => submitDeepenCardSelect(parseInt(clarifyingCardId), clarifications[clarifyingCardId].tentativeCard)}>
                        {translations.ui.continue}
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <>
                <div className="selected-cards-display" style={{ position: 'relative' }}>
                  <Dragonfly visible={cardsFlippedCount < 3} />
                  {selectedCards.map((card, index) => {
                    const clar = clarifications[card.id];
                    const cardI18n = translations.cards[card.id] || card;
                    const translatedCard = { ...card, name: cardI18n.name, info: cardI18n.info };
                    
                    return (
                    <div key={index} className={`revelation-card-block ${revealedStage === index + 1 ? 'active-reveal' : revealedStage > 0 ? 'dimmed' : ''}`} style={{ position: 'relative' }}>
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <Card card={translatedCard} isSelected={false} isFaceUp={cardsFlippedCount > index} />
                      </div>
                      
                      {clar?.extraCard && (
                        <div className="clarification-card-wrapper fade-in-text">
                          <Card card={{...clar.extraCard, name: translations.cards[clar.extraCard.id]?.name || clar.extraCard.name}} isSelected={false} isFaceUp={true} />
                        </div>
                      )}
                    </div>
                  )})}
                </div>
                
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <p className="welcome-text" style={{ marginTop: '20px', animation: 'slowFadePulse 4s infinite ease-in-out', textAlign: 'center' }}>
                      <TypewriterText text={sessionTexts.waitMsg} speed={45} showCursor={false} />
                    </p>
                  </div>
                ) : (
                  <>
                    {revealedStage > 0 && interpretation && (
                      <div className="narrative-container">
                        <div className="interpretation-bubbles" style={{ opacity: isFading ? 0 : 1, transition: 'opacity 1s ease-in-out' }}>
                           <div className="brain-bubble narrative" key={revealedStage}>
                            <p className="narrative-meta" style={{ color: '#ffd700', fontWeight: 'bold' }}>
                              {revealedStage === 1 && translations.ui.origin_karmic}
                              {revealedStage === 2 && translations.ui.present_blockage}
                              {revealedStage === 3 && translations.ui.healing_advice}
                            </p>
                            
                            <div style={{ marginBottom: '20px' }}>
                              {(() => {
                                const fullText = Array.isArray(interpretation.narrativaAncestral)
                                  ? interpretation.narrativaAncestral[revealedStage - 1]
                                  : interpretation.narrativaAncestral;

                                if (consultTier !== null) {
                                  return <span className="reveal-text">{fullText}</span>;
                                }

                                const split = splitFirstSentence(fullText);
                                if (!split) return <span className="reveal-text">{fullText}</span>;

                                return (
                                  <>
                                    <span className="reveal-text">{split.visible}</span>
                                    {' '}
                                    <span className="steamy-blur">{split.blurred}</span>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Unlock button for unpaid users */}
                            {consultTier === null && revealedStage >= 1 && (
                              <div className="fade-in-text" style={{ textAlign: 'center', marginTop: '16px' }}>
                                <p style={{ color: '#ffd700', fontSize: '0.8rem', marginBottom: '10px' }}>
                                  ✦ Primera revelación ✦
                                </p>
                                <button
                                  className="start-button blinking-button"
                                  style={{ fontSize: '0.82rem', padding: '10px 24px' }}
                                  disabled={loading}
                                  onClick={() => {
                                    setShowUnlockModal(true);
                                    trackEvent('unlock_modal_opened', { is_guest: !authSession }, authSession);
                                  }}
                                >
                                  🔓 Ver lectura completa
                                </button>
                              </div>
                            )}
                            
                            {/* Deepen logic per card - only show if paid */}
                            {consultTier !== null && (
                              <div className="deepen-box">
                                 {!clarifications[selectedCards[revealedStage-1].id] ? (
                                   canProceed && (
                                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                       {consultTier === 'standard' && (
                                         <p style={{ color: 'rgba(255,215,0,0.55)', fontSize: '0.75rem', margin: 0, letterSpacing: '1px' }}>
                                           💎 {CREDIT_COSTS.deepening} {translations.ui.credits_label || 'créditos'}
                                         </p>
                                       )}
                                       {consultTier === 'full' && (
                                         <p style={{ color: 'rgba(167,139,250,0.7)', fontSize: '0.75rem', margin: 0, letterSpacing: '1px' }}>
                                           ✦ Profundización incluida
                                         </p>
                                       )}
                                       <button className="start-button blinking-button" style={{ fontSize: '0.8rem', padding: '8px 20px'}} disabled={loading} onClick={() => initDeepening(selectedCards[revealedStage-1].id)}>
                                         {translations.ui.deepen_action || translations.ui.deepen}
                                       </button>
                                     </div>
                                   )
                                 ) : clarifications[selectedCards[revealedStage-1].id].step === 'question' ? (
                                   <div className="fade-in-text">
                                      <input 
                                        type="text" 
                                        className="soul-input" 
                                        style={{ fontSize: '0.9rem', marginBottom: '10px'}} 
                                        placeholder={translations.ui.revelation_confession}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') submitDeepenQuestion(selectedCards[revealedStage-1].id, e.target.value);
                                        }}
                                      />
                                      <p style={{ fontSize: '0.7rem', color: '#ffd700' }}>{translations.ui.press_enter}</p>
                                   </div>
                                 ) : clarifications[selectedCards[revealedStage-1].id].step === 'done' ? (
                                   <div style={{ animation: 'fadeIn 1.5s ease' }}>
                                     {/* Deepening whisper */}
                                     <div className="brain-bubble narrative" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(20,22,28,0) 100%)', border: '1px solid rgba(255,215,0,0.25)', borderLeft: '3px solid #ffd700', boxShadow: 'inset 0 0 20px rgba(255,215,0,0.05)' }}>
                                        <p className="narrative-meta" style={{ color: '#ffd700', fontSize: '0.8rem', marginBottom: '10px' }}>✦ {translations.ui.deepen_subtitle} ✦</p>
                                        <p style={{ fontSize: '0.95rem', fontStyle: 'italic' }}>
                                          <span className="reveal-text" style={{ animationDelay: '0.2s' }}>{clarifications[selectedCards[revealedStage-1].id].extraResponse}</span>
                                        </p>
                                     </div>
                                   </div>
                                 ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {autoRevealStarted && canProceed && (
                      <button
                        className="start-button blinking-button action-button-reveal"
                        onClick={handleNextStage}
                        disabled={loading}
                        style={{ marginTop: '30px' }}
                      >
                        {revealedStage < 3 
                          ? (translations.ui.continue_revelation || translations.ui.continue) 
                          : translations.ui.go_to_synthesis}
                      </button>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {phase === 'anchoring' && (
        <div className="anchoring-content" style={{ animation: 'fadeIn 2s ease' }}>
          <h2 className="phase-title">{translations.ui.anchoring_title}</h2>

          {/* === ORACLE THINKING OVERLAY for Final Synthesis === */}
          {anchoringLoading ? (
            <div className="oracle-thinking-overlay" style={{ animation: 'fadeIn 1.2s ease', margin: '40px 0' }}>
              <p className="oracle-thinking-text">
                {translations.ui.oracle_thinking}
              </p>
            </div>
          ) : interpretation && (
            <>
              <div className="selected-cards-display" style={{ marginBottom: '40px', marginTop: '20px' }}>
                {selectedCards.map((card, index) => {
                   const clar = clarifications[card.id];
                   const cardI18n = translations.cards[card.id] || card;
                   const translatedCard = { ...card, ...cardI18n };
                   
                   return (
                    <div key={index} className="revelation-card-block" style={{ padding: '15px', maxWidth: '160px', position: 'relative' }}>
                      <Card card={translatedCard} isSelected={false} isFaceUp={true} />
                      {clar?.extraCard && (
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', transform: 'rotate(10deg)', zIndex: 5 }}>
                          <Card card={{...clar.extraCard, ...(translations.cards[clar.extraCard.id] || clar.extraCard)}} isSelected={false} isFaceUp={true} />
                        </div>
                      )}
                    </div>
                   );
                })}
              </div>

              <div className="narrative-container">
                 <div className="brain-bubble narrative" style={{ borderLeftColor: '#ffd700', animation: 'fadeIn 2.5s ease' }}>
                    <p style={{ fontStyle: 'italic', marginBottom: '20px' }}>
                      {(() => {
                        const text = interpretation.conclusionFinal;
                        if (consultTier !== null) return <span className="reveal-text">{text}</span>;
                        const split = splitFirstSentence(text);
                        if (!split) return <span className="reveal-text">{text}</span>;
                        return (
                          <>
                            <span className="reveal-text">{split.visible}</span>
                            {' '}
                            <span className="steamy-blur">{split.blurred}</span>
                          </>
                        );
                      })()}
                    </p>

                    {interpretation.mision_alma && (
                      <div className="ritual-extra-section fade-in-text" style={{ marginBottom: '20px' }}>
                        <h4 style={{ color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>✦ Misión del Alma ✦</h4>
                        <p style={{ fontStyle: 'italic', fontSize: '1.1rem' }}>
                          {consultTier !== null
                            ? interpretation.mision_alma
                            : <span className="steamy-blur">{interpretation.mision_alma}</span>}
                        </p>
                      </div>
                    )}
                    {interpretation.leccion_karmica && (
                      <div className="ritual-extra-section fade-in-text" style={{ marginBottom: '20px', marginTop: '20px' }}>
                        <h4 style={{ color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>✦ Lección Kármica ✦</h4>
                        <p style={{ fontStyle: 'italic', fontSize: '1.1rem' }}>
                          {consultTier !== null
                            ? interpretation.leccion_karmica
                            : <span className="steamy-blur">{interpretation.leccion_karmica}</span>}
                        </p>
                      </div>
                    )}

                    {/* Unlock button for synthesis if unpaid */}
                    {consultTier === null && (
                      <div className="fade-in-text" style={{ textAlign: 'center', margin: '20px 0' }}>
                        <p style={{ color: '#ffd700', fontSize: '0.85rem', marginBottom: '12px' }}>
                          ✧ El Oráculo aguarda tu ofrenda para revelar la síntesis final ✧
                        </p>
                        <button
                          className="start-button blinking-button"
                          style={{ fontSize: '0.82rem', padding: '10px 24px' }}
                          onClick={() => {
                            setShowUnlockModal(true);
                            trackEvent('unlock_modal_opened', { is_guest: !authSession }, authSession);
                          }}
                        >
                          🔓 Ver lectura completa
                        </button>
                      </div>
                    )}

                    {consultTier !== null && (
                      <div className="anchoring-grid">
                        <div className="anchor-block decree-box">
                          <div className="mystic-ornament-top"></div>
                          <p className="mystic-title">{translations.ui.healing_decree}</p>
                          <p style={{ fontSize: '1.25rem', letterSpacing: '0.5px', color: '#fff', textShadow: '0 0 10px rgba(255,215,0,0.3)' }}>
                            <span className="reveal-text" style={{ animationDelay: '0.5s' }}>&#8220;{interpretation.decreto}&#8221;</span>
                          </p>
                          <div className="mystic-ornament-bottom"></div>
                        </div>
                        <div className="anchor-block task-box">
                          <div className="mystic-ornament-top"></div>
                          <p className="mystic-title">{translations.ui.earthly_task}</p>
                          <p style={{ color: '#eaeaea', lineHeight: '1.6' }}><span className="reveal-text" style={{ animationDelay: '1.5s' }}>{interpretation.tarea_terrenal}</span></p>
                          <div className="mystic-ornament-bottom"></div>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
              <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>

                {/* Enviar síntesis por email */}
                {authSession && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <p style={{ color: 'rgba(255,215,0,0.55)', fontSize: '0.78rem', margin: 0, letterSpacing: '1px' }}>
                      💎 {CREDIT_COSTS.synthesis_email} {translations.ui.credits_label || 'créditos'}
                    </p>
                    <button
                      onClick={handleSendSynthesis}
                      disabled={synthEmailState !== 'idle'}
                      style={{
                        background: synthEmailState === 'sent'
                          ? 'linear-gradient(135deg,#16a34a,#15803d)'
                          : synthEmailState === 'error'
                          ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                          : 'linear-gradient(135deg,rgba(124,58,237,0.7),rgba(79,70,229,0.7))',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '25px', padding: '10px 24px',
                        color: '#fff', cursor: synthEmailState === 'idle' ? 'pointer' : 'default',
                        fontSize: '0.88rem', letterSpacing: '0.5px',
                        opacity: synthEmailState === 'sending' ? 0.7 : 1,
                        transition: 'all 0.3s',
                      }}
                    >
                      {synthEmailState === 'idle' && `📧 ${translations.ui.send_synthesis_email || 'Enviar síntesis a mi correo'}`}
                      {synthEmailState === 'sending' && '⏳ Enviando...'}
                      {synthEmailState === 'sent' && `✅ ${translations.ui.synthesis_sent || '¡Enviado a tu correo!'}`}
                      {synthEmailState === 'error' && `❌ ${translations.ui.synthesis_error || 'Error al enviar, intenta de nuevo'}`}
                    </button>
                  </div>
                )}

                <InviteWidget
                  authSession={authSession}
                  referralCode={referralCode || null}
                />
              </div>
            </>
          )}
        </div>
      )}
      {/* ── Modales de monetización ─────────────────────────── */}
      <UnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlock={handleUnlock}
        authSession={authSession}
        credits={credits}
        onShowAuth={() => { setShowUnlockModal(false); setShowAuthModal(true); }}
        onShowPurchase={() => { setShowUnlockModal(false); setShowPurchaseModal(true); }}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
        onAuth={handlePostAuth}
        referralCode={urlRef}
        language={language}
      />
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        session={authSession}
        reason={purchaseReason}
        onSaveState={saveStateForPurchase}
      />
      {showReferralWidget && referralCode && (
        <ReferralWidget
          referralCode={referralCode}
          onClose={() => setShowReferralWidget(false)}
        />
      )}

      {/* Global Debug Toggle Button */}
      <button 
        onClick={() => setShowDebug(!showDebug)}
        style={{
          position: 'fixed', bottom: '25px', right: '85px', zIndex: 9999,
          background: showDebug ? 'rgba(255,0,0,0.4)' : 'rgba(255,215,0,0.1)', 
          border: '1px solid #ffd700', borderRadius: '50px',
          padding: '5px 15px', cursor: 'pointer', color: '#ffd700', fontSize: '0.7rem',
          backdropFilter: 'blur(5px)'
        }}
      >
        {showDebug ? 'CLOSE DEBUG' : 'SHOW DEBUG'}
      </button>

      {/* Debug Console - Floating at the TOP for maximum visibility */}
      {showDebug && (
        <div style={{
          position: 'fixed', top: '10px', left: '10px', right: '10px',
          maxHeight: '400px', background: 'rgba(50, 0, 0, 0.95)', border: '2px solid red',
          borderRadius: '10px', padding: '20px', color: '#ffaaaa', fontSize: '0.9rem',
          zIndex: 99999, overflowY: 'auto', backdropFilter: 'blur(20px)', textAlign: 'left',
          fontFamily: 'monospace', boxShadow: '0 0 50px rgba(255,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #660000', pb: '10px' }}>
            <strong style={{ color: '#fff', fontSize: '1rem' }}>🚨 ORACLE DIAGNOSTIC CONSOLE</strong>
            <button onClick={() => setShowDebug(false)} style={{ color: 'white', background: 'red', border: 'none', px: '10px', cursor: 'pointer' }}>CLOSE X</button>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Status:</strong> {lastDebug ? 'Fallback Active' : 'No recent errors'}
          </div>
          {lastDebug && (
            <>
              <div style={{ color: '#ff6666', mb: '10px' }}><strong>Error Message:</strong> {lastDebug.error}</div>
              {lastDebug.raw && (
                <div style={{ marginTop: '15px' }}>
                  <strong>RAW RESPONSE FROM AI:</strong>
                  <div style={{ background: '#111', padding: '15px', marginTop: '10px', borderRadius: '5px', color: '#00ff00', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                    {lastDebug.raw}
                  </div>
                </div>
              )}
            </>
          )}
          {!lastDebug && <div>Esperando respuesta del Oráculo...</div>}
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
