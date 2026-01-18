import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to logout and clear session cookie
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    message: 'Logged out successfully'
  })

  // Clear auth cookie
  response.cookies.delete('auth-token')

  return response
}



