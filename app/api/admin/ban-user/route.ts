import { NextRequest, NextResponse } from 'next/server'
import { getUsers, saveUsers } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID requis' },
        { status: 400 }
      )
    }

    const users = await getUsers()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    users[userIndex].banned = true
    await saveUsers(users)

    return NextResponse.json({
      message: 'Utilisateur banni avec succès'
    })
  } catch (error) {
    console.error('Ban user error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

