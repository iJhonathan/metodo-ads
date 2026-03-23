/**
 * Composita la imagen de fondo con el texto del anuncio usando HTML Canvas.
 * Produce un JPG 1080x1080 listo para Meta Ads.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
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

const CTA_BY_TYPE = {
  dolor:        'Quiero solucionarlo →',
  resultado:    'Ver los resultados →',
  urgencia:     'Aprovechar ahora →',
  precio:       'Ver precio especial →',
  garantia:     'Empezar sin riesgo →',
  transformacion: 'Quiero transformarme →',
  curiosidad:   'Descubrir el secreto →',
  objecion:     'Ver cómo funciona →',
  miedo:        'Protegerme ahora →',
  comparacion:  'Comparar opciones →',
  testimonio:   'Ver más historias →',
  educativo:    'Aprender más →',
  provocacion:  'Demostrar que sí →',
  identidad:    'Ser parte ahora →',
  exclusividad: 'Acceder ahora →',
  social_proof: 'Unirme a ellos →',
  novedad:      'Ser el primero →',
  aspiracional: 'Empezar hoy →',
  humor:        'Ver más →',
  autoridad:    'Conocer más →',
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

  // 2. Gradiente inferior (legibilidad del texto)
  const grad = ctx.createLinearGradient(0, SIZE * 0.30, 0, SIZE)
  grad.addColorStop(0,   'rgba(0,0,0,0)')
  grad.addColorStop(0.45,'rgba(0,0,0,0.55)')
  grad.addColorStop(1,   'rgba(0,0,0,0.92)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  // 3. Color de acento del branding
  const accentColor = branding?.colores?.[0] || '#7c3aed'

  // 4. CTA pill (desde abajo) — usa el CTA generado por Claude o el predeterminado
  const ctaText = angle.cta || CTA_BY_TYPE[angle.tipo] || 'Descubrir más →'
  ctx.font = 'bold 30px Arial, sans-serif'
  const ctaTextW = ctx.measureText(ctaText).width
  const ctaH = 56
  const ctaW = ctaTextW + 64
  const ctaX = PAD
  const ctaY = SIZE - PAD - ctaH

  // Sombra del pill
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 4

  // Pill
  ctx.beginPath()
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaH / 2)
  ctx.fillStyle = accentColor
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Texto CTA
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 30px Arial, sans-serif'
  ctx.fillText(ctaText, ctaX + 32, ctaY + ctaH / 2)

  // 5. Copy (línea corta encima del CTA)
  const copySnippet = angle.copy?.split('.')[0] || ''
  if (copySnippet) {
    ctx.font = '28px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.80)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    const copyLines = wrapText(ctx, copySnippet, SIZE - PAD * 2)
    const copyY = ctaY - 22
    const copyLineH = 36
    ;[...copyLines].reverse().forEach((line, i) => {
      ctx.fillText(line, PAD, copyY - i * copyLineH)
    })
    var copyBlockHeight = copyLines.length * copyLineH
  } else {
    var copyBlockHeight = 0
  }

  // 6. Texto visual de la imagen (texto_imagen, distinto al titulo de Meta Ads)
  ctx.font = 'bold 58px Arial, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 2

  const headlineText = angle.texto_imagen || angle.headline || ''
  const headlineLines = wrapText(ctx, headlineText, SIZE - PAD * 2)
  const lineH = 70
  const headlineBlockH = headlineLines.length * lineH
  const headlineY = ctaY - 22 - (copyBlockHeight || 0) - 20 - headlineBlockH

  headlineLines.forEach((line, i) => {
    ctx.fillText(line, PAD, headlineY + i * lineH + lineH)
  })

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // 7. Badge de tipo en esquina superior izquierda
  const tipoLabel = angle.tipo?.charAt(0).toUpperCase() + angle.tipo?.slice(1) || ''
  ctx.font = 'bold 24px Arial, sans-serif'
  const badgeW = ctx.measureText(tipoLabel).width + 36
  const badgeH = 40
  const badgeX = PAD
  const badgeY = PAD

  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10)
  ctx.fillStyle = accentColor + 'cc'
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(tipoLabel, badgeX + 18, badgeY + badgeH / 2)

  return canvas.toDataURL('image/jpeg', 0.93)
}
