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
  const tonoLabel = brandingKit?.tono || 'directo y urgente'
  const extractoKnowledge = knowledge?.contenido?.substring(0, 400) || ''

  const sujeto = construirSujeto(brandingKit)
  const expresion = EXPRESION_POR_TIPO[tipo] || EXPRESION_POR_TIPO.dolor

  // Para transformacion usamos siempre la composición dividida (índice 4)
  const compIndex = tipo === 'transformacion' ? 4 : (variationIndex % (COMPOSICIONES.length - 1))
  const composicion = COMPOSICIONES[compIndex]

  const contextoProducto = extractoKnowledge
    ? `El negocio es ${project?.nombre || producto} y ofrece ${producto}. Contexto adicional: ${extractoKnowledge}`
    : `El negocio ofrece ${producto}.`

  const estilosVisualesForzados = [
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
      descripcion: `Fotografía dinámica con fondo de color sólido vibrante pero NO oscuro. Amarillo mostaza, naranja cálido, rojo coral o verde esmeralda. Persona en pose dinámica y energética. Iluminación de estudio colorida pero sin neón. Estilo campaña publicitaria moderna y atrevida.`,
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

  const estiloForzado = estilosVisualesForzados[variationIndex % estilosVisualesForzados.length]

  const prompt = `Crea una fotografía publicitaria profesional para un anuncio de Facebook e Instagram. La imagen debe verse exactamente como un anuncio real de alta conversión que aparecería en el feed de Meta Ads, no como un boceto ni una descripción.

${contextoProducto}

ESTILO VISUAL OBLIGATORIO — aplica exactamente este estilo, sin desviarte:
${estiloForzado.descripcion}

La imagen muestra a ${sujeto} con ${expresion}.

${composicion}

Sobre la imagen aparecen estos textos publicitarios en español:
El titular principal aparece en letras grandes, negritas y de alto contraste: "${textoImagen}"
${subtextoImagen ? `El texto secundario aparece en letras más pequeñas pero legibles: "${subtextoImagen}"` : ''}
Un botón de llamada a la acción dice: "${cta}"

Los colores de acento de la marca son ${colores}. Úsalos en el botón de llamada a la acción, en bordes decorativos o en elementos gráficos de la imagen.

La imagen final debe verse como una fotografía publicitaria profesional de alta calidad para redes sociales, con una composición que detiene el scroll. Tono del anuncio: ${tonoLabel}. Sin marcas de agua. Sin texto en inglés. Sin texto técnico ni descriptivo visible. Sin etiquetas de formato ni especificaciones. Únicamente la imagen publicitaria terminada con los textos en español indicados arriba.`

  console.log('[buildImagePrompt] tipo:', tipo, '| negocio:', tipoNegocio, '| variación:', variationIndex + 1, '| estilo:', estiloForzado.nombre, '| comp:', compIndex)
  console.log('[buildImagePrompt] titular:', textoImagen)
  console.log('[buildImagePrompt] PROMPT:\n', prompt)

  return prompt
}
