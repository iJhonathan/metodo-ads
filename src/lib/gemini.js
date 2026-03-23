/**
 * Google AI Studio — Imagen 3 (imagen-3.0-generate-001)
 * Llamada directa desde el browser con la key del usuario.
 */

const IMAGEN_API = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict'

/**
 * Genera una imagen y la devuelve como data URL (base64).
 */
export async function generateImage({ apiKey, prompt }) {
  const res = await fetch(`${IMAGEN_API}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        safetyFilterLevel: 'block_few',
        personGeneration: 'allow_adult',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }

  const data = await res.json()
  const b64 = data.predictions?.[0]?.bytesBase64Encoded
  if (!b64) throw new Error('Imagen no generada. Verifica tu API Key de Google AI Studio.')

  return `data:image/png;base64,${b64}`
}

/**
 * Construye el prompt de imagen para Meta Ads a partir del ángulo y el contexto del proyecto.
 */
const VARIATION_HINTS = [
  'Primary composition: direct product focus, clean background, strong hero shot.',
  'Alternative composition: lifestyle context, environmental setting, emotional storytelling angle.',
]

export function buildImagePrompt({ angle, project, branding, variationIndex = 0 }) {
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

  return `Professional Meta Ads advertising image for Facebook and Instagram.

Visual concept: ${angle.visual_sugerido}
Composition direction: ${variationHint}

Product: ${project?.producto || 'product'}
Target audience: ${audience}
Visual style: ${styleDesc} aesthetic
${primaryColor ? `Brand accent color: ${primaryColor}` : ''}

Requirements:
- High-quality professional advertising photography or digital art
- Clean composition optimized for social media feed (square 1:1 format)
- Photorealistic and visually stunning
- NO text, NO words, NO letters, NO watermarks
- Suitable for Facebook and Instagram advertising
- ${styleDesc} visual design
- Emotionally engaging, stops the scroll
- Bright, well-lit, professional quality`
}
