from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import date

OUTPUT = "/Users/inacap/Documents/Zoltar/docs/ZOLTAR_Plataforma_Report.pdf"

GOLD    = colors.HexColor('#C9A84C')
DARK    = colors.HexColor('#0F0F1A')
CARD    = colors.HexColor('#111111')
TMAIN   = colors.HexColor('#D1D5DB')
TSUB    = colors.HexColor('#6B7280')
RED     = colors.HexColor('#F87171')
ORANGE  = colors.HexColor('#FB923C')
BLUE    = colors.HexColor('#A5B4FC')
GREEN   = colors.HexColor('#4ADE80')
PURPLE  = colors.HexColor('#C084FC')
WHITE   = colors.white
INDIGO  = colors.HexColor('#312E81')
DARKBLUE= colors.HexColor('#1A1A2E')

def S(name, **kw): return ParagraphStyle(name, **kw)

sty = {
    'cover_title': S('ct', fontSize=34, textColor=GOLD, alignment=TA_CENTER, leading=42, fontName='Helvetica-Bold'),
    'cover_sub':   S('cs', fontSize=12, textColor=TSUB, alignment=TA_CENTER, leading=18),
    'cover_date':  S('cd', fontSize=9,  textColor=TSUB, alignment=TA_CENTER),
    'section':     S('sec', fontSize=13, textColor=GOLD, fontName='Helvetica-Bold', leading=18, spaceAfter=3, spaceBefore=14),
    'subsection':  S('sub', fontSize=10, textColor=WHITE, fontName='Helvetica-Bold', leading=14, spaceAfter=2, spaceBefore=6),
    'body':        S('bod', fontSize=8.5, textColor=TMAIN, leading=13, spaceAfter=2),
    'small':       S('sm',  fontSize=7.5, textColor=TSUB, leading=11),
    'green':       S('gr',  fontSize=8.5, textColor=GREEN, leading=13, fontName='Helvetica-Bold'),
    'orange':      S('or',  fontSize=8.5, textColor=ORANGE, leading=13),
    'red':         S('rd',  fontSize=8.5, textColor=RED, leading=13),
    'blue':        S('bl',  fontSize=8.5, textColor=BLUE, leading=13),
    'purple':      S('pu',  fontSize=8.5, textColor=PURPLE, leading=13),
    'gold':        S('go',  fontSize=8.5, textColor=GOLD, leading=13, fontName='Helvetica-Bold'),
    'mono':        S('mo',  fontSize=7.5, textColor=BLUE, leading=12, fontName='Courier'),
    'center':      S('cen', fontSize=8.5, textColor=TMAIN, alignment=TA_CENTER, leading=13),
}

def hr(color=GOLD, t=0.5): return HRFlowable(width='100%', thickness=t, color=color, spaceAfter=6, spaceBefore=6)
def sp(h=0.3): return Spacer(1, h * cm)

def section(text):
    return KeepTogether([sp(0.3), Paragraph(text, sty['section']), hr()])

def tbl(data, widths, last_total=False):
    t = Table(data, colWidths=widths)
    cmds = [
        ('BACKGROUND',    (0,0),(-1,0), DARKBLUE),
        ('TEXTCOLOR',     (0,0),(-1,0), GOLD),
        ('FONTNAME',      (0,0),(-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0,0),(-1,0), 7.5),
        ('FONTSIZE',      (0,1),(-1,-1), 7.5),
        ('TEXTCOLOR',     (0,1),(-1,-1), TMAIN),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [CARD, colors.HexColor('#0a0a0a')]),
        ('GRID',          (0,0),(-1,-1), 0.3, colors.HexColor('#222')),
        ('VALIGN',        (0,0),(-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0),(-1,-1), 5),
        ('BOTTOMPADDING', (0,0),(-1,-1), 5),
        ('LEFTPADDING',   (0,0),(-1,-1), 6),
        ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ]
    if last_total:
        cmds += [
            ('BACKGROUND', (0,-1),(-1,-1), colors.HexColor('#1a1a0a')),
            ('TEXTCOLOR',  (0,-1),(-1,-1), GOLD),
            ('FONTNAME',   (0,-1),(-1,-1), 'Helvetica-Bold'),
        ]
    t.setStyle(TableStyle(cmds))
    return t

doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
    leftMargin=1.8*cm, rightMargin=1.8*cm, topMargin=2*cm, bottomMargin=2*cm)

story = []

# ── COVER ──────────────────────────────────────────────────────────────────────
story += [
    sp(2.5),
    Paragraph("ZOLTAR", sty['cover_title']),
    sp(0.2),
    Paragraph("Plataforma de Lectoras de Cartas con IA", sty['cover_sub']),
    sp(0.4),
    hr(GOLD, 1),
    sp(0.3),
    Paragraph("Arquitectura completa · Modelo de negocio · Voz clonada · Distribución viral", sty['cover_sub']),
    sp(0.4),
    Paragraph(f"Preparado: {date.today().strftime('%d de %B de %Y')} · Confidencial", sty['cover_date']),
    sp(1.5),
]

cover_metrics = [
    ['ZOLTAR', 'Stripe Connect', 'ElevenLabs', '70/30', '$22–45'],
    ['Enganche inicial', 'Pagos lectoras', 'Voz clonada', 'Split lectora/plat.', 'Costo infra mes 1'],
]
ct = Table(cover_metrics, colWidths=[3.2*cm]*5)
ct.setStyle(TableStyle([
    ('BACKGROUND',   (0,0),(-1,0), DARKBLUE),
    ('BACKGROUND',   (0,1),(-1,1), CARD),
    ('TEXTCOLOR',    (0,0),(-1,0), GOLD),
    ('TEXTCOLOR',    (0,1),(-1,1), TSUB),
    ('FONTNAME',     (0,0),(-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',     (0,0),(-1,0), 12),
    ('FONTSIZE',     (0,1),(-1,1), 7),
    ('ALIGN',        (0,0),(-1,-1), 'CENTER'),
    ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
    ('TOPPADDING',   (0,0),(-1,-1), 8),
    ('BOTTOMPADDING',(0,0),(-1,-1), 8),
    ('GRID',         (0,0),(-1,-1), 0.3, colors.HexColor('#333')),
]))
story += [ct, sp(0.5)]

# ── 1. VISION ──────────────────────────────────────────────────────────────────
story.append(section("1. VISIÓN DEL ECOSISTEMA"))

story.append(Paragraph(
    "ZOLTAR es la puerta de entrada al ecosistema. La experiencia pública de ZOLTAR atrae a "
    "clientes (que disfrutan una lectura gratuita y luego descubren lectoras humanas) y a lectoras "
    "(que ven el producto y quieren tener su propio oráculo). Dentro de la plataforma, ZOLTAR es el "
    "deck oficial — la lectora predeterminada. Cada lectora registrada crea su propio ZOLTAR personalizado.",
    sty['body']))
story.append(sp(0.3))

flow_data = [
    ['Paso', 'Actor', 'Acción', 'Resultado'],
    ['1', 'Cliente', 'Llega a ZOLTAR — experiencia gratuita', 'Vive el flujo inmersivo, se engancha'],
    ['2', 'Cliente', 'Descubre el directorio de lectoras humanas', 'Elige una lectora con su estilo/energía'],
    ['3', 'Cliente', 'Paga la lectura con su lectora favorita', 'Vive el flujo con cartas + voz de ella'],
    ['4', 'Cliente', 'Comparte tarjeta viral en redes', 'Nuevo tráfico orgánico a la plataforma'],
    ['5', 'Lectora', 'Ve ZOLTAR y quiere su propio oráculo', 'Se registra y crea su perfil'],
    ['6', 'Lectora', 'Comparte su link en su audiencia actual', 'Su audiencia llega a la plataforma'],
    ['7', 'Lectora', 'Refiere a otra lectora', '10% comisión de suscripción por 6 meses'],
]
story.append(tbl(flow_data, [1.2*cm, 2.2*cm, 6.5*cm, 5.5*cm]))

# ── 2. TRES PORTALES ────────────────────────────────────────────────────────────
story.append(section("2. TRES PORTALES — FUNCIONALIDADES"))

story.append(Paragraph("Portal Lectora (Registrada)", sty['subsection']))
lectora_feats = [
    "Registro con nombre artístico, foto, bio y especialidad (tarot, oráculo, runas, lenormand, chamanismo)",
    "Selección de deck: biblioteca curada (Rider-Waite libre + decks licenciados) O upload de deck propio con declaración de derechos",
    "Descripción de cada carta en sus propias palabras (parametriza el prompt de IA)",
    "Configuración de estilo de lectura: directo, poético, terapéutico, chamánico, astrológico",
    "Carga de frases características y ejemplo de lectura real (la IA aprende su voz)",
    "Definición de precio por lectura: entre $3 y $30 USD (plan Pro) o hasta $99 (Studio)",
    "Grabación de voz de 1 minuto para clonación con ElevenLabs (plan Pro/Studio)",
    "Link único compartible: oraculo.app/nombre-lectora + QR descargable",
    "Dashboard de ingresos en tiempo real: lecturas, conversión, valoraciones, próximo retiro",
    "Retiro semanal automático vía Stripe Connect a cuenta bancaria propia",
    "Kit de contenido viral: tarjeta 1:1 y 9:16, texto pre-escrito para IG/TikTok, embed widget",
    "Estadísticas: visitas a perfil, tasa de conversión, reseñas de clientes",
]
for f in lectora_feats:
    story.append(Paragraph(f"  ✦  {f}", sty['body']))

story.append(sp(0.3))
story.append(Paragraph("Portal Cliente (Comprador)", sty['subsection']))
cliente_feats = [
    "Directorio de lectoras filtrable por especialidad, precio, idioma y valoración",
    "Perfil detallado de cada lectora: bio, deck, reseñas, precio, idiomas disponibles",
    "Pago directo (Stripe Checkout) sin necesidad de crear cuenta — guest checkout disponible",
    "Flujo inmersivo ZOLTAR completo, pero con las cartas y el espíritu de su lectora elegida",
    "Lectura narrada con la voz clonada de la lectora (plan Pro/Studio)",
    "Síntesis final por email al terminar la lectura",
    "Tarjeta compartible generada automáticamente (1:1 y 9:16) con branding de la lectora",
    "Historial de lecturas anteriores por usuario registrado",
    "Sistema de reseñas y valoración post-lectura",
]
for f in cliente_feats:
    story.append(Paragraph(f"  ✦  {f}", sty['body']))

story.append(sp(0.3))
story.append(Paragraph("Portal Administrador (Plataforma)", sty['subsection']))
admin_feats = [
    "Dashboard: lectoras activas, ingresos totales, comisiones por período, MRR de suscripciones",
    "Aprobación / suspensión de perfiles de lectoras (moderación de contenido y copyright)",
    "Revisión de decks subidos: verificación de declaración de derechos",
    "Configuración de splits de ingreso por plan (60/70/80% para lectora)",
    "Configuración de precios mínimos y máximos por mercado geográfico",
    "Gestión de disputas, reembolsos y soporte a lectoras y clientes",
    "Newsletter y comunicaciones segmentadas a lectoras activas / inactivas",
    "Reporte financiero mensual exportable: comisiones, suscripciones, payouts",
    "Métricas de retención, engagement y funnel de conversión por lectora",
]
for f in admin_feats:
    story.append(Paragraph(f"  ✦  {f}", sty['body']))

# ── 3. STACK DE SERVICIOS ──────────────────────────────────────────────────────
story.append(section("3. STACK DE SERVICIOS POR PROCESO"))

services_data = [
    ['Servicio', 'Rol en la plataforma', 'Plan inicial', 'Costo base', 'Estado'],
    ['Supabase', 'Auth (lectoras + clientes) · DB · Storage imágenes cartas', 'Free (50k MAU)', '$0/mes', 'Ya existe'],
    ['Vercel', 'Hosting · Serverless API · OG Image (tarjeta viral)', 'Hobby', '$0/mes', 'Ya existe'],
    ['Stripe Checkout', 'Cobro al cliente final por lectura', 'Pay/use', '2.9%+$0.30/tx', 'Ya existe'],
    ['Stripe Connect Express', 'Split automático 70/30 · Pago semanal al banco de la lectora · 46+ países', 'Pay/use', '+0.5% por tx + $0.25/payout', 'Nuevo'],
    ['Stripe Billing', 'Suscripción mensual de lectoras (Pro/Studio) cobrada automáticamente', 'Pay/use', '0.5% del MRR', 'Nuevo'],
    ['Gemini 1.5 Pro/Flash', 'Generación de lectura con prompt parametrizado de cada lectora', 'Pay/use', '$0.005–0.01/lectura', 'Ya existe'],
    ['ElevenLabs API', 'Clonación de voz lectora · Síntesis de audio en tiempo real', 'Creator $22/mes', '$0.30/1k chars (~$0.60/lectura)', 'Nuevo (Pro/Studio)'],
    ['Cloudinary', 'Storage y optimización de imágenes del deck de la lectora', 'Free (25GB)', '$0/mes', 'Nuevo'],
    ['Resend', 'Emails transaccionales: síntesis, bienvenida, confirmación de pago', 'Free (3k/mes)', '$0/mes', 'Ya existe'],
    ['PostHog', 'Analytics de funnel, conversión y retención por lectora', 'Free (1M eventos)', '$0/mes', 'Nuevo'],
    ['Vercel OG', 'Generación PNG tarjeta compartible (1:1 y 9:16) con branding lectora', 'Incluido en Vercel', '$0', 'Nuevo'],
]
story.append(tbl(services_data, [2.5*cm, 5.8*cm, 2.5*cm, 2.5*cm, 1.8*cm]))

# ── 4. PAGOS A LECTORAS ────────────────────────────────────────────────────────
story.append(section("4. FLUJO DE PAGOS A LECTORAS — STRIPE CONNECT"))

story.append(Paragraph(
    "Stripe Connect Express es el estándar de la industria para plataformas marketplace (Airbnb, Fiverr, "
    "Patreon usan este modelo). Permite splits automáticos en cada transacción sin que la plataforma "
    "tenga que gestionar los fondos manualmente.", sty['body']))
story.append(sp(0.2))

pay_flow = [
    ['Paso', 'Quién', 'Acción', 'Plataforma usada'],
    ['1', 'Lectora al registrarse', 'Completa onboarding Stripe Connect (datos bancarios, verificación de identidad)', 'Stripe Connect Express'],
    ['2', 'Cliente al pagar', 'Paga $10 USD por una lectura con tarjeta de crédito/débito', 'Stripe Checkout'],
    ['3', 'Stripe automáticamente', 'Retiene 30% ($3) para la plataforma, transfiere 70% ($7) a la cuenta de la lectora', 'Stripe Connect (split automático)'],
    ['4', 'Cada lunes', 'Stripe transfiere el saldo acumulado al banco de la lectora en su país', 'Stripe Payouts'],
    ['5', 'Lectora', 'Recibe transferencia bancaria en su moneda local (CLP, MXN, COP, EUR, BRL…)', 'Banco local de la lectora'],
]
story.append(tbl(pay_flow, [1*cm, 2.8*cm, 6.5*cm, 4.8*cm]))

story.append(sp(0.3))
story.append(Paragraph(
    "Disponibilidad geográfica de Stripe Connect: Chile ✓ · México ✓ · Colombia ✓ · España ✓ · "
    "Brasil ✓ · Argentina ✓ · Perú ✓ · Ecuador ✓ · USA ✓ · UK ✓ · Alemania ✓ · Francia ✓ · "
    "46+ países en total. La lectora puede estar en cualquiera de estos países.", sty['green']))

# ── 5. PARAMETRIZACION PROMPT ──────────────────────────────────────────────────
story.append(section("5. PARAMETRIZACIÓN DEL PROMPT — VOZ DE LA LECTORA"))

story.append(Paragraph("Datos que completa la lectora al crear su perfil", sty['subsection']))
prompt_inputs = [
    ['Campo del perfil', 'Descripción', 'Cómo afecta al prompt'],
    ['Nombre artístico', 'Nombre público de la lectora', 'Define cómo se presenta el oráculo ("Soy Luna Mística…")'],
    ['Especialidad', 'Tarot Marsella, Rider-Waite, Oracle, Runas, Lenormand, etc.', 'Establece el marco conceptual de la lectura'],
    ['Estilo de lectura', 'Directo / Poético / Terapéutico / Chamánico / Astrológico', 'Define el registro y tono de todas las interpretaciones'],
    ['Filosofía personal', 'Qué cree sobre las lecturas (ej. "el tarot refleja el inconsciente")', 'Ancla la coherencia filosófica de las respuestas'],
    ['Descripción de cartas', 'SU interpretación personal de cada carta en texto libre', 'Reemplaza las definiciones estándar por las propias de la lectora'],
    ['Frases características', 'Expresiones que usa habitualmente en sus lecturas', 'Inyectadas como ejemplos de tono y vocabulario'],
    ['Ejemplo de lectura real', 'Pega un texto de lectura que haya dado anteriormente', 'La IA aprende su estructura narrativa y nivel de detalle'],
    ['Idiomas', 'En qué idiomas puede atender (ES, EN, PT, otros)', 'Permite filtrar en el directorio; la IA responde en el idioma del cliente'],
    ['Grabación de voz', '1 minuto de audio limpio (WAV o MP3)', 'Procesada por ElevenLabs para clonar su voz (solo Pro/Studio)'],
]
story.append(tbl(prompt_inputs, [3*cm, 4.5*cm, 7.1*cm]))

story.append(sp(0.3))
story.append(Paragraph("Estructura del system prompt generado automáticamente", sty['subsection']))
prompt_example = [
    "Eres {nombre_artistico}, lectora de {especialidad} con {anos} años de experiencia.",
    "Tu filosofía es: '{filosofia}'",
    "Tu estilo es {estilo}. Usas frases como: '{frases_caracteristicas}'",
    "",
    "Interpretación de las cartas seleccionadas por el consultante:",
    "  - {carta_1}: '{descripcion_personal_carta_1}'",
    "  - {carta_2}: '{descripcion_personal_carta_2}'",
    "  - {carta_3}: '{descripcion_personal_carta_3}'",
    "",
    "Ejemplo de cómo das una lectura:",
    "'{ejemplo_lectura_real}'",
    "",
    "Responde SIEMPRE en {idioma_del_cliente}. Mantén tu voz y estilo en todo momento.",
]
for line in prompt_example:
    story.append(Paragraph(line if line else " ", sty['mono']))

# ── 6. COPYRIGHT CARTAS ────────────────────────────────────────────────────────
story.append(section("6. ESTRATEGIA DE COPYRIGHT PARA DECKS DE CARTAS"))

copy_data = [
    ['Capa', 'Descripción', 'Riesgo copyright', 'Recomendado'],
    ['Biblioteca curada', 'Rider-Waite (dominio público desde 1971) + decks que la plataforma licencia expresamente con los editores', 'Ninguno', 'Sí — capa base'],
    ['Upload propio declarado', 'Lectora sube imágenes de un deck comercial pero declara en ToS que posee los derechos o tiene licencia de uso', 'Bajo (responsabilidad del lectora)', 'Sí — con DMCA + ToS claro'],
    ['Deck 100% original', 'Lectora sube imágenes de cartas que ella misma creó o encargó (arte propio)', 'Ninguno', 'Sí — fomentar activamente'],
    ['Solo texto, sin imagen', 'Lectora describe sus cartas en texto; el flujo muestra iconos genéricos en lugar de imágenes reales', 'Ninguno', 'Sí — opción segura para empezar'],
    ['Upload libre sin control', 'Lectora sube cualquier imagen sin declaración de derechos', 'Muy alto — exposición a demandas de editores de tarot', 'No — nunca implementar'],
]
story.append(tbl(copy_data, [3*cm, 5.5*cm, 2.8*cm, 2.5*cm]))

story.append(sp(0.2))
story.append(Paragraph(
    "Nota legal: Rider-Waite Tarot (Pamela Colman Smith, 1909) entró al dominio público en USA y UK. "
    "Es la baraja más usada del mundo y puede distribuirse libremente. Otros decks populares "
    "(Thoth, Marseille modernos, Oracle de los Ángeles) tienen copyright activo y requieren licencia.",
    sty['orange']))

# ── 7. VOZ CLONADA ─────────────────────────────────────────────────────────────
story.append(section("7. CLONACIÓN DE VOZ — VIABILIDAD Y MODELO DE COSTO"))

story.append(Paragraph(
    "La clonación de voz es técnicamente viable hoy con ElevenLabs. Con solo 1 minuto de audio "
    "limpio, la API genera una voz clonada indistinguible en calidad. Es el diferenciador más "
    "poderoso de la plataforma: ningún competidor de tarot digital ofrece esto actualmente.",
    sty['green']))
story.append(sp(0.2))

voice_data = [
    ['Plan lectora', 'Precio mensual', 'Voz', 'Calidad', 'Costo plataforma/lectura', 'Punto de equilibrio'],
    ['Starter', '$0', 'Web Speech API (navegador)', 'Básica — voz genérica', '$0', 'Inmediato'],
    ['Pro ⭐', '$29/mes', 'ElevenLabs Instant Clone', 'Alta — voz real clonada', '~$0.60/lectura', '~50 lecturas/mes'],
    ['Studio', '$59/mes', 'ElevenLabs Professional Clone', 'Premium — 3 perfiles de ánimo', '~$0.90/lectura', '~65 lecturas/mes'],
]
story.append(tbl(voice_data, [2*cm, 2.5*cm, 3.5*cm, 2.8*cm, 3*cm, 2.8*cm]))

story.append(sp(0.2))
story.append(Paragraph("Flujo técnico de implementación", sty['subsection']))
voice_flow = [
    "1. Lectora graba 1 minuto de audio (WAV/MP3) durante el registro en la plataforma",
    "2. La plataforma llama a ElevenLabs API POST /v1/voices/add con el archivo de audio",
    "3. ElevenLabs devuelve un voice_id único que se guarda en el perfil de Supabase de la lectora",
    "4. En cada lectura de un cliente, el texto generado por Gemini se envía a ElevenLabs /v1/text-to-speech/{voice_id}",
    "5. ElevenLabs devuelve un MP3 que se reproduce en el navegador del cliente (mismo player de audio que usa ZOLTAR hoy)",
    "6. Si la lectora actualiza su perfil de voz, se genera un nuevo voice_id y se reemplaza en Supabase",
]
for f in voice_flow:
    story.append(Paragraph(f"  {f}", sty['body']))

# ── 8. DISTRIBUCION VIRAL ──────────────────────────────────────────────────────
story.append(section("8. DISTRIBUCIÓN VIRAL — TOOLKIT DE LA LECTORA"))

viral_data = [
    ['Herramienta', 'Descripción', 'Canal', 'Costo de implementación'],
    ['Tarjeta compartible', 'PNG auto-generado: 3 cartas + decreto + nombre lectora + logo plataforma. Formatos 1:1 (IG) y 9:16 (Stories/TikTok)', 'Instagram · TikTok · WhatsApp', 'Vercel OG Image — gratis'],
    ['Link único lectora', 'oraculo.app/nombre-lectora — URL limpia compartible en bio, mensajes, presencial', 'Todos los canales', 'Subdominio en Vercel — gratis'],
    ['QR descargable', 'QR que apunta al perfil de la lectora — imprimible para uso presencial o en stories', 'Presencial · IG Stories', 'librería qrcode — gratis'],
    ['Embed widget', 'Iframe para incrustar el oráculo en su web propia o Linktree', 'Web propia · Linktree', 'Componente React — gratis'],
    ['Video TikTok/Reels', 'MP4 corto con animación de las 3 cartas revelándose + audio de voz clonada de la lectora', 'TikTok · Instagram · YouTube Shorts', 'ffmpeg en Vercel — $0'],
    ['Texto pre-escrito', 'Copy listo para copiar/pegar en IG, TikTok, WhatsApp con hashtags por idioma y nicho', 'Todos los canales', 'Template estático — gratis'],
    ['Referido lectora→lectora', 'Si refiere a otra lectora que se suscribe: 10% de su suscripción mensual durante 6 meses', 'Directo', 'Stripe Connect — sin costo extra'],
    ['Share nativo cliente', 'Botón "Compartir mi lectura" al finalizar — genera la tarjeta y abre el share sheet del móvil', 'WhatsApp · IG · X · Telegram', 'Web Share API — gratis'],
]
story.append(tbl(viral_data, [3*cm, 6*cm, 2.8*cm, 3.8*cm]))

# ── 9. IDIOMAS ─────────────────────────────────────────────────────────────────
story.append(section("9. ESTRATEGIA DE IDIOMAS"))

lang_data = [
    ['Capa', 'Idiomas', 'Implementación', 'Prioridad'],
    ['UI de la plataforma', 'ES · EN · PT', 'Sistema i18n de ZOLTAR — extender con nuevas claves', 'Lanzamiento'],
    ['Lecturas generadas', 'ES · EN · PT · FR · DE (extensible)', 'Gemini genera en el idioma del cliente automáticamente', 'Lanzamiento'],
    ['Perfil de lectora', 'Multi-idioma opcional', 'Lectora indica en qué idiomas puede atender (filtro en directorio)', 'Lanzamiento'],
    ['Voz clonada', 'Idioma nativo de la lectora', 'ElevenLabs clona la voz en el idioma que habló al grabar', 'Post-lanzamiento'],
    ['Tarjeta viral', 'Idioma del cliente', 'Vercel OG genera el texto en el idioma de la sesión activa', 'Lanzamiento'],
    ['Emails', 'ES · EN · PT', 'Plantillas en 3 idiomas en Resend — misma estructura', 'Lanzamiento'],
]
story.append(tbl(lang_data, [3.5*cm, 3.5*cm, 5.5*cm, 3.1*cm]))

# ── 10. PLANES ─────────────────────────────────────────────────────────────────
story.append(section("10. PLANES DE SUSCRIPCIÓN PARA LECTORAS"))

plan_data = [
    ['Plan', 'Precio', 'Split ingreso', 'Cartas máx.', 'Precio/lectura máx.', 'Voz', 'Lecturas/mes', 'Extras'],
    ['Starter', 'Gratis', '60% lectora / 40% plat.', '20 cartas', '$5 USD', 'Web Speech (genérica)', '5 lecturas', '—'],
    ['Pro ⭐', '$29/mes', '70% lectora / 30% plat.', '80 cartas', '$30 USD', 'ElevenLabs clonada', 'Ilimitado', 'Analytics · Link propio · QR · Embed · Tarjeta viral'],
    ['Studio', '$59/mes', '80% lectora / 20% plat.', '200 cartas', '$99 USD', 'ElevenLabs Premium (3 perfiles)', 'Ilimitado', 'Todo Pro + Video TikTok auto + Soporte prioritario + API embed'],
]
story.append(tbl(plan_data, [1.5*cm, 1.8*cm, 3.2*cm, 2*cm, 2.5*cm, 2.8*cm, 1.8*cm, 3*cm]))

# ── 11. COSTOS ─────────────────────────────────────────────────────────────────
story.append(section("11. EVALUACIÓN DE COSTOS — STACK COMPLETO"))

cost_data = [
    ['Servicio', 'Rol', 'Mes 1', 'Mes 6 (100 lectoras)', 'Cuándo escala'],
    ['Supabase', 'Auth + DB + Storage', '$0', '$0', '>50k MAU → $25/mes'],
    ['Vercel', 'Hosting + API + OG', '$0', '$20', '>100GB → $20/mes'],
    ['Stripe + Connect', 'Cobros + splits', '2.9%+$0.30+0.5%/tx', 'Escala con volumen', 'Sin fee fijo'],
    ['Stripe Billing', 'Suscripciones lectoras', '0.5% MRR', '~$14 (sobre $2.900 MRR)', 'Escala con lectoras'],
    ['Gemini API', 'Generación de lecturas', '~$5–15', '~$50–150', '~$0.01/lectura'],
    ['ElevenLabs', 'Clonación + síntesis voz', '$22 (Creator)', '~$99 (Scale)', '>1M chars → $99/mes'],
    ['Cloudinary', 'Storage imágenes cartas', '$0', '$0', '>25GB → $89/mes'],
    ['Resend', 'Emails transaccionales', '$0', '$0', '>3k/mes → $20/mes'],
    ['PostHog', 'Analytics + funnel', '$0', '$0', '>1M eventos → $20/mes'],
    ['TOTAL infraestructura', '', '~$27–37 USD', '~$183–303 USD', ''],
    ['Ingresos suscripciones', '', '$0 (pre-lanzamiento)', '~$2.900 USD (100 lectoras Pro)', ''],
    ['MARGEN operativo', '', 'Negativo (inversión)', '~$2.600 USD/mes solo en suscripciones', ''],
]
story.append(tbl(cost_data, [3.5*cm, 3.5*cm, 2.5*cm, 3.5*cm, 3.6*cm], last_total=True))

story.append(sp(0.3))
story.append(Paragraph(
    "Punto clave de rentabilidad: con solo 20 lectoras Pro activas ($580/mes en suscripciones), "
    "los costos de infraestructura quedan cubiertos completamente. A partir de ahí, cada nueva "
    "lectora y cada comisión de lectura es utilidad neta.",
    sty['green']))

story.append(sp(0.3))
story.append(Paragraph(
    "Riesgo de costo a monitorear: ElevenLabs escala con el uso de voz. Si las lectoras Pro "
    "tienen alto volumen de lecturas con voz clonada, el costo de síntesis puede crecer rápido. "
    "Solución: implementar caché de audio para frases repetidas y límite de caracteres por plan.",
    sty['orange']))

# ── FOOTER ─────────────────────────────────────────────────────────────────────
story += [
    sp(1),
    hr(TSUB, 0.3),
    Paragraph(
        f"ZOLTAR — Plataforma de Lectoras de Cartas con IA  ·  Documento confidencial  ·  "
        f"{date.today().strftime('%d/%m/%Y')}  ·  "
        "Sección siguiente: Comparativa de decisión — qué construir primero.",
        sty['small']),
]

doc.build(story)
print(f"PDF generado: {OUTPUT}")
