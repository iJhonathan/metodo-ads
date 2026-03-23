import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Lightbulb, Wand2, BookmarkCheck, Zap,
  AlertTriangle, RefreshCw, Trash2, Filter,
  ChevronDown, Info, Settings
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { callClaude, extractJSON, buildAnglesPrompt } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'
import ProjectSelector from '../components/ui/ProjectSelector'
import AngleCard from '../components/ui/AngleCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { isDemoMode, DEMO_PROJECTS, DEMO_ANGLES, DEMO_BRANDING, DEMO_KNOWLEDGE } from '../lib/demo'

// ──────────────────────────────────────────
// Generating animation
// ──────────────────────────────────────────
const STEPS = [
  'Analizando tu producto y público...',
  'Consultando base de conocimiento...',
  'Aplicando branding kit...',
  'Generando ángulo de dolor...',
  'Generando ángulo de curiosidad...',
  'Generando ángulo de resultado...',
  'Generando ángulos de transformación...',
  'Generando ángulos de urgencia y miedo...',
  'Generando ángulos de prueba social...',
  'Refinando titulares y copy...',
  'Optimizando para Meta Ads...',
  'Finalizando los 20 ángulos...',
]

function GeneratingOverlay() {
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx(i => (i + 1) % STEPS.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card py-16 text-center">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow animate-pulse-slow">
            <Wand2 size={28} className="text-white" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-accent/30 animate-ping opacity-30" />
        </div>
      </div>
      <h3 className="text-text-primary font-bold text-xl mb-2">Generando con Claude AI</h3>
      <p className="text-accent-light text-sm font-medium mb-6 min-h-[20px] transition-all">
        {STEPS[stepIdx]}
      </p>
      <div className="flex justify-center gap-1.5 mb-4">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full bg-accent/20 overflow-hidden"
            style={{ width: `${100 / 20}%`, maxWidth: 28 }}
          >
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: stepIdx > i * (STEPS.length / 20) ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>
      <p className="text-text-muted text-xs">Esto puede tomar 15-30 segundos...</p>
    </div>
  )
}

// ──────────────────────────────────────────
// Filter bar
// ──────────────────────────────────────────
const TIPO_LABELS = {
  todos: 'Todos', dolor: 'Dolor', curiosidad: 'Curiosidad', objecion: 'Objeción',
  miedo: 'Miedo', resultado: 'Resultado', comparacion: 'Comparación', urgencia: 'Urgencia',
  testimonio: 'Testimonio', educativo: 'Educativo', provocacion: 'Provocación',
  identidad: 'Identidad', transformacion: 'Transformación', garantia: 'Garantía',
  precio: 'Precio', exclusividad: 'Exclusividad', social_proof: 'Prueba Social',
  novedad: 'Novedad', aspiracional: 'Aspiracional', humor: 'Humor', autoridad: 'Autoridad',
}

function FilterBar({ activeFilter, onChange, availableTypes }) {
  const types = ['todos', ...availableTypes]
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter size={14} className="text-text-muted flex-shrink-0" />
      {types.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
            ${activeFilter === t
              ? 'bg-accent text-white shadow-glow-sm'
              : 'bg-surface-3 text-text-secondary border border-border hover:border-border-hover hover:text-text-primary'
            }`}
        >
          {TIPO_LABELS[t] || t}
        </button>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────
export default function Angles() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [projectId, setProjectId] = useState(searchParams.get('project') || null)
  const [project, setProject] = useState(null)
  const [knowledge, setKnowledge] = useState(null)
  const [branding, setBranding] = useState(null)

  // Angles state
  const [generatedAngles, setGeneratedAngles] = useState([])   // batch recién generado
  const [savedAngles, setSavedAngles] = useState([])            // guardados en DB
  const [discarded, setDiscarded] = useState(new Set())         // IDs descartados del batch

  const [tab, setTab] = useState('generate')  // 'generate' | 'saved'
  const [filter, setFilter] = useState('todos')

  const [generating, setGenerating] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [error, setError] = useState('')
  const [savingIds, setSavingIds] = useState(new Set())

  // Load project context when projectId changes
  useEffect(() => {
    if (projectId) {
      loadContext(projectId)
      loadSaved(projectId)
      setGeneratedAngles([])
      setDiscarded(new Set())
      setError('')
    } else {
      setProject(null); setKnowledge(null); setBranding(null)
      setGeneratedAngles([]); setSavedAngles([])
    }
  }, [projectId])

  async function loadContext(pid) {
    if (isDemoMode()) {
      const proj = DEMO_PROJECTS.find(p => p.id === pid) || DEMO_PROJECTS[0]
      setProject(proj)
      setKnowledge(DEMO_KNOWLEDGE)
      setBranding(DEMO_BRANDING)
      return
    }
    const [projRes, knowledgeRes, brandingRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', pid).single(),
      supabase.from('knowledge_base').select('*').eq('project_id', pid).maybeSingle(),
      supabase.from('branding_kits').select('*').eq('project_id', pid).maybeSingle(),
    ])
    setProject(projRes.data)
    setKnowledge(knowledgeRes.data)
    setBranding(brandingRes.data)
  }

  async function loadSaved(pid) {
    setLoadingSaved(true)
    if (isDemoMode()) {
      setSavedAngles(DEMO_ANGLES.filter(a => a.project_id === pid))
      setLoadingSaved(false)
      return
    }
    const { data } = await supabase
      .from('angles')
      .select('*')
      .eq('project_id', pid)
      .eq('guardado', true)
      .order('created_at', { ascending: false })
    setSavedAngles(data || [])
    setLoadingSaved(false)
  }

  const handleGenerate = async () => {
    if (!projectId || !project) return
    const apiKey = profile?.api_key_claude
    if (!apiKey) {
      setError('no_key')
      return
    }

    setError('')
    setGenerating(true)
    setGeneratedAngles([])
    setDiscarded(new Set())
    setTab('generate')

    try {
      const { system, prompt } = buildAnglesPrompt({ project, knowledge, branding })
      const rawText = await callClaude({ apiKey, system, prompt, maxTokens: 4096 })
      const parsed = extractJSON(rawText)
      const angles = parsed.angulos || parsed

      if (!Array.isArray(angles) || angles.length === 0) {
        throw new Error('La IA no devolvió ángulos válidos. Intenta de nuevo.')
      }

      // Assign temp IDs
      const withIds = angles.map((a, i) => ({ ...a, _tempId: `temp_${i}` }))
      setGeneratedAngles(withIds)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al generar. Verifica tu API Key de Claude.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveAngle = async (angle) => {
    const isAlreadySaved = savedAngles.some(
      s => s.headline === angle.headline && s.tipo === angle.tipo
    )
    if (isAlreadySaved) return

    const tempId = angle._tempId
    setSavingIds(prev => new Set(prev).add(tempId || angle.id))

    const { data } = await supabase
      .from('angles')
      .insert({
        project_id: projectId,
        tipo: angle.tipo,
        headline: angle.headline,
        copy: angle.copy,
        visual_sugerido: angle.visual_sugerido,
        guardado: true,
      })
      .select()
      .single()

    if (data) setSavedAngles(prev => [data, ...prev])

    setSavingIds(prev => { const s = new Set(prev); s.delete(tempId || angle.id); return s })
  }

  const handleDiscardGenerated = (angle) => {
    setDiscarded(prev => new Set(prev).add(angle._tempId))
  }

  const handleDeleteSaved = async (angle) => {
    await supabase.from('angles').delete().eq('id', angle.id)
    setSavedAngles(prev => prev.filter(a => a.id !== angle.id))
  }

  // Filtered views
  const visibleGenerated = generatedAngles.filter(a =>
    !discarded.has(a._tempId) &&
    (filter === 'todos' || a.tipo === filter)
  )

  const visibleSaved = savedAngles.filter(a =>
    filter === 'todos' || a.tipo === filter
  )

  const availableGeneratedTypes = [...new Set(
    generatedAngles.filter(a => !discarded.has(a._tempId)).map(a => a.tipo)
  )]
  const availableSavedTypes = [...new Set(savedAngles.map(a => a.tipo))]

  const isSaved = (angle) => savedAngles.some(
    s => s.headline === angle.headline && s.tipo === angle.tipo
  )

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-xl bg-status-warning/15 border border-status-warning/20">
              <Lightbulb size={22} className="text-status-warning" />
            </div>
            Ángulos de Venta
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Genera 20 ángulos publicitarios únicos para tu producto usando Claude AI.
          </p>
        </div>
        {savedAngles.length > 0 && (
          <div className="badge-accent text-sm px-3 py-1.5">
            <BookmarkCheck size={14} />
            {savedAngles.length} guardado{savedAngles.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Project selector + Generate button */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="label">Proyecto</label>
            <ProjectSelector value={projectId} onChange={setProjectId} />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!projectId || generating}
            className="btn-primary py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-glow"
          >
            <Wand2 size={16} />
            {generating ? 'Generando...' : 'Generar 20 Ángulos'}
          </button>
        </div>

        {/* Context indicators */}
        {project && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border flex-wrap">
            <span className="text-text-muted text-xs">Contexto activo:</span>
            <span className={`badge text-xs ${knowledge?.contenido ? 'badge-success' : 'bg-surface-3 text-text-muted border border-border'}`}>
              {knowledge?.contenido ? '✓' : '○'} Base de Conocimiento
            </span>
            <span className={`badge text-xs ${branding?.tono ? 'badge-success' : 'bg-surface-3 text-text-muted border border-border'}`}>
              {branding?.tono ? '✓' : '○'} Branding Kit
            </span>
            <span className="badge text-xs badge-accent">
              ✓ Datos del Proyecto
            </span>
          </div>
        )}
      </div>

      {/* Error states */}
      {error === 'no_key' && (
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 bg-status-warning/10 border border-status-warning/30 rounded-xl px-5 py-4 mb-6 cursor-pointer hover:bg-status-warning/15 transition-colors"
        >
          <AlertTriangle size={20} className="text-status-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="text-status-warning font-medium text-sm">API Key de Claude no configurada</p>
            <p className="text-text-secondary text-xs mt-0.5">
              Ve a Configuración para agregar tu Claude API Key. Es necesaria para generar ángulos.
            </p>
          </div>
          <Settings size={16} className="text-status-warning" />
        </div>
      )}

      {error && error !== 'no_key' && (
        <div className="flex items-start gap-3 bg-status-error/10 border border-status-error/30 rounded-xl px-5 py-4 mb-6">
          <AlertTriangle size={18} className="text-status-error flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-status-error font-medium text-sm">Error al generar ángulos</p>
            <p className="text-text-secondary text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={handleGenerate} className="btn-ghost text-xs py-1.5 px-3">
            <RefreshCw size={13} />
            Reintentar
          </button>
        </div>
      )}

      {/* No project selected */}
      {!projectId && (
        <EmptyState
          icon={Lightbulb}
          title="Selecciona un proyecto"
          description="Elige un proyecto para comenzar a generar ángulos de venta con Claude AI"
        />
      )}

      {/* Main content area */}
      {projectId && (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-5 bg-surface border border-border rounded-xl p-1 w-fit">
            <button
              onClick={() => setTab('generate')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${tab === 'generate' ? 'bg-accent text-white shadow-glow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <span className="flex items-center gap-2">
                <Wand2 size={14} />
                Generados
                {generatedAngles.length > 0 && (
                  <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {generatedAngles.filter(a => !discarded.has(a._tempId)).length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setTab('saved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${tab === 'saved' ? 'bg-accent text-white shadow-glow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <span className="flex items-center gap-2">
                <BookmarkCheck size={14} />
                Guardados
                {savedAngles.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'saved' ? 'bg-white/20 text-white' : 'bg-accent/20 text-accent-light'}`}>
                    {savedAngles.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* ── TAB: Generados ── */}
          {tab === 'generate' && (
            <>
              {generating ? (
                <GeneratingOverlay />
              ) : generatedAngles.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-status-warning/10 border border-status-warning/20 flex items-center justify-center mx-auto mb-4">
                    <Zap size={28} className="text-status-warning" />
                  </div>
                  <h3 className="text-text-primary font-semibold text-lg mb-2">
                    Listo para generar
                  </h3>
                  <p className="text-text-secondary text-sm max-w-sm mx-auto mb-5">
                    Haz clic en "Generar 20 Ángulos" para que Claude AI cree ángulos de venta únicos para tu proyecto.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-text-muted text-xs">
                    <Info size={13} />
                    Añade Base de Conocimiento y Branding Kit para mejores resultados
                  </div>
                </div>
              ) : (
                <>
                  {/* Top actions */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <FilterBar
                      activeFilter={filter}
                      onChange={setFilter}
                      availableTypes={availableGeneratedTypes}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const unsaved = generatedAngles.filter(a =>
                            !discarded.has(a._tempId) && !isSaved(a)
                          )
                          unsaved.forEach(handleSaveAngle)
                        }}
                        className="btn-secondary text-xs py-2"
                      >
                        <BookmarkCheck size={13} />
                        Guardar todos
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="btn-ghost text-xs py-2"
                      >
                        <RefreshCw size={13} />
                        Regenerar
                      </button>
                    </div>
                  </div>

                  {visibleGenerated.length === 0 ? (
                    <p className="text-center text-text-muted py-8 text-sm">No hay ángulos de ese tipo</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visibleGenerated.map(angle => (
                        <AngleCard
                          key={angle._tempId}
                          angle={angle}
                          isSaved={isSaved(angle)}
                          onSave={handleSaveAngle}
                          onDiscard={handleDiscardGenerated}
                          showDiscard={!isSaved(angle)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── TAB: Guardados ── */}
          {tab === 'saved' && (
            <>
              {loadingSaved ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner label="Cargando ángulos guardados..." />
                </div>
              ) : savedAngles.length === 0 ? (
                <EmptyState
                  icon={BookmarkCheck}
                  title="Sin ángulos guardados"
                  description="Genera ángulos y guarda los que más te gusten para usarlos en la Fábrica Creativa"
                  action={
                    <button onClick={() => setTab('generate')} className="btn-primary">
                      <Wand2 size={15} />
                      Generar ángulos
                    </button>
                  }
                />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <FilterBar
                      activeFilter={filter}
                      onChange={setFilter}
                      availableTypes={availableSavedTypes}
                    />
                    <span className="text-text-muted text-xs">
                      {visibleSaved.length} ángulo{visibleSaved.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {visibleSaved.length === 0 ? (
                    <p className="text-center text-text-muted py-8 text-sm">No hay ángulos de ese tipo</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visibleSaved.map(angle => (
                        <AngleCard
                          key={angle.id}
                          angle={angle}
                          isSaved={true}
                          onSave={() => {}}
                          onDiscard={handleDeleteSaved}
                          showDiscard={true}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
