import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'

// App pages
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import KnowledgeBase from './pages/KnowledgeBase'
import BrandingKit from './pages/BrandingKit'
import CreativeFactory from './pages/CreativeFactory'
import Analysis from './pages/Analysis'
import Gallery from './pages/Gallery'
import Settings from './pages/Settings'
import Placeholder from './pages/Placeholder'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" label="Cargando..." />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" label="Cargando..." />
      </div>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

      {/* Protected app */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/branding" element={<BrandingKit />} />
<Route path="/factory" element={<CreativeFactory />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Default */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
