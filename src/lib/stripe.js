import { supabase } from './supabase'

/**
 * Crea una sesión de Stripe Checkout y redirige al usuario.
 */
export async function redirectToCheckout(plan) {
  const origin = window.location.origin
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      plan,
      success_url: `${origin}/settings?success=true`,
      cancel_url:  `${origin}/settings?canceled=true`,
    },
  })
  if (error) throw new Error(error.message)
  if (data?.url) window.location.href = data.url
}

/**
 * Abre el portal de Stripe para gestionar la suscripción.
 */
export async function redirectToPortal() {
  const origin = window.location.origin
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: { return_url: `${origin}/settings` },
  })
  if (error) throw new Error(error.message)
  if (data?.url) window.location.href = data.url
}
