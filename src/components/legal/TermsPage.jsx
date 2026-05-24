import LegalLayout, { Section } from './LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout title="Términos y Condiciones de Uso">

      <Section title="1. Descripción del servicio">
        <p>
          ZOLTAR — Oráculo de Vidas Pasadas es una experiencia digital de entretenimiento
          que utiliza inteligencia artificial para generar narrativas inspiradas en el
          concepto de vidas pasadas. El servicio se proporciona <strong style={{ color: '#e5e7eb' }}>
          exclusivamente con fines de entretenimiento y exploración personal</strong>.
        </p>
        <p style={{ marginTop: 12 }}>
          Las lecturas generadas por ZOLTAR no constituyen asesoramiento espiritual,
          psicológico, médico, legal ni financiero. No deben interpretarse como
          predicciones o verdades absolutas sobre el pasado, presente o futuro de ninguna persona.
        </p>
      </Section>

      <Section title="2. Requisitos de uso">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 6 }}>Debes tener al menos <strong style={{ color: '#e5e7eb' }}>18 años</strong> para usar este servicio.</li>
          <li style={{ marginBottom: 6 }}>Debes crear una cuenta con una dirección de correo electrónico válida.</li>
          <li style={{ marginBottom: 6 }}>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
          <li style={{ marginBottom: 6 }}>Está prohibido usar el servicio para fines ilegales o perjudiciales.</li>
        </ul>
      </Section>

      <Section title="3. Sistema de créditos y pagos">
        <p>
          ZOLTAR opera bajo un sistema de créditos prepagados. Los créditos se adquieren
          mediante pago único y no tienen fecha de vencimiento. El costo de cada
          experiencia se descuenta al momento de iniciarla:
        </p>
        <ul style={{ paddingLeft: 20, margin: '12px 0 0' }}>
          <li style={{ marginBottom: 4 }}>Consulta estándar: 40 créditos</li>
          <li style={{ marginBottom: 4 }}>Ritual ancestral: 65 créditos</li>
          <li style={{ marginBottom: 4 }}>Profundización: 10 créditos</li>
          <li style={{ marginBottom: 4 }}>Email de síntesis: 10 créditos</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Los pagos se procesan a través de Stripe. ZOLTAR no almacena datos de tarjetas
          de crédito. Los precios se muestran en dólares estadounidenses (USD) e incluyen
          los impuestos aplicables.
        </p>
      </Section>

      <Section title="4. Política de reembolsos">
        <p>
          Los créditos adquiridos son no reembolsables una vez utilizados. Si experimentas
          un error técnico que resulta en el consumo incorrecto de créditos, contáctanos a
          {' '}<a href="mailto:soporte@cosmic-guidance.com" style={{ color: '#ffd700' }}>soporte@cosmic-guidance.com</a>{' '}
          dentro de los 7 días siguientes. Evaluaremos cada caso individualmente.
        </p>
        <p style={{ marginTop: 12 }}>
          Los créditos no utilizados pueden ser reembolsados dentro de los primeros
          14 días desde la compra, siempre que no se haya consumido más del 10% del paquete.
        </p>
      </Section>

      <Section title="5. Propiedad intelectual">
        <p>
          Todo el contenido de ZOLTAR — incluyendo textos, diseño, código, imágenes y
          experiencias generadas — es propiedad de sus creadores o está licenciado para su uso.
          Queda prohibida la reproducción, distribución o modificación sin autorización expresa.
        </p>
        <p style={{ marginTop: 12 }}>
          Las narrativas generadas para tu sesión son de uso personal. No puedes venderlas
          ni presentarlas como obra propia.
        </p>
      </Section>

      <Section title="6. Limitación de responsabilidad">
        <p>
          ZOLTAR se proporciona "tal cual". No garantizamos que el servicio esté libre de
          errores o disponible en todo momento. En ningún caso seremos responsables por
          daños indirectos, incidentales o consecuentes derivados del uso del servicio.
        </p>
        <p style={{ marginTop: 12 }}>
          Al usar ZOLTAR, reconoces que las experiencias generadas son ficticias y de
          naturaleza entretenida. Cualquier decisión de vida que tomes es de tu exclusiva
          responsabilidad.
        </p>
      </Section>

      <Section title="7. Modificaciones al servicio">
        <p>
          Nos reservamos el derecho de modificar estos Términos en cualquier momento.
          Los cambios importantes serán notificados por correo electrónico con al menos
          15 días de anticipación. El uso continuado del servicio implica la aceptación
          de los Términos actualizados.
        </p>
      </Section>

      <Section title="8. Legislación aplicable">
        <p>
          Estos Términos se rigen por las leyes de la República de Chile. Cualquier
          disputa será sometida a los tribunales competentes de la ciudad de Santiago.
        </p>
      </Section>

      <Section title="9. Contacto">
        <p>
          Para consultas sobre estos Términos:{' '}
          <a href="mailto:legal@cosmic-guidance.com" style={{ color: '#ffd700' }}>legal@cosmic-guidance.com</a>
        </p>
      </Section>

    </LegalLayout>
  );
}
