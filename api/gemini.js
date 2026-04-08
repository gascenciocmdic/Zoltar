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
    model: "gemini-2.0-flash",
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
  const cardNames = Array.isArray(cards) ? cards.map(c => c.name).join(', ') : 'cartas desconocidas';
  const prompt = `Eres Zoltar, un oráculo ancestral y guía espiritual profundo. El consultante se llama ${name || 'alma'} y su inquietud es: "${reason || 'búsqueda espiritual'}". Las cartas que ha elegido son: ${cardNames}.

Genera un mensaje de introspección personal, empático y evocador (2-3 oraciones) que invite al consultante a reflexionar sobre su inquietud antes de la revelación. El mensaje debe sentirse como una preparación ritual, mística y serena. Responde SOLO en idioma "${language}".

Responde ÚNICAMENTE con JSON válido, sin texto adicional, en este formato exacto:
{
  "mensajeGuia": "[tu mensaje de introspección aquí]"
}`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/{[\s\S]*}/);
    return JSON.parse(match ? match[0] : text);
  } catch (e) {
    return { mensajeGuia: language === 'en' ? `${name || 'Soul'}, breathe deeply. The cards you have chosen carry ancient wisdom. Open your heart and let the Oracle reveal what your spirit already knows.` : `${name || 'Alma'}, respira profundo. Las cartas que has elegido llevan sabiduría ancestral. Abre tu corazón y permite que el Oráculo revele lo que tu espíritu ya sabe.`, __IS_FALLBACK__: true, _debug: { error: e.message } };
  }
}

async function handleInterpretation(model, { cards, reason, userContext, language = 'es' }) {
  // introspectionAnswer lives inside userContext, not at the payload root
  const { name, introspectionAnswer, preference } = userContext || {};
  const cardNames = Array.isArray(cards) ? cards.map(c => c.name).join(', ') : 'cartas desconocidas';
  const styleGuide = preference === 'direct' ? 'de forma directa, clara y sin rodeos' : 'de forma metafórica, poética y simbólica';
  const introspectionNote = introspectionAnswer ? `El consultante reflexionó y respondió: "${introspectionAnswer}". Incorpora esta reflexión en la lectura.` : '';
  const prompt = `Eres Zoltar, un oráculo ancestral de vidas pasadas. El consultante se llama ${name || 'alma'} y su inquietud principal es: "${reason || 'búsqueda espiritual'}". ${introspectionNote}

Las tres cartas que ha elegido para su lectura son, en orden: ${cardNames}.

Genera una interpretación profunda, personalizada y emocionalmente resonante ${styleGuide}. Cada carta representa:
- Carta 1: El Origen Kármico (raíz ancestral de la situación)
- Carta 2: El Bloqueo Presente (qué le impide avanzar hoy)
- Carta 3: El Consejo Sanador (camino de sanación y transformación)

Responde SOLO en idioma "${language}". Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "narrativaAncestral": [
    "[Lectura profunda de la carta 1: El Origen Kármico, 3-4 oraciones personalizadas]",
    "[Lectura profunda de la carta 2: El Bloqueo Presente, 3-4 oraciones personalizadas]",
    "[Lectura profunda de la carta 3: El Consejo Sanador, 3-4 oraciones personalizadas]"
  ],
  "conclusionFinal": "[Síntesis final integrando las 3 cartas y la inquietud del consultante, 2-3 oraciones]",
  "decreto": "[Una afirmación poderosa y personal de 1 oración que el consultante puede repetir]",
  "tarea_terrenal": "[Una acción concreta y significativa que el consultante puede hacer esta semana]"
}`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/{[\s\S]*}/);
    return JSON.parse(match ? match[0] : text);
  } catch (e) {
    const fallbackMsg = language === 'en' ? `The Oracle contemplates your path in silence. The cards ${cardNames} speak of a profound journey of transformation that only your soul can fully understand.` : `El Oráculo contempla tu camino en silencio. Las cartas ${cardNames} hablan de un profundo viaje de transformación que solo tu alma puede comprender plenamente.`;
    return {
      narrativaAncestral: [fallbackMsg, fallbackMsg, fallbackMsg],
      conclusionFinal: fallbackMsg,
      decreto: language === 'en' ? 'I open myself to ancestral wisdom.' : 'Me abro a la sabiduría ancestral.',
      tarea_terrenal: language === 'en' ? 'Sit in silence for 10 minutes today and listen to your inner voice.' : 'Siéntate en silencio 10 minutos hoy y escucha tu voz interior.',
      __IS_FALLBACK__: true,
      _debug: { error: e.message }
    };
  }
}

async function handleAnchoring(model, { selectedCards, visitReason, dichotomy, userName, clarifications, language = 'es' }) {
  const cardNames = Array.isArray(selectedCards) ? selectedCards.map(c => c.name).join(', ') : 'las cartas elegidas';
  const clarificationsText = clarifications && Object.keys(clarifications).length > 0
    ? `El consultante también profundizó en algunas cartas con preguntas adicionales: ${JSON.stringify(clarifications)}.`
    : '';
  const prompt = `Eres Zoltar, oráculo ancestral. Genera la síntesis final y el anclaje espiritual para ${userName || 'el consultante'}, cuya inquietud fue: "${visitReason || 'exploración espiritual'}". Las cartas de su lectura fueron: ${cardNames}. ${clarificationsText}

Crea un cierre poderoso, integrador y sanador que:
1. Sintetice los mensajes de todas las cartas
2. Aborde directamente la inquietud del consultante
3. Ofrezca un camino de esperanza y transformación

Responde SOLO en idioma "${language}". Responde ÚNICAMENTE con JSON válido:
{
  "conclusionFinal": "[Síntesis final profunda y sanadora, 3-4 oraciones]",
  "decreto": "[Afirmación de poder personal para ${userName || 'el consultante'}, 1 oración]",
  "tarea_terrenal": "[Acción concreta y significativa para esta semana]"
}`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/{[\s\S]*}/);
    return JSON.parse(match ? match[0] : text);
  } catch (e) {
    return {
      conclusionFinal: language === 'en' ? `${userName || 'Soul'}, the Oracle has witnessed your journey with deep compassion. The wisdom of your cards illuminates a path of healing and transformation. Trust the process unfolding within you.` : `${userName || 'Alma'}, el Oráculo ha contemplado tu camino con profunda compasión. La sabiduría de tus cartas ilumina un sendero de sanación y transformación. Confía en el proceso que se despliega dentro de ti.`,
      decreto: language === 'en' ? 'I am worthy of healing and transformation.' : 'Soy digno/a de sanación y transformación.',
      tarea_terrenal: language === 'en' ? 'Write a letter to your past self with compassion and forgiveness.' : 'Escribe una carta a tu yo del pasado con compasión y perdón.',
      __IS_FALLBACK__: true,
      _debug: { error: e.message }
    };
  }
}

async function handleDeepening(model, { originalCard, extraCard, userQuestion, previousReading, context, language = 'es' }) {
  const userName = context?.userName || 'alma';
  const prompt = `Eres Zoltar, oráculo ancestral. ${userName} tiene una pregunta específica sobre su carta "${originalCard?.name || 'desconocida'}": "${userQuestion}". Ha elegido la carta adicional "${extraCard?.name || 'desconocida'}" para profundizar. El mensaje anterior de esta carta fue: "${previousReading || ''}".

Genera una respuesta profunda, empática y esclarecedora que integre ambas cartas para responder directamente la pregunta de ${userName}. Responde SOLO en idioma "${language}".

Responde ÚNICAMENTE con JSON válido:
{"deepeningResponse": "[Respuesta profunda de 3-4 oraciones que integre las dos cartas y responda la pregunta]"}`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/{[\s\S]*}/);
    return JSON.parse(match ? match[0] : text);
  } catch (e) {
    return { deepeningResponse: language === 'en' ? `The Oracle contemplates your question in sacred silence. The union of ${originalCard?.name} and ${extraCard?.name} reveals a path of deep understanding that will manifest in its own divine timing.` : `El Oráculo contempla tu pregunta en sagrado silencio. La unión de ${originalCard?.name} y ${extraCard?.name} revela un camino de comprensión profunda que se manifestará en su propio tiempo divino.`, __IS_FALLBACK__: true, _debug: { error: e.message } };
  }
}
