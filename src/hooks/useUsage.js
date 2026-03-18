import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DEMO_MODE, DEMO_USAGE } from '../lib/demo'

export const PLAN_LIMITS = {
  free:    0,
  starter: 300,
  pro:     1000,
  elite:   Infinity,
}

export const PLAN_LABELS = {
  free:    'Free',
  starter: 'Starter',
  pro:     'Pro',
  elite:   'Elite',
}

export const PLAN_PRICES = {
  starter: '$19',
  pro:     '$49',
  elite:   '$97',
}

export function useUsage() {
  const { user, profile } = useAuth()
  const [usage, setUsage]   = useState(0)
  const [loading, setLoading] = useState(true)

  const plan  = profile?.plan || 'free'
  const limit = PLAN_LIMITS[plan]
  const mes   = new Date().toISOString().slice(0, 7)

  const fetchUsage = useCallback(async () => {
    if (!user) return
    if (DEMO_MODE) {
      setUsage(DEMO_USAGE.creativos_generados)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('usage')
      .select('creativos_generados')
      .eq('user_id', user.id)
      .eq('mes', mes)
      .maybeSingle()
    setUsage(data?.creativos_generados || 0)
    setLoading(false)
  }, [user, mes])

  useEffect(() => { fetchUsage() }, [fetchUsage])

  const canGenerate  = plan === 'elite' || (limit > 0 && usage < limit)
  const remaining    = plan === 'elite' ? Infinity : Math.max(0, limit - usage)
  const percentage   = limit === Infinity || limit === 0
    ? 0
    : Math.min(100, Math.round((usage / limit) * 100))

  return { usage, limit, remaining, percentage, canGenerate, plan, loading, refetch: fetchUsage }
}
