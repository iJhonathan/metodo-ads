import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookOpen, Save, RefreshCw, CheckCircle2, Info,
  FileText, Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProjectSelector from '../components/ui/ProjectSelector'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const TIPS = [
  '¿Qué problema resuelve tu producto?',
  '¿Cuáles son los beneficios principales?',
  '¿Qué objeciones suelen tener tus clientes?',
  '¿Cuál es tu propuesta de valor única?',
  '¿Qué resultados han obtenido tus clientes?',
  '¿Cuál es la historia de tu marca?',
  '¿Qué te diferencia de la competencia?',
  '¿Qué testimonios o casos de éxito tienes?',
]

const PLACEHOLDER = `Ejemplo de lo que puedes incluir:

**Sobre el producto:**
Mi producto es un suplemento para perder peso de forma natural. Contiene ingredientes 100% naturales como té verde, jengibre y cúrcuma. No tiene efectos secundarios y ha sido respaldado por médicos.

**Beneficios clave:**
- Acelera el metabolismo hasta 40%
- Reduce el apetito de forma natural
- Mejora la energía durante el día
- Resultados visibles en 30 días

**Público objetivo:**
Mujeres de 30-50 años que han intentado dietas sin éxito, frustradas con su peso, que buscan una solución natural y sin esfuerzo extremo.

**Objeciones comunes:**
- "Ya probé muchos productos y no me funcionó" → Mostrar testimonios reales
- "Es muy caro" → Calcular costo por día vs beneficio
- "¿Tiene efectos secundarios?" → Resaltar ingredientes naturales

**Testimonios:**
María P., 42 años: "Bajé 8 kilos en 2 meses sin dejar de comer lo que me gusta."`

export default function KnowledgeBase() {
  const [searchParams] = useSearchParams()
  const [projectId, setProjectId] = useState(searchParams.get('project') || null)
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showTips, setShowTips] = useState(true)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    if (projectId) fetchKnowledge(projectId)
    else { setContent(''); setSavedContent(''); setCharCount(0) }
  }, [projectId])

  async function fetchKnowledge(pid) {
    setLoading(true)
    const { data } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('project_id', pid)
      .maybeSingle()

    const text = data?.contenido || ''
    setContent(text)
    setSavedContent(text)
    setCharCount(text.length)
    setLoading(false)
  }

  const handleChange = (val) => {
    setContent(val)
    setCharCount(val.length)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!projectId) return
    setSaving(true)

    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('knowledge_base')
        .update({ contenido: content, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('knowledge_base')
        .insert({ project_id: projectId, contenido: content })
    }

    setSavedContent(content)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const handleReset = () => {
    setContent(savedContent)
    setCharCount(savedContent.length)
  }

  const isDirty = content !== savedContent

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="page-header">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/15 border border-accent/20">
                <BookOpen size={22} className="text-accent-light" />
              </div>
              Base de Conocimiento
            </h1>
            <p className="text-text-secondary mt-2 text-sm">
              Agrega información sobre tu producto. Esta base alimenta los prompts de IA para generar ángulos más relevantes.
            </p>
          </div>
        </div>
      </div>

      {/* Project selector */}
      <div className="card mb-6">
        <label className="label">Proyecto</label>
        <ProjectSelector value={projectId} onChange={setProjectId} />
      </div>

      {!projectId ? (
        <EmptyState
          icon={BookOpen}
          title="Selecciona un proyecto"
          description="Elige un proyecto para ver o editar su base de conocimiento"
        />
      ) : loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Cargando conocimiento..." />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tips section */}
          <div className="bg-accent/5 border border-accent/15 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left"
            >
              <div className="flex items-center gap-2.5">
                <Lightbulb size={16} className="text-accent-light" />
                <span className="text-text-primary font-medium text-sm">¿Qué incluir en la base de conocimiento?</span>
              </div>
              {showTips ? <ChevronUp size={15} className="text-text-muted" /> : <ChevronDown size={15} className="text-text-muted" />}
            </button>
            {showTips && (
              <div className="px-5 pb-4 pt-1 grid grid-cols-2 gap-2">
                {TIPS.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-text-secondary text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-text-muted" />
                <span className="text-text-secondary text-sm font-medium">Contenido</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${charCount > 5000 ? 'text-status-warning' : 'text-text-muted'}`}>
                  {charCount.toLocaleString()} caracteres
                </span>
                {isDirty && (
                  <span className="badge-warning text-xs">Sin guardar</span>
                )}
                {saved && (
                  <span className="badge-success text-xs flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    Guardado
                  </span>
                )}
              </div>
            </div>

            <textarea
              value={content}
              onChange={e => handleChange(e.target.value)}
              placeholder={PLACEHOLDER}
              className="w-full bg-background border border-border hover:border-border-hover focus:border-accent rounded-xl p-4 text-text-primary text-sm placeholder-text-muted outline-none resize-none transition-all duration-200 font-mono leading-relaxed"
              rows={22}
            />

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-text-muted text-xs">
                <Info size={13} />
                <span>Puedes usar texto libre. Cuanto más detallado, mejores serán los ángulos generados.</span>
              </div>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <button onClick={handleReset} className="btn-ghost text-sm py-2">
                    <RefreshCw size={14} />
                    Descartar
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saved
                    ? <><CheckCircle2 size={15} /> Guardado</>
                    : <><Save size={15} /> {saving ? 'Guardando...' : 'Guardar'}</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Info footer */}
          <div className="flex items-start gap-3 bg-surface-3 border border-border rounded-xl px-4 py-3.5">
            <Info size={16} className="text-text-muted flex-shrink-0 mt-0.5" />
            <p className="text-text-muted text-xs leading-relaxed">
              Esta información se incluye automáticamente como contexto cuando generas ángulos de venta en el módulo <strong className="text-text-secondary">Ángulos de Venta</strong>.
              Cuanto más detallada sea, más precisos y relevantes serán los ángulos generados por la IA.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
