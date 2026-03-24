/**
 * renderCreativoFinal — Superpone el texto de Claude sobre la imagen de Gemini
 * usando Canvas API. Texto 100% perfecto, sin errores ortográficos.
 *
 * @param {string} imageUrl   — Data URL completa de la imagen de Gemini (sin texto)
 * @param {object} textos     — { titularImagen, subtextoImagen, ctaImagen }
 * @param {object} branding   — Branding kit (para color de marca)
 * @param {number} estiloIndex — Índice para rotar los 10 estilos tipográficos
 * @returns {Promise<string>} — Data URL del creativo final con texto
 */
export function renderCreativoFinal(imageUrl, textos, branding, estiloIndex = 0) {
  return new Promise((resolve, reject) => {
    const W = 1080
    const H = 1350

    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    const colorMarca = branding?.colores?.[0] || '#7c3aed'
    const t = {
      titular:  (textos?.titularImagen  || '').trim(),
      subtexto: (textos?.subtextoImagen || '').trim(),
      cta:      (textos?.ctaImagen      || 'VER MÁS').trim().toUpperCase(),
    }

    const img = new Image()
    img.onload = () => {
      // Dibujar imagen en modo "cover" centrada sobre el canvas 1080×1350
      const scale = Math.max(W / img.width, H / img.height)
      const sw = img.width  * scale
      const sh = img.height * scale
      const sx = (W - sw) / 2
      const sy = (H - sh) / 2
      ctx.drawImage(img, sx, sy, sw, sh)

      // Aplicar el estilo tipográfico correspondiente
      const estilos = [
        estiloFranjaInferior,
        estiloTitularSuperior,
        estiloPanelLateral,
        estiloFranjaCentral,
        estiloEsquinaInferior,
        estiloCentrado,
        estiloNoticia,
        estiloTitularGigante,
        estiloPanelLateralIzq,
        estiloOutline,
      ]
      const fn = estilos[estiloIndex % estilos.length]
      fn(ctx, t, colorMarca, W, H)

      resolve(canvas.toDataURL('image/jpeg', 0.95))
    }
    img.onerror = () => reject(new Error('Error cargando imagen de Gemini en Canvas'))
    img.src = imageUrl
  })
}

// ── ESTILO 0: Franja inferior oscura ──────────────────────────────────────
function estiloFranjaInferior(ctx, t, color, W, H) {
  const y = H - 450
  ctx.fillStyle = 'rgba(0,0,0,0.78)'
  ctx.fillRect(0, y, W, 450)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px Arial'
  ctx.textAlign = 'center'
  wrapText(ctx, t.titular, W / 2, y + 80, W - 100, 72)

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '36px Arial'
  wrapText(ctx, t.subtexto, W / 2, y + 220, W - 100, 42)

  dibujarBoton(ctx, t.cta, W / 2, y + 370, color)
}

// ── ESTILO 1: Titular superior grande ─────────────────────────────────────
function estiloTitularSuperior(ctx, t, color, W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.82)'
  ctx.fillRect(0, 0, W, 310)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 68px Arial'
  ctx.textAlign = 'center'
  wrapText(ctx, t.titular, W / 2, 75, W - 100, 76)

  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.font = '34px Arial'
  wrapText(ctx, t.subtexto, W / 2, 230, W - 120, 40)

  dibujarBoton(ctx, t.cta, W / 2, H - 80, color)
}

// ── ESTILO 2: Panel lateral derecho ───────────────────────────────────────
function estiloPanelLateral(ctx, t, color, W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.84)'
  roundRect(ctx, 570, 200, 470, 620, 20)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px Arial'
  ctx.textAlign = 'center'
  wrapText(ctx, t.titular, 805, 280, 410, 60)

  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.font = '30px Arial'
  wrapText(ctx, t.subtexto, 805, 520, 410, 38)

  dibujarBoton(ctx, t.cta, 805, 710, color)
}

// ── ESTILO 3: Franja central de color ─────────────────────────────────────
function estiloFranjaCentral(ctx, t, color, W, H) {
  const cy = H / 2 - 90
  ctx.fillStyle = color
  ctx.fillRect(0, cy, W, 180)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 58px Arial'
  ctx.textAlign = 'center'
  wrapText(ctx, t.titular, W / 2, cy + 48, W - 80, 66)

  ctx.fillStyle = 'rgba(0,0,0,0.78)'
  ctx.fillRect(0, cy + 220, W, 190)

  ctx.fillStyle = '#ffffff'
  ctx.font = '34px Arial'
  wrapText(ctx, t.subtexto, W / 2, cy + 268, W - 100, 40)

  dibujarBoton(ctx, t.cta, W / 2, H - 90, color)
}

// ── ESTILO 4: Esquina inferior izquierda ──────────────────────────────────
function estiloEsquinaInferior(ctx, t, color, W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.82)'
  roundRect(ctx, 40, H - 400, 700, 360, 20)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 54px Arial'
  ctx.textAlign = 'left'
  wrapText(ctx, t.titular, 80, H - 340, 620, 62)

  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.font = '30px Arial'
  wrapText(ctx, t.subtexto, 80, H - 200, 620, 36)

  dibujarBoton(ctx, t.cta, 80, H - 70, color, 'left')
}

// ── ESTILO 5: Texto centrado con overlay oscuro ───────────────────────────
function estiloCentrado(ctx, t, color, W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 72px Arial'
  ctx.textAlign = 'center'
  wrapText(ctx, t.titular, W / 2, 180, W - 120, 82)

  ctx.fillStyle = 'rgba(255,255,255,0.87)'
  ctx.font = '38px Arial'
  wrapText(ctx, t.subtexto, W / 2, H / 2 - 20, W - 160, 46)

  dibujarBoton(ctx, t.cta, W / 2, H - 90, color)
}

// ── ESTILO 6: Estilo noticia ───────────────────────────────────────────────
function estiloNoticia(ctx, t, color, W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.92)'
  ctx.fillRect(0, 0, W, 215)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 8, 215)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 60px Arial'
  ctx.textAlign = 'center'
  wrapText(ctx, t.titular, W / 2, 65, W - 80, 68)

  ctx.fillStyle = 'rgba(0,0,0,0.84)'
  ctx.fillRect(0, H - 200, W, 200)

  ctx.fillStyle = 'rgba(255,255,255,0.87)'
  ctx.font = '32px Arial'
  wrapText(ctx, t.subtexto, W / 2, H - 165, W - 100, 38)

  dibujarBoton(ctx, t.cta, W - 170, H - 55, color)
}

// ── ESTILO 7: Titular gigante dominante ───────────────────────────────────
function estiloTitularGigante(ctx, t, color, W, H) {
  ctx.fillStyle = 'rgba(0,0,0,0.74)'
  ctx.fillRect(0, 0, W, 390)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 80px Arial'
  ctx.textAlign = 'center'
  wrapText(ctx, t.titular, W / 2, 75, W - 60, 88)

  ctx.fillStyle = 'rgba(0,0,0,0.74)'
  ctx.fillRect(0, H - 290, W, 290)

  ctx.fillStyle = 'rgba(255,255,255,0.87)'
  ctx.font = '34px Arial'
  wrapText(ctx, t.subtexto, W / 2, H - 255, W - 100, 40)

  dibujarBoton(ctx, t.cta, W / 2, H - 70, color)
}

// ── ESTILO 8: Panel lateral izquierdo sólido ──────────────────────────────
function estiloPanelLateralIzq(ctx, t, color, W, H) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 460, H)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px Arial'
  ctx.textAlign = 'center'
  wrapText(ctx, t.titular, 230, 200, 400, 60)

  ctx.fillStyle = 'rgba(255,255,255,0.87)'
  ctx.font = '30px Arial'
  wrapText(ctx, t.subtexto, 230, H / 2 + 50, 400, 36)

  // Botón invertido: fondo blanco, texto de color marca
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, 55, H - 200, 350, 68, 34)
  ctx.fill()
  ctx.fillStyle = color
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(t.cta, 230, H - 157)
}

// ── ESTILO 9: Tipografía outline ──────────────────────────────────────────
function estiloOutline(ctx, t, color, W, H) {
  ctx.font = 'bold 76px Arial'
  ctx.textAlign = 'center'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 12
  ctx.strokeText(t.titular.substring(0, 22), W / 2, 200)
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(0,0,0,0.74)'
  ctx.fillRect(0, H - 310, W, 310)

  ctx.lineWidth = 0
  ctx.fillStyle = '#ffffff'
  ctx.font = '36px Arial'
  wrapText(ctx, t.subtexto, W / 2, H - 265, W - 100, 42)

  dibujarBoton(ctx, t.cta, W / 2, H - 75, color)
}

// ── HELPERS ────────────────────────────────────────────────────────────────

function dibujarBoton(ctx, texto, x, y, color, align = 'center') {
  if (!texto) return
  ctx.font = 'bold 32px Arial'
  const textW = ctx.measureText(texto).width
  const pad = 36
  const bw = textW + pad * 2
  const bh = 66
  const bx = align === 'left' ? x : x - bw / 2

  ctx.fillStyle = color
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4
  roundRect(ctx, bx, y - bh + 10, bw, bh, 33)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = align === 'left' ? 'left' : 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(texto, align === 'left' ? bx + pad : x, y - bh / 2 + 10)
  ctx.textBaseline = 'alphabetic'
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return
  const words = text.split(' ')
  let line = ''
  let curY = y
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' '
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY)
      line = words[n] + ' '
      curY += lineHeight
    } else {
      line = test
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, curY)
}

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
