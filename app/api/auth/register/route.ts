import { NextRequest, NextResponse } from 'next/server'
import { getUsers, saveUsers, getKeys, saveKeys } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

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
    const { email, password, activationKey } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()
    const clientIp = getClientIp(request)

    const users = await getUsers()
    const allKeys = await getKeys()

    // Check if user already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { error: 'This email is already in use' },
        { status: 400 }
      )
    }

    // Create new user with IP
    const hashedPassword = await hashPassword(password)
    const newUser = {
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      registrationIp: clientIp
    }

    users.push(newUser)
    await saveUsers(users)

    // Si une clé d'activation est fournie, l'associer au compte
    if (activationKey && activationKey.trim()) {
      // Normalize the key (remove spaces and dashes, uppercase)
      const normalizedKey = activationKey.trim().toUpperCase().replace(/[-\s]+/g, '')

      // Find a valid key that can be used for registration
      const validKey = allKeys.find(k => {
        return k.key === normalizedKey && 
               k.canBeUsedForRegistration === true && 
               !k.userId
      })

      if (validKey && (!validKey.expiresAt || new Date(validKey.expiresAt) > new Date())) {
        // Associate the key with the new user
        const keyIndex = allKeys.findIndex(k => k.key === normalizedKey && k.canBeUsedForRegistration && !k.userId)
        if (keyIndex !== -1) {
          allKeys[keyIndex].userId = newUser.id
          allKeys[keyIndex].canBeUsedForRegistration = false
          await saveKeys(allKeys)
        }
      }
    }

    // Generate token
    const token = generateToken(newUser.id, newUser.email)

    // Create response with user data
    const response = NextResponse.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email
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
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}