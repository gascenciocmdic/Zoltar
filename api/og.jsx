/**
 * /api/og — Generates a 1200×630 OG image using @vercel/og (Satori).
 * Runs on Vercel's Edge Runtime (no Node.js APIs, fast global cold start).
 *
 * URL:  https://www.cosmic-guidance.com/api/og
 * Meta: index.html → og:image / twitter:image
 */
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #08001a 0%, #160038 38%, #0e0025 65%, #040010 100%)',
          fontFamily: '"Noto Serif", serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── Atmospheric glow blobs ─────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: -140,
            left: -140,
            width: 540,
            height: 540,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,215,0,0.07) 0%, transparent 65%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -110,
            right: -110,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 65%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 75% 80% at 50% 50%, rgba(90,25,160,0.10) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* ── Tarot-card double border ───────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 18,
            border: '1.5px solid rgba(255,215,0,0.22)',
            borderRadius: 22,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 28,
            border: '1px solid rgba(255,215,0,0.09)',
            borderRadius: 16,
            display: 'flex',
          }}
        />

        {/* ── Corner ornaments ─── (four ✦ placed absolutely) */}
        {[
          { top: 36, left: 44 },
          { top: 36, right: 44 },
          { bottom: 36, left: 44 },
          { bottom: 36, right: 44 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              color: 'rgba(255,215,0,0.30)',
              fontSize: 18,
              display: 'flex',
            }}
          >
            ✦
          </div>
        ))}

        {/* ── Content column ────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
            width: '100%',
          }}
        >
          {/* Crystal orb */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 108,
              height: 108,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 35%, rgba(210,160,255,0.38) 0%, rgba(85,22,155,0.58) 45%, rgba(16,4,42,0.92) 100%)',
              border: '2px solid rgba(255,215,0,0.42)',
              boxShadow:
                '0 0 55px rgba(124,58,237,0.50), 0 0 22px rgba(255,215,0,0.16)',
              marginBottom: 30,
              fontSize: 58,
            }}
          >
            🔮
          </div>

          {/* ZOLTAR */}
          <div
            style={{
              display: 'flex',
              color: '#ffd700',
              fontSize: 112,
              fontWeight: 900,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            ZOLTAR
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              color: 'rgba(196,181,253,0.88)',
              fontSize: 30,
              fontStyle: 'italic',
              letterSpacing: '0.07em',
              marginBottom: 30,
            }}
          >
            El Oráculo de Vidas Pasadas
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 18,
              marginBottom: 30,
            }}
          >
            <div
              style={{
                width: 190,
                height: 1,
                background: 'rgba(255,215,0,0.38)',
                display: 'flex',
              }}
            />
            <div
              style={{
                color: 'rgba(255,215,0,0.72)',
                fontSize: 22,
                display: 'flex',
              }}
            >
              ✦
            </div>
            <div
              style={{
                width: 190,
                height: 1,
                background: 'rgba(255,215,0,0.38)',
                display: 'flex',
              }}
            />
          </div>

          {/* Tagline */}
          <div
            style={{
              display: 'flex',
              color: 'rgba(196,181,253,0.78)',
              fontSize: 27,
              fontStyle: 'italic',
              letterSpacing: '0.02em',
              marginBottom: 40,
            }}
          >
            Descubre quién fuiste. Tus cartas arcanas te esperan.
          </div>

          {/* URL badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,215,0,0.07)',
              border: '1px solid rgba(255,215,0,0.22)',
              borderRadius: 50,
              padding: '8px 28px',
            }}
          >
            <div
              style={{
                color: 'rgba(255,215,0,0.55)',
                fontSize: 20,
                letterSpacing: '0.12em',
                display: 'flex',
              }}
            >
              ✦ cosmic-guidance.com ✦
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
