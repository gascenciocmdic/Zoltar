/**
 * /api/lemonsqueezy-checkout
 *
 * POST { packageId: 'iniciado'|'explorador'|'oraculo' }
 * Headers: Authorization: Bearer <supabase_jwt>
 *
 * Crea una sesión de checkout en LemonSqueezy y retorna la URL de pago.
 * El frontend redirige al usuario a esa URL (hosted checkout de LemonSqueezy).
 *
 * Retorna: { checkoutUrl, credits, packageId }
 */

import { createClient } from '@supabase/supabase-js';
import { setCors } from './_cors.js';

const PACKAGES = {
  iniciado:   { credits: 150,  variantEnvVar: 'LEMONSQUEEZY_VARIANT_ID_INICIADO'   },
  explorador: { credits: 400,  variantEnvVar: 'LEMONSQUEEZY_VARIANT_ID_EXPLORADOR'  },
  oraculo:    { credits: 1100, variantEnvVar: 'LEMONSQUEEZY_VARIANT_ID_ORACULO'     },
};

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getUser(req) {
  try {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    if (!token) return null;
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error || !data) return null;
    return data.user || null;
  } catch (err) {
    console.error('[ls-checkout] getUser error:', err);
    return null;
  }
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });

  const { packageId } = req.body || {};
  const pkg = PACKAGES[packageId];
  if (!pkg) return res.status(400).json({ error: 'Paquete inválido' });

  const apiKey    = process.env.LEMONSQUEEZY_API_KEY;
  const storeId   = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env[pkg.variantEnvVar];

  if (!apiKey || !storeId || !variantId) {
    console.error('[ls-checkout] Faltan env vars:', { apiKey: !!apiKey, storeId: !!storeId, variantId: !!variantId });
    return res.status(503).json({ error: 'Pagos no configurados. Contacta al administrador.' });
  }

  const appUrl     = process.env.APP_URL || 'https://www.cosmic-guidance.com';
  const successUrl = `${appUrl}?payment=success&credits=${pkg.credits}`;

  try {
    const lsRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/vnd.api+json',
        'Accept':        'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email:  user.email,
              custom: { user_id: user.id, package_id: packageId },
            },
            product_options: {
              redirect_url: successUrl,
            },
          },
          relationships: {
            store:   { data: { type: 'stores',   id: storeId   } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      }),
    });

    if (!lsRes.ok) {
      const errBody = await lsRes.text();
      console.error('[ls-checkout] LemonSqueezy error:', lsRes.status, errBody);
      return res.status(502).json({ error: 'Error al crear el checkout' });
    }

    const lsData      = await lsRes.json();
    const checkoutUrl = lsData.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error('[ls-checkout] Sin URL en respuesta:', JSON.stringify(lsData));
      return res.status(502).json({ error: 'No se recibió URL de checkout' });
    }

    return res.status(200).json({ checkoutUrl, credits: pkg.credits, packageId });
  } catch (err) {
    console.error('[ls-checkout] Error inesperado:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
