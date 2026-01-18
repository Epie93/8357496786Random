import { NextRequest, NextResponse } from 'next/server'
import { getKeys, saveKeys } from '@/lib/db'
import { verifyToken, generateKey, calculateExpiry } from '@/lib/auth'

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

    const { items } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Aucun article dans le panier' },
        { status: 400 }
      )
    }

    const item = items[0] // On prend le premier item (un seul à la fois)
    const keys = await getKeys()

    // Generate key with duration prefix
    const newKey = generateKey(item.duration)
    const expiresAt = calculateExpiry(item.duration)

    // Create key that can be used for registration
    // The key will be associated with the buyer's account after registration
    const keyRecord = {
      userId: undefined, // No userId initially - allows registration with this key
      key: newKey,
      duration: item.duration,
      purchaseDate: new Date().toISOString(),
      expiresAt: expiresAt?.toISOString(),
      canBeUsedForRegistration: true, // Flag to allow this key to be used for account creation
      purchasedBy: decoded.userId // Track who purchased it, but don't restrict registration
    }

    keys.push(keyRecord)
    await saveKeys(keys)

    return NextResponse.json({
      key: newKey,
      message: 'Achat réussi. Utilisez cette clé pour créer votre compte ou vous connecter.'
    })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
