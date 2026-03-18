import { Bookmark, BookmarkCheck, Trash2, Image, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const TIPO_CONFIG = {
  dolor:        { label: 'Dolor',         color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  curiosidad:   { label: 'Curiosidad',    color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  objecion:     { label: 'Objeción',      color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  miedo:        { label: 'Miedo',         color: 'bg-rose-600/15 text-rose-400 border-rose-600/20' },
  resultado:    { label: 'Resultado',     color: 'bg-green-500/15 text-green-400 border-green-500/20' },
  comparacion:  { label: 'Comparación',   color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  urgencia:     { label: 'Urgencia',      color: 'bg-red-600/15 text-red-300 border-red-600/20' },
  testimonio:   { label: 'Testimonio',    color: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
  educativo:    { label: 'Educativo',     color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  provocacion:  { label: 'Provocación',   color: 'bg-pink-500/15 text-pink-400 border-pink-500/20' },
  identidad:    { label: 'Identidad',     color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  transformacion:{ label: 'Transformación',color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  garantia:     { label: 'Garantía',      color: 'bg-lime-500/15 text-lime-400 border-lime-500/20' },
  precio:       { label: 'Precio',        color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  exclusividad: { label: 'Exclusividad',  color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  social_proof: { label: 'Prueba Social', color: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  novedad:      { label: 'Novedad',       color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  aspiracional: { label: 'Aspiracional',  color: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20' },
  humor:        { label: 'Humor',         color: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/20' },
  autoridad:    { label: 'Autoridad',     color: 'bg-blue-600/15 text-blue-300 border-blue-600/20' },
}

const DEFAULT_TIPO = { label: 'Ángulo', color: 'bg-accent/15 text-accent-light border-accent/20' }

export default function AngleCard({ angle, onSave, onDiscard, isSaved = false, showDiscard = true }) {
  const [showVisual, setShowVisual] = useState(false)
  const tipo = TIPO_CONFIG[angle.tipo] || DEFAULT_TIPO

  return (
    <div className={`card flex flex-col gap-4 transition-all duration-200 hover:border-border-hover
      ${isSaved ? 'border-accent/30 bg-accent/5' : ''}`}>

      {/* Header: tipo + actions */}
      <div className="flex items-start justify-between gap-3">
        <span className={`badge border text-xs font-semibold ${tipo.color}`}>
          {tipo.label}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showDiscard && (
            <button
              onClick={() => onDiscard?.(angle)}
              className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-status-error/10 transition-all"
              title="Descartar"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => onSave?.(angle)}
            className={`p-1.5 rounded-lg transition-all ${
              isSaved
                ? 'text-accent-light bg-accent/15 hover:bg-accent/25'
                : 'text-text-muted hover:text-accent-light hover:bg-accent/10'
            }`}
            title={isSaved ? 'Guardado' : 'Guardar ángulo'}
          >
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>
        </div>
      </div>

      {/* Headline */}
      <div>
        <p className="text-text-muted text-xs uppercase tracking-wider mb-1.5 font-medium">Headline</p>
        <h3 className="text-text-primary font-bold text-base leading-snug">{angle.headline}</h3>
      </div>

      {/* Copy */}
      <div>
        <p className="text-text-muted text-xs uppercase tracking-wider mb-1.5 font-medium">Copy</p>
        <p className="text-text-secondary text-sm leading-relaxed">{angle.copy}</p>
      </div>

      {/* Visual sugerido — colapsable */}
      <div className="border-t border-border pt-3">
        <button
          onClick={() => setShowVisual(!showVisual)}
          className="flex items-center gap-2 text-text-muted hover:text-text-secondary text-xs font-medium transition-colors w-full"
        >
          <Image size={13} />
          Visual sugerido
          {showVisual ? <EyeOff size={12} className="ml-auto" /> : <Eye size={12} className="ml-auto" />}
        </button>
        {showVisual && (
          <p className="text-text-muted text-xs mt-2 leading-relaxed italic">
            {angle.visual_sugerido}
          </p>
        )}
      </div>
    </div>
  )
}
