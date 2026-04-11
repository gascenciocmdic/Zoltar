import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";

async function generateJSON(ai, prompt) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });
  const text = response.text;
  const match = text.match(/{[\s\S]*}/);
  return JSON.parse(match ? match[0] : text);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { action, payload } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API Key missing.' });

  const ai = new GoogleGenAI({ apiKey });

  try {
    switch (action) {
      case 'introspection': return res.status(200).json(await handleIntrospection(ai, payload));
      case 'interpretation': return res.status(200).json(await handleInterpretation(ai, payload));
      case 'anchoring': return res.status(200).json(await handleAnchoring(ai, payload));
      case 'deepening': return res.status(200).json(await handleDeepening(ai, payload));
      default: return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleIntrospection(ai, { cards, userContext, language = 'es' }) {
  const { name, reason, birthDate } = userContext || {};
  const cardNames = Array.isArray(cards) ? cards.map(c => c.name).join(', ') : 'cartas desconocidas';
  const prompt = `Eres Zoltar, un oráculo ancestral y guía espiritual profundo. El consultante se llama ${name || 'alma'} y nació el "${birthDate || 'fecha desconocida'}". Su inquietud es: "${reason || 'búsqueda espiritual'}". Las cartas que ha elegido son: ${cardNames}.

Genera una breve representación mística astral (2-3 oraciones). Primero, utilizando la fecha de nacimiento ingresada, nombra su constelación o estrellas reinantes, y luego explica cómo esa formación astral ayudará a que las cartas elegidas revelen las respuestas que el consultante necesita. El mensaje debe sentirse como una preparación ritual, mística y serena. Responde SOLO en idioma "${language}".

Responde ÚNICAMENTE con JSON válido, sin texto adicional, en este formato exacto:
{
  "nombreConstelacion": "[Nombre de la constelación o astro regente]",
  "mensajeAstral": "[tu mensaje astral aquí]"
}`;
  try {
    return await generateJSON(ai, prompt);
  } catch (e) {
    return { 
      nombreConstelacion: "El Firmamento Eterno",
      mensajeAstral: language === 'en' ? `${name || 'Soul'}, breathe deeply. The stars under which you were born align with the cards you have chosen. Open your heart and let the Oracle reveal what your spirit already knows.` : `${name || 'Alma'}, respira profundo. Las estrellas bajo las que naciste se alinean con las cartas que has elegido. Abre tu corazón y permite que el Oráculo revele lo que tu espíritu ya sabe.`, 
      __IS_FALLBACK__: true, 
      _debug: { error: e.message } 
    };
  }
}

async function handleInterpretation(ai, { cards, reason, userContext, language = 'es' }) {
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
    return await generateJSON(ai, prompt);
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

async function handleAnchoring(ai, { selectedCards, visitReason, dichotomy, userName, clarifications, language = 'es' }) {
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
    return await generateJSON(ai, prompt);
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

async function handleDeepening(ai, { originalCard, extraCard, userQuestion, previousReading, context, language = 'es' }) {
  const userName = context?.userName || 'alma';
  const prompt = `Eres Zoltar, oráculo ancestral. ${userName} tiene una pregunta específica sobre su carta "${originalCard?.name || 'desconocida'}": "${userQuestion}". Ha elegido la carta adicional "${extraCard?.name || 'desconocida'}" para profundizar. El mensaje anterior de esta carta fue: "${previousReading || ''}".

Genera una respuesta profunda, empática y esclarecedora que integre ambas cartas para responder directamente la pregunta de ${userName}. Responde SOLO en idioma "${language}".

Responde ÚNICAMENTE con JSON válido:
{"deepeningResponse": "[Respuesta profunda de 3-4 oraciones que integre las dos cartas y responda la pregunta]"}`;
  try {
    return await generateJSON(ai, prompt);
  } catch (e) {
    return { deepeningResponse: language === 'en' ? `The Oracle contemplates your question in sacred silence. The union of ${originalCard?.name} and ${extraCard?.name} reveals a path of deep understanding that will manifest in its own divine timing.` : `El Oráculo contempla tu pregunta en sagrado silencio. La unión de ${originalCard?.name} y ${extraCard?.name} revela un camino de comprensión profunda que se manifestará en su propio tiempo divino.`, __IS_FALLBACK__: true, _debug: { error: e.message } };
  }
}
