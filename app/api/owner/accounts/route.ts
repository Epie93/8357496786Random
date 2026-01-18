import { NextRequest, NextResponse } from 'next/server'
import { getUsers } from '@/lib/db'

// IP autorisée - SEULEMENT cette IP
const ALLOWED_IP = '83.78.15.204'
const ALLOW_LOCALHOST = true

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const trueClientIp = request.headers.get('true-client-ip')
  return cfConnectingIp || trueClientIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown'
}

function checkIp(request: NextRequest): boolean {
  const clientIp = getClientIp(request)
  const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost'
  return clientIp === ALLOWED_IP || (ALLOW_LOCALHOST && isLocalhost)
}

// GET - Liste tous les comptes avec leur IP
export async function GET(request: NextRequest) {
  if (!checkIp(request)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const users = await getUsers()
    
    // Retourner les comptes sans le mot de passe
    const accounts = users.map(({ password, ...user }) => ({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      registrationIp: (user as any).registrationIp || 'N/A',
      lastLoginIp: (user as any).lastLoginIp || 'N/A',
      lastLoginAt: (user as any).lastLoginAt || null,
      banned: user.banned || false
    }))

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
