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

// Initialiser le fichier de logs s'il n'existe pas
function initLogsFile() {
  const dir = path.dirname(LOGS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([]))
  }
}

function getLogs(): any[] {
  initLogsFile()
  try {
    const data = fs.readFileSync(LOGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveLogs(logs: any[]) {
  initLogsFile()
  // Garder seulement les 1000 derniers logs
  const recentLogs = logs.slice(-1000)
  fs.writeFileSync(LOGS_FILE, JSON.stringify(recentLogs, null, 2))
}

export async function GET(request: NextRequest) {
  if (!checkIp(request)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const logs = getLogs()
  return NextResponse.json({ logs: logs.slice(-100).reverse() })
}

export async function POST(request: NextRequest) {
  // Cette route est appelée pour ajouter un log
  try {
    const { path: reqPath, method, ip, userAgent, timestamp } = await request.json()
    
    const logs = getLogs()
    logs.push({
      path: reqPath,
      method,
      ip,
      userAgent,
      timestamp: timestamp || new Date().toISOString()
    })
    saveLogs(logs)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkIp(request)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Vider les logs
  saveLogs([])
  return NextResponse.json({ success: true })
}
