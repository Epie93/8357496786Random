import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers } from '@/lib/db'

/**
 * API endpoint to get current user from cookie session
 * Used for automatic login persistence
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)

    if (!decoded) {
      // Invalid token, clear cookie
      const response = NextResponse.json(
        { user: null, authenticated: false },
        { status: 401 }
      )
      response.cookies.delete('auth-token')
      return response
    }

    // Get user data
    const users = await getUsers()
    const user = users.find(u => u.id === decoded.userId)

    if (!user) {
      const response = NextResponse.json(
        { user: null, authenticated: false },
        { status: 401 }
      )
      response.cookies.delete('auth-token')
      return response
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      authenticated: true
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 500 }
    )
  }
}



