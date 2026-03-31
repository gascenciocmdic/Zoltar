export async function generateIntrospection(cards, apiKey, userContext = {}, language = 'es') {
  // El parámetro apiKey se mantiene por compatibilidad de firma, pero se ignora a favor de la clave del servidor
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'introspection',
      payload: { cards, userContext, language }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error en el Oráculo');
  }
  
  return await response.json();
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
    let errorMsg = 'Error al profundizar';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch(err) {
      errorMsg = `HTTP ${response.status} (Posible Timeout de servidor)`;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
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
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error en el Anclaje');
  }

  return await response.json();
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
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error en la Interpretación');
  }

  return await response.json();
}
