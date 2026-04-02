import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

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
      conclusionFinal: "La visión se fragmenta, pero la luz persiste.",
      decreto: "Confío en mi proceso.",
      tarea_terrenal: "Respira profundo y mantente presente.",
      vibe: "healing_blue",
      deepeningResponse: "El susurro es difuso por ahora..."
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
    Menciona cómo estas cartas vibran con su inquietud específica ("${reason}"). 
    Termina con UNA pregunta final muy profunda que lo obligue a confesar algo íntimo sobre su sentir actual.

    Idioma: ${language}
    Responde ÚNICAMENTE con un objeto JSON:
    { "mensajeGuia": "..." }
  `;

  const fallback = { mensajeGuia: "Tus cartas vibran con una frecuencia inusual. Antes de revelarlo todo... ¿qué es lo que tu corazón teme soltar realmente?" };
  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text() || "";
    return cleanAndParse(text, fallback);
  } catch (e) {
    console.error("Introspection API Error:", e);
    return fallback;
  }
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
    1. Relaciona CADA carta de forma EXCLUSIVA con la inquietud ("${reason}") y el sentir ("${introspectionAnswer}") del usuario. 
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

  const fallback = { 
    narrativaAncestral: ["El pasado se siente denso...", "Hay ecos de gloria y pérdida...", "La sanación requiere paciencia..."],
    conclusionFinal: "Tus vidas pasadas te observan con amor. El camino se aclara.",
    decreto: "Suelto lo que ya no me pertenece.",
    tarea_terrenal: "Enciende una vela y medita en el silencio.",
    vibe: "healing_blue"
  };

  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text() || "";
    return cleanAndParse(text, fallback);
  } catch (e) {
    console.error("Interpretation API Error:", e);
    return fallback;
  }
}

async function handleAnchoring(model, { selectedCards, visitReason, dichotomy, userName, clarifications, language = 'es' }) {
  const cardsInfo = selectedCards.map(c => `[${c.name}]: ${c.info}`).join(', ');
  const clarEntries = Object.entries(clarifications || {});
  const clarInfo = clarEntries.length > 0 
    ? clarEntries.map(([id, data]) => `Duda sobre carta ${id}: ${data.question} -> Clarificado por ${data.extraCard?.name}: ${data.extraResponse}`).join('\n')
    : 'Ninguna';

  const prompt = `
    Como "El Guía", entrega la 'Gran Síntesis' Final para ${userName}.
    Resumen de Sesión:
    - Inquietud Inicial: "${visitReason}"
    - Cartas Elegidas: ${cardsInfo}
    - Clarificaciones Realizadas: ${clarInfo}

    TAREA: Crea una conclusión final COHERENTE, PROFUNDA y CONCISA (máximo 2 párrafos). 
    Une todos los puntos de la sesión para darle al usuario una dirección clara sobre su inquietud original.
    También genera un nuevo "decreto" y una "tarea_terrenal" finales basados en toda la experiencia.

    Idioma: ${language}
    Responde estrictamente en formato JSON: 
    { 
      "conclusionFinal": "...",
      "decreto": "Frase de poder final",
      "tarea_terrenal": "Acción física recomendada"
    }
  `;

  const fallback = { 
    conclusionFinal: "La sincronía es perfecta. Tu viaje apenas comienza.",
    decreto: "Confío en mi propia sabiduría ancestral.",
    tarea_terrenal: "Lleva contigo un símbolo de esta visión."
  };

  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text() || "";
    return cleanAndParse(text, fallback);
  } catch (e) {
    console.error("Anchoring API Error:", e);
    return fallback;
  }
}

async function handleDeepening(model, { originalCard, extraCard, userQuestion, previousReading, context, language = 'es' }) {
  const prompt = `
    Eres El Guía. El viajero "${context?.userName || 'alma viajera'}" tiene una duda específica: "${userQuestion}".
    Esta duda surge tras leer sobre la carta "${originalCard?.name}".
    La carta clarificadora es: "${extraCard?.name}: ${extraCard?.info}".

    TAREA: Explica de forma concisa (1 o 2 párrafos) cómo la carta clarificadora resuelve exactamente la duda sobre la "${originalCard?.name}" y cómo se aplica a la vida del usuario.
    Sé poético pero muy AL GRANO.

    Idioma: ${language}
    Responde en JSON: { "deepeningResponse": "..." }
  `;

  const fallback = { deepeningResponse: "Los hilos de esta visión son frágiles por ahora. Confía en lo que ya has sentido en tu corazón." };
  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text() || "";
    return cleanAndParse(text, fallback);
  } catch (e) {
    console.error("Deepening API Error:", e);
    return fallback;
  }
}
