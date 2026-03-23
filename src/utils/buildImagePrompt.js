/**
 * buildImagePrompt — Genera prompts en ESPAÑOL para Google AI Studio Imagen 4.
 * El prompt está 100% en español para evitar que Gemini coloque texto en inglés en la imagen.
 *
 * @param {object} angle       — Ángulo generado por Claude
 * @param {object} project     — Proyecto del usuario
 * @param {object} brandingKit — Branding kit con campos de audiencia
 * @param {object} knowledge   — Base de conocimiento del proyecto
 * @returns {string}           — Prompt listo para Imagen 4
 */

// ── Descripción dinámica del sujeto según audiencia ───────────────────────
function construirDescripcionSujeto(brandingKit) {
  const generoMap = {
    'Mujeres': 'mujer',
    'Hombres': 'hombre',
    'Todos (mixto)': 'persona',
  }
  const genero = generoMap[brandingKit?.genero] || 'persona'

  const edad = brandingKit?.edad_desde && brandingKit?.edad_hasta
    ? `de ${brandingKit.edad_desde} a ${brandingKit.edad_hasta} años`
    : 'de 25 a 45 años'

  const mercadoKey = brandingKit?.mercado === 'Otro (especificar)'
    ? 'Otro'
    : brandingKit?.mercado

  const aparienciaMap = {
    'Latinoamérica (América Latina)':
      'apariencia latinoamericana, tono de piel cálido, cercana y reconocible para audiencia latina',
    'España':
      'apariencia española/europea, rasgos mediterráneos, cercana y reconocible para audiencia española',
    'Estados Unidos (español)':
      'apariencia hispana americana, reconocible para latinos en Estados Unidos',
    'Europa hispanohablante':
      'apariencia hispana europea, reconocible para hispanohablantes en Europa',
    'Global hispanohablante':
      'apariencia neutral, universalmente reconocible para cualquier audiencia hispanohablante',
    'Otro':
      `apariencia reconocible para ${brandingKit?.mercado_personalizado || 'audiencia hispanohablante'}`,
  }

  const apariencia = aparienciaMap[mercadoKey] ||
    'apariencia neutral, reconocible para audiencia hispanohablante'

  return `${genero} ${edad}, ${apariencia}`
}

// ── Extrae la transformación del producto desde la Base de Conocimiento ───
function extraerTransformacion(knowledge, project) {
  const contenido = knowledge?.contenido || ''
  const producto = project?.producto || 'el producto'
  const extracto = contenido.substring(0, 600)

  return `
COMPOSICIÓN ESPECIAL ANTES/DESPUÉS:

Basándote en este contexto del producto: "${extracto}"

MITAD IZQUIERDA — Estado ANTES (el problema):
- Mostrar visualmente el problema o estado negativo que tenía el cliente ANTES de usar ${producto}
- Expresión facial de frustración, estrés o malestar
- Colores apagados, fríos, desaturados (grises, azules fríos)
- Ambiente desordenado o tenso según el contexto del producto
- Etiqueta "ANTES" visible en español, tipografía gruesa en blanco, fondo oscuro semitransparente

MITAD DERECHA — Estado DESPUÉS (el resultado):
- Mostrar visualmente la transformación positiva lograda CON ${producto}
- Expresión facial de satisfacción, alegría y confianza
- Colores vibrantes, cálidos, saturados (dorados, verdes, violetas brillantes)
- Ambiente ordenado, luminoso y aspiracional
- Etiqueta "DESPUÉS" visible en español, tipografía gruesa en blanco, fondo oscuro semitransparente

ELEMENTOS DE UNIÓN:
- Línea divisoria central clara y visible entre ambas mitades
- Las etiquetas dicen EXACTAMENTE "ANTES" y "DESPUÉS" (en español, NO en inglés)
- Contraste visual dramático entre ambas mitades para máximo impacto emocional
- Formato cuadrado, cada mitad ocupa exactamente el 50% del espacio`
}

// ── Escena y expresión según tipo de ángulo (en español) ─────────────────
const ESCENA_POR_ANGULO = {
  dolor:         'expresión de frustración intensa, manos en la cabeza, lenguaje corporal agobiado, fondo oscuro desordenado, iluminación dramática que transmite tensión',
  curiosidad:    'expresión de sorpresa y curiosidad, inclinado hacia adelante, ojos muy abiertos, gesto de señalar algo, iluminación brillante y atractiva',
  resultado:     'expresión de confianza y éxito, celebrando, oficina moderna con múltiples pantallas mostrando gráficos ascendentes y panel de ganancias, iluminación cálida y brillante',
  objecion:      'expresión segura y empoderada, brazos abriéndose con confianza, contacto visual directo con la cámara, fondo profesional limpio, iluminación de autoridad',
  miedo:         'expresión de preocupación y ansiedad, mirando nerviosamente una pantalla, iluminación oscura y dramática, tensión visible en el rostro, destello rojo de fondo',
  transformacion:'energía de transformación dinámica, expresión empoderada y segura, contraste visual dramático mostrando el cambio, iluminación cinematográfica poderosa',
  urgencia:      'expresión de urgencia energética, inclinado hacia adelante con determinación, elementos de acento rojo y naranja, composición de alta energía y movimiento',
  comparacion:   'expresión pensativa y comparativa, gesticulando entre dos opciones, postura de evaluación confiada, fondo dividido con contraste, iluminación balanceada',
  testimonio:    'expresión genuina de felicidad y satisfacción, sonrisa natural y auténtica, mirando a cámara con gratitud y confianza, ambiente cálido de estilo de vida',
  educativo:     'expresión de conocimiento y compromiso, explicando con ambas manos, postura profesional y segura, entorno educativo con datos visibles al fondo',
  provocacion:   'expresión atrevida y desafiante, mirada provocadora directa a cámara, ligeramente inclinado hacia adelante, fondo oscuro dramático, luces de neón cinematográficas',
  identidad:     'expresión de orgullo e identidad fuerte, mirada poderosa y directa, postura segura y empoderada, iluminación aspiracional dramática',
  garantia:      'expresión confiable y segura, gesto de mano abierta tranquilizador, fondo profesional limpio, iluminación que transmite solidez y confianza',
  precio:        'expresión de sorpresa agradable y emoción, gesto de señalar una oferta, fondo brillante y enérgico, iluminación comercial vibrante',
  exclusividad:  'expresión sofisticada y exclusiva, porte premium y elegante, entorno de lujo moderno con acentos dorados y violetas, iluminación cinematográfica de lujo',
  social_proof:  'expresión orgullosa mostrando resultados, sonrisa auténtica satisfecha, ambiente de estilo de vida que sugiere comunidad y éxito',
  novedad:       'expresión de emoción de primer adoptador, descubriendo algo nuevo con asombro, entorno tecnológico moderno, iluminación brillante e innovadora',
  aspiracional:  'expresión visionaria y aspiracional, logrando el estilo de vida soñado, entorno moderno de lujo, mirada hacia adelante con confianza, iluminación dorada de hora mágica',
  humor:         'expresión cómica exagerada y juguetona, reacción dramáticamente divertida, fondo colorido y enérgico, iluminación alegre y comercial',
  autoridad:     'expresión de autoridad y experticia, presencia imponente y profesional, brazos cruzados o gesto de experto con mano abierta, fondo premium oscuro, iluminación de poder',
}

// ── Estilo de fondo según branding (en español) ──────────────────────────
const ESTILO_FONDO = {
  agresivo:    'fondo oscuro dramático con luces de neón violeta y azul eléctrico intensas, gradación cinematográfica de alta energía, efectos de humo o neblina, sombras profundas y contrastadas',
  moderno:     'fondo degradado moderno y limpio (azul marino oscuro hacia casi negro), elementos geométricos mínimos, atmósfera profesional y elegante, destello azul sutil',
  minimalista: 'fondo blanco o gris muy claro y limpio, diseño mínimo sin elementos distractores, enfoque total en el sujeto y tipografía, sombras suaves solamente',
  elegante:    'fondo oscuro de lujo con acentos dorados y violeta profundo, atmósfera sofisticada y premium, luces de fondo bokeh suaves, gradación cinematográfica elegante',
  vintage:     'fondo con tonos vintage y cálidos, textura retro y grano, acentos ámbar y sepia, sensación de película nostálgica, gradación cinematográfica cálida',
  bold:        'fondo colorido y atrevido con colores complementarios de alta saturación, elementos gráficos dinámicos, estilo comercial de alta energía',
  corporativo: 'fondo de entorno corporativo profesional, oficina limpia y ordenada, tonos azules y grises confiables, atmósfera formal y seria de negocios',
  lifestyle:   'entorno de estilo de vida auténtico y cálido, casa u exterior natural, luz natural dorada, escena cotidiana y cercana',
}

// ── Composiciones rotativas ───────────────────────────────────────────────
const COMPOSICIONES = [
  'Sujeto en el tercio izquierdo del encuadre, bloque de texto audaz a la derecha, jerarquía visual fuerte, degradado oscuro en el lado del texto para legibilidad',
  'Sujeto centrado en el encuadre, titular audaz integrado en el tercio superior, subtexto en el tercio inferior, composición con regla de tercios',
  'Composición diagonal dinámica, sujeto angulado hacia el área de texto, texto integrado naturalmente en el espacio negativo del lado opuesto',
  'Estilo de noticiero televisivo, sujeto en encuadre de presentador, barra informativa audaz en la parte inferior con titular, composición de autoridad',
]

export function buildImagePrompt(angle, project, brandingKit, knowledge) {
  const tipo = angle?.tipo || 'dolor'
  const textoImagen = angle?.texto_imagen || angle?.headline || ''
  const subtexto = angle?.titulo || angle?.copy || ''

  const producto = project?.producto || project?.nombre || 'el producto'
  const generoLabel = brandingKit?.genero || 'Todos (mixto)'
  const edadLabel = brandingKit?.edad_desde && brandingKit?.edad_hasta
    ? `${brandingKit.edad_desde} a ${brandingKit.edad_hasta} años`
    : '25 a 45 años'
  const mercadoLabel = brandingKit?.mercado === 'Otro (especificar)'
    ? (brandingKit?.mercado_personalizado || 'mercado personalizado')
    : (brandingKit?.mercado || 'Latinoamérica')
  const descripcionPublico = brandingKit?.publico_detallado || ''
  const coloresHex = brandingKit?.colores?.length > 0
    ? brandingKit.colores.join(', ')
    : '#7c3aed'
  const estiloLabel = brandingKit?.estilo || 'agresivo'
  const tonoLabel = brandingKit?.tono || 'directo y urgente'

  const sujeto = construirDescripcionSujeto(brandingKit)
  const escena = ESCENA_POR_ANGULO[tipo] || ESCENA_POR_ANGULO.dolor
  const fondoEstilo = ESTILO_FONDO[estiloLabel] || ESTILO_FONDO.agresivo

  // Composición especial para transformacion, normal para el resto
  const esTransformacion = tipo === 'transformacion'
  const composicionEspecial = esTransformacion
    ? extraerTransformacion(knowledge, project)
    : null

  const indiceComp = Math.abs((tipo.charCodeAt(0) || 0) + (textoImagen.charCodeAt(0) || 0)) % COMPOSICIONES.length
  const composicion = COMPOSICIONES[indiceComp]

  // Elementos visuales adicionales por tipo
  const EXTRAS_VISUALES = {
    dolor:         'símbolos de estrés y agobio, elementos visuales que transmiten presión y sobrecarga',
    resultado:     'panel de ganancias en pantalla, gráficos ascendentes, métricas de éxito visibles, números de ingresos',
    urgencia:      'elementos visuales de reloj o cuenta regresiva, acentos de color rojo intenso, energía de movimiento',
    precio:        'etiqueta de precio o insignia de descuento en porcentaje audaz, flechas de valor',
    garantia:      'insignia de escudo o sello de verificación en esquina, elemento visual de certificación de confianza',
    exclusividad:  'insignia VIP o elemento de corona, sensación de membresía exclusiva premium',
    social_proof:  'superposición gráfica de calificación con estrellas, diseño estilo testimonio, elementos de éxito comunitario',
    novedad:       'insignia o cinta de "NUEVO", efectos de brillo o destello, símbolos de innovación',
  }
  const extrasVisuales = EXTRAS_VISUALES[tipo] || ''

  const prompt = `INSTRUCCIÓN CRÍTICA DE IDIOMA: Este es un anuncio publicitario para audiencia hispanohablante. TODO el texto que aparezca en la imagen debe estar escrito en ESPAÑOL. Está PROHIBIDO usar inglés en cualquier parte de la imagen. Si el texto de un elemento no está en español, no lo incluyas. Esto incluye: titulares, subtítulos, etiquetas, insignias, barras de texto, botones, marcas de agua y cualquier otro texto visible.

Crea un creativo publicitario de alta conversión para Meta Ads (Facebook e Instagram) con las siguientes especificaciones:

FORMATO: Imagen cuadrada 1080x1080 píxeles, diseño gráfico audaz, estilo profesional de fotografía publicitaria ultra-realista

PRODUCTO: ${producto}
GÉNERO DEL PÚBLICO: ${generoLabel}
RANGO DE EDAD: ${edadLabel}
MERCADO OBJETIVO: ${mercadoLabel}
${descripcionPublico ? `DESCRIPCIÓN DEL CLIENTE IDEAL: ${descripcionPublico.substring(0, 250)}` : ''}

TEXTOS OBLIGATORIOS EN LA IMAGEN — TODO EN ESPAÑOL:
- TITULAR PRINCIPAL (tipografía grande y audaz, color blanco o amarillo brillante, sombra oscura gruesa para máximo contraste): "${textoImagen}"
- SUBTEXTO DE APOYO (tipografía más pequeña, blanco, legible, sombra sutil): "${subtexto}"
- Todos los textos deben ser de alto contraste, claramente legibles e integrados profesionalmente en el diseño
- El 35% inferior de la imagen debe ser naturalmente más oscuro para garantizar legibilidad del texto

SUJETO PRINCIPAL: ${sujeto}
EXPRESIÓN Y LENGUAJE CORPORAL: ${escena}

${esTransformacion ? composicionEspecial : `COMPOSICIÓN:
- ${composicion}
- Jerarquía visual fuerte: titular → sujeto → subtexto → insignia
- Composición optimizada para detener el scroll en redes sociales`}

ELEMENTOS DE DISEÑO VISUAL:
- Colores de acento de marca: ${coloresHex} — usar en insignias, bordes y elementos gráficos
- Metáforas visuales relacionadas con: ${producto}
- Elementos gráficos audaces: flechas, marcos de acento, bordes gráficos
${extrasVisuales ? `- ${extrasVisuales}` : ''}
- Insignia de credibilidad pequeña en esquina (con texto en español: "NUEVO", "PROBADO", símbolo de verificación o estrellas)
- Luces de acento de color sutil que coincidan con el ambiente de la escena

FONDO Y ESCENA:
- ${fondoEstilo}
- Debe transmitir alta energía y detener el scroll en el feed de redes sociales

ESTILO DE COMUNICACIÓN: ${tonoLabel}
ESTILO VISUAL: ${estiloLabel}

ILUMINACIÓN: Iluminación cinematográfica dramática, luz de contorno fuerte sobre el sujeto, luces de acento de color que combinen con la paleta de marca, ambiente oscuro y misterioso donde corresponda al estilo

CALIDAD:
- Estilo fotográfico ultra-realista, equivalente a resolución 8K
- Enfoque nítido en el rostro y parte superior del cuerpo del sujeto
- Colores vivos y saturados, alto contraste
- Sin marcas de agua, sin elementos borrosos, sin aspecto de foto de banco de imágenes genérica
- Sin artefactos de texto fuera de las áreas designadas
- Calidad de campaña publicitaria profesional de Meta Ads

REFERENCIA DE ESTILO: Creativos de Meta Ads de alto rendimiento de campañas de marketing digital de ${mercadoLabel} con máxima conversión — audaces, directos, de alta energía, emocionalmente poderosos y optimizados para conversión.

VERIFICACIÓN FINAL DE IDIOMA: Antes de generar la imagen, confirma que absolutamente todo el texto visible estará en español. Ninguna palabra en inglés debe aparecer en la imagen final. Si algún elemento visual requiere texto, ese texto debe estar en español.`

  console.log('[buildImagePrompt] tipo:', tipo, '| estilo:', estiloLabel, '| mercado:', mercadoLabel)
  console.log('[buildImagePrompt] sujeto:', sujeto)
  console.log('[buildImagePrompt] PROMPT FINAL:\n', prompt)

  return prompt
}
