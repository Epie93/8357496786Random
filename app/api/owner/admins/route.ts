import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

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

const ADMINS_FILE = path.join(process.cwd(), 'data', 'admins.json')

function initAdminsFile() {
  const dir = path.dirname(ADMINS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(ADMINS_FILE)) {
    // Créer un admin par défaut
    const defaultAdmin = {
      id: '1',
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10),
      createdAt: new Date().toISOString()
    }
    fs.writeFileSync(ADMINS_FILE, JSON.stringify([defaultAdmin], null, 2))
  }
}

function getAdmins(): any[] {
  initAdminsFile()
  try {
    const data = fs.readFileSync(ADMINS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveAdmins(admins: any[]) {
  initAdminsFile()
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2))
}

// GET - Liste des admins
export async function GET(request: NextRequest) {
  if (!checkIp(request)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const admins = getAdmins()
  // Ne pas renvoyer les mots de passe
  const safeAdmins = admins.map(({ passwordHash, ...rest }) => rest)
  return NextResponse.json({ admins: safeAdmins })
}

// POST - Créer un admin
export async function POST(request: NextRequest) {
  if (!checkIp(request)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const admins = getAdmins()

    // Vérifier si l'username existe déjà
    if (admins.some(a => a.username === username)) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    const newAdmin = {
      id: Date.now().toString(),
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      createdAt: new Date().toISOString()
    }

    admins.push(newAdmin)
    saveAdmins(admins)

    return NextResponse.json({ 
      success: true, 
      admin: { id: newAdmin.id, username: newAdmin.username, createdAt: newAdmin.createdAt }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}

// DELETE - Supprimer un admin
export async function DELETE(request: NextRequest) {
  if (!checkIp(request)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 })
    }

    const admins = getAdmins()
    
    // Ne pas permettre de supprimer le dernier admin
    if (admins.length <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last admin' }, { status: 400 })
    }

    const newAdmins = admins.filter(a => a.id !== id)
    
    if (newAdmins.length === admins.length) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    saveAdmins(newAdmins)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 })
  }
}
