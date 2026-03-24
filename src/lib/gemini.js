/**
 * Google AI Studio — Generación de imágenes con fallback automático.
 *
 * Prioridad:
 *   1. imagen-4-generate            → endpoint :predict
 *   2. gemini-2.5-flash-preview-image-generation → endpoint :generateContent
 *   3. gemini-2.0-flash-preview-image-generation → endpoint :generateContent
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Modelo activo en el último intento exitoso (para mostrar en UI)
export let activeModel = 'gemini-2.5-flash-image'

// ─────────────────────────────────────────────────────────────
// DIAGNÓSTICO: lista todos los modelos disponibles para la API key
// ─────────────────────────────────────────────────────────────
export async function listAvailableModels(apiKey) {
  try {
    const res = await fetch(`${BASE}?key=${apiKey}`)
    const data = await res.json()
    const imageModels = (data.models || []).filter(m =>
      m.name?.toLowerCase().includes('imag') ||
      m.supportedGenerationMethods?.includes('generateContent') ||
      m.supportedGenerationMethods?.includes('predict')
    )
    console.log('[gemini] MODELOS DISPONIBLES (total):', data.models?.length)
    console.log('[gemini] MODELOS DE IMAGEN:', imageModels.map(m => ({
      name: m.name,
      methods: m.supportedGenerationMethods,
    })))
    return data
  } catch (err) {
    console.warn('[gemini] No se pudo listar modelos:', err.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────
// Handler para modelos Imagen 4 (endpoint :predict)
// ─────────────────────────────────────────────────────────────
async function tryImagenPredict({ apiKey, prompt, model }) {
  const url = `${BASE}/${model}:predict?key=${apiKey}`
  console.log(`[gemini] Intentando ${model} (:predict)`)

  const res = await fetch(url, {
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
    const error = new Error(err?.error?.message || `HTTP ${res.status}`)
    error.status = res.status
    throw error
  }

  const data = await res.json()
  const b64 = data.predictions?.[0]?.bytesBase64Encoded
  if (!b64) throw new Error('Imagen no generada (predict). Verifica tu API Key.')

  console.log(`[gemini] OK con ${model} (:predict)`)
  return `data:image/png;base64,${b64}`
}

// ─────────────────────────────────────────────────────────────
// Handler para modelos Gemini (endpoint :generateContent)
// ─────────────────────────────────────────────────────────────
async function tryGeminiGenerateContent({ apiKey, prompt, model }) {
  const url = `${BASE}/${model}:generateContent?key=${apiKey}`
  console.log(`[gemini] Intentando ${model} (:generateContent)`)

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
    const error = new Error(err?.error?.message || `HTTP ${res.status}`)
    error.status = res.status
    throw error
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imagePart = parts.find(p => p.inlineData?.data)
  if (!imagePart) throw new Error('Imagen no generada (generateContent). Verifica tu API Key.')

  const b64 = imagePart.inlineData.data
  const mimeType = imagePart.inlineData.mimeType || 'image/png'
  console.log(`[gemini] OK con ${model} (:generateContent) — ${mimeType}`)
  return `data:${mimeType};base64,${b64}`
}

// ─────────────────────────────────────────────────────────────
// Lista de modelos con su handler correspondiente
// Nombres verificados con ListModels de la API key real
// ─────────────────────────────────────────────────────────────
const MODEL_CHAIN = [
  { model: 'gemini-2.5-flash-image',         handler: tryGeminiGenerateContent }, // Principal — multimodal, entiende español
  { model: 'gemini-3.1-flash-image-preview', handler: tryGeminiGenerateContent }, // Fallback 1 — multimodal
  { model: 'imagen-4.0-generate-001',        handler: tryImagenPredict },         // Fallback 2 — Imagen 4 estándar
  { model: 'imagen-4.0-fast-generate-001',   handler: tryImagenPredict },         // Fallback 3 — Imagen 4 rápido
]

// ─────────────────────────────────────────────────────────────
// Función principal con fallback automático
// ─────────────────────────────────────────────────────────────
export async function generateImage({ apiKey, prompt }) {
  let lastError = null

  for (const { model, handler } of MODEL_CHAIN) {
    try {
      const dataUrl = await handler({ apiKey, prompt, model })
      activeModel = model  // actualiza el modelo activo para mostrar en UI
      return dataUrl
    } catch (err) {
      console.warn(`[gemini] Falló ${model}: ${err.message} (status: ${err.status})`)
      lastError = err

      const shouldFallback = err.status === 429 || err.status === 404 ||
                             err.status === 400 || err.status === 403
      if (!shouldFallback) throw err
    }
  }

  if (lastError?.status === 429) {
    throw new Error('Límite de generaciones alcanzado. Intenta en unos minutos.')
  }
  throw new Error(lastError?.message || 'Error al generar imagen con Google AI Studio.')
}
