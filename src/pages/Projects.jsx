import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ProjectCard from '../components/ui/ProjectCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import { isDemoMode, DEMO_PROJECTS } from '../lib/demo'

function NewProjectModal({ open, onClose, onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ nombre: '', descripcion: '', producto: '', publico: '', propuesta_valor: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setError('')
    setLoading(true)
    const { data, error: err } = await supabase
      .from('projects')
      .insert({ ...form, user_id: user.id })
      .select()
      .single()
    if (err) { setError(err.message); setLoading(false); return }
    onCreated(data)
    onClose()
    setForm({ nombre: '', descripcion: '', producto: '', publico: '', propuesta_valor: '' })
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Proyecto" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-status-error text-sm bg-status-error/10 border border-status-error/30 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="label">Nombre del proyecto *</label>
          <input className="input-field" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Campaña Q1 - Producto X" />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input-field resize-none" rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Breve descripción del proyecto..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Producto / Servicio</label>
            <input className="input-field" value={form.producto} onChange={e => set('producto', e.target.value)} placeholder="¿Qué vendes?" />
          </div>
          <div>
            <label className="label">Público Objetivo</label>
            <input className="input-field" value={form.publico} onChange={e => set('publico', e.target.value)} placeholder="¿A quién le vendes?" />
          </div>
        </div>
        <div>
          <label className="label">Propuesta de Valor</label>
          <textarea className="input-field resize-none" rows={2} value={form.propuesta_valor} onChange={e => set('propuesta_valor', e.target.value)} placeholder="¿Qué hace único a tu producto?" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {loading ? 'Creando...' : 'Crear Proyecto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { if (user) fetchProjects() }, [user])

  async function fetchProjects() {
    setLoading(true)
    if (isDemoMode()) { setProjects(DEMO_PROJECTS); setLoading(false); return }
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const filtered = projects.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.descripcion || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Proyectos</h1>
          <p className="text-text-secondary mt-1">{projects.length} proyecto{projects.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} />
          Nuevo Proyecto
        </button>
      </div>

      {projects.length > 0 && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="input-field pl-9 max-w-sm"
            placeholder="Buscar proyectos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Cargando proyectos..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={search ? 'Sin resultados' : 'Aún no tienes proyectos'}
          description={search ? 'Intenta con otro término de búsqueda' : 'Crea tu primer proyecto para comenzar a generar creativos publicitarios con IA'}
          action={!search && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={16} />
              Crear primer proyecto
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <NewProjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(p) => {
          setProjects(prev => [p, ...prev])
          navigate(`/projects/${p.id}`)
        }}
      />
    </div>
  )
}
