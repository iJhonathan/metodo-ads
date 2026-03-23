/**
 * buildImagePrompt — Genera prompts de alta conversión para Google AI Studio Imagen 4.
 * Usa los datos del branding kit (género, edad, mercado, estilo) para personalizar
 * el sujeto y la escena de cada creativo publicitario de Meta Ads.
 *
 * @param {object} angle       — Ángulo generado por Claude
 * @param {object} project     — Proyecto del usuario
 * @param {object} brandingKit — Branding kit con campos de audiencia
 * @returns {string}           — Prompt listo para Imagen 4
 */

// ── Descripción dinámica del sujeto según audiencia ───────────────────────
function buildSubjectDescription(brandingKit) {
  const generoMap = {
    'Mujeres': 'woman',
    'Hombres': 'man',
    'Todos (mixto)': 'person',
  }
  const genero = generoMap[brandingKit?.genero] || 'person'

  const edad = brandingKit?.edad_desde && brandingKit?.edad_hasta
    ? `${brandingKit.edad_desde}-${brandingKit.edad_hasta} years old`
    : '25-45 years old'

  const mercadoKey = brandingKit?.mercado === 'Otro (especificar)'
    ? 'Otro'
    : brandingKit?.mercado

  const aparienciaMap = {
    'Latinoamérica (América Latina)':
      'Latin American appearance, warm skin tone, relatable to Latino audience',
    'España':
      'Spanish/European appearance, Mediterranean features, relatable to Spanish audience',
    'Estados Unidos (español)':
      'Hispanic American appearance, US Latino look, relatable to US Hispanic audience',
    'Europa hispanohablante':
      'European Hispanic appearance, relatable to European Spanish-speaking audience',
    'Global hispanohablante':
      'neutral appearance, universally relatable to any Spanish-speaking audience worldwide',
    'Otro':
      `appearance relatable to ${brandingKit?.mercado_personalizado || 'Spanish-speaking audience'}`,
  }

  const apariencia = aparienciaMap[mercadoKey] ||
    'neutral appearance, relatable to Spanish-speaking audience'

  return `${genero}, ${edad}, ${apariencia}`
}

// ── Escena y expresión según tipo de ángulo ──────────────────────────────
const ANGLE_SCENE = {
  dolor:         'frustrated expression, hands on head, overwhelmed body language, messy dark home office, dramatic moody lighting',
  curiosidad:    'surprised and curious expression, leaning forward, wide eyes, pointing gesture, bright engaging studio lighting',
  resultado:     'confident and successful expression, celebrating, modern office with multiple screens showing upward graphs and earnings dashboard, warm bright cinematic lighting',
  objecion:      'assertive and confident expression, arms opening empoweringly, direct eye contact, clean professional background, strong authoritative lighting',
  miedo:         'worried and anxious expression, looking nervously at a screen, dramatic dark moody lighting, tension in face and body, red accent glow in background',
  transformacion:'dynamic transformation energy, confident and empowered expression, dramatic contrast visual showing before/after change, powerful cinematic lighting',
  urgencia:      'energetic rushing expression, leaning forward with urgency, red and orange accent elements surrounding them, high-energy motion composition',
  comparacion:   'thoughtful comparing expression, hands gesturing between two options, confident evaluating pose, clean split background, balanced studio lighting',
  testimonio:    'genuine happy and satisfied expression, natural authentic smile, looking at camera with trust and gratitude, warm lifestyle setting, natural golden lighting',
  educativo:     'engaging and knowledgeable expression, explaining with both hands gesturing, professional confident posture, educational setting with data visible behind them',
  provocacion:   'bold and challenging expression, direct provocative gaze, leaning slightly forward, dark dramatic background, cinematic neon accent lights',
  identidad:     'proud and strong identity expression, powerful direct gaze at camera, self-assured posture, inspirational aspirational lighting',
  garantia:      'trustworthy and confident expression, open-hand assuring gesture, professional clean background, strong reliability-communicating lighting',
  precio:        'excited and pleasantly surprised expression, happy deal-finding gesture, energetic bright background, vibrant commercial advertising lighting',
  exclusividad:  'sophisticated and exclusive expression, premium confident demeanor, luxury modern environment with gold and purple accents, cinematic premium lighting',
  social_proof:  'proud and satisfied expression showing results, natural authentic smile, lifestyle background suggesting community and success',
  novedad:       'excited early-adopter expression, revealing or discovering something new with wonder, modern tech environment, bright innovative lighting',
  aspiracional:  'visionary and aspirational expression, achieving dream lifestyle, luxury modern environment, confident forward-looking gaze, golden hour premium cinematic lighting',
  humor:         'playful and funny exaggerated expression, comedic over-the-top reaction, bright colorful energetic background, fun light-hearted commercial lighting',
  autoridad:     'commanding expert authority expression, strong professional presence, crossed arms or open expert gesture, dark premium background, power lighting that emphasizes expertise',
}

// ── Estilo de fondo según branding.estilo ────────────────────────────────
const STYLE_BG = {
  agresivo:    'dark dramatic background with deep purple and electric blue neon accent lights, high-energy cinematic color grade, smoke or haze effects, bold deep shadows',
  moderno:     'clean modern gradient background (dark navy to near-black), minimal geometric elements, professional sleek atmosphere, subtle blue accent glow',
  minimalista: 'clean white or very light gray background, minimal design elements, strong focus on typography and subject, crisp professional look, subtle soft shadows only',
  elegante:    'luxury dark background with gold and deep purple accent elements, sophisticated premium atmosphere, soft bokeh background lights, elegant cinematic color grade',
  vintage:     'warm vintage-toned background, retro grain texture, warm amber and sepia accents, nostalgic film-look color grade, warm cinematic atmosphere',
  bold:        'vibrant and bold colorful background, high-saturation complementary colors, dynamic graphic design elements, high-energy commercial style',
  corporativo: 'professional corporate environment background, clean office setting, trustworthy blue and gray tones, business-formal serious atmosphere',
  lifestyle:   'warm natural authentic lifestyle setting, home or outdoor environment, warm golden natural light, relatable everyday authentic scene',
}

// ── Composiciones rotativas ───────────────────────────────────────────────
const COMPOSITIONS = [
  'Subject on left third of frame, bold text block on right third, strong visual hierarchy, dark gradient on right side for text legibility',
  'Subject centered in frame, bold headline text integrated at top 20%, supporting subtext at bottom 20%, rule of thirds composition',
  'Dynamic diagonal composition, subject angled toward text area, text naturally integrated into negative space on opposite side',
  'Breaking news style layout, subject in broadcast frame, bold informational bar at bottom with headline, authoritative composition',
  'Split visual concept, dramatic contrast between two halves of the image, subject on dominant side, supporting elements on other',
]

export function buildImagePrompt(angle, project, brandingKit) {
  const tipo = angle?.tipo || 'dolor'
  const headline = angle?.texto_imagen || angle?.headline || ''
  const copy = angle?.titulo || angle?.copy || ''

  const producto = project?.producto || project?.nombre || 'product'
  const generoLabel = brandingKit?.genero || 'Todos (mixto)'
  const edadLabel = brandingKit?.edad_desde && brandingKit?.edad_hasta
    ? `${brandingKit.edad_desde} a ${brandingKit.edad_hasta} años`
    : '25 a 45 años'
  const mercadoLabel = brandingKit?.mercado === 'Otro (especificar)'
    ? (brandingKit?.mercado_personalizado || 'Mercado personalizado')
    : (brandingKit?.mercado || 'Latinoamérica (América Latina)')
  const publicoDesc = brandingKit?.publico_detallado || ''
  const coloresHex = brandingKit?.colores?.join(', ') || '#7c3aed'
  const estiloLabel = brandingKit?.estilo || 'agresivo'
  const tonoLabel = brandingKit?.tono || 'directo y urgente'

  const subject = buildSubjectDescription(brandingKit)
  const scene = ANGLE_SCENE[tipo] || ANGLE_SCENE.dolor
  const bgStyle = STYLE_BG[estiloLabel] || STYLE_BG.agresivo

  // Composición basada en combinación tipo+headline para variedad
  const compIndex = Math.abs((tipo.charCodeAt(0) || 0) + (headline.charCodeAt(0) || 0)) % COMPOSITIONS.length
  const composition = COMPOSITIONS[compIndex]

  // Elementos visuales adicionales por tipo
  const VISUAL_EXTRAS = {
    dolor:        'stress and overwhelm symbols, dark oppressive visual elements',
    resultado:    'earnings dashboard on screen, upward trend charts, success metrics and income numbers visible',
    urgencia:     'countdown or clock visual elements, red urgency color accents, rushing motion energy',
    precio:       'price tag or bold percentage discount badge, value arrow indicators',
    garantia:     'shield or checkmark seal badge in corner, trust certification visual element',
    exclusividad: 'VIP badge or crown element, exclusive premium membership feel',
    social_proof: 'star rating graphic overlay, testimonial style layout, community success elements',
    novedad:      '"NUEVO" or "NUEVO" badge/ribbon element, sparkle or shine effects, innovation symbols',
    transformacion: 'before/after transformation arrow visual, strong contrast between two states',
  }
  const visualExtra = VISUAL_EXTRAS[tipo] ? `\n- ${VISUAL_EXTRAS[tipo]}` : ''

  const prompt = `Create a high-conversion Meta Ads creative (Facebook/Instagram advertisement) with the following exact specifications:

FORMAT: Square 1080x1080px, bold graphic design, professional advertising photography style

PRODUCT: ${producto}
TARGET AUDIENCE GENDER: ${generoLabel}
TARGET AUDIENCE AGE: ${edadLabel}
TARGET MARKET: ${mercadoLabel}
${publicoDesc ? `AUDIENCE DESCRIPTION: ${publicoDesc.slice(0, 300)}` : ''}

MANDATORY TEXT ON IMAGE (ALL TEXT IN SPANISH - NO EXCEPTIONS):
- MAIN HEADLINE (large, bold, white or bright yellow, thick dark shadow/stroke for maximum contrast): "${headline}"
- SUPPORTING TEXT (smaller, white, readable, subtle shadow): "${copy}"
- All text must be high-contrast, clearly legible, and professionally integrated into the design
- The bottom 35% of the image must be naturally darker to guarantee text readability

MAIN SUBJECT: ${subject}
EXPRESSION AND BODY LANGUAGE: ${scene}

VISUAL DESIGN ELEMENTS:
- Brand accent colors: ${coloresHex} — use these as accent colors in badges, borders, and design elements
- Visual metaphors and elements related to: ${producto}
- Bold graphic design elements: arrows, accent borders, graphic frames${visualExtra}
- Small credibility badge in corner ("NUEVO", "PROBADO", checkmark seal, or stars)
- Subtle colored accent lights matching scene mood

BACKGROUND AND SCENE:
- ${bgStyle}
- Must feel high-energy and scroll-stopping for social media feed

COMPOSITION:
- ${composition}
- Strong visual hierarchy: headline → subject → subtext → badge
- Optimized for Instagram/Facebook feed stop-scrolling impact

COMMUNICATION STYLE: ${tonoLabel}
VISUAL STYLE: ${estiloLabel}

LIGHTING: Dramatic cinematic lighting, strong rim light on subject, colored accent lights matching brand palette, dark moody ambient where appropriate for the style

QUALITY REQUIREMENTS:
- Ultra-realistic photography style, 8K resolution equivalent
- Sharp focus on subject face and upper body
- Vivid saturated colors, high contrast
- NO watermarks, NO blurry elements, NO generic stock photo feel
- NO text artifacts outside designated text areas
- Professional Meta Ads campaign quality

LANGUAGE REMINDER: Every single piece of visible text in the image MUST be in Spanish. Headlines, subtext, badges, labels, bars — everything in Spanish without exception.

STYLE REFERENCE: Top-performing Meta Ads creatives from high-converting ${mercadoLabel} digital marketing campaigns — bold, direct, high-energy, emotionally powerful, conversion-optimized.`

  console.log('[buildImagePrompt] tipo:', tipo, '| estilo:', estiloLabel, '| mercado:', mercadoLabel, '| sujeto:', subject)
  console.log('[buildImagePrompt] PROMPT:\n', prompt)

  return prompt
}
