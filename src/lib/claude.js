/**
 * Claude API — llamada directa desde el browser con la key del usuario.
 * Anthropic permite esto con el header `anthropic-dangerous-direct-browser-access`.
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

export async function callClaude({ apiKey, system, prompt, maxTokens = 4096 }) {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

/**
 * Extrae JSON de una respuesta que puede contener texto antes/después del bloque JSON.
 */
export function extractJSON(text) {
  // Intentar bloque ```json ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return JSON.parse(fenced[1].trim())

  // Intentar objeto/array JSON directo
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])

  throw new Error('No se encontró JSON válido en la respuesta')
}

// ──────────────────────────────────────────────────────────
// Prompt: Generador integrado de 50 creativos para Meta Ads
// ──────────────────────────────────────────────────────────

export function buildCreativesPrompt({ project, knowledge, branding }) {
  const system = `Eres un experto en marketing digital y publicidad en Meta Ads (Facebook e Instagram).
Tu especialidad es crear creativos publicitarios de alto impacto que generan conversiones reales.
Siempre respondes ÚNICAMENTE con el JSON solicitado, sin texto adicional antes ni después.`

  const brandingInfo = branding ? `
**Tono de comunicación:** ${branding.tono || 'No especificado'}
**Estilo visual:** ${branding.estilo || 'No especificado'}
**Público detallado:** ${branding.publico_detallado || 'No especificado'}` : ''

  const knowledgeInfo = knowledge?.contenido
    ? `\n**Base de conocimiento del producto:**\n${knowledge.contenido}`
    : ''

  const prompt = `Genera exactamente 50 creativos publicitarios para Meta Ads para el siguiente producto/servicio.
Cada creativo debe tocar un ángulo de venta diferente y estar listo para usar en Facebook e Instagram.

**INFORMACIÓN DEL PROYECTO:**
- Nombre: ${project.nombre}
- Producto/Servicio: ${project.producto || 'No especificado'}
- Público objetivo: ${project.publico || 'No especificado'}
- Propuesta de valor: ${project.propuesta_valor || 'No especificada'}
${brandingInfo}
${knowledgeInfo}

**DISTRIBUYE los 50 creativos entre estos ángulos de marketing:**
dolor, curiosidad, objecion, miedo, resultado, comparacion, urgencia, testimonio,
educativo, provocacion, identidad, transformacion, garantia, precio, exclusividad,
social_proof, novedad, aspiracional, humor, autoridad

**INSTRUCCIONES POR CAMPO:**
- tipo: uno de los ángulos listados arriba
- titulo: El texto principal del anuncio. Debe ser de ALTO IMPACTO, máximo 12 palabras, sin punto final. Es el headline que verá el usuario en Meta Ads.
- cta: Texto corto de llamado a la acción en MAYÚSCULAS. Máximo 4 palabras. Ejemplos: "AGENDA AHORA", "CUPOS LIMITADOS", "VER PRECIO HOY", "QUIERO ACCESO", "RESERVA TU LUGAR", "EMPIEZA HOY", "DESCÁRGALO GRATIS". Debe ser urgente y específico al ángulo.
- imagen_concepto: Descripción visual detallada para generar la imagen de fondo del anuncio. Describe la escena, personas, ambiente, colores y composición. 2-3 oraciones. La zona inferior de la imagen debe ser oscura o con sombra para que el texto se lea bien encima.

Responde SOLO con este JSON (sin texto adicional):
{
  "creativos": [
    {
      "tipo": "dolor",
      "titulo": "...",
      "cta": "AGENDA AHORA",
      "imagen_concepto": "..."
    }
  ]
}`

  return { system, prompt }
}

// Mantener buildAnglesPrompt por compatibilidad con página de Ángulos
export function buildAnglesPrompt({ project, knowledge, branding }) {
  const system = `Eres un experto en copywriting y publicidad digital para Meta Ads (Facebook e Instagram).
Siempre respondes ÚNICAMENTE con el JSON solicitado, sin texto adicional antes ni después.`

  const brandingInfo = branding ? `
**Tono:** ${branding.tono || 'No especificado'}
**Estilo:** ${branding.estilo || 'No especificado'}
**Público:** ${branding.publico_detallado || 'No especificado'}` : ''

  const knowledgeInfo = knowledge?.contenido
    ? `\n**Base de conocimiento:**\n${knowledge.contenido}` : ''

  const prompt = `Genera exactamente 50 ángulos de venta para este producto/servicio.

**PROYECTO:** ${project.nombre}
- Producto: ${project.producto || 'No especificado'}
- Público: ${project.publico || 'No especificado'}
- Propuesta de valor: ${project.propuesta_valor || 'No especificada'}
${brandingInfo}${knowledgeInfo}

Responde SOLO con este JSON:
{
  "angulos": [
    { "tipo": "dolor", "headline": "...", "copy": "...", "visual_sugerido": "..." }
  ]
}`

  return { system, prompt }
}
