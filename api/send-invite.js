import { setCors } from './_cors.js';

const APP_URL  = process.env.APP_URL  || 'https://www.cosmic-guidance.com';
const LOGO_URL = `${APP_URL}/zoltar-logo.jpg`;

// ── Traducciones ────────────────────────────────────────────────────────────
const LABELS = {
  es: {
    subject:      (name, hasRef) => hasRef
      ? `${name} te invita a descubrir tu lectura en Cosmic Guidance ✦`
      : `${name} quiere que conozcas Cosmic Guidance — el oráculo de vidas pasadas ✦`,
    tagline:      'Oráculo de Vidas Pasadas',
    intro:        (name) => `<strong style="color:#3b0764;">${name}</strong> te ha invitado a explorar una experiencia única: una lectura de tarot guiada por inteligencia artificial que revela los patrones kármicos y las memorias de tus vidas pasadas.`,
    ref_label:    'Tu código de bienvenida',
    ref_credits:  '25💎 créditos extra',
    how_title:    '¿Cómo funciona?',
    steps: [
      ['Cuéntale tu inquietud',  'la pregunta o situación que hoy ocupa tu mente.'],
      ['Elige tus tres cartas',  'de forma intuitiva, dejando que tu energía guíe la selección.'],
      ['Recibe tu revelación',   'origen kármico, bloqueo presente y camino de sanación.'],
      ['Profundiza si lo deseas','haz preguntas específicas y recibe tu síntesis completa por correo.'],
    ],
    cta:              'Consultar al Oráculo →',
    cta_note_ref:     (code) => `Al registrarte con el código <strong style="color:#5b21b6;">${code}</strong> recibes 100💎 + 25💎 extra`,
    cta_note_no_ref:  'Recibes 100💎 de créditos gratis al registrarte',
    footer:           (name) => `Este mensaje fue enviado porque ${name} quiso compartir esta experiencia contigo.<br/>Cosmic Guidance — Oráculo de Vidas Pasadas`,
  },
  en: {
    subject:      (name, hasRef) => hasRef
      ? `${name} invites you to discover your reading at Cosmic Guidance ✦`
      : `${name} wants you to experience Cosmic Guidance — the past lives oracle ✦`,
    tagline:      'Past Lives Oracle',
    intro:        (name) => `<strong style="color:#3b0764;">${name}</strong> has invited you to explore a unique experience: an AI-guided tarot reading that reveals your karmic patterns and memories from your past lives.`,
    ref_label:    'Your welcome code',
    ref_credits:  '25💎 extra credits',
    how_title:    'How does it work?',
    steps: [
      ['Share your question',    'the situation or concern on your mind today.'],
      ['Choose your three cards','intuitively, letting your energy guide the selection.'],
      ['Receive your revelation','karmic origin, present blockage, and healing path.'],
      ['Deepen if you wish',     'ask specific questions and receive your full synthesis by email.'],
    ],
    cta:              'Consult the Oracle →',
    cta_note_ref:     (code) => `Sign up with code <strong style="color:#5b21b6;">${code}</strong> and receive 100💎 + 25💎 extra`,
    cta_note_no_ref:  'You receive 100💎 free credits when you sign up',
    footer:           (name) => `This message was sent because ${name} wanted to share this experience with you.<br/>Cosmic Guidance — Past Lives Oracle`,
  },
  pt: {
    subject:      (name, hasRef) => hasRef
      ? `${name} convida você a descobrir sua leitura no Cosmic Guidance ✦`
      : `${name} quer que você conheça o Cosmic Guidance — o oráculo de vidas passadas ✦`,
    tagline:      'Oráculo de Vidas Passadas',
    intro:        (name) => `<strong style="color:#3b0764;">${name}</strong> convidou você para explorar uma experiência única: uma leitura de tarô guiada por inteligência artificial que revela seus padrões kármicos e memórias de suas vidas passadas.`,
    ref_label:    'Seu código de boas-vindas',
    ref_credits:  '25💎 créditos extras',
    how_title:    'Como funciona?',
    steps: [
      ['Conte sua preocupação',  'a pergunta ou situação que ocupa sua mente hoje.'],
      ['Escolha suas três cartas','intuitivamente, deixando sua energia guiar a seleção.'],
      ['Receba sua revelação',   'origem kármica, bloqueio presente e caminho de cura.'],
      ['Aprofunde se desejar',   'faça perguntas específicas e receba sua síntese completa por email.'],
    ],
    cta:              'Consultar o Oráculo →',
    cta_note_ref:     (code) => `Ao se registrar com o código <strong style="color:#5b21b6;">${code}</strong> você recebe 100💎 + 25💎 extras`,
    cta_note_no_ref:  'Você recebe 100💎 de créditos grátis ao se registrar',
    footer:           (name) => `Esta mensagem foi enviada porque ${name} quis compartilhar esta experiência com você.<br/>Cosmic Guidance — Oráculo de Vidas Passadas`,
  },
};

// ── Builder HTML ────────────────────────────────────────────────────────────
function buildHtml({ inviter, referralCode, inviteLink, lang }) {
  const L        = LABELS[lang] || LABELS.es;
  const hasRef   = !!referralCode;

  const referralBlock = hasRef ? `
    <div style="background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(91,33,182,0.08));border:1px solid rgba(139,92,246,0.35);border-radius:10px;padding:16px;text-align:center;margin-top:16px;">
      <p style="color:#6d28d9;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">${L.ref_label}</p>
      <p style="color:#4c1d95;font-size:28px;font-weight:900;letter-spacing:8px;margin:0 0 8px;">${referralCode}</p>
      <p style="color:#7c3aed;font-size:12px;margin:0;">Ingrésalo al registrarte y recibe <strong>${L.ref_credits}</strong></p>
    </div>` : '';

  const steps = L.steps.map(([title, desc]) => `
    <div style="display:flex;gap:12px;align-items:flex-start;padding:5px 0;">
      <span style="color:#7c3aed;font-size:16px;min-width:24px;">✦</span>
      <p style="color:#4c1d95;font-size:13px;line-height:1.6;margin:0;"><strong style="color:#3b0764;">${title}</strong> — ${desc}</p>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ede9fe;font-family:'Georgia',serif;">
<div style="max-width:580px;margin:0 auto;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#5b21b6,#7c3aed);padding:32px;text-align:center;">
    <img src="${LOGO_URL}" alt="Cosmic Guidance" style="width:72px;height:72px;border-radius:50%;border:2px solid rgba(255,255,255,0.4);object-fit:cover;margin-bottom:12px;" />
    <h1 style="color:#fff;font-size:20px;letter-spacing:5px;text-transform:uppercase;margin:0 0 5px;font-weight:900;">COSMIC GUIDANCE</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:3px;margin:0;text-transform:uppercase;">${L.tagline}</p>
  </div>

  <!-- Body -->
  <div style="background:linear-gradient(180deg,#f5f3ff 0%,#ede9fe 100%);padding:32px 28px;">

    <!-- Invitación -->
    <div style="background:rgba(255,255,255,0.7);border:1px solid rgba(167,139,250,0.35);border-radius:14px;padding:24px;margin-bottom:20px;">
      <p style="color:#4c1d95;font-size:15px;line-height:1.8;margin:0;">
        ${L.intro(inviter)}
      </p>
      ${referralBlock}
    </div>

    <!-- Cómo funciona -->
    <div style="background:rgba(255,255,255,0.5);border:1px solid rgba(167,139,250,0.2);border-radius:14px;padding:20px 24px;margin-bottom:24px;">
      <h3 style="color:#5b21b6;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">${L.how_title}</h3>
      <div style="display:flex;flex-direction:column;gap:4px;">
        ${steps}
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${inviteLink}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#5b21b6,#7c3aed);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;letter-spacing:1px;font-size:15px;box-shadow:0 4px 20px rgba(124,58,237,0.35);">
        ${L.cta}
      </a>
      <p style="color:#8b5cf6;font-size:11px;margin:10px 0 0;">
        ${hasRef ? L.cta_note_ref(referralCode) : L.cta_note_no_ref}
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="border-top:1px solid rgba(167,139,250,0.2);padding:18px 28px;text-align:center;background:rgba(245,243,255,0.8);">
    <p style="color:#8b5cf6;font-size:11px;letter-spacing:1px;margin:0 0 4px;text-transform:uppercase;">Cosmic Guidance</p>
    <p style="color:#a78bfa;font-size:10px;margin:0 0 8px;">noreply@cosmic-guidance.com</p>
    <p style="color:#c4b5fd;font-size:10px;line-height:1.6;margin:0;">${L.footer(inviter)}</p>
  </div>

</div>
</body>
</html>`;
}

// ── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Email service not configured' });

  const { toEmail, referralCode, inviterName, language = 'es' } = req.body || {};
  if (!toEmail) return res.status(400).json({ error: 'toEmail required' });

  const L          = LABELS[language] || LABELS.es;
  const inviter    = inviterName || 'Un alma del oráculo';
  const hasRef     = !!referralCode;
  const inviteLink = referralCode ? `${APP_URL}?ref=${referralCode}` : APP_URL;
  const subject    = L.subject(inviter, hasRef);
  const html       = buildHtml({ inviter, referralCode, inviteLink, lang: language });

  const fromEmail  = process.env.RESEND_FROM_EMAIL || 'noreply@cosmic-guidance.com';
  const toActual   = toEmail;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `Cosmic Guidance <${fromEmail}>`, to: toActual, subject, html }),
  });

  const resendBody = await emailRes.text();
  let resendJson;
  try { resendJson = JSON.parse(resendBody); } catch (_) { resendJson = { raw: resendBody }; }

  if (!emailRes.ok) {
    console.error('[send-invite] Resend error:', emailRes.status, resendBody);
    return res.status(500).json({ error: 'Error enviando invitación', detail: resendJson });
  }

  console.log('[send-invite] Sent to:', toActual, 'lang:', language, 'Resend ID:', resendJson?.id);
  return res.status(200).json({ ok: true, resend_id: resendJson?.id, sent_to: toActual });
}
