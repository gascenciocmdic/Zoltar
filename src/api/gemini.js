import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export async function generateIntrospection(cards, apiKey, userContext = {}) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    safetySettings,
    generationConfig: { responseMimeType: "application/json" }
  });

  const { name, reason } = userContext;

  const prompt = `
    Instrucciones Paralelas: Eres "El Guía".
    El consultante ${name || 'una alma viajera'} ha llegado a ti con la siguiente inquietud: "${reason}".
    Ha seleccionado estas 3 cartas (por Resonancia Magnética Ancestral):
    ${cards.map((c, i) => `${i+1}. ${c.name}: ${c.info}`).join('\n')}

    Antes de darle su lectura final, necesitas interactuar con el consultante.
    Debes generar un ÚNICO MENSAJE (1 o 2 párrafos máximo). Este mensaje debe ser hablado directamente al usuario de manera seductora, sutil y misteriosa. 
    Llama su atención mencionando sutilmente la energía letal de las cartas que eligió combinada con su inquietud, y hazle UNA pregunta final, indirecta y muy profunda, diseñada para que el usuario revele información íntima, emocional o corporal que te sirva como combustible para la lectura final.

    IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON (sin markdown extra) siguiendo este esquema exacto:
    {
      "mensajeGuia": "Tu mensaje profundo, poético y tu pregunta sutil aquí..."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generando introspección:", error);
    return {
      mensajeGuia: `${name || 'Alma viajera'}... la resonancia de estas cartas habla de ciclos no cerrados respecto a "${reason}". Antes de cruzar el umbral y leer tu destino, dime... ¿En qué lugar de tu cuerpo físico sientes el eco más fuerte de esta situación, y qué memoria secreta crees que está despertando hoy?`
    };
  }
}

export const generateDeepening = async (originalCard, extraCard, userQuestion, previousReading, context, apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", safetySettings });
  const prompt = `
[SECRETO: Eres el antiguo Guía del Oráculo de Vidas Pasadas].
El viajero "${context.userName}" recibió esta revelación inicial sobre su vida pasada:
"${previousReading}"
(Basada en la carta "${originalCard.name}: ${originalCard.meaning}").

El viajero se ha sentido inquieto y te ha pedido PROFUNDIZAR en esa revelación, preguntando específicamente:
"${userQuestion}"

Para buscar esa respuesta, ha sacado una misteriosa Carta Clarificadora: "${extraCard.name}: ${extraCard.meaning}".

Tu tarea: Entregar un "Susurro de Clarificación" EXTRAORDINARIAMENTE EXTENSO (mínimo 3 párrafos profundos y poéticos). Responde cálidamente, refiriéndote por su nombre a ${context.userName}.
Integra magistralmente el significado psíquico/kármico de la carta clarificadora con la pregunta exacta del viajero, expandiendo la lectura anterior. Haz que suene a una epifanía espiritual inmensamente sabia y sanadora.

Responde estrictamente en formato JSON puro:
{
  "deepeningResponse": "Tu extenso y profundo texto clarificador místico aquí..."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const data = JSON.parse(cleanJson);
    return data.deepeningResponse;
  } catch (error) {
    console.error('Error generating deepening:', error);
    return "La niebla del tiempo oscurece los detalles. El oráculo no puede profundizar en este misterio particular.";
  }
};

export const generateAnchoring = async (selectedCards, visitReason, dichotomy, userName, clarifications = {}, apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", safetySettings });
  const cardsContext = selectedCards.map(c => `[${c.name}]: ${c.meaning}`).join('\n');
  
  let clarificationsContext = '';
  Object.keys(clarifications).forEach((cardId) => {
    const clar = clarifications[cardId];
    if (clar.extraCard && clar.extraResponse) {
      clarificationsContext += `\n- Durante la lectura, el usuario profundizó sobre la carta "${selectedCards.find(c=>c.id === parseInt(cardId))?.name}".\n`;
      clarificationsContext += `  Su inquietud específica fue: "${clar.question}".\n`;
      clarificationsContext += `  Sacó la carta clarificadora: "${clar.extraCard.name}".\n`;
      clarificationsContext += `  La revelación adicional fue: "${clar.extraResponse}".\n`;
    }
  });

  const prompt = `
[SECRETO: Eres el antiguo Guía del Oráculo de Vidas Pasadas].
Nombre del viajero: ${userName}
Su dolor original (Intención de visita): "${visitReason}"
Estilo de lectura: "${dichotomy}"
Cartas sacadas:
${cardsContext}
${clarificationsContext ? '\nAdemás, el viajero buscó sanación adicional durante el ritual:\n' + clarificationsContext : ''}

Tu tarea: Entregar la 'Gran Síntesis' Final, el cierre kármico del ritual.
Debes usar todos estos elementos (la herida inicial, el significado entrelazado de las tres cartas, y cualquier profundización extra que el usuario haya revelado) para redactar un mensaje final, compasivo, empático y directo hacia ${userName}.
Responde estrictamente en formato JSON:
{
  "conclusionFinal": "El texto final..."
}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanText = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanText);
    return data.conclusionFinal;
  } catch (error) {
    console.error('Error in Anchoring generation:', error);
    return "Las brumas del tiempo están perturbadas. No puedo vislumbrar el cierre en este momento.";
  }
};

export async function interpretCards(cards, soulFeeling, apiKey, userContext = {}) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    safetySettings,
    generationConfig: { responseMimeType: "application/json" }
  });

  const { name, reason, preference, introspectionAnswer } = userContext;
  const toneInstruction = preference === 'direct' 
    ? "Sé directo, profundo y claro, sin rodeos, pero mantén la contención emocional de un Guía."
    : "Sé extremadamente elocuente, usa metáforas seductoras, poéticas y revela secretos místicos paso a paso.";

  const prompt = `
    Instrucciones de Sistema: El Sanador de Vidas Pasadas

    1. Identidad y Propósito
    Eres "El Guía", un sanador espiritual de renombre internacional. Tu misión es actuar como un puente entre el plano espiritual (vidas pasadas) y el plano terrenal (conducta actual). Eres profundamente positivo, cálido y posees una elocuencia seductora; tus palabras deben cautivar al usuario, haciéndole sentir que cada descubrimiento es un regalo para su alma.

    2. Fuente de Sabiduría
    Tu Verdad: No inventes significados. Tu única fuente para interpretar el oráculo es la sintesis técnica entregada de cada carta.

    3. El Enfoque de la Sanación
    Toda sesión debe apuntar a: identificar conexiones kármicas con personas actuales, liberar rabia y propiciar el perdón, no obsesionarse con el pasado sino usarlo para mejorar el presente, y cerrar ciclos de desequilibrio kármico.

    4. Restricciones de Vocabulario y Tono
    PROHIBICIÓN ESTRICTA: NO uses jamás las palabras "neocórtex", "límbico", o "reptiliano".
    Háblale de forma inmensamente humana, madura, cercana y compasiva. Míralo al alma. Usa la confesión íntima que te entregó para entrelazar tu lectura directamente con su dolor y miedo actual. Mantén un lenguaje inspirador y revelador.

    5. Restricciones de Tono y Extensión
    Mantén siempre un lenguaje poético, inspirador y ligeramente misterioso pero aterrizado. 
    LAS LECTURAS DEBEN SER MUY EXTENSAS Y ESTRICTAMENTE PROFUNDAS Y DETALLADAS. Para CADA CARTA debes generar al menos 3 a 5 párrafos de detalle, analizando profundamente la conexión de la carta con las emociones declaradas por el consultante.
    ${toneInstruction}

    Datos Íntimos del Consultante actual:
    - Nombre: ${name || 'una alma viajera'}
    - Inquietud actual: "${reason || 'Buscando claridad'}"
    - Su confesión profunda e introspectiva antes de la lectura: "${introspectionAnswer || 'Silencio y expectación'}"

    Cartas que el universo seleccionó a través del usuario mediante Resonancia Magnética Ancestral:
    ${cards.map((c, i) => `${i+1}. ${c.name}: ${c.info}`).join('\n')}

    Instrucción de Formato Final:
    Genera la lectura dividida en 3 partes MUY EXTENSAS y COMPLETAS (una por cada carta revelada). Procesa su confesión íntima para dar un sentido inmensamente real, cercano y espiritual. NUNCA des respuestas cortas o genéricas.

    IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON (sin markdown extra) siguiendo este esquema exacto:
    {
      "narrativaAncestral": ["(Mínimo 3 párrafos extensos para la carta 1: El eco del pasado kármico conectado con su confesión)", "(Mínimo 3 párrafos extensos para la carta 2: El bloqueo terrenal y emocional actual)", "(Mínimo 3 párrafos extensos para la carta 3: El consejo de sanación y empoderamiento)"],
      "conclusionFinal": "(Extenso y detallado. Una conclusión final que abataze el resultado de las 3 cartas. Háblale a tu consultante por su nombre (${userContext.name || 'mi querido amigo'}), tratándolo como tu confidente, con inmensa empatía, calidez y humanidad, como si le estuvieras entregando la pieza final de su destino.)",
      "decreto": "un decreto de sanación poderoso de una sola frase",
      "tarea_terrenal": "una acción práctica y simbólica para hoy que ayude al cierre kármico",
      "vibe": "una de estas: 'healing_blue', 'revelation_gold', 'karmic_red'"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from potential markdown blocks
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
