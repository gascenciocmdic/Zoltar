import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import VortexCanvas from './vortex/VortexCanvas';
import Card from './components/Card';
import { interpretCards, generateIntrospection, generateAnchoring, generateDeepening } from './api/gemini';
import { cardsData } from './data/cards';
import { initSpeech, toggleMute, speakText, stopSpeech, startAmbientMusic, stopAmbient } from './utils/speech';
import TypewriterText from './components/TypewriterText';
import Dragonfly from './components/Dragonfly';

const GREETINGS = [
  "Soy El Guía, tu puente entre lo que fuiste y lo que eres. He caminado mil vidas para encontrarte en este preciso instante. ¿Me permites acompañarte en este viaje de retorno hacia tu propia luz?",
  "Bienvenido, alma viajera. Soy el guardián de los Ecos Pasados. ¿Estás listo para correr el velo del tiempo y mirar hacia atrás?",
  "Los hilos del destino nos han reunido. Soy El Guía de Vidas Pasadas. ¿Me das permiso para desentrañar el origen de tu caminar actual?",
  "Has sido convocado por fuerzas más antiguas que el sol. Soy quien habita entre las sombras del ayer y la promesa del mañana. ¿Aceptas mi mano?",
  "Las estrellas me dijeron que vendrías. Soy El Guía, y mi voz es la voz de tus ancestros. ¿Estás dispuesto a escuchar lo que tu alma ya sabe?",
  "El universo no comete errores; si estás aquí, es porque tus vidas pasadas necesitan hablarte. Soy su intérprete. ¿Me concedes ese honor?",
  "Del otro lado del espejo del tiempo, te esperaba. Soy El Guía de aquellos que buscan respuestas en los ecos de lo que fueron. ¿Avanzamos juntos?",
  "Tu llegada fue escrita en los registros akáshicos hace eones. Soy la llave que abrirá esos pergaminos. ¿Me permites girar?",
  "Percibo en ti una vibración ancestral muy particular. Soy El Guía, y reconozco el peso de las vidas que has cargado. ¿Deseas aligerarlo hoy?",
  "El portal se ha abierto para ti. Soy el custodio de memorias que trascienden el tiempo. ¿Te atreves a recordar quién fuiste?"
];

const ASK_NAMES = [
  "Primero, dime... ¿cómo debo llamarte en esta encarnación?",
  "Para iniciar nuestro vínculo... ¿cuál es el nombre que llevas en esta vida?",
  "Antes de abrir el portal... ¿con qué nombre se te conoce hoy en el plano físico?",
  "Cada nombre guarda una vibración sagrada. Dime el tuyo, viajero...",
  "Las cartas necesitan saber a quién le hablan. ¿Cuál es tu nombre en esta realidad?",
  "El Oráculo no puede ver tu rostro sin conocer primero tu nombre. ¿Cómo te llamas?",
  "Para tejer el hilo que conecta tus vidas... necesito saber tu nombre en esta.",
  "Antes de que las cartas susurren... dime, ¿con qué nombre late tu corazón hoy?"
];

const WAIT_MESSAGES = [
  "El Vortex está fusionando tus energías con las memorias de tus vidas pasadas...",
  "Invocando el conocimiento de tus vidas pasadas. Las mareas del tiempo se agitan...",
  "Silencio... las almas de antaño están susurrando sus verdades sobre ti.",
  "Los registros akáshicos se están abriendo. Tu historia ancestral emerge del silencio...",
  "Las cartas vibran con una frecuencia que solo tú puedes sentir. Escucha el eco...",
  "El universo está tejiendo los hilos de tu pasado con las fibras de tu presente...",
  "Un portal dimensional se abre. Las memorias de tus encarnaciones fluyen hacia aquí...",
  "Los guardianes del tiempo están consultando tus registros. Respira profundamente...",
  "Tu energía está siendo leída por fuerzas ancestrales. El silencio es parte del ritual...",
  "Las constelaciones de tu karma se están alineando. Un momento de paciencia sagrada..."
];

function App() {
  const sessionTexts = useMemo(() => ({
    greeting: GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
    askName: ASK_NAMES[Math.floor(Math.random() * ASK_NAMES.length)],
    waitMsg: WAIT_MESSAGES[Math.floor(Math.random() * WAIT_MESSAGES.length)]
  }), []);

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
  
  const [hasStarted, setHasStarted] = useState(false);
  const [isMutedState, setIsMutedState] = useState(false);

  useEffect(() => {
    initSpeech();
    return () => { stopSpeech(); stopAmbient(); };
  }, []);

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
    speakText(sessionTexts.askName);
    setTimeout(() => {
      setThresholdStep(1);
      setIsFading(false);
    }, 1500); // 1.5 second profound pause
  };

  const handleNextThreshold = () => {
    if (thresholdStep === 1 && !userName) return alert("Dime tu nombre, alma viajera...");
    if (thresholdStep === 2 && !visitReason) return alert("Cuéntame un poco más...");
    
    setIsFading(true);
    
    // Narradores
    if (thresholdStep === 1) {
      speakText(`Dime, ${userName}... ¿qué susurros han traído tus pasos hacia mí hoy?`);
    } else if (thresholdStep === 2) {
      speakText("Antes de consultar a las cartas... ¿prefieres la verdad cruda y directa, o el susurro elocuente de la metáfora?");
    } else if (thresholdStep === 3) {
      speakText("Cierra los ojos un instante. Respira. Visualiza aquello que buscas entender. Haz tu pregunta en silencio y permite que las cartas hablen desde tu propia energía.");
    }

    setTimeout(() => {
      if (thresholdStep < 4) {
        setThresholdStep(thresholdStep + 1);
      } else {
        setPhase('synchrony');
        setVibe('revelation_gold');
        setShowSynchronyPopup(true);
        speakText("Concéntrate profundamente en tu inquietud. Transmite tu energía a través de la pantalla. Las cartas te llamarán para ser elegidas. Selecciona exactamente tres.");
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
    speakText(sessionTexts.waitMsg);
    try {
      const userContext = { name: userName, reason: visitReason };
      const result = await generateIntrospection(selectedCards, null, userContext);
      setIntrospectionMessage(result.mensajeGuia);
      setPhase('introspection');
      setLoading(false);
      setVibe('healing_blue');
      speakText(`${userName}, las cartas han sido elegidas no por azar, sino por Resonancia Magnética Ancestral. Antes de develar su mensaje, tómate un respiro profundo. Observa el vacío frente a ti y sé honesto con tu corazón...`);
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
    speakText(sessionTexts.waitMsg);
    
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
          if (nextStage === 1) prefix = "El Origen Kármico. ";
          if (nextStage === 2) prefix = "El Bloqueo Presente. ";
          if (nextStage === 3) prefix = "El Consejo de Sanación. ";
          speakText(prefix + textToRead);
        }
      }, 1500);
    } else {
      setIsFading(true);
      setTimeout(async () => {
        setPhase('anchoring');
        setIsFading(false);
        try {
          // Anchoring now waits for clarifications too
          const finalSynthesis = await generateAnchoring(selectedCards, visitReason, dichotomousChoice, userName, clarifications, null);
          setAnchoringReading(finalSynthesis);
          speakText(`La Gran Síntesis para ti, ${userName}. ${finalSynthesis.conclusionFinal} Decreto de Sanación: ${finalSynthesis.decreto}. Tarea terrenal: ${finalSynthesis.tarea_terrenal}`);
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
    speakText("Sintoniza tu intuición con la pregunta que acabas de hacer. Selecciona una Carta Clarificadora del mazo restante.");
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
    speakText("Buscando la profundidad interior a través de tus vidas pasadas...");
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
          speakText(`Susurro de Clarificación. ${resp}`);
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
      {!hasStarted && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <h2 style={{color: '#ffd700', letterSpacing: '3px', marginBottom: '30px', textTransform: 'uppercase', fontSize: '2rem', textAlign: 'center'}}>El Oráculo de Vidas Pasadas</h2>
          <button className="start-button blinking-button" onClick={() => {
            initSpeech();
            startAmbientMusic();
            setHasStarted(true);
            setTimeout(() => {
              speakText(sessionTexts.greeting);
            }, 600);
          }}>Entrar al Portal</button>
        </div>
      )}

      {/* Botón Silenciar Global */}
      <button 
        onClick={() => setIsMutedState(toggleMute())}
        title={isMutedState ? "Activar Voz" : "Silenciar Guía"}
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
              <p className="welcome-text"><TypewriterText text={`"${sessionTexts.askName}"`} speed={45} /></p>
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
              <p className="welcome-text"><TypewriterText text={`"Dime, ${userName}... ¿qué susurros han traído tus pasos hacia mí hoy?"`} speed={45} /></p>
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
              <p className="welcome-text"><TypewriterText text={`"Antes de consultar a las cartas... ¿prefieres la verdad cruda y directa, o el susurro elocuente de la metáfora?"`} speed={45} /></p>
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
                <TypewriterText text={`"Cierra los ojos un instante. Respira. Visualiza aquello que buscas entender. Haz tu pregunta en silencio y permite que las cartas hablen desde tu propia energía."`} speed={45} />
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
              <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '100%', maxWidth: '300px' }}>
                <button className="start-button blinking-button" onClick={() => setPhase('introspection')} style={{ background: 'rgba(20,22,28,0.95)', padding: '15px 50px', boxShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.4)', display: 'block', margin: '0 auto', width: '100%' }}>
                  Continuar
                </button>
              </div>
            )}
          </>
        </div>
      )}

      {phase === 'introspection' && (
        <div className="introspection-content threshold-content">
          <h2 className="phase-title" style={{ fontSize: '1.5rem', color: '#c084fc' }}>El Espejo del Alma</h2>
          
          {loading ? (
            <div style={{ marginTop: '20px' }}>
              <p className="welcome-text" style={{ fontSize: '1.2rem', animation: 'slowFadePulse 4s infinite ease-in-out', textAlign: 'center' }}>
                <TypewriterText text={sessionTexts.waitMsg} speed={45} />
              </p>
              <p className="subtitle" style={{ textAlign: 'center' }}><TypewriterText text="Un momento de profundo silencio. El universo te está escuchando." speed={40} /></p>
            </div>
          ) : (
            <>
              <p className="welcome-text" style={{ fontSize: '1rem', fontStyle: 'italic' }}>
                <span className="reveal-text">{`"${userName}, las cartas han sido elegidas no por azar, sino por Resonancia Magnética Ancestral. Antes de develar su mensaje, tómate un respiro profundo. Observa el vacío frente a ti y sé honesto con tu corazón..."`}</span>
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
                <div className="selected-cards-display" style={{ position: 'relative' }}>
                  <Dragonfly visible={cardsFlippedCount < 3} />
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
                              {revealedStage === 1 && "I. El Origen Kármico"}
                              {revealedStage === 2 && "II. El Bloqueo Presente"}
                              {revealedStage === 3 && "III. El Consejo de Sanación"}
                            </p>
                            
                            <div style={{ marginBottom: '20px' }}>
                              <span className="reveal-text">{Array.isArray(interpretation.narrativaAncestral) 
                                ? interpretation.narrativaAncestral[revealedStage - 1]
                                : interpretation.narrativaAncestral}</span>
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
                                      <p style={{ fontSize: '1rem', color: '#e0e0e0', marginBottom: '15px' }}>
                                        <TypewriterText text="¿Qué detalle exactamente deseas clarificar al Oráculo?" speed={45} />
                                      </p>
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
                                    <TypewriterText text="Buscando la profundidad interior a través de tus vidas pasadas..." speed={40} />
                                  </p>
                                );
                              }
                              if (clarState.step === 'done') {
                                return (
                                  <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed rgba(255,215,0,0.3)' }} className="fade-in-text">
                                    <p className="narrative-meta" style={{ color: '#c084fc', marginBottom: '15px', fontWeight: 'bold' }}>~ Susurro de Clarificación ({clarState.extraCard.name}) ~</p>
                                    <div style={{ color: '#e5e4e7', textAlign: 'center', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                      <span className="reveal-text">{clarState.extraResponse}</span>
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
          <h2 className="phase-title" style={{ textAlign: 'center' }}>El Anclaje Místico</h2>

          <div className="selected-cards-display" style={{ marginBottom: '40px', marginTop: '20px' }}>
            {selectedCards.map((card, index) => (
              <div key={index} className="revelation-card-block" style={{ padding: '15px', maxWidth: '160px' }}>
                <Card card={card} isSelected={false} isFaceUp={true} />
              </div>
            ))}
          </div>

          {interpretation.conclusionFinal && (
            <div className="brain-bubble narrative fade-in-text" style={{ marginBottom: '40px', borderColor: '#ffd700', margin: '0 auto 40px auto' }}>
              <p className="narrative-meta" style={{ color: '#ffd700', fontSize: '1.2rem', marginBottom: '20px' }}>
                <span className="reveal-text">{`La Gran Síntesis para ti, ${userName}...`}</span>
              </p>
              <p style={{ margin: 0 }}><span className="reveal-text">{interpretation.conclusionFinal}</span></p>
            </div>
          )}

          <div className="anchoring-grid">
            <div className="anchor-block">
              <h3>Decreto de Sanación</h3>
              <p className="decree-text"><span className="reveal-text">{`"${interpretation.decreto}"`}</span></p>
            </div>
            <div className="anchor-block">
              <h3>Tarea Terrenal</h3>
              <p className="task-text"><span className="reveal-text">{interpretation.tarea_terrenal}</span></p>
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
