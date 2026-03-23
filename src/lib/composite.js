/**
 * Composita la imagen de fondo con el texto del anuncio usando HTML Canvas.
 * Produce un JPG 1080x1080 listo para Meta Ads.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Error cargando imagen para compositar'))
    img.src = src
  })
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function compositeAd({ imageUrl, angle, branding }) {
  await document.fonts.ready

  const SIZE = 1080
  const PAD = 54
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  // 1. Imagen de fondo
  const img = await loadImage(imageUrl)
  ctx.drawImage(img, 0, 0, SIZE, SIZE)

  // 2. Gradiente inferior para legibilidad del texto
  const grad = ctx.createLinearGradient(0, SIZE * 0.35, 0, SIZE)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(0.4, 'rgba(0,0,0,0.6)')
  grad.addColorStop(1, 'rgba(0,0,0,0.93)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  // 3. Color de acento
  const accentColor = branding?.colores?.[0] || '#7c3aed'

  // 4. CTA pill (parte inferior)
  const ctaText = angle.cta || 'MÁS INFO'
  ctx.font = 'bold 32px Arial, sans-serif'
  const ctaTextW = ctx.measureText(ctaText).width
  const ctaH = 58
  const ctaW = ctaTextW + 64
  const ctaX = PAD
  const ctaY = SIZE - PAD - ctaH

  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 4
  ctx.beginPath()
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaH / 2)
  ctx.fillStyle = accentColor
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 32px Arial, sans-serif'
  ctx.fillText(ctaText, ctaX + 32, ctaY + ctaH / 2)

  // 5. Texto visual (texto_imagen) — headline sobre la imagen
  const headlineText = angle.texto_imagen || ''
  if (headlineText) {
    ctx.font = 'bold 62px Arial, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 3

    const headlineLines = wrapText(ctx, headlineText, SIZE - PAD * 2)
    const lineH = 74
    const headlineBlockH = headlineLines.length * lineH
    const headlineY = ctaY - 30 - headlineBlockH

    headlineLines.forEach((line, i) => {
      ctx.fillText(line, PAD, headlineY + (i + 1) * lineH)
    })

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

  // 6. Badge de ángulo (esquina superior izquierda)
  const tipoLabel = angle.tipo
    ? angle.tipo.charAt(0).toUpperCase() + angle.tipo.slice(1).replace('_', ' ')
    : ''
  if (tipoLabel) {
    ctx.font = 'bold 22px Arial, sans-serif'
    const bW = ctx.measureText(tipoLabel).width + 32
    const bH = 36
    ctx.beginPath()
    ctx.roundRect(PAD, PAD, bW, bH, 8)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(tipoLabel, PAD + 16, PAD + bH / 2)
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}
