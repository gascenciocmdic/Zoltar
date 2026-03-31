import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import VortexCanvas from './vortex/VortexCanvas';
import Card from './components/Card';
import { interpretCards, generateIntrospection, generateAnchoring, generateDeepening } from './api/gemini';
import { cardsData } from './data/cards';

function App() {
  const [phase, setPhase] = useState('threshold'); // threshold, synchrony, introspection, revelation, anchoring
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

  // Test mode removed, Vortex flows purely natively in the background.

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
    setTimeout(() => {
      setThresholdStep(1);
      setIsFading(false);
    }, 1500); // 1.5 second profound pause
  };

  const handleNextThreshold = () => {
    if (thresholdStep === 1 && !userName) return alert("Dime tu nombre, alma viajera...");
    if (thresholdStep === 2 && !visitReason) return alert("Cuéntame un poco más...");
    
    setIsFading(true);
    setTimeout(() => {
      if (thresholdStep < 4) {
        setThresholdStep(thresholdStep + 1);
      } else {
        setPhase('synchrony');
        setVibe('revelation_gold');
        setShowSynchronyPopup(true);
      }
      setIsFading(false);
    }, 1500); // 1.5 second calm transition
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
    setVibe('karmic_red'); // visual cue of energetic reaction
    try {
      const userContext = { name: userName, reason: visitReason };
      const result = await generateIntrospection(selectedCards, null, userContext);
      setIntrospectionMessage(result.mensajeGuia);
      setPhase('introspection');
      setLoading(false);
      setVibe('healing_blue');
    } catch (error) {
      console.error(error);
      alert("El poder de los ancestros está bloqueado. Verifica que tu API Key de Gemini sea válida y tenga fondos/cuota.");
      setLoading(false);
      setVibe('healing_blue');
    }
  };

  const handleStartRevelation = async ({ introspectionAnswer = '' } = {}) => {
    setLoading(true);
    setVibe('karmic_red'); // Trigger the energetic reaction for 5 seconds
    
    setTimeout(async () => {
      setPhase('revelation');
      setRevealedStage(0);
      setCardsFlippedCount(0);
      setAutoRevealStarted(false);
      
      try {
        const userContext = { name: userName, reason: visitReason, preference: dichotomousChoice, introspectionAnswer };
        const result = await interpretCards(selectedCards, visitReason, null, userContext);
        setInterpretation(result);
        setVibe(result.vibe || 'healing_blue');
        setLoading(false);
      } catch (error) {
        console.error("Error al interpretar:", error);
        alert("El Oráculo está nublado en este momento. Inténtalo de nuevo más tarde.");
        setLoading(false);
      }
    }, 5000); // 5-second transition phase
  };

  const handleNextStage = () => {
    if (revealedStage < 3) {
      if (revealedStage === 0) {
        setIsFading(true);
        setTimeout(() => {
          setRevealedStage(1);
          setIsFading(false);
        }, 1500);
      } else {
        setIsFading(true);
        setTimeout(() => {
          setRevealedStage(revealedStage + 1);
          setIsFading(false);
        }, 1500);
      }
    } else {
      setIsFading(true);
      setTimeout(async () => {
        setPhase('anchoring');
        setIsFading(false);
        try {
          // Anchoring now waits for clarifications too
          const finalSynthesis = await generateAnchoring(selectedCards, visitReason, dichotomousChoice, userName, clarifications, null);
          setAnchoringReading(finalSynthesis);
        } catch (error) {
          console.error(error);
          setAnchoringReading("Las brumas impiden el cierre en este instante.");
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
    if (!questionText.trim()) return alert("El universo necesita escuchar tu inquietud puntual...");
    setIsFading(true);
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
          
          const resp = await generateDeepening(originalCard, extraCard, clarState.question, previousReadingText, {userName}, null);
          setClarifications(prev => ({
            ...prev,
            [cardId]: { ...prev[cardId], extraResponse: resp, step: 'done' }
          }));
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
                "Soy El Guía, tu puente entre lo que fuiste y lo que eres. 
                He caminado mil vidas para encontrarte en este preciso instante. 
                ¿Me permites acompañarte en este viaje de retorno hacia tu propia luz?"
              </p>
              <button className="start-button" onClick={handleStart}>
                Permitir
              </button>
              
              <div style={{ marginTop: '30px' }}>
                <button 
                  style={{ background: 'transparent', border: 'none', color: '#ffd700', opacity: 0.5, fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer', fontStyle: 'italic', letterSpacing: '1px', transition: 'opacity 0.3s ease' }}
                  onMouseEnter={(e) => e.target.style.opacity = 0.9}
                  onMouseLeave={(e) => e.target.style.opacity = 0.5}
                  onClick={() => setShowInfoPopup(true)}
                >
                  ¿Qué es el Oráculo de Vidas Pasadas?
                </button>
              </div>
            </>
          )}

          {thresholdStep === 1 && (
            <>
              <p className="welcome-text">"Primero, dime... ¿cómo debo llamarte en esta encarnación?"</p>
              <input 
                type="text" 
                className="soul-input" 
                placeholder="Tu nombre..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <button className="start-button" onClick={handleNextThreshold}>Continuar</button>
            </>
          )}

          {thresholdStep === 2 && (
            <>
              <p className="welcome-text">"Dime, {userName}... ¿qué susurros han traído tus pasos hacia mí hoy?"</p>
              <input 
                type="text" 
                className="soul-input" 
                placeholder="Lo que inquieta tu paz..."
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
              />
              <button className="start-button" onClick={handleNextThreshold}>Continuar</button>
            </>
          )}

          {thresholdStep === 3 && (
            <>
              <p className="welcome-text">"Antes de consultar a las cartas... ¿prefieres la verdad cruda y directa, o el susurro elocuente de la metáfora?"</p>
              <div className="dichotomy-buttons">
                <button className={`choice-button ${dichotomousChoice === 'direct' ? 'selected' : ''}`} onClick={() => setDichotomousChoice('direct')}>Verdad Directa</button>
                <button className={`choice-button ${dichotomousChoice === 'metaphor' ? 'selected' : ''}`} onClick={() => setDichotomousChoice('metaphor')}>Susurro Metafórico</button>
              </div>
              <button className="start-button" onClick={handleNextThreshold} disabled={!dichotomousChoice}>Continuar</button>
            </>
          )}

          {thresholdStep === 4 && (
            <>
              <p className="welcome-text">
                "Cierra los ojos un instante. Respira. Visualiza aquello que buscas entender. 
                Haz tu pregunta en silencio y permite que las cartas hablen desde tu propia energía."
              </p>
              
              <button className="start-button" onClick={handleNextThreshold} style={{ marginTop: '2rem' }}>Elegir Cartas</button>
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
            <h3 style={{color: '#ffd700', marginBottom: '20px', fontSize: '1.4rem', letterSpacing: '2px', textTransform: 'uppercase'}}>El Espejo del Tiempo</h3>
            <p style={{fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic', color: '#b0b0b5', fontWeight: '300'}}>
              El Oráculo no adivina el futuro; destapa los ecos de tu pasado. 
            </p>
            <p style={{fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '35px', fontStyle: 'italic', color: '#b0b0b5', fontWeight: '300'}}>
              Cada carta es una llave maestra hacia las vidas que ya caminaste. Al sintonizar tu inquietud actual con estos arquetipos, accedemos a tu herida kármica original o a un don de tu alma que creías olvidado. A través del reconocimiento de nuestras encarnaciones pasadas, el universo nos entrega las respuestas más profundas y precisas para desatar nuestros nudos emocionales y espirituales del presente.
            </p>
            <button className="start-button blinking-button" onClick={() => {
              setIsInfoFading(true);
              setTimeout(() => {
                setShowInfoPopup(false);
                setIsInfoFading(false);
              }, 800);
            }}>Comprendo</button>
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
            <h3 style={{color: '#ffd700', marginBottom: '20px', fontSize: '1.6rem', letterSpacing: '2px', textTransform: 'uppercase'}}>El Llamado</h3>
            <p style={{fontSize: '1.2rem', lineHeight: '1.8', marginBottom: '40px', fontStyle: 'italic', color: '#e0e0e0', fontWeight: '300'}}>
              "Concéntrate profundamente en tu inquietud. Transmite tu energía a través de la pantalla... Las cartas te llamarán para ser elegidas. Selecciona exactamente 3."
            </p>
            <button className="start-button blinking-button" onClick={() => {
              setIsPopupFading(true);
              setTimeout(() => {
                setShowSynchronyPopup(false);
                setIsPopupFading(false);
              }, 800);
            }}>ACEPTAR</button>
          </div>
        </div>
      )}

      {phase === 'synchrony' && (
        <div className="synchrony-content">
          <h2 className="phase-title">La Sincronía</h2>
          <>
            <p className="subtitle" style={{ fontSize: '0.9rem', marginBottom: '30px' }}>Haz click en una carta seleccionada para removerla de tu tirada ({selectedCards.length}/3).</p>
            
            <div className="card-grid">
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
              <button className="start-button blinking-button" onClick={() => setPhase('introspection')} style={{ marginTop: '30px' }}>
                Continuar
              </button>
            )}
          </>
        </div>
      )}

      {phase === 'introspection' && (
        <div className="introspection-content threshold-content">
          <h2 className="phase-title" style={{ fontSize: '1.5rem', color: '#c084fc' }}>El Espejo del Alma</h2>
          
          {loading ? (
            <div style={{ marginTop: '20px' }}>
              <p className="welcome-text" style={{ fontSize: '1.2rem', animation: 'slowFadePulse 4s infinite ease-in-out' }}>
                El Vortex está fusionando tus energías con las memorias de tus vidas pasadas...
              </p>
              <p className="subtitle">Un momento de profundo silencio. El universo te está escuchando.</p>
            </div>
          ) : (
            <>
              <p className="welcome-text" style={{ fontSize: '1rem', fontStyle: 'italic' }}>
                "{userName}, las cartas han sido elegidas no por azar, sino por Resonancia Magnética Ancestral. Antes de develar su mensaje, tómate un respiro profundo. Observa el vacío frente a ti y sé honesto con tu corazón..."
              </p>
              
              <div style={{ textAlign: 'left', marginBottom: '30px', marginTop: '20px' }}>
                {introspectionMessage && (
                  <div className="narrative-container" style={{ margin: '0 auto 20px auto', maxWidth: '600px' }}>
                    <div className="brain-bubble narrative fade-in-text" style={{ borderLeftColor: '#c084fc' }}>
                      <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: '#e5e4e7', margin: 0 }}>
                        {introspectionMessage}
                      </p>
                    </div>
                  </div>
                )}
                
                <textarea 
                  className="soul-input" 
                  style={{ height: '120px', resize: 'none', maxWidth: '600px', margin: '0 auto', display: 'block' }}
                  placeholder="Revela tu sentir con total honestidad..."
                  id="deepAnswer"
                />
              </div>

              <button className="start-button blinking-button" onClick={() => {
                const answer = document.getElementById('deepAnswer')?.value || '';
                handleStartRevelation({ introspectionAnswer: answer });
              }}>
                Entregar al Oráculo
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
                    Sintoniza tu intuición con la pregunta que acabas de hacer.<br/>Selecciona una Carta Clarificadora del mazo restante.
                  </p>
                  <div className="card-grid">
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
                <div className="selected-cards-display">
                  {selectedCards.map((card, index) => {
                    const clar = clarifications[card.id];
                    return (
                    <div key={index} className={`revelation-card-block ${revealedStage === index + 1 ? 'active-reveal' : revealedStage > 0 ? 'dimmed' : ''}`} style={{ position: 'relative' }}>
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <Card card={card} isSelected={false} isFaceUp={cardsFlippedCount > index} />
                      </div>
                      
                      {clar?.extraCard && (
                        <div className="clarification-card-wrapper fade-in-text">
                          <Card card={clar.extraCard} isSelected={false} isFaceUp={true} />
                        </div>
                      )}
                    </div>
                  )})}
                </div>
                
                {loading ? (
                  <p className="welcome-text" style={{ marginTop: '20px', animation: 'slowFadePulse 4s infinite ease-in-out' }}>Invocando el conocimiento de tus vidas pasadas...</p>
                ) : (
                  <>
                    {revealedStage > 0 && interpretation && (
                      <div className="narrative-container">
                        <div className="interpretation-bubbles" style={{ opacity: isFading ? 0 : 1, transition: 'opacity 1s ease-in-out' }}>
                          <div className="brain-bubble narrative" key={revealedStage}>
                            <p className="narrative-meta" style={{ color: '#ffd700', fontWeight: 'bold' }}>
                              {revealedStage === 1 && "I. El Origen Kármico"}
                              {revealedStage === 2 && "II. El Bloqueo Presente"}
                              {revealedStage === 3 && "III. El Consejo de Sanación"}
                            </p>
                            
                            <div style={{ marginBottom: '20px' }}>
                              {Array.isArray(interpretation.narrativaAncestral) 
                                ? interpretation.narrativaAncestral[revealedStage - 1]
                                : interpretation.narrativaAncestral}
                            </div>

                            {/* Deepening Extensions */}
                            {(() => {
                              const currentCard = selectedCards[revealedStage - 1];
                              const clarState = clarifications[currentCard.id];
                              
                              if (!clarState) {
                                return (
                                  <button onClick={() => initDeepening(currentCard.id)} className="start-button" style={{ marginTop: '15px', fontSize: '0.8rem', padding: '8px 20px', borderColor: 'rgba(255,215,0,0.4)', color: '#ffd700' }}>
                                    ¿Quieres profundizar esta respuesta?
                                  </button>
                                );
                              }
                              if (clarState.step === 'question') {
                                return (
                                  <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '15px', border: '1px solid rgba(255,215,0,0.2)' }} className="fade-in-text">
                                    <p style={{ fontSize: '1rem', color: '#e0e0e0', marginBottom: '15px' }}>¿Qué detalle exactamente deseas clarificar al Oráculo?</p>
                                    <input type="text" id={`deep-q-${currentCard.id}`} className="soul-input" style={{ marginBottom: '15px', fontSize: '0.95rem' }} placeholder="Tu pregunta profunda aquí..." />
                                    <button onClick={() => submitDeepenQuestion(currentCard.id, document.getElementById(`deep-q-${currentCard.id}`).value)} className="start-button" style={{ borderColor: '#ffd700', color: '#ffd700' }}>
                                      Buscar Claridad
                                    </button>
                                  </div>
                                );
                              }
                              if (clarState.step === 'loading') {
                                return (
                                  <p className="narrative-meta" style={{ marginTop: '30px', animation: 'slowFadePulse 2.5s infinite ease-in-out', color: '#c084fc', fontStyle: 'italic', fontSize: '0.95rem', textAlign: 'center' }}>
                                    Buscando la profundidad interior a través de tus vidas pasadas...
                                  </p>
                                );
                              }
                              if (clarState.step === 'done') {
                                return (
                                  <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed rgba(255,215,0,0.3)' }} className="fade-in-text">
                                    <p className="narrative-meta" style={{ color: '#c084fc', marginBottom: '15px', fontWeight: 'bold' }}>~ Susurro de Clarificación ({clarState.extraCard.name}) ~</p>
                                    <div style={{ color: '#e5e4e7', textAlign: 'left', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                      {clarState.extraResponse}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            
                          </div>
                        </div>
                      </div>
                    )}

                    {autoRevealStarted && cardsFlippedCount === 3 && (
                      <button className={`start-button ${revealedStage === 0 ? 'blinking-button' : ''}`} onClick={handleNextStage} style={{ marginTop: '30px' }}>
                        {revealedStage === 0 ? "Comenzar Lectura" : revealedStage < 3 ? "Continuar al siguiente misterio" : "Ir a la Gran Síntesis"}
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
        <div className="anchoring-content">
          <h2 className="phase-title">El Anclaje Místico</h2>

          {interpretation.conclusionFinal && (
            <div className="brain-bubble narrative fade-in-text" style={{ marginBottom: '40px', borderColor: '#ffd700', margin: '0 auto 40px auto' }}>
              <p className="narrative-meta" style={{ color: '#ffd700', fontSize: '1.2rem', marginBottom: '20px' }}>
                La Gran Síntesis para ti, {userName}...
              </p>
              <p style={{ margin: 0 }}>{interpretation.conclusionFinal}</p>
            </div>
          )}

          <div className="anchoring-grid">
            <div className="anchor-block">
              <h3>Decreto de Sanación</h3>
              <p className="decree-text">"{interpretation.decreto}"</p>
            </div>
            <div className="anchor-block">
              <h3>Tarea Terrenal</h3>
              <p className="task-text">{interpretation.tarea_terrenal}</p>
            </div>
          </div>
          <button className="start-button" onClick={() => window.location.reload()}>Nueva Consulta</button>
        </div>
      )}
      
      </div>
    </div>
  );
}

export default App;
