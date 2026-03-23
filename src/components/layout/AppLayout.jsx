import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { isDemoMode } from '../../lib/demo'
import { FlaskConical } from 'lucide-react'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        {isDemoMode() && (
          <div className="bg-accent/10 border-b border-accent/20 px-8 py-2 flex items-center gap-2">
            <FlaskConical size={14} className="text-accent-light flex-shrink-0" />
            <p className="text-accent-light text-xs font-medium">
              Modo Demo activo — Los datos son ficticios. Conecta Supabase en <code className="bg-accent/20 px-1 rounded">.env</code> para usar la app en producción.
            </p>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
