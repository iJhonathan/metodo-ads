/**
 * buildImagePrompt — Prompt NARRATIVO en español para Google AI Studio Imagen 4.
 * Sin etiquetas técnicas en inglés que Gemini pueda copiar como texto en la imagen.
 *
 * @param {object} angle       — Ángulo generado por Claude
 * @param {object} project     — Proyecto del usuario
 * @param {object} brandingKit — Branding kit con campos de audiencia
 * @param {object} knowledge   — Base de conocimiento del proyecto
 * @param {number} variationIndex — Índice de composición (0-4)
 * @returns {string}           — Prompt narrativo listo para Imagen 4
 */

// ── Composiciones narrativas (sin etiquetas técnicas) ────────────────────
const COMPOSICIONES = [
  `La persona está ubicada en el tercio izquierdo de la imagen mirando a cámara. El texto del anuncio aparece en el lado derecho sobre fondo oscuro semitransparente.`,
  `La persona está centrada en la imagen. El titular del anuncio aparece en la parte superior y el subtexto en la parte inferior, ambos sobre franjas oscuras semitransparentes.`,
  `El titular ocupa el tercio superior de la imagen en tipografía muy grande y negrita. La persona aparece en la mitad inferior con expresión poderosa.`,
  `La imagen tiene estilo de noticia urgente. Hay una franja de color sólido en la parte inferior con el texto del anuncio. La persona ocupa el fondo completo con expresión de autoridad.`,
  `La imagen está dividida en dos mitades verticales con una línea divisoria clara. La mitad izquierda muestra el estado negativo con la palabra "ANTES" en español, colores fríos y expresión de problema. La mitad derecha muestra el resultado positivo con la palabra "DESPUÉS" en español, colores cálidos y expresión de éxito.`,
]

// ── Expresión y emoción según tipo de ángulo ─────────────────────────────
const EXPRESION_POR_TIPO = {
  dolor:         'expresión de frustración genuina y reconocible, ceño fruncido, gesto de agotamiento o desesperación, lenguaje corporal que transmite el problema',
  curiosidad:    'expresión de sorpresa e intriga, ceja levantada, gesto de señalar o mostrar algo interesante, ojos muy abiertos',
  resultado:     'expresión de felicidad y orgullo genuino, sonrisa amplia y auténtica, postura de celebración o satisfacción total',
  objecion:      'expresión segura y confiada, postura abierta y empoderada, brazos extendidos hacia el espectador con confianza',
  miedo:         'expresión de preocupación y urgencia, mirando hacia el lado con ansiedad, lenguaje corporal tenso',
  transformacion:'contraste emocional claro entre estado negativo en la mitad izquierda y estado positivo en la mitad derecha',
  urgencia:      'expresión de energía y acción inmediata, postura dinámica inclinada hacia adelante, transmite necesidad de actuar ya',
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

// ── Ambiente y escena según tipo de negocio ──────────────────────────────
const ESCENA_POR_NEGOCIO = {
  salon_belleza: `ambiente de salón de belleza moderno y elegante, espejos con iluminación profesional cálida, productos de cabello visibles al fondo, silla de peluquería o tocador, colores cálidos y sofisticados`,
  curso_digital: `ambiente de home office moderno y minimalista, laptop abierta con pantalla visible al fondo, iluminación de contenido digital, estantería ordenada, sensación de productividad y éxito online`,
  ecommerce:     `fondo limpio y moderno tipo estudio fotográfico, producto del negocio visible y destacado, iluminación de estudio profesional, colores neutros o de marca`,
  restaurante:   `ambiente gastronómico cálido y apetitoso, iluminación de restaurante elegante, colores cálidos y estimulantes, sensación de buena comida y experiencia`,
  fitness:       `gimnasio o espacio de entrenamiento moderno, equipos de ejercicio visibles, iluminación dinámica y energética, sensación de fuerza y movimiento`,
  inmobiliaria:  `espacio interior moderno y aspiracional, iluminación natural abundante, diseño de interiores elegante, sensación de hogar de ensueño`,
  agencia:       `oficina moderna y creativa, ambiente de trabajo dinámico, pantallas con diseños visibles, atmósfera profesional e innovadora`,
  retail:        `tienda moderna y bien iluminada, productos expuestos atractivamente, ambiente de compra agradable y aspiracional`,
  medico:        `consultorio o clínica moderna y confiable, ambiente limpio y profesional, iluminación de salud y bienestar, colores que transmiten confianza y cuidado`,
  otro:          `fondo profesional cinematográfico que representa el sector del negocio, iluminación dramática de alta calidad, ambiente que conecta emocionalmente con el público objetivo`,
}

// ── Estilo visual y paleta según branding ────────────────────────────────
const ESTILO_VISUAL = {
  agresivo:    `estilo oscuro y de alto impacto con luces de neón violeta y azul eléctrico, sensación cinematográfica de alta energía, contrastes muy pronunciados`,
  moderno:     `estilo moderno y limpio con degradados azul marino a negro, elementos geométricos sutiles, sensación profesional y contemporánea`,
  minimalista: `estilo minimalista con fondo blanco o gris claro, diseño limpio sin elementos distractores, enfoque en el sujeto y el mensaje`,
  elegante:    `estilo de lujo con fondos oscuros y acentos dorados, atmósfera sofisticada y premium, iluminación suave y cinematográfica`,
  vintage:     `estilo retro con tonos cálidos ámbar y sepia, textura de grano fotográfico, atmósfera nostálgica y auténtica`,
  bold:        `estilo atrevido con colores muy saturados y complementarios, elementos gráficos dinámicos, máxima energía visual`,
  corporativo: `estilo corporativo serio con entorno de oficina limpia, tonos azules y grises confiables, atmósfera formal y profesional`,
  lifestyle:   `estilo de vida auténtico con luz natural dorada, entorno cotidiano y cercano, sensación cálida y real`,
}

// ── Apariencia del sujeto según mercado ──────────────────────────────────
function construirSujeto(brandingKit) {
  const generoMap = { 'Mujeres': 'una mujer', 'Hombres': 'un hombre', 'Todos (mixto)': 'una persona' }
  const genero = generoMap[brandingKit?.genero] || 'una persona'

  const edad = brandingKit?.edad_desde && brandingKit?.edad_hasta
    ? `de entre ${brandingKit.edad_desde} y ${brandingKit.edad_hasta} años`
    : 'de entre 25 y 45 años'

  const mercadoKey = brandingKit?.mercado === 'Otro (especificar)' ? 'Otro' : brandingKit?.mercado
  const aparienciaMap = {
    'Latinoamérica (América Latina)': 'de apariencia latinoamericana, rasgos cálidos y cercanos, reconocible para la audiencia latina',
    'España': 'de apariencia española o europea mediterránea, reconocible para audiencia española',
    'Estados Unidos (español)': 'de apariencia hispana americana, diversa y moderna, reconocible para latinos en Estados Unidos',
    'Europa hispanohablante': 'de apariencia europea hispanohablante, reconocible para el mercado europeo de habla hispana',
    'Global hispanohablante': 'de apariencia neutral y universalmente atractiva, reconocible para cualquier hispanohablante',
    'Otro': `de apariencia reconocible para ${brandingKit?.mercado_personalizado || 'el mercado objetivo'}`,
  }
  return `${genero} ${edad}, ${aparienciaMap[mercadoKey] || 'de apariencia atractiva y profesional'}`
}

export function buildImagePrompt(angle, project, brandingKit, knowledge, variationIndex = 0) {
  const tipo = angle?.tipo || 'dolor'
  const textoImagen = (angle?.texto_imagen || '').trim()
  const subtextoImagen = (angle?.subtexto_imagen || '').trim()
  const cta = (angle?.cta || 'MÁS INFO').toUpperCase()

  const producto = project?.producto || project?.nombre || 'el producto'
  const tipoNegocio = project?.tipo_negocio || 'otro'
  const colores = brandingKit?.colores?.length > 0 ? brandingKit.colores.join(', ') : '#7c3aed'
  const estiloLabel = brandingKit?.estilo || 'agresivo'
  const tonoLabel = brandingKit?.tono || 'directo y urgente'
  const extractoKnowledge = knowledge?.contenido?.substring(0, 400) || ''

  const sujeto = construirSujeto(brandingKit)
  const expresion = EXPRESION_POR_TIPO[tipo] || EXPRESION_POR_TIPO.dolor
  const escena = ESCENA_POR_NEGOCIO[tipoNegocio] || ESCENA_POR_NEGOCIO.otro
  const estiloVisual = ESTILO_VISUAL[estiloLabel] || ESTILO_VISUAL.agresivo

  // Para transformacion usamos siempre la composición dividida (índice 4)
  const compIndex = tipo === 'transformacion' ? 4 : (variationIndex % (COMPOSICIONES.length - 1))
  const composicion = COMPOSICIONES[compIndex]

  const contextoProducto = extractoKnowledge
    ? `El negocio es ${project?.nombre || producto} y ofrece ${producto}. Contexto adicional: ${extractoKnowledge}`
    : `El negocio ofrece ${producto}.`

  const prompt = `Crea una fotografía publicitaria profesional para un anuncio de Facebook e Instagram. La imagen debe verse exactamente como un anuncio real de alta conversión que aparecería en el feed de Meta Ads, no como un boceto ni una descripción.

${contextoProducto}

La imagen muestra a ${sujeto} con ${expresion}. Esta persona está en el siguiente ambiente: ${escena}.

${composicion}

Sobre la imagen aparecen estos textos publicitarios en español:
El titular principal aparece en letras grandes, negritas y de alto contraste: "${textoImagen}"
${subtextoImagen ? `El texto secundario aparece en letras más pequeñas pero legibles: "${subtextoImagen}"` : ''}
Un botón de llamada a la acción dice: "${cta}"

Los colores de acento de la marca son ${colores}. Úsalos en el botón de llamada a la acción, en bordes decorativos o en elementos gráficos de la imagen.

El estilo general de la imagen es ${estiloVisual} con tono ${tonoLabel}.

La imagen final debe verse como una fotografía publicitaria profesional de alta calidad para redes sociales, con iluminación cinematográfica dramática, colores vibrantes y saturados, y una composición que detiene el scroll. Sin marcas de agua. Sin texto en inglés. Sin texto técnico ni descriptivo visible. Sin etiquetas de formato ni especificaciones. Únicamente la imagen publicitaria terminada con los textos en español indicados arriba.`

  console.log('[buildImagePrompt] tipo:', tipo, '| negocio:', tipoNegocio, '| estilo:', estiloLabel, '| comp:', compIndex)
  console.log('[buildImagePrompt] titular:', textoImagen)
  console.log('[buildImagePrompt] PROMPT:\n', prompt)

  return prompt
}
