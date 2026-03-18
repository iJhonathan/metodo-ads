import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Key, User, CreditCard, Bot, Image as ImageIcon,
  Eye, EyeOff, Save, CheckCircle2, Zap, ExternalLink,
  Loader2, AlertCircle, TrendingUp, Crown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { redirectToCheckout, redirectToPortal } from '../lib/stripe'
import { useUsage, PLAN_LIMITS, PLAN_LABELS, PLAN_PRICES } from '../hooks/useUsage'
import UpgradeModal from '../components/ui/UpgradeModal'

function Section({ title, icon: Icon, children, iconColor = 'text-accent-light' }) {
  return (
    <div className="card mb-6">
      <h2 className={`text-text-primary font-semibold text-lg flex items-center gap-2 mb-5 pb-4 border-b border-border`}>
        <Icon size={18} className={iconColor} />
        {title}
      </h2>
      {children}
    </div>
  )
}

function UsageBar({ usage, limit, plan }) {
  if (plan === 'elite') {
    return (
      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1 h-2 bg-status-success/20 rounded-full overflow-hidden">
          <div className="h-full bg-status-success rounded-full w-full" />
        </div>
        <span className="text-status-success text-xs font-medium">Ilimitado</span>
      </div>
    )
  }
  if (limit === 0) return null
  const pct = Math.min(100, Math.round((usage / limit) * 100))
  const barColor = pct >= 90 ? 'bg-status-error' : pct >= 70 ? 'bg-status-warning' : 'bg-status-success'

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-text-muted text-xs">{usage.toLocaleString()} / {limit.toLocaleString()} creativos este mes</span>
        <span className={`text-xs font-semibold ${pct >= 90 ? 'text-status-error' : pct >= 70 ? 'text-status-warning' : 'text-status-success'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const PLAN_FEATURES = {
  free:    { color: 'text-text-muted',         icon: null,   gradient: '' },
  starter: { color: 'text-status-info',        icon: Zap,    gradient: 'from-blue-600/20 to-cyan-600/10' },
  pro:     { color: 'text-status-warning',     icon: TrendingUp, gradient: 'from-amber-600/20 to-orange-600/10' },
  elite:   { color: 'text-accent-light',       icon: Crown,  gradient: 'from-violet-600/20 to-purple-600/10' },
}

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { usage, limit, remaining, percentage, plan: currentPlan } = useUsage()

  const [nombre, setNombre] = useState(profile?.nombre || '')
  const [claudeKey, setClaudeKey] = useState(profile?.api_key_claude || '')
  const [googleKey, setGoogleKey] = useState(profile?.api_key_google || '')
  const [showClaude, setShowClaude] = useState(false)
  const [showGoogle, setShowGoogle] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(null)
  const [stripeError, setStripeError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || '')
      setClaudeKey(profile.api_key_claude || '')
      setGoogleKey(profile.api_key_google || '')
    }
  }, [profile])

  // Handle success/cancel redirects from Stripe
  useEffect(() => {
    const success  = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    if (success) {
      refreshProfile()
      navigate('/settings', { replace: true })
    }
    if (canceled) {
      navigate('/settings', { replace: true })
    }
  }, [searchParams])

  const handleSaveProfile = async () => {
    setSaving(true)
    await supabase.from('users').update({
      nombre,
      api_key_claude: claudeKey || null,
      api_key_google: googleKey || null,
    }).eq('id', user.id)
    await refreshProfile()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const handleUpgrade = async (plan) => {
    setStripeError('')
    setStripeLoading(plan)
    try {
      await redirectToCheckout(plan)
    } catch (err) {
      setStripeError(err.message)
      setStripeLoading(null)
    }
  }

  const handlePortal = async () => {
    setStripeError('')
    setStripeLoading('portal')
    try {
      await redirectToPortal()
    } catch (err) {
      setStripeError(err.message)
      setStripeLoading(null)
    }
  }

  const planConf  = PLAN_FEATURES[currentPlan] || PLAN_FEATURES.free
  const PlanIcon  = planConf.icon

  const UPGRADE_PLANS = [
    { key: 'starter', name: 'Starter', price: PLAN_PRICES.starter, limit: '300 creativos/mes', color: 'border-status-info/30 hover:border-status-info/60 hover:bg-status-info/5' },
    { key: 'pro',     name: 'Pro',     price: PLAN_PRICES.pro,     limit: '1,000 creativos/mes', color: 'border-accent/30 hover:border-accent/60 hover:bg-accent/5', badge: 'Popular' },
    { key: 'elite',   name: 'Elite',   price: PLAN_PRICES.elite,   limit: 'Ilimitado',           color: 'border-status-warning/30 hover:border-status-warning/60 hover:bg-status-warning/5' },
  ]

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <h1 className="text-3xl font-bold text-text-primary">Configuración</h1>
        <p className="text-text-secondary mt-1">Gestiona tu cuenta, API Keys y plan de suscripción</p>
      </div>

      {/* Profile */}
      <Section title="Perfil" icon={User}>
        <div className="space-y-4">
          <div>
            <label className="label">Nombre completo</label>
            <input className="input-field" value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field opacity-50 cursor-not-allowed" value={user?.email || ''} disabled readOnly />
          </div>
        </div>
      </Section>

      {/* API Keys */}
      <Section title="API Keys" icon={Key}>
        <div className="space-y-5">
          <div>
            <label className="label flex items-center gap-2">
              <Bot size={13} className="text-accent-light" />
              Claude API Key (Anthropic) — Para ángulos de venta
            </label>
            <div className="relative">
              <input
                type={showClaude ? 'text' : 'password'}
                value={claudeKey}
                onChange={e => setClaudeKey(e.target.value)}
                placeholder="sk-ant-..."
                className="input-field pr-10"
              />
              <button type="button" onClick={() => setShowClaude(!showClaude)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                {showClaude ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-text-muted text-xs">Obtén tu key en console.anthropic.com</p>
              {claudeKey && <span className="badge-success text-xs">✓ Configurada</span>}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <ImageIcon size={13} className="text-accent-light" />
              Google AI Studio API Key — Para imágenes (Gemini)
            </label>
            <div className="relative">
              <input
                type={showGoogle ? 'text' : 'password'}
                value={googleKey}
                onChange={e => setGoogleKey(e.target.value)}
                placeholder="AIza..."
                className="input-field pr-10"
              />
              <button type="button" onClick={() => setShowGoogle(!showGoogle)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                {showGoogle ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-text-muted text-xs">Obtén tu key en aistudio.google.com</p>
              {googleKey && <span className="badge-success text-xs">✓ Configurada</span>}
            </div>
          </div>
        </div>
      </Section>

      {/* Save profile + keys */}
      <div className="flex justify-end mb-6">
        <button onClick={handleSaveProfile} disabled={saving} className="btn-primary disabled:opacity-50">
          {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Subscription */}
      <Section title="Plan de Suscripción" icon={CreditCard} iconColor="text-status-warning">
        {/* Current plan card */}
        <div className={`rounded-xl bg-gradient-to-br ${planConf.gradient || 'from-surface-3 to-surface-3'} border border-border p-5 mb-6`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {PlanIcon && <PlanIcon size={16} className={planConf.color} />}
                <span className={`text-xl font-bold ${planConf.color}`}>
                  Plan {PLAN_LABELS[currentPlan]}
                </span>
              </div>
              <p className="text-text-muted text-sm">
                {currentPlan === 'elite'
                  ? 'Creativos ilimitados · Acceso completo'
                  : currentPlan === 'free'
                    ? 'Actualiza para generar creativos'
                    : `${PLAN_LIMITS[currentPlan].toLocaleString()} creativos por mes`
                }
              </p>
            </div>
            {currentPlan !== 'free' && (
              <button
                onClick={handlePortal}
                disabled={stripeLoading === 'portal'}
                className="btn-ghost text-xs py-2"
              >
                {stripeLoading === 'portal'
                  ? <Loader2 size={13} className="animate-spin" />
                  : <ExternalLink size={13} />
                }
                Gestionar
              </button>
            )}
          </div>

          <UsageBar usage={usage} limit={limit} plan={currentPlan} />

          {remaining !== Infinity && remaining <= 50 && remaining > 0 && (
            <div className="flex items-center gap-2 mt-3 text-status-warning text-xs">
              <AlertCircle size={13} />
              Te quedan solo {remaining} creativos este mes
            </div>
          )}
        </div>

        {stripeError && (
          <div className="flex items-center gap-2 bg-status-error/10 border border-status-error/30 text-status-error rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            {stripeError}
          </div>
        )}

        {/* Upgrade plans */}
        {currentPlan !== 'elite' && (
          <>
            <p className="text-text-secondary text-sm font-medium mb-3">
              {currentPlan === 'free' ? 'Elige un plan para comenzar:' : 'Actualizar a:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {UPGRADE_PLANS.map(p => {
                const isCurrent = currentPlan === p.key
                const isLoading = stripeLoading === p.key
                return (
                  <div
                    key={p.key}
                    className={`relative rounded-xl border p-4 transition-all duration-200 ${p.color} ${isCurrent ? 'opacity-60' : ''}`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2.5 left-3 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-glow-sm">
                        {p.badge}
                      </span>
                    )}
                    <p className="text-text-primary font-bold">{p.name}</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{p.price}<span className="text-text-muted text-sm font-normal">/mes</span></p>
                    <p className="text-text-muted text-xs mt-0.5 mb-3">{p.limit}</p>
                    <button
                      onClick={() => !isCurrent && handleUpgrade(p.key)}
                      disabled={isCurrent || !!stripeLoading}
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5
                        ${isCurrent
                          ? 'bg-surface-3 text-text-muted cursor-not-allowed'
                          : 'bg-accent hover:bg-accent-hover text-white shadow-glow-sm disabled:opacity-50'
                        }`}
                    >
                      {isLoading
                        ? <><Loader2 size={12} className="animate-spin" /> Espera...</>
                        : isCurrent ? 'Actual' : `Elegir ${p.name}`
                      }
                    </button>
                  </div>
                )
              })}
            </div>
            <p className="text-text-muted text-xs text-center mt-3">
              Pago seguro con Stripe · Cancela cuando quieras
            </p>
          </>
        )}
      </Section>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlan={currentPlan}
        usage={usage}
        limit={limit}
      />
    </div>
  )
}
