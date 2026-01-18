import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken } from '@/lib/auth'

// Vérifier que les variables d'environnement sont définies
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY n\'est pas défini dans .env.local')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Mapping des plans aux Price IDs Stripe
const PRICE_IDS: { [key: string]: string } = {
  '1-day': process.env.PRICE_ID_1_DAY || '',
  '1-week': process.env.PRICE_ID_1_WEEK || '',
  '1-month': process.env.PRICE_ID_1_MONTH || '',
  'lifetime': process.env.PRICE_ID_LIFETIME || '',
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    const { planId, email } = await request.json()

    if (!planId || !PRICE_IDS[planId] || !PRICE_IDS[planId].startsWith('price_')) {
      console.error('Plan invalide ou Price ID manquant:', { planId, priceId: PRICE_IDS[planId] })
      return NextResponse.json(
        { error: 'Plan invalide ou configuration Stripe manquante. Vérifiez vos variables d\'environnement.' },
        { status: 400 }
      )
    }

    const priceId = PRICE_IDS[planId]

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID non configuré pour ce plan' },
        { status: 500 }
      )
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cart?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        userId: decoded.userId,
        planId: planId,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors de la création de la session de paiement',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

