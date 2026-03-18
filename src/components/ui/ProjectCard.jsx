import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar } from 'lucide-react'

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const GRADIENT_COLORS = [
  'from-purple-600 to-violet-800',
  'from-blue-600 to-cyan-700',
  'from-emerald-600 to-teal-700',
  'from-rose-600 to-pink-700',
  'from-amber-600 to-orange-700',
  'from-indigo-600 to-blue-700',
]

function getGradient(id) {
  const idx = id ? id.charCodeAt(0) % GRADIENT_COLORS.length : 0
  return GRADIENT_COLORS[idx]
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate()
  const gradient = getGradient(project.id)

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="card-hover cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-glow-sm`}>
          {getInitials(project.nombre)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-base group-hover:text-accent-light transition-colors truncate">
            {project.nombre}
          </h3>
          <p className="text-text-secondary text-sm mt-0.5 line-clamp-2">
            {project.descripcion || 'Sin descripción'}
          </p>
          {project.producto && (
            <p className="text-text-muted text-xs mt-2 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent"></span>
              {project.producto}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-text-muted text-xs">
          <Calendar size={12} />
          <span>{new Date(project.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        <ArrowRight size={15} className="text-text-muted group-hover:text-accent-light transition-colors group-hover:translate-x-0.5 transform duration-200" />
      </div>
    </div>
  )
}
