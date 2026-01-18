import { NextRequest, NextResponse } from 'next/server'
import { getKeys, saveKeys } from '@/lib/db'
import { generateKey, calculateExpiry } from '@/lib/auth'

// Simple admin check - in production, use proper authentication
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { count = 1, duration = '1 mois', secret } = await request.json()

    // Simple admin authentication
    if (secret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const keys = await getKeys()
    const newKeys = []

    for (let i = 0; i < count; i++) {
      const newKey = generateKey(duration)
      const expiresAt = calculateExpiry(duration)

      const keyRecord = {
        key: newKey,
        duration: duration,
        purchaseDate: new Date().toISOString(),
        expiresAt: expiresAt?.toISOString(),
        canBeUsedForRegistration: true
      }

      keys.push(keyRecord)
      newKeys.push(newKey)
    }

    await saveKeys(keys)

    return NextResponse.json({
      keys: newKeys,
      count: newKeys.length,
      message: 'Clés d\'invitation générées avec succès'
    })
  } catch (error) {
    console.error('Generate invite keys error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

