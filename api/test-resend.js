/**
 * /api/test-resend  — Diagnóstico de configuración Resend
 * GET → retorna estado de variables y hace un envío de prueba
 *
 * Solo accesible en desarrollo o con ?secret=zoltar-debug
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const secret = req.query?.secret || req.query?.['secret'];
  if (secret !== 'zoltar-debug') {
    return res.status(403).json({ error: 'Acceso denegado. Agrega ?secret=zoltar-debug' });
  }

  const apiKey    = process.env.RESEND_API_KEY    || '';
  const testEmail = process.env.RESEND_TEST_EMAIL || '';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const config = {
    RESEND_API_KEY:    apiKey    ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)} (${apiKey.length} chars)` : 'NO CONFIGURADA',
    RESEND_TEST_EMAIL: testEmail || 'NO CONFIGURADA',
    RESEND_FROM_EMAIL: fromEmail,
  };

  if (!apiKey) {
    return res.status(200).json({ ok: false, config, error: 'RESEND_API_KEY no está configurada en Vercel' });
  }
  if (!testEmail) {
    return res.status(200).json({ ok: false, config, error: 'RESEND_TEST_EMAIL no está configurada. Sin dominio propio Resend solo puede enviar al email del dueño de la cuenta.' });
  }

  // Intento de envío real
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    `Zoltar Test <${fromEmail}>`,
      to:      testEmail,
      subject: '✅ Test Zoltar — Resend funciona',
      html:    '<h2>Resend está correctamente configurado en Zoltar 🎉</h2><p>Si ves este correo, el servicio de email funciona.</p>',
    }),
  });

  const resendBody = await emailRes.text();
  let resendJson;
  try { resendJson = JSON.parse(resendBody); } catch (_) { resendJson = { raw: resendBody }; }

  return res.status(200).json({
    ok:           emailRes.ok,
    config,
    resend_status: emailRes.status,
    resend_response: resendJson,
    error: emailRes.ok ? null : `Resend rechazó el envío (HTTP ${emailRes.status})`,
  });
}
