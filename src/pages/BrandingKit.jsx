import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Palette, Save, CheckCircle2, Plus, X, Info,
  MessageSquare, Sparkles, Users, Eye, MapPin, UserCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProjectSelector from '../components/ui/ProjectSelector'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

// ──────────────────────────────────────────────
// Options
// ──────────────────────────────────────────────
const TONOS = [
  { value: 'profesional', label: 'Profesional', desc: 'Formal, confiable, experto' },
  { value: 'amigable', label: 'Amigable', desc: 'Cercano, cálido, conversacional' },
  { value: 'urgente', label: 'Urgente', desc: 'Directo, FOMO, acción inmediata' },
  { value: 'inspirador', label: 'Inspirador', desc: 'Motivacional, aspiracional' },
  { value: 'humoristico', label: 'Humorístico', desc: 'Divertido, entretenido, memorable' },
  { value: 'educativo', label: 'Educativo', desc: 'Informativo, didáctico' },
  { value: 'agresivo', label: 'Agresivo', desc: 'Impactante, sin rodeos, challengeador' },
  { value: 'empatico', label: 'Empático', desc: 'Comprensivo, emocional, conecta con el dolor' },
]

const ESTILOS = [
  { value: 'moderno', label: 'Moderno', emoji: '✨' },
  { value: 'minimalista', label: 'Minimalista', emoji: '○' },
  { value: 'agresivo', label: 'Agresivo', emoji: '⚡' },
  { value: 'elegante', label: 'Elegante', emoji: '◆' },
  { value: 'vintage', label: 'Vintage', emoji: '🎞' },
  { value: 'bold', label: 'Bold / Atrevido', emoji: '🔥' },
  { value: 'corporativo', label: 'Corporativo', emoji: '🏢' },
  { value: 'lifestyle', label: 'Lifestyle', emoji: '🌿' },
]

const GENEROS = [
  { value: 'Mujeres', label: 'Mujeres', emoji: '♀' },
  { value: 'Hombres', label: 'Hombres', emoji: '♂' },
  { value: 'Todos (mixto)', label: 'Todos (mixto)', emoji: '⚥' },
]

const MERCADOS = [
  'Latinoamérica (América Latina)',
  'España',
  'Estados Unidos (español)',
  'Europa hispanohablante',
  'Global hispanohablante',
  'Otro (especificar)',
]

const PRESET_COLORS = [
  '#7c3aed', '#5b21b6', '#3b82f6', '#0ea5e9',
  '#10b981', '#22c55e', '#f59e0b', '#f97316',
  '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4',
  '#ffffff', '#94a3b8', '#1e293b', '#000000',
]

// ──────────────────────────────────────────────
// Color Picker
// ──────────────────────────────────────────────
function ColorPicker({ colors, onChange }) {
  const [inputVal, setInputVal] = useState('')

  const addColor = (hex) => {
    if (!hex || colors.includes(hex) || colors.length >= 6) return
    onChange([...colors, hex])
  }

  const removeColor = (hex) => onChange(colors.filter(c => c !== hex))

  const handleInputAdd = () => {
    const hex = inputVal.trim()
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      addColor(hex)
      setInputVal('')
    }
  }

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map(hex => (
            <div key={hex} className="group relative flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
              <div
                className="w-5 h-5 rounded-md border border-white/10 flex-shrink-0"
                style={{ backgroundColor: hex }}
              />
              <span className="text-text-secondary text-xs font-mono">{hex}</span>
              <button
                onClick={() => removeColor(hex)}
                className="text-text-muted hover:text-status-error transition-colors ml-1"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-text-muted text-xs mb-2">Colores rápidos</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(hex => (
            <button
              key={hex}
              onClick={() => addColor(hex)}
              disabled={colors.includes(hex) || colors.length >= 6}
              className={`w-8 h-8 rounded-lg border-2 transition-all duration-150 flex-shrink-0
                ${colors.includes(hex)
                  ? 'border-accent scale-90 opacity-50 cursor-not-allowed'
                  : 'border-transparent hover:border-white/40 hover:scale-110'
                }`}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <input
            type="color"
            value={inputVal || '#7c3aed'}
            onChange={e => setInputVal(e.target.value)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded cursor-pointer border-none bg-transparent"
          />
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInputAdd()}
            placeholder="#rrggbb"
            maxLength={7}
            className="input-field pl-10 font-mono text-sm"
          />
        </div>
        <button
          onClick={handleInputAdd}
          disabled={!/^#[0-9A-Fa-f]{6}$/.test(inputVal.trim()) || colors.length >= 6}
          className="btn-secondary text-sm py-3 disabled:opacity-40"
        >
          <Plus size={15} />
          Agregar
        </button>
        <span className="text-text-muted text-xs">{colors.length}/6</span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Option button grid
// ──────────────────────────────────────────────
function OptionGrid({ options, value, onChange, columns = 4 }) {
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }
  return (
    <div className={`grid ${cols[columns]} gap-2.5`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value === value ? null : opt.value)}
          className={`p-3 rounded-xl border text-left transition-all duration-200
            ${value === opt.value
              ? 'bg-accent/20 border-accent/50 text-accent-light shadow-glow-sm'
              : 'bg-background border-border hover:border-border-hover text-text-secondary hover:text-text-primary'
            }`}
        >
          {opt.emoji && <div className="text-lg mb-1">{opt.emoji}</div>}
          <div className="font-medium text-sm">{opt.label}</div>
          {opt.desc && <div className="text-xs opacity-60 mt-0.5 leading-tight">{opt.desc}</div>}
        </button>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// Preview
// ──────────────────────────────────────────────
function BrandingPreview({ form }) {
  const primaryColor = form.colores?.[0] || '#7c3aed'
  const secondaryColor = form.colores?.[1] || '#1a1a2e'

  const edadLabel = form.edad_desde && form.edad_hasta
    ? `${form.edad_desde}–${form.edad_hasta} años`
    : null

  return (
    <div className="card border-accent/20">
      <div className="flex items-center gap-2 mb-4">
        <Eye size={15} className="text-accent-light" />
        <span className="text-text-secondary text-sm font-medium">Vista previa de marca</span>
      </div>

      <div
        className="rounded-xl p-5 border border-white/10"
        style={{ background: `linear-gradient(135deg, ${secondaryColor}cc, ${primaryColor}22)` }}
      >
        {form.colores?.length > 0 && (
          <div className="flex gap-2 mb-4">
            {form.colores.map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-lg shadow-md" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}

        <div
          className="inline-block px-3 py-1 rounded-full text-white text-xs font-medium mb-3"
          style={{ backgroundColor: primaryColor }}
        >
          {form.tono || 'Tu tono'} · {form.estilo || 'Tu estilo'}
        </div>

        <p className="text-white font-bold text-lg leading-tight mb-1">
          Titular de ejemplo para tu anuncio
        </p>
        <p className="text-white/70 text-sm">
          {form.publico_detallado
            ? `Dirigido a: ${form.publico_detallado.slice(0, 60)}${form.publico_detallado.length > 60 ? '…' : ''}`
            : 'Descripción del copy de tu anuncio publicitario'
          }
        </p>

        {/* Audience tags */}
        {(form.genero || edadLabel || form.mercado) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {form.genero && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/80">
                {form.genero}
              </span>
            )}
            {edadLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/80">
                {edadLabel}
              </span>
            )}
            {form.mercado && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/80">
                {form.mercado === 'Otro (especificar)' ? form.mercado_personalizado || 'Otro' : form.mercado}
              </span>
            )}
          </div>
        )}

        <div
          className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium text-center"
          style={{ backgroundColor: primaryColor }}
        >
          Llamada a la acción
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
export default function BrandingKit() {
  const [searchParams] = useSearchParams()
  const [projectId, setProjectId] = useState(searchParams.get('project') || null)
  const [form, setForm] = useState({
    colores: [],
    tono: null,
    estilo: null,
    genero: null,
    edad_desde: '',
    edad_hasta: '',
    mercado: null,
    mercado_personalizado: '',
    publico_detallado: '',
  })
  const [savedForm, setSavedForm] = useState(null)
  const [kitId, setKitId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (projectId) fetchBranding(projectId)
    else resetForm()
  }, [projectId])

  function resetForm() {
    const empty = {
      colores: [],
      tono: null,
      estilo: null,
      genero: null,
      edad_desde: '',
      edad_hasta: '',
      mercado: null,
      mercado_personalizado: '',
      publico_detallado: '',
    }
    setForm(empty)
    setSavedForm(empty)
    setKitId(null)
  }

  async function fetchBranding(pid) {
    setLoading(true)
    const { data } = await supabase
      .from('branding_kits')
      .select('*')
      .eq('project_id', pid)
      .maybeSingle()

    if (data) {
      const loaded = {
        colores: Array.isArray(data.colores) ? data.colores : [],
        tono: data.tono || null,
        estilo: data.estilo || null,
        genero: data.genero || null,
        edad_desde: data.edad_desde ?? '',
        edad_hasta: data.edad_hasta ?? '',
        mercado: data.mercado || null,
        mercado_personalizado: data.mercado_personalizado || '',
        publico_detallado: data.publico_detallado || '',
      }
      setForm(loaded)
      setSavedForm(loaded)
      setKitId(data.id)
    } else {
      resetForm()
    }
    setLoading(false)
  }

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!projectId) return
    setSaving(true)

    const payload = {
      project_id: projectId,
      colores: form.colores,
      tono: form.tono,
      estilo: form.estilo,
      genero: form.genero,
      edad_desde: form.edad_desde !== '' ? Number(form.edad_desde) : null,
      edad_hasta: form.edad_hasta !== '' ? Number(form.edad_hasta) : null,
      mercado: form.mercado,
      mercado_personalizado: form.mercado_personalizado || null,
      publico_detallado: form.publico_detallado,
      updated_at: new Date().toISOString(),
    }

    if (kitId) {
      await supabase.from('branding_kits').update(payload).eq('id', kitId)
    } else {
      const { data } = await supabase.from('branding_kits').insert(payload).select().single()
      if (data) setKitId(data.id)
    }

    setSavedForm({ ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm)

  // Audience fields completeness
  const audienceComplete = form.genero && form.edad_desde && form.edad_hasta && form.mercado

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <div className="p-2 rounded-xl bg-status-warning/15 border border-status-warning/20">
            <Palette size={22} className="text-status-warning" />
          </div>
          Branding Kit
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Define los colores, tono y estilo visual de tu marca. Esta información alimenta los prompts de generación de creativos.
        </p>
      </div>

      {/* Project selector */}
      <div className="card mb-6">
        <label className="label">Proyecto</label>
        <ProjectSelector value={projectId} onChange={setProjectId} />
      </div>

      {!projectId ? (
        <EmptyState
          icon={Palette}
          title="Selecciona un proyecto"
          description="Elige un proyecto para configurar su branding kit"
        />
      ) : loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Cargando branding..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col: form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Colores */}
            <div className="card">
              <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-accent" />
                Colores de Marca
                <span className="text-text-muted text-xs font-normal ml-1">(máx. 6)</span>
              </h2>
              <ColorPicker
                colors={form.colores}
                onChange={(c) => set('colores', c)}
              />
            </div>

            {/* Tono */}
            <div className="card">
              <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                <MessageSquare size={17} className="text-status-warning" />
                Tono de Comunicación
              </h2>
              <OptionGrid
                options={TONOS}
                value={form.tono}
                onChange={(v) => set('tono', v)}
                columns={4}
              />
            </div>

            {/* Estilo */}
            <div className="card">
              <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={17} className="text-status-info" />
                Estilo Visual
              </h2>
              <OptionGrid
                options={ESTILOS}
                value={form.estilo}
                onChange={(v) => set('estilo', v)}
                columns={4}
              />
            </div>

            {/* Público Objetivo — campos estructurados */}
            <div className="card">
              <h2 className="text-text-primary font-semibold mb-1 flex items-center gap-2">
                <Users size={17} className="text-status-success" />
                Público Objetivo Detallado
                {audienceComplete && (
                  <span className="ml-auto text-xs text-status-success flex items-center gap-1">
                    <CheckCircle2 size={12} /> Completo
                  </span>
                )}
              </h2>
              <p className="text-text-muted text-xs mb-5">
                Esta información define quién verá tus anuncios y personaliza los creativos generados.
              </p>

              {/* Género */}
              <div className="mb-5">
                <label className="label flex items-center gap-1.5">
                  <UserCheck size={13} className="text-text-muted" />
                  Género
                  <span className="text-status-error text-xs">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {GENEROS.map(g => (
                    <button
                      key={g.value}
                      onClick={() => set('genero', g.value === form.genero ? null : g.value)}
                      className={`p-3 rounded-xl border text-center transition-all duration-200
                        ${form.genero === g.value
                          ? 'bg-accent/20 border-accent/50 text-accent-light shadow-glow-sm'
                          : 'bg-background border-border hover:border-border-hover text-text-secondary hover:text-text-primary'
                        }`}
                    >
                      <div className="text-lg mb-0.5">{g.emoji}</div>
                      <div className="font-medium text-sm">{g.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rango de edad */}
              <div className="mb-5">
                <label className="label flex items-center gap-1.5">
                  Rango de Edad
                  <span className="text-status-error text-xs">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-text-muted text-xs mb-1 block">Desde</label>
                    <input
                      type="number"
                      value={form.edad_desde}
                      onChange={e => set('edad_desde', e.target.value)}
                      placeholder="18"
                      min={13}
                      max={99}
                      className="input-field text-center"
                    />
                  </div>
                  <span className="text-text-muted text-sm mt-5">—</span>
                  <div className="flex-1">
                    <label className="text-text-muted text-xs mb-1 block">Hasta</label>
                    <input
                      type="number"
                      value={form.edad_hasta}
                      onChange={e => set('edad_hasta', e.target.value)}
                      placeholder="65"
                      min={13}
                      max={99}
                      className="input-field text-center"
                    />
                  </div>
                  <div className="flex-1 mt-5">
                    {form.edad_desde && form.edad_hasta && (
                      <div className="text-text-secondary text-sm text-center bg-surface-3 border border-border rounded-xl py-2.5 px-3">
                        {form.edad_desde}–{form.edad_hasta} años
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mercado */}
              <div className="mb-5">
                <label className="label flex items-center gap-1.5">
                  <MapPin size={13} className="text-text-muted" />
                  Ubicación / Mercado
                  <span className="text-status-error text-xs">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MERCADOS.map(m => (
                    <button
                      key={m}
                      onClick={() => set('mercado', m === form.mercado ? null : m)}
                      className={`px-3 py-2.5 rounded-xl border text-left text-sm transition-all duration-200
                        ${form.mercado === m
                          ? 'bg-accent/20 border-accent/50 text-accent-light shadow-glow-sm'
                          : 'bg-background border-border hover:border-border-hover text-text-secondary hover:text-text-primary'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {form.mercado === 'Otro (especificar)' && (
                  <input
                    type="text"
                    value={form.mercado_personalizado}
                    onChange={e => set('mercado_personalizado', e.target.value)}
                    placeholder="Ej: México, Colombia, Argentina..."
                    className="input-field mt-3"
                  />
                )}
              </div>

              {/* Descripción libre */}
              <div>
                <label className="label">Descripción adicional del cliente ideal <span className="text-text-muted font-normal">(opcional)</span></label>
                <textarea
                  value={form.publico_detallado}
                  onChange={e => set('publico_detallado', e.target.value)}
                  placeholder="Ej: Interesadas en salud y bienestar, con poder adquisitivo medio-alto, frustradas con dietas que no funcionan, activas en redes sociales..."
                  className="input-field resize-none"
                  rows={3}
                />
                <p className="text-text-muted text-xs mt-2 flex items-start gap-1.5">
                  <Info size={12} className="mt-0.5 flex-shrink-0" />
                  Incluye intereses, dolores, comportamiento y cualquier detalle adicional que enriquezca los creativos.
                </p>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-3">
              {isDirty && savedForm && (
                <button
                  onClick={() => { setForm({ ...savedForm }); setSaved(false) }}
                  className="btn-ghost text-sm"
                >
                  Descartar cambios
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="btn-primary disabled:opacity-50"
              >
                {saved
                  ? <><CheckCircle2 size={15} /> Guardado</>
                  : <><Save size={15} /> {saving ? 'Guardando...' : 'Guardar Branding Kit'}</>
                }
              </button>
            </div>
          </div>

          {/* Right col: preview + summary */}
          <div className="space-y-4">
            <BrandingPreview form={form} />

            {/* Summary card */}
            <div className="card text-sm space-y-3">
              <p className="text-text-primary font-semibold text-sm">Resumen del Kit</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Colores</span>
                  {form.colores.length > 0 ? (
                    <div className="flex gap-1">
                      {form.colores.slice(0, 4).map(c => (
                        <div key={c} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                      ))}
                      {form.colores.length > 4 && <span className="text-text-muted text-xs">+{form.colores.length - 4}</span>}
                    </div>
                  ) : <span className="text-text-muted text-xs">Sin definir</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Tono</span>
                  <span className={form.tono ? 'text-text-primary capitalize' : 'text-text-muted text-xs'}>
                    {form.tono ? TONOS.find(t => t.value === form.tono)?.label : 'Sin definir'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Estilo</span>
                  <span className={form.estilo ? 'text-text-primary capitalize' : 'text-text-muted text-xs'}>
                    {form.estilo ? ESTILOS.find(s => s.value === form.estilo)?.label : 'Sin definir'}
                  </span>
                </div>

                {/* New audience fields */}
                <div className="border-t border-border pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Género</span>
                    <span className={form.genero ? 'text-text-primary' : 'text-status-warning text-xs'}>
                      {form.genero || 'Sin definir ⚠'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Edad</span>
                    <span className={form.edad_desde && form.edad_hasta ? 'text-text-primary' : 'text-status-warning text-xs'}>
                      {form.edad_desde && form.edad_hasta
                        ? `${form.edad_desde}–${form.edad_hasta} años`
                        : 'Sin definir ⚠'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-muted flex-shrink-0">Mercado</span>
                    <span className={`text-right text-xs ${form.mercado ? 'text-text-primary' : 'text-status-warning'}`}>
                      {form.mercado
                        ? (form.mercado === 'Otro (especificar)' ? form.mercado_personalizado || 'Otro' : form.mercado)
                        : 'Sin definir ⚠'
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Descripción</span>
                  <span className={form.publico_detallado ? 'text-status-success text-xs' : 'text-text-muted text-xs'}>
                    {form.publico_detallado ? '✓ Definida' : 'Opcional'}
                  </span>
                </div>
              </div>

              {!audienceComplete && (
                <div className="mt-2 p-2.5 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                  <p className="text-status-warning text-xs leading-relaxed">
                    Completa género, edad y mercado para desbloquear la Fábrica Creativa.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
