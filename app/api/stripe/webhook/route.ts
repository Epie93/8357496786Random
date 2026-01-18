import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getKeys, saveKeys } from '@/lib/db'
import { generateKey, calculateExpiry } from '@/lib/auth'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY n\'est pas défini dans .env.local')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Utiliser le webhook secret si disponible, sinon utiliser la clé secrète comme fallback
// Si aucun n'est défini, le webhook ne fonctionnera pas (ce qui est OK si vous ne l'utilisez pas)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SECRET_KEY

if (!webhookSecret) {
  console.warn('⚠️ STRIPE_WEBHOOK_SECRET non défini - Le webhook ne fonctionnera pas (OK si vous générez les clés manuellement)')
}

export async function POST(request: NextRequest) {
  // Si le webhook secret n'est pas configuré, retourner une erreur gracieuse
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook non configuré - Génération manuelle des clés activée' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Gérer l'événement de paiement réussi
  // NOTE: La génération automatique de clé est désactivée
  // Les clés doivent être générées manuellement depuis le panel admin après vérification du paiement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const userId = session.metadata?.userId
      const planId = session.metadata?.planId

      if (!userId || !planId) {
        console.error('Metadata manquante dans la session Stripe')
        return NextResponse.json({ received: true })
      }

      // Log du paiement réussi (pour référence manuelle)
      console.log(`✅ Paiement réussi - User: ${userId} - Plan: ${planId} - Session: ${session.id}`)
      console.log(`📋 L'utilisateur doit ouvrir un ticket pour recevoir sa clé`)
      
      // Pas de génération automatique de clé
      // L'admin devra générer la clé manuellement après vérification
    } catch (error) {
      console.error('Erreur lors du traitement du webhook:', error)
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}

