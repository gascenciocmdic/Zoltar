import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function cleanAndParse(text, fallback) {
  let sanitized = "";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const cleanJson = match ? match[0] : text;
    sanitized = cleanJson.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    const parsed = JSON.parse(sanitized);
    return { ...parsed, __IS_FALLBACK__: false };
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", e, "Original text:", text);
    return { ...fallback, __IS_FALLBACK__: true, _debug: { error: e.message, raw: text, sanitized: sanitized.slice(0, 300) + "..." } };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { action, payload } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API Key is not configured.' });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });

  try {
    let result;
    switch (action) {
      case 'introspection': result = await handleIntrospection(model, payload); break;
      case 'interpretation': result = await handleInterpretation(model, payload); break;
      case 'anchoring': result = await handleAnchoring(model, payload); break;
      case 'deepening': result = await handleDeepening(model, payload); break;
      default: return res.status(400).json({ error: 'Invalid action' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({ 
      __IS_FALLBACK__: true,
      _debug: { error: error.message, api_failure: true },
      mensajeGuia: "El éter está agitado. Respira profundo...",
      narrativaAncestral: ["El susurro es difuso...", "La visión se nubla...", "Confía en tu intuición..."],
      conclusionFinal: "La visión se fragmenta.",
      decreto: "Confío en mi proceso.",
      tarea_terrenal: "Respira profundo.",
      vibe: "healing_blue"
    });
  }
}

async function handleIntrospection(model, { cards, userContext, language = 'es' }) {
  const { name, reason } = userContext || {};
  const prompt = `Eres El Guía. Consultante: ${name}. Inquietud: ${reason}. Cartas: ${cards.map(c => c.name).join(', ')}. Genera un JSON: { "mensajeGuia": "..." }. Idioma: ${language}`;
  const fallback = { mensajeGuia: "Tus cartas vibran con una frecuencia inusual..." };
  try {
    const result = await model.generateContent(prompt);
    return cleanAndParse(result.response.text(), fallback);
  } catch (e) { return { ...fallback, __IS_FALLBACK__: true, _debug: { error: e.message } }; }
}

async function handleInterpretation(model, { cards, reason, introspectionAnswer, userContext, language }) {
  const { name } = userContext || {};
  const prompt = `Eres El Guía. Usuario: ${name}. Inquietud: ${reason}. Sentir: ${introspectionAnswer}. Cartas: ${cards.map(c => c.name).join(', ')}. Genera JSON con narrativaAncestral (3 párrafos), conclusionFinal, decreto, tarea_terrenal. Idioma: ${language}`;
  const fallback = { 
    narrativaAncestral: [
      "El pasado se siente denso y lleno de secretos antiguos. Los ecos de tus encarnaciones previas vibran en esta carta, señalando que tu camino actual está profundamente ligado a una herida o un don que aún no logras reconocer completamente.",
      "Hay ecos de gloria y pérdida resonando a través de los siglos. Esta visión muestra que has caminado por senderos de gran poder y también de renuncias dolorosas.",
      "La sanación requiere paciencia y una conexión sincera con tu linaje ancestral. Esta carta te invita a soltar los nudos kármicos que te atan a patrones repetitivos."
    ],
    conclusionFinal: "Tus vidas pasadas te observan con amor.",
    decreto: "Suelto lo que ya no me pertenece.",
    tarea_terrenal: "Enciende una vela y medita.",
    vibe: "healing_blue"
  };
  try {
    const result = await model.generateContent(prompt);
    return cleanAndParse(result.response.text(), fallback);
  } catch (e) { return { ...fallback, __IS_FALLBACK__: true, _debug: { error: e.message } }; }
}

async function handleAnchoring(model, { name, reason, clarifications, language }) {
  const prompt = `Como El Guía, sintetiza para ${name}. Inquietud: ${reason}. Clarificaciones: ${JSON.stringify(clarifications)}. JSON: { "conclusionFinal", "decreto", "tarea_terrenal" }. Idioma: ${language}`;
  const fallback = { conclusionFinal: "La sincronía se sella.", decreto: "Confío.", tarea_terrenal: "Agradece." };
  try {
    const result = await model.generateContent(prompt);
    return cleanAndParse(result.response.text(), fallback);
  } catch (e) { return { ...fallback, __IS_FALLBACK__: true, _debug: { error: e.message } }; }
}

async function handleDeepening(model, { originalCard, extraCard, userQuestion, language = 'es' }) {
  const prompt = `Clarifica: ${userQuestion}. Cartas: ${originalCard.name}, ${extraCard.name}. Idioma: ${language}. JSON: { "deepeningResponse" }`;
  const fallback = { deepeningResponse: "Hilos frágiles..." };
  try {
    const result = await model.generateContent(prompt);
    return cleanAndParse(result.response.text(), fallback);
  } catch (e) { return { ...fallback, __IS_FALLBACK__: true, _debug: { error: e.message } }; }
}
