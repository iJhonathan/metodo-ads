import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Palette,
  Lightbulb,
  Wand2,
  BarChart3,
  Images,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Proyectos', icon: FolderKanban, path: '/projects' },
  { label: 'Base de Conocimiento', icon: BookOpen, path: '/knowledge' },
  { label: 'Branding Kit', icon: Palette, path: '/branding' },
  { label: 'Generar Creativos', icon: Wand2, path: '/factory' },
  { label: 'Análisis Visual', icon: BarChart3, path: '/analysis' },
  { label: 'Galería Global', icon: Images, path: '/gallery' },
]

function NavItem({ item }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
        ${isActive
          ? 'bg-accent/20 text-accent-light border border-accent/30 shadow-glow-sm'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon size={18} className={isActive ? 'text-accent-light' : 'group-hover:text-text-primary'} />
          <span>{item.label}</span>
          {isActive && <ChevronRight size={14} className="ml-auto text-accent-light" />}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.nombre
    ? profile.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const planColors = {
    free: 'text-text-muted',
    starter: 'text-status-info',
    pro: 'text-status-warning',
    elite: 'text-accent-light',
  }

  const planLabel = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    elite: 'Elite',
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-accent flex items-center justify-center shadow-glow-sm">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-text-primary font-bold text-base leading-none">Método ADS</h1>
            <p className="text-text-muted text-xs mt-0.5">AI Creative Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider px-3 mb-3">
          Navegación
        </p>
        {navItems.map(item => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="px-3 py-3 border-t border-border space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${isActive
              ? 'bg-accent/20 text-accent-light border border-accent/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`
          }
        >
          <Settings size={18} />
          <span>Configuración</span>
        </NavLink>

        {/* User card */}
        <div className="mt-2 p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-medium truncate">
                {profile?.nombre || 'Usuario'}
              </p>
              <p className={`text-xs font-medium ${planColors[profile?.plan || 'free']}`}>
                Plan {planLabel[profile?.plan || 'free']}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-text-muted hover:text-status-error transition-colors p-1 rounded"
              title="Cerrar sesión"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
