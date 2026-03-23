import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart3, CheckCircle2, XCircle, Clock,
  Download, Filter, TrendingUp, Image as ImageIcon,
  LayoutGrid, LayoutList
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { downloadCreativesAsZip, downloadSingle } from '../lib/download'
import ProjectSelector from '../components/ui/ProjectSelector'
import GalleryCard from '../components/ui/GalleryCard'
import { isDemoMode, DEMO_CREATIVES } from '../lib/demo'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const ESTADOS = [
  { value: 'todos',      label: 'Todos',       icon: Filter },
  { value: 'aprobado',   label: 'Aprobados',   icon: CheckCircle2 },
  { value: 'pendiente',  label: 'Pendientes',  icon: Clock },
  { value: 'descartado', label: 'Descartados', icon: XCircle },
]

function StatMini({ icon: Icon, label, value, color }) {
  return (
    <div className="card py-4 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="flex items-center justify-center gap-1.5 mt-1.5 text-text-muted text-xs">
        <Icon size={12} />
        {label}
      </div>
    </div>
  )
}

function ApprovalBar({ approved, discarded, pending }) {
  const total = approved + discarded + pending
  if (total === 0) return null
  const pctApproved  = Math.round((approved  / total) * 100)
  const pctDiscarded = Math.round((discarded / total) * 100)
  const pctPending   = Math.round((pending   / total) * 100)

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-primary font-semibold text-sm flex items-center gap-2">
          <TrendingUp size={15} className="text-accent-light" />
          Distribución de estados
        </h3>
        <span className="text-text-muted text-xs">{total} creativos totales</span>
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex gap-0.5 mb-3">
        {pctApproved  > 0 && <div className="bg-status-success rounded-full transition-all" style={{ width: `${pctApproved}%` }} />}
        {pctPending   > 0 && <div className="bg-status-warning rounded-full transition-all" style={{ width: `${pctPending}%` }} />}
        {pctDiscarded > 0 && <div className="bg-status-error rounded-full transition-all"   style={{ width: `${pctDiscarded}%` }} />}
      </div>

      <div className="flex items-center gap-5 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-status-success" />
          <span className="text-text-secondary">Aprobados <strong className="text-status-success">{pctApproved}%</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-status-warning" />
          <span className="text-text-secondary">Pendientes <strong className="text-status-warning">{pctPending}%</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-status-error" />
          <span className="text-text-secondary">Descartados <strong className="text-status-error">{pctDiscarded}%</strong></span>
        </div>
      </div>
    </div>
  )
}

export default function Analysis() {
  const [searchParams] = useSearchParams()
  const [projectId, setProjectId] = useState(searchParams.get('project') || null)
  const [creatives, setCreatives] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterEstado, setFilterEstado] = useState('todos')
  const [gridSize, setGridSize] = useState('md')  // sm | md | lg
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (projectId) fetchCreatives(projectId)
    else setCreatives([])
  }, [projectId])

  async function fetchCreatives(pid) {
    setLoading(true)
    if (isDemoMode()) {
      setCreatives(DEMO_CREATIVES.filter(c => c.project_id === pid))
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('creatives')
      .select('*, angles(tipo, headline, copy, visual_sugerido)')
      .eq('project_id', pid)
      .order('created_at', { ascending: false })
    setCreatives(data || [])
    setLoading(false)
  }

  const filtered = filterEstado === 'todos'
    ? creatives
    : creatives.filter(c => c.estado === filterEstado)

  const stats = {
    total:      creatives.length,
    aprobados:  creatives.filter(c => c.estado === 'aprobado').length,
    pendientes: creatives.filter(c => c.estado === 'pendiente').length,
    descartados:creatives.filter(c => c.estado === 'descartado').length,
  }

  const handleDownloadZip = async () => {
    setDownloading(true)
    await downloadCreativesAsZip(
      filtered.filter(c => c.imagen_url),
      `creativos-proyecto-${filterEstado}.zip`
    )
    setDownloading(false)
  }

  const gridCols = {
    sm: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    md: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    lg: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-xl bg-status-info/15 border border-status-info/20">
              <BarChart3 size={22} className="text-status-info" />
            </div>
            Análisis Visual
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Revisa todos los creativos de un proyecto, filtra por estado y descarga.
          </p>
        </div>
      </div>

      {/* Project selector */}
      <div className="card mb-6">
        <label className="label">Proyecto</label>
        <ProjectSelector value={projectId} onChange={setProjectId} />
      </div>

      {!projectId ? (
        <EmptyState
          icon={BarChart3}
          title="Selecciona un proyecto"
          description="Elige un proyecto para ver el análisis de sus creativos generados"
        />
      ) : loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Cargando creativos..." />
        </div>
      ) : creatives.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Sin creativos aún"
          description="Este proyecto todavía no tiene creativos generados. Ve a la Fábrica Creativa para empezar."
        />
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatMini icon={ImageIcon}    label="Total"       value={stats.total}       color="text-text-primary" />
            <StatMini icon={CheckCircle2} label="Aprobados"   value={stats.aprobados}   color="text-status-success" />
            <StatMini icon={Clock}        label="Pendientes"  value={stats.pendientes}  color="text-status-warning" />
            <StatMini icon={XCircle}      label="Descartados" value={stats.descartados} color="text-status-error" />
          </div>

          {/* Distribution bar */}
          <ApprovalBar
            approved={stats.aprobados}
            discarded={stats.descartados}
            pending={stats.pendientes}
          />

          {/* Filter + controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            {/* Estado filter */}
            <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl p-1">
              {ESTADOS.map(e => {
                const Icon = e.icon
                return (
                  <button
                    key={e.value}
                    onClick={() => setFilterEstado(e.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${filterEstado === e.value
                        ? 'bg-accent text-white shadow-glow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    <Icon size={12} />
                    {e.label}
                    {e.value !== 'todos' && (
                      <span className={`text-xs px-1 rounded-full ${filterEstado === e.value ? 'bg-white/20 text-white' : 'bg-surface-3 text-text-muted'}`}>
                        {stats[e.value === 'aprobado' ? 'aprobados' : e.value === 'pendiente' ? 'pendientes' : 'descartados']}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              {/* Grid size */}
              <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
                {[
                  { key: 'sm', icon: LayoutGrid },
                  { key: 'md', icon: LayoutGrid },
                  { key: 'lg', icon: LayoutList },
                ].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setGridSize(key)}
                    className={`p-1.5 rounded transition-all ${gridSize === key ? 'bg-accent/20 text-accent-light' : 'text-text-muted hover:text-text-secondary'}`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>

              {/* Download ZIP */}
              {filtered.some(c => c.imagen_url) && (
                <button
                  onClick={handleDownloadZip}
                  disabled={downloading}
                  className="btn-secondary text-xs py-2 disabled:opacity-50"
                >
                  <Download size={13} />
                  {downloading ? 'Preparando...' : `Descargar ZIP (${filtered.filter(c => c.imagen_url).length})`}
                </button>
              )}
            </div>
          </div>

          {/* Count */}
          <p className="text-text-muted text-xs mb-4">
            {filtered.length} creativo{filtered.length !== 1 ? 's' : ''}
            {filterEstado !== 'todos' ? ` ${filterEstado}s` : ''}
          </p>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-text-secondary text-sm">No hay creativos con ese estado</p>
            </div>
          ) : (
            <div className={`grid ${gridCols[gridSize]} gap-4`}>
              {filtered.map(c => (
                <GalleryCard key={c.id} creative={c} showProject={false} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
