import { NextRequest, NextResponse } from 'next/server'
import { getKeys, saveKeys } from '@/lib/db'
import { verifyToken, calculateExpiry } from '@/lib/auth'

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

    const { key } = await request.json()

    if (!key) {
      return NextResponse.json(
        { error: 'Clé requise' },
        { status: 400 }
      )
    }

    const allKeys = await getKeys()
    const keyIndex = allKeys.findIndex(k => k.key === key && k.userId === decoded.userId)

    if (keyIndex === -1) {
      return NextResponse.json(
        { error: 'Clé non trouvée' },
        { status: 404 }
      )
    }

    // Reset the claimed date and expiry date (restart timer)
    const keyRecord = allKeys[keyIndex]
    const now = new Date()
    const newExpiresAt = calculateExpiry(keyRecord.duration)

    allKeys[keyIndex] = {
      ...keyRecord,
      claimedAt: now.toISOString(), // Redémarre le timer depuis maintenant
      expiresAt: newExpiresAt?.toISOString()
    }

    await saveKeys(allKeys)

    return NextResponse.json({
      message: 'Clé réactivée avec succès',
      key: {
        ...allKeys[keyIndex],
        expiresAt: newExpiresAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Reactivate key error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
