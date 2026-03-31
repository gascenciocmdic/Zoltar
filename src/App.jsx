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

function App() {
  const [language, setLanguage] = useState('es'); // Default, but will be set by selection
  const [phase, setPhase] = useState('languageSelection'); // languageSelection, threshold, synchrony, introspection, revelation, anchoring
  
  const [textIndices, setTextIndices] = useState({
    greeting: 0,
    askName: 0,
    waitMsg: 0
  });

  const translations = useMemo(() => I18N[language] || I18N.es, [language]);

  const sessionTexts = useMemo(() => {
    const pool = I18N[language] || I18N.es;
    return {
      greeting: pool.greetings[textIndices.greeting % pool.greetings.length] || pool.greetings[0],
      askName: pool.ask_names[textIndices.askName % pool.ask_names.length] || pool.ask_names[0],
      waitMsg: pool.wait_messages[textIndices.waitMsg % pool.wait_messages.length] || pool.wait_messages[0]
    };
  }, [language, textIndices]);

  // Recalculate random indices whenever we enter the threshold phase OR language changes
  useEffect(() => {
    if (phase === 'threshold' || phase === 'languageSelection') {
      const pool = I18N[language] || I18N.es;
      setTextIndices({
        greeting: Math.floor(Math.random() * pool.greetings.length),
        askName: Math.floor(Math.random() * pool.ask_names.length),
        waitMsg: Math.floor(Math.random() * pool.wait_messages.length)
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
  const [visitReason, setVisitReason] = useState('');
  const [dichotomousChoice, setDichotomousChoice] = useState('');
  const [cardsFlippedCount, setCardsFlippedCount] = useState(0);
  const [autoRevealStarted, setAutoRevealStarted] = useState(false);
  
  const [isMutedState, setIsMutedState] = useState(false);

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
    if (phase === 'revelation' && !loading) {
      if (cardsFlippedCount < 3) {
        const timer = setTimeout(() => {
          setCardsFlippedCount(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (!autoRevealStarted) {
        setAutoRevealStarted(true); // marks the end of the reveal sequence
      }
    }
  }, [phase, loading, cardsFlippedCount, autoRevealStarted]);

  const handleStart = () => {
    setIsFading(true);
    speakText(sessionTexts.askName, language);
    setTimeout(() => {
      setThresholdStep(1);
      setIsFading(false);
    }, 1500); 
  };

  const handleNextThreshold = () => {
    if (thresholdStep === 1 && !userName) return alert(translations.ui.your_name_placeholder);
    if (thresholdStep === 2 && !visitReason) return alert(translations.ui.what_inquires_you);
    
    setIsFading(true);
    
    // Narradores
    if (thresholdStep === 1) {
      speakText((translations.ui.what_inquires_you.replace('{name}', userName) || `Dime, ${userName}... ¿qué susurros han traído tus pasos hacia mí hoy?`), language);
    } else if (thresholdStep === 2) {
      speakText(translations.ui.metaphoric_whisper, language);
    } else if (thresholdStep === 3) {
      speakText(translations.ui.choose_cards, language);
    }

    setTimeout(() => {
      if (thresholdStep < 4) {
        setThresholdStep(thresholdStep + 1);
      } else {
        setPhase('synchrony');
        setVibe('revelation_gold');
        setShowSynchronyPopup(true);
        speakText(translations.ui.call_p1.replace(/"/g, ''), language);
      }
      setIsFading(false);
    }, 1500); 
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

  const handleGoToIntrospection = async () => {
    setLoading(true);
    setVibe('karmic_red'); 
    speakText(sessionTexts.waitMsg, language);
    try {
      const userContext = { name: userName, reason: visitReason };
      const result = await generateIntrospection(selectedCards, null, userContext, language);
      setIntrospectionMessage(result.mensajeGuia);
      setPhase('introspection');
      setLoading(false);
      setVibe('healing_blue');
      speakText(translations.ui.magnetic_resonance.replace('{name}', userName), language);
    } catch (error) {
      console.error(error);
      alert(error.message);
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
        const userContext = { name: userName, reason: visitReason, preference: dichotomousChoice, introspectionAnswer };
        const result = await interpretCards(selectedCards, visitReason, null, userContext, language);
        setInterpretation(result);
        setVibe(result.vibe || 'healing_blue');
        setLoading(false);
      } catch (error) {
        console.error("Error al interpretar:", error);
        alert(error.message);
        setLoading(false);
      }
    }, 5000); 
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
          speakText(prefix + textToRead, language);
        }
      }, 1500);
    } else {
      setIsFading(true);
      setTimeout(async () => {
        setPhase('anchoring');
        setIsFading(false);
        try {
          // Anchoring now waits for clarifications too
          const finalSynthesis = await generateAnchoring(selectedCards, visitReason, dichotomousChoice, userName, clarifications, null, language);
          setInterpretation(prev => ({ ...prev, ...finalSynthesis }));
          speakText(`${translations.ui.great_synthesis.replace('{name}', userName)} ${finalSynthesis.conclusionFinal} ${translations.ui.healing_decree}: ${finalSynthesis.decreto}. ${translations.ui.earthly_task}: ${finalSynthesis.tarea_terrenal}`, language);
        } catch (error) {
          console.error(error);
        }
      }, 1500);
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
    }, 1000);
  };

  const submitDeepenCardSelect = async (cardId, extraCard) => {
    setIsFading(true);
    speakText(translations.ui.deepen_loading, language);
    // Move to loading
    setClarifications(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], extraCard, step: 'loading' }
    }));
    
    // Simulate profound pause then restore to revelation view
    setTimeout(async () => {
      setIsFading(false);
      // Now call gemini
      const originalCard = selectedCards.find(c => c.id === cardId);
      const clarState = clarifications[cardId];
      if (originalCard && clarState) {
        try {
          const readingIndex = selectedCards.findIndex(c => c.id === cardId);
          const previousReadingText = interpretation?.narrativaAncestral 
            ? (Array.isArray(interpretation.narrativaAncestral) ? interpretation.narrativaAncestral[readingIndex] : interpretation.narrativaAncestral)
            : '';
          
          const resp = await generateDeepening(originalCard, extraCard, clarState.question, previousReadingText, {userName}, null, language);
          setClarifications(prev => ({
            ...prev,
            [cardId]: { ...prev[cardId], extraResponse: resp, step: 'done' }
          }));
          speakText(`${translations.ui.deepen_subtitle}. ${resp}`, language);
        } catch (e) {
          setClarifications(prev => ({
            ...prev,
            [cardId]: { ...prev[cardId], extraResponse: `La clarificación fue interrumpida por las mareas del tiempo. (Error Técnico: ${e.message})`, step: 'done' }
          }));
        }
      }
    }, 1500);
  };

  return (
    <div className="app-container">
      {phase === 'languageSelection' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 999999
        }}>
          <div style={{ width: '220px', height: '120px', backgroundImage: "url('/zoltar-logo.jpg')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', marginBottom: '40px', mixBlendMode: 'screen' }} />
          <h2 style={{color: '#ffd700', letterSpacing: '4px', marginBottom: '50px', textTransform: 'uppercase', fontSize: '1.5rem', textAlign: 'center'}}>Select your language / Selecciona tu idioma</h2>
          <div style={{ display: 'grid', gap: '20px', width: '280px' }}>
            <button className="start-button blinking-button" onClick={() => { setLanguage('en'); setPhase('portalEntrance'); }}>English</button>
            <button className="start-button blinking-button" onClick={() => { setLanguage('es'); setPhase('portalEntrance'); }}>Español</button>
            <button className="start-button blinking-button" onClick={() => { setLanguage('pt'); setPhase('portalEntrance'); }}>Português</button>
          </div>
        </div>
      )}

      {phase === 'portalEntrance' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{ width: '280px', height: '150px', backgroundImage: "url('/zoltar-logo.jpg')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', marginBottom: '20px', mixBlendMode: 'screen' }} />
          <h2 style={{color: '#ffd700', letterSpacing: '3px', marginBottom: '30px', textTransform: 'uppercase', fontSize: '2rem', textAlign: 'center'}}>{translations.ui.title}</h2>
          <button className="start-button blinking-button" onClick={() => {
            initSpeech(language);
            startAmbientMusic();
            setPhase('threshold');
            setTimeout(() => {
              speakText(sessionTexts.greeting, language);
            }, 600);
          }}>{translations.ui.enter_portal}</button>
        </div>
      )}

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

      <VortexCanvas vibe={vibe} />
      
      {/* Global Overlay Logo via CSS mix-blend-mode */}
      <div className="global-logo" />

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
              <button className="start-button" onClick={handleStart}>
                {translations.ui.allow}
              </button>
              
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
              <p className="welcome-text"><TypewriterText text={`"${translations.ui.what_inquires_you.replace('{name}', userName)}"`} speed={45} /></p>
              <input 
                type="text" 
                className="soul-input" 
                placeholder={translations.ui.revelation_confession}
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
              />
              <button className="start-button" onClick={handleNextThreshold}>{translations.ui.continue}</button>
            </>
          )}

          {thresholdStep === 3 && (
            <>
              <p className="welcome-text"><TypewriterText text={`"${translations.ui.metaphoric_whisper}"`} speed={45} /></p>
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
                <TypewriterText text={`"${translations.ui.choose_cards}"`} speed={45} />
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
                <button className="start-button blinking-button" onClick={() => setPhase('introspection')} style={{ background: 'rgba(20,22,28,0.95)', padding: '15px 50px', boxShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.4)', display: 'block', margin: '0 auto', width: '100%' }}>
                  {translations.ui.continue}
                </button>
              </div>
            )}
          </>
        </div>
      )}

      {phase === 'introspection' && (
        <div className="introspection-content threshold-content">
          <h2 className="phase-title" style={{ fontSize: '1.5rem', color: '#c084fc' }}>{translations.ui.introspection_title}</h2>
          
          {loading ? (
            <div style={{ marginTop: '20px' }}>
              <p className="welcome-text" style={{ fontSize: '1.2rem', animation: 'slowFadePulse 4s infinite ease-in-out', textAlign: 'center' }}>
                <TypewriterText text={sessionTexts.waitMsg} speed={45} />
              </p>
              <p className="subtitle" style={{ textAlign: 'center' }}><TypewriterText text={translations.ui.wait_silence} speed={40} /></p>
            </div>
          ) : (
            <>
              <p className="welcome-text" style={{ fontSize: '1rem', fontStyle: 'italic' }}>
                <span className="reveal-text">{translations.ui.magnetic_resonance.replace('{name}', userName)}</span>
              </p>
              
              <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '20px' }}>
                {introspectionMessage && (
                  <div className="narrative-container" style={{ margin: '0 auto 20px auto', maxWidth: '600px' }}>
                    <div className="brain-bubble narrative fade-in-text" style={{ borderLeftColor: '#c084fc' }}>
                      <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: '#e5e4e7', margin: 0 }}>
                        <span className="reveal-text">{introspectionMessage}</span>
                      </p>
                    </div>
                  </div>
                )}
                
                <textarea 
                  className="soul-input" 
                  style={{ height: '120px', resize: 'none', maxWidth: '600px', margin: '0 auto', display: 'block' }}
                  placeholder={translations.ui.revelation_confession}
                  id="deepAnswer"
                />
              </div>
 
              <button className="start-button blinking-button" onClick={() => {
                const answer = document.getElementById('deepAnswer')?.value || '';
                handleStartRevelation({ introspectionAnswer: answer });
              }}>
                {translations.ui.submit_to_oracle}
              </button>
            </>
          )}
        </div>
      )}

      {phase === 'revelation' && (
        <div className="revelation-content">
          <h2 className="phase-title">La Revelación</h2>
          
          {(() => {
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
                      
                      return (
                        <Card 
                          key={c.id} 
                          card={c} 
                          isSelected={false}
                          onSelect={() => submitDeepenCardSelect(parseInt(clarifyingCardId), c)}
                          style={{
                            '--scatter-transform': `translate(${spreadX}px, ${spreadY}px) rotate(${rotation}deg)`
                          }}
                        />
                      );
                    })}
                  </div>
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
                      <TypewriterText text={sessionTexts.waitMsg} speed={45} />
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
                                 <button className="start-button blinking-button" style={{ fontSize: '0.8rem', padding: '8px 20px'}} onClick={() => initDeepening(selectedCards[revealedStage-1].id)}>
                                    {translations.ui.deepen}
                                 </button>
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
                                 <div className="brain-bubble narrative fade-in-text" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)'}}>
                                    <p className="narrative-meta" style={{ color: '#ffd700', fontSize: '0.8rem'}}>{translations.ui.deepen_subtitle}</p>
                                    <p style={{ fontSize: '0.95rem', fontStyle: 'italic'}}>{clarifications[selectedCards[revealedStage-1].id].extraResponse}</p>
                                 </div>
                               ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {autoRevealStarted && (
                      <button className="start-button blinking-button" onClick={handleNextStage} style={{ marginTop: '20px' }}>
                        {revealedStage < 3 ? translations.ui.continue : translations.ui.view_synthesis}
                      </button>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {phase === 'anchoring' && interpretation && (
        <div className="anchoring-content threshold-content">
          <h2 className="phase-title">{translations.ui.great_synthesis_title}</h2>
          <div className="narrative-container">
             <div className="brain-bubble narrative fade-in-text" style={{ borderLeftColor: '#ffd700' }}>
                <p style={{ fontStyle: 'italic', marginBottom: '20px' }}>{interpretation.conclusionFinal}</p>
                <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,215,0,0.05)', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.2)' }}>
                  <p style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>{translations.ui.healing_decree}</p>
                  <p style={{ fontSize: '1.2rem', letterSpacing: '0.5px' }}>"{interpretation.decreto}"</p>
                </div>
                <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(192,132,252,0.05)', borderRadius: '10px', border: '1px solid rgba(192,132,252,0.2)' }}>
                  <p style={{ color: '#c084fc', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>{translations.ui.earthly_task}</p>
                  <p>{interpretation.tarea_terrenal}</p>
                </div>
             </div>
          </div>
          <button className="start-button" onClick={() => window.location.reload()} style={{ marginTop: '40px' }}>{translations.ui.reset_ritual}</button>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
