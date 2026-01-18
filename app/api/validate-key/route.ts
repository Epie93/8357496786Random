import { NextRequest, NextResponse } from 'next/server'
import { getKeys } from '@/lib/db'

/**
 * API endpoint for validating keys from external applications (like .exe)
 * This endpoint can be called by your executable to verify if a key is valid
 */
export async function POST(request: NextRequest) {
  try {
    const { key, hwid } = await request.json()

    if (!key) {
      return NextResponse.json(
        { valid: false, error: 'Key is required' },
        { status: 400 }
      )
    }

    const allKeys = await getKeys()
    const keyRecord = allKeys.find(k => k.key === key)

    if (!keyRecord) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid key'
      })
    }

    // Check if key is claimed
    if (!keyRecord.userId || !keyRecord.claimedAt) {
      return NextResponse.json({
        valid: false,
        error: 'Key not activated. Please claim the key on the website first.'
      })
    }

    // Check if key is expired
    if (keyRecord.expiresAt) {
      const expiresAt = new Date(keyRecord.expiresAt)
      if (expiresAt < new Date()) {
        return NextResponse.json({
          valid: false,
          error: 'Key has expired',
          expired: true
        })
      }
    }

    // Check HWID if provided
    if (hwid) {
      // If key has HWID and it doesn't match, reject
      if (keyRecord.hwid && keyRecord.hwid !== hwid) {
        return NextResponse.json({
          valid: false,
          error: 'Key is bound to a different hardware ID',
          hwidMismatch: true
        })
      }
    }

    // Check if user is banned
    // Note: You might want to check user status here if needed

    return NextResponse.json({
      valid: true,
      key: keyRecord.key,
      duration: keyRecord.duration,
      expiresAt: keyRecord.expiresAt,
      claimedAt: keyRecord.claimedAt,
      message: 'Key is valid'
    })
  } catch (error) {
    console.error('Validate key error:', error)
    return NextResponse.json(
      { valid: false, error: 'Server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for simple key validation (optional, for testing)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const key = searchParams.get('key')
  const hwid = searchParams.get('hwid')

  if (!key) {
    return NextResponse.json(
      { valid: false, error: 'Key parameter is required' },
      { status: 400 }
    )
  }

  // Reuse POST logic
  const mockRequest = {
    json: async () => ({ key, hwid })
  } as NextRequest

  return POST(mockRequest)
}



