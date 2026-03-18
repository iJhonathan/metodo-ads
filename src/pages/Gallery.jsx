import { useEffect, useState } from 'react'
import {
  Images, CheckCircle2, XCircle, Clock,
  Download, Filter, FolderKanban, TrendingUp,
  LayoutGrid, Search, ChevronDown, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { downloadCreativesAsZip } from '../lib/download'
import { useAuth } from '../contexts/AuthContext'
import GalleryCard from '../components/ui/GalleryCard'
import { DEMO_MODE, DEMO_CREATIVES, DEMO_PROJECTS } from '../lib/demo'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'

const ESTADO_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'aprobado',   label: 'Aprobados' },
  { value: 'pendiente',  label: 'Pendientes' },
  { value: 'descartado', label: 'Descartados' },
]

function TopProjectsBar({ projects }) {
  if (!projects.length) return null
  const max = projects[0]?.count || 1
  return (
    <div className="card mb-6">
      <h3 className="text-text-primary font-semibold text-sm mb-4 flex items-center gap-2">
        <FolderKanban size={15} className="text-accent-light" />
        Creativos por proyecto
      </h3>
      <div className="space-y-2.5">
        {projects.slice(0, 5).map(p => (
          <div key={p.id} className="flex items-center gap-3">
            <span className="text-text-secondary text-xs w-28 truncate flex-shrink-0">{p.nombre}</span>
            <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-accent rounded-full transition-all duration-500"
                style={{ width: `${Math.round((p.count / max) * 100)}%` }}
              />
            </div>
            <span className="text-text-muted text-xs w-6 text-right flex-shrink-0">{p.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Gallery() {
  const { user } = useAuth()
  const [creatives, setCreatives] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEstado, setFilterEstado] = useState('todos')
  const [filterProject, setFilterProject] = useState('todos')
  const [search, setSearch] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { if (user) fetchAll() }, [user])

  async function fetchAll() {
    setLoading(true)
    if (DEMO_MODE) {
      const enriched = DEMO_CREATIVES.map(c => ({ ...c, project_name: c.projects?.nombre }))
      setCreatives(enriched)
      setProjects(DEMO_PROJECTS)
      setLoading(false)
      return
    }
    const [creativesRes, projectsRes] = await Promise.all([
      supabase
        .from('creatives')
        .select('*, angles(tipo, headline, copy), projects(nombre)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('projects')
        .select('id, nombre')
        .eq('user_id', user.id)
        .order('nombre'),
    ])

    const enriched = (creativesRes.data || []).map(c => ({
      ...c,
      project_name: c.projects?.nombre,
    }))
    setCreatives(enriched)
    setProjects(projectsRes.data || [])
    setLoading(false)
  }

  // Build project stats for bar chart
  const projectStats = projects.map(p => ({
    ...p,
    count: creatives.filter(c => c.project_id === p.id).length,
  })).filter(p => p.count > 0).sort((a, b) => b.count - a.count)

  // Global stats
  const stats = {
    total:      creatives.length,
    aprobados:  creatives.filter(c => c.estado === 'aprobado').length,
    pendientes: creatives.filter(c => c.estado === 'pendiente').length,
    descartados:creatives.filter(c => c.estado === 'descartado').length,
    proyectos:  new Set(creatives.map(c => c.project_id)).size,
    tasaAprobacion: creatives.length > 0
      ? Math.round((creatives.filter(c => c.estado === 'aprobado').length / creatives.length) * 100)
      : 0,
  }

  // Filtered
  const filtered = creatives.filter(c => {
    if (filterEstado !== 'todos' && c.estado !== filterEstado) return false
    if (filterProject !== 'todos' && c.project_id !== filterProject) return false
    if (search) {
      const q = search.toLowerCase()
      const headline = c.angles?.headline?.toLowerCase() || ''
      const project = c.project_name?.toLowerCase() || ''
      if (!headline.includes(q) && !project.includes(q)) return false
    }
    return true
  })

  const handleDownloadZip = async () => {
    setDownloading(true)
    const toDownload = filtered.filter(c => c.imagen_url)
    await downloadCreativesAsZip(toDownload, 'galeria-metodo-ads.zip')
    setDownloading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" label="Cargando galería..." />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/15 border border-accent/20">
              <Images size={22} className="text-accent-light" />
            </div>
            Galería Global
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Todos tus creativos en un solo lugar, de todos tus proyectos.
          </p>
        </div>
        {filtered.some(c => c.imagen_url) && (
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="btn-secondary disabled:opacity-50"
          >
            <Download size={15} />
            {downloading ? 'Preparando ZIP...' : 'Descargar selección'}
          </button>
        )}
      </div>

      {creatives.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Galería vacía"
          description="Aún no has generado creativos. Ve a la Fábrica Creativa para comenzar."
        />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total',         value: stats.total,            color: 'text-text-primary' },
              { label: 'Aprobados',     value: stats.aprobados,        color: 'text-status-success' },
              { label: 'Pendientes',    value: stats.pendientes,       color: 'text-status-warning' },
              { label: 'Descartados',   value: stats.descartados,      color: 'text-status-error' },
              { label: 'Proyectos',     value: stats.proyectos,        color: 'text-accent-light' },
              { label: 'Tasa aprobac.', value: `${stats.tasaAprobacion}%`, color: 'text-status-info' },
            ].map(s => (
              <div key={s.label} className="card py-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-text-muted text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Project distribution */}
          <TopProjectsBar projects={projectStats} />

          {/* Search + Filters */}
          <div className="card mb-5 space-y-4">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por headline o proyecto..."
                  className="input-field pl-9"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary text-sm flex-shrink-0 ${showFilters ? 'border-accent/50 text-accent-light' : ''}`}
              >
                <Filter size={14} />
                Filtros
                <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
                {/* Estado */}
                <div className="flex-1 min-w-48">
                  <label className="label text-xs">Estado</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ESTADO_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => setFilterEstado(o.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${filterEstado === o.value
                            ? 'bg-accent text-white shadow-glow-sm'
                            : 'bg-background border border-border text-text-secondary hover:border-border-hover'
                          }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Proyecto */}
                <div className="flex-1 min-w-48">
                  <label className="label text-xs">Proyecto</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setFilterProject('todos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${filterProject === 'todos'
                          ? 'bg-accent text-white shadow-glow-sm'
                          : 'bg-background border border-border text-text-secondary hover:border-border-hover'
                        }`}
                    >
                      Todos
                    </button>
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setFilterProject(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${filterProject === p.id
                            ? 'bg-accent text-white shadow-glow-sm'
                            : 'bg-background border border-border text-text-secondary hover:border-border-hover'
                          }`}
                      >
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                {(filterEstado !== 'todos' || filterProject !== 'todos' || search) && (
                  <button
                    onClick={() => { setFilterEstado('todos'); setFilterProject('todos'); setSearch('') }}
                    className="btn-ghost text-xs self-end py-2"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-muted text-xs">
              {filtered.length} creativo{filtered.length !== 1 ? 's' : ''}
              {(filterEstado !== 'todos' || filterProject !== 'todos' || search) && ' (filtrados)'}
            </p>
          </div>

          {/* Gallery grid */}
          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-text-secondary text-sm mb-2">Sin resultados</p>
              <button
                onClick={() => { setFilterEstado('todos'); setFilterProject('todos'); setSearch('') }}
                className="btn-ghost text-xs"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(c => (
                <GalleryCard key={c.id} creative={c} showProject={true} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
