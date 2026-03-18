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
// Prompt: Generador de ángulos de venta
// ──────────────────────────────────────────────────────────

export function buildAnglesPrompt({ project, knowledge, branding }) {
  const system = `Eres un experto en copywriting y publicidad digital para Meta Ads (Facebook e Instagram).
Tu especialidad es crear ángulos de venta altamente persuasivos y originales que conectan emocionalmente con el público objetivo.
Siempre respondes ÚNICAMENTE con el JSON solicitado, sin texto adicional antes ni después.`

  const brandingInfo = branding ? `
**Tono de comunicación:** ${branding.tono || 'No especificado'}
**Estilo visual:** ${branding.estilo || 'No especificado'}
**Público detallado:** ${branding.publico_detallado || 'No especificado'}` : ''

  const knowledgeInfo = knowledge?.contenido
    ? `\n**Base de conocimiento del producto:**\n${knowledge.contenido}`
    : ''

  const prompt = `Genera exactamente 20 ángulos de venta únicos y poderosos para el siguiente producto/servicio.

**INFORMACIÓN DEL PROYECTO:**
- Nombre: ${project.nombre}
- Producto/Servicio: ${project.producto || 'No especificado'}
- Público objetivo: ${project.publico || 'No especificado'}
- Propuesta de valor: ${project.propuesta_valor || 'No especificada'}
${brandingInfo}
${knowledgeInfo}

**TIPOS DE ÁNGULOS a usar (distribuye entre los 20):**
- dolor: Conecta con el problema o frustración del cliente
- curiosidad: Genera intriga, abre un bucle mental
- objecion: Destruye la principal razón para no comprar
- miedo: Usa el miedo a perder algo o quedarse igual
- resultado: Muestra la transformación o beneficio concreto
- comparacion: Posiciona vs alternativas o estado actual
- urgencia: Crea escasez real o temporal
- testimonio: Simula o sugiere prueba social
- educativo: Enseña algo útil relacionado con el producto
- provocacion: Desafía una creencia del público
- identidad: Conecta con quién quiere SER el cliente
- transformacion: Antes y después emocional o físico
- garantia: Elimina el riesgo percibido
- precio: Reencuadra el costo como inversión
- exclusividad: Sensación de acceso especial
- social_proof: Números, casos, comunidad
- novedad: Algo nuevo que cambia las reglas
- aspiracional: El sueño/estilo de vida deseado
- humor: Tono divertido o irónico
- autoridad: Credenciales, ciencia, expertos

**INSTRUCCIONES:**
- El headline debe ser de IMPACTO, máximo 12 palabras, sin puntos finales
- El copy debe ser de 2-3 oraciones persuasivas con el tono indicado
- El visual_sugerido debe describir una imagen o video corto ideal para el anuncio (2-3 oraciones)
- Usa el tono y estilo del branding kit cuando esté disponible
- Adapta el lenguaje al público objetivo específico

Responde SOLO con este JSON (sin texto adicional):
{
  "angulos": [
    {
      "tipo": "dolor",
      "headline": "...",
      "copy": "...",
      "visual_sugerido": "..."
    }
  ]
}`

  return { system, prompt }
}
