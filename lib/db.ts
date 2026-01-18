import fs from 'fs'
import path from 'path'
import * as dbPostgres from './db-postgres'

// Utiliser PostgreSQL si DATABASE_URL est défini, sinon utiliser les fichiers JSON
const USE_POSTGRES = !!process.env.DATABASE_URL

const dataDir = path.join(process.cwd(), 'data')
const usersFile = path.join(dataDir, 'users.json')
const keysFile = path.join(dataDir, 'keys.json')
const emailCodesFile = path.join(dataDir, 'email-codes.json')

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialiser PostgreSQL si nécessaire (sera fait au démarrage via init-db.ts)
if (USE_POSTGRES) {
  // L'initialisation se fait via lib/init-db.ts au démarrage
  import('./init-db').catch(console.error)
}

interface User {
  id: string
  email: string
  password: string
  createdAt: string
  banned?: boolean
  registrationIp?: string
  lastLoginIp?: string
  lastLoginAt?: string
}

interface Key {
  userId?: string  // Optional - can be used for registration
  key: string
  duration: string
  purchaseDate: string
  expiresAt?: string  // Définie seulement quand la clé est réclamée
  claimedAt?: string  // Date à laquelle l'utilisateur a réclamé la clé
  canBeUsedForRegistration?: boolean  // Flag for registration keys
  purchasedBy?: string  // Track who purchased the key (if purchased)
  hwid?: string  // Hardware ID for activation
  stripeSessionId?: string  // Stripe Checkout Session ID
}

export async function getUsers(): Promise<User[]> {
  if (USE_POSTGRES) {
    return await dbPostgres.getUsers()
  }
  
  if (!fs.existsSync(usersFile)) {
    return []
  }
  return JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
}

export async function saveUsers(users: User[]): Promise<void> {
  if (USE_POSTGRES) {
    await dbPostgres.saveUsers(users)
    return
  }
  
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
}

export async function getKeys(): Promise<Key[]> {
  if (USE_POSTGRES) {
    console.log('📥 [DB] Using PostgreSQL to fetch keys')
    return await dbPostgres.getKeys()
  }
  
  console.log('📥 [DB] Using JSON file to fetch keys')
  if (!fs.existsSync(keysFile)) {
    console.log('📁 [DB] Keys file does not exist, returning empty array')
    return []
  }
  const keys = JSON.parse(fs.readFileSync(keysFile, 'utf-8'))
  console.log(`✅ [DB] Retrieved ${keys.length} keys from JSON file`)
  return keys
}

export async function saveKeys(keys: Key[]): Promise<void> {
  if (USE_POSTGRES) {
    await dbPostgres.saveKeys(keys)
    return
  }
  
  fs.writeFileSync(keysFile, JSON.stringify(keys, null, 2))
}

export async function createKey(key: Key): Promise<void> {
  console.log('💾 [DB] createKey called:', { 
    key: key.key, 
    duration: key.duration,
    usePostgres: USE_POSTGRES 
  })
  
  if (USE_POSTGRES) {
    console.log('💾 [DB] Using PostgreSQL to save key')
    await dbPostgres.createKey(key)
    console.log('✅ [DB] Key saved to PostgreSQL')
    return
  }
  
  console.log('💾 [DB] Using JSON file to save key')
  // Use async getKeys for consistency
  const keys = await getKeys()
  console.log(`📊 [DB] Current keys count: ${keys.length}`)
  
  // Check for duplicates
  if (keys.some(k => k.key === key.key)) {
    console.warn(`⚠️ [DB] Key ${key.key} already exists, skipping`)
    throw new Error(`Key ${key.key} already exists`)
  }
  
  keys.push(key)
  await saveKeys(keys)
  console.log(`✅ [DB] Key saved to JSON file, new count: ${keys.length}`)
}

function getKeysSync(): Key[] {
  if (!fs.existsSync(keysFile)) {
    return []
  }
  return JSON.parse(fs.readFileSync(keysFile, 'utf-8'))
}

interface EmailVerificationCode {
  email: string
  code: string
  createdAt: string
  expiresAt: string
  verified?: boolean
}

export function getEmailCodes(): EmailVerificationCode[] {
  if (!fs.existsSync(emailCodesFile)) {
    return []
  }
  return JSON.parse(fs.readFileSync(emailCodesFile, 'utf-8'))
}

export function saveEmailCodes(codes: EmailVerificationCode[]) {
  fs.writeFileSync(emailCodesFile, JSON.stringify(codes, null, 2))
}
