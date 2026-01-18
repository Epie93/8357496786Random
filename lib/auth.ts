import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    return decoded
  } catch {
    return null
  }
}

export function generateKey(duration?: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  
  // Determine prefix based on duration
  let prefix = 'Epie'
  if (duration) {
    switch (duration) {
      case '1 jour':
        prefix = 'Epie1d'
        break
      case '1 semaine':
        prefix = 'Epie1w'
        break
      case '1 mois':
        prefix = 'Epie1m'
        break
      case 'À vie':
        prefix = 'EpieLt'
        break
      default:
        prefix = 'Epie'
    }
  }
  
  // Generate random segments (2 segments of 4 characters each)
  const segments = []
  for (let i = 0; i < 2; i++) {
    let segment = ''
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }
  
  // Format: Epie1d-XXXX-XXXX
  return `${prefix}-${segments.join('-')}`
}

export function calculateExpiry(duration: string): Date | undefined {
  const now = new Date()
  switch (duration) {
    case '1 jour':
      now.setDate(now.getDate() + 1)
      return now
    case '1 semaine':
      now.setDate(now.getDate() + 7)
      return now
    case '1 mois':
      now.setMonth(now.getMonth() + 1)
      return now
    case 'À vie':
      return undefined
    default:
      return undefined
  }
}

