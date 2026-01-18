import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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

const LOGS_FILE = path.join(process.cwd(), 'data', 'request-logs.json')

export async function GET(request: NextRequest) {
  if (!checkIp(request)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    let logs: any[] = []
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8')
      logs = JSON.parse(data)
    }

    // Formatter les logs en texte
    const textContent = logs.map(log => {
      return `[${log.timestamp}] ${log.method} ${log.path} - IP: ${log.ip} - UA: ${log.userAgent || 'N/A'}`
    }).join('\n')

    const headers = new Headers()
    headers.set('Content-Type', 'text/plain; charset=utf-8')
    headers.set('Content-Disposition', `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.txt"`)

    return new NextResponse(textContent || 'No logs available', { headers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to download logs' }, { status: 500 })
  }
}
