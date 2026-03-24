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
  { key: 'dolor',          label: 'Dolor',          descripcion: 'Identificar y amplificar el problema principal del cliente. Hacer que se sienta completamente identificado con su frustración actual.' },
  { key: 'curiosidad',     label: 'Curiosidad',     descripcion: 'Generar intriga con algo sorprendente o contraintuitivo que el cliente quiere descubrir urgentemente.' },
  { key: 'objecion',       label: 'Objeción',       descripcion: 'Anticipar y destruir la principal objeción que impide al cliente comprar. Responder directamente a su mayor duda.' },
  { key: 'miedo',          label: 'Miedo',          descripcion: 'Activar el miedo a perder algo valioso, a quedarse atrás, o a que el problema empeore si no actúa ahora.' },
  { key: 'resultado',      label: 'Resultado',      descripcion: 'Mostrar el resultado transformador concreto y específico que el cliente obtendrá. Enfocarse en el antes vs después.' },
  { key: 'comparacion',    label: 'Comparación',    descripcion: 'Comparar el producto con la alternativa inferior para resaltar su superioridad de forma clara e irrefutable.' },
  { key: 'urgencia',       label: 'Urgencia',       descripcion: 'Crear urgencia real o percibida para que el cliente actúe ahora mismo y no postergue la decisión.' },
  { key: 'testimonio',     label: 'Testimonio',     descripcion: 'Usar la voz de un cliente real satisfecho para generar prueba social y confianza a través de su experiencia genuina.' },
  { key: 'educativo',      label: 'Educativo',      descripcion: 'Enseñar algo valioso relacionado al problema que posiciona al negocio como experto y genera confianza inmediata.' },
  { key: 'provocacion',    label: 'Provocación',    descripcion: 'Desafiar una creencia común o decir algo polémico que obligue al cliente a detenerse y leer.' },
  { key: 'identidad',      label: 'Identidad',      descripcion: 'Apelar a la identidad del cliente ideal. Hablarle como parte de un grupo exclusivo que merece lo mejor.' },
  { key: 'transformacion', label: 'Transformación', descripcion: 'Mostrar la transformación completa de vida. El contraste dramático entre la vida actual y la vida con el producto.' },
  { key: 'garantia',       label: 'Garantía',       descripcion: 'Eliminar el riesgo de compra con una garantía fuerte que hace que la decisión sea obvia y segura.' },
  { key: 'precio',         label: 'Precio',         descripcion: 'Hacer que el precio parezca una inversión obvia comparado con el valor obtenido, o destacar una oferta irresistible.' },
  { key: 'exclusividad',   label: 'Exclusividad',   descripcion: 'Posicionar el producto como algo exclusivo, premium o de acceso limitado que no todos pueden tener.' },
  { key: 'social_proof',   label: 'Prueba Social',  descripcion: 'Mostrar cuántas personas ya lo usan con éxito para generar el efecto manada y reducir la percepción de riesgo.' },
  { key: 'novedad',        label: 'Novedad',        descripcion: 'Presentar algo nuevo o revolucionario que genera curiosidad y la sensación de ser el primero en descubrirlo.' },
  { key: 'aspiracional',   label: 'Aspiracional',   descripcion: 'Conectar el producto con el estilo de vida soñado del cliente. Vender la versión mejorada de sí mismo que quiere ser.' },
  { key: 'humor',          label: 'Humor',          descripcion: 'Usar humor cercano y reconocible para generar conexión emocional y hacer el mensaje memorable y compartible.' },
  { key: 'autoridad',      label: 'Autoridad',      descripcion: 'Posicionar al negocio como la máxima autoridad en el tema con credenciales, años de experiencia o resultados demostrables.' },
]

// ──────────────────────────────────────────────────────────
// Generador de textos por creativo individual (nuevo flujo)
// Claude genera texto → Gemini genera imagen
// ──────────────────────────────────────────────────────────

export async function generateCreativeText({ apiKey, angle, project, branding, knowledge }) {
  const knowledgeSnippet = knowledge?.contenido?.substring(0, 400) || ''

  const prompt = `Eres un experto en copywriting y publicidad en Meta Ads en español con 10 años de experiencia creando anuncios de alta conversión para negocios hispanohablantes.

DATOS DEL NEGOCIO:
- Nombre: ${project.nombre}
- Producto/Servicio: ${project.producto || 'No especificado'}
- Tipo de negocio: ${project.tipo_negocio || 'No especificado'}
- Público objetivo: ${branding?.genero || ''}, ${branding?.edad_desde || ''} a ${branding?.edad_hasta || ''} años
- Mercado: ${branding?.mercado || 'No especificado'}
- Descripción del cliente ideal: ${branding?.publico_detallado || 'No especificado'}
- Tono de comunicación: ${branding?.tono || 'directo y urgente'}${knowledgeSnippet ? `\n- Información del producto: ${knowledgeSnippet}` : ''}

ÁNGULO DE MARKETING A USAR:
- Tipo: ${angle.label}
- Estrategia: ${angle.descripcion}

TAREA:
Genera el contenido de texto completo para un anuncio publicitario usando ÚNICAMENTE el ángulo indicado arriba.

Responde SOLO con JSON puro, sin markdown, sin explicaciones, sin bloques de código, solo el objeto JSON:

{
  "titularImagen": "titular principal para mostrar EN la imagen, máximo 8 palabras, impactante, sin errores ortográficos, en español perfecto",
  "subtextoImagen": "subtexto de apoyo para mostrar EN la imagen, máximo 12 palabras, complementa el titular, en español perfecto",
  "ctaImagen": "texto del botón de llamada a la acción EN la imagen, máximo 3 palabras, en español perfecto",
  "metaTextoPrincipal": "texto principal para publicar en Meta Ads al momento de subir el anuncio, entre 80 y 150 caracteres, conversacional, puede incluir emojis relevantes, que genere curiosidad o urgencia, que complemente la imagen sin repetir exactamente lo mismo, en español perfecto",
  "metaTitulo": "título para Meta Ads al momento de publicar, máximo 40 caracteres, directo, que invite al clic, en español perfecto"
}`

  const rawText = await callClaude({ apiKey, prompt, maxTokens: 1024 })

  // Limpiar y parsear JSON
  let cleaned = rawText.trim().replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    console.error('[claude] generateCreativeText — respuesta inválida:', rawText)
    throw new Error('Claude devolvió un formato inválido. Verifica tu API Key de Claude.')
  }
}

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

  const tiposPermitidos = angleList
  const ejemploTipo = angleTypes && angleTypes.length > 0 ? angleTypes[0] : 'dolor'

  const prompt = `Genera exactamente ${quantity} creativos publicitarios para Meta Ads, listos para usar en Facebook e Instagram.

**INFORMACIÓN DEL PROYECTO:**
- Nombre: ${project.nombre}
- Producto/Servicio: ${project.producto || 'No especificado'}
- Público objetivo: ${project.publico || 'No especificado'}
- Propuesta de valor: ${project.propuesta_valor || 'No especificada'}
${brandingInfo}
${knowledgeInfo}

**TIPOS DE ÁNGULO PERMITIDOS — LISTA EXCLUSIVA:**
${tiposPermitidos}

⚠️ REGLA ABSOLUTA: El campo "tipo" de CADA creativo DEBE ser uno de los valores de la lista anterior.
PROHIBIDO usar cualquier tipo de ángulo que no esté en esa lista.
Si la lista tiene un solo valor, TODOS los creativos deben usar ese mismo valor.
Si la lista tiene varios valores, distribúyelos equitativamente entre los ${quantity} creativos.

**INSTRUCCIONES POR CAMPO (lee con atención):**

1. "tipo": OBLIGATORIAMENTE uno de los valores de la LISTA EXCLUSIVA de arriba. Sin excepciones.

2. "texto_imagen": El TITULAR PRINCIPAL que aparecerá en LETRAS GRANDES sobre la imagen. Debe ser:
   - Impactante y directo (máximo 10 palabras)
   - Diseñado para detener el scroll y generar emoción inmediata
   - DIFERENTE al campo "titulo"
   - En español perfecto, sin errores

3. "subtexto_imagen": El TEXTO DE APOYO que aparece bajo el titular en la imagen. Debe ser:
   - Breve y complementario al texto_imagen (máximo 15 palabras)
   - Refuerza el titular con un beneficio o urgencia específica
   - En español perfecto, sin errores

4. "titulo": El COPY COMPLETO para el texto del post de Facebook/Instagram. Debe ser:
   - Entre 80 y 150 caracteres
   - Incluir el beneficio principal y un gancho de curiosidad o urgencia
   - MÁS largo y descriptivo que texto_imagen
   - En español perfecto, sin errores

5. "cta": Texto MUY CORTO para el botón de llamada a la acción. Debe ser:
   - En MAYÚSCULAS
   - Máximo 4 palabras
   - Ejemplos: "AGENDA AHORA", "VER PRECIO", "QUIERO ACCESO", "EMPIEZA HOY", "LO QUIERO"

**REGLAS CRÍTICAS:**
- Todos los textos en español DEBEN estar perfectamente escritos sin errores gramaticales
- texto_imagen, subtexto_imagen y titulo SIEMPRE deben ser textos DIFERENTES entre sí
- Varía el copy entre creativos del mismo tipo, no repitas frases idénticas

Responde SOLO con este JSON (sin texto adicional):
{
  "creativos": [
    {
      "tipo": "${ejemploTipo}",
      "texto_imagen": "...",
      "subtexto_imagen": "...",
      "titulo": "...",
      "cta": "AGENDA AHORA"
    }
  ]
}`

  return { system, prompt }
}
