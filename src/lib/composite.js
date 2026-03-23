/**
 * Composita la imagen de fondo con el texto del anuncio usando HTML Canvas.
 * Produce un JPG 1080x1080 listo para Meta Ads.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Error cargando imagen'))
    img.src = src
  })
}

/** Rectángulo redondeado compatible con todos los browsers */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
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
  const SIZE = 1080
  const PAD = 54

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  // 1. Imagen de fondo
  const img = await loadImage(imageUrl)
  ctx.drawImage(img, 0, 0, SIZE, SIZE)

  // 2. Gradiente inferior oscuro para legibilidad del texto
  const grad = ctx.createLinearGradient(0, SIZE * 0.35, 0, SIZE)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(0.4, 'rgba(0,0,0,0.65)')
  grad.addColorStop(1, 'rgba(0,0,0,0.94)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  // 3. Color de acento
  const accentColor = branding?.colores?.[0] || '#7c3aed'

  // 4. CTA pill (parte inferior)
  const ctaText = (angle.cta || 'MÁS INFO').toUpperCase()
  ctx.font = 'bold 32px Arial'
  const ctaTextW = ctx.measureText(ctaText).width
  const ctaH = 60
  const ctaW = ctaTextW + 64
  const ctaX = PAD
  const ctaY = SIZE - PAD - ctaH

  // Sombra del pill
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4

  ctx.fillStyle = accentColor
  roundRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2)
  ctx.fill()

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Texto CTA
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 32px Arial'
  ctx.fillText(ctaText, ctaX + 32, ctaY + ctaH / 2)

  // 5. Headline sobre la imagen (texto_imagen)
  const headlineText = (angle.texto_imagen || angle.headline || '').trim()
  if (headlineText) {
    ctx.font = 'bold 64px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'

    // Sombra para legibilidad
    ctx.shadowColor = 'rgba(0,0,0,0.9)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 3

    const lines = wrapText(ctx, headlineText, SIZE - PAD * 2)
    const lineH = 78
    const totalH = lines.length * lineH
    const startY = ctaY - 36 - totalH

    lines.forEach((line, i) => {
      ctx.fillText(line, PAD, startY + (i + 1) * lineH)
    })

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

  // 6. Badge de tipo (esquina superior izquierda)
  const tipoLabel = angle.tipo
    ? angle.tipo.charAt(0).toUpperCase() + angle.tipo.slice(1).replace('_', ' ')
    : ''
  if (tipoLabel) {
    ctx.font = 'bold 22px Arial'
    const bW = ctx.measureText(tipoLabel).width + 32
    const bH = 38
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    roundRect(ctx, PAD, PAD, bW, bH, 8)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(tipoLabel, PAD + 16, PAD + bH / 2)
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}
