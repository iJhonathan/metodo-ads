import { useState } from 'react'
import {
  CheckCircle2, XCircle, Download, Loader2,
  AlertCircle, RefreshCw, Eye, EyeOff
} from 'lucide-react'

const TIPO_COLORS = {
  dolor: '#ef4444', curiosidad: '#eab308', objecion: '#f97316',
  miedo: '#f43f5e', resultado: '#10b981', comparacion: '#3b82f6',
  urgencia: '#dc2626', testimonio: '#14b8a6', educativo: '#06b6d4',
  provocacion: '#ec4899', identidad: '#6366f1', transformacion: '#059669',
  garantia: '#84cc16', precio: '#f59e0b', exclusividad: '#8b5cf6',
  social_proof: '#0ea5e9', novedad: '#a855f7', aspiracional: '#d946ef',
  humor: '#fbbf24', autoridad: '#60a5fa',
}

const TIPO_LABELS = {
  dolor: 'Dolor', curiosidad: 'Curiosidad', objecion: 'Objeción',
  miedo: 'Miedo', resultado: 'Resultado', comparacion: 'Comparación',
  urgencia: 'Urgencia', testimonio: 'Testimonio', educativo: 'Educativo',
  provocacion: 'Provocación', identidad: 'Identidad', transformacion: 'Transformación',
  garantia: 'Garantía', precio: 'Precio', exclusividad: 'Exclusividad',
  social_proof: 'Prueba Social', novedad: 'Novedad', aspiracional: 'Aspiracional',
  humor: 'Humor', autoridad: 'Autoridad',
}

const ESTADO_CONFIG = {
  aprobado:   { label: 'Aprobado',   color: 'bg-status-success/20 border-status-success/40 text-status-success' },
  descartado: { label: 'Descartado', color: 'bg-status-error/20 border-status-error/40 text-status-error' },
  pendiente:  { label: 'Pendiente',  color: 'bg-status-warning/20 border-status-warning/40 text-status-warning' },
}

export default function CreativeCard({
  creative,           // { id?, angle, imageUrl, estado, generating, error }
  onApprove,
  onDiscard,
  onRetry,
  onDownload,
  compact = false,
}) {
  const [showCopy, setShowCopy] = useState(false)
  const tipoColor = TIPO_COLORS[creative.angle?.tipo] || '#7c3aed'
  const estadoConf = ESTADO_CONFIG[creative.estado] || ESTADO_CONFIG.pendiente

  const handleDownload = () => {
    if (!creative.imageUrl) return
    const a = document.createElement('a')
    a.href = creative.imageUrl
    a.download = `creativo-${creative.angle?.tipo || 'ads'}-${Date.now()}.png`
    a.click()
  }

  return (
    <div className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200
      ${creative.estado === 'aprobado' ? 'border-status-success/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
        creative.estado === 'descartado' ? 'border-status-error/30 opacity-60' :
        'border-border hover:border-border-hover shadow-card hover:shadow-card-hover'
      }`}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-surface-3 overflow-hidden">
        {creative.generating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center animate-pulse-slow">
                <Loader2 size={22} className="text-white animate-spin" />
              </div>
            </div>
            <p className="text-text-secondary text-xs text-center px-4">
              Generando imagen con Gemini...
            </p>
          </div>
        ) : creative.error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-surface-3">
            <div className="w-10 h-10 rounded-xl bg-status-error/10 flex items-center justify-center">
              <AlertCircle size={20} className="text-status-error" />
            </div>
            <p className="text-status-error text-xs text-center leading-relaxed">{creative.error}</p>
            {onRetry && (
              <button onClick={() => onRetry(creative)} className="btn-ghost text-xs py-1.5 px-3">
                <RefreshCw size={12} />
                Reintentar
              </button>
            )}
          </div>
        ) : creative.imageUrl ? (
          <>
            <img
              src={creative.imageUrl}
              alt={creative.angle?.headline || 'Creativo'}
              className="w-full h-full object-cover"
            />
            {/* Status badge overlay */}
            {creative.estado !== 'pendiente' && (
              <div className="absolute top-2 right-2">
                <span className={`badge border text-xs font-semibold ${estadoConf.color}`}>
                  {estadoConf.label}
                </span>
              </div>
            )}
            {/* Tipo badge */}
            <div className="absolute top-2 left-2">
              <span
                className="badge text-xs font-semibold text-white"
                style={{ backgroundColor: tipoColor + 'cc' }}
              >
                {TIPO_LABELS[creative.angle?.tipo] || creative.angle?.tipo}
              </span>
            </div>
            {/* Copy toggle */}
            <button
              onClick={() => setShowCopy(!showCopy)}
              className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
              title={showCopy ? 'Ocultar copy' : 'Ver copy'}
            >
              {showCopy ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            {/* Copy overlay */}
            {showCopy && (
              <div className="absolute inset-0 bg-black/80 flex flex-col justify-end p-3">
                <p className="text-white font-bold text-sm leading-tight mb-1">
                  {creative.angle?.headline}
                </p>
                <p className="text-white/80 text-xs leading-relaxed">
                  {creative.angle?.copy}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-text-muted text-xs">Sin imagen</p>
          </div>
        )}
      </div>

      {/* Headline */}
      {!compact && (
        <div className="px-3 pt-3 pb-1">
          <p className="text-text-primary font-semibold text-sm leading-snug line-clamp-2">
            {creative.angle?.headline}
          </p>
        </div>
      )}

      {/* Actions */}
      {creative.estado === 'pendiente' && !creative.generating && !creative.error && (
        <div className="flex items-center gap-2 px-3 pb-3 pt-2 mt-auto">
          <button
            onClick={() => onDiscard?.(creative)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-status-error/10 border border-status-error/20 text-status-error hover:bg-status-error/20 transition-all"
          >
            <XCircle size={14} />
            Descartar
          </button>
          <button
            onClick={() => onDownload ? onDownload(creative) : handleDownload()}
            className="p-2 rounded-xl text-text-muted border border-border hover:border-border-hover hover:text-text-primary transition-all"
            title="Descargar"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => onApprove?.(creative)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-status-success/10 border border-status-success/20 text-status-success hover:bg-status-success/20 transition-all"
          >
            <CheckCircle2 size={14} />
            Aprobar
          </button>
        </div>
      )}

      {/* Already decided — just download */}
      {(creative.estado === 'aprobado' || creative.estado === 'descartado') && creative.imageUrl && (
        <div className="px-3 pb-3 pt-2 mt-auto">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all"
          >
            <Download size={13} />
            Descargar
          </button>
        </div>
      )}
    </div>
  )
}
