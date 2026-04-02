import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Helper to clean and parse JSON from Gemini's response
function cleanAndParse(text, fallback) {
  let sanitized = "";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const cleanJson = match ? match[0] : text;
    sanitized = cleanJson.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    return JSON.parse(sanitized);
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", e, "Original text:", text);
    return { ...fallback, _debug: { error: e.message, raw: text, sanitized: sanitized.slice(0, 200) + "..." } };
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
    safetySettings
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
    return res.status(200).json({ 
      error: true,
      mensajeGuia: "El éter está agitado ahora mismo. Respira profundo mientras las mallas del tiempo se asientan...",
      narrativaAncestral: ["El susurro es difuso...", "La visión se nubla...", "Confía en tu intuición..."],
      conclusionFinal: "La visión se fragmenta, pero la luz persiste.",
      decreto: "Confío en mi proceso.",
      tarea_terrenal: "Respira profundo y mantente presente.",
      vibe: "healing_blue"
    });
  }
}

async function handleIntrospection(model, { cards, userContext, language = 'es' }) {
  const { name, reason } = userContext || { name: "Alma Viajera", reason: "" };
  const langPrompt = language === 'en' ? "Respond in English." : language === 'pt' ? "Responda em Português." : "Responde en Español.";
  
  const prompt = `
    Eres "El Guía" del Oráculo de Vidas Pasadas.
    El consultante ${name} pregunta: "${reason}".
    Cartas: ${cards.map(c => c.name).join(', ')}.

    Genera un mensaje misterioso y breve (1 párrafo). 
    Prepara al usuario para la revelación kármica de forma profunda.
    Devuelve EXCLUSIVAMENTE un JSON: { "mensajeGuia": "..." }.
    ${langPrompt}
  `;

  const fallback = { 
    mensajeGuia: language === 'en' 
      ? "The echoes of your past are resonating with the current energy of your soul. Prepare your heart for the truths that are about to be revealed."
      : language === 'pt'
      ? "Os ecos do seu passado estão ressoando com a energia atual da sua alma. Prepare o seu coração para as verdades que estão prestes a ser reveladas."
      : "Los ecos de tu pasado están resonando con la energía actual de tu alma. Prepara tu corazón para las verdades que están a punto de ser reveladas."
  };

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text() || "";
    return cleanAndParse(text, fallback);
  } catch (e) {
    console.error("Introspection Error:", e);
    return { ...fallback, _debug: { error: e.message, api_failure: true } };
  }
}

async function handleInterpretation(model, { cards, reason, introspectionAnswer, userContext, language }) {
  const { name } = userContext || { name: "Alma Viajera" };
  const langPrompt = language === 'en' ? "Respond in English." : language === 'pt' ? "Responda em Português." : "Responde en Español.";

  const prompt = `
    Eres "El Guía". Interpreta estas cartas para ${name}.
    Contexto: Inquietud: "${reason}", Sentir Íntimo: "${introspectionAnswer}".
    Cartas: ${cards.map(c => c.name).join(', ')}.
    
    OBJETIVO: Crea una narrativa ancestral de 3 párrafos profundos.
    1. Relaciona CADA carta de forma EXCLUSIVA con la inquietud y el sentir del usuario. 
    2. Sé específico, místico y revelador.
    
    Devuelve EXCLUSIVAMENTE un JSON: 
    { 
      "narrativaAncestral": ["párrafo 1", "párrafo 2", "párrafo 3"],
      "conclusionFinal": "...",
      "decreto": "...",
      "tarea_terrenal": "...",
      "vibe": "healing_blue"
    }
    ${langPrompt}
  `;

  const fallback = { 
    narrativaAncestral: language === 'en' ? [
      "The past feels dense and full of ancient secrets. The echoes of your previous incarnations vibrate in these cards, indicating that your current path is deeply linked to a wound or a gift that you yet fail to fully recognize.",
      "There are echoes of glory and loss resonating through the centuries. This vision shows that you have walked paths of great power and also painful renunciations. The universe asks that you integrate these past experiences.",
      "Healing requires patience and a sincere connection with your ancestral lineage. This card invites you to undo the karmic knots that bind you to repetitive patterns and open the door to peace."
    ] : language === 'pt' ? [
      "O passado parece denso e cheio de segredos antigos. Os ecos de suas encarnações anteriores vibram nestas cartas, indicando que seu caminho atual está profundamente ligado a uma ferida ou um dom que você ainda não consegue reconhecer totalmente.",
      "Há ecos de glória e perda ressoando através dos séculos. Esta visão mostra que você percorreu caminhos de grande poder e também de renúncias dolorosas. O universo pede que você integre essas experiências passadas.",
      "A cura exige paciência e uma conexão sincera com sua linhagem ancestral. Esta carta convida você a desfazer os nós cármicos que o prendem a padrões repetitivos e abrir a porta para a paz."
    ] : [
      "El pasado se siente denso y lleno de secretos antiguos. Los ecos de tus encarnaciones previas vibran en esta carta, señalando que tu camino actual está profundamente ligado a una herida o un don que aún no logras reconocer completamente. La sanación está cerca, pero requiere que mires más allá de la superficie.",
      "Hay ecos de gloria y pérdida resonando a través de los siglos. Esta visión muestra que has caminado por senderos de gran poder y también de renuncias dolorosas. El universo pide que integres estas experiencias pasadas para que puedas reclamar tu fuerza original en el presente.",
      "La sanación requiere paciencia y una conexión sincera con tu linaje ancestral. Esta carta te invita a soltar los nudos kármicos que te atan a patrones repetitivos. Al perdonarte y perdonar a quienes fueron parte de tu historia previa, abres la puerta a una paz que ha esperado por muchas vidas manifestarse."
    ],
    conclusionFinal: language === 'en' ? "Your past lives watch over you with unconditional love." : "Tus vidas pasadas te observan con amor incondicional.",
    decreto: language === 'en' ? "I release what no longer belongs to me with gratitude." : "Suelto lo que ya no me pertenece con gratitud y amor.",
    tarea_terrenal: language === 'en' ? "Light a small candle and meditate in absolute silence today." : "Enciende una pequeña vela y medita en el silencio absoluto hoy.",
    vibe: "healing_blue"
  };

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text() || "";
    return cleanAndParse(text, fallback);
  } catch (e) {
    console.error("Interpretation Error:", e);
    return { ...fallback, _debug: { error: e.message, api_failure: true } };
  }
}

async function handleAnchoring(model, { cards, reason, choice, name, clarifications, language }) {
  const langPrompt = language === 'en' ? "Respond in English." : language === 'pt' ? "Responda em Português." : "Responde en Español.";
  const prompt = `
    Como "El Guía", sintetiza el ritual para ${name}.
    Inquietud: "${reason}".
    Clarificaciones: ${JSON.stringify(clarifications || {})}.
    
    Devuelve EXCLUSIVAMENTE un JSON: 
    { "conclusionFinal": "...", "decreto": "...", "tarea_terrenal": "..." }
    ${langPrompt}
  `;
  
  const fallback = {
    conclusionFinal: "La sincronía de este ritual se sella con luz. El camino hacia tu verdad está ahora abierto.",
    decreto: "Confío en mi propia sabiduría ancestral y en el camino que he caminado.",
    tarea_terrenal: "Escribe una carta a tu yo del pasado agradeciendo su resistencia y amor."
  };

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text() || "";
    return cleanAndParse(text, fallback);
  } catch (e) {
    console.error("Anchoring Error:", e);
    return { ...fallback, _debug: { error: e.message, api_failure: true } };
  }
}

async function handleDeepening(model, { originalCard, extraCard, userQuestion, previousReading, context, language = 'es' }) {
  const langPrompt = language === 'en' ? "Respond in English." : language === 'pt' ? "Responda em Português." : "Responde en Español.";
  const prompt = `
    Clarifica esta duda para ${context?.name || 'alma viajera'}: "${userQuestion}".
    Cartas: "${originalCard?.name}" y "${extraCard?.name}".
    
    Genera una respuesta mística y directa (máximo 2 párrafos).
    Devuelve EXCLUSIVAMENTE un JSON: { "deepeningResponse": "..." }
    ${langPrompt}
  `;

  const fallback = { deepeningResponse: "Los hilos de esta visión son frágiles por ahora. Confía en lo que ya has sentido en tu corazón." };

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text() || "";
    return cleanAndParse(text, fallback);
  } catch (e) {
    console.error("Deepening Error:", e);
    return { ...fallback, _debug: { error: e.message, api_failure: true } };
  }
}
