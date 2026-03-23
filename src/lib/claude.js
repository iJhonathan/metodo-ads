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
      model: 'claude-sonnet-4-6',
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
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return JSON.parse(fenced[1].trim())

  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])

  throw new Error('No se encontró JSON válido en la respuesta')
}

// ──────────────────────────────────────────────────────────
// Ángulos de venta disponibles
// ──────────────────────────────────────────────────────────

export const ANGLE_TYPES = [
  { key: 'dolor',          label: 'Dolor' },
  { key: 'curiosidad',     label: 'Curiosidad' },
  { key: 'objecion',       label: 'Objeción' },
  { key: 'miedo',          label: 'Miedo' },
  { key: 'resultado',      label: 'Resultado' },
  { key: 'comparacion',    label: 'Comparación' },
  { key: 'urgencia',       label: 'Urgencia' },
  { key: 'testimonio',     label: 'Testimonio' },
  { key: 'educativo',      label: 'Educativo' },
  { key: 'provocacion',    label: 'Provocación' },
  { key: 'identidad',      label: 'Identidad' },
  { key: 'transformacion', label: 'Transformación' },
  { key: 'garantia',       label: 'Garantía' },
  { key: 'precio',         label: 'Precio' },
  { key: 'exclusividad',   label: 'Exclusividad' },
  { key: 'social_proof',   label: 'Prueba Social' },
  { key: 'novedad',        label: 'Novedad' },
  { key: 'aspiracional',   label: 'Aspiracional' },
  { key: 'humor',          label: 'Humor' },
  { key: 'autoridad',      label: 'Autoridad' },
]

// ──────────────────────────────────────────────────────────
// Prompt: Generador integrado de creativos para Meta Ads
// ──────────────────────────────────────────────────────────

export function buildCreativesPrompt({ project, knowledge, branding, quantity = 100, angleTypes }) {
  const system = `Eres un experto en marketing digital, copywriting y publicidad en Meta Ads (Facebook e Instagram).
Tu especialidad es crear creativos publicitarios de alto impacto que generan conversiones reales.
Todos los textos deben estar en español perfecto, sin errores gramaticales ni ortográficos.
Siempre respondes ÚNICAMENTE con el JSON solicitado, sin texto adicional antes ni después.`

  const brandingInfo = branding ? `
**Tono de comunicación:** ${branding.tono || 'No especificado'}
**Estilo visual:** ${branding.estilo || 'No especificado'}
**Público detallado:** ${branding.publico_detallado || 'No especificado'}` : ''

  const knowledgeInfo = knowledge?.contenido
    ? `\n**Base de conocimiento del producto:**\n${knowledge.contenido}`
    : ''

  const angleList = angleTypes && angleTypes.length > 0
    ? angleTypes.join(', ')
    : ANGLE_TYPES.map(a => a.key).join(', ')

  const prompt = `Genera exactamente ${quantity} creativos publicitarios para Meta Ads.
Cada creativo debe tocar un ángulo de venta diferente y estar listo para usar en Facebook e Instagram.

**INFORMACIÓN DEL PROYECTO:**
- Nombre: ${project.nombre}
- Producto/Servicio: ${project.producto || 'No especificado'}
- Público objetivo: ${project.publico || 'No especificado'}
- Propuesta de valor: ${project.propuesta_valor || 'No especificada'}
${brandingInfo}
${knowledgeInfo}

**DISTRIBUYE los ${quantity} creativos entre estos ángulos de marketing:**
${angleList}

**INSTRUCCIONES POR CAMPO (lee con atención):**

1. "tipo": Uno de los ángulos listados arriba.

2. "texto_imagen": El TITULAR VISUAL que aparecerá SOBRE LA IMAGEN del anuncio. Debe ser:
   - Corto e impactante (máximo 8 palabras)
   - Escrito para impactar visualmente dentro de la imagen
   - DIFERENTE al campo "titulo"
   - En español correcto, sin errores
   - Ejemplo: "¿Listo para cambiar tu vida?" o "Resultados reales en 30 días"

3. "titulo": El texto que va en el campo "Titular" de Meta Ads (separado de la imagen). Debe ser:
   - Más descriptivo y persuasivo que texto_imagen
   - Máximo 40 caracteres
   - DIFERENTE al texto_imagen
   - En español correcto, sin errores

4. "cta": Texto MUY CORTO para el botón de acción de Meta Ads. Debe ser:
   - En MAYÚSCULAS
   - Máximo 3 palabras
   - Ejemplos: "AGENDA AHORA", "VER PRECIO", "QUIERO ACCESO", "EMPIEZA HOY", "CUPOS LIMITADOS"

5. "imagen_concepto": Descripción visual EN INGLÉS para generar la imagen de fondo con IA. Debe:
   - Describir escena, personas, ambiente, iluminación y composición en 2-3 oraciones
   - Indicar que la zona inferior debe ser más oscura para legibilidad del texto
   - NO incluir texto en la imagen, el texto se agrega después digitalmente

**REGLAS CRÍTICAS:**
- Todos los textos en español DEBEN estar perfectamente escritos sin errores gramaticales
- texto_imagen y titulo SIEMPRE deben ser textos DIFERENTES entre sí
- Varía el estilo y enfoque entre creativos, no repitas fórmulas

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
