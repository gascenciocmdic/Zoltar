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
    Instrucciones Paralelas: Eres "El Guía".
    El consultante ${name || 'una alma viajera'} ha llegado a ti con la siguiente inquietud: "${reason}".
    Ha seleccionado estas 3 cartas:
    ${cards.map((c, i) => `${i+1}. ${c.name}: ${c.info}`).join('\n')}

    Genera un ÚNICO MENSAJE (1 o 2 párrafos máximo). Sedúceme, sé misterioso. 
    Llama su atención mencionando sutilmente la energía de las cartas y hazle UNA pregunta final muy profunda para que revele información íntima.

    IMPORTANTE: Responde ESTRICTAMENTE en el idioma: ${language}.
    Responde ÚNICAMENTE con un objeto JSON:
    { "mensajeGuia": "..." }
  `;

  const result = await model.generateContent(prompt);
  return cleanAndParse(result.response.text(), { mensajeGuia: "Tus cartas vibran con una frecuencia inusual. Antes de revelarlo todo... ¿qué es lo que tu corazón teme soltar realmente?" });
}

async function handleInterpretation(model, { cards, reason, userContext, language = 'es' }) {
  const { name, preference, introspectionAnswer } = userContext;
  const toneInstruction = preference === 'direct' 
    ? "Sé directo, profundo y claro."
    : "Sé extremadamente elocuente, usa metáforas seductoras.";

  const prompt = `
    Eres "El Guía". Interpreta las cartas basándote en su significado técnico.
    Datos: Nombre: ${name}, Inquietud: "${reason}", Confesión: "${introspectionAnswer}"
    Cartas: ${cards.map((c, i) => `${i+1}. ${c.name}: ${c.info}`).join('\n')}

    Genera una lectura MUY EXTENSA (3 párrafos por carta).
    Responde ÚNICAMENTE con un objeto JSON:
    {
      "narrativaAncestral": ["...", "...", "..."],
      "conclusionFinal": "...",
      "decreto": "...",
      "tarea_terrenal": "...",
      "vibe": "healing_blue"
    }
    ${toneInstruction}
    Idioma: ${language}
  `;

  const result = await model.generateContent(prompt);
  return cleanAndParse(result.response.text(), { 
    narrativaAncestral: ["El pasado se siente denso...", "Hay ecos de gloria y pérdida...", "La sanación requiere paciencia..."],
    conclusionFinal: "Tus vidas pasadas te observan con amor. El camino se aclara.",
    decreto: "Suelto lo que ya no me pertenece.",
    tarea_terrenal: "Enciende una vela y medita en el silencio.",
    vibe: "healing_blue"
  });
}

async function handleAnchoring(model, { selectedCards, visitReason, dichotomy, userName, clarifications, language = 'es' }) {
  const cardsContext = selectedCards.map(c => `[${c.name}]: ${c.meaning}`).join('\n');
  const prompt = `
    Entregar la 'Gran Síntesis' Final para ${userName}.
    Responde ESTRICTAMENTE en el idioma: ${language}.
    Responde estrictamente en formato JSON: { "conclusionFinal": "..." }
  `;

  const result = await model.generateContent(prompt);
  return cleanAndParse(result.response.text(), { conclusionFinal: "La sincronía es perfecta. Tu viaje apenas comienza." });
}

async function handleDeepening(model, { originalCard, extraCard, userQuestion, previousReading, context, language = 'es' }) {
  const prompt = `
    Eres el Guía. El viajero "${context.userName}" pregunta: "${userQuestion}".
    Carta clarificadora: "${extraCard.name}: ${extraCard.info}".
    Entrega un "Susurro de Clarificación" poético y extenso (3 párrafos).
    Responde ESTRICTAMENTE en el idioma: ${language}.
    Responde en JSON: { "deepeningResponse": "..." }
  `;

  const result = await model.generateContent(prompt);
  return cleanAndParse(result.response.text(), { deepeningResponse: "misfire" });
}
