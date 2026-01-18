import { NextRequest, NextResponse } from 'next/server'
import { getUsers, getKeys } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

/**
 * API endpoint for loader (.exe) to validate credentials and check license status
 * This endpoint validates email/password and checks if the user has an active license
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, hwid } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Email and password required',
          hasLicense: false
        },
        { status: 400 }
      )
    }

    // Verify credentials
    const users = await getUsers()
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json({
        valid: false,
        hasLicense: false,
        error: 'Invalid credentials'
      })
    }

    // Check if user is banned
    if (user.banned) {
      return NextResponse.json({
        valid: false,
        hasLicense: false,
        error: 'Account is banned'
      })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({
        valid: false,
        hasLicense: false,
        error: 'Invalid credentials'
      })
    }

    // Get user's keys
    const allKeys = await getKeys()
    const userKeys = allKeys.filter(
      k => k.userId === user.id && k.claimedAt // Only claimed keys
    )

    if (userKeys.length === 0) {
      return NextResponse.json({
        valid: true,
        authenticated: true,
        hasLicense: false,
        error: 'No active license found. Please claim a key on the website.',
        user: {
          id: user.id,
          email: user.email
        }
      })
    }

    // Check for active (non-expired) keys
    const now = new Date()
    const activeKeys = userKeys.filter(k => {
      if (!k.expiresAt) return true // Lifetime key
      return new Date(k.expiresAt) > now
    })

    if (activeKeys.length === 0) {
      // All keys are expired
      const expiredKey = userKeys[0] // Get first expired key for info
      return NextResponse.json({
        valid: true,
        authenticated: true,
        hasLicense: false,
        error: 'License has expired',
        expired: true,
        lastExpiry: expiredKey.expiresAt,
        user: {
          id: user.id,
          email: user.email
        }
      })
    }

    // User has at least one active license
    const activeKey = activeKeys[0] // Use the first active key
    const isLifetime = !activeKey.expiresAt

    // Check HWID if provided
    if (hwid) {
      // If key has HWID and it doesn't match, reject
      if (activeKey.hwid && activeKey.hwid !== hwid) {
        return NextResponse.json({
          valid: true,
          authenticated: true,
          hasLicense: false,
          error: 'License is bound to a different hardware ID',
          hwidMismatch: true,
          user: {
            id: user.id,
            email: user.email
          }
        })
      }

      // Auto-bind or update HWID if not already bound (first time use or after reset)
      if (!activeKey.hwid || activeKey.hwid !== hwid) {
        const { saveKeys } = await import('@/lib/db')
        const allKeys = await getKeys()
        const keyIndex = allKeys.findIndex(k => k.key === activeKey.key)
        
        if (keyIndex !== -1) {
          allKeys[keyIndex].hwid = hwid
          await saveKeys(allKeys)
          console.log(`✅ HWID ${activeKey.hwid ? 'updated' : 'auto-bound'} to key ${activeKey.key}`)
          // Update activeKey for response
          activeKey.hwid = hwid
        }
      }
    }

    // Calculate time remaining
    let timeRemaining: string | null = null
    if (activeKey.expiresAt) {
      const expiresAt = new Date(activeKey.expiresAt)
      const diff = expiresAt.getTime() - now.getTime()
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        if (days > 0) {
          timeRemaining = `${days}d ${hours}h ${minutes}m`
        } else if (hours > 0) {
          timeRemaining = `${hours}h ${minutes}m`
        } else {
          timeRemaining = `${minutes}m`
        }
      }
    }

    return NextResponse.json({
      valid: true,
      authenticated: true,
      hasLicense: true,
      license: {
        key: activeKey.key,
        duration: activeKey.duration,
        expiresAt: activeKey.expiresAt,
        claimedAt: activeKey.claimedAt,
        isLifetime: isLifetime,
        timeRemaining: timeRemaining || (isLifetime ? 'Lifetime' : null),
        hwid: activeKey.hwid
      },
      user: {
        id: user.id,
        email: user.email
      },
      message: 'License is valid'
    })
  } catch (error: any) {
    console.error('Validate license error:', error)
    return NextResponse.json(
      { 
        valid: false, 
        hasLicense: false,
        error: error.message || 'Server error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for simple validation (optional, for testing)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email')
  const password = searchParams.get('password')
  const hwid = searchParams.get('hwid')

  if (!email || !password) {
    return NextResponse.json(
      { 
        valid: false, 
        hasLicense: false,
        error: 'Email and password parameters required' 
      },
      { status: 400 }
    )
  }

  // Reuse POST logic
  const mockRequest = {
    json: async () => ({ email, password, hwid })
  } as NextRequest

  return POST(mockRequest)
}

