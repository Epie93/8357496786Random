import { NextRequest, NextResponse } from 'next/server'
import { createKey } from '@/lib/db'
import { generateKey } from '@/lib/auth'
import { ensureDatabaseInitialized } from '@/lib/init-db'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [GENERATE-KEYS] Starting key generation process...')
    
    // Ensure database is initialized (for PostgreSQL)
    console.log('🔧 [GENERATE-KEYS] Initializing database...')
    await ensureDatabaseInitialized()
    console.log('✅ [GENERATE-KEYS] Database initialized')
    
    const { count, duration } = await request.json()
    console.log('📥 [GENERATE-KEYS] Request received:', { count, duration })

    if (!count || !duration) {
      return NextResponse.json(
        { error: 'Count and duration required' },
        { status: 400 }
      )
    }

    const newKeyRecords: any[] = []
    const errors = []

    console.log(`🔄 [GENERATE-KEYS] Starting generation of ${count} keys...`)

    for (let i = 0; i < count; i++) {
      let newKey: string | null = null
      try {
        // Generate key string with duration prefix
        newKey = generateKey(duration)
        console.log(`🔑 [GENERATE-KEYS] Generated key ${i + 1}/${count}: ${newKey}`)

        // Create key record
        const keyRecord = {
          key: newKey,
          duration: duration,
          purchaseDate: new Date().toISOString(),
          expiresAt: undefined,
          canBeUsedForRegistration: true,
          claimedAt: undefined,
          userId: undefined,
          hwid: undefined,
          purchasedBy: undefined,
          stripeSessionId: undefined
        }

        console.log(`💾 [GENERATE-KEYS] Saving key ${i + 1}/${count} to database...`)
        
        // Save to database
        await createKey(keyRecord)
        
        console.log(`✅ [GENERATE-KEYS] Key ${i + 1}/${count} saved successfully: ${newKey}`)
        
        // Add to results
        newKeyRecords.push(keyRecord)
        
      } catch (error: any) {
        console.error(`❌ [GENERATE-KEYS] Error creating key ${i + 1}:`, error)
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          detail: error.detail,
          constraint: error.constraint,
          key: newKey || 'Failed to generate',
          duration: duration
        })
        errors.push(`Key ${i + 1}: ${error.message || 'Unknown error'}`)
      }
    }

    console.log(`📊 [GENERATE-KEYS] Generation complete: ${newKeyRecords.length} successful, ${errors.length} errors`)

    if (newKeyRecords.length === 0) {
      console.error('❌ [GENERATE-KEYS] No keys were generated!')
      return NextResponse.json(
        { 
          error: 'Failed to generate any keys',
          details: errors
        },
        { status: 500 }
      )
    }

    // Verify keys were actually saved by fetching them back
    console.log('🔍 [GENERATE-KEYS] Verifying keys in database...')
    try {
      const { getKeys } = await import('@/lib/db')
      const allKeys = await getKeys()
      console.log(`📊 [GENERATE-KEYS] Total keys in database: ${allKeys.length}`)
      
      const newKeyStrings = newKeyRecords.map(k => k.key)
      const foundKeys = newKeyStrings.filter(k => allKeys.some(ak => ak.key === k))
      console.log(`📊 [GENERATE-KEYS] Newly generated keys found in DB: ${foundKeys.length}/${newKeyRecords.length}`)
      
      if (foundKeys.length < newKeyRecords.length) {
        console.warn(`⚠️ [GENERATE-KEYS] Some keys were not found in database!`)
        const missingKeys = newKeyStrings.filter(k => !allKeys.some(ak => ak.key === k))
        console.warn(`⚠️ [GENERATE-KEYS] Missing keys:`, missingKeys)
      }
    } catch (verifyError: any) {
      console.error('❌ [GENERATE-KEYS] Could not verify keys:', verifyError)
    }

    console.log(`✅ [GENERATE-KEYS] Returning ${newKeyRecords.length} keys to client`)

    return NextResponse.json({
      keys: newKeyRecords,
      count: newKeyRecords.length,
      message: `${newKeyRecords.length} key(s) generated successfully`,
      warnings: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('❌ [GENERATE-KEYS] Fatal error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Server error',
        details: error.stack
      },
      { status: 500 }
    )
  }
}
