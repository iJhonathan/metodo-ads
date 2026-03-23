import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Wand2, Sparkles, CheckCircle2, Download, Square,
  AlertTriangle, Settings, Zap, RefreshCw, SlidersHorizontal, ArrowRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { callClaude, extractJSON, buildCreativesPrompt, ANGLE_TYPES } from '../lib/claude'
import { generateImage } from '../lib/gemini'
import { buildImagePrompt } from '../utils/buildImagePrompt'
import { compositeAd } from '../lib/composite'
import { useAuth } from '../contexts/AuthContext'
import ProjectSelector from '../components/ui/ProjectSelector'
import CreativeCard from '../components/ui/CreativeCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const QUANTITY_OPTIONS = [10, 20, 50, 100]

// ─────────────────────────────────────────
// Angle chip selector
// ─────────────────────────────────────────
function AngleChips({ selected, onToggle, onSelectAll, onClearAll }) {
  const allSelected = selected.size === ANGLE_TYPES.length
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal size={13} className="text-text-muted" />
        <span className="text-text-secondary text-xs font-medium">Ángulos de venta:</span>
        <button onClick={allSelected ? onClearAll : onSelectAll} className="text-accent-light text-xs font-medium hover:underline">
          {allSelected ? 'Ninguno' : 'Todos'}
        </button>
        <span className="text-text-muted text-xs">({selected.size}/{ANGLE_TYPES.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ANGLE_TYPES.map(a => (
          <button
            key={a.key}
            onClick={() => onToggle(a.key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150
              ${selected.has(a.key)
                ? 'bg-accent text-white shadow-glow-sm'
                : 'bg-surface-3 text-text-muted border border-border hover:border-border-hover hover:text-text-secondary'
              }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────
function GenerationProgress({ phase, current, total, label }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center">
            {phase === 1
              ? <Sparkles size={14} className="text-white animate-pulse" />
              : <Wand2 size={14} className="text-white animate-spin" style={{ animationDuration: '2s' }} />
            }
          </div>
          <div>
            <p className="text-text-primary text-sm font-semibold leading-none">
              {phase === 1 ? 'Fase 1 — Generando textos y ángulos con Claude AI...' : `Fase 2 — Generando imágenes (${current}/${total})`}
            </p>
            {label && <p className="text-text-muted text-xs mt-0.5 truncate max-w-md">{label}</p>}
          </div>
        </div>
        {phase === 2 && <span className="text-accent-light font-bold text-sm">{pct}%</span>}
      </div>
      {phase === 2 && (
        <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-accent rounded-full transition-all duration-500 shadow-glow-sm" style={{ width: `${pct}%` }} />
        </div>
      )}
      {phase === 1 && (
        <div className="flex gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-accent/20 overflow-hidden">
              <div className="h-full bg-accent rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
          ))}
        </div>
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

  const [projectId, setProjectId] = useState(searchParams.get('project') || null)
  const [project, setProject] = useState(null)
  const [branding, setBranding] = useState(null)
  const [knowledge, setKnowledge] = useState(null)

  // Controls
  const [quantity, setQuantity] = useState(100)
  const [selectedAngles, setSelectedAngles] = useState(() => new Set(ANGLE_TYPES.map(a => a.key)))

  // Generation state
  const [creatives, setCreatives] = useState([])
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })
  const [error, setError] = useState('')
  const abortRef = useRef(false)

  // Saved
  const [savedCreatives, setSavedCreatives] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [tab, setTab] = useState('factory')

  const isGenerating = phase > 0

  useEffect(() => {
    if (projectId) {
      loadContext(projectId)
      loadSavedCreatives(projectId)
      setCreatives([])
    } else {
      setProject(null); setBranding(null); setKnowledge(null); setCreatives([])
    }
  }, [projectId])

  async function loadContext(pid) {
    const [projRes, brandingRes, knowledgeRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', pid).single(),
      supabase.from('branding_kits').select('*').eq('project_id', pid).maybeSingle(),
      supabase.from('knowledge_base').select('*').eq('project_id', pid).maybeSingle(),
    ])
    setProject(projRes.data)
    setBranding(brandingRes.data)
    setKnowledge(knowledgeRes.data)
  }

  async function loadSavedCreatives(pid) {
    setLoadingSaved(true)
    const { data } = await supabase
      .from('creatives')
      .select('*')
      .eq('project_id', pid)
      .eq('estado', 'aprobado')
      .order('created_at', { ascending: false })
    setSavedCreatives(data || [])
    setLoadingSaved(false)
  }

  // Angle chip handlers
  const toggleAngle = (key) => {
    setSelectedAngles(prev => {
      const s = new Set(prev)
      s.has(key) ? s.delete(key) : s.add(key)
      return s
    })
  }

  const handleGenerate = async () => {
    const claudeKey = profile?.api_key_claude
    const googleKey = profile?.api_key_google
    if (!claudeKey) { setError('no_claude'); return }
    if (!googleKey) { setError('no_google'); return }
    if (!project) return
    if (selectedAngles.size === 0) { setError('no_angles'); return }
    if (!branding?.genero || !branding?.edad_desde || !branding?.edad_hasta || !branding?.mercado) {
      setError('incomplete_branding'); return
    }

    setError('')
    abortRef.current = false
    setCreatives([])
    setTab('factory')

    // ── FASE 1: Claude genera los ángulos + textos ──
    setPhase(1)
    let angles = []
    try {
      const { system, prompt } = buildCreativesPrompt({
        project, knowledge, branding,
        quantity,
        angleTypes: [...selectedAngles],
      })
      const rawText = await callClaude({ apiKey: claudeKey, system, prompt, maxTokens: 16000 })
      const parsed = extractJSON(rawText)
      angles = parsed.creativos || parsed.angulos || parsed
      if (!Array.isArray(angles) || angles.length === 0) throw new Error('Claude no devolvió creativos válidos.')
    } catch (err) {
      if (!abortRef.current) setError(err.message || 'Error generando textos con Claude.')
      setPhase(0)
      return
    }

    if (abortRef.current) { setPhase(0); return }

    // ── FASE 2: Imagen 4 genera + composita cada creativo ──
    setPhase(2)
    const total = angles.length

    const initial = angles.map((angle, i) => ({
      _key: `c_${i}`,
      angle,
      imageUrl: null,
      estado: 'pendiente',
      generating: true,
      error: null,
    }))
    setCreatives(initial)

    for (let i = 0; i < angles.length; i++) {
      if (abortRef.current) break
      const angle = angles[i]
      const key = `c_${i}`

      setProgress({
        current: i + 1,
        total,
        label: `"${angle.texto_imagen || ''}" — ${angle.tipo}`,
      })

      try {
        // 1. Generar imagen de fondo
        const imgPrompt = buildImagePrompt(angle, project, branding)
        const rawImageUrl = await generateImage({ apiKey: googleKey, prompt: imgPrompt })

        // 2. Compositar texto sobre la imagen
        const compositeUrl = await compositeAd({ imageUrl: rawImageUrl, angle, branding })

        setCreatives(prev => prev.map(c =>
          c._key === key ? { ...c, imageUrl: compositeUrl, generating: false } : c
        ))
      } catch (err) {
        setCreatives(prev => prev.map(c =>
          c._key === key ? { ...c, generating: false, error: err.message } : c
        ))
      }

      if (i < angles.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 600))
      }
    }

    setPhase(0)
    setProgress({ current: 0, total: 0, label: '' })
  }

  const handleStop = () => {
    abortRef.current = true
    // Mark remaining as stopped
    setCreatives(prev => prev.map(c =>
      c.generating ? { ...c, generating: false, error: 'Generación detenida' } : c
    ))
    setPhase(0)
  }

  const handleApprove = async (creative) => {
    const { data } = await supabase.from('creatives').insert({
      project_id: projectId,
      user_id: user.id,
      imagen_url: creative.imageUrl,
      estado: 'aprobado',
    }).select().single()

    setCreatives(prev => prev.map(c =>
      c._key === creative._key ? { ...c, estado: 'aprobado' } : c
    ))
    if (data) setSavedCreatives(prev => [data, ...prev])
  }

  const handleDiscard = (creative) => {
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
      const imgPrompt = buildImagePrompt(creative.angle, project, branding)
      const rawImageUrl = await generateImage({ apiKey, prompt: imgPrompt })
      const compositeUrl = await compositeAd({ imageUrl: rawImageUrl, angle: creative.angle, branding })
      setCreatives(prev => prev.map(c =>
        c._key === creative._key ? { ...c, imageUrl: compositeUrl, generating: false } : c
      ))
    } catch (err) {
      setCreatives(prev => prev.map(c =>
        c._key === creative._key ? { ...c, generating: false, error: err.message } : c
      ))
    }
  }

  const handleDownloadAll = () => {
    const withImages = creatives.filter(c => c.imageUrl && c.estado !== 'descartado')
    withImages.forEach((c, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = c.imageUrl
        a.download = `metodo-ads-${c.angle?.tipo || 'creativo'}-${i + 1}.jpg`
        a.click()
      }, i * 250)
    })
  }

  const completedCount = creatives.filter(c => c.imageUrl && !c.generating).length
  const approvedCount = creatives.filter(c => c.estado === 'aprobado').length
  const pendingCount = creatives.filter(c => c.estado === 'pendiente' && c.imageUrl && !c.generating).length

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-xl bg-status-success/15 border border-status-success/20">
              <Wand2 size={22} className="text-status-success" />
            </div>
            Generador de Creativos
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Genera creativos publicitarios de alto impacto listos para Meta Ads.
          </p>
        </div>
      </div>

      {/* Controls card */}
      <div className="card mb-6 space-y-4">
        {/* Proyecto + Cantidad + Botones */}
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="label">Proyecto</label>
            <ProjectSelector value={projectId} onChange={setProjectId} />
          </div>
          <div className="w-40">
            <label className="label">Cantidad</label>
            <select
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              disabled={isGenerating}
              className="input-field"
            >
              {QUANTITY_OPTIONS.map(q => (
                <option key={q} value={q}>{q} creativos</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isGenerating ? (
              <button onClick={handleStop} className="py-3 px-6 rounded-xl font-medium text-sm flex items-center gap-2 bg-status-error text-white hover:bg-status-error/90 transition-all shadow-lg">
                <Square size={15} />
                Parar
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!projectId}
                className="btn-primary py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
              >
                <Sparkles size={16} />
                Generar {quantity} Creativos
              </button>
            )}
          </div>
        </div>

        {/* Angle chips filter */}
        {!isGenerating && (
          <AngleChips
            selected={selectedAngles}
            onToggle={toggleAngle}
            onSelectAll={() => setSelectedAngles(new Set(ANGLE_TYPES.map(a => a.key)))}
            onClearAll={() => setSelectedAngles(new Set())}
          />
        )}

        {/* Context indicators */}
        {project && (
          <div className="flex items-center gap-3 pt-3 border-t border-border flex-wrap">
            <span className="text-text-muted text-xs">Contexto:</span>
            <span className={`badge text-xs ${knowledge?.contenido ? 'badge-success' : 'bg-surface-3 text-text-muted border border-border'}`}>
              {knowledge?.contenido ? '✓' : '○'} Knowledge Base
            </span>
            <span className={`badge text-xs ${branding?.tono ? 'badge-success' : 'bg-surface-3 text-text-muted border border-border'}`}>
              {branding?.tono ? '✓' : '○'} Branding Kit
            </span>
            <span className="badge text-xs badge-accent">✓ Proyecto</span>
          </div>
        )}
      </div>

      {/* Error banners */}
      {error === 'no_claude' && (
        <div onClick={() => navigate('/settings')} className="flex items-center gap-3 bg-status-warning/10 border border-status-warning/30 rounded-xl px-5 py-4 mb-6 cursor-pointer hover:bg-status-warning/15 transition-colors">
          <AlertTriangle size={20} className="text-status-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="text-status-warning font-medium text-sm">API Key de Claude no configurada</p>
            <p className="text-text-secondary text-xs mt-0.5">Ve a Configuración para agregar tu Claude API Key.</p>
          </div>
          <Settings size={16} className="text-status-warning" />
        </div>
      )}
      {error === 'no_google' && (
        <div onClick={() => navigate('/settings')} className="flex items-center gap-3 bg-status-warning/10 border border-status-warning/30 rounded-xl px-5 py-4 mb-6 cursor-pointer hover:bg-status-warning/15 transition-colors">
          <AlertTriangle size={20} className="text-status-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="text-status-warning font-medium text-sm">API Key de Google AI no configurada</p>
            <p className="text-text-secondary text-xs mt-0.5">Ve a Configuración para agregar tu Google AI API Key.</p>
          </div>
          <Settings size={16} className="text-status-warning" />
        </div>
      )}
      {error === 'incomplete_branding' && (
        <div
          onClick={() => navigate(`/branding?project=${projectId}`)}
          className="flex items-center gap-3 bg-status-warning/10 border border-status-warning/30 rounded-xl px-5 py-4 mb-6 cursor-pointer hover:bg-status-warning/15 transition-colors"
        >
          <AlertTriangle size={20} className="text-status-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="text-status-warning font-medium text-sm">Tu Branding Kit está incompleto</p>
            <p className="text-text-secondary text-xs mt-0.5">Completa el género, edad y mercado objetivo antes de generar creativos.</p>
          </div>
          <span className="text-status-warning text-xs font-medium flex items-center gap-1 flex-shrink-0">
            Completar Branding Kit <ArrowRight size={14} />
          </span>
        </div>
      )}
      {error === 'no_angles' && (
        <div className="flex items-center gap-3 bg-status-info/10 border border-status-info/30 rounded-xl px-5 py-4 mb-6">
          <AlertTriangle size={18} className="text-status-info flex-shrink-0" />
          <p className="text-status-info text-sm">Selecciona al menos un ángulo de venta.</p>
        </div>
      )}
      {error && !['no_claude', 'no_google', 'no_angles', 'incomplete_branding'].includes(error) && (
        <div className="flex items-start gap-3 bg-status-error/10 border border-status-error/30 rounded-xl px-5 py-4 mb-6">
          <AlertTriangle size={18} className="text-status-error flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-status-error font-medium text-sm">Error al generar</p>
            <p className="text-text-secondary text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={handleGenerate} className="btn-ghost text-xs py-1.5 px-3">
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      )}

      {!projectId ? (
        <EmptyState
          icon={Wand2}
          title="Selecciona un proyecto"
          description="Elige un proyecto para generar creativos de alto impacto para Meta Ads"
        />
      ) : (
        <>
          {/* Progress */}
          {isGenerating && (
            <GenerationProgress phase={phase} current={progress.current} total={progress.total} label={progress.label} />
          )}

          {/* Tabs + action bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
              <button
                onClick={() => setTab('factory')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${tab === 'factory' ? 'bg-accent text-white shadow-glow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <span className="flex items-center gap-2">
                  <Wand2 size={14} /> Sesión
                  {creatives.length > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'factory' ? 'bg-white/20' : 'bg-accent/20 text-accent-light'}`}>{creatives.length}</span>}
                </span>
              </button>
              <button
                onClick={() => setTab('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${tab === 'approved' ? 'bg-accent text-white shadow-glow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={14} /> Aprobados
                  {savedCreatives.length > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'approved' ? 'bg-white/20' : 'bg-status-success/20 text-status-success'}`}>{savedCreatives.length}</span>}
                </span>
              </button>
            </div>

            {/* Download all */}
            {tab === 'factory' && completedCount > 0 && !isGenerating && (
              <button onClick={handleDownloadAll} className="btn-secondary text-xs py-2 px-4">
                <Download size={14} />
                Descargar todas ({completedCount})
              </button>
            )}
          </div>

          {/* Tab: Sesión actual */}
          {tab === 'factory' && (
            <>
              {creatives.length === 0 && !isGenerating ? (
                <div className="card text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-status-success/10 border border-status-success/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={28} className="text-status-success" />
                  </div>
                  <h3 className="text-text-primary font-semibold text-lg mb-2">Listo para generar</h3>
                  <p className="text-text-secondary text-sm max-w-md mx-auto mb-4">
                    Selecciona la cantidad, elige los ángulos de venta, y genera creativos publicitarios de alto impacto con IA. Cada imagen incluye texto publicitario, y recibirás el titular y CTA para copiar en Meta Ads.
                  </p>
                </div>
              ) : (
                <>
                  {creatives.length > 0 && (
                    <div className="flex items-center gap-3 text-sm mb-4 flex-wrap">
                      <span className="text-text-muted">{creatives.length} creativos</span>
                      {approvedCount > 0 && <span className="text-status-success flex items-center gap-1"><CheckCircle2 size={13} /> {approvedCount} aprobados</span>}
                      {pendingCount > 0 && <span className="text-status-warning flex items-center gap-1"><Zap size={13} /> {pendingCount} pendientes</span>}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

          {/* Tab: Aprobados */}
          {tab === 'approved' && (
            <>
              {loadingSaved ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner label="Cargando aprobados..." />
                </div>
              ) : savedCreatives.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Sin creativos aprobados"
                  description="Genera creativos y aprueba los que quieras usar en tus campañas"
                  action={<button onClick={() => setTab('factory')} className="btn-primary"><Sparkles size={15} /> Generar creativos</button>}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {savedCreatives.map(c => (
                    <CreativeCard
                      key={c.id}
                      creative={{
                        _key: c.id,
                        angle: {},
                        imageUrl: c.imagen_url,
                        estado: c.estado,
                        generating: false,
                        error: null,
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
