from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import date

OUTPUT = "/Users/inacap/Documents/Zoltar/docs/ZOLTAR_MVP_Report.pdf"

# ── Colors ─────────────────────────────────────────────────────────────────────
GOLD      = colors.HexColor('#C9A84C')
DARK_BG   = colors.HexColor('#0F0F1A')
CARD_BG   = colors.HexColor('#111111')
TEXT_MAIN = colors.HexColor('#D1D5DB')
TEXT_SUB  = colors.HexColor('#6B7280')
RED       = colors.HexColor('#F87171')
ORANGE    = colors.HexColor('#FB923C')
BLUE      = colors.HexColor('#A5B4FC')
GREEN     = colors.HexColor('#4ADE80')
PURPLE    = colors.HexColor('#C084FC')
WHITE     = colors.white

# ── Styles ─────────────────────────────────────────────────────────────────────
base = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

styles = {
    'cover_title': S('cover_title', fontSize=32, textColor=GOLD, alignment=TA_CENTER, leading=40, fontName='Helvetica-Bold'),
    'cover_sub':   S('cover_sub',   fontSize=13, textColor=TEXT_SUB, alignment=TA_CENTER, leading=18),
    'cover_date':  S('cover_date',  fontSize=10, textColor=TEXT_SUB, alignment=TA_CENTER),
    'section':     S('section',     fontSize=14, textColor=GOLD, fontName='Helvetica-Bold', leading=20, spaceAfter=4),
    'subsection':  S('subsection',  fontSize=11, textColor=WHITE, fontName='Helvetica-Bold', leading=16, spaceAfter=2),
    'body':        S('body',        fontSize=9,  textColor=TEXT_MAIN, leading=14, spaceAfter=2),
    'small':       S('small',       fontSize=8,  textColor=TEXT_SUB, leading=12),
    'highlight':   S('highlight',   fontSize=9,  textColor=GREEN, leading=14, fontName='Helvetica-Bold'),
    'warn':        S('warn',        fontSize=9,  textColor=ORANGE, leading=14, fontName='Helvetica-Bold'),
    'crit':        S('crit',        fontSize=9,  textColor=RED, leading=14, fontName='Helvetica-Bold'),
    'center':      S('center',      fontSize=9,  textColor=TEXT_MAIN, alignment=TA_CENTER, leading=14),
    'tag_ok':      S('tag_ok',      fontSize=7,  textColor=GREEN, fontName='Helvetica-Bold'),
    'tag_warn':    S('tag_warn',    fontSize=7,  textColor=ORANGE, fontName='Helvetica-Bold'),
    'tag_crit':    S('tag_crit',    fontSize=7,  textColor=RED, fontName='Helvetica-Bold'),
    'tag_miss':    S('tag_miss',    fontSize=7,  textColor=BLUE, fontName='Helvetica-Bold'),
}

def hr(color=GOLD, thickness=0.5):
    return HRFlowable(width='100%', thickness=thickness, color=color, spaceAfter=8, spaceBefore=8)

def sp(h=0.3):
    return Spacer(1, h * cm)

def section_header(text):
    return KeepTogether([
        sp(0.4),
        Paragraph(text, styles['section']),
        hr(),
    ])

def table_style(header_color=colors.HexColor('#1a1a2e'), row_alt=colors.HexColor('#111111')):
    return TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), header_color),
        ('TEXTCOLOR',     (0,0), (-1,0), GOLD),
        ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0,0), (-1,0), 8),
        ('FONTSIZE',      (0,1), (-1,-1), 8),
        ('TEXTCOLOR',     (0,1), (-1,-1), TEXT_MAIN),
        ('BACKGROUND',    (0,1), (-1,-1), CARD_BG),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [CARD_BG, colors.HexColor('#0a0a0a')]),
        ('GRID',          (0,0), (-1,-1), 0.3, colors.HexColor('#222222')),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING',   (0,0), (-1,-1), 7),
        ('RIGHTPADDING',  (0,0), (-1,-1), 7),
        ('ROWBACKGROUNDS',(0,-1),(-1,-1), [colors.HexColor('#1a1a0a')]),
        ('TEXTCOLOR',     (0,-1),(-1,-1), GOLD),
        ('FONTNAME',      (0,-1),(-1,-1), 'Helvetica-Bold'),
    ])

# ── Build ──────────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
)

story = []

# ─── COVER ────────────────────────────────────────────────────────────────────
story.append(sp(3))
story.append(Paragraph("ZOLTAR", styles['cover_title']))
story.append(sp(0.3))
story.append(Paragraph("Oráculo de Vidas Pasadas", styles['cover_sub']))
story.append(sp(0.5))
story.append(hr(GOLD, 1))
story.append(sp(0.3))
story.append(Paragraph("Evaluación MVP · Roadmap de Lanzamiento · Proyección Financiera", styles['cover_sub']))
story.append(sp(0.5))
story.append(Paragraph(f"Preparado: {date.today().strftime('%d de %B de %Y')} · Confidencial", styles['cover_date']))
story.append(sp(2))

metrics = [
    ['72/100', '44', '3', '90%+', '$0–30/mes'],
    ['Preparación MVP', 'Cartas', 'Idiomas', 'Margen bruto', 'Infra inicial'],
]
t = Table(metrics, colWidths=[3.2*cm]*5)
t.setStyle(TableStyle([
    ('BACKGROUND',   (0,0),(-1,0), colors.HexColor('#1a1a2e')),
    ('BACKGROUND',   (0,1),(-1,1), CARD_BG),
    ('TEXTCOLOR',    (0,0),(-1,0), GOLD),
    ('TEXTCOLOR',    (0,1),(-1,1), TEXT_SUB),
    ('FONTNAME',     (0,0),(-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',     (0,0),(-1,0), 14),
    ('FONTSIZE',     (0,1),(-1,1), 7),
    ('ALIGN',        (0,0),(-1,-1), 'CENTER'),
    ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
    ('TOPPADDING',   (0,0),(-1,-1), 8),
    ('BOTTOMPADDING',(0,0),(-1,-1), 8),
    ('GRID',         (0,0),(-1,-1), 0.3, colors.HexColor('#333')),
    ('ROUNDEDCORNERS', [6]),
]))
story.append(t)

# ─── SECTION 1: ESTADO ACTUAL ─────────────────────────────────────────────────
story.append(section_header("1. EVALUACIÓN DEL ESTADO ACTUAL"))

story.append(Paragraph("Flujo de usuario — 6 fases", styles['subsection']))
flow_data = [
    ['Fase', 'Nombre', 'Estado', 'Detalle'],
    ['①', 'Selección de idioma', '✓ OK', 'Español / English / Português'],
    ['②', 'Portal de entrada', '✓ OK', 'Mensaje de bienvenida + TTS + vórtex WebGL'],
    ['③', 'Umbral (Intake)', '✓ OK', '5 pasos: nombre, fecha, motivo, dicotomía, instrucción'],
    ['④', 'Sincronía', '✓ OK', 'Selección de 3 cartas de un mazo de 44'],
    ['⑤', 'Revelación', '⚠ Parcial', '3 etapas kármicas · blur + unlock modal para no-pagadores'],
    ['⑥', 'Anclaje', '✓ OK', 'Síntesis final · decreto · tarea terrenal · email síntesis'],
]
t = Table(flow_data, colWidths=[1*cm, 3.5*cm, 1.8*cm, 9*cm])
t.setStyle(table_style())
story.append(t)
story.append(sp())

story.append(Paragraph("Lo que ya funciona correctamente", styles['subsection']))
ok_items = [
    "Autenticación Supabase (email + magic link + forgot password)",
    "Sistema de créditos completo (deducción, reembolso, saldo en tiempo real)",
    "Stripe Checkout integrado con webhook y verificación post-pago",
    "3 paquetes de créditos: Iniciado $4.99 / Explorador $9.99 / Oráculo $19.99",
    "Referidos con créditos (50cr referidor + 25cr nuevo usuario)",
    "Envío de síntesis por email vía Resend API",
    "Text-to-speech multi-idioma en todo el flujo",
    "Astrología natal integrada (signo + elemento + narrativa)",
    "Profundización por carta (deepening) — flujo pregunta + carta extra",
    "Restauración de estado post-Stripe (sessionStorage snapshot)",
    "Analytics dashboard interno + telemetría básica",
    "PWA instalable en móvil y escritorio",
]
for item in ok_items:
    story.append(Paragraph(f"  ✓  {item}", styles['highlight']))

story.append(sp())
story.append(Paragraph("Bloqueantes críticos antes de lanzar", styles['subsection']))
crit_items = [
    ("CRÍTICO", "Botones DEBUG y BPMN TOOLS visibles para todos los usuarios en producción"),
    ("CRÍTICO", "AnalyticsDashboard y AIPromptPanel accesibles sin autenticación de admin"),
    ("CRÍTICO", "Endpoint /api/reset-test-account expuesto en producción — riesgo de seguridad"),
    ("CRÍTICO", "console.log de inicialización expuesto en producción"),
    ("LEGAL",   "Sin Términos de Servicio ni Política de Privacidad — requerido por Stripe"),
    ("LEGAL",   "Sin banner de cookie consent / aviso GDPR — requerido para audiencia europea"),
    ("UX",      "Uso de alert() nativo del navegador para errores — UX muy pobre"),
    ("UX",      "Sin página de soporte ni contacto para problemas de pago"),
]
for tag, text in crit_items:
    color = RED if tag in ('CRÍTICO', 'LEGAL') else ORANGE
    story.append(Paragraph(f"  [{tag}]  {text}", ParagraphStyle('ci', fontSize=9, textColor=color, leading=14)))

# ─── SECTION 2: ROADMAP ───────────────────────────────────────────────────────
story.append(section_header("2. ROADMAP DE LANZAMIENTO — 4 SPRINTS"))

sprints = [
    {
        'num': 'Sprint 1', 'color': RED, 'label': 'Bloqueantes críticos',
        'period': 'Días 1–3 · ~12h de desarrollo · BLOQUEANTE para lanzar',
        'tasks': [
            'Ocultar DEBUG y BPMN en producción (variable de entorno)',
            'Gate AnalyticsDashboard + AIPromptPanel con UID de admin',
            'Bloquear endpoint reset-test-account en producción',
            'Remover console.log de inicialización',
            'Crear página /terms y /privacy (texto simple)',
            'Banner de cookie consent (librería liviana)',
            'Link a T&C en AuthModal y PurchaseModal',
            'Reemplazar alert() con toast/modal propio',
        ]
    },
    {
        'num': 'Sprint 2', 'color': ORANGE, 'label': 'UX, confianza y pagos',
        'period': 'Días 4–7 · ~16h · Necesario para tráfico frío',
        'tasks': [
            'Landing page mística antes del selector de idioma (pitch + CTA)',
            'Botón "Nueva consulta" al finalizar sin recargar la página',
            'Email de bienvenida automático post-registro con créditos iniciales',
            'Confirmar Stripe en modo producción + URL del webhook activa',
            'Email de confirmación de compra automático',
            'Página /help o botón de contacto (email o WhatsApp)',
        ]
    },
    {
        'num': 'Sprint 3', 'color': BLUE, 'label': 'Motor viral y analytics',
        'period': 'Días 8–12 · ~20h · Necesario para medir tracción',
        'tasks': [
            'Tarjeta compartible de resultado (imagen PNG: cartas + decreto)',
            'Botones de share a Instagram Stories / WhatsApp / X',
            'Optimizar visibilidad del código de referido en la interfaz',
            'Instalar PostHog o GA4 en producción',
            'Definir y configurar los 5 KPIs de tracción',
            'Kit de 5 videos TikTok/Reels para lanzamiento orgánico',
        ]
    },
    {
        'num': 'Sprint 4', 'color': PURPLE, 'label': 'Monetización avanzada',
        'period': 'Día 13+ · Solo si hay tracción validada',
        'tasks': [
            'Suscripción mensual ($9.99/mes = 500 créditos)',
            'Pack regalo (gift card de créditos)',
            'Historial de consultas anteriores por usuario',
            'Notificación mensual de re-engagement por email',
        ]
    },
]

for sprint in sprints:
    data = [[f"{sprint['num']} — {sprint['label']}", sprint['period']]]
    t = Table(data, colWidths=[9*cm, 6.4*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), colors.HexColor('#1a1a2e')),
        ('TEXTCOLOR',    (0,0),(0,0), sprint['color']),
        ('TEXTCOLOR',    (1,0),(1,0), TEXT_SUB),
        ('FONTNAME',     (0,0),(0,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0),(0,0), 10),
        ('FONTSIZE',     (1,0),(1,0), 7),
        ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
        ('TOPPADDING',   (0,0),(-1,-1), 7),
        ('BOTTOMPADDING',(0,0),(-1,-1), 7),
        ('LEFTPADDING',  (0,0),(-1,-1), 10),
    ]))
    story.append(t)
    for task in sprint['tasks']:
        story.append(Paragraph(f"    •  {task}", styles['body']))
    story.append(sp(0.2))

story.append(sp())
story.append(Paragraph("Criterios de tracción para validar MVP", styles['subsection']))
kpi_data = [
    ['KPI', 'Umbral de validación'],
    ['Conversión freemium → pago', '> 3% de usuarios únicos'],
    ['Retención D7', '> 15% de usuarios registrados vuelven en 7 días'],
    ['Completación del flujo', '> 60% de sesiones llegan al anclaje'],
    ['Viral K-factor (referidos)', '> 0.3 (1 de cada 3 usuarios comparte)'],
    ['Ingreso mínimo validado', '$200 USD el primer mes'],
    ['Usuarios activos mes 1', '200 sesiones únicas'],
]
t = Table(kpi_data, colWidths=[7*cm, 8.4*cm])
t.setStyle(table_style())
story.append(t)

story.append(sp())
story.append(Paragraph("Estrategia de lanzamiento con $200 USD", styles['subsection']))
budget_data = [
    ['Acción', 'Costo', 'Canal'],
    ['Comunidad propia: 3 posts/plataforma + grupos WhatsApp/Telegram', '$0', 'Orgánico'],
    ['TikTok orgánico: 5 videos formato "lectura de vidas pasadas con IA"', '$0', 'Viral'],
    ['1 micro-influencer espiritual/tarot (10k–50k seguidores) — canje o pago', '$0–100', 'Influencer'],
    ['Reserva Meta/TikTok Ads si orgánico no despega ($5/día × 20 días)', '$0–100', 'Paid'],
    ['TOTAL INVERSIÓN INICIAL', '$20–220 USD', ''],
]
t = Table(budget_data, colWidths=[9*cm, 2.5*cm, 3.9*cm])
t.setStyle(table_style())
story.append(t)

# ─── SECTION 3: COSTOS Y PROYECCIÓN ──────────────────────────────────────────
story.append(section_header("3. COSTOS OPERATIVOS Y PROYECCIÓN FINANCIERA"))

story.append(Paragraph("Infraestructura mensual", styles['subsection']))
infra_data = [
    ['Servicio', 'Plan', 'Costo/mes', 'Límite gratis', 'Cuándo escala'],
    ['Vercel',   'Hobby', '$0', '100GB bandwidth', '> 100GB → $20/mes'],
    ['Supabase', 'Free',  '$0', '50k MAU · 500MB DB', '> 50k MAU → $25/mes'],
    ['Gemini API','Pay/use','$8–30', 'Sin límite', '~$0.005–0.01 / consulta'],
    ['Stripe',   'Pay/use','2.9%+$0.30', 'Sin mensualidad', 'Solo por transacción exitosa'],
    ['Resend',   'Free',   '$0', '3.000 emails/mes', '> 3k → $20/mes'],
    ['TOTAL mes 1–2', '', '$8–30 USD', 'Escala solo con usuarios', ''],
]
t = Table(infra_data, colWidths=[2.8*cm, 2.2*cm, 2.2*cm, 4.5*cm, 3.7*cm])
t.setStyle(table_style())
story.append(t)
story.append(sp())

story.append(Paragraph("Modelo de ingresos — fuentes actuales", styles['subsection']))
model_data = [
    ['Fuente', 'Mecanismo', 'Ticket', 'Margen neto'],
    ['Iniciado',   '150 créditos one-time', '$4.99 USD', '~$3.50 (70%)'],
    ['Explorador ⭐','400 créditos one-time (el más popular)', '$9.99 USD', '~$6.20 (62%)'],
    ['Oráculo',    '1.100 créditos one-time', '$19.99 USD', '~$14.50 (72%)'],
    ['Referidos',  'No cuesta dinero — solo créditos del sistema', '$0', 'Motor viral gratuito'],
    ['Suscripción (S4)', '$9.99/mes = 500 créditos recurrentes', '$9.99/mes', '~$6.50/mes recurrente'],
]
t = Table(model_data, colWidths=[3.5*cm, 6.5*cm, 2.5*cm, 2.9*cm])
t.setStyle(table_style())
story.append(t)
story.append(sp())

story.append(Paragraph("Proyección financiera — 3 horizontes temporales", styles['subsection']))
proj_data = [
    ['Horizonte', 'Período', 'Usuarios/mes', 'Pagadores/mes', 'Ingresos brutos', 'Costos infra', 'Utilidad neta'],
    ['Corto plazo\n(Validación)',  'Mes 1–3',   '200–500',      '6–30',     '$30–300',      '$15–35',   '$15–265/mes'],
    ['Mediano plazo\n(Crecimiento)','Mes 4–9',   '1.000–3.000',  '50–240',   '$500–2.400',   '$60–120',  '$440–2.280/mes'],
    ['Largo plazo\n(Escala)',      'Mes 10–18', '10.000–40.000','800–4.800','$4.000–19.000','$300–800','$3.200–18.200/mes'],
]
t = Table(proj_data, colWidths=[2.8*cm, 1.8*cm, 2.2*cm, 2.2*cm, 2.5*cm, 2.2*cm, 2.9*cm])
t.setStyle(TableStyle([
    ('BACKGROUND',    (0,0), (-1,0), colors.HexColor('#1a1a2e')),
    ('TEXTCOLOR',     (0,0), (-1,0), GOLD),
    ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',      (0,0), (-1,-1), 7.5),
    ('TEXTCOLOR',     (0,1), (-1,-1), TEXT_MAIN),
    ('TEXTCOLOR',     (-1,1),(-1,-1), GREEN),
    ('FONTNAME',      (-1,1),(-1,-1), 'Helvetica-Bold'),
    ('BACKGROUND',    (0,1), (-1,-1), CARD_BG),
    ('ROWBACKGROUNDS',(0,1), (-1,-1), [CARD_BG, colors.HexColor('#0a0a0a')]),
    ('GRID',          (0,0), (-1,-1), 0.3, colors.HexColor('#222')),
    ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING',    (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING',   (0,0), (-1,-1), 6),
    ('RIGHTPADDING',  (0,0), (-1,-1), 6),
    ('ALIGN',         (2,0), (-1,-1), 'CENTER'),
]))
story.append(t)

story.append(sp())
story.append(Paragraph(
    "Ventaja estructural: Con un margen bruto del 90%+ y costos de infraestructura "
    "cercanos a cero hasta los 50k usuarios, cada dólar captado en los primeros meses "
    "es casi enteramente utilidad. El riesgo principal no es el costo — es la captación "
    "y retención de usuarios.",
    styles['highlight']
))
story.append(sp(0.3))
story.append(Paragraph(
    "Riesgo principal: El costo de Gemini API escala directamente con el uso. "
    "Implementar rate limiting por IP y por usuario en /api/gemini antes de lanzar "
    "a tráfico frío para evitar costos inesperados por bots o uso abusivo.",
    styles['warn']
))

# ─── FOOTER note ──────────────────────────────────────────────────────────────
story.append(sp(1))
story.append(hr(TEXT_SUB, 0.3))
story.append(Paragraph(
    f"ZOLTAR — Oráculo de Vidas Pasadas  ·  Documento confidencial  ·  {date.today().strftime('%d/%m/%Y')}  ·  "
    "Secciones 4 (Plataforma alternativa) y 5 (Comparativa decisión) en documento complementario.",
    styles['small']
))

doc.build(story)
print(f"PDF generado: {OUTPUT}")
