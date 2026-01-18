import { NextRequest } from 'next/server'
import { verifyToken } from './auth'

/**
 * Get user from request (checks both cookie and Authorization header)
 */
export function getUserFromRequest(request: NextRequest): { userId: string; email: string } | null {
  // Try to get token from cookie first
  const cookieToken = request.cookies.get('auth-token')?.value
  
  if (cookieToken) {
    const decoded = verifyToken(cookieToken)
    if (decoded) {
      return decoded
    }
  }

  // Fallback to Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (decoded) {
      return decoded
    }
  }

  return null
}



