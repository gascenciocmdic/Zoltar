const APP_URL = process.env.APP_URL || 'https://zoltar-two.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Email service not configured' });

  const { toEmail, referralCode } = req.body || {};
  if (!toEmail) return res.status(400).json({ error: 'toEmail required' });

  const inviteLink = referralCode ? `${APP_URL}?ref=${referralCode}` : APP_URL;

  const subject = referralCode
    ? 'Te invito a descubrir Zoltar ✨'
    : 'Descubre Zoltar — el oráculo de vidas pasadas ✨';

  const html = referralCode
    ? `<div style="font-family:Georgia,serif;background:#0d0d1a;color:#e5e4e7;padding:32px;max-width:500px;margin:0 auto;border-radius:16px;">
         <h2 style="color:#ffd700;">✨ Una invitación del Oráculo</h2>
         <p>Te invito a explorar tu lectura de cartas de vidas pasadas en Zoltar.</p>
         <p>Usa mi código <strong style="color:#ffd700;">${referralCode}</strong> al registrarte y recibe <strong>25💎 créditos extra</strong>.</p>
         <a href="${inviteLink}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Ir a Zoltar →</a>
       </div>`
    : `<div style="font-family:Georgia,serif;background:#0d0d1a;color:#e5e4e7;padding:32px;max-width:500px;margin:0 auto;border-radius:16px;">
         <h2 style="color:#ffd700;">✨ Descubre Zoltar</h2>
         <p>Descubrí Zoltar, el oráculo de vidas pasadas.</p>
         <p>La experiencia completa es gratuita hasta la revelación.</p>
         <a href="${inviteLink}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Ir a Zoltar →</a>
       </div>`;

  // Sin dominio verificado, Resend solo entrega al dueño de la cuenta.
  // RESEND_TEST_EMAIL redirige el envío; el asunto indica el destinatario real.
  const actualTo   = process.env.RESEND_TEST_EMAIL || toEmail;
  const fromEmail  = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const finalSubject = process.env.RESEND_TEST_EMAIL
    ? `[Invitación para ${toEmail}] ${subject}`
    : subject;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: `Zoltar Oráculo <${fromEmail}>`, to: actualTo, subject: finalSubject, html }),
  });

  if (!emailRes.ok) {
    const errText = await emailRes.text();
    console.error('[send-invite] Resend error:', emailRes.status, errText);
    return res.status(500).json({ error: 'Error enviando invitación', detail: errText });
  }

  return res.status(200).json({ ok: true });
}
