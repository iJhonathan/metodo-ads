import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, ImageIcon, CheckSquare,
  Plus, Wand2, Images, ArrowRight,
  Zap, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import StatCard from '../components/ui/StatCard'
import ProjectCard from '../components/ui/ProjectCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { isDemoMode, DEMO_PROJECTS, DEMO_CREATIVES } from '../lib/demo'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ projects: 0, creatives: 0, approved: 0 })
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    try {
      if (isDemoMode()) {
        setProjects(DEMO_PROJECTS.slice(0, 6))
        setStats({
          projects: DEMO_PROJECTS.length,
          creatives: DEMO_CREATIVES.length,
          approved: DEMO_CREATIVES.filter(c => c.estado === 'aprobado').length,
        })
        setLoading(false)
        return
      }

      const [projRes, creativesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('creatives').select('id, estado, project_id').eq('user_id', user.id),
      ])

      const projs = projRes.data || []
      const creatives = creativesRes.data || []

      setProjects(projs.slice(0, 6))
      setStats({
        projects: projs.length,
        creatives: creatives.length,
        approved: creatives.filter(c => c.estado === 'aprobado').length,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const firstName = profile?.nombre?.split(' ')[0] || 'Usuario'

  const quickActions = [
    {
      icon: Plus,
      label: 'Nuevo Proyecto',
      description: 'Inicia un nuevo proyecto publicitario',
      path: '/projects/new',
      color: 'accent',
    },
    {
      icon: Wand2,
      label: 'Generar Creativos',
      description: 'Genera creativos de alto impacto con IA',
      path: '/factory',
      color: 'warning',
    },
    {
      icon: Images,
      label: 'Galería Global',
      description: 'Ver todos tus creativos',
      path: '/gallery',
      color: 'info',
    },
  ]

  const noKeys = !profile?.api_key_claude && !profile?.api_key_google

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Hola, {firstName} 👋
            </h1>
            <p className="text-text-secondary mt-1">Bienvenido a tu panel de control</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-success/10 border border-status-success/30">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse-slow"></span>
            <span className="text-status-success text-sm font-medium">Sistema Operativo</span>
          </div>
        </div>
      </div>

      {/* API Keys warning */}
      {noKeys && (
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 bg-status-warning/10 border border-status-warning/30 rounded-xl px-5 py-4 mb-8 cursor-pointer hover:bg-status-warning/15 transition-colors"
        >
          <AlertTriangle size={20} className="text-status-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="text-status-warning font-medium text-sm">API Keys no configuradas</p>
            <p className="text-text-secondary text-xs mt-0.5">
              Configura tus keys de Claude y Google AI Studio para poder generar ángulos e imágenes.
            </p>
          </div>
          <ArrowRight size={16} className="text-status-warning" />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={FolderKanban}
          label="Proyectos Activos"
          value={loading ? '...' : stats.projects}
          trend="Total de proyectos"
          color="accent"
        />
        <StatCard
          icon={ImageIcon}
          label="Creativos Generados"
          value={loading ? '...' : stats.creatives}
          trend="Este mes"
          color="info"
        />
        <StatCard
          icon={CheckSquare}
          label="Aprobados para Publicar"
          value={loading ? '...' : stats.approved}
          trend="Listos para usar"
          color="success"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Zap size={20} className="text-accent-light" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const colorMap = {
              accent: 'bg-accent/15 text-accent-light border-accent/30 hover:bg-accent/25 hover:border-accent/50',
              warning: 'bg-status-warning/15 text-status-warning border-status-warning/30 hover:bg-status-warning/25 hover:border-status-warning/50',
              info: 'bg-status-info/15 text-status-info border-status-info/30 hover:bg-status-info/25 hover:border-status-info/50',
            }
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${colorMap[action.color]}`}
              >
                <action.icon size={24} className="mb-3" />
                <p className="font-semibold text-sm">{action.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{action.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Projects grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2">
            <FolderKanban size={20} className="text-accent-light" />
            Mis Proyectos
          </h2>
          <button
            onClick={() => navigate('/projects')}
            className="btn-ghost text-sm"
          >
            Ver todos
            <ArrowRight size={15} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label="Cargando proyectos..." />
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <FolderKanban size={24} className="text-accent-light" />
            </div>
            <p className="text-text-primary font-semibold mb-2">Aún no tienes proyectos</p>
            <p className="text-text-secondary text-sm mb-5">Crea tu primer proyecto para comenzar a generar creativos</p>
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-primary inline-flex mx-auto"
            >
              <Plus size={16} />
              Crear primer proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
