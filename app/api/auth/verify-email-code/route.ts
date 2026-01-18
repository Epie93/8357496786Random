import { NextRequest, NextResponse } from 'next/server'
import { getEmailCodes, saveEmailCodes } from '@/lib/db'

type CodeType = 'register' | 'login' | 'reset-password' | 'change-email'

export async function POST(request: NextRequest) {
  try {
    const { email, code, type = 'register' } = await request.json() as { 
      email: string
      code: string
      type?: CodeType 
    }

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email et code requis' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()
    const normalizedCode = code.trim()

    const allCodes = getEmailCodes()
    const now = new Date()

    // Trouver le code valide pour cet email et ce type
    const validCode = allCodes.find(c => {
      const codeType = (c as any).type || 'register'
      return c.email === normalizedEmail &&
             c.code === normalizedCode &&
             codeType === type &&
             new Date(c.expiresAt) > now &&
             !c.verified
    })

    if (!validCode) {
      return NextResponse.json(
        { error: 'Code invalide ou expiré' },
        { status: 400 }
      )
    }

    // Marquer le code comme vérifié
    const codeIndex = allCodes.findIndex(c => {
      const codeType = (c as any).type || 'register'
      return c.email === normalizedEmail && c.code === normalizedCode && codeType === type
    })
    
    if (codeIndex !== -1) {
      allCodes[codeIndex].verified = true
      saveEmailCodes(allCodes)
    }

    return NextResponse.json({
      message: 'Code vérifié avec succès',
      verified: true,
      type
    })
  } catch (error) {
    console.error('Verify email code error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du code' },
      { status: 500 }
    )
  }
}

