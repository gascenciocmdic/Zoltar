import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL || 'https://zoltar.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { toEmail, referralCode } = req.body;
  if (!toEmail) return res.status(400).json({ error: 'toEmail required' });

  const inviteLink = referralCode ? `${APP_URL}?ref=${referralCode}` : APP_URL;

  const subject = referralCode
    ? 'Te invito a descubrir Zoltar ✨'
    : 'Descubre Zoltar — el oráculo de vidas pasadas ✨';

  const html = referralCode
    ? `<p>Te invito a explorar tu lectura de cartas en Zoltar.</p>
       <p>Usa mi código <strong>${referralCode}</strong> al registrarte y recibe 25💎 extra.</p>
       <p><a href="${inviteLink}">Ir a Zoltar →</a></p>`
    : `<p>Descubrí Zoltar, el oráculo de vidas pasadas.</p>
       <p>La experiencia completa es gratuita hasta la revelación.</p>
       <p><a href="${inviteLink}">Ir a Zoltar →</a></p>`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'Zoltar <noreply@zoltar.app>',
    to: toEmail,
    subject,
    html,
  });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}
