import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Mapeo price ID → plan name (se setea como secret en Supabase)
const PRICE_TO_PLAN: Record<string, string> = {
  [Deno.env.get('STRIPE_PRICE_STARTER') || '']: 'starter',
  [Deno.env.get('STRIPE_PRICE_PRO')     || '']: 'pro',
  [Deno.env.get('STRIPE_PRICE_ELITE')   || '']: 'elite',
}

async function updateUserPlan(userId: string, plan: string, status: string, sub: Stripe.Subscription) {
  const activePlan = status === 'active' || status === 'trialing' ? plan : 'free'

  await Promise.all([
    supabase.from('users').update({ plan: activePlan }).eq('id', userId),
    supabase.from('subscriptions').upsert({
      user_id:                userId,
      stripe_customer_id:     sub.customer as string,
      stripe_subscription_id: sub.id,
      plan:                   activePlan,
      status,
      periodo_inicio: new Date((sub as any).current_period_start * 1000).toISOString(),
      periodo_fin:    new Date((sub as any).current_period_end   * 1000).toISOString(),
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'user_id' }),
  ])
}

Deno.serve(async (req) => {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log(`Event: ${event.type}`)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id || sub.subscription_data?.metadata?.user_id

        if (!userId) {
          // Try to find user via customer ID
          const { data } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', sub.customer as string)
            .maybeSingle()
          if (!data?.user_id) break
        }

        const uid     = userId || (await supabase.from('subscriptions').select('user_id').eq('stripe_customer_id', sub.customer as string).single()).data?.user_id
        const priceId = sub.items.data[0]?.price.id
        const plan    = PRICE_TO_PLAN[priceId] || 'starter'
        await updateUserPlan(uid, plan, sub.status, sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id

        const uid = userId || (await supabase.from('subscriptions').select('user_id').eq('stripe_customer_id', sub.customer as string).single()).data?.user_id
        if (uid) await updateUserPlan(uid, 'free', 'canceled', sub)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as any).subscription as string
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          const { data } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', subId).maybeSingle()
          if (data?.user_id) {
            await supabase.from('subscriptions').update({ status: 'past_due' }).eq('user_id', data.user_id)
          }
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        if (session.mode === 'subscription' && session.metadata?.user_id) {
          // subscription events will handle the actual update
          console.log(`Checkout completed for user: ${session.metadata.user_id}`)
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response('Internal error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
