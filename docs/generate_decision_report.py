from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import date

OUTPUT = "/Users/inacap/Documents/Zoltar/docs/ZOLTAR_Decision_Roadmap.pdf"

GOLD   = colors.HexColor('#C9A84C')
DARK   = colors.HexColor('#0F0F1A')
CARD   = colors.HexColor('#111111')
TMAIN  = colors.HexColor('#D1D5DB')
TSUB   = colors.HexColor('#6B7280')
RED    = colors.HexColor('#F87171')
ORANGE = colors.HexColor('#FB923C')
BLUE   = colors.HexColor('#A5B4FC')
GREEN  = colors.HexColor('#4ADE80')
PURPLE = colors.HexColor('#C084FC')
YELLOW = colors.HexColor('#FBF24A')
WHITE  = colors.white
INDIGO = colors.HexColor('#312E81')
DBLUE  = colors.HexColor('#1A1A2E')
VIOLET = colors.HexColor('#7C3AED')

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
    'red':         S('rd',  fontSize=8.5, textColor=RED, leading=13, fontName='Helvetica-Bold'),
    'blue':        S('bl',  fontSize=8.5, textColor=BLUE, leading=13),
    'purple':      S('pu',  fontSize=8.5, textColor=PURPLE, leading=13),
    'gold':        S('go',  fontSize=8.5, textColor=GOLD, leading=13, fontName='Helvetica-Bold'),
    'center':      S('cen', fontSize=8.5, textColor=TMAIN, alignment=TA_CENTER, leading=13),
    'big_center':  S('bc',  fontSize=18, textColor=GOLD, alignment=TA_CENTER, leading=24, fontName='Helvetica-Bold'),
    'northstar':   S('ns',  fontSize=9,  textColor=BLUE, leading=14, alignment=TA_CENTER),
}

def hr(color=GOLD, t=0.5): return HRFlowable(width='100%', thickness=t, color=color, spaceAfter=6, spaceBefore=6)
def sp(h=0.3): return Spacer(1, h * cm)

def section(text):
    return KeepTogether([sp(0.3), Paragraph(text, sty['section']), hr()])

def tbl(data, widths, highlight_last=False, highlight_col=None):
    t = Table(data, colWidths=widths)
    cmds = [
        ('BACKGROUND',    (0,0),(-1,0), DBLUE),
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
    if highlight_last:
        cmds += [
            ('BACKGROUND', (0,-1),(-1,-1), colors.HexColor('#0a1a0a')),
            ('TEXTCOLOR',  (0,-1),(-1,-1), GREEN),
            ('FONTNAME',   (0,-1),(-1,-1), 'Helvetica-Bold'),
        ]
    t.setStyle(TableStyle(cmds))
    return t

def gantt_bar(label, start_pct, width_pct, color, text=''):
    total_width = 15.4 * cm
    label_w = 3.8 * cm
    track_w = total_width - label_w
    bar_offset = track_w * start_pct / 100
    bar_width = track_w * width_pct / 100

    label_cell = Paragraph(label, S('gl', fontSize=7, textColor=TSUB, alignment=1))

    inner = Table(
        [[Paragraph(text, S('gt', fontSize=6, textColor=WHITE, fontName='Helvetica-Bold'))]],
        colWidths=[bar_width]
    )
    inner.setStyle(TableStyle([
        ('BACKGROUND', (0,0),(-1,-1), color),
        ('TOPPADDING', (0,0),(-1,-1), 3),
        ('BOTTOMPADDING', (0,0),(-1,-1), 3),
        ('LEFTPADDING', (0,0),(-1,-1), 4),
        ('RIGHTPADDING', (0,0),(-1,-1), 4),
    ]))

    spacer_left  = Spacer(bar_offset, 1) if bar_offset > 0 else None
    spacer_right = Spacer(track_w - bar_offset - bar_width, 1) if (track_w - bar_offset - bar_width) > 0 else None

    cells = []
    if spacer_left:  cells.append(spacer_left)
    cells.append(inner)
    if spacer_right: cells.append(spacer_right)

    track = Table([[c for c in cells]], colWidths=[
        bar_offset if bar_offset > 0 else None,
        bar_width,
        (track_w - bar_offset - bar_width) if (track_w - bar_offset - bar_width) > 0 else None
    ])
    track.setStyle(TableStyle([
        ('BACKGROUND', (0,0),(-1,-1), colors.HexColor('#111')),
        ('TOPPADDING', (0,0),(-1,-1), 0),
        ('BOTTOMPADDING', (0,0),(-1,-1), 0),
        ('LEFTPADDING', (0,0),(-1,-1), 0),
        ('RIGHTPADDING', (0,0),(-1,-1), 0),
    ]))
    return [label_cell, track]

doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
    leftMargin=1.8*cm, rightMargin=1.8*cm, topMargin=2*cm, bottomMargin=2*cm)

story = []

# ── COVER ──────────────────────────────────────────────────────────────────────
story += [
    sp(2),
    Paragraph("ZOLTAR", sty['cover_title']),
    sp(0.2),
    Paragraph("Comparativa de Decisión · Roadmap Integrado · Northstar 18 meses", sty['cover_sub']),
    sp(0.4),
    hr(GOLD, 1),
    sp(0.3),
    Paragraph("Documento 3 de 3  ·  Complementa MVP Report y Plataforma Report", sty['cover_sub']),
    sp(0.4),
    Paragraph(f"Preparado: {date.today().strftime('%d de %B de %Y')}  ·  Confidencial", sty['cover_date']),
    sp(1.5),
]

cover_data = [
    ['ZOLTAR primero', '→ Plataforma', '18 meses', '$0', '$15k–25k/mes'],
    ['Secuencia óptima', 'Enganche → Ecosystem', 'Horizonte', 'Inversión externa', 'Potencial mes 18'],
]
ct = Table(cover_data, colWidths=[3.2*cm]*5)
ct.setStyle(TableStyle([
    ('BACKGROUND',   (0,0),(-1,0), DBLUE),
    ('BACKGROUND',   (0,1),(-1,1), CARD),
    ('TEXTCOLOR',    (0,0),(-1,0), GOLD),
    ('TEXTCOLOR',    (0,1),(-1,1), TSUB),
    ('FONTNAME',     (0,0),(-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',     (0,0),(-1,0), 10),
    ('FONTSIZE',     (0,1),(-1,1), 7),
    ('ALIGN',        (0,0),(-1,-1), 'CENTER'),
    ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
    ('TOPPADDING',   (0,0),(-1,-1), 8),
    ('BOTTOMPADDING',(0,0),(-1,-1), 8),
    ('GRID',         (0,0),(-1,-1), 0.3, colors.HexColor('#333')),
]))
story += [ct, sp(0.5)]

# ── 1. MATRIZ ─────────────────────────────────────────────────────────────────
story.append(section("1. MATRIZ DE DECISIÓN"))

matrix = [
    ['Criterio', 'ZOLTAR MVP solo', 'Plataforma sola', 'ZOLTAR → Plataforma ⭐'],
    ['Tiempo al primer ingreso', '1–2 semanas', '4–6 meses', '1–2 semanas'],
    ['Inversión inicial', '$20–220 USD', '$5.000–15.000+ USD', '$20–220 USD (etapa 1)'],
    ['Riesgo de construir sin validar', 'Bajo — casi listo', 'Muy alto — sin datos', 'Bajo — ZOLTAR valida'],
    ['Complejidad técnica', 'Baja — 80% construido', 'Muy alta — nuevo', 'Alta pero secuencial'],
    ['Potencial a 12 meses', '$800–3.000/mes', 'Incierto', '$5.000–15.000/mes'],
    ['Motor de captación lectoras', 'No aplica', 'Sin prueba del producto', 'ZOLTAR demuestra el valor'],
    ['Aprendizaje del mercado', 'Parcial', 'Ninguno sin datos reales', 'Total — datos antes de construir'],
    ['Financiamiento del desarrollo', 'No aplica', 'Requiere capital externo', 'ZOLTAR financia la plataforma'],
]
t = Table(matrix, colWidths=[4.5*cm, 3.2*cm, 3.2*cm, 4.5*cm])
t.setStyle(TableStyle([
    ('BACKGROUND',    (0,0),(-1,0), DBLUE),
    ('TEXTCOLOR',     (0,0),(-1,0), GOLD),
    ('FONTNAME',      (0,0),(-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',      (0,0),(-1,-1), 7.5),
    ('TEXTCOLOR',     (0,1),(-1,-1), TMAIN),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [CARD, colors.HexColor('#0a0a0a')]),
    ('TEXTCOLOR',     (3,1),(3,-1), GREEN),
    ('FONTNAME',      (3,1),(3,-1), 'Helvetica-Bold'),
    ('GRID',          (0,0),(-1,-1), 0.3, colors.HexColor('#222')),
    ('VALIGN',        (0,0),(-1,-1), 'TOP'),
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('BACKGROUND',    (3,0),(3,0), colors.HexColor('#052e16')),
]))
story.append(t)

story.append(sp(0.3))
story.append(Paragraph(
    "Veredicto: La secuencia ZOLTAR → Plataforma es la única que genera ingresos desde el mes 1, "
    "valida el mercado con datos reales antes de una inversión mayor, y usa los ingresos de "
    "ZOLTAR para financiar el desarrollo de la plataforma sin capital externo. "
    "ZOLTAR no es solo el enganche — es el laboratorio de validación.",
    sty['green']))

# ── 2. GANTT ──────────────────────────────────────────────────────────────────
story.append(section("2. ROADMAP INTEGRADO — 18 MESES"))

month_headers = [['', 'M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12','M13','M14','M15','M16','M17','M18']]
mh = Table(month_headers, colWidths=[3.8*cm] + [0.855*cm]*18)
mh.setStyle(TableStyle([
    ('FONTSIZE',      (0,0),(-1,-1), 6),
    ('TEXTCOLOR',     (0,0),(-1,-1), TSUB),
    ('ALIGN',         (0,0),(-1,-1), 'CENTER'),
    ('TOPPADDING',    (0,0),(-1,-1), 2),
    ('BOTTOMPADDING', (0,0),(-1,-1), 2),
    ('BACKGROUND',    (0,0),(-1,-1), colors.HexColor('#0a0a0a')),
    ('GRID',          (1,0),(-1,-1), 0.3, colors.HexColor('#1f2937')),
]))
story.append(mh)

def gantt_row(label, start, length, color, label_color=None, text=''):
    cells = [''] * 18
    for i in range(start-1, min(start-1+length, 18)):
        cells[i] = text if i == start-1 else ''
    row = [label] + cells
    widths = [3.8*cm] + [0.855*cm]*18
    t = Table([row], colWidths=widths)
    cmds = [
        ('FONTSIZE',      (0,0),(-1,-1), 6.5),
        ('TEXTCOLOR',     (0,0),(0,0), label_color or TSUB),
        ('ALIGN',         (0,0),(0,0), 'RIGHT'),
        ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0),(-1,-1), 2),
        ('BOTTOMPADDING', (0,0),(-1,-1), 2),
        ('LEFTPADDING',   (0,0),(-1,-1), 3),
        ('RIGHTPADDING',  (0,0),(-1,-1), 3),
        ('BACKGROUND',    (0,0),(-1,-1), colors.HexColor('#0a0a0a')),
        ('GRID',          (1,0),(-1,-1), 0.3, colors.HexColor('#1f2937')),
    ]
    for i in range(start-1, min(start-1+length, 18)):
        cmds.append(('BACKGROUND', (i+1,0), (i+1,0), color))
        cmds.append(('TEXTCOLOR',  (i+1,0), (i+1,0), WHITE))
        cmds.append(('FONTNAME',   (i+1,0), (i+1,0), 'Helvetica-Bold'))
    t.setStyle(TableStyle(cmds))
    return t

story.append(gantt_row('Fix críticos S1–S2',         1, 1, colors.HexColor('#ef4444'), RED, 'Fix'))
story.append(gantt_row('Sprint 3 viral + analytics',  2, 1, colors.HexColor('#f97316'), ORANGE, 'Viral'))
story.append(gantt_row('ZOLTAR live + validación',    2, 3, colors.HexColor('#eab308'), GOLD, 'Lanzamiento · KPIs'))
story.append(gantt_row('Sprint 4 suscripción',        4, 2, colors.HexColor('#8b5cf6'), PURPLE, 'Subs.'))
story.append(gantt_row('Plataforma — Diseño+DB',      5, 3, colors.HexColor('#6d28d9'), PURPLE, 'Diseño'))
story.append(gantt_row('Plataforma — Portal lectora', 7, 4, colors.HexColor('#7c3aed'), PURPLE, 'Portal lectora'))
story.append(gantt_row('Plataforma — Stripe Connect', 9, 2, colors.HexColor('#4f46e5'), BLUE, 'Pagos'))
story.append(gantt_row('Plataforma — Voz + viral kit',10, 3, colors.HexColor('#3730a3'), BLUE, 'ElevenLabs'))
story.append(gantt_row('Beta privada 20 lectoras',   12, 2, colors.HexColor('#059669'), GREEN, 'Beta'))
story.append(gantt_row('Plataforma pública',          13, 6, colors.HexColor('#10b981'), GREEN, 'Lanzamiento plataforma'))

# ── 3. PROYECCION INGRESOS ────────────────────────────────────────────────────
story.append(section("3. PROYECCIÓN DE INGRESOS COMBINADA"))

proj = [
    ['Período', 'Fase', 'Fuente principal', 'Ingresos brutos', 'Costos infra', 'Utilidad neta'],
    ['Mes 1–2',   'Pre-lanzamiento',      'Ninguna (desarrollo)',         '$0',              '$22–37',   '-$22–37'],
    ['Mes 3–4',   'ZOLTAR validación',    'Créditos one-time ZOLTAR',     '$150–600',        '$25–40',   '$110–560'],
    ['Mes 5–7',   'ZOLTAR crecimiento',   'Créditos + suscripción',       '$600–2.500',      '$30–60',   '$540–2.440'],
    ['Mes 8–11',  'Beta plataforma',      'ZOLTAR + 20 lectoras beta',    '$2.500–6.000',    '$80–180',  '$2.320–5.820'],
    ['Mes 12–18', 'Plataforma pública',   'ZOLTAR + 100+ lectoras',       '$6.000–20.000',   '$200–600', '$5.800–19.400'],
]
t = Table(proj, colWidths=[1.8*cm, 3*cm, 4*cm, 2.5*cm, 2.2*cm, 2.5*cm])
t.setStyle(TableStyle([
    ('BACKGROUND',    (0,0),(-1,0), DBLUE),
    ('TEXTCOLOR',     (0,0),(-1,0), GOLD),
    ('FONTNAME',      (0,0),(-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',      (0,0),(-1,-1), 7.5),
    ('TEXTCOLOR',     (0,1),(-1,-1), TMAIN),
    ('TEXTCOLOR',     (-1,1),(-1,-1), GREEN),
    ('FONTNAME',      (-1,1),(-1,-1), 'Helvetica-Bold'),
    ('TEXTCOLOR',     (-1,1),(-1,1), RED),
    ('ROWBACKGROUNDS',(0,1),(-1,-1), [CARD, colors.HexColor('#0a0a0a')]),
    ('GRID',          (0,0),(-1,-1), 0.3, colors.HexColor('#222')),
    ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ('TOPPADDING',    (0,0),(-1,-1), 5),
    ('BOTTOMPADDING', (0,0),(-1,-1), 5),
    ('LEFTPADDING',   (0,0),(-1,-1), 6),
    ('RIGHTPADDING',  (0,0),(-1,-1), 6),
    ('BACKGROUND',    (0,-1),(-1,-1), colors.HexColor('#0a1a0a')),
    ('TEXTCOLOR',     (0,-1),(-1,-1), GREEN),
    ('FONTNAME',      (0,-1),(-1,-1), 'Helvetica-Bold'),
]))
story.append(t)

# ── 4. RIESGOS ────────────────────────────────────────────────────────────────
story.append(section("4. RIESGOS PRINCIPALES Y MITIGACIONES"))

risks = [
    ['Riesgo', 'Prob.', 'Impacto', 'Mitigación'],
    ['ZOLTAR no convierte — demanda insuficiente',
     'Media', 'Alto',
     'Medir los 6 KPIs al mes 2. Si no se alcanza el umbral mínimo, pivotar el mensaje o el modelo freemium antes de construir la plataforma.'],
    ['Lectoras no se registran en la plataforma',
     'Media', 'Medio',
     'Hacer beta privada con 5–10 lectoras conocidas antes de abrir públicamente. Su feedback define el MVP real de la plataforma.'],
    ['Costo ElevenLabs escala sin control',
     'Baja', 'Medio',
     'Rate limiting por lectora + caché de audio para frases repetidas + límite de caracteres incluidos por plan.'],
    ['Problema de copyright con decks subidos',
     'Media', 'Alto',
     'Lanzar solo con Rider-Waite (dominio público). Uploads propios solo con declaración de derechos y sistema DMCA activo.'],
    ['Lectoras cobran precios muy bajos → comisión insignificante',
     'Media', 'Medio',
     'Precio mínimo de $5 USD por lectura. La suscripción mensual es la fuente de ingreso estable — no la comisión variable.'],
    ['Competencia copia el modelo rápidamente',
     'Baja', 'Medio',
     'La red de lectoras + sus decks propios + sus audiencias es imposible de replicar sin años de crecimiento orgánico. Ventaja defensible.'],
]
story.append(tbl(risks, [4.5*cm, 1.5*cm, 1.5*cm, 7.9*cm]))

# ── 5. NORTHSTAR ──────────────────────────────────────────────────────────────
story.append(section("5. VISIÓN NORTHSTAR — 18 MESES"))

story.append(Paragraph(
    "La plataforma de oráculos digitales más grande en español",
    sty['big_center']))
story.append(sp(0.3))

ns_data = [
    ['200+ lectoras\nactivas', '5.000+\nclientes/mes', '$15k–25k USD\nen ingresos/mes', '$0\ninversión externa'],
    ['En 10+ países\n(LATAM + España)', 'Comunidad activa\ncon historial', 'ZOLTAR + plataforma\ncombinados', 'Autofinanciado\ndesde mes 3'],
]
nt = Table(ns_data, colWidths=[3.85*cm]*4)
nt.setStyle(TableStyle([
    ('BACKGROUND',    (0,0),(-1,0), DBLUE),
    ('BACKGROUND',    (0,1),(-1,1), CARD),
    ('TEXTCOLOR',     (0,0),(-1,0), GOLD),
    ('TEXTCOLOR',     (0,1),(-1,1), TSUB),
    ('FONTNAME',      (0,0),(-1,0), 'Helvetica-Bold'),
    ('FONTSIZE',      (0,0),(-1,0), 12),
    ('FONTSIZE',      (0,1),(-1,1), 7.5),
    ('ALIGN',         (0,0),(-1,-1), 'CENTER'),
    ('VALIGN',        (0,0),(-1,-1), 'MIDDLE'),
    ('TOPPADDING',    (0,0),(-1,-1), 10),
    ('BOTTOMPADDING', (0,0),(-1,-1), 10),
    ('GRID',          (0,0),(-1,-1), 0.3, colors.HexColor('#333')),
]))
story.append(nt)
story.append(sp(0.3))
story.append(Paragraph(
    "Cada lectora es un canal de marketing independiente. Su audiencia es tráfico orgánico gratuito. "
    "ZOLTAR sigue siendo la puerta de entrada — el demo siempre disponible, siempre gratuito, "
    "siempre atrayendo nuevas lectoras y nuevos clientes.",
    sty['northstar']))

# ── 6. PROXIMOS PASOS ─────────────────────────────────────────────────────────
story.append(section("6. PRÓXIMOS PASOS CONCRETOS"))

story.append(Paragraph("Esta semana — ZOLTAR (Sprints 1 y 2)", sty['subsection']))
zoltar_tasks = [
    ['Tarea', 'Tiempo estimado', 'Prioridad'],
    ['Ocultar botones DEBUG y BPMN con variable de entorno NODE_ENV', '~2h', 'CRÍTICO'],
    ['Bloquear endpoint /api/reset-test-account en producción', '~30min', 'CRÍTICO'],
    ['Gate AnalyticsDashboard y AIPromptPanel con UID de admin', '~1h', 'CRÍTICO'],
    ['Remover console.log("=== ZOLTAR INITIALIZING ===")', '~15min', 'CRÍTICO'],
    ['Crear páginas /terms y /privacy con texto mínimo legal', '~2h', 'LEGAL'],
    ['Instalar banner de cookie consent (librería liviana)', '~1h', 'LEGAL'],
    ['Agregar link a T&C en AuthModal y PurchaseModal', '~30min', 'LEGAL'],
    ['Reemplazar alert() nativos con toast/modal propio', '~2h', 'UX'],
    ['Confirmar Stripe en modo producción + URL webhook activa', '~1h', 'PAGO'],
    ['Landing page mística antes del selector de idioma', '~3h', 'UX'],
    ['Botón "Nueva consulta" sin recargar la página', '~1h', 'UX'],
    ['Instalar PostHog o GA4 para analytics reales', '~1h', 'ANALYTICS'],
]
story.append(tbl(zoltar_tasks, [9*cm, 2.5*cm, 2.5*cm]))

story.append(sp(0.3))
story.append(Paragraph("Este mes — Preparación de la plataforma", sty['subsection']))
platform_tasks = [
    ['Tarea', 'Tipo', 'Por qué es urgente'],
    ['Identificar 5–10 lectoras conocidas para beta privada', 'Outreach', 'Su feedback define el MVP real de la plataforma'],
    ['Entrevistarlas: precio, plataforma actual, necesidades, dolores', 'Research', 'Evita construir funcionalidades que nadie necesita'],
    ['Crear cuenta Stripe Connect en modo test', 'Infraestructura', 'Demora hasta 3 días hábiles la aprobación de Stripe'],
    ['Crear cuenta ElevenLabs Creator ($22/mes)', 'Infraestructura', 'Necesaria para validar flujo de clonación de voz en beta'],
    ['Diseñar el schema de base de datos para perfiles de lectoras', 'Diseño técnico', 'Decisión crítica que afecta toda la arquitectura futura'],
    ['Definir nombre y dominio de la plataforma (diferente a ZOLTAR)', 'Marca', 'El dominio puede tardar días en propagarse'],
    ['Crear cuenta Cloudinary para storage de imágenes de cartas', 'Infraestructura', 'Necesario para testear el flujo de upload de decks'],
]
story.append(tbl(platform_tasks, [5.5*cm, 2.5*cm, 7.4*cm]))

# ── FOOTER ────────────────────────────────────────────────────────────────────
story += [
    sp(1),
    hr(TSUB, 0.3),
    Paragraph(
        f"ZOLTAR — Comparativa de Decisión y Roadmap Integrado  ·  Documento confidencial  ·  "
        f"{date.today().strftime('%d/%m/%Y')}  ·  "
        "Documento 3 de 3. Ver también: ZOLTAR_MVP_Report.pdf y ZOLTAR_Plataforma_Report.pdf",
        sty['small']),
]

doc.build(story)
print(f"PDF generado: {OUTPUT}")
