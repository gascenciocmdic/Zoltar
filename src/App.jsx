import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import './App.css';
import VortexCanvas from './vortex/VortexCanvas';
import { useTheme } from './lib/themeContext';
import Card from './components/Card';
import { interpretCards, generateIntrospection, generateAnchoring, generateDeepening } from './api/gemini';
import { cardsData } from './data/cards';
import { initSpeech, toggleMute, speakText, speakPremium, speakPreviewStd, stopSpeech, startAmbientMusic, stopAmbient } from './utils/speech';
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
import CookieConsent from './components/CookieConsent';
import ToastContainer, { showToast } from './components/Toast';
import LandingScreen from './components/LandingScreen';
import InviteWidget from './components/InviteWidget';
import { trackEvent, identifyUser } from './lib/analytics';
import logoDark from './assets/Logo_Zoltar_oscuro.png';
import logoClaro from './assets/Logo_Zoltar_claro.png';
import TableProps from './components/TableProps';
import mesaOscuro from './assets/mesa_oscuro.png';
import mesaClaro  from './assets/mesa_claro.png';

const ZOLTAR_USER_KEY = 'zoltar_user';

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
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [language, setLanguage] = useState(''); // Default empty to trigger selection
  const [phase, setPhase] = useState('landing'); // landing, languageSelection, threshold, synchrony, introspection, revelation, anchoring
  
  const [textIndices, setTextIndices] = useState({
    greeting: 0,
    askName: 0,
    waitMsg: 0,
    askReason: 0,
    askDichotomy: 0,
    askQuestion: 0
  });

  const translations = useMemo(() => I18N[language] || I18N.es, [language]);

  // Translate card names to the active language before sending to the AI.
  // In Spanish cards already have their native name; for EN/PT we look up
  // translations.cards so Gemini receives — and narrates — the right name.
  const localizeCards = useCallback(
    (cards) =>
      language === 'es'
        ? cards
        : cards.map(c => ({ ...c, name: translations.cards?.[c.id]?.name || c.name })),
    [language, translations]
  );

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

  // ── Zoom & drag del abanico ──────────────────────────────────────────────
  const FAN_ZOOM_MIN  = 0.55;
  const FAN_ZOOM_MAX  = 2.5;
  const FAN_ZOOM_STEP = 0.25;
  const [fanZoom, setFanZoom] = useState(() => {
    // En móvil arranca con el zoom mínimo para ver el abanico completo
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return FAN_ZOOM_MIN;
    return 1.0;
  });
  // dragState: { card, cardId, startX, startY, currentX, currentY }
  const [dragState, setDragState] = useState(null);
  // activatedCardId: carta "elegida" en escritorio (click = activa, luego drag = selecciona)
  const [activatedCardId, setActivatedCardId] = useState(null);
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1 });
  // Detecta si el dispositivo usa mouse (pointer: fine) vs táctil
  const isMouseDevice = useRef(typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches);
  // ────────────────────────────────────────────────────────────────────────

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
  const [consultTier,  setConsultTier]  = useState(null); // null | 'standard' | 'full' | 'premium'
  const [voiceProfile, setVoiceProfile] = useState(null); // null | 'masculine' | 'feminine'
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

  // Refrescar créditos cuando la app recupera actividad (desktop: focus; mobile: visibilitychange / pageshow)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.hidden || !authSession) return;
      const bal = await fetchBalance(authSession);
      if (bal !== null) setCredits(bal);
    };
    const handlePageShow = (e) => {
      // iOS BFCache: página restaurada desde caché sin recargar el JS
      if (e.persisted && authSession) {
        fetchBalance(authSession).then(bal => { if (bal !== null) setCredits(bal); });
      }
    };
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [authSession]);

  useEffect(() => {
    initSpeech(language);
    // Only stop speech synthesis on language change — ambient music is
    // session-wide and must NOT be stopped here (stopAmbient belongs only
    // in handleNewConsultation when the user explicitly exits the portal).
    return () => { stopSpeech(); };
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

  // Scroll to top when a new card revelation stage begins
  useEffect(() => {
    if (phase === 'revelation' && revealedStage > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [revealedStage, phase]);

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
        if (s.phase === 'revelation') setCanProceed(true);
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

    // Restaura el flujo de consulta desde sessionStorage (recarga en móvil)
    const tryRestoreFlow = () => {
      try {
        const saved = sessionStorage.getItem('zoltar_flow_checkpoint');
        if (!saved) return false;
        const s = JSON.parse(saved);
        if (!s.phase || s.phase === 'landing') return false;
        if (s.language)              setLanguage(s.language);
        if (s.phase)                 setPhase(s.phase);
        if (s.userName)              setUserName(s.userName);
        if (s.birthDate)             setBirthDate(s.birthDate);
        if (s.birthNarrative)        setBirthNarrative(s.birthNarrative);
        if (s.visitReason)           setVisitReason(s.visitReason);
        if (s.dichotomousChoice)     setDichotomousChoice(s.dichotomousChoice);
        if (s.thresholdStep != null) setThresholdStep(s.thresholdStep);
        if (s.selectedCards?.length) setSelectedCards(s.selectedCards);
        if (s.interpretation)        setInterpretation(s.interpretation);
        if (s.introspectionMessage)  setIntrospectionMessage(s.introspectionMessage);
        if (s.clarifications)        setClarifications(s.clarifications);
        if (s.revealedStage != null) setRevealedStage(s.revealedStage);
        if (s.consultCount)          setConsultCount(s.consultCount);
        if (s.consultTier)           setConsultTier(s.consultTier);
        if (s.voiceProfile)          setVoiceProfile(s.voiceProfile);
        if (s.autoRevealStarted)     setAutoRevealStarted(s.autoRevealStarted);
        setCanProceed(true); // narración ya fue escuchada antes del reload
        return true;
      } catch(e) { console.warn('[flow] Restore error:', e); return false; }
    };

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
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            await initializeProfile(session, ref || '', false);
            // Cerrar modal de auth si estaba abierto (ej: confirmación de email desde otro tab)
            setShowAuthModal(false);
            await handlePostAuth(session);
          } else if (event === 'INITIAL_SESSION' && !payment && !verified) {
            // Sesión restaurada desde localStorage (recarga móvil) — recuperar flujo si existe
            tryRestoreFlow();
          }
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
          // Recuperar flujo de consulta en recargas de móvil (sin pago ni verificación)
          if (!payment && !verified) tryRestoreFlow();
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

  // ── Persistencia de flujo para recuperación en mobile ────────────────────
  // Guarda el estado de la consulta en sessionStorage cada vez que cambia algo relevante.
  // Cuando iOS recarga la página, el estado se restaura sin perder créditos ni progreso.
  useEffect(() => {
    if (!authUser) return;
    if (phase === 'landing') {
      sessionStorage.removeItem('zoltar_flow_checkpoint');
      return;
    }
    try {
      sessionStorage.setItem('zoltar_flow_checkpoint', JSON.stringify({
        phase, language, selectedCards, userName, birthDate, birthNarrative,
        visitReason, dichotomousChoice, thresholdStep,
        interpretation, introspectionMessage, clarifications,
        revealedStage, consultCount, consultTier, voiceProfile, autoRevealStarted,
      }));
    } catch(e) { console.warn('[flow] Save error:', e); }
  }, [
    authUser, phase, language, selectedCards, userName, birthDate, birthNarrative,
    visitReason, dichotomousChoice, thresholdStep, interpretation,
    introspectionMessage, clarifications, revealedStage, consultCount,
    consultTier, voiceProfile, autoRevealStarted,
  ]);

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
    identifyUser(session.user.id, session.user.email);
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
        // Skip portalEntrance — go directly to threshold step 1
        setTimeout(() => { setPhase('threshold'); setThresholdStep(1); setCanProceed(true); }, 300);
      } else if (action.type === 'unlock' || action.type === 'purchase_reading') {
        // Re-abrir UnlockModal — ahora el usuario está autenticado y puede elegir tier
        setShowUnlockModal(true);
      } else if (action.type === 'landing_premium') {
        const { voiceProfile: vp } = action;
        deductCredits(session, 'premium_ritual').then(result => {
          if (result.ok) {
            setCredits(result.credits);
            flashCredit(-100);
            setConsultTier('premium');
            setVoiceProfile(vp);
          } else {
            showToast('Créditos insuficientes para Premium.');
          }
        });
      }
      // 'deepening': el botón sigue visible en la fase revelation; el usuario lo pulsa de nuevo
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction, urlRef]);

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

  /**
   * Dispatches narration to ElevenLabs (premium) or Web Speech API (all other tiers).
   * Drop-in replacement for speakText() inside reading phases.
   */
  const narrate = useCallback((text, lang, onEnd) => {
    // Always stop any ongoing audio before starting a new narration to prevent
    // voice overlap between Web Speech API and ElevenLabs.
    stopSpeech();
    if (consultTier === 'premium' && voiceProfile && !voiceProfile.startsWith('std_')) {
      speakPremium(text, voiceProfile, lang, onEnd);
    } else if (voiceProfile === 'std_masculine' || voiceProfile === 'std_feminine') {
      const gender = voiceProfile === 'std_feminine' ? 'feminine' : 'masculine';
      speakPreviewStd(text, lang, gender, onEnd);
    } else {
      speakText(text, lang, onEnd);
    }
  }, [consultTier, voiceProfile]);

  const handleSendSynthesis = async ({ silent = false } = {}) => {
    if (!authSession || synthEmailState !== 'idle') return;

    // For non-premium: check and deduct 10cr; for premium (silent): skip cost check
    if (!silent) {
      if ((credits ?? 0) < CREDIT_COSTS.synthesis_email) {
        setPurchaseReason(`Necesitas ${CREDIT_COSTS.synthesis_email} créditos para enviar la síntesis.`);
        setShowPurchaseModal(true);
        return;
      }
    }

    setSynthEmailState('sending');
    try {
      const res = await fetch('/api/send-synthesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          language, userName, selectedCards, interpretation,
          clarifications, birthNarrative,
          skipCreditDeduction: silent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (!silent) {
          setCredits(data.credits);
          flashCredit(-CREDIT_COSTS.synthesis_email);
        }
        setSynthEmailState('sent');
      } else if (data.error === 'insufficient_credits') {
        if (!silent) {
          setPurchaseReason(`Créditos insuficientes. Necesitas ${CREDIT_COSTS.synthesis_email}.`);
          setShowPurchaseModal(true);
        }
        setSynthEmailState('idle');
      } else {
        const detail = data.resend_error || data.error || 'Error desconocido';
        console.error('[synthesis email] API error:', data);
        if (!silent) showToast(`Error al enviar el correo: ${detail}`);
        else showToast('📧 No se pudo enviar el email de síntesis');
        if (data.credits !== undefined && !silent) setCredits(data.credits);
        setSynthEmailState('error');
      }
    } catch (e) {
      setSynthEmailState('error');
      if (silent) showToast('📧 No se pudo enviar el email de síntesis');
    }
  };

  const handleLandingEnter = ({ language: lang = 'en', tier = 'standard', voiceProfile: vp = 'feminine' } = {}) => {
    setLanguage(lang);
    setVoiceProfile(vp);

    // initSpeech() and startAmbientMusic() are now called synchronously from
    // LandingScreen's click handlers BEFORE this setTimeout-delayed function runs.
    // Calling them here again is safe (both are idempotent) but the critical
    // first call must happen within the actual user gesture, not inside setTimeout.
    initSpeech(lang);

    // Ambient greeting — use the selected voice tier so ElevenLabs fires from
    // the very first word and the standard Web Speech API is never started in
    // parallel.  This prevents the "double voice" overlap on premium sessions.
    const pool = I18N[lang] || I18N.es;
    const welcomeMsg = pool.greetings[Math.floor(Math.random() * pool.greetings.length)];
    if (tier === 'premium' && vp && !vp.startsWith('std_')) {
      speakPremium(welcomeMsg, vp, lang);
    } else if (vp === 'std_masculine' || vp === 'std_feminine') {
      const gender = vp === 'std_feminine' ? 'feminine' : 'masculine';
      speakPreviewStd(welcomeMsg, lang, gender);
    } else {
      speakText(welcomeMsg, lang);
    }
    trackEvent('session_started', { language: lang, tier, is_guest: !authSession }, authSession);

    // Load saved user data so we can skip already-answered steps
    let startStep = 1;
    try {
      const saved = JSON.parse(localStorage.getItem(ZOLTAR_USER_KEY) || 'null');
      if (saved?.userName) {
        setUserName(saved.userName);
        if (saved.birthDate?.day) {
          setBirthDate(saved.birthDate);
          if (saved.birthNarrative) setBirthNarrative(saved.birthNarrative);
          startStep = 3;
        } else {
          startStep = 2;
        }
      }
    } catch (e) { /* ignore */ }

    if (tier === 'premium') {
      if (!authSession) {
        setPendingAction({ type: 'landing_premium', tier, voiceProfile: vp });
        setShowAuthModal(true);
        setPhase('threshold');
        setThresholdStep(startStep);
        setCanProceed(true);
        return;
      }
      // Set consultTier optimistically so narrate() routes to ElevenLabs immediately
      // (before the deductCredits network round-trip completes). If the charge fails,
      // we revert below.
      setConsultTier('premium');
      deductCredits(authSession, 'premium_ritual').then(result => {
        if (result.ok) {
          setCredits(result.credits);
          flashCredit(-100);
          // consultTier already 'premium' — nothing to change
        } else {
          showToast(`Créditos insuficientes para Premium (necesitas 100 cr).`);
          setConsultTier(null); // revert optimistic set
        }
      }).catch(() => setConsultTier(null)); // revert on network error
    } else if (tier === 'full') {
      if (authSession) {
        deductCredits(authSession, 'ancestral_ritual').then(result => {
          if (result.ok) {
            setCredits(result.credits);
            flashCredit(-65);
            setConsultTier('full');
          } else {
            setConsultTier('standard');
          }
        }).catch(() => setConsultTier('standard'));
      }
    } else {
      if (authSession) {
        deductCredits(authSession, 'consultation').then(result => {
          if (result.ok) {
            setCredits(result.credits);
            flashCredit(-40);
            setConsultTier('standard');
          } else {
            setConsultTier(null);
          }
        }).catch(() => setConsultTier(null));
      }
    }

    setPhase('threshold');
    setThresholdStep(startStep);
    setCanProceed(true);
  };

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    trackEvent('session_started', { language: lang, is_guest: !authSession }, authSession);
    // Speak greeting as ambient — don't block UI on it
    const welcomeMsg = I18N[lang].greetings[Math.floor(Math.random() * I18N[lang].greetings.length)];
    speakText(welcomeMsg, lang);

    // Handle credit deduction (previously done in handleStart after step 0)
    const cost = CREDIT_COSTS.consultation;
    if (authSession && (credits ?? 0) >= cost) {
      deductCredits(authSession, 'consultation').then(result => {
        if (result.ok) {
          setCredits(result.credits);
          flashCredit(-cost);
          setConsultTier('standard');
        } else {
          setConsultTier(null);
        }
      }).catch(() => setConsultTier(null));
    } else {
      setConsultTier(null);
    }

    // Load saved user data from a previous "Nueva consulta"
    let startStep = 1;
    try {
      const saved = JSON.parse(localStorage.getItem(ZOLTAR_USER_KEY) || 'null');
      if (saved?.userName) {
        setUserName(saved.userName);
        if (saved.birthDate?.day) {
          setBirthDate(saved.birthDate);
          if (saved.birthNarrative) setBirthNarrative(saved.birthNarrative);
          startStep = 3; // skip name + birth date → go directly to reason
        } else {
          startStep = 2; // skip name only → go to birth date
        }
      }
    } catch (e) { /* ignore storage errors */ }

    // Skip portalEntrance and threshold step 0 — go directly to the form
    setPhase('threshold');
    setThresholdStep(startStep);
    setCanProceed(true);
  };

  const handleNextThreshold = () => {
    if (thresholdStep === 1 && !userName) { showToast(translations.ui.your_name_placeholder, 'warning'); return; }
    if (thresholdStep === 2) {
      const { day, month, year } = birthDate;
      const hasAnyField = day || month || year;
      if (hasAnyField) {
        // Partially filled — validate fully
        if (!day || !month || !year) {
          showToast(translations.ui.birthdate_placeholder || 'Ingresa tu fecha de nacimiento completa', 'warning');
          return;
        }
        const d = Number(day), m = Number(month), y = Number(year);
        if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
          showToast('Fecha inválida. Verifica día (1-31), mes (1-12) y año.', 'warning');
          return;
        }
        // Valid date — generate astrological narrative
        const narrative = generateBirthNarrative(d, m, y, language);
        setBirthNarrative(narrative);
      }
      // If all fields are empty: user skipped — birthNarrative stays null, that's valid
    }
    if (thresholdStep === 3 && !visitReason) { showToast(translations.ui.what_inquires_you, 'warning'); return; }

    setIsFading(true);

    // Narradores — use narrate() so premium tier gets ElevenLabs voice
    setCanProceed(false);
    if (thresholdStep === 1) {
      narrate(sessionTexts.askBirthDate.replace('{name}', userName), language, () => setCanProceed(true));
    } else if (thresholdStep === 2) {
      narrate(sessionTexts.askReason.replace('{name}', userName), language, () => setCanProceed(true));
    } else if (thresholdStep === 3) {
      narrate(sessionTexts.askDichotomy, language, () => setCanProceed(true));
    }

    setTimeout(() => {
      if (thresholdStep < 4) {
        setThresholdStep(thresholdStep + 1);
      } else {
        // After dichotomy (step 4), go directly to synchrony — no intermediate step 5
        setPhase('synchrony');
        setVibe('revelation_gold');
        setShowSynchronyPopup(true);
        setCanProceed(false);
        narrate(translations.ui.call_p1.replace(/"/g, ''), language, () => setCanProceed(true));
      }
      setIsFading(false);
    }, Math.floor(Math.random() * 2000) + 3000);
  };

  // Handle user explicitly skipping birth date
  const handleSkipBirthDate = () => {
    setBirthDate({ day: '', month: '', year: '' });
    setBirthNarrative(null);
    setIsFading(true);
    setCanProceed(false);
    narrate(
      (sessionTexts.askReason || '').replace('{name}', userName),
      language,
      () => setCanProceed(true)
    );
    setTimeout(() => {
      setThresholdStep(3);
      setIsFading(false);
    }, Math.floor(Math.random() * 2000) + 3000);
  };

  // ── Drag global listeners ──────────────────────────────────────────────
  useEffect(() => {
    if (!dragState) return;
    const onMove = (e) => {
      const pt = e.touches ? e.touches[0] : e;
      setDragState(prev => prev ? { ...prev, currentX: pt.clientX, currentY: pt.clientY } : null);
    };
    const onEnd = () => {
      setDragState(prev => {
        if (!prev) return null;
        const dist = Math.hypot(prev.currentX - prev.startX, prev.currentY - prev.startY);
        if (dist > 70) {
          if (prev.isDeepen && deepenDragEndRef.current) {
            deepenDragEndRef.current(prev.card);
          } else {
            setSelectedCards(cards => {
              if (cards.find(c => c.id === prev.card.id)) return cards;
              if (cards.length >= 3) return cards;
              return [...cards, prev.card];
            });
          }
        }
        return null;
      });
      setActivatedCardId(null); // siempre desactiva al soltar
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragState?.cardId]);

  // Drag start — called from each card slot (mouse & touch)
  const handleCardDragStart = useCallback((card, clientX, clientY) => {
    if (loading) return;
    if (selectedCards.find(c => c.id === card.id)) return;
    setDragState({ card, cardId: card.id, startX: clientX, startY: clientY, currentX: clientX, currentY: clientY });
  }, [loading, selectedCards]);

  // Deepening drag start — routes selection to tentative-card setter
  const deepenDragEndRef = useRef(null);
  const handleDeepenCardDragStart = useCallback((card, onSelect, clientX, clientY) => {
    if (loading) return;
    deepenDragEndRef.current = onSelect;
    setDragState({ card, cardId: card.id, startX: clientX, startY: clientY, currentX: clientX, currentY: clientY, isDeepen: true });
  }, [loading]);

  // Pinch zoom on fan-scene
  const handleFanTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchRef.current = { active: true, startDist: dist, startZoom: fanZoom };
    }
  }, [fanZoom]);

  const handleFanTouchMove = useCallback((e) => {
    if (!pinchRef.current.active || e.touches.length !== 2) return;
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const newZoom = Math.min(FAN_ZOOM_MAX, Math.max(FAN_ZOOM_MIN,
      pinchRef.current.startZoom * (dist / pinchRef.current.startDist)
    ));
    setFanZoom(newZoom);
  }, []);

  const handleFanTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) pinchRef.current.active = false;
  }, []);
  // ──────────────────────────────────────────────────────────────────────

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
    // If user skipped birth date, skip astral alignment entirely
    if (!birthDate.day) {
      handleStartRevelation();
      return;
    }
    setLoading(true);
    setVibe('karmic_red');

    // Chain narrations: waitMsg must finish before astralMsg starts.
    // Two cases:
    //   A) API returns BEFORE waitMsg ends → store text, fire when onEnd fires.
    //   B) waitMsg ends BEFORE API returns → fire immediately when API returns.
    let pendingAstralText = null;
    let waitMsgDone = false;
    const fireAstralNarration = (text) => narrate(text, language, () => setCanProceed(true));

    narrate(sessionTexts.waitMsg, language, () => {
      waitMsgDone = true;
      if (pendingAstralText !== null) fireAstralNarration(pendingAstralText);
    });

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
       const astralText = result.mensajeAstral || result.mensajeGuia;
       if (waitMsgDone) {
         fireAstralNarration(astralText);   // case B: waitMsg already finished
       } else {
         pendingAstralText = astralText;    // case A: waitMsg still playing, queue it
       }
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
    narrate(sessionTexts.waitMsg, language);

    // Snapshot the tier the user already paid for BEFORE entering the async gap.
    // handleStartRevelation must never silently overwrite a paid tier.
    const paidTier = consultTier;

    setTimeout(async () => {
      setPhase('revelation');
      setRevealedStage(0);
      setCardsFlippedCount(0);
      setAutoRevealStarted(false);
      // Do NOT reset consultTier here — if the user paid at the landing step
      // (premium / full / standard) we must keep that tier through the whole flow.
      trackEvent('revelation_viewed', {
        cards: selectedCards.map(c => c.id),
        language,
        is_guest: !authSession,
      }, authSession);

      try {
        const bdStr2 = birthDate.day ? `${birthDate.day}/${birthDate.month}/${birthDate.year}` : '';
        const userContext = { name: userName, birthDate: bdStr2, reason: visitReason, preference: dichotomousChoice, introspectionAnswer, tier: 'ancestral_ritual' };

        // Fetch the full ancestral interpretation — same content regardless of tier;
        // the tier only controls whether the text is visible or blurred in the UI.
        const result = await interpretCards(localizeCards(selectedCards), visitReason, null, userContext, language);
        setInterpretation({
          ...result,
          decreto: result.decreto || translations.ui.default_decree,
          tarea_terrenal: result.tarea_terrenal || translations.ui.default_task
        });

        // Restore the paid tier so the full reading is visible immediately,
        // or show the blurred preview if no upfront payment was made.
        if (paidTier !== null) {
          setConsultTier(paidTier);   // paid at landing → full reading, no lock screen
          setCanProceed(true);        // deepening available immediately
        } else {
          setConsultTier(null);       // guest / no upfront payment → blurred preview
        }

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
        // Also restore paid tier on error so the user isn't re-gated
        if (paidTier !== null) setConsultTier(paidTier);
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
    narrate(sessionTexts.waitMsg, language);

    try {
      const resultDeduct = await deductCredits(authSession, tier);
      if (!resultDeduct.ok) {
        setLoading(false);
        setVibe('healing_blue');
        const errMsg = resultDeduct.error === 'insufficient_credits'
          ? `Créditos insuficientes (tienes ${resultDeduct.credits ?? 0}, necesitas ${cost}).`
          : `Error al descontar créditos: ${resultDeduct.error || 'desconocido'}`;
        showToast(errMsg);
        return;
      }
      setCredits(resultDeduct.credits);
      flashCredit(-cost);

      if (tier === 'consultation') {
        // Standard reading already exists from the preview, just unblur it
        setConsultTier('standard');
        setLoading(false);
        setVibe(interpretation?.vibe || 'healing_blue');
        narrate(interpretation.narrativaAncestral[revealedStage - 1], language, () => setCanProceed(true));
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

      const result = await interpretCards(localizeCards(selectedCards), visitReason, null, userContext, language);
      setInterpretation({
        ...result,
        decreto: result.decreto || translations.ui.default_decree,
        tarea_terrenal: result.tarea_terrenal || translations.ui.default_task
      });

      setConsultTier('full');
      setVibe(result.vibe || 'healing_blue');
      setLoading(false);
      
      // Speak the new interpretation for the current stage
      narrate(result.narrativaAncestral[revealedStage - 1], language, () => setCanProceed(true));
      
    } catch (error) {
      console.error("Error en la lectura pagada:", error);
      setLoading(false);
      setVibe('healing_blue');
    }
  };

  const handleUnlock = async (tier, voiceProfileChoice = null) => {
    if (!authSession) {
      setPendingAction({ type: 'unlock', tier });
      setShowAuthModal(true);
      return;
    }

    const creditKeyMap = {
      standard: 'consultation',
      full:     'ancestral_ritual',
      premium:  'premium_ritual',
    };
    const creditKey = creditKeyMap[tier] || 'consultation';
    const cost = CREDIT_COSTS[creditKey];

    if ((credits ?? 0) < cost) {
      setPurchaseReason(`Necesitas ${cost} créditos. Tienes ${credits ?? 0}.`);
      setShowPurchaseModal(true);
      return;
    }

    setShowUnlockModal(false);
    setLoading(true);
    setVibe('karmic_red');
    narrate(sessionTexts.waitMsg, language);

    let resultDeduct;
    try {
      resultDeduct = await deductCredits(authSession, creditKey);
    } catch (e) {
      setLoading(false);
      setVibe('healing_blue');
      showToast(`Error al procesar el pago: ${e.message}`);
      return;
    }
    if (!resultDeduct.ok) {
      setLoading(false);
      setVibe('healing_blue');
      const errMsg = resultDeduct.error === 'insufficient_credits'
        ? `Créditos insuficientes (tienes ${resultDeduct.credits ?? 0}, necesitas ${cost}).`
        : `Error al descontar créditos: ${resultDeduct.error || 'desconocido'}`;
      showToast(errMsg);
      return;
    }
    setCredits(resultDeduct.credits);
    flashCredit(-cost);

    setConsultTier(tier);
    if (tier === 'premium') setVoiceProfile(voiceProfileChoice);
    setLoading(false);

    if (revealedStage > 0) {
      const fullText = Array.isArray(interpretation.narrativaAncestral)
        ? interpretation.narrativaAncestral[revealedStage - 1]
        : interpretation.narrativaAncestral;
      if (tier === 'premium' && voiceProfileChoice) {
        speakPremium(fullText, voiceProfileChoice, language, () => setCanProceed(true));
      } else {
        speakText(fullText, language, () => setCanProceed(true));
      }
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
          narrate(audioText, language, () => setCanProceed(true));
        }
      }, Math.floor(Math.random() * 2000) + 3000);
    } else {
      // Ir al anclaje sin delay — el texto aparece con animación CSS
      setPhase('anchoring');
      setAnchoringLoading(true);
      setIsFading(false);
      generateAnchoring(localizeCards(selectedCards), visitReason, dichotomousChoice, userName, clarifications, null, language)
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
          // Build complete interpretation here (finalSynthesis + revelation data from closure)
          // This avoids the stale-closure bug: handleSendSynthesis captures an old `interpretation`
          // that lacks conclusionFinal/decreto/tarea_terrenal added by finalSynthesis.
          const freshInterpretation = {
            ...interpretation,  // revelation data: narrativaAncestral, arcanoSecreto, etc.
            ...finalSynthesis,
            decreto: finalSynthesis.decreto || interpretation.decreto || translations.ui.default_decree,
            tarea_terrenal: finalSynthesis.tarea_terrenal || interpretation.tarea_terrenal || translations.ui.default_task,
          };
          // Small pause so the transition from loading to content feels ceremonial
          const currentTier = consultTier; // capture before async gap
          setTimeout(() => {
            setAnchoringLoading(false);
            const synthText = currentTier !== null
              ? `${translations.ui.great_synthesis.replace('{name}', userName)} ${finalSynthesis.conclusionFinal || ''} ${translations.ui.healing_decree}: ${finalSynthesis.decreto || translations.ui.default_decree}. ${translations.ui.earthly_task}: ${finalSynthesis.tarea_terrenal || translations.ui.default_task}`
              : `${translations.ui.great_synthesis.replace('{name}', userName)} ${(finalSynthesis.conclusionFinal || '').split('. ')[0]}.`;
            narrate(synthText, language);
            // Auto-send email for Premium tier — call API directly with fresh data
            // (avoids stale-closure bug that sent incomplete interpretation to server)
            if (currentTier === 'premium' && authSession) {
              setSynthEmailState('sending');
              fetch('/api/send-synthesis', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authSession.access_token}`,
                },
                body: JSON.stringify({
                  language,
                  userName,
                  selectedCards,
                  interpretation: freshInterpretation,
                  clarifications,
                  birthNarrative,
                  skipCreditDeduction: true,
                }),
              })
                .then(r => r.json())
                .then(data => {
                  if (data.ok) {
                    setSynthEmailState('sent');
                    showToast(`📧 ${translations.ui.synthesis_sent || '¡Síntesis enviada a tu correo!'}`, 'success');
                  } else {
                    console.error('[premium auto-email] API error:', data);
                    showToast(`📧 ${translations.ui.synthesis_error || 'No se pudo enviar el email de síntesis'}`);
                    setSynthEmailState('error');
                  }
                })
                .catch(e => {
                  console.error('[premium auto-email] Network error:', e);
                  showToast(`📧 ${translations.ui.synthesis_error || 'No se pudo enviar el email de síntesis'}`);
                  setSynthEmailState('error');
                });
            }
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
    if (consultTier === 'full' || consultTier === 'premium') {
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
    if (!questionText.trim()) { showToast(translations.ui.revelation_confession, 'warning'); return; }
    setIsFading(true);
    narrate(translations.ui.deepen_loading, language);
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
    narrate(translations.ui.deepen_loading, language);

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
        
        const resp = await generateDeepening(
          localizeCards([originalCard])[0],
          extraCard ? localizeCards([extraCard])[0] : extraCard,
          clarState.question, previousReadingText, {userName}, null, language
        );
        
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
        narrate(`${translations.ui.deepen_subtitle}. ${finalResponse}`, language);
      } catch (e) {
        console.error("Deepening failed:", e);
        setDeepeningActive(null);
        setClarifications(prev => ({
          ...prev,
          [cardId]: { ...prev[cardId], extraResponse: translations.ui.oracle_misfire, step: 'done' }
        }));
        narrate(`${translations.ui.deepen_subtitle}. ${translations.ui.oracle_misfire}`, language);
      }
    }
  };

  const handleNewConsultation = () => {
    stopSpeech();
    stopAmbient();
    // Persist user identity so next consultation skips name + birth date steps
    try {
      if (userName) {
        localStorage.setItem(ZOLTAR_USER_KEY, JSON.stringify({
          userName,
          birthDate: birthDate.day ? birthDate : null,
          birthNarrative: birthDate.day ? birthNarrative : null,
        }));
      }
    } catch (e) { /* storage not available */ }
    // Limpiar checkpoint de sesión anterior antes de recargar
    sessionStorage.removeItem('zoltar_flow_checkpoint');
    // Reload for a fresh session — guarantees speech recognition permissions
    // reset correctly on iOS/Android where in-session resets leave the mic in a bad state.
    window.location.reload();
  };

  return (
    <div className="app-container">
      <VortexCanvas vibe={vibe} theme={theme} />
      
      {/* Global Logo - Persistent unless in specific high-z-index phases */}
      {phase !== 'landing' && phase !== 'languageSelection' && (
        <img
          className="global-logo"
          src={isLight ? logoClaro : logoDark}
          alt="Zoltar"
        />
      )}

      {phase === 'landing' && (
        <LandingScreen onEnter={handleLandingEnter} />
      )}

      {phase !== 'landing' && !language ? (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'transparent', backdropFilter: 'blur(30px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <img
            src={isLight ? logoClaro : logoDark}
            alt="Zoltar"
            style={{
              width: '280px',
              height: '150px',
              objectFit: 'contain',
              marginBottom: '20px',
              mixBlendMode: isLight ? 'multiply' : 'screen',
            }}
          />
          <h2 style={{color: isLight ? '#3b0764' : '#ffd700', letterSpacing: '3px', marginBottom: '45px', textTransform: 'uppercase', fontSize: '1.8rem', textAlign: 'center'}}>{I18N.es.ui.title}</h2>
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
      ) : null}

      {/* Botón Silenciar Global */}
      <button
        onClick={() => setIsMutedState(toggleMute())}
        title={isMutedState ? translations.ui.unmute : translations.ui.mute}
        style={{
          position: 'fixed', top: '25px', right: '25px', zIndex: 9999,
          background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(20,22,28,0.8)',
          border: isLight ? '1px solid rgba(124,111,160,0.35)' : '1px solid rgba(255,215,0,0.4)',
          borderRadius: '50%',
          width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center',
          cursor: 'pointer',
          color: isLight ? '#7c6fa0' : '#ffd700',
          fontSize: '1.4rem',
          boxShadow: isLight
            ? '0 2px 12px rgba(124,111,160,0.2)'
            : '0 0 15px rgba(0,0,0,0.8)',
          transition: 'all 0.3s ease',
        }}
      >
        {isMutedState ? (
          /* Speaker muted */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          /* Speaker on */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
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
              <button
                onClick={handleSkipBirthDate}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isLight ? 'rgba(124,58,237,0.45)' : 'rgba(255,215,0,0.45)',
                  fontSize: '0.8rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontStyle: 'italic',
                  letterSpacing: '0.5px',
                  marginTop: '8px',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.target.style.color = isLight ? 'rgba(124,58,237,0.8)' : 'rgba(255,215,0,0.8)'; }}
                onMouseLeave={(e) => { e.target.style.color = isLight ? 'rgba(124,58,237,0.45)' : 'rgba(255,215,0,0.45)'; }}
              >
                {translations.ui.skip_birth_date}
              </button>
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
              <div className="dichotomy-toggle">
                <button
                  className={`dichotomy-option${dichotomousChoice === 'direct' ? ' dichotomy-active' : ''}`}
                  onClick={() => setDichotomousChoice('direct')}
                >
                  🔍 {translations.ui.direct_truth}
                </button>
                <button
                  className={`dichotomy-option${dichotomousChoice === 'metaphor' ? ' dichotomy-active' : ''}`}
                  onClick={() => setDichotomousChoice('metaphor')}
                >
                  🌸 {translations.ui.metaphoric_whisper}
                </button>
              </div>
              <button className="start-button" onClick={handleNextThreshold} disabled={!dichotomousChoice}>{translations.ui.continue}</button>
            </>
          )}

        </div>
      )}

      {showInfoPopup && (
        <div className={`popup-overlay ${isInfoFading ? 'fade-out-text' : 'fade-in-text'}`} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: isLight ? 'rgba(200,190,240,0.4)' : 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="popup-box" style={{
             padding: '50px', borderRadius: '20px',
             maxWidth: '90%', width: '500px', textAlign: 'center',
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
          background: isLight ? 'rgba(200,190,240,0.4)' : 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="popup-box" style={{
             padding: '50px', borderRadius: '20px',
             maxWidth: '500px', textAlign: 'center',
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
        <div className="fan-layout-wrapper">
          {/* ── Cartas seleccionadas — FUERA del fan-scene para no tapar el arco ── */}
          {selectedCards.length > 0 && (
            <div className="fan-selected-row">
              {selectedCards.map((card) => (
                <div key={card.id} className="fan-tray-card" title="Clic para devolver al abanico">
                  <Card
                    card={card}
                    isSelected={true}
                    onSelect={handleSelectCard}
                    logoSrc={isLight ? logoClaro : logoDark}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Mesa / Abanico ───────────────────────────────────────────────── */}
          <div
            className="fan-scene"
            style={{ backgroundImage: `url(${isLight ? mesaClaro : mesaOscuro})` }}
            onTouchStart={handleFanTouchStart}
            onTouchMove={handleFanTouchMove}
            onTouchEnd={handleFanTouchEnd}
          >
            <div className="fan-overlay" />
            <TableProps />

            <div className="fan-header">
              <h2 className="fan-title">{translations.ui.synchrony_title}</h2>
              <p className="fan-subtitle">{translations.ui.card_selection_subtitle} ({selectedCards.length}/3)</p>
            </div>

            {/* Controles de zoom — sólo escritorio */}
            <div className="fan-zoom-controls">
              <button className="fan-zoom-btn" onClick={() => setFanZoom(z => Math.min(FAN_ZOOM_MAX, parseFloat((z + FAN_ZOOM_STEP).toFixed(2))))}>＋</button>
              <button className="fan-zoom-btn" onClick={() => setFanZoom(z => Math.max(FAN_ZOOM_MIN, parseFloat((z - FAN_ZOOM_STEP).toFixed(2))))}>－</button>
            </div>

            <div className="fan-deck" style={{ transform: `scale(${fanZoom})`, transformOrigin: '0 0' }}>
              <Dragonfly visible={true} />
              {shuffledDeck.map((card, index) => {
                const total = shuffledDeck.length;
                const spread = 130;
                const angle = -spread / 2 + (index / (total - 1)) * spread;
                const isSelected = !!selectedCards.find(c => c.id === card.id);
                const isDragging = dragState?.cardId === card.id;
                const isActivated = activatedCardId === card.id;
                return (
                  <div
                    key={card.id}
                    className={`fan-slot${isSelected ? ' fan-slot-extracted' : ''}${isDragging ? ' fan-slot-dragging' : ''}${isActivated ? ' fan-slot-activated' : ''}`}
                    style={{
                      transform: `rotate(${angle}deg)`,
                      opacity: isDragging ? 0.25 : 1,
                      cursor: isDragging ? 'grabbing' : isActivated ? 'grab' : 'default',
                      /* Sin zIndex extra al activar: la carta no debe salir de la baraja */
                    }}
                    /* Desktop: click activa, mousedown desde activado arrastra */
                    onMouseDown={isSelected ? undefined : (e) => {
                      if (!isMouseDevice.current) return;
                      if (isActivated) { e.preventDefault(); handleCardDragStart(card, e.clientX, e.clientY); }
                    }}
                    onClick={isSelected ? undefined : () => {
                      if (isMouseDevice.current) setActivatedCardId(prev => prev === card.id ? null : card.id);
                    }}
                    /* Móvil: 1.er touch → ilumina; touch sobre carta ya iluminada → arrastra */
                    onTouchStart={isSelected ? undefined : (e) => {
                      if (activatedCardId === card.id) {
                        // Ya iluminada: iniciar arrastre
                        e.preventDefault();
                        handleCardDragStart(card, e.touches[0].clientX, e.touches[0].clientY);
                      } else {
                        // Primera pulsación: solo iluminar contorno
                        setActivatedCardId(card.id);
                      }
                    }}
                  >
                    <Card card={card} isSelected={false} onSelect={undefined} logoSrc={isLight ? logoClaro : logoDark} />
                  </div>
                );
              })}
            </div>

            {/* Carta fantasma que sigue al puntero/dedo */}
            {dragState && !dragState.isDeepen && (
              <div className="fan-drag-ghost" style={{ left: dragState.currentX, top: dragState.currentY }}>
                <Card card={dragState.card} isSelected={false} logoSrc={isLight ? logoClaro : logoDark} />
              </div>
            )}
          </div>

          {/* ── Botón continuar — debajo del abanico ────────────────────────── */}
          {selectedCards.length === 3 && (
            <div className="fan-continue-outer">
              <button className="start-button blinking-button continue-btn" onClick={handleGoToAstralAlignment} disabled={loading}>
                {translations.ui.continue}
              </button>
            </div>
          )}
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

          {birthNarrative && (
            <p className="narrative-meta fade-in-text" style={{
              color: '#c084fc', fontSize: '0.78rem', letterSpacing: '1px',
              textAlign: 'center', margin: '4px 0 12px',
            }}>
              {birthNarrative.symbol} {birthNarrative.sign} · {birthNarrative.element} · {birthNarrative.ruler}
            </p>
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
              const deepenDeck = shuffledDeck.filter(c => !selectedCards.find(sc => sc.id === c.id));
              const deepenTotal = deepenDeck.length;
              const deepenSpread = 130;
              const tentCard = clarifications[clarifyingCardId]?.tentativeCard;
              return (
                <div className="fan-layout-wrapper" style={{ animation: 'fadeIn 1s ease' }}>
                  {/* Carta tentativa — fuera de la escena para no tapar el arco */}
                  {tentCard && (
                    <div className="fan-selected-row">
                      <div className="fan-tray-card" title="Clic para devolver al abanico">
                        <Card
                          card={tentCard}
                          isSelected={true}
                          onSelect={() => setClarifications(prev => ({
                            ...prev,
                            [clarifyingCardId]: { ...prev[clarifyingCardId], tentativeCard: null }
                          }))}
                          logoSrc={isLight ? logoClaro : logoDark}
                        />
                      </div>
                    </div>
                  )}

                  <div
                    className="fan-scene fan-scene-deepening"
                    style={{ backgroundImage: `url(${isLight ? mesaClaro : mesaOscuro})` }}
                    onTouchStart={handleFanTouchStart}
                    onTouchMove={handleFanTouchMove}
                    onTouchEnd={handleFanTouchEnd}
                  >
                    <div className="fan-overlay" />
                    <TableProps />
                    <div className="fan-header">
                      <h2 className="fan-title">{translations.ui.deepen_loading}</h2>
                    </div>

                    <div className="fan-zoom-controls">
                      <button className="fan-zoom-btn" onClick={() => setFanZoom(z => Math.min(FAN_ZOOM_MAX, parseFloat((z + FAN_ZOOM_STEP).toFixed(2))))}>＋</button>
                      <button className="fan-zoom-btn" onClick={() => setFanZoom(z => Math.max(FAN_ZOOM_MIN, parseFloat((z - FAN_ZOOM_STEP).toFixed(2))))}>－</button>
                    </div>

                    <div className="fan-deck" style={{ transform: `scale(${fanZoom})`, transformOrigin: '0 0' }}>
                      <Dragonfly visible={true} />
                      {deepenDeck.map((c, index) => {
                        const angle = -deepenSpread / 2 + (index / (deepenTotal - 1)) * deepenSpread;
                        const isTentativelySelected = tentCard?.id === c.id;
                        const isDragging = dragState?.cardId === c.id;
                        const isActivated = activatedCardId === c.id;
                        const deepenSelectFn = () => setClarifications(prev => ({
                          ...prev,
                          [clarifyingCardId]: { ...prev[clarifyingCardId], tentativeCard: c }
                        }));
                        return (
                          <div
                            key={c.id}
                            className={`fan-slot${isTentativelySelected ? ' fan-slot-extracted' : ''}${isDragging ? ' fan-slot-dragging' : ''}${isActivated ? ' fan-slot-activated' : ''}`}
                            style={{
                              transform: `rotate(${angle}deg)`,
                              opacity: isDragging ? 0.25 : 1,
                              cursor: isDragging ? 'grabbing' : isActivated ? 'grab' : 'default',
                              /* Sin zIndex extra al activar: la carta no debe salir de la baraja */
                            }}
                            onMouseDown={isTentativelySelected ? undefined : (e) => {
                              if (!isMouseDevice.current) return;
                              if (isActivated) { e.preventDefault(); handleDeepenCardDragStart(c, deepenSelectFn, e.clientX, e.clientY); }
                            }}
                            onClick={isTentativelySelected ? undefined : () => {
                              if (isMouseDevice.current) setActivatedCardId(prev => prev === c.id ? null : c.id);
                            }}
                            /* Móvil: 1.er touch → ilumina; touch sobre carta ya iluminada → arrastra */
                            onTouchStart={isTentativelySelected ? undefined : (e) => {
                              if (activatedCardId === c.id) {
                                // Ya iluminada: iniciar arrastre
                                e.preventDefault();
                                handleDeepenCardDragStart(c, deepenSelectFn, e.touches[0].clientX, e.touches[0].clientY);
                              } else {
                                // Primera pulsación: solo iluminar contorno
                                setActivatedCardId(c.id);
                              }
                            }}
                          >
                            <Card card={c} isSelected={false} onSelect={undefined} logoSrc={isLight ? logoClaro : logoDark} />
                          </div>
                        );
                      })}
                    </div>

                    {dragState?.isDeepen && (
                      <div className="fan-drag-ghost" style={{ left: dragState.currentX, top: dragState.currentY }}>
                        <Card card={dragState.card} isSelected={false} logoSrc={isLight ? logoClaro : logoDark} />
                      </div>
                    )}
                  </div>

                  {tentCard && (
                    <div className="fan-continue-outer">
                      <button className="start-button blinking-button continue-btn" onClick={() => submitDeepenCardSelect(parseInt(clarifyingCardId), tentCard)}>
                        {translations.ui.continue}
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <>
                <div
                  className="revelation-cloth-scene"
                  style={{ backgroundImage: `url(${isLight ? mesaClaro : mesaOscuro})` }}
                >
                  <div className="revelation-cloth-overlay" />
                  <TableProps />
                  <div className="revelation-cards-spread">
                    <Dragonfly visible={cardsFlippedCount < 3} />
                    {selectedCards.map((card, index) => {
                      const clar = clarifications[card.id];
                      const cardI18n = translations.cards[card.id] || card;
                      const translatedCard = { ...card, name: cardI18n.name, info: cardI18n.info };

                      return (
                      <div key={index} className={`revelation-card-block ${revealedStage === index + 1 ? 'active-reveal' : revealedStage > 0 ? 'dimmed' : ''}`} style={{ position: 'relative' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                          <Card card={translatedCard} isSelected={false} isFaceUp={cardsFlippedCount > index} logoSrc={isLight ? logoClaro : logoDark} />
                        </div>

                        {cardsFlippedCount > index && (language === 'en' || language === 'pt') && (
                          <p className="reveal-card-name fade-in-text" style={{
                            textAlign: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            color: isLight ? 'rgba(60,30,100,0.7)' : 'rgba(196,181,253,0.8)',
                            margin: '6px 0 0',
                            fontStyle: 'normal',
                            lineHeight: 1.2,
                          }}>
                            {translatedCard.name}
                          </p>
                        )}

                        {clar?.extraCard && (
                          <div className="clarification-card-wrapper fade-in-text">
                            <Card card={{...clar.extraCard, name: translations.cards[clar.extraCard.id]?.name || clar.extraCard.name}} isSelected={false} isFaceUp={true} />
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
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
                                       {(consultTier === 'full' || consultTier === 'premium') && (
                                         <p style={{ color: 'rgba(167,139,250,0.7)', fontSize: '0.75rem', margin: 0, letterSpacing: '1px' }}>
                                           {translations.ui.deepening_included || '✦ Profundización incluida'}
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
                          <p style={{ fontSize: '1.25rem', letterSpacing: '0.5px', color: isLight ? '#2d1854' : '#fff', textShadow: isLight ? 'none' : '0 0 10px rgba(255,215,0,0.3)' }}>
                            <span className="reveal-text" style={{ animationDelay: '0.5s' }}>&#8220;{interpretation.decreto}&#8221;</span>
                          </p>
                          <div className="mystic-ornament-bottom"></div>
                        </div>
                        <div className="anchor-block task-box">
                          <div className="mystic-ornament-top"></div>
                          <p className="mystic-title">{translations.ui.earthly_task}</p>
                          <p style={{ color: isLight ? '#2d1854' : '#eaeaea', lineHeight: '1.6' }}><span className="reveal-text" style={{ animationDelay: '1.5s' }}>{interpretation.tarea_terrenal}</span></p>
                          <div className="mystic-ornament-bottom"></div>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
              <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>

                {/* Enviar síntesis por email */}
                {authSession && consultTier !== 'premium' && (
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
                  inviterName={userName || null}
                  language={language}
                />

                {/* Nueva consulta */}
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <button
                    onClick={handleNewConsultation}
                    style={{
                      background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)',
                      borderRadius: 50, padding: '12px 36px', cursor: 'pointer',
                      color: '#ffd700', fontSize: '0.9rem', fontWeight: 600,
                      letterSpacing: '0.05em', backdropFilter: 'blur(8px)',
                      transition: 'background 0.2s, border-color 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,215,0,0.16)';
                      e.currentTarget.style.borderColor = 'rgba(255,215,0,0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,215,0,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)';
                    }}
                  >
                    ✦ {translations.ui.new_consultation || 'Nueva consulta'}
                  </button>
                </div>
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
        translations={translations}
        language={language}
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
        language={language}
      />
      {showReferralWidget && referralCode && (
        <ReferralWidget
          referralCode={referralCode}
          onClose={() => setShowReferralWidget(false)}
        />
      )}

      {/* Debug Console — visible only for master user */}
      {authUser?.email === 'ascencio.gustavo@gmail.com' && (
        <button
          onClick={() => setShowDebug(!showDebug)}
          style={{
            position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999,
            background: showDebug ? 'rgba(255,0,0,0.4)' : 'rgba(255,215,0,0.1)',
            border: '1px solid #ffd700', borderRadius: '50px',
            padding: '5px 15px', cursor: 'pointer', color: '#ffd700', fontSize: '0.7rem',
            backdropFilter: 'blur(5px)'
          }}
        >
          {showDebug ? 'CLOSE DEBUG' : 'DEBUG'}
        </button>
      )}

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

      <CookieConsent />
      <ToastContainer />
      </div>
    </div>
  );
}

export default App;
