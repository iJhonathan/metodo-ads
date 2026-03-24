import { useState } from 'react'
import {
  CheckCircle2, XCircle, Download, Loader2,
  AlertCircle, RefreshCw, Copy, Check
} from 'lucide-react'
import { ANGLE_TYPES } from '../../lib/claude'

function CopyField({ label, value, accent }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!value) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl">
      <span className="text-text-muted text-xs font-semibold uppercase tracking-wider flex-shrink-0 w-10">{label}</span>
      <p className={`text-sm font-medium leading-snug flex-1 truncate ${accent ? 'text-accent-light font-bold tracking-wide' : 'text-text-primary'}`}>
        {value}
      </p>
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all flex-shrink-0
          ${copied
            ? 'bg-status-success/20 text-status-success'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-3'
          }`}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </div>
  )
}

const ESTADO_CONFIG = {
  aprobado:   { label: 'Aprobado',   color: 'bg-status-success/20 border-status-success/40 text-status-success' },
  descartado: { label: 'Descartado', color: 'bg-status-error/20 border-status-error/40 text-status-error' },
  pendiente:  { label: 'Pendiente',  color: 'bg-status-warning/20 border-status-warning/40 text-status-warning' },
}

const ANGLE_BADGE_COLOR = {
  dolor:         'bg-red-500/15 border-red-500/30 text-red-400',
  curiosidad:    'bg-blue-500/15 border-blue-500/30 text-blue-400',
  urgencia:      'bg-orange-500/15 border-orange-500/30 text-orange-400',
  resultado:     'bg-green-500/15 border-green-500/30 text-green-400',
  social_proof:  'bg-sky-500/15 border-sky-500/30 text-sky-400',
  transformacion:'bg-pink-500/15 border-pink-500/30 text-pink-400',
  miedo:         'bg-rose-600/15 border-rose-600/30 text-rose-400',
  objecion:      'bg-purple-500/15 border-purple-500/30 text-purple-400',
  testimonio:    'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  precio:        'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  novedad:       'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  aspiracional:  'bg-violet-500/15 border-violet-500/30 text-violet-400',
  educativo:     'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
  humor:         'bg-amber-500/15 border-amber-500/30 text-amber-400',
  garantia:      'bg-teal-500/15 border-teal-500/30 text-teal-400',
  exclusividad:  'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-400',
  autoridad:     'bg-slate-400/15 border-slate-400/30 text-slate-300',
  provocacion:   'bg-red-700/15 border-red-700/30 text-red-300',
  comparacion:   'bg-blue-700/15 border-blue-700/30 text-blue-300',
  identidad:     'bg-purple-700/15 border-purple-700/30 text-purple-300',
}

export default function CreativeCard({
  creative,
  onApprove,
  onDiscard,
  onRetry,
}) {
  const estadoConf = ESTADO_CONFIG[creative.estado] || ESTADO_CONFIG.pendiente
  const titulo = creative.angle?.titulo || ''
  const cta = creative.angle?.cta || ''
  const tipo = creative.angle?.tipo || ''
  const tipoLabel = ANGLE_TYPES.find(a => a.key === tipo)?.label || tipo
  const angleBadgeColor = ANGLE_BADGE_COLOR[tipo] || 'bg-surface-3 border-border text-text-muted'

  const handleDownload = () => {
    if (!creative.imageUrl) return
    const a = document.createElement('a')
    a.href = creative.imageUrl
    a.download = `metodo-ads-${creative.angle?.tipo || 'creativo'}-${Date.now()}.jpg`
    a.click()
  }

  return (
    <div className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200
      ${creative.estado === 'aprobado' ? 'border-status-success/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
        creative.estado === 'descartado' ? 'border-status-error/30 opacity-50' :
        'border-border hover:border-border-hover shadow-card hover:shadow-card-hover'
      }`}
    >
      {/* ÁNGULO badge */}
      {tipoLabel && (
        <div className="px-3 pt-3 pb-0">
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border ${angleBadgeColor}`}>
            {tipoLabel}
          </span>
        </div>
      )}

      {/* COPY — arriba de la imagen (copy de Facebook, más largo) */}
      {titulo && (
        <div className="p-3 pb-0">
          <CopyField label="Copy" value={titulo} />
        </div>
      )}

      {/* IMAGEN — centro (ya viene compositada con texto_imagen + CTA pill) */}
      <div className="relative aspect-square bg-surface-3 overflow-hidden m-3 rounded-xl">
        {creative.generating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center animate-pulse-slow">
              <Loader2 size={22} className="text-white animate-spin" />
            </div>
            <p className="text-text-secondary text-xs text-center px-4">Generando imagen...</p>
          </div>
        ) : creative.error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-surface-3">
            <div className="w-10 h-10 rounded-xl bg-status-error/10 flex items-center justify-center">
              <AlertCircle size={20} className="text-status-error" />
            </div>
            <p className="text-status-error text-xs text-center leading-relaxed">{creative.error}</p>
            {onRetry && (
              <button onClick={() => onRetry(creative)} className="btn-ghost text-xs py-1.5 px-3">
                <RefreshCw size={12} /> Reintentar
              </button>
            )}
          </div>
        ) : creative.imageUrl ? (
          <>
            <img
              src={creative.imageUrl}
              alt={creative.angle?.texto_imagen || 'Creativo'}
              className="w-full h-full object-cover"
            />
            {/* Estado badge */}
            {creative.estado !== 'pendiente' && (
              <div className="absolute top-2 right-2">
                <span className={`badge border text-xs font-semibold ${estadoConf.color}`}>
                  {estadoConf.label}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-text-muted text-xs">Sin imagen</p>
          </div>
        )}
      </div>

      {/* CTA — debajo de la imagen */}
      {cta && (
        <div className="px-3">
          <CopyField label="CTA" value={cta} accent />
        </div>
      )}

      {/* Actions */}
      {creative.estado === 'pendiente' && !creative.generating && !creative.error && creative.imageUrl && (
        <div className="flex items-center gap-2 px-3 pb-3 pt-2">
          <button
            onClick={() => onDiscard?.(creative)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-status-error/10 border border-status-error/20 text-status-error hover:bg-status-error/20 transition-all"
          >
            <XCircle size={14} /> Descartar
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl text-text-muted border border-border hover:border-border-hover hover:text-text-primary transition-all"
            title="Descargar imagen"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => onApprove?.(creative)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-status-success/10 border border-status-success/20 text-status-success hover:bg-status-success/20 transition-all"
          >
            <CheckCircle2 size={14} /> Aprobar
          </button>
        </div>
      )}

      {(creative.estado === 'aprobado' || creative.estado === 'descartado') && creative.imageUrl && (
        <div className="px-3 pb-3 pt-2">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all"
          >
            <Download size={13} /> Descargar imagen
          </button>
        </div>
      )}
    </div>
  )
}
