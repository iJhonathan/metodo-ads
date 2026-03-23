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
- texto_imagen: El copy que aparece VISUALMENTE SOBRE LA IMAGEN del anuncio. Debe ser corto, impactante, tipo titular publicitario. Máximo 8 palabras. Diferente al titulo. Ejemplo: "¿Listo para cambiar tu vida?" o "Resultados reales en 30 días"
- titulo: El texto que va en el campo "Titular" de Meta Ads. Diferente al texto_imagen, más descriptivo y persuasivo. Máximo 40 caracteres.
- cta: Texto MUY CORTO para el botón de acción de Meta Ads. En MAYÚSCULAS, máximo 3 palabras. Ejemplos: "AGENDA AHORA", "VER PRECIO", "QUIERO ACCESO", "EMPIEZA HOY", "CUPOS LIMITADOS", "LO QUIERO".
- imagen_concepto: Descripción visual detallada para generar la imagen de fondo. Describe escena, personas, ambiente, colores. 2-3 oraciones. La zona inferior debe ser oscura para que el texto se lea bien.

Responde SOLO con este JSON (sin texto adicional):
{
  "creativos": [
    {
      "tipo": "dolor",
      "texto_imagen": "...",
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
