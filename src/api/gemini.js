async function safeJson(response, fallbackMsg) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Original text:", text);
    throw new Error(`${fallbackMsg} (Respuesta no válida del servidor)`);
  }
}

export async function generateIntrospection(cards, apiKey, userContext = {}, language = 'es') {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'introspection',
      payload: { cards, userContext, language }
    })
  });
  
  if (!response.ok) {
    const errorData = await safeJson(response, 'Error en el Oráculo');
    throw new Error(errorData.error || 'Error en el Oráculo');
  }
  
  return await safeJson(response, 'Error de formato en el Oráculo');
}

export const generateDeepening = async (originalCard, extraCard, userQuestion, previousReading, context, apiKey, language = 'es') => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deepening',
      payload: { originalCard, extraCard, userQuestion, previousReading, context, language }
    })
  });

  if (!response.ok) {
    const errorData = await safeJson(response, 'Error al profundizar');
    throw new Error(errorData.error || 'Error al profundizar');
  }

  const data = await safeJson(response, 'Error de formato al profundizar');
  return data.deepeningResponse;
};

export const generateAnchoring = async (selectedCards, visitReason, dichotomy, userName, clarifications, apiKey, language = 'es') => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'anchoring',
      payload: { selectedCards, visitReason, dichotomy, userName, clarifications, language }
    })
  });

  if (!response.ok) {
    const errorData = await safeJson(response, 'Error en el Anclaje');
    throw new Error(errorData.error || 'Error en el Anclaje');
  }

  return await safeJson(response, 'Error de formato en el Anclaje');
};

export async function interpretCards(cards, soulFeeling, apiKey, userContext = {}, language = 'es') {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'interpretation',
      payload: { cards, reason: soulFeeling, userContext, language }
    })
  });

  if (!response.ok) {
    const errorData = await safeJson(response, 'Error en la Interpretación');
    throw new Error(errorData.error || 'Error en la Interpretación');
  }

  return await safeJson(response, 'Error de formato en la Interpretación');
}
