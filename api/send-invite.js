const APP_URL   = process.env.APP_URL   || 'https://zoltar-two.vercel.app';
const LOGO_URL  = `${APP_URL}/zoltar-logo.jpg`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Email service not configured' });

  const { toEmail, referralCode, inviterName } = req.body || {};
  if (!toEmail) return res.status(400).json({ error: 'toEmail required' });

  const inviteLink  = referralCode ? `${APP_URL}?ref=${referralCode}` : APP_URL;
  const inviter     = inviterName  || 'Un alma del oráculo';
  const hasReferral = !!referralCode;

  const subject = hasReferral
    ? `${inviter} te invita a descubrir tu lectura en Zoltar ✨`
    : `${inviter} quiere que conozcas Zoltar — el oráculo de vidas pasadas ✨`;

  const referralBlock = hasReferral
    ? `<div style="background:rgba(255,215,0,0.07);border:1px solid rgba(255,215,0,0.3);border-radius:12px;padding:16px;margin:24px 0;text-align:center;">
        <p style="color:rgba(255,215,0,0.7);font-size:0.72rem;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Tu código de bienvenida</p>
        <p style="color:#ffd700;font-size:2rem;font-weight:800;letter-spacing:8px;margin:0 0 8px;">${referralCode}</p>
        <p style="color:#aaa;font-size:0.8rem;margin:0;">Ingrésalo al registrarte y recibe <strong style="color:#ffd700;">25💎 créditos extra</strong></p>
       </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0d1a;font-family:'Georgia',serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 20px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:28px;">
      <img src="${LOGO_URL}" alt="Zoltar" style="width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,215,0,0.4);object-fit:cover;" />
      <h1 style="color:#ffd700;font-size:1.6rem;letter-spacing:4px;text-transform:uppercase;margin:12px 0 0;">ZOLTAR</h1>
      <p style="color:rgba(255,215,0,0.5);font-size:0.7rem;letter-spacing:3px;margin:4px 0 0;">ORÁCULO DE VIDAS PASADAS</p>
    </div>

    <!-- Invitación -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,215,0,0.15);border-radius:16px;padding:28px;margin-bottom:24px;">
      <p style="color:#e5e4e7;font-size:1rem;line-height:1.7;margin:0 0 16px;">
        <strong style="color:#ffd700;">${inviter}</strong> te ha invitado a explorar una experiencia única:
        una lectura de tarot guiada por inteligencia artificial que revela los patrones kármicos
        y las memorias de tus vidas pasadas.
      </p>

      ${referralBlock}

      <!-- Qué es Zoltar -->
      <h3 style="color:#ffd700;font-size:0.85rem;letter-spacing:2px;text-transform:uppercase;margin:24px 0 12px;">¿Qué es Zoltar?</h3>
      <p style="color:#ccc;font-size:0.9rem;line-height:1.7;margin:0 0 12px;">
        Zoltar es un oráculo ancestral digital que combina el simbolismo del tarot con inteligencia artificial
        para ofrecerte lecturas profundamente personalizadas. A partir de tu nombre, fecha de nacimiento
        y la pregunta que llevas en el corazón, Zoltar elige tres cartas y revela los mensajes
        que tu alma necesita escuchar.
      </p>

      <!-- Cómo funciona -->
      <h3 style="color:#ffd700;font-size:0.85rem;letter-spacing:2px;text-transform:uppercase;margin:24px 0 12px;">¿Cómo funciona?</h3>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#ffd700;font-size:1.2rem;min-width:28px;">✦</span>
          <p style="color:#ccc;font-size:0.88rem;line-height:1.6;margin:0;"><strong style="color:#e5e4e7;">Cuéntale tu inquietud</strong> — la pregunta o situación que hoy ocupa tu mente.</p>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#ffd700;font-size:1.2rem;min-width:28px;">✦</span>
          <p style="color:#ccc;font-size:0.88rem;line-height:1.6;margin:0;"><strong style="color:#e5e4e7;">Elige tus tres cartas</strong> — de forma intuitiva, dejando que tu energía guíe la selección.</p>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#ffd700;font-size:1.2rem;min-width:28px;">✦</span>
          <p style="color:#ccc;font-size:0.88rem;line-height:1.6;margin:0;"><strong style="color:#e5e4e7;">Recibe tu revelación</strong> — el oráculo interpreta las cartas y revela el origen kármico, el bloqueo presente y el camino de sanación.</p>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#ffd700;font-size:1.2rem;min-width:28px;">✦</span>
          <p style="color:#ccc;font-size:0.88rem;line-height:1.6;margin:0;"><strong style="color:#e5e4e7;">Profundiza si lo deseas</strong> — haz preguntas específicas sobre cada carta y recibe tu síntesis completa por correo.</p>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${inviteLink}"
         style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:14px;font-weight:600;letter-spacing:1px;font-size:1rem;box-shadow:0 0 30px rgba(124,58,237,0.4);">
        Consultar al Oráculo →
      </a>
      ${hasReferral ? `<p style="color:#888;font-size:0.75rem;margin:12px 0 0;">Al registrarte con el código <strong style="color:#ffd700;">${referralCode}</strong> recibes 100💎 de bienvenida + 25💎 extra</p>` : '<p style="color:#888;font-size:0.75rem;margin:12px 0 0;">Recibes 100💎 de créditos gratis al registrarte</p>'}
    </div>

    <!-- Footer -->
    <p style="color:rgba(255,255,255,0.2);font-size:0.72rem;text-align:center;line-height:1.6;">
      Este mensaje fue enviado porque ${inviter} quiso compartir esta experiencia contigo.<br/>
      Zoltar — Oráculo de Vidas Pasadas
    </p>
  </div>
</body>
</html>`;

  // Sin dominio verificado, redirigir al email del dueño de la cuenta Resend
  const actualTo     = process.env.RESEND_TEST_EMAIL || toEmail;
  const fromEmail    = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const finalSubject = process.env.RESEND_TEST_EMAIL
    ? `[Para ${toEmail}] ${subject}`
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
