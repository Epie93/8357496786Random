import { NextRequest, NextResponse } from 'next/server'
import { getKeys } from '@/lib/db'
import { ensureDatabaseInitialized } from '@/lib/init-db'

export async function GET(request: NextRequest) {
  try {
    console.log('📥 [GET-KEYS] Starting fetch...')
    
    // Ensure database is initialized (for PostgreSQL)
    await ensureDatabaseInitialized()
    console.log('✅ [GET-KEYS] Database initialized')
    
    console.log('📥 [GET-KEYS] Fetching all keys from database...')
    const keys = await getKeys()
    console.log(`✅ [GET-KEYS] Retrieved ${keys.length} keys from database`)
    
    if (keys.length > 0) {
      console.log(`📊 [GET-KEYS] Sample keys:`, keys.slice(0, 3).map(k => k.key))
    }

    return NextResponse.json({
      keys: keys || []
    })
  } catch (error: any) {
    console.error('❌ [GET-KEYS] Error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    return NextResponse.json(
      { error: error.message || 'Server error', keys: [] },
      { status: 500 }
    )
  }
}

