import { Download, CheckCircle2, XCircle, Clock, FolderKanban } from 'lucide-react'
import { downloadSingle } from '../../lib/download'

const TIPO_COLORS = {
  dolor: '#ef4444', curiosidad: '#eab308', objecion: '#f97316',
  miedo: '#f43f5e', resultado: '#10b981', comparacion: '#3b82f6',
  urgencia: '#dc2626', testimonio: '#14b8a6', educativo: '#06b6d4',
  provocacion: '#ec4899', identidad: '#6366f1', transformacion: '#059669',
  garantia: '#84cc16', precio: '#f59e0b', exclusividad: '#8b5cf6',
  social_proof: '#0ea5e9', novedad: '#a855f7', aspiracional: '#d946ef',
  humor: '#fbbf24', autoridad: '#60a5fa',
}

const ESTADO_ICON = {
  aprobado:   { icon: CheckCircle2, cls: 'text-status-success', label: 'Aprobado' },
  descartado: { icon: XCircle,      cls: 'text-status-error',   label: 'Descartado' },
  pendiente:  { icon: Clock,        cls: 'text-status-warning',  label: 'Pendiente' },
}

export default function GalleryCard({ creative, showProject = false }) {
  const url = creative.imagen_url || creative.imageUrl
  const angle = creative.angles || creative.angle || {}
  const tipo = angle.tipo
  const tipoColor = TIPO_COLORS[tipo] || '#7c3aed'
  const estadoConf = ESTADO_ICON[creative.estado] || ESTADO_ICON.pendiente
  const EstadoIcon = estadoConf.icon

  const handleDownload = () => {
    if (!url) return
    downloadSingle(url, `creativo-${tipo || 'ads'}-${creative.id || Date.now()}.png`)
  }

  return (
    <div className={`group relative rounded-2xl overflow-hidden border transition-all duration-200
      ${creative.estado === 'aprobado'   ? 'border-status-success/30' :
        creative.estado === 'descartado' ? 'border-status-error/20 opacity-70' :
        'border-border hover:border-border-hover'
      } bg-surface shadow-card hover:shadow-card-hover`}
    >
      {/* Image */}
      <div className="aspect-square bg-surface-3 relative overflow-hidden">
        {url ? (
          <img
            src={url}
            alt={angle.headline || 'Creativo'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
            Sin imagen
          </div>
        )}

        {/* Tipo badge */}
        {tipo && (
          <div className="absolute top-2 left-2">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: tipoColor + 'cc' }}
            >
              {tipo}
            </span>
          </div>
        )}

        {/* Estado badge */}
        <div className="absolute top-2 right-2">
          <div className={`p-1 rounded-full bg-black/50 ${estadoConf.cls}`}>
            <EstadoIcon size={13} />
          </div>
        </div>

        {/* Hover overlay with download */}
        {url && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all backdrop-blur-sm"
            >
              <Download size={14} />
              Descargar
            </button>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="p-3">
        <p className="text-text-primary text-sm font-medium leading-snug line-clamp-2">
          {angle.headline || 'Sin título'}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className={`flex items-center gap-1 text-xs ${estadoConf.cls}`}>
            <EstadoIcon size={11} />
            <span>{estadoConf.label}</span>
          </div>
          {showProject && creative.project_name && (
            <div className="flex items-center gap-1 text-text-muted text-xs">
              <FolderKanban size={11} />
              <span className="truncate max-w-[80px]">{creative.project_name}</span>
            </div>
          )}
          <span className="text-text-muted text-xs">
            {new Date(creative.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </div>
    </div>
  )
}
