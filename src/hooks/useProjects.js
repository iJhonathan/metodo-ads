import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { isDemoMode, DEMO_PROJECTS } from '../lib/demo'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetch()
  }, [user])

  async function fetch() {
    setLoading(true)
    if (isDemoMode()) {
      setProjects(DEMO_PROJECTS.map(p => ({ id: p.id, nombre: p.nombre, producto: p.producto })))
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('projects')
      .select('id, nombre, producto')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  return { projects, loading, refetch: fetch }
}
