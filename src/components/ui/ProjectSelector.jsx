import { ChevronDown, FolderKanban } from 'lucide-react'
import { useProjects } from '../../hooks/useProjects'

export default function ProjectSelector({ value, onChange, placeholder = 'Selecciona un proyecto' }) {
  const { projects, loading } = useProjects()

  return (
    <div className="relative">
      <FolderKanban size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        className="input-field pl-9 pr-9 appearance-none cursor-pointer"
        disabled={loading}
      >
        <option value="">{loading ? 'Cargando proyectos...' : placeholder}</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.nombre}{p.producto ? ` — ${p.producto}` : ''}</option>
        ))}
      </select>
      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
    </div>
  )
}
