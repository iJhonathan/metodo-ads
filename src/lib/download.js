import JSZip from 'jszip'

/**
 * Descarga un array de creativos como ZIP.
 * Cada creativo debe tener { imagen_url, angles?, estado, id }
 */
export async function downloadCreativesAsZip(creatives, zipName = 'creativos-metodo-ads.zip') {
  const zip = new JSZip()
  const folder = zip.folder('creativos')

  let count = 0
  for (const c of creatives) {
    const url = c.imagen_url || c.imageUrl
    if (!url) continue

    // Convertir data URL base64 a blob
    if (url.startsWith('data:')) {
      const [header, b64] = url.split(',')
      const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
      const ext = mime.split('/')[1] || 'png'
      const tipo = c.angles?.tipo || c.angle?.tipo || 'creativo'
      const filename = `${tipo}-${++count}.${ext}`
      folder.file(filename, b64, { base64: true })
    } else {
      // URL externa — fetch y agregar
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const tipo = c.angles?.tipo || c.angle?.tipo || 'creativo'
        folder.file(`${tipo}-${++count}.png`, blob)
      } catch {
        count++
      }
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = zipName
  a.click()
  URL.revokeObjectURL(a.href)
}

/**
 * Descarga un único creativo.
 */
export function downloadSingle(imageUrl, filename = 'creativo.png') {
  const a = document.createElement('a')
  a.href = imageUrl
  a.download = filename
  a.click()
}
