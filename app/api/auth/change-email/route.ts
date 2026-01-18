import { NextRequest, NextResponse } from 'next/server'
import { getUsers, saveUsers } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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

    const { newEmail } = await request.json()

    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    const users = await getUsers()
    const userIndex = users.findIndex(u => u.id === decoded.userId)

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Check if email already exists
    if (users.find(u => u.email.toLowerCase() === newEmail.toLowerCase() && u.id !== decoded.userId)) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    users[userIndex].email = newEmail.toLowerCase()
    await saveUsers(users)

    return NextResponse.json({
      message: 'Email modifié avec succès',
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email
      }
    })
  } catch (error) {
    console.error('Change email error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

