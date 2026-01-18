import { NextRequest, NextResponse } from 'next/server'
import { getKeys, saveKeys, getUsers } from '@/lib/db'
import { verifyToken, calculateExpiry } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { key } = await request.json()

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      )
    }

    // Normalize key: remove spaces and dashes, convert to uppercase
    const normalizedKey = key.trim().toUpperCase().replace(/[-\s]+/g, '')
    console.log('🔑 [CLAIM-KEY] Input key:', key)
    console.log('🔑 [CLAIM-KEY] Normalized key:', normalizedKey)
    
    const allKeys = await getKeys()
    const users = await getUsers()

    console.log('📊 [CLAIM-KEY] Total keys in database:', allKeys.length)
    console.log('📊 [CLAIM-KEY] Available keys (not claimed):', allKeys.filter(k => !k.userId && !k.claimedAt).length)

    // Vérifier que l'utilisateur existe
    const user = users.find(u => u.id === decoded.userId)
    if (!user || user.banned) {
      return NextResponse.json(
        { error: 'User not found or banned' },
        { status: 403 }
      )
    }

    // Trouver une clé disponible (pas de userId, pas encore réclamée)
    // Permettre l'activation de n'importe quelle clé valide, pas seulement celles achetées
    const keyIndex = allKeys.findIndex(k => {
      const keyNormalized = k.key.toUpperCase().replace(/[-\s]+/g, '')
      const matches = keyNormalized === normalizedKey
      
      if (matches) {
        console.log('✅ [CLAIM-KEY] Found matching key:', k.key)
        console.log('📊 [CLAIM-KEY] Key status:', {
          userId: k.userId || 'none',
          claimedAt: k.claimedAt || 'none',
          duration: k.duration
        })
      }
      
      return matches && !k.userId && !k.claimedAt
    })

    if (keyIndex === -1) {
      // Check if key exists but is already claimed
      const existingKey = allKeys.find(k => {
        const keyNormalized = k.key.toUpperCase().replace(/[-\s]+/g, '')
        return keyNormalized === normalizedKey
      })
      
      if (existingKey) {
        if (existingKey.userId || existingKey.claimedAt) {
          console.log('⚠️ [CLAIM-KEY] Key exists but is already claimed')
          return NextResponse.json(
            { error: 'This key has already been claimed' },
            { status: 400 }
          )
        }
      }
      
      console.log('❌ [CLAIM-KEY] Key not found in database')
      console.log('📊 [CLAIM-KEY] Sample keys:', allKeys.slice(0, 5).map(k => ({
        original: k.key,
        normalized: k.key.toUpperCase().replace(/[-\s]+/g, '')
      })))
      
      return NextResponse.json(
        { error: 'Clé non disponible ou déjà utilisée' },
        { status: 400 }
      )
    }

    const keyRecord = allKeys[keyIndex]

    // Vérifier si l'utilisateur a déjà une clé active
    const existingKey = allKeys.find(k => k.userId === decoded.userId && k.claimedAt)
    if (existingKey) {
      return NextResponse.json(
        { error: 'You already have an active key' },
        { status: 400 }
      )
    }

    // Associer la clé à l'utilisateur et démarrer le timer
    const now = new Date()
    const expiresAt = calculateExpiry(keyRecord.duration)

    allKeys[keyIndex] = {
      ...keyRecord,
      userId: decoded.userId,
      claimedAt: now.toISOString(), // Date de réclamation
      expiresAt: expiresAt?.toISOString(), // Date d'expiration calculée à partir de maintenant
      canBeUsedForRegistration: false
    }

    await saveKeys(allKeys)

    return NextResponse.json({
      message: 'Key claimed successfully! Timer has started.',
      key: {
        ...allKeys[keyIndex],
        expiresAt: expiresAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Claim key error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
