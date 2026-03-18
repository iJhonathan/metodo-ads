import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Key, Bot, Image, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function Onboarding() {
  const [claudeKey, setClaudeKey] = useState('')
  const [googleKey, setGoogleKey] = useState('')
  const [showClaude, setShowClaude] = useState(false)
  const [showGoogle, setShowGoogle] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const handleSave = async () => {
    setLoading(true)
    await supabase
      .from('users')
      .update({
        api_key_claude: claudeKey || null,
        api_key_google: googleKey || null,
      })
      .eq('id', user.id)
    await refreshProfile()
    navigate('/dashboard')
    setLoading(false)
  }

  const handleSkip = () => navigate('/dashboard')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />

      <div className="w-full max-w-xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-accent shadow-glow mb-4">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-text-primary text-2xl font-bold">¡Bienvenido a Método ADS!</h1>
          <p className="text-text-secondary text-sm mt-2 max-w-md mx-auto">
            Configura tus API Keys para habilitar la generación de ángulos e imágenes con IA.
            Puedes hacerlo ahora o más tarde desde Configuración.
          </p>
        </div>

        <div className="card space-y-6">
          <h2 className="text-text-primary font-semibold text-lg flex items-center gap-2">
            <Key size={18} className="text-accent-light" />
            Configurar API Keys
          </h2>

          {/* Claude Key */}
          <div>
            <label className="label flex items-center gap-2">
              <Bot size={14} className="text-accent-light" />
              Claude API Key (Anthropic) — Para generación de ángulos de venta
            </label>
            <div className="relative">
              <input
                type={showClaude ? 'text' : 'password'}
                value={claudeKey}
                onChange={e => setClaudeKey(e.target.value)}
                placeholder="sk-ant-..."
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowClaude(!showClaude)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                {showClaude ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-text-muted text-xs mt-1.5">
              Obtén tu key en <span className="text-accent-light">console.anthropic.com</span>
            </p>
          </div>

          {/* Google Key */}
          <div>
            <label className="label flex items-center gap-2">
              <Image size={14} className="text-accent-light" />
              Google AI Studio API Key — Para generación de imágenes (Gemini)
            </label>
            <div className="relative">
              <input
                type={showGoogle ? 'text' : 'password'}
                value={googleKey}
                onChange={e => setGoogleKey(e.target.value)}
                placeholder="AIza..."
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGoogle(!showGoogle)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                {showGoogle ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-text-muted text-xs mt-1.5">
              Obtén tu key en <span className="text-accent-light">aistudio.google.com</span>
            </p>
          </div>

          {/* Info box */}
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-accent-light flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-text-primary text-sm font-medium">Tus keys son privadas</p>
                <p className="text-text-secondary text-xs mt-0.5">
                  Se guardan de forma segura y solo se usan para generar contenido con tu cuenta de IA.
                  Nunca compartimos tus keys.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSkip}
              className="btn-secondary flex-1 justify-center"
            >
              Configurar después
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar y continuar'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
