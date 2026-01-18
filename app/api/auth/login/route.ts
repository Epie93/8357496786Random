import { NextRequest, NextResponse } from 'next/server'
import { getUsers, saveUsers } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'

// Get client IP from request
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const trueClientIp = request.headers.get('true-client-ip')
  return cfConnectingIp || trueClientIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, checkOnly } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const users = await getUsers()
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase())
    const user = userIndex !== -1 ? users[userIndex] : null

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur est banni
    if (user.banned) {
      return NextResponse.json(
        { error: 'Votre compte a été suspendu' },
        { status: 403 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Mode checkOnly : juste vérifier les identifiants sans connecter
    // Utilisé pour la vérification 2FA avant d'envoyer le code
    if (checkOnly) {
      return NextResponse.json({
        valid: true,
        message: 'Identifiants valides'
      })
    }

    // Update last login IP and time
    const clientIp = getClientIp(request)
    ;(users[userIndex] as any).lastLoginIp = clientIp
    ;(users[userIndex] as any).lastLoginAt = new Date().toISOString()
    await saveUsers(users)

    // Generate token
    const token = generateToken(user.id, user.email)

    // Create response with user data
    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    })

    // Set HTTP-only cookie for secure session persistence (30 days)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

