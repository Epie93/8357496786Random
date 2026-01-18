import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const ADMINS_FILE = path.join(process.cwd(), 'data', 'admins.json')

function getAdmins(): any[] {
  if (!fs.existsSync(ADMINS_FILE)) {
    // Créer un admin par défaut si le fichier n'existe pas
    const dir = path.dirname(ADMINS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const defaultAdmin = {
      id: '1',
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10),
      createdAt: new Date().toISOString()
    }
    fs.writeFileSync(ADMINS_FILE, JSON.stringify([defaultAdmin], null, 2))
    return [defaultAdmin]
  }
  
  try {
    const data = fs.readFileSync(ADMINS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      )
    }

    const admins = getAdmins()
    
    // Chercher l'admin par username
    const admin = admins.find(a => a.username === username)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe avec bcrypt
    const passwordMatch = await bcrypt.compare(password, admin.passwordHash)
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      message: 'Login successful',
      admin: {
        id: admin.id,
        username: admin.username
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
