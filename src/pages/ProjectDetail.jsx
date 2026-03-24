import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, FolderKanban, Edit3, Trash2, Save, X,
  BookOpen, Palette, Lightbulb, Wand2, Calendar,
  Package, Users, Target, CheckCircle2, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'

const GRADIENT_COLORS = [
  'from-purple-600 to-violet-800',
  'from-blue-600 to-cyan-700',
  'from-emerald-600 to-teal-700',
  'from-rose-600 to-pink-700',
  'from-amber-600 to-orange-700',
  'from-indigo-600 to-blue-700',
]
function getGradient(id) {
  return GRADIENT_COLORS[(id?.charCodeAt(0) || 0) % GRADIENT_COLORS.length]
}
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const TIPOS_NEGOCIO = [
  { value: 'salon_belleza', label: 'Salón de belleza / Estética' },
  { value: 'curso_digital', label: 'Curso o producto digital' },
  { value: 'ecommerce', label: 'Tienda online / Ecommerce' },
  { value: 'restaurante', label: 'Restaurante / Gastronomía' },
  { value: 'fitness', label: 'Fitness / Entrenamiento / Salud' },
  { value: 'inmobiliaria', label: 'Inmobiliaria / Propiedades' },
  { value: 'agencia', label: 'Agencia de marketing / Servicios' },
  { value: 'retail', label: 'Tienda física / Retail' },
  { value: 'medico', label: 'Salud / Medicina / Bienestar' },
  { value: 'otro', label: 'Otro (usar descripción del producto)' },
]

function EditProjectModal({ project, open, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: project?.nombre || '',
    descripcion: project?.descripcion || '',
    producto: project?.producto || '',
    publico: project?.publico || '',
    propuesta_valor: project?.propuesta_valor || '',
    tipo_negocio: project?.tipo_negocio || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (project) setForm({
      nombre: project.nombre || '',
      descripcion: project.descripcion || '',
      producto: project.producto || '',
      publico: project.publico || '',
      propuesta_valor: project.propuesta_valor || '',
      tipo_negocio: project.tipo_negocio || '',
    })
  }, [project])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .update(form)
      .eq('id', project.id)
      .select()
      .single()
    if (!error) onSaved(data)
    onClose()
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Proyecto" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nombre *</label>
          <input className="input-field" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input-field resize-none" rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
        </div>
        <div>
          <label className="label">Tipo de negocio</label>
          <select className="input-field" value={form.tipo_negocio} onChange={e => set('tipo_negocio', e.target.value)}>
            <option value="">Seleccionar tipo...</option>
            {TIPOS_NEGOCIO.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Producto / Servicio</label>
            <input className="input-field" value={form.producto} onChange={e => set('producto', e.target.value)} />
          </div>
          <div>
            <label className="label">Público Objetivo</label>
            <input className="input-field" value={form.publico} onChange={e => set('publico', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Propuesta de Valor</label>
          <textarea className="input-field resize-none" rows={2} value={form.propuesta_valor} onChange={e => set('propuesta_valor', e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-50">
            <Save size={15} />
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function DeleteModal({ open, onClose, onConfirm, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Eliminar Proyecto" maxWidth="max-w-sm">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-status-error/10 border border-status-error/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-status-error" />
        </div>
        <p className="text-text-secondary text-sm mb-6">
          Esta acción eliminará el proyecto junto con todos sus ángulos, creativos y configuraciones. <strong className="text-text-primary">No se puede deshacer.</strong>
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 justify-center bg-status-error hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ModuleLink({ icon: Icon, label, description, path, color = 'accent' }) {
  const colorMap = {
    accent: 'border-accent/20 hover:border-accent/50 hover:bg-accent/5',
    warning: 'border-status-warning/20 hover:border-status-warning/50 hover:bg-status-warning/5',
    info: 'border-status-info/20 hover:border-status-info/50 hover:bg-status-info/5',
    success: 'border-status-success/20 hover:border-status-success/50 hover:bg-status-success/5',
  }
  const iconColor = {
    accent: 'text-accent-light bg-accent/15',
    warning: 'text-status-warning bg-status-warning/15',
    info: 'text-status-info bg-status-info/15',
    success: 'text-status-success bg-status-success/15',
  }
  return (
    <Link
      to={path}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${colorMap[color]}`}
    >
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconColor[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-medium text-sm">{label}</p>
        <p className="text-text-muted text-xs mt-0.5">{description}</p>
      </div>
      <ArrowLeft size={15} className="text-text-muted rotate-180" />
    </Link>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [stats, setStats] = useState({ angles: 0, creatives: 0, approved: 0 })
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hasBranding, setHasBranding] = useState(false)
  const [hasKnowledge, setHasKnowledge] = useState(false)

  useEffect(() => { if (id && user) fetchAll() }, [id, user])

  async function fetchAll() {
    setLoading(true)
    const [projRes, anglesRes, creativesRes, brandingRes, knowledgeRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('angles').select('id', { count: 'exact' }).eq('project_id', id),
      supabase.from('creatives').select('id, estado').eq('project_id', id),
      supabase.from('branding_kits').select('id').eq('project_id', id).maybeSingle(),
      supabase.from('knowledge_base').select('id, contenido').eq('project_id', id).maybeSingle(),
    ])

    if (projRes.error) { navigate('/projects'); return }
    setProject(projRes.data)

    const creatives = creativesRes.data || []
    setStats({
      angles: anglesRes.count || 0,
      creatives: creatives.length,
      approved: creatives.filter(c => c.estado === 'aprobado').length,
    })
    setHasBranding(!!brandingRes.data)
    setHasKnowledge(!!(knowledgeRes.data?.contenido?.trim()))
    setLoading(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('projects').delete().eq('id', id)
    navigate('/projects')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" label="Cargando proyecto..." />
      </div>
    )
  }

  if (!project) return null

  const gradient = getGradient(project.id)

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Back */}
      <button onClick={() => navigate('/projects')} className="btn-ghost text-sm mb-6 -ml-1">
        <ArrowLeft size={15} />
        Volver a Proyectos
      </button>

      {/* Header card */}
      <div className="card mb-6">
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-glow`}>
            {getInitials(project.nombre)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{project.nombre}</h1>
                {project.descripcion && (
                  <p className="text-text-secondary text-sm mt-1">{project.descripcion}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm py-1.5 px-3">
                  <Edit3 size={14} />
                  Editar
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="p-2 rounded-lg border border-border hover:border-status-error/50 text-text-muted hover:text-status-error transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3 text-text-muted text-xs">
              <Calendar size={12} />
              Creado el {new Date(project.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Project info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Package size={15} className="text-accent-light" />
            </div>
            <div>
              <p className="text-text-muted text-xs">Producto / Servicio</p>
              <p className="text-text-primary text-sm font-medium mt-0.5">{project.producto || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-status-info/10">
              <Users size={15} className="text-status-info" />
            </div>
            <div>
              <p className="text-text-muted text-xs">Público Objetivo</p>
              <p className="text-text-primary text-sm font-medium mt-0.5">{project.publico || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-status-success/10">
              <Target size={15} className="text-status-success" />
            </div>
            <div>
              <p className="text-text-muted text-xs">Propuesta de Valor</p>
              <p className="text-text-primary text-sm font-medium mt-0.5 line-clamp-2">{project.propuesta_valor || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Creativos totales', value: stats.creatives, color: 'text-status-info' },
          { label: 'Aprobados', value: stats.approved, color: 'text-status-success' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-text-muted text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Setup checklist */}
      <div className="card mb-6">
        <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 size={17} className="text-accent-light" />
          Configuración del Proyecto
        </h2>
        <div className="space-y-2.5">
          {[
            { label: 'Datos básicos del proyecto', done: true },
            { label: 'Base de Conocimiento configurada', done: hasKnowledge },
            { label: 'Branding Kit configurado', done: hasBranding },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-status-success/20 text-status-success' : 'bg-surface-3 border border-border text-text-muted'}`}>
                {item.done
                  ? <CheckCircle2 size={13} />
                  : <AlertCircle size={13} />
                }
              </div>
              <span className={`text-sm ${item.done ? 'text-text-primary' : 'text-text-secondary'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Module links */}
      <div>
        <h2 className="text-text-primary font-semibold mb-4">Módulos del Proyecto</h2>
        <div className="space-y-3">
          <ModuleLink
            icon={BookOpen}
            label="Base de Conocimiento"
            description="Agrega contexto sobre tu producto para mejores resultados"
            path={`/knowledge?project=${id}`}
            color="accent"
          />
          <ModuleLink
            icon={Palette}
            label="Branding Kit"
            description="Colores, tono y estilo visual de tu marca"
            path={`/branding?project=${id}`}
            color="warning"
          />
          <ModuleLink
            icon={Wand2}
            label="Fábrica Creativa"
            description="Genera creativos publicitarios de alto impacto para Meta Ads"
            path={`/factory?project=${id}`}
            color="success"
          />
        </div>
      </div>

      <EditProjectModal
        project={project}
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={(updated) => setProject(updated)}
      />
      <DeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
