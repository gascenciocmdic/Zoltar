export async function generateIntrospection(cards, apiKey, userContext = {}) {
  // El parámetro apiKey se mantiene por compatibilidad de firma, pero se ignora a favor de la clave del servidor
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'introspection',
      payload: { cards, userContext }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error en el Oráculo');
  }
  
  return await response.json();
}

export const generateDeepening = async (originalCard, extraCard, userQuestion, previousReading, context, apiKey) => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deepening',
      payload: { originalCard, extraCard, userQuestion, previousReading, context }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al profundizar');
  }

  const data = await response.json();
  return data.deepeningResponse;
};

export const generateAnchoring = async (selectedCards, visitReason, dichotomy, userName, clarifications, apiKey) => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'anchoring',
      payload: { selectedCards, visitReason, dichotomy, userName, clarifications }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error en el Anclaje');
  }

  return await response.json();
};

export async function interpretCards(cards, soulFeeling, apiKey, userContext = {}) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'interpretation',
      payload: { cards, reason: soulFeeling, userContext }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error en la Interpretación');
  }

  return await response.json();
}
