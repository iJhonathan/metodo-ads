import { useState } from 'react'
import { Zap, CheckCircle2, X, Loader2 } from 'lucide-react'
import { redirectToCheckout } from '../../lib/stripe'
import { PLAN_LIMITS, PLAN_PRICES } from '../../hooks/useUsage'

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: PLAN_PRICES.starter,
    limit: `${PLAN_LIMITS.starter} creativos/mes`,
    features: ['300 creativos por mes', 'Proyectos ilimitados', 'Ángulos con Claude AI', 'Imágenes con Gemini', 'Soporte por email'],
    color: 'border-status-info/50 hover:border-status-info',
    badge: null,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: PLAN_PRICES.pro,
    limit: `${PLAN_LIMITS.pro.toLocaleString()} creativos/mes`,
    features: ['1,000 creativos por mes', 'Proyectos ilimitados', 'Ángulos con Claude AI', 'Imágenes con Gemini', 'Descarga en ZIP', 'Soporte prioritario'],
    color: 'border-accent/60 hover:border-accent',
    badge: 'Más popular',
  },
  {
    key: 'elite',
    name: 'Elite',
    price: PLAN_PRICES.elite,
    limit: 'Creativos ilimitados',
    features: ['Creativos ilimitados', 'Proyectos ilimitados', 'Ángulos con Claude AI', 'Imágenes con Gemini', 'Descarga en ZIP', 'Acceso anticipado a nuevas features', 'Soporte VIP'],
    color: 'border-status-warning/50 hover:border-status-warning',
    badge: 'Ilimitado',
  },
]

export default function UpgradeModal({ open, onClose, currentPlan, usage, limit }) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  if (!open) return null

  const handleUpgrade = async (plan) => {
    setError('')
    setLoading(plan)
    try {
      await redirectToCheckout(plan)
    } catch (err) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-surface border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-accent px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={18} className="text-white" />
                <span className="text-white font-bold text-lg">Actualiza tu plan</span>
              </div>
              <p className="text-white/80 text-sm">
                Has usado <strong className="text-white">{usage}</strong> de <strong className="text-white">{limit}</strong> creativos este mes.
                Elige un plan para seguir generando.
              </p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
              <X size={20} />
            </button>
          </div>

          {/* Usage bar */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 100}%` }}
            />
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          {error && (
            <div className="mb-4 text-status-error text-sm bg-status-error/10 border border-status-error/30 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const isCurrent = currentPlan === plan.key
              const isLoading = loading === plan.key

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-xl border-2 p-5 transition-all duration-200 ${plan.color}
                    ${isCurrent ? 'opacity-60' : ''}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-glow-sm">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-text-primary font-bold text-lg">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                      <span className="text-text-muted text-sm">/mes</span>
                    </div>
                    <p className="text-accent-light text-xs mt-1 font-medium">{plan.limit}</p>
                  </div>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-text-secondary text-xs">
                        <CheckCircle2 size={13} className="text-status-success mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !isCurrent && handleUpgrade(plan.key)}
                    disabled={isCurrent || !!loading}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                      ${isCurrent
                        ? 'bg-surface-3 text-text-muted cursor-not-allowed'
                        : 'bg-accent hover:bg-accent-hover text-white shadow-glow-sm hover:shadow-glow disabled:opacity-50'
                      }`}
                  >
                    {isLoading
                      ? <><Loader2 size={14} className="animate-spin" /> Redirigiendo...</>
                      : isCurrent
                        ? 'Plan actual'
                        : `Elegir ${plan.name}`
                    }
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-center text-text-muted text-xs mt-4">
            Pago seguro con Stripe · Cancela en cualquier momento · Sin permanencia
          </p>
        </div>
      </div>
    </div>
  )
}
