async function fetchWithTimeout(action, payload, timeout = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
      signal: controller.signal
    });
    clearTimeout(id);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error:", e, "Raw text:", text);
      throw new Error("Error de formato en el Oráculo (Respuesta no válida)");
    }

    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}: El Oráculo está nublado.`);
    }

    return data;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error("TIMEOUT_ERROR: El Oráculo está tardando demasiado en contemplar...");
    }
    throw error;
  }
}

export async function generateIntrospection(cards, apiKey, userContext = {}, language = 'es') {
  // cards no se pasan al prompt de introspección — esa etapa es solo astral/natal
  return await fetchWithTimeout('introspection', { userContext, language });
}

export const generateDeepening = async (originalCard, extraCard, userQuestion, previousReading, context, apiKey, language = 'es') => {
  const data = await fetchWithTimeout('deepening', { originalCard, extraCard, userQuestion, previousReading, context, language });
  // If it's a fallback, return the whole object; if not, return the string for compatibility
  return data.__IS_FALLBACK__ ? data : data.deepeningResponse;
};

export const generateAnchoring = async (selectedCards, visitReason, dichotomy, userName, clarifications, apiKey, language = 'es') => {
  return await fetchWithTimeout('anchoring', { selectedCards, visitReason, dichotomy, userName, clarifications, language });
};

export async function interpretCards(cards, soulFeeling, apiKey, userContext = {}, language = 'es') {
  return await fetchWithTimeout('interpretation', { cards, reason: soulFeeling, userContext, language });
}

export async function generateTeaser(cards, soulFeeling, apiKey, userContext = {}, language = 'es') {
  return await fetchWithTimeout('teaser', { cards, reason: soulFeeling, userContext, language });
}
