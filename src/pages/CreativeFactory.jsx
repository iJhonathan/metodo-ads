import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Wand2, Sparkles, CheckCircle2, Download,
  AlertTriangle, Settings, Info, Zap, RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { callClaude, extractJSON, buildCreativesPrompt } from '../lib/claude'
import { generateImage, buildImagePrompt } from '../lib/gemini'
import { useAuth } from '../contexts/AuthContext'
import ProjectSelector from '../components/ui/ProjectSelector'
import CreativeCard from '../components/ui/CreativeCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const VARIATIONS_PER_ANGLE = 2

// ─────────────────────────────────────────
// Progress overlay
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
              {phase === 1 ? 'Fase 1 — Generando ángulos y textos con Claude AI' : 'Fase 2 — Generando imágenes con Gemini'}
            </p>
            {label && <p className="text-text-muted text-xs mt-0.5 truncate max-w-xs">{label}</p>}
          </div>
        </div>
        {phase === 2 && (
          <span className="text-accent-light font-bold text-sm">{current}/{total}</span>
        )}
      </div>

      {phase === 2 && (
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-accent rounded-full transition-all duration-500 shadow-glow-sm"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {phase === 1 && (
        <div className="flex gap-1 mt-2">
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

  const [creatives, setCreatives] = useState([])
  const [savedCreatives, setSavedCreatives] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [tab, setTab] = useState('factory')

  const [phase, setPhase] = useState(0)   // 0=idle 1=claude 2=images
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })
  const [error, setError] = useState('')
  const abortRef = useRef(false)

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
      .select('*, angles(tipo, titulo, cta, imagen_concepto)')
      .eq('project_id', pid)
      .eq('estado', 'aprobado')
      .order('created_at', { ascending: false })
    setSavedCreatives(data || [])
    setLoadingSaved(false)
  }

  const handleGenerate = async () => {
    const claudeKey = profile?.api_key_claude
    const googleKey = profile?.api_key_google
    if (!claudeKey) { setError('no_claude'); return }
    if (!googleKey) { setError('no_google'); return }
    if (!project) return

    setError('')
    abortRef.current = false
    setCreatives([])
    setTab('factory')

    // ── FASE 1: Claude genera los 50 ángulos con titulo + cta + imagen_concepto ──
    setPhase(1)
    let angles = []
    try {
      const { system, prompt } = buildCreativesPrompt({ project, knowledge, branding })
      const rawText = await callClaude({ apiKey: claudeKey, system, prompt, maxTokens: 16000 })
      const parsed = extractJSON(rawText)
      angles = parsed.creativos || parsed.angulos || parsed
      if (!Array.isArray(angles) || angles.length === 0) throw new Error('Claude no devolvió creativos válidos.')
    } catch (err) {
      setError(err.message || 'Error generando ángulos con Claude.')
      setPhase(0)
      return
    }

    // ── FASE 2: Imagen 4 genera 2 imágenes por ángulo ──
    setPhase(2)
    const totalImages = angles.length * VARIATIONS_PER_ANGLE

    // Inicializar todas las tarjetas en estado "generating"
    const initial = angles.flatMap((angle, ai) =>
      Array.from({ length: VARIATIONS_PER_ANGLE }, (_, vi) => ({
        _key: `c_${ai}_v${vi}`,
        angle,
        variationIndex: vi,
        imageUrl: null,
        estado: 'pendiente',
        generating: true,
        error: null,
      }))
    )
    setCreatives(initial)

    let done = 0
    for (let ai = 0; ai < angles.length; ai++) {
      if (abortRef.current) break
      const angle = angles[ai]

      for (let vi = 0; vi < VARIATIONS_PER_ANGLE; vi++) {
        if (abortRef.current) break
        const key = `c_${ai}_v${vi}`
        done++
        setProgress({
          current: done,
          total: totalImages,
          label: `"${angle.titulo}" — variación ${vi + 1}`,
        })

        try {
          const imgPrompt = buildImagePrompt({ angle, project, branding, variationIndex: vi })
          const imageUrl = await generateImage({ apiKey: googleKey, prompt: imgPrompt })
          setCreatives(prev => prev.map(c =>
            c._key === key ? { ...c, imageUrl, generating: false } : c
          ))
        } catch (err) {
          setCreatives(prev => prev.map(c =>
            c._key === key ? { ...c, generating: false, error: err.message } : c
          ))
        }

        if (done < totalImages) await new Promise(r => setTimeout(r, 600))
      }
    }

    setPhase(0)
    setProgress({ current: 0, total: 0, label: '' })
  }

  const handleApprove = async (creative) => {
    // Guardar ángulo primero
    const { data: savedAngle } = await supabase
      .from('angles')
      .insert({
        project_id: projectId,
        tipo: creative.angle.tipo,
        titulo: creative.angle.titulo,
        cta: creative.angle.cta,
        imagen_concepto: creative.angle.imagen_concepto,
        guardado: true,
      })
      .select().single()

    const { data } = await supabase.from('creatives').insert({
      angle_id: savedAngle?.id || null,
      project_id: projectId,
      user_id: user.id,
      imagen_url: creative.imageUrl,
      estado: 'aprobado',
    }).select().single()

    setCreatives(prev => prev.map(c =>
      c._key === creative._key ? { ...c, estado: 'aprobado' } : c
    ))
    if (data) setSavedCreatives(prev => [{ ...data, angle: creative.angle }, ...prev])

    const mes = new Date().toISOString().slice(0, 7)
    await supabase.rpc('increment_usage', { p_user_id: user.id, p_mes: mes }).catch(() => {})
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
      const imgPrompt = buildImagePrompt({ angle: creative.angle, project, branding, variationIndex: creative.variationIndex ?? 0 })
      const imageUrl = await generateImage({ apiKey, prompt: imgPrompt })
      setCreatives(prev => prev.map(c =>
        c._key === creative._key ? { ...c, imageUrl, generating: false } : c
      ))
    } catch (err) {
      setCreatives(prev => prev.map(c =>
        c._key === creative._key ? { ...c, generating: false, error: err.message } : c
      ))
    }
  }

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
            Genera 100 creativos publicitarios listos para Meta Ads — Claude crea los textos, Gemini genera las imágenes.
          </p>
        </div>
        {savedCreatives.length > 0 && (
          <div className="badge-success text-sm px-3 py-1.5">
            <CheckCircle2 size={14} />
            {savedCreatives.length} aprobados
          </div>
        )}
      </div>

      {/* Project selector + generate button */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="label">Proyecto</label>
            <ProjectSelector value={projectId} onChange={setProjectId} />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!projectId || isGenerating}
            className="btn-primary py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-glow"
          >
            <Sparkles size={16} />
            {isGenerating ? 'Generando...' : 'Generar 100 Creativos'}
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
            <span className="badge text-xs badge-accent">✓ Proyecto cargado</span>
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
      {error && error !== 'no_claude' && error !== 'no_google' && (
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
          description="Elige un proyecto para generar tus 100 creativos listos para Meta Ads"
        />
      ) : (
        <>
          {/* Progress */}
          {isGenerating && (
            <GenerationProgress
              phase={phase}
              current={progress.current}
              total={progress.total}
              label={progress.label}
            />
          )}

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
                {savedCreatives.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'approved' ? 'bg-white/20 text-white' : 'bg-status-success/20 text-status-success'}`}>
                    {savedCreatives.length}
                  </span>
                )}
              </span>
            </button>
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
                  <p className="text-text-secondary text-sm max-w-sm mx-auto mb-4">
                    Claude AI creará 50 ángulos de venta únicos y Gemini generará 2 imágenes por ángulo — 100 creativos listos para Meta Ads.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-text-muted text-xs flex-wrap">
                    <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-accent-light" /> 50 ángulos con Claude</span>
                    <span className="flex items-center gap-1.5"><Wand2 size={12} className="text-status-success" /> 100 imágenes con Gemini</span>
                    <span className="flex items-center gap-1.5"><Info size={12} /> TÍTULO + CTA por creativo</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary bar */}
                  {creatives.length > 0 && (
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-text-muted">{creatives.length} creativos</span>
                        {approvedCount > 0 && (
                          <span className="text-status-success flex items-center gap-1">
                            <CheckCircle2 size={13} /> {approvedCount} aprobados
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="text-status-warning flex items-center gap-1">
                            <Zap size={13} /> {pendingCount} pendientes
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {creatives.map(creative => (
                      <CreativeCard
                        key={creative._key}
                        creative={creative}
                        branding={branding}
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
                  description="Genera creativos y aprueba los que quieras usar en tus campañas de Meta Ads"
                  action={
                    <button onClick={() => setTab('factory')} className="btn-primary">
                      <Sparkles size={15} /> Generar creativos
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {savedCreatives.map(c => (
                    <CreativeCard
                      key={c.id}
                      creative={{
                        _key: c.id,
                        angle: c.angle || c.angles,
                        imageUrl: c.imagen_url,
                        estado: c.estado,
                        generating: false,
                        error: null,
                      }}
                      branding={branding}
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
