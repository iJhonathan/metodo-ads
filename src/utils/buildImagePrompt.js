/**
 * buildImagePrompt — Genera el prompt para Gemini usando los textos
 * pregenerados por Claude. Gemini solo genera la imagen visual.
 *
 * @param {object} textos      — { titularImagen, subtextoImagen, ctaImagen } de Claude
 * @param {string} angleKey    — tipo de ángulo (dolor, resultado, etc.)
 * @param {object} project     — Proyecto del usuario
 * @param {object} branding    — Branding kit con campos de audiencia
 * @param {number} variationIndex — Índice para rotar estilos (0-N)
 * @returns {string}           — Prompt para Gemini
 */

// ── Expresión y emoción según tipo de ángulo ─────────────────────────────
const EXPRESION_POR_TIPO = {
  dolor:         'expresión de frustración genuina y reconocible, ceño fruncido, gesto de agotamiento o desesperación',
  curiosidad:    'expresión de sorpresa e intriga, ceja levantada, gesto de señalar algo interesante, ojos muy abiertos',
  resultado:     'expresión de felicidad y orgullo genuino, sonrisa amplia y auténtica, postura de celebración o satisfacción total',
  objecion:      'expresión segura y confiada, postura abierta y empoderada, brazos extendidos hacia el espectador',
  miedo:         'expresión de preocupación y urgencia, mirando hacia el lado con ansiedad, lenguaje corporal tenso',
  transformacion:'contraste emocional claro entre estado negativo en la mitad izquierda y estado positivo en la mitad derecha',
  urgencia:      'expresión de energía y acción inmediata, postura dinámica inclinada hacia adelante',
  comparacion:   'expresión de contraste y evaluación, señalando la diferencia entre dos opciones con gestos claros',
  testimonio:    'expresión auténtica de satisfacción de cliente real, sonrisa natural y cercana, transmite confianza genuina',
  educativo:     'expresión de conocimiento y compromiso, explicando con manos, postura de experto que enseña',
  provocacion:   'expresión retadora y directa hacia el espectador, mirada desafiante, postura de confrontación amigable',
  identidad:     'expresión de orgullo e identidad fuerte, mirada poderosa y directa, postura segura y empoderada',
  garantia:      'expresión de total confianza y seguridad, gesto de mano abierta tranquilizador, transmite solidez',
  precio:        'expresión de sorpresa positiva ante una oferta increíble, señalando el precio con entusiasmo',
  exclusividad:  'expresión de distinción y privilegio, postura sofisticada, transmite acceso a algo especial',
  social_proof:  'expresión orgullosa mostrando resultados, sonrisa de satisfacción, estilo de testimonio auténtico',
  novedad:       'expresión de emoción ante algo nuevo y revelador, sorpresa positiva, postura de descubrimiento',
  aspiracional:  'expresión soñadora y esperanzadora, mirada hacia el horizonte, transmite logro del estilo de vida deseado',
  humor:         'expresión divertida y cercana, sonrisa natural exagerada, postura cómica pero reconocible',
  autoridad:     'expresión de expertise y profesionalismo, postura de autoridad, transmite credibilidad máxima',
}

// ── Estilos visuales fotográficos (anti-neón, rotativos) ─────────────────
const ESTILOS_VISUALES = [
  {
    nombre: 'editorial_revista',
    descripcion: `Fotografía editorial estilo revista de moda o belleza. Fondo blanco o crema liso de estudio. Iluminación suave y difusa de tres puntos. Colores claros, limpios y elegantes. Cero elementos oscuros. Cero neón. Cero tecnología. Estilo Vogue o Harper's Bazaar.`,
  },
  {
    nombre: 'lifestyle_exterior',
    descripcion: `Fotografía lifestyle de exterior durante el día. Luz natural de sol o nublado suave. Fondo urbano o natural completamente desenfocado (bokeh). Colores naturales y vibrantes. Sensación de libertad y vida real. Cero elementos de estudio. Cero neón. Cero fondo oscuro.`,
  },
  {
    nombre: 'calido_hogar',
    descripcion: `Fotografía en interior de hogar cálido y acogedor. Luz cálida de ventana o lámpara. Colores tierra, beige, madera y blanco roto. Ambiente íntimo y cercano. Estilo lifestyle de hogar moderno. Cero neón. Cero fondo negro. Cero tecnología.`,
  },
  {
    nombre: 'minimalista_pastel',
    descripcion: `Fotografía minimalista con fondo de color pastel liso. Rosa palo, verde menta, azul cielo o lavanda. Iluminación uniforme y suave. Composición limpia y simple. Estilo moderno y femenino. Cero oscuridad. Cero neón. Máximo minimalismo.`,
  },
  {
    nombre: 'premium_lujo',
    descripcion: `Fotografía de producto o persona en ambiente premium. Mármol, flores blancas, detalles dorados o plateados. Iluminación suave y elegante. Colores neutros sofisticados. Sensación de exclusividad y lujo accesible. Cero neón. Cero tecnología. Pura elegancia.`,
  },
  {
    nombre: 'dinamico_colorido',
    descripcion: `Fotografía dinámica con fondo de color sólido vibrante pero NO oscuro. Amarillo mostaza, naranja cálido, rojo coral o verde esmeralda. Persona en pose dinámica y energética. Iluminación de estudio colorida pero sin neón. Estilo campaña publicitaria moderna.`,
  },
  {
    nombre: 'natural_organico',
    descripcion: `Fotografía en ambiente natural u orgánico. Plantas, flores, madera, piedra o agua de fondo. Luz natural suave. Colores verdes, tierra y naturales. Sensación de bienestar, salud y naturaleza. Cero artificialidad. Cero neón. Cero tecnología.`,
  },
  {
    nombre: 'profesional_corporativo',
    descripcion: `Fotografía en ambiente de oficina moderna o coworking. Luz natural de ventana grande. Colores blancos, grises y azules. Persona bien vestida y segura. Ambiente de profesionalismo y confianza. Cero neón. Estilo corporativo moderno.`,
  },
  {
    nombre: 'cercano_testimonial',
    descripcion: `Fotografía estilo testimonio real de cliente satisfecho. Ambiente casual de casa o café. Luz natural. Expresión auténtica y genuina. Sensación de persona real compartiendo su experiencia. Cero producción exagerada. Cero neón. Máxima autenticidad.`,
  },
  {
    nombre: 'dramatico_contraste',
    descripcion: `Fotografía con iluminación dramática pero SIN neón. Claroscuro elegante. Un solo foco de luz cálida sobre fondo oscuro neutro (negro o gris oscuro sin colores). Estilo retrato artístico. Sin luces de color. Solo luz y sombra natural dramática.`,
  },
]

// ── Estilos tipográficos / layout de texto (rotativos) ───────────────────
const ESTILOS_TEXTO = [
  `UBICACIÓN DEL TEXTO: Franja oscura semitransparente en la parte inferior de la imagen. Titular en letras grandes bold blancas arriba, subtexto en letras medianas blancas debajo, botón CTA con fondo de color de marca al final.`,
  `UBICACIÓN DEL TEXTO: Parte superior de la imagen sobre fondo oscuro semitransparente. Titular en letras muy grandes bold blancas. Subtexto en letras medianas debajo del titular. Persona en la mitad e inferior de la imagen.`,
  `UBICACIÓN DEL TEXTO: Lado derecho de la imagen en bloque vertical sobre panel semitransparente. Titular bold grande, subtexto pequeño debajo, botón CTA al final del bloque. Persona en el lado izquierdo.`,
  `UBICACIÓN DEL TEXTO: Franja horizontal de color sólido (usar color de marca) que atraviesa el centro de la imagen. Titular en blanco bold dentro de la franja. Persona asomando por arriba y por abajo. Subtexto debajo de la franja.`,
  `UBICACIÓN DEL TEXTO: Esquina inferior izquierda sobre fondo oscuro redondeado. Titular bold, subtexto pequeño debajo, botón CTA. Persona ocupa el resto de la imagen.`,
  `UBICACIÓN DEL TEXTO: Todo centrado verticalmente. Titular grande arriba, subtexto en el centro, botón CTA abajo. Persona de fondo con overlay oscuro suave para legibilidad.`,
  `UBICACIÓN DEL TEXTO: Estilo noticia. Franja negra en la parte superior con titular en blanco bold tipo titular de periódico. Imagen con persona en el centro. Franja inferior delgada con subtexto y CTA.`,
  `UBICACIÓN DEL TEXTO: Titular en letras muy grandes como elemento gráfico dominante en la parte superior, color de marca o blanco. Persona en el tercio inferior. Subtexto y CTA superpuestos sobre la persona.`,
  `UBICACIÓN DEL TEXTO: Panel lateral izquierdo de color sólido (color de marca) con texto en blanco. Titular bold grande, subtexto normal, CTA con fondo blanco y texto de color marca. Persona en el lado derecho.`,
  `UBICACIÓN DEL TEXTO: Titular en la parte superior con tipografía outline (solo borde) en color llamativo. Subtexto sólido debajo. Persona centrada. CTA en botón con color de marca en la parte inferior.`,
]

// ── Apariencia del sujeto según mercado ──────────────────────────────────
function construirSujeto(branding) {
  const generoMap = { 'Mujeres': 'una mujer', 'Hombres': 'un hombre', 'Todos (mixto)': 'una persona' }
  const genero = generoMap[branding?.genero] || 'una persona'

  const edad = branding?.edad_desde && branding?.edad_hasta
    ? `de entre ${branding.edad_desde} y ${branding.edad_hasta} años`
    : 'de entre 25 y 45 años'

  const mercadoKey = branding?.mercado === 'Otro (especificar)' ? 'Otro' : branding?.mercado
  const aparienciaMap = {
    'Latinoamérica (América Latina)': 'de apariencia latinoamericana, rasgos cálidos y cercanos, reconocible para la audiencia latina',
    'España': 'de apariencia española o europea mediterránea, reconocible para audiencia española',
    'Estados Unidos (español)': 'de apariencia hispana americana, diversa y moderna, reconocible para latinos en Estados Unidos',
    'Europa hispanohablante': 'de apariencia europea hispanohablante, reconocible para el mercado europeo de habla hispana',
    'Global hispanohablante': 'de apariencia neutral y universalmente atractiva, reconocible para cualquier hispanohablante',
    'Otro': `de apariencia reconocible para ${branding?.mercado_personalizado || 'el mercado objetivo'}`,
  }
  return `${genero} ${edad}, ${aparienciaMap[mercadoKey] || 'de apariencia atractiva y profesional'}`
}

export function buildImagePrompt({ textos, angleKey, project, branding, variationIndex = 0 }) {
  const tipo = angleKey || 'dolor'
  const titular  = (textos?.titularImagen  || '').trim()
  const subtexto = (textos?.subtextoImagen || '').trim()
  const cta      = (textos?.ctaImagen      || 'VER MÁS').trim()

  const producto    = project?.producto || project?.nombre || 'el producto'
  const tipoNegocio = project?.tipo_negocio || 'otro'
  const colores     = branding?.colores?.length > 0 ? branding.colores.join(', ') : '#7c3aed'
  const tonoLabel   = branding?.tono || 'directo y urgente'

  const sujeto   = construirSujeto(branding)
  const expresion = EXPRESION_POR_TIPO[tipo] || EXPRESION_POR_TIPO.dolor

  const estiloVisual = ESTILOS_VISUALES[variationIndex % ESTILOS_VISUALES.length]
  const estiloTexto  = ESTILOS_TEXTO[variationIndex % ESTILOS_TEXTO.length]

  console.log(`[buildImagePrompt] variación:${variationIndex + 1} | ángulo:${tipo} | negocio:${tipoNegocio} | visual:${estiloVisual.nombre}`)
  console.log(`[buildImagePrompt] titular:"${titular}" | subtexto:"${subtexto}" | cta:"${cta}"`)

  return `Eres un diseñador gráfico publicitario profesional especializado en anuncios para Meta Ads (Facebook e Instagram).

Crea una imagen publicitaria de alta conversión para el siguiente negocio.

NEGOCIO: ${project?.nombre || producto}
PRODUCTO: ${producto}
TIPO DE NEGOCIO: ${tipoNegocio}
PÚBLICO: ${sujeto}
COLORES DE MARCA: ${colores}
ÁNGULO DEL ANUNCIO: ${tipo}

AMBIENTE VISUAL OBLIGATORIO — aplica exactamente este estilo fotográfico:
${estiloVisual.descripcion}

PERSONA EN LA IMAGEN:
La imagen muestra a ${sujeto} con ${expresion}.

EL TEXTO QUE DEBES COLOCAR EN LA IMAGEN ES EXACTAMENTE ESTE — cópialo letra por letra, sin cambiar ni una sola letra, sin reinterpretar, sin corregir, sin modificar de ninguna manera:

TITULAR PRINCIPAL (cópialo exactamente): "${titular}"
— Letra grande, bold, alta visibilidad

SUBTEXTO (cópialo exactamente): "${subtexto}"
— Letra mediana, legible

BOTÓN CTA (cópialo exactamente): "${cta}"
— En botón con fondo de color de marca (${colores})

INSTRUCCIÓN CRÍTICA SOBRE EL TEXTO:
Estos textos están escritos en español correcto. Debes reproducirlos exactamente como están escritos, letra por letra. No cambies letras. No corrijas. No traduzcas. No inventes palabras. Si una palabra tiene acento, ponla con acento. Si no lo tiene, no la pongas.

${estiloTexto}

CALIDAD Y FORMATO:
Fotografía publicitaria ultra-realista, profesional, scroll-stopping. Tono: ${tonoLabel}. Sin marcas de agua. Todo texto en español. Ninguna palabra en inglés visible en la imagen final.`
}
