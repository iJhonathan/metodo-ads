import { Construction } from 'lucide-react'

export default function Placeholder({ title, description }) {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
          <Construction size={36} className="text-accent-light" />
        </div>
        <h2 className="text-text-primary font-semibold text-xl mb-3">En construcción</h2>
        <p className="text-text-secondary text-sm max-w-md">
          {description || `El módulo de ${title} está en desarrollo. Estará disponible pronto.`}
        </p>
      </div>
    </div>
  )
}
