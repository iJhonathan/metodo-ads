export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@metodods.com',
}

export const DEMO_PROFILE = {
  id: 'demo-user-001',
  email: 'demo@metodods.com',
  nombre: 'Carlos Méndez',
  plan: 'pro',
  api_key_claude: 'sk-ant-demo',
  api_key_google: 'AIza-demo',
  created_at: '2024-11-01T00:00:00Z',
}

const now = new Date()
const d = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString()

export const DEMO_PROJECTS = [
  {
    id: 'proj-001',
    user_id: 'demo-user-001',
    nombre: 'Suplemento VitaMax',
    descripcion: 'Campaña de lanzamiento para suplemento natural de energía',
    producto: 'Suplemento energético natural',
    publico: 'Hombres 30-50 años, deportistas y ejecutivos',
    propuesta_valor: 'Energía sostenida sin cafeína ni efectos secundarios',
    created_at: d(20),
  },
  {
    id: 'proj-002',
    user_id: 'demo-user-001',
    nombre: 'Curso Trading Pro',
    descripcion: 'Embudo de ventas para curso de trading desde cero',
    producto: 'Curso online de trading',
    publico: 'Personas 25-45 años buscando ingresos extra',
    propuesta_valor: 'Metodología probada con +500 alumnos exitosos',
    created_at: d(14),
  },
  {
    id: 'proj-003',
    user_id: 'demo-user-001',
    nombre: 'Clínica Estética Bella',
    descripcion: 'Generación de leads para tratamientos faciales',
    producto: 'Tratamientos de rejuvenecimiento facial',
    publico: 'Mujeres 35-55 años preocupadas por su apariencia',
    propuesta_valor: 'Resultados visibles desde la primera sesión',
    created_at: d(7),
  },
]

export const DEMO_ANGLES = [
  { id: 'ang-001', project_id: 'proj-001', tipo: 'dolor', headline: '¿Cansado de llegar al mediodía sin energía para seguir?', copy: 'Millones de personas enfrentan el "bajón de las 3pm" cada día. No es falta de voluntad, es química. VitaMax restaura tus niveles de energía de forma natural, sin el crash de la cafeína.', visual_sugerido: 'Ejecutivo agotado frente a su pantalla a las 3pm, con ojeras y postura caída. Contraste con el mismo hombre activo y sonriente después de tomar VitaMax.', guardado: true, created_at: d(5) },
  { id: 'ang-002', project_id: 'proj-001', tipo: 'resultado', headline: 'Duplica tu productividad en 7 días o te devolvemos el dinero', copy: 'Nuestros clientes reportan un 47% más de energía sostenida durante el día. Sin nerviosismo, sin insomnio. Solo energía limpia que dura.', visual_sugerido: 'Antes y después: persona fatigada vs persona radiante en su oficina. Mostrar un reloj marcando distintas horas del día, todas con la misma energía.', guardado: true, created_at: d(5) },
  { id: 'ang-003', project_id: 'proj-001', tipo: 'curiosidad', headline: 'El truco que los atletas de élite usan para mantener energía todo el día', copy: '¿Qué tienen en común Djokovic, LeBron y los mejores ejecutivos del mundo? Todos controlan su energía de forma natural. Descubre el mismo método ahora.', visual_sugerido: 'Atleta de élite entrenando con intensidad. Overlay con fórmula molecular de los ingredientes naturales. Estética de high-performance y ciencia.', guardado: true, created_at: d(4) },
  { id: 'ang-004', project_id: 'proj-001', tipo: 'objecion', headline: 'No es otro energizante. No tiene cafeína. No da rebote.', copy: 'Ya sabemos lo que estás pensando. "Otro producto más". Pero VitaMax es diferente: sin estimulantes sintéticos, sin dependencia, sin el crash posterior. Solo resultados reales.', visual_sugerido: 'Comparativa visual: lata de energizante tachada vs frasco de VitaMax con check verde. Ingredientes naturales visibles y etiqueta limpia.', guardado: true, created_at: d(4) },
  { id: 'ang-005', project_id: 'proj-002', tipo: 'transformacion', headline: 'De 0 a mis primeros $3,000 en 60 días con trading', copy: 'Marco tenía 28 años, trabajaba 9 horas diarias y no tenía experiencia en finanzas. Hoy genera $3,200 extra al mes operando 2 horas por día.', visual_sugerido: 'Pantalla de computadora mostrando gráficos de trading en verde. Persona joven y sonriente trabajando desde casa con vista al mar o ciudad.', guardado: true, created_at: d(3) },
  { id: 'ang-006', project_id: 'proj-002', tipo: 'urgencia', headline: 'Solo 47 cupos disponibles para la cohorte de marzo', copy: 'No es marketing. Limitamos los grupos a 50 personas para garantizar atención personalizada. En la última cohorte, los cupos se agotaron en 48 horas.', visual_sugerido: 'Contador regresivo en pantalla. Últimos cupos marcados en rojo. Capturas de pantalla de alumnos celebrando sus primeras ganancias.', guardado: true, created_at: d(3) },
]

export const DEMO_CREATIVES = [
  { id: 'cr-001', angle_id: 'ang-001', project_id: 'proj-001', user_id: 'demo-user-001', imagen_url: null, estado: 'aprobado', created_at: d(3), angles: DEMO_ANGLES[0], projects: DEMO_PROJECTS[0] },
  { id: 'cr-002', angle_id: 'ang-002', project_id: 'proj-001', user_id: 'demo-user-001', imagen_url: null, estado: 'aprobado', created_at: d(3), angles: DEMO_ANGLES[1], projects: DEMO_PROJECTS[0] },
  { id: 'cr-003', angle_id: 'ang-003', project_id: 'proj-001', user_id: 'demo-user-001', imagen_url: null, estado: 'pendiente', created_at: d(2), angles: DEMO_ANGLES[2], projects: DEMO_PROJECTS[0] },
  { id: 'cr-004', angle_id: 'ang-004', project_id: 'proj-001', user_id: 'demo-user-001', imagen_url: null, estado: 'descartado', created_at: d(2), angles: DEMO_ANGLES[3], projects: DEMO_PROJECTS[0] },
  { id: 'cr-005', angle_id: 'ang-005', project_id: 'proj-002', user_id: 'demo-user-001', imagen_url: null, estado: 'aprobado', created_at: d(1), angles: DEMO_ANGLES[4], projects: DEMO_PROJECTS[1] },
  { id: 'cr-006', angle_id: 'ang-006', project_id: 'proj-002', user_id: 'demo-user-001', imagen_url: null, estado: 'pendiente', created_at: d(1), angles: DEMO_ANGLES[5], projects: DEMO_PROJECTS[1] },
]

export const DEMO_USAGE = { creativos_generados: 47, mes: now.toISOString().slice(0, 7) }

export const DEMO_BRANDING = {
  id: 'brand-001',
  project_id: 'proj-001',
  colores: ['#7c3aed', '#10b981', '#1a1a2e', '#f59e0b'],
  tono: 'urgente',
  estilo: 'moderno',
  publico_detallado: 'Hombres 30-50 años, ejecutivos y deportistas aficionados, con poder adquisitivo medio-alto, frustrados con la falta de energía durante su jornada laboral.',
}

export const DEMO_KNOWLEDGE = {
  id: 'know-001',
  project_id: 'proj-001',
  contenido: `VitaMax es un suplemento de energía 100% natural formulado con ingredientes premium:

**Ingredientes clave:**
- Ashwagandha KSM-66: reduce el cortisol y mejora la respuesta al estrés
- Maca andina: aumenta la energía y el rendimiento físico
- Vitamina B12: esencial para el metabolismo energético
- Rhodiola Rosea: adaptógeno para combatir la fatiga mental

**Beneficios comprobados:**
- Energía sostenida durante 6-8 horas sin cafeína
- Sin crash posterior ni insomnio
- Mejora la concentración y el foco mental
- Apoya el rendimiento deportivo

**Objeciones comunes:**
- "Ya probé muchos suplementos" → VitaMax usa KSM-66, la forma más biodisponible de ashwagandha
- "Es muy caro" → Costo por día: $0.63 vs $4-6 de cafés diarios`,
  updated_at: d(5),
}
