/**
 * buildImagePrompt — Genera prompts de alta conversión para Google AI Studio Imagen 4.
 * Cada prompt está diseñado para producir creativos publicitarios de Meta Ads profesionales.
 *
 * @param {object} angle      — Ángulo generado por Claude (tipo, texto_imagen, titulo, cta, imagen_concepto)
 * @param {object} project    — Proyecto del usuario (producto, publico, propuesta_valor, nombre)
 * @param {object} brandingKit — Branding kit del proyecto (estilo, tono, colores, publico_detallado)
 * @returns {string}          — Prompt listo para enviar a Imagen 4
 */
export function buildImagePrompt(angle, project, brandingKit) {
  const tipo = angle?.tipo || 'dolor'
  const headline = angle?.texto_imagen || angle?.headline || ''
  const copy = angle?.titulo || angle?.copy || ''
  const visualConcept = angle?.imagen_concepto || angle?.visual_sugerido || ''

  const producto = project?.producto || project?.nombre || 'product'
  const publico = project?.publico || project?.publicoObjetivo || brandingKit?.publico_detallado || 'adults 25-45'

  // Default branding si no hay kit
  const estilo = brandingKit?.estilo || 'agresivo'

  // ── Expresión y escena según ángulo de venta ──────────────────────────────
  const ANGLE_SCENE = {
    dolor: 'frustrated Latin American person, 28-38 years old, hands on head, overwhelmed expression, looking directly at camera, messy dark home office background, dramatic moody lighting',
    curiosidad: 'surprised and curious Latin American person, 25-35 years old, leaning forward with wide eyes and pointing gesture, bright engaging expression, slightly dramatic studio lighting',
    resultado: 'confident and successful Latin American professional, 30-40 years old, standing proud, modern office with multiple screens showing graphs going up, celebratory expression, bright cinematic lighting',
    objecion: 'assertive Latin American person, 28-38 years old, arms crossing then opening confidently, direct eye contact with camera, clean professional background, strong authoritative lighting',
    miedo: 'worried Latin American person, 28-40 years old, looking anxiously at a screen, dramatic dark moody lighting, tension in face and body, dark home office with subtle red accent glow',
    transformacion: 'dynamic before-and-after concept: split visual showing dramatic change, Latin American person 30-40 years old, confident on the right side, dramatic contrast between dark/stressed left and bright/successful right',
    urgencia: 'Latin American person rushing forward urgently, 25-38 years old, energetic pose, red and orange accent elements, clock or timer visual metaphor in background, high-energy dramatic composition',
    comparacion: 'Latin American professional, 28-40 years old, gesturing between two options, confident comparison pose, clean split background showing contrast, balanced studio lighting',
    testimonio: 'smiling and satisfied Latin American person, 28-45 years old, authentic natural expression, looking at camera with trust, warm home or office background, natural cinematic lighting',
    educativo: 'engaging Latin American presenter/teacher, 28-40 years old, explaining with hands gesturing, whiteboard or screen with data behind them, professional confident stance, bright educational setting',
    provocacion: 'bold and provocative Latin American person, 25-38 years old, challenging look at camera, leaning slightly forward, dark dramatic background, cinematic neon accent lights',
    identidad: 'proud and confident Latin American person, 28-40 years old, strong identity pose, cultural elements subtly present, powerful direct gaze, dramatic aspirational lighting',
    garantia: 'trustworthy Latin American professional, 30-45 years old, confident open-hand gesture, clean professional background, strong trustworthy expression, bright professional lighting',
    precio: 'excited Latin American person, 25-38 years old, surprised happy expression at seeing a deal, hand gesture indicating price/value, bright energetic background, vibrant commercial lighting',
    exclusividad: 'sophisticated Latin American professional, 30-45 years old, premium luxury environment, exclusive confident demeanor, elegant dark background with gold/purple accents, cinematic premium lighting',
    social_proof: 'group of satisfied Latin American people, 25-45 years old, celebrating success together, authentic community feel, warm vibrant background, natural joyful lighting',
    novedad: 'excited Latin American early adopter, 25-38 years old, revealing or unwrapping something new, curious eager expression, modern tech environment, bright innovative lighting',
    aspiracional: 'aspirational successful Latin American person, 28-42 years old, achieving their dream lifestyle, luxury modern environment, confident visionary expression, golden hour premium lighting',
    humor: 'funny and relatable Latin American person, 25-40 years old, exaggerated comedic expression, playful dynamic pose, bright colorful background, fun energetic lighting',
    autoridad: 'authoritative Latin American expert/leader, 35-50 years old, commanding presence, suit or professional attire, confident crossed-arms or open-hand expert pose, dark premium background, power lighting',
  }

  const scene = ANGLE_SCENE[tipo] || ANGLE_SCENE.dolor

  // ── Estilo de fondo según branding ────────────────────────────────────────
  const STYLE_BG = {
    agresivo: 'dark dramatic background with deep purple and electric blue neon accent lights, high-energy cinematic grade, intense atmosphere, smoke or haze effects, bold shadows',
    moderno: 'clean modern gradient background (dark navy to black), minimal geometric elements, professional sleek atmosphere, subtle blue accent glow',
    minimalista: 'clean white or very light gray background, minimal design, focus on typography and subject, subtle shadows only, crisp professional look',
    elegante: 'luxury dark background with gold and deep purple accents, sophisticated premium atmosphere, soft bokeh lights, elegant cinematic grade',
    vintage: 'warm vintage-toned background, retro textures and warm amber/sepia accents, nostalgic film-grain feel, warm cinematic grade',
    bold: 'vibrant bold colorful background, high-saturation complementary colors, dynamic graphic design elements, energetic commercial style',
    corporativo: 'professional corporate environment, clean office background, trustworthy blue and gray tones, business-formal atmosphere',
    lifestyle: 'warm natural lifestyle setting, authentic home or outdoor environment, natural light, warm golden tones, relatable everyday scene',
  }

  const bgStyle = STYLE_BG[estilo] || STYLE_BG.agresivo

  // ── Elementos visuales según tipo ─────────────────────────────────────────
  const VISUAL_ELEMENTS = {
    dolor: 'stress symbols, overflowing papers or tasks, dark oppressive atmosphere',
    curiosidad: 'question mark graphic elements, discovery lighting, bright focal point',
    resultado: 'upward trend charts on screens, income/earnings dashboard, success metrics visible, cash or earnings symbols',
    objecion: 'objection/checkmark graphic, confidence symbols, breaking through barriers visual',
    miedo: 'warning symbols, red alert elements, tension-creating shadows',
    transformacion: 'before/after split design, transformation arrow, dramatic contrast elements',
    urgencia: 'countdown timer elements, red urgency accents, rushing motion blur on periphery',
    precio: 'price tag or percentage badge, deal/offer graphic element, value arrows',
    garantia: 'shield or checkmark badge, trust seal graphic element, solid trustworthy symbols',
    exclusividad: 'VIP badge, crown or premium element, exclusive membership feel',
    social_proof: 'star ratings graphic, testimonial quote bubble, community/group elements',
    novedad: 'new badge or ribbon, sparkle effects, tech innovation elements',
  }

  const visualExtras = VISUAL_ELEMENTS[tipo] || ''
  const conceptExtras = visualConcept ? `Additional concept: ${visualConcept}` : ''

  // ── Composición dinámica ───────────────────────────────────────────────────
  const compositions = [
    'Subject on left third of frame, bold text block on right third, strong visual hierarchy',
    'Subject centered, headline text at top 20% of frame, subtext at bottom 20%, rule of thirds',
    'Dynamic diagonal composition, subject looking toward text area, text integrated into negative space',
  ]
  const composition = compositions[Math.abs(tipo.charCodeAt(0) + (headline.charCodeAt(0) || 0)) % compositions.length]

  // ── Construcción final del prompt ─────────────────────────────────────────
  const prompt = `Create a high-conversion Meta Ads creative (Facebook/Instagram advertisement) with these exact specifications:

FORMAT: Square image 1080x1080px, bold graphic design, professional advertising style, ultra-realistic photography

PRODUCT/NICHE: ${producto} targeting ${publico}

MAIN SUBJECT: ${scene}

MANDATORY TEXT OVERLAYS ON IMAGE:
- HEADLINE (large bold text, white or bright yellow, thick dark stroke/shadow for contrast): "${headline}"
- SUBTEXT (smaller readable text, white, subtle shadow): "${copy}"
- Text must be legible, high-contrast, integrated into the design — not floating awkwardly
- Bottom 35% of image must be naturally darker to ensure text readability

VISUAL ELEMENTS:
- ${visualExtras}
${conceptExtras}
- Visual metaphors related to: ${producto}
- Bold graphic design elements: arrows, accent badges, border frames
- Small credibility pill badge in corner (e.g. 'NUEVO', 'PROBADO', or checkmark seal)
- Subtle colored accent lights matching scene mood
- NO watermarks, NO generic stock photo aesthetic

SCENE & BACKGROUND:
- ${bgStyle}
- Atmosphere must feel high-energy and scroll-stopping

COMPOSITION:
- ${composition}
- Strong visual hierarchy: headline → person → subtext → badge
- Scroll-stopping composition designed for social media feed

LIGHTING: Dramatic cinematic lighting, strong rim light on subject, colored accent lights (purple/blue tones preferred for dark styles), dark moody ambient where appropriate

QUALITY: Ultra-realistic photography style, 8K resolution equivalent, sharp focus on subject, professional advertising campaign quality, vivid saturated colors, high contrast, NO blurry elements, NO text artifacts outside of designated areas, NO watermarks

STYLE REFERENCE: Top-performing Meta Ads creatives from high-converting Latin American digital marketing campaigns — bold, direct, high-energy, emotionally triggering, conversion-optimized`

  console.log('[buildImagePrompt] tipo:', tipo, '| estilo:', estilo)
  console.log('[buildImagePrompt] PROMPT GENERADO:\n', prompt)

  return prompt
}
