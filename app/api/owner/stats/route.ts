import { NextRequest, NextResponse } from 'next/server'
import { getUsers, getKeys } from '@/lib/db'

// IP autorisée - SEULEMENT cette IP
const ALLOWED_IP = '83.78.15.204'
const ALLOW_LOCALHOST = true

function checkIp(request: NextRequest): boolean {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const trueClientIp = request.headers.get('true-client-ip')
  const clientIp = cfConnectingIp || trueClientIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown'
  const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost'
  return clientIp === ALLOWED_IP || (ALLOW_LOCALHOST && isLocalhost)
}

export async function GET(request: NextRequest) {
  if (!checkIp(request)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const users = await getUsers()
    const keys = await getKeys()
    
    // Statistiques des achats
    const totalPurchases = keys.filter((k) => k.claimedAt).length
    const totalUsers = users.length
    const totalKeys = keys.length
    const activeKeys = keys.filter((k) => {
      if (!k.expiresAt) return true
      return new Date(k.expiresAt) > new Date()
    }).length
    
    // Achats par jour (derniers 7 jours)
    const last7Days: { [key: string]: number } = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last7Days[dateStr] = 0
    }
    
    keys.forEach((key) => {
      if (key.claimedAt) {
        const dateStr = new Date(key.claimedAt).toISOString().split('T')[0]
        if (last7Days[dateStr] !== undefined) {
          last7Days[dateStr]++
        }
      }
    })
    
    // Revenus estimés par durée
    const revenueByPlan: { [key: string]: number } = {
      '1-day': 4,
      '1 day': 4,
      '1-week': 9,
      '1 week': 9,
      '7 days': 9,
      '1-month': 17,
      '1 month': 17,
      '30 days': 17,
      'lifetime': 30,
      'Lifetime': 30
    }
    
    let totalRevenue = 0
    keys.forEach((key) => {
      if (key.claimedAt && key.duration) {
        totalRevenue += revenueByPlan[key.duration] || 0
      }
    })

    return NextResponse.json({
      totalPurchases,
      totalUsers,
      totalKeys,
      activeKeys,
      totalRevenue,
      purchasesByDay: last7Days
    })
  } catch (error) {
    console.error('Error getting stats:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
