import { NextRequest, NextResponse } from 'next/server'
import { getKeys, saveKeys } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json(
        { error: 'Key required' },
        { status: 400 }
      )
    }

    const keys = await getKeys()
    const keyIndex = keys.findIndex(k => k.key === key.toUpperCase())

    if (keyIndex === -1) {
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      )
    }

    keys[keyIndex].hwid = undefined
    await saveKeys(keys)

    return NextResponse.json({
      message: 'HWID reset successfully. Next login will bind to new hardware.'
    })
  } catch (error) {
    console.error('Reset HWID error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

