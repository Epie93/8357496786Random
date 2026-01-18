import { NextRequest, NextResponse } from 'next/server'
import { getUsers, saveUsers, getEmailCodes } from '@/lib/db'
import { verifyToken, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, code } = await request.json()

    // Mode 1 : Réinitialisation via code email (utilisateur non connecté)
    if (email && code) {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Le mot de passe doit contenir au moins 6 caractères' },
          { status: 400 }
        )
      }

      const normalizedEmail = email.toLowerCase()

      // Vérifier que le code a été validé
      const allCodes = getEmailCodes()
      const validCode = allCodes.find(c => {
        const codeType = (c as any).type || 'reset-password'
        return c.email === normalizedEmail &&
               c.code === code &&
               codeType === 'reset-password' &&
               c.verified === true
      })

      if (!validCode) {
        return NextResponse.json(
          { error: 'Code non vérifié ou invalide. Veuillez d\'abord vérifier votre code.' },
          { status: 400 }
        )
      }

      const users = await getUsers()
      const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail)

      if (userIndex === -1) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }

      users[userIndex].password = await hashPassword(newPassword)
      await saveUsers(users)

      return NextResponse.json({
        message: 'Mot de passe modifié avec succès'
      })
    }

    // Mode 2 : Changement via token (utilisateur connecté)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorisé - Email et code requis, ou token d\'authentification' },
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

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
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

    users[userIndex].password = await hashPassword(newPassword)
    await saveUsers(users)

    return NextResponse.json({
      message: 'Mot de passe modifié avec succès'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

