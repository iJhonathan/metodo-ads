/**
 * Google AI Studio — Gemini imagen generation
 * Usa generateContent endpoint (distinto al predict endpoint de Imagen 4).
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Modelos en orden de prioridad
const MODELS = [
  'gemini-2.5-flash-preview-image-generation', // Principal
  'gemini-2.0-flash-preview-image-generation', // Fallback estable
]

/**
 * Intenta generar una imagen con un modelo específico usando generateContent.
 * Retorna { dataUrl, model } o lanza error.
 */
async function tryGenerateWithModel({ apiKey, prompt, model }) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`

  console.log(`[gemini] Intentando con modelo: ${model}`)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const status = res.status
    const msg = err?.error?.message || `HTTP ${status}`
    const error = new Error(msg)
    error.status = status
    throw error
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imagePart = parts.find(p => p.inlineData?.data)

  if (!imagePart) {
    throw new Error('El modelo no devolvió una imagen. Verifica tu API Key de Google AI Studio.')
  }

  const b64 = imagePart.inlineData.data
  const mimeType = imagePart.inlineData.mimeType || 'image/png'

  console.log(`[gemini] Imagen generada con ${model} (${mimeType})`)
  return `data:${mimeType};base64,${b64}`
}

/**
 * Genera una imagen con fallback automático entre modelos.
 * Si todos fallan con 429 o error de modelo, lanza error claro al usuario.
 */
export async function generateImage({ apiKey, prompt }) {
  let lastError = null

  for (const model of MODELS) {
    try {
      return await tryGenerateWithModel({ apiKey, prompt, model })
    } catch (err) {
      console.warn(`[gemini] Falló ${model}: ${err.message} (status: ${err.status})`)
      lastError = err

      // Solo hacer fallback en rate limit (429) o modelo no encontrado (404/400)
      const shouldFallback = err.status === 429 || err.status === 404 || err.status === 400
      if (!shouldFallback) throw err
      // Si hay más modelos en la lista, continúa al siguiente
    }
  }

  // Todos los modelos fallaron
  if (lastError?.status === 429) {
    throw new Error('Límite de generaciones alcanzado. Intenta en unos minutos.')
  }
  throw new Error(lastError?.message || 'Error al generar imagen con Google AI Studio.')
}

/**
 * Construye el prompt de imagen para Meta Ads a partir del ángulo y el contexto del proyecto.
 */
const VARIATION_HINTS = [
  'Primary composition: direct product focus, clean background, strong hero shot.',
  'Alternative composition: lifestyle context, environmental setting, emotional storytelling angle.',
]

export function buildImagePrompt({ angle, project, branding, variationIndex = 0 }) {
  // Soporte para campo nuevo (imagen_concepto) y legado (visual_sugerido)
  const visualConcept = angle.imagen_concepto || angle.visual_sugerido || ''
  const style = branding?.estilo || 'modern'
  const primaryColor = branding?.colores?.[0] || ''
  const audience = branding?.publico_detallado || project?.publico || ''

  const styleMap = {
    moderno: 'modern, clean, contemporary',
    minimalista: 'minimalist, clean white space, simple',
    agresivo: 'bold, high contrast, dynamic, powerful',
    elegante: 'elegant, luxury, sophisticated, premium',
    vintage: 'vintage, retro, nostalgic, warm tones',
    bold: 'bold, vibrant, striking, attention-grabbing',
    corporativo: 'corporate, professional, trustworthy',
    lifestyle: 'lifestyle, authentic, natural, warm',
  }

  const styleDesc = styleMap[style] || style
  const variationHint = VARIATION_HINTS[variationIndex] || VARIATION_HINTS[0]

  return `Professional advertising background photo for a Facebook/Instagram ad creative.

Visual concept: ${visualConcept}
Composition: ${variationHint}

Product: ${project?.producto || 'product'}
Target audience: ${audience}
Style: ${styleDesc}
${primaryColor ? `Accent color: ${primaryColor}` : ''}

CRITICAL RULES:
- Bottom 35% must be naturally darker (shadow, dark surface, gradient) for text legibility
- Main subject in the upper 60-65% of the frame
- Professional advertising photography, studio quality
- Vivid colors, high contrast, scroll-stopping visual
- NO text, NO words, NO letters, NO watermarks in the image
- Square 1:1 format
- Emotionally powerful, ${styleDesc}`
}
