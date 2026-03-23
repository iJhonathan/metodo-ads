import { useState } from 'react'
import {
  CheckCircle2, XCircle, Download, Loader2,
  AlertCircle, RefreshCw
} from 'lucide-react'
import { compositeAd } from '../../lib/composite'

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

const CTA_BY_TYPE = {
  dolor: 'Quiero solucionarlo →', resultado: 'Ver los resultados →',
  urgencia: 'Aprovechar ahora →', precio: 'Ver precio especial →',
  garantia: 'Empezar sin riesgo →', transformacion: 'Quiero transformarme →',
  curiosidad: 'Descubrir el secreto →', objecion: 'Ver cómo funciona →',
  miedo: 'Protegerme ahora →', comparacion: 'Comparar opciones →',
  testimonio: 'Ver más historias →', educativo: 'Aprender más →',
  provocacion: 'Demostrar que sí →', identidad: 'Ser parte ahora →',
  exclusividad: 'Acceder ahora →', social_proof: 'Unirme a ellos →',
  novedad: 'Ser el primero →', aspiracional: 'Empezar hoy →',
  humor: 'Ver más →', autoridad: 'Conocer más →',
}

const ESTADO_CONFIG = {
  aprobado:   { label: 'Aprobado',   color: 'bg-status-success/20 border-status-success/40 text-status-success' },
  descartado: { label: 'Descartado', color: 'bg-status-error/20 border-status-error/40 text-status-error' },
  pendiente:  { label: 'Pendiente',  color: 'bg-status-warning/20 border-status-warning/40 text-status-warning' },
}

export default function CreativeCard({
  creative,
  onApprove,
  onDiscard,
  onRetry,
  compact = false,
}) {
  const [downloading, setDownloading] = useState(false)
  const tipoColor = TIPO_COLORS[creative.angle?.tipo] || '#7c3aed'
  const estadoConf = ESTADO_CONFIG[creative.estado] || ESTADO_CONFIG.pendiente
  const ctaText = CTA_BY_TYPE[creative.angle?.tipo] || 'Descubrir más →'
  const copySnippet = creative.angle?.copy?.split('.')[0] || ''

  const handleDownload = async () => {
    if (!creative.imageUrl) return
    setDownloading(true)
    try {
      const composited = await compositeAd({
        imageUrl: creative.imageUrl,
        angle: creative.angle,
        branding: creative.branding,
      })
      const a = document.createElement('a')
      a.href = composited
      a.download = `metodo-ads-${creative.angle?.tipo || 'creativo'}-${Date.now()}.jpg`
      a.click()
    } catch (e) {
      console.error('Error al componer imagen:', e)
    } finally {
      setDownloading(false)
    }
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
            <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center animate-pulse-slow">
              <Loader2 size={22} className="text-white animate-spin" />
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
            {/* Background image */}
            <img
              src={creative.imageUrl}
              alt={creative.angle?.headline || 'Creativo'}
              className="w-full h-full object-cover"
            />

            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Tipo badge — top left */}
            <div className="absolute top-3 left-3">
              <span
                className="text-white text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: tipoColor + 'dd' }}
              >
                {TIPO_LABELS[creative.angle?.tipo] || creative.angle?.tipo}
              </span>
            </div>

            {/* Status badge — top right */}
            {creative.estado !== 'pendiente' && (
              <div className="absolute top-3 right-3">
                <span className={`badge border text-xs font-semibold ${estadoConf.color}`}>
                  {estadoConf.label}
                </span>
              </div>
            )}

            {/* Text overlay — bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Headline */}
              <p className="text-white font-bold text-sm leading-snug drop-shadow-lg mb-1 line-clamp-3">
                {creative.angle?.headline}
              </p>
              {/* Copy snippet */}
              {copySnippet && (
                <p className="text-white/75 text-xs leading-snug mb-3 line-clamp-2">
                  {copySnippet}.
                </p>
              )}
              {/* CTA pill */}
              <div
                className="inline-block px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg"
                style={{ backgroundColor: tipoColor }}
              >
                {ctaText}
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-text-muted text-xs">Sin imagen</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {creative.estado === 'pendiente' && !creative.generating && !creative.error && creative.imageUrl && (
        <div className="flex items-center gap-2 px-3 pb-3 pt-2 mt-auto">
          <button
            onClick={() => onDiscard?.(creative)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-status-error/10 border border-status-error/20 text-status-error hover:bg-status-error/20 transition-all"
          >
            <XCircle size={14} />
            Descartar
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-2 rounded-xl text-text-muted border border-border hover:border-border-hover hover:text-text-primary transition-all disabled:opacity-50"
            title="Descargar con texto"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
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
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all disabled:opacity-50"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {downloading ? 'Componiendo...' : 'Descargar con texto'}
          </button>
        </div>
      )}
    </div>
  )
}
