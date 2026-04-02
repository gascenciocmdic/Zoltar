// Helper to clean and parse JSON from Gemini's response
function cleanAndParse(text, fallback) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const cleanJson = match ? match[0] : text;
    // Remove potential control characters that break JSON.parse
    const sanitized = cleanJson.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    return JSON.parse(sanitized);
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", e, "Original text:", text);
    return fallback;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, payload } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    safetySettings,
    generationConfig: { responseMimeType: "application/json" }
  });

  try {
    let result;
    switch (action) {
      case 'introspection':
        result = await handleIntrospection(model, payload);
        break;
      case 'interpretation':
        result = await handleInterpretation(model, payload);
        break;
      case 'anchoring':
        result = await handleAnchoring(model, payload);
        break;
      case 'deepening':
        result = await handleDeepening(model, payload);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Critical error in Gemini action ${action}:`, error);
    // Generic fallback if even the specialized handlers fail
    return res.status(200).json({ 
      error: true,
      mensajeGuia: "El éter está agitado ahora mismo. Respira profundo mientras las mallas del tiempo se asientan...",
      narrativaAncestral: ["El susurro es difuso...", "La visión se nubla...", "Confía en tu intuición..."],
      deepeningResponse: "misfire" // Signal for frontend to use oracle_misfire
    });
  }
}

async function handleIntrospection(model, { cards, userContext, language = 'es' }) {
  const { name, reason } = userContext;
  const prompt = `
    Eres "El Guía" del Oráculo de Vidas Pasadas.
    El consultante ${name || 'una alma viajera'} pregunta: "${reason}".
    Ha seleccionado estas 3 cartas:
    ${cards.map((c, i) => `${i+1}. ${c.name}: ${c.info}`).join('\n')}

    Genera un mensaje misterioso y breve (1 párrafo). 
    Menciona cómo estas cartas vibran con su inquietud específica. 
    Termina con UNA pregunta final muy profunda que lo obligue a confesar algo íntimo sobre su sentir actual.

    Idioma: ${language}
    Responde ÚNICAMENTE con un objeto JSON:
    { "mensajeGuia": "..." }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return cleanAndParse(text, { mensajeGuia: "Tus cartas vibran con una frecuencia inusual. Antes de revelarlo todo... ¿qué es lo que tu corazón teme soltar realmente?" });
}

async function handleInterpretation(model, { cards, reason, userContext, language = 'es' }) {
  const { name, preference, introspectionAnswer } = userContext;
  const toneInstruction = preference === 'direct' 
    ? "Sé directo, profundo y claro. Sin rodeos."
    : "Usa metáforas poéticas y seductoras, pero mantente enfocado en la respuesta.";

  const prompt = `
    Eres "El Guía". Interpreta estas cartas para ${name}.
    Contexto: Inquietud: "${reason}", Sentir Íntimo: "${introspectionAnswer}".
    Cartas:
    ${cards.map((c, i) => `${i+1}. ${c.name}: ${c.info}`).join('\n')}

    INSTRUCCIONES:
    1. Relaciona CADA carta de forma EXCLUSIVA con la inquietud y el sentir del usuario. 
    2. Evita interpretaciones genéricas. 
    3. Máximo 1 o 2 párrafos concisos por carta. 
    4. El "decreto" y "tarea_terrenal" deben ser acciones prácticas y frases cortas.

    Idioma: ${language}
    Responde ÚNICAMENTE con un objeto JSON:
    {
      "narrativaAncestral": ["Interpretación carta 1", "Interpretación carta 2", "Interpretación carta 3"],
      "conclusionFinal": "Resumen final corto",
      "decreto": "Frase de poder corta",
      "tarea_terrenal": "Acción física breve",
      "vibe": "healing_blue"
    }
    ${toneInstruction}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return cleanAndParse(text, { 
    narrativaAncestral: ["El pasado se siente denso...", "Hay ecos de gloria y pérdida...", "La sanación requiere paciencia..."],
    conclusionFinal: "Tus vidas pasadas te observan con amor. El camino se aclara.",
    decreto: "Suelto lo que ya no me pertenece.",
    tarea_terrenal: "Enciende una vela y medita en el silencio.",
    vibe: "healing_blue"
  });
}

async function handleAnchoring(model, { selectedCards, visitReason, dichotomy, userName, clarifications, language = 'es' }) {
  const cardsInfo = selectedCards.map(c => `[${c.name}]: ${c.info}`).join(', ');
  const clarInfo = Object.entries(clarifications).map(([id, data]) => `Duda sobre carta ${id}: ${data.question} -> Clarificado por ${data.extraCard?.name}: ${data.extraResponse}`).join('\n');

  const prompt = `
    Como "El Guía", entrega la 'Gran Síntesis' Final para ${userName}.
    Resumen de Sesión:
    - Inquietud Inicial: "${visitReason}"
    - Cartas Elegidas: ${cardsInfo}
    - Clarificaciones Realizadas: ${clarInfo || 'Ninguna'}

    TAREA: Crea una conclusión final COHERENTE, PROFUNDA y CONCISA (máximo 2 párrafos). 
    Une todos los puntos de la sesión para darle al usuario una dirección clara sobre su inquietud original.

    Idioma: ${language}
    Responde estrictamente en formato JSON: { "conclusionFinal": "..." }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return cleanAndParse(text, { conclusionFinal: "La sincronía es perfecta. Tu viaje apenas comienza." });
}

async function handleDeepening(model, { originalCard, extraCard, userQuestion, previousReading, context, language = 'es' }) {
  const prompt = `
    Eres El Guía. El viajero "${context.userName}" tiene una duda específica: "${userQuestion}".
    Esta duda surge tras leer sobre la carta "${originalCard.name}".
    La carta clarificadora es: "${extraCard.name}: ${extraCard.info}".

    TAREA: Explica de forma concisa (1 o 2 párrafos) cómo la carta clarificadora resuelve exactamente la duda sobre la "${originalCard.name}" y cómo se aplica a la vida del usuario.
    Sé poético pero muy AL GRANO.

    Idioma: ${language}
    Responde en JSON: { "deepeningResponse": "..." }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return cleanAndParse(text, { deepeningResponse: "misfire" });
}
