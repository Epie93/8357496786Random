import { NextRequest, NextResponse } from 'next/server'
import { getKeys, saveKeys } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json(
        { error: 'Clé requise' },
        { status: 400 }
      )
    }

    const keys = await getKeys()
    const filteredKeys = keys.filter(k => k.key !== key.toUpperCase())

    if (filteredKeys.length === keys.length) {
      return NextResponse.json(
        { error: 'Clé non trouvée' },
        { status: 404 }
      )
    }

    await saveKeys(filteredKeys)

    return NextResponse.json({
      message: 'Clé supprimée avec succès'
    })
  } catch (error) {
    console.error('Delete key error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

