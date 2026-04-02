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
    if (!match) throw new Error("No JSON found");
    const cleanJson = match[0];
    sanitized = cleanJson.replace(/\r?\n/g, " ").replace(/\t/g, " ").replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); 
    const parsed = JSON.parse(sanitized);
    return { ...parsed, __IS_FALLBACK__: false };
  } catch (e) {
    return { ...fallback, __IS_FALLBACK__: true, _debug: { error: "JSON_PARSE_ERROR: " + e.message, raw: text } };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { action, payload } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API Key is missing.' });

  const genAI = new GoogleGenerativeAI(apiKey);
  // Switching to v1 (stable) to avoid 404 on v1beta in some environments
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });

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
      narrativaAncestral: ["El pasado se siente denso...", "La visión se nubla...", "Confía en tu intuición..."],
      conclusionFinal: "La visión se fragmenta.",
      decreto: "Confío en mi proceso.",
      tarea_terrenal: "Respira profundo.",
      vibe: "healing_blue"
    });
  }
}

async function handleIntrospection(model, { cards, userContext, language = 'es' }) {
  const { name, reason } = userContext || {};
  const prompt = `Saluda a ${name}. Contexto: ${reason}. Cartas: ${cards.map(c => c.name).join(', ')}. JSON: { "mensajeGuia" }. Idioma: ${language}`;
  const fallback = { mensajeGuia: "Los ecos resuenan..." };
  try {
    const result = await model.generateContent(prompt);
    return cleanAndParse(result.response.text(), fallback);
  } catch (e) { return { ...fallback, __IS_FALLBACK__: true, _debug: { error: e.message } }; }
}

async function handleInterpretation(model, { cards, reason, introspectionAnswer, userContext, language }) {
  const { name } = userContext || {};
  const prompt = `Revelación para ${name}. Inquietud: ${reason}. Sentir: ${introspectionAnswer}. Cartas: ${cards.map(c => c.name).join(', ')}. JSON místico con narrativaAncestral (3 párrafos), conclusionFinal, decreto, tarea_terrenal. Idioma: ${language}`;
  const fallback = { 
    narrativaAncestral: ["El pasado se siente denso...", "Hay ecos de gloria...", "La sanación requiere paciencia..."],
    conclusionFinal: "Tus vidas pasadas te observan con amor.",
    decreto: "Suelto lo que ya no me pertenece.",
    tarea_terrenal: "Enciende una vela.",
    vibe: "healing_blue"
  };
  try {
    const result = await model.generateContent(prompt);
    return cleanAndParse(result.response.text(), fallback);
  } catch (e) { return { ...fallback, __IS_FALLBACK__: true, _debug: { error: e.message } }; }
}

async function handleAnchoring(model, { name, reason, clarifications, language }) {
  const prompt = `Sintetiza para ${name}. Inquietud: ${reason}. Clarificaciones: ${JSON.stringify(clarifications)}. JSON: { "conclusionFinal", "decreto", "tarea_terrenal" }. Idioma: ${language}`;
  const fallback = { conclusionFinal: "La sincronía se sella.", decreto: "Confío.", tarea_terrenal: "Agradece." };
  try {
    const result = await model.generateContent(prompt);
    return cleanAndParse(result.response.text(), fallback);
  } catch (e) { return { ...fallback, __IS_FALLBACK__: true, _debug: { error: e.message } }; }
}

async function handleDeepening(model, { originalCard, extraCard, userQuestion, language = 'es' }) {
  const prompt = `Clarifica: ${userQuestion}. Cartas: ${originalCard.name}, ${extraCard.name}. JSON: { "deepeningResponse" }. Idioma: ${language}`;
  const fallback = { deepeningResponse: "Hilos frágiles..." };
  try {
    const result = await model.generateContent(prompt);
    return cleanAndParse(result.response.text(), fallback);
  } catch (e) { return { ...fallback, __IS_FALLBACK__: true, _debug: { error: e.message } }; }
}
