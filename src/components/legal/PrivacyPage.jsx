import LegalLayout, { Section } from './LegalLayout';

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidad">

      <Section title="1. Responsable del tratamiento">
        <p>
          ZOLTAR — Oráculo de Vidas Pasadas. Para consultas sobre privacidad:
          {' '}<a href="mailto:privacidad@zoltar.app" style={{ color: '#ffd700' }}>privacidad@zoltar.app</a>
        </p>
      </Section>

      <Section title="2. Datos que recopilamos">
        <p>Al usar ZOLTAR recopilamos la siguiente información:</p>
        <ul style={{ paddingLeft: 20, margin: '12px 0 0' }}>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Datos de cuenta:</strong> dirección de correo
            electrónico y nombre (opcional). Proporcionados al registrarte.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Datos de sesión:</strong> idioma seleccionado,
            nombre que ingresas para la lectura, fecha de nacimiento si la proporcionas,
            preguntas o intenciones que describes (usadas para generar tu lectura).
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Datos de uso:</strong> páginas visitadas,
            funciones utilizadas, errores técnicos, tiempos de sesión.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Datos de pago:</strong> procesados íntegramente
            por Stripe. ZOLTAR solo recibe confirmación de la transacción y el monto. No
            almacenamos números de tarjeta ni datos bancarios.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Datos técnicos:</strong> tipo de dispositivo,
            sistema operativo, idioma del navegador, dirección IP (anonimizada).
          </li>
        </ul>
      </Section>

      <Section title="3. Cómo usamos tus datos">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 6 }}>Generar tu experiencia personalizada de lecturas.</li>
          <li style={{ marginBottom: 6 }}>Gestionar tu cuenta, créditos y transacciones.</li>
          <li style={{ marginBottom: 6 }}>Enviarte confirmaciones de compra y comunicaciones del servicio.</li>
          <li style={{ marginBottom: 6 }}>Mejorar el servicio mediante análisis de uso agregado y anonimizado.</li>
          <li style={{ marginBottom: 6 }}>Prevenir fraude y garantizar la seguridad del servicio.</li>
          <li style={{ marginBottom: 6 }}>Cumplir con obligaciones legales.</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <strong style={{ color: '#e5e7eb' }}>No vendemos tus datos</strong> a terceros.
          No usamos tus datos para publicidad personalizada de terceros.
        </p>
      </Section>

      <Section title="4. Base legal del tratamiento">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ color: '#e5e7eb' }}>Ejecución del contrato:</strong> datos
            necesarios para prestarte el servicio (cuenta, créditos, lecturas).
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ color: '#e5e7eb' }}>Interés legítimo:</strong> análisis de uso
            para mejorar el producto, seguridad y prevención de fraude.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ color: '#e5e7eb' }}>Consentimiento:</strong> cookies no esenciales
            y comunicaciones de marketing (puedes retirar el consentimiento en cualquier momento).
          </li>
        </ul>
      </Section>

      <Section title="5. Terceros que procesan tus datos">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Supabase</strong> — Base de datos y autenticación.
            Servidores en EE.UU. Cumple con GDPR.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Stripe</strong> — Procesamiento de pagos.
            Certificado PCI DSS nivel 1.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Google (Gemini API)</strong> — Generación de
            narrativas mediante IA. Las consultas se procesan pero no se usan para entrenar
            modelos bajo nuestro acuerdo de datos.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>ElevenLabs</strong> — Síntesis de voz para
            la narración. Audio generado en tiempo real, no almacenado.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Resend</strong> — Envío de correos transaccionales.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong style={{ color: '#e5e7eb' }}>Vercel</strong> — Infraestructura de hosting.
            Servidores con certificación SOC 2.
          </li>
        </ul>
      </Section>

      <Section title="6. Cookies">
        <p>
          Usamos cookies estrictamente necesarias para mantener tu sesión autenticada y
          guardar tus preferencias de idioma. Con tu consentimiento, podemos usar cookies
          analíticas para entender cómo se usa el servicio (sin identificarte personalmente).
        </p>
        <p style={{ marginTop: 12 }}>
          Puedes gestionar tus preferencias de cookies en el banner que aparece al ingresar
          o desde la configuración de tu navegador.
        </p>
      </Section>

      <Section title="7. Tus derechos">
        <p>Tienes derecho a:</p>
        <ul style={{ paddingLeft: 20, margin: '12px 0 0' }}>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ color: '#e5e7eb' }}>Acceso:</strong> solicitar una copia de tus datos.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ color: '#e5e7eb' }}>Rectificación:</strong> corregir datos inexactos.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ color: '#e5e7eb' }}>Eliminación:</strong> solicitar el borrado de tu cuenta y datos asociados.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ color: '#e5e7eb' }}>Portabilidad:</strong> recibir tus datos en formato legible por máquina.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ color: '#e5e7eb' }}>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.
          </li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Para ejercer estos derechos:{' '}
          <a href="mailto:privacidad@zoltar.app" style={{ color: '#ffd700' }}>privacidad@zoltar.app</a>.
          Responderemos en un plazo máximo de 30 días.
        </p>
      </Section>

      <Section title="8. Retención de datos">
        <p>
          Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta,
          borraremos tus datos personales en un plazo de 30 días, excepto aquellos que
          debamos conservar por obligaciones legales (ej. registros de transacciones por
          5 años según normativa tributaria).
        </p>
      </Section>

      <Section title="9. Seguridad">
        <p>
          Implementamos medidas técnicas y organizativas para proteger tus datos:
          cifrado en tránsito (TLS), autenticación segura vía Supabase, acceso restringido
          a datos personales por parte de nuestro equipo. Ante cualquier brecha de seguridad
          que afecte tus datos te notificaremos dentro de las 72 horas.
        </p>
      </Section>

      <Section title="10. Menores de edad">
        <p>
          ZOLTAR no está dirigido a menores de 18 años y no recopilamos datos de menores
          de forma consciente. Si detectamos que un menor ha creado una cuenta, la
          eliminaremos de inmediato.
        </p>
      </Section>

      <Section title="11. Cambios a esta política">
        <p>
          Podemos actualizar esta Política de Privacidad. Te notificaremos por correo
          electrónico ante cambios significativos. La fecha de última actualización
          siempre estará visible al inicio de este documento.
        </p>
      </Section>

    </LegalLayout>
  );
}
