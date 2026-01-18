import { NextRequest, NextResponse } from 'next/server'
import { getUsers } from '@/lib/db'
import { ensureDatabaseInitialized } from '@/lib/init-db'

export async function GET(request: NextRequest) {
  try {
    // Ensure database is initialized (for PostgreSQL)
    await ensureDatabaseInitialized()
    
    const users = await getUsers()
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user)

    return NextResponse.json({
      users: usersWithoutPasswords
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

