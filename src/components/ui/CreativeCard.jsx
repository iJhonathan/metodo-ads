import { useState } from 'react'
import {
  CheckCircle2, XCircle, Download, Loader2,
  AlertCircle, RefreshCw, Copy, Check
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

function CopyField({ label, value, accent }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">{label}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all
            ${copied
              ? 'bg-status-success/20 text-status-success'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-3'
            }`}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p className={`text-sm font-medium leading-snug ${accent ? 'text-accent-light font-bold tracking-wide' : 'text-text-primary'}`}>
        {value || '—'}
      </p>
    </div>
  )
}

export default function CreativeCard({
  creative,
  branding,
  onApprove,
  onDiscard,
  onRetry,
}) {
  const [downloading, setDownloading] = useState(false)
  const tipoColor = TIPO_COLORS[creative.angle?.tipo] || '#7c3aed'

  // Soporte para campo nuevo (titulo/cta) y campo legado (headline)
  const titulo = creative.angle?.titulo || creative.angle?.headline || ''
  const cta = creative.angle?.cta || ''

  const handleDownload = async () => {
    if (!creative.imageUrl) return
    setDownloading(true)
    try {
      const composited = await compositeAd({
        imageUrl: creative.imageUrl,
        angle: { ...creative.angle, titulo, cta },
        branding,
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
        creative.estado === 'descartado' ? 'border-status-error/30 opacity-50' :
        'border-border hover:border-border-hover shadow-card hover:shadow-card-hover'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-surface-3 overflow-hidden">
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
              alt={titulo}
              className="w-full h-full object-cover"
            />
            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Tipo badge */}
            <div className="absolute top-3 left-3">
              <span className="text-white text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: tipoColor + 'dd' }}>
                {TIPO_LABELS[creative.angle?.tipo] || creative.angle?.tipo}
              </span>
            </div>

            {/* Estado badge */}
            {creative.estado === 'aprobado' && (
              <div className="absolute top-3 right-3">
                <span className="badge border text-xs font-semibold bg-status-success/20 border-status-success/40 text-status-success">
                  Aprobado
                </span>
              </div>
            )}

            {/* CTA pill en imagen */}
            {cta && (
              <div className="absolute bottom-3 left-3">
                <span
                  className="text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                  style={{ backgroundColor: tipoColor }}
                >
                  {cta}
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

      {/* Copyable fields */}
      {(titulo || cta) && (
        <div className="p-3 space-y-2 border-t border-border bg-surface">
          {titulo && <CopyField label="Título" value={titulo} />}
          {cta && <CopyField label="CTA" value={cta} accent />}
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
            disabled={downloading}
            className="p-2 rounded-xl text-text-muted border border-border hover:border-border-hover hover:text-text-primary transition-all disabled:opacity-50"
            title="Descargar imagen con texto"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
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
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all disabled:opacity-50"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {downloading ? 'Componiendo...' : 'Descargar imagen'}
          </button>
        </div>
      )}
    </div>
  )
}
