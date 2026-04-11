import React, { useState, useMemo, useEffect } from 'react';
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

function App() {
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
      askName: pool.ask_names[textIndices.askName % pool.ask_names.length] || pool.ask_names[0],
      waitMsg: pool.wait_messages[textIndices.waitMsg % pool.wait_messages.length] || pool.wait_messages[0],
      askReason: pool.ask_reasons[textIndices.askReason % pool.ask_reasons.length] || pool.ask_reasons[0],
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
  const [birthDate, setBirthDate] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [dichotomousChoice, setDichotomousChoice] = useState('');
  const [cardsFlippedCount, setCardsFlippedCount] = useState(0);
  const [autoRevealStarted, setAutoRevealStarted] = useState(false);
  const [revelationReady, setRevelationReady] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [deepeningActive, setDeepeningActive] = useState(null); // cardId while loading deepening
  const [anchoringLoading, setAnchoringLoading] = useState(false);
  
  const [isMutedState, setIsMutedState] = useState(false);
  const [lastDebug, setLastDebug] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

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

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    setPhase('portalEntrance');
    setCanProceed(false);
    // Directly use translations to start welcome speech
    const welcomeMsg = I18N[lang].greetings[Math.floor(Math.random() * I18N[lang].greetings.length)];
    speakText(welcomeMsg, lang, () => setCanProceed(true));
  };

  const handleStart = () => {
    setIsFading(true);
    speakText(sessionTexts.askName, language);
    setTimeout(() => {
      setThresholdStep(1);
      setIsFading(false);
    }, Math.floor(Math.random() * 2000) + 3000); 
  };

  const handleNextThreshold = () => {
    if (thresholdStep === 1 && !userName) return alert(translations.ui.your_name_placeholder);
    if (thresholdStep === 2 && !visitReason) return alert(translations.ui.what_inquires_you);
    
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
       const userContext = { name: userName, birthDate: birthDate, reason: visitReason };
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
      
      try {
        // Enforce full context inclusion
        const userContext = { name: userName, birthDate: birthDate, reason: visitReason, preference: dichotomousChoice, introspectionAnswer };
        const result = await interpretCards(selectedCards, visitReason, null, userContext, language);
        setInterpretation({
          ...result,
          decreto: result.decreto || translations.ui.default_decree,
          tarea_terrenal: result.tarea_terrenal || translations.ui.default_task
        });
        if (result.__IS_FALLBACK__) {
          setLastDebug(result._debug || { error: "FALLBACK TRIGGERED (Interpretation failed)" });
          setShowDebug(true);
        }
        setVibe(result.vibe || 'healing_blue');
        setLoading(false);
      } catch (error) {
        console.error("Error al interpretar:", error);
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

  const handleNextStage = () => {
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
          setCanProceed(false);
          speakText(prefix + textToRead, language, () => setCanProceed(true));
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
            speakText(
              `${translations.ui.great_synthesis.replace('{name}', userName)} ${finalSynthesis.conclusionFinal || ''} ${translations.ui.healing_decree}: ${finalSynthesis.decreto || translations.ui.default_decree}. ${translations.ui.earthly_task}: ${finalSynthesis.tarea_terrenal || translations.ui.default_task}`,
              language
            );
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
  const initDeepening = (cardId) => {
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
            <button className="start-button blinking-button action-button-reveal" onClick={() => {
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
            }}>{translations.ui.enter_portal}</button>
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
                <button className="start-button blinking-button action-button-reveal" onClick={handleStart}>
                  {translations.ui.allow}
                </button>
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

          {thresholdStep === 1 && (
            <>
              <p className="welcome-text"><TypewriterText text={`"${sessionTexts.askBirthDate.replace('{name}', userName)}"`} speed={45} /></p>
              <input 
                type="text" 
                className="soul-input" 
                placeholder={translations.ui.birthdate_placeholder}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <button className="start-button" onClick={handleNextThreshold}>{translations.ui.continue}</button>
            </>
          )}

          {thresholdStep === 2 && (
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

          {thresholdStep === 3 && (
            <>
              <p className="welcome-text"><TypewriterText text={`"${sessionTexts.askDichotomy}"`} speed={45} /></p>
              <div className="dichotomy-buttons">
                <button className={`choice-button ${dichotomousChoice === 'direct' ? 'selected' : ''}`} onClick={() => setDichotomousChoice('direct')}>{translations.ui.direct_truth}</button>
                <button className={`choice-button ${dichotomousChoice === 'metaphor' ? 'selected' : ''}`} onClick={() => setDichotomousChoice('metaphor')}>{translations.ui.metaphoric_whisper}</button>
              </div>
              <button className="start-button" onClick={handleNextThreshold} disabled={!dichotomousChoice}>{translations.ui.continue}</button>
            </>
          )}

          {thresholdStep === 4 && (
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
                <button className="start-button blinking-button" onClick={handleGoToAstralAlignment} style={{ background: 'rgba(20,22,28,0.95)', padding: '15px 50px', boxShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.4)', display: 'block', margin: '0 auto', width: '100%' }}>
                  {translations.ui.continue}
                </button>
              </div>
            )}
          </>
        </div>
      )}

      {phase === 'astral_alignment' && (
        <div className="astral-content threshold-content">
          <h2 className="phase-title" style={{ fontSize: '1.5rem', color: '#c084fc' }}>{interpretation?.constelacion || "El Esfínter Cósmico"}</h2>
          
          <div className="constellation-wrapper">
             <ConstellationCanvas seed={interpretation?.constelacion || userName} />
          </div>
          
          {loading ? (
            <div style={{ marginTop: '20px' }}>
              <p className="welcome-text" style={{ fontSize: '1.2rem', animation: 'slowFadePulse 4s infinite ease-in-out', textAlign: 'center' }}>
                <TypewriterText text={sessionTexts.waitMsg} speed={45} showCursor={false} />
              </p>
              <p className="subtitle" style={{ textAlign: 'center' }}><TypewriterText text={translations.ui.wait_silence} speed={40} showCursor={false} /></p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '20px' }}>
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
                              <span className="reveal-text">{Array.isArray(interpretation.narrativaAncestral) 
                                ? interpretation.narrativaAncestral[revealedStage - 1]
                                : interpretation.narrativaAncestral}</span>
                            </div>
                            
                            {/* Deepen logic per card */}
                            <div className="deepen-box">
                               {!clarifications[selectedCards[revealedStage-1].id] ? (
                                 canProceed && (
                                   <button className="start-button blinking-button" style={{ fontSize: '0.8rem', padding: '8px 20px'}} onClick={() => initDeepening(selectedCards[revealedStage-1].id)}>
                                      {translations.ui.deepen_action || translations.ui.deepen}
                                   </button>
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
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {autoRevealStarted && canProceed && (
                      <button 
                        className="start-button blinking-button action-button-reveal" 
                        onClick={handleNextStage} 
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
                      <span className="reveal-text">{interpretation.conclusionFinal}</span>
                    </p>
                    <div className="anchoring-grid">
                      <div className="anchor-block decree-box">
                        <div className="mystic-ornament-top"></div>
                        <p className="mystic-title">{translations.ui.healing_decree}</p>
                        <p style={{ fontSize: '1.25rem', letterSpacing: '0.5px', color: '#fff', textShadow: '0 0 10px rgba(255,215,0,0.3)' }}>
                          <span className="reveal-text" style={{ animationDelay: '1.5s' }}>&#8220;{interpretation.decreto}&#8221;</span>
                        </p>
                        <div className="mystic-ornament-bottom"></div>
                      </div>
                      <div className="anchor-block task-box">
                        <div className="mystic-ornament-top"></div>
                        <p className="mystic-title">{translations.ui.earthly_task}</p>
                        <p style={{ color: '#eaeaea', lineHeight: '1.6' }}><span className="reveal-text" style={{ animationDelay: '3s' }}>{interpretation.tarea_terrenal}</span></p>
                        <div className="mystic-ornament-bottom"></div>
                      </div>
                    </div>
                 </div>
              </div>
              <button 
                className="start-button blinking-button action-button-reveal" 
                onClick={() => window.location.reload()} 
                style={{ marginTop: '40px' }}
              >
                {translations.ui.new_consultation}
              </button>
            </>
          )}
        </div>
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
