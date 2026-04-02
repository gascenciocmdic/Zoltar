import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { action, payload } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API Key missing.' });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    safetySettings,
    generationConfig: { responseMimeType: "application/json" }
  });

  try {
    switch (action) {
      case 'introspection': return res.status(200).json(await handleIntrospection(model, payload));
      case 'interpretation': return res.status(200).json(await handleInterpretation(model, payload));
      case 'anchoring': return res.status(200).json(await handleAnchoring(model, payload));
      case 'deepening': return res.status(200).json(await handleDeepening(model, payload));
      default: return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleIntrospection(model, { cards, userContext, language = 'es' }) {
  const { name, reason } = userContext || {};
  const prompt = `Guía del Oráculo. Consultante: ${name}. Inquietud: ${reason}. Cartas: ${cards.map(c => c.name).join(', ')}. JSON: { "mensajeGuia" }. Idioma: ${language}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

async function handleInterpretation(model, { cards, reason, introspectionAnswer, userContext, language = 'es' }) {
  const { name } = userContext || {};
  const prompt = `Guía. Usuario: ${name}. Inquietud: ${reason}. Sentir: ${introspectionAnswer}. Cartas: ${cards.map(c => c.name).join(', ')}. JSON: { narrativaAncestral: [3 párrafos], conclusionFinal, decreto, tarea_terrenal }. Idioma: ${language}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

async function handleAnchoring(model, { selectedCards, visitReason, userName, clarifications, language = 'es' }) {
  const prompt = `Sintesis para ${userName}. Inquietud: ${visitReason}. JSON: { conclusionFinal }. Idioma: ${language}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

async function handleDeepening(model, { originalCard, extraCard, userQuestion, context, language = 'es' }) {
  const prompt = `Profundiza para ${context.userName}: ${userQuestion}. Cartas: ${originalCard.name}, ${extraCard.name}. JSON: { deepeningResponse }. Idioma: ${language}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}
