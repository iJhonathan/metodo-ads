/**
 * Google AI Studio — Imagen 3
 * Llamada directa desde el browser con la key del usuario.
 */

const IMAGEN_API = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict'

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

  return `Professional background image for a Meta Ads creative (Facebook/Instagram ad).

Visual concept: ${angle.visual_sugerido}
Composition direction: ${variationHint}

Product: ${project?.producto || 'product'}
Target audience: ${audience}
Visual style: ${styleDesc} aesthetic
${primaryColor ? `Brand accent color: ${primaryColor}` : ''}

IMPORTANT COMPOSITION RULES (text will be overlaid on this image):
- The bottom 40% of the image must be darker, blurred or with a natural shadow area — this is where the ad headline and CTA will appear
- Leave clean visual space at the bottom for text overlay
- The main subject (person, product, scene) should be in the upper 60% of the frame
- High contrast, vivid colors in the upper portion to stop the scroll
- NO text, NO words, NO letters, NO watermarks, NO logos in the image itself
- Photorealistic, professional advertising photography quality
- Square format (1:1), optimized for social media feed
- Emotionally engaging, ${styleDesc} aesthetic`
}
