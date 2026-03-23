import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Wand2, Lightbulb, CheckCircle2, XCircle, Download,
  AlertTriangle, Settings, Info, Filter, Layers,
  BookmarkCheck, BarChart3, Zap, RefreshCw, ChevronRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateImage, buildImagePrompt } from '../lib/gemini'
import { useAuth } from '../contexts/AuthContext'
import { useUsage } from '../hooks/useUsage'
import ProjectSelector from '../components/ui/ProjectSelector'
import CreativeCard from '../components/ui/CreativeCard'
import AngleCard from '../components/ui/AngleCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import UpgradeModal from '../components/ui/UpgradeModal'

// ─────────────────────────────────────────
// Angle selector with checkbox
// ─────────────────────────────────────────
function AngleSelector({ angles, selected, onToggle, onSelectAll, onClearAll }) {
  const allSelected = angles.length > 0 && selected.size === angles.length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-text-secondary text-sm font-medium">
          {angles.length} ángulo{angles.length !== 1 ? 's' : ''} guardados
        </p>
        <div className="flex items-center gap-2">
          <button onClick={onClearAll} className="btn-ghost text-xs py-1.5 px-2.5">Ninguno</button>
          <button onClick={onSelectAll} className="btn-ghost text-xs py-1.5 px-2.5">Todos</button>
          {selected.size > 0 && (
            <span className="badge-accent text-xs px-2.5 py-1.5">
              {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {angles.map(angle => {
          const isSelected = selected.has(angle.id)
          return (
            <button
              key={angle.id}
              onClick={() => onToggle(angle.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3
                ${isSelected
                  ? 'bg-accent/10 border-accent/40 shadow-glow-sm'
                  : 'bg-background border-border hover:border-border-hover'
                }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all
                ${isSelected ? 'bg-accent border-accent' : 'border-border'}`}>
                {isSelected && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-semibold text-sm leading-snug line-clamp-2">{angle.headline}</p>
                <p className="text-text-muted text-xs mt-0.5 capitalize">{angle.tipo}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────
function GenerationProgress({ current, total, currentLabel }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Wand2 size={12} className="text-white animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <span className="text-text-primary text-sm font-medium">Generando creativos...</span>
        </div>
        <span className="text-accent-light font-bold text-sm">{current}/{total}</span>
      </div>
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-accent rounded-full transition-all duration-500 shadow-glow-sm"
          style={{ width: `${pct}%` }}
        />
      </div>
      {currentLabel && (
        <p className="text-text-muted text-xs mt-2 truncate">{currentLabel}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// Main page
// ─────────────────────────────────────────
export default function CreativeFactory() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { canGenerate, usage, limit, remaining, refetch: refetchUsage } = useUsage()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const [projectId, setProjectId] = useState(searchParams.get('project') || null)
  const [project, setProject] = useState(null)
  const [branding, setBranding] = useState(null)
  const [savedAngles, setSavedAngles] = useState([])

  // Selection
  const [selected, setSelected] = useState(new Set())

  // Generation state
  const [creatives, setCreatives] = useState([])      // { _key, angle, imageUrl, estado, generating, error }
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })

  // Saved creatives from DB
  const [savedCreatives, setSavedCreatives] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [tab, setTab] = useState('factory')    // 'factory' | 'approved'

  const [error, setError] = useState('')
  const abortRef = useRef(false)

  useEffect(() => {
    if (projectId) {
      loadContext(projectId)
      loadSavedCreatives(projectId)
      setCreatives([])
      setSelected(new Set())
    } else {
      setProject(null); setBranding(null)
      setSavedAngles([]); setCreatives([])
    }
  }, [projectId])

  async function loadContext(pid) {
    const [projRes, anglesRes, brandingRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', pid).single(),
      supabase.from('angles').select('*').eq('project_id', pid).eq('guardado', true).order('created_at', { ascending: false }),
      supabase.from('branding_kits').select('*').eq('project_id', pid).maybeSingle(),
    ])
    setProject(projRes.data)
    setSavedAngles(anglesRes.data || [])
    setBranding(brandingRes.data)
  }

  async function loadSavedCreatives(pid) {
    setLoadingSaved(true)
    const { data } = await supabase
      .from('creatives')
      .select('*, angles(tipo, headline, copy, visual_sugerido)')
      .eq('project_id', pid)
      .order('created_at', { ascending: false })
    setSavedCreatives(data || [])
    setLoadingSaved(false)
  }

  const toggleAngle = (id) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const handleGenerate = async () => {
    const apiKey = profile?.api_key_google
    if (!apiKey) { setError('no_key'); return }
    if (selected.size === 0) { setError('no_selection'); return }

    setError('')
    setIsGenerating(true)
    abortRef.current = false

    const VARIATIONS_PER_ANGLE = 2
    const anglesToGenerate = savedAngles.filter(a => selected.has(a.id))
    const totalCreatives = anglesToGenerate.length * VARIATIONS_PER_ANGLE
    setProgress({ current: 0, total: totalCreatives, label: '' })

    // Initialize creative slots — 2 per angle
    const initial = anglesToGenerate.flatMap(a =>
      Array.from({ length: VARIATIONS_PER_ANGLE }, (_, vi) => ({
        _key: `gen_${a.id}_v${vi}_${Date.now()}`,
        angle: a,
        variationIndex: vi,
        imageUrl: null,
        estado: 'pendiente',
        generating: true,
        error: null,
      }))
    )
    setCreatives(initial)
    setTab('factory')

    let doneCount = 0
    for (let i = 0; i < anglesToGenerate.length; i++) {
      if (abortRef.current) break
      const angle = anglesToGenerate[i]

      for (let vi = 0; vi < VARIATIONS_PER_ANGLE; vi++) {
        if (abortRef.current) break
        const key = initial[i * VARIATIONS_PER_ANGLE + vi]._key
        doneCount++

        setProgress({
          current: doneCount,
          total: totalCreatives,
          label: `"${angle.headline}" — variación ${vi + 1}`,
        })

        try {
          const imagePrompt = buildImagePrompt({ angle, project, branding, variationIndex: vi })
          const imageUrl = await generateImage({ apiKey, prompt: imagePrompt })

          setCreatives(prev => prev.map(c =>
            c._key === key ? { ...c, imageUrl, generating: false } : c
          ))
        } catch (err) {
          setCreatives(prev => prev.map(c =>
            c._key === key ? { ...c, generating: false, error: err.message } : c
          ))
        }

        if (doneCount < totalCreatives) {
          await new Promise(r => setTimeout(r, 800))
        }
      }
    }

    setIsGenerating(false)
    setProgress({ current: 0, total: 0, label: '' })
  }

  const handleApprove = async (creative) => {
    // Save to DB
    const { data } = await supabase.from('creatives').insert({
      angle_id: creative.angle.id,
      project_id: projectId,
      user_id: user.id,
      imagen_url: creative.imageUrl,
      estado: 'aprobado',
    }).select().single()

    setCreatives(prev => prev.map(c =>
      c._key === creative._key ? { ...c, estado: 'aprobado' } : c
    ))
    if (data) setSavedCreatives(prev => [{ ...data, angles: creative.angle }, ...prev])

    // Update usage counter
    const mes = new Date().toISOString().slice(0, 7)
    await supabase.rpc('increment_usage', { p_user_id: user.id, p_mes: mes }).catch(() => {})
    refetchUsage()
  }

  const handleDiscard = async (creative) => {
    await supabase.from('creatives').insert({
      angle_id: creative.angle.id,
      project_id: projectId,
      user_id: user.id,
      imagen_url: creative.imageUrl,
      estado: 'descartado',
    })
    setCreatives(prev => prev.map(c =>
      c._key === creative._key ? { ...c, estado: 'descartado' } : c
    ))
  }

  const handleRetry = async (creative) => {
    const apiKey = profile?.api_key_google
    if (!apiKey) return

    setCreatives(prev => prev.map(c =>
      c._key === creative._key ? { ...c, generating: true, error: null } : c
    ))

    try {
      const imagePrompt = buildImagePrompt({ angle: creative.angle, project, branding, variationIndex: creative.variationIndex ?? 0 })
      const imageUrl = await generateImage({ apiKey, prompt: imagePrompt })
      setCreatives(prev => prev.map(c =>
        c._key === creative._key ? { ...c, imageUrl, generating: false } : c
      ))
    } catch (err) {
      setCreatives(prev => prev.map(c =>
        c._key === creative._key ? { ...c, generating: false, error: err.message } : c
      ))
    }
  }

  const handleDownloadAll = () => {
    creatives
      .filter(c => c.imageUrl && c.estado !== 'descartado')
      .forEach((c, i) => {
        setTimeout(() => {
          const a = document.createElement('a')
          a.href = c.imageUrl
          a.download = `creativo-${c.angle?.tipo || i}-${i + 1}.png`
          a.click()
        }, i * 300)
      })
  }

  const approvedCount = creatives.filter(c => c.estado === 'aprobado').length
  const pendingCount = creatives.filter(c => c.estado === 'pendiente' && c.imageUrl && !c.generating).length

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-xl bg-status-success/15 border border-status-success/20">
              <Wand2 size={22} className="text-status-success" />
            </div>
            Fábrica Creativa
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Convierte tus ángulos guardados en imágenes publicitarias con Google Gemini.
          </p>
        </div>
        {savedCreatives.filter(c => c.estado === 'aprobado').length > 0 && (
          <div className="badge-success text-sm px-3 py-1.5">
            <CheckCircle2 size={14} />
            {savedCreatives.filter(c => c.estado === 'aprobado').length} aprobados
          </div>
        )}
      </div>


      {/* Error banners */}
      {error === 'no_key' && (
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 bg-status-warning/10 border border-status-warning/30 rounded-xl px-5 py-4 mb-6 cursor-pointer hover:bg-status-warning/15 transition-colors"
        >
          <AlertTriangle size={20} className="text-status-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="text-status-warning font-medium text-sm">API Key de Google AI Studio no configurada</p>
            <p className="text-text-secondary text-xs mt-0.5">Ve a Configuración para agregar tu key. Es necesaria para generar imágenes.</p>
          </div>
          <Settings size={16} className="text-status-warning" />
        </div>
      )}
      {error === 'no_selection' && (
        <div className="flex items-center gap-3 bg-status-info/10 border border-status-info/30 rounded-xl px-5 py-4 mb-6">
          <Info size={18} className="text-status-info flex-shrink-0" />
          <p className="text-status-info text-sm">Selecciona al menos un ángulo para generar creativos.</p>
          <button onClick={() => setError('')} className="ml-auto text-text-muted hover:text-text-primary">×</button>
        </div>
      )}

      {/* Project selector */}
      <div className="card mb-6">
        <label className="label">Proyecto</label>
        <ProjectSelector value={projectId} onChange={setProjectId} />
      </div>

      {!projectId ? (
        <EmptyState
          icon={Wand2}
          title="Selecciona un proyecto"
          description="Elige un proyecto para ver sus ángulos guardados y generar creativos"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT PANEL: Angle selection ── */}
          <div className="lg:col-span-1">
            <div className="card sticky top-6">
              <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                <Lightbulb size={17} className="text-status-warning" />
                Ángulos Guardados
              </h2>

              {savedAngles.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-status-warning/10 border border-status-warning/20 flex items-center justify-center mx-auto mb-3">
                    <Lightbulb size={20} className="text-status-warning" />
                  </div>
                  <p className="text-text-secondary text-sm font-medium mb-1">Sin ángulos guardados</p>
                  <p className="text-text-muted text-xs mb-3">
                    Primero genera y guarda ángulos en el módulo Ángulos de Venta
                  </p>
                  <button
                    onClick={() => navigate(`/angles?project=${projectId}`)}
                    className="btn-ghost text-xs py-2"
                  >
                    Ir a Ángulos
                    <ChevronRight size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <AngleSelector
                    angles={savedAngles}
                    selected={selected}
                    onToggle={toggleAngle}
                    onSelectAll={() => setSelected(new Set(savedAngles.map(a => a.id)))}
                    onClearAll={() => setSelected(new Set())}
                  />

                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || selected.size === 0}
                      className="btn-primary w-full justify-center py-3 disabled:opacity-50 shadow-glow"
                    >
                      <Wand2 size={15} />
                      {isGenerating
                        ? 'Generando...'
                        : `Generar ${selected.size > 0 ? selected.size * 2 : ''} Creativos`
                      }
                    </button>
                    {selected.size > 0 && (
                      <p className="text-text-muted text-xs text-center mt-2">
                        {selected.size * 2} imágenes · ~{selected.size * 2 * 10}-{selected.size * 2 * 20}s
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: Creatives ── */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-5 bg-surface border border-border rounded-xl p-1 w-fit">
              <button
                onClick={() => setTab('factory')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${tab === 'factory' ? 'bg-accent text-white shadow-glow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <span className="flex items-center gap-2">
                  <Wand2 size={14} />
                  Sesión actual
                  {creatives.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'factory' ? 'bg-white/20 text-white' : 'bg-accent/20 text-accent-light'}`}>
                      {creatives.length}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setTab('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${tab === 'approved' ? 'bg-accent text-white shadow-glow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  Aprobados
                  {savedCreatives.filter(c => c.estado === 'aprobado').length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'approved' ? 'bg-white/20 text-white' : 'bg-status-success/20 text-status-success'}`}>
                      {savedCreatives.filter(c => c.estado === 'aprobado').length}
                    </span>
                  )}
                </span>
              </button>
            </div>

            {/* ── TAB: Sesión actual ── */}
            {tab === 'factory' && (
              <>
                {isGenerating && progress.total > 0 && (
                  <GenerationProgress
                    current={progress.current}
                    total={progress.total}
                    currentLabel={progress.label}
                  />
                )}

                {creatives.length === 0 && !isGenerating ? (
                  <div className="card text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-status-success/10 border border-status-success/20 flex items-center justify-center mx-auto mb-4">
                      <Wand2 size={28} className="text-status-success" />
                    </div>
                    <h3 className="text-text-primary font-semibold text-lg mb-2">Listo para generar</h3>
                    <p className="text-text-secondary text-sm max-w-sm mx-auto">
                      Selecciona ángulos del panel izquierdo y haz clic en "Generar Creativos"
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Summary bar */}
                    {creatives.length > 0 && (
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-text-muted">{creatives.length} creativos</span>
                          {approvedCount > 0 && (
                            <span className="text-status-success flex items-center gap-1">
                              <CheckCircle2 size={13} />
                              {approvedCount} aprobados
                            </span>
                          )}
                          {pendingCount > 0 && (
                            <span className="text-status-warning flex items-center gap-1">
                              <Zap size={13} />
                              {pendingCount} pendientes
                            </span>
                          )}
                        </div>
                        {creatives.some(c => c.imageUrl && c.estado !== 'descartado') && (
                          <button onClick={handleDownloadAll} className="btn-ghost text-xs py-2">
                            <Download size={13} />
                            Descargar todos
                          </button>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {creatives.map(creative => (
                        <CreativeCard
                          key={creative._key}
                          creative={creative}
                          onApprove={handleApprove}
                          onDiscard={handleDiscard}
                          onRetry={handleRetry}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── TAB: Aprobados ── */}
            {tab === 'approved' && (
              <>
                {loadingSaved ? (
                  <div className="flex justify-center py-16">
                    <LoadingSpinner label="Cargando aprobados..." />
                  </div>
                ) : savedCreatives.filter(c => c.estado === 'aprobado').length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Sin creativos aprobados"
                    description="Genera creativos y aprueba los que quieras usar en tus campañas de Meta Ads"
                    action={
                      <button onClick={() => setTab('factory')} className="btn-primary">
                        <Wand2 size={15} />
                        Generar creativos
                      </button>
                    }
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-text-secondary text-sm">
                        {savedCreatives.filter(c => c.estado === 'aprobado').length} creativos aprobados
                      </p>
                      <button
                        onClick={() => {
                          savedCreatives
                            .filter(c => c.estado === 'aprobado' && c.imagen_url)
                            .forEach((c, i) => {
                              setTimeout(() => {
                                const a = document.createElement('a')
                                a.href = c.imagen_url
                                a.download = `creativo-aprobado-${i + 1}.png`
                                a.click()
                              }, i * 300)
                            })
                        }}
                        className="btn-ghost text-xs py-2"
                      >
                        <Download size={13} />
                        Descargar todos
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedCreatives
                        .filter(c => c.estado === 'aprobado')
                        .map(c => (
                          <CreativeCard
                            key={c.id}
                            creative={{
                              _key: c.id,
                              angle: c.angles,
                              imageUrl: c.imagen_url,
                              estado: c.estado,
                              generating: false,
                              error: null,
                            }}
                          />
                        ))
                      }
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
