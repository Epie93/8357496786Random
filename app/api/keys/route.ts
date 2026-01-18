import { NextRequest, NextResponse } from 'next/server'
import { getKeys } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const allKeys = await getKeys()
    const userKeys = allKeys.filter(k => k.userId === decoded.userId && k.claimedAt) // Seulement les clés réclamées

    // Filter expired keys (except lifetime)
    const now = new Date()
    const activeKeys = userKeys.filter(k => {
      if (!k.expiresAt) return true // Lifetime key
      return new Date(k.expiresAt) > now
    })

    // Ne montrer les clés disponibles QUE si l'utilisateur a acheté (purchasedBy === userId)
    // Les clés doivent être non réclamées et achetées par cet utilisateur
    const availableKeys = allKeys.filter(k => 
      !k.userId && 
      !k.claimedAt && 
      k.canBeUsedForRegistration &&
      k.purchasedBy === decoded.userId // Seulement les clés achetées par cet utilisateur
    )

    return NextResponse.json({
      keys: activeKeys.map(k => ({
        key: k.key,
        duration: k.duration,
        purchaseDate: k.purchaseDate,
        claimedAt: k.claimedAt,
        expiresAt: k.expiresAt
      })),
      availableKeys: availableKeys.map(k => ({
        key: k.key,
        duration: k.duration
      }))
    })
  } catch (error) {
    console.error('Get keys error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
