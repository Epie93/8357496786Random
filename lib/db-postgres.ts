import { Pool } from 'pg'

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Initialiser les tables si elles n'existent pas
export async function initDatabase() {
  try {
    // Table des utilisateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        banned BOOLEAN DEFAULT FALSE
      )
    `)

    // Table des clés
    await pool.query(`
      CREATE TABLE IF NOT EXISTS keys (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        key VARCHAR(255) UNIQUE NOT NULL,
        duration VARCHAR(100) NOT NULL,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        claimed_at TIMESTAMP,
        can_be_used_for_registration BOOLEAN DEFAULT FALSE,
        purchased_by VARCHAR(255),
        hwid VARCHAR(255),
        stripe_session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Index pour améliorer les performances
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_keys_user_id ON keys(user_id)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_keys_purchased_by ON keys(purchased_by)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_keys_key ON keys(key)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `)

    console.log('✅ Base de données initialisée avec succès')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error)
    throw error
  }
}

// Interface User
export interface User {
  id: string
  email: string
  password: string
  createdAt: string
  banned?: boolean
}

// Interface Key
export interface Key {
  id?: number
  userId?: string
  key: string
  duration: string
  purchaseDate: string
  expiresAt?: string
  claimedAt?: string
  canBeUsedForRegistration?: boolean
  purchasedBy?: string
  hwid?: string
  stripeSessionId?: string
}

// Fonctions pour les utilisateurs
export async function getUsers(): Promise<User[]> {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC')
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      password: row.password,
      createdAt: row.created_at,
      banned: row.banned || false,
    }))
  } catch (error) {
    console.error('Error getting users:', error)
    return []
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    for (const user of users) {
      await client.query(
        `INSERT INTO users (id, email, password, created_at, banned)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) 
         DO UPDATE SET email = $2, password = $3, banned = $5`,
        [user.id, user.email, user.password, user.createdAt, user.banned || false]
      )
    }
    
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error saving users:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      createdAt: row.created_at,
      banned: row.banned || false,
    }
  } catch (error) {
    console.error('Error getting user by id:', error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      createdAt: row.created_at,
      banned: row.banned || false,
    }
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

export async function createUser(user: User): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO users (id, email, password, created_at, banned)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, user.email, user.password, user.createdAt, user.banned || false]
    )
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function updateUser(user: User): Promise<void> {
  try {
    await pool.query(
      `UPDATE users SET email = $1, password = $2, banned = $3 WHERE id = $4`,
      [user.email, user.password, user.banned || false, user.id]
    )
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

// Fonctions pour les clés
export async function getKeys(): Promise<Key[]> {
  try {
    console.log('📥 [POSTGRES] Fetching all keys from database...')
    const result = await pool.query('SELECT * FROM keys ORDER BY created_at DESC')
    const keys = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      key: row.key,
      duration: row.duration,
      purchaseDate: row.purchase_date,
      expiresAt: row.expires_at,
      claimedAt: row.claimed_at,
      canBeUsedForRegistration: row.can_be_used_for_registration,
      purchasedBy: row.purchased_by,
      hwid: row.hwid,
      stripeSessionId: row.stripe_session_id,
    }))
    console.log(`✅ [POSTGRES] Retrieved ${keys.length} keys from database`)
    return keys
  } catch (error: any) {
    console.error('❌ [POSTGRES] Error getting keys:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return []
  }
}

export async function saveKeys(keys: Key[]): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    for (const key of keys) {
      if (key.id) {
        // Update existing key
        await client.query(
          `UPDATE keys SET 
            user_id = $1, 
            duration = $2, 
            purchase_date = $3, 
            expires_at = $4, 
            claimed_at = $5, 
            can_be_used_for_registration = $6, 
            purchased_by = $7, 
            hwid = $8, 
            stripe_session_id = $9
           WHERE id = $10`,
          [
            key.userId,
            key.duration,
            key.purchaseDate,
            key.expiresAt,
            key.claimedAt,
            key.canBeUsedForRegistration,
            key.purchasedBy,
            key.hwid,
            key.stripeSessionId,
            key.id,
          ]
        )
      } else {
        // Insert new key
        await client.query(
          `INSERT INTO keys (
            user_id, key, duration, purchase_date, expires_at, 
            claimed_at, can_be_used_for_registration, purchased_by, 
            hwid, stripe_session_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            key.userId,
            key.key,
            key.duration,
            key.purchaseDate,
            key.expiresAt,
            key.claimedAt,
            key.canBeUsedForRegistration,
            key.purchasedBy,
            key.hwid,
            key.stripeSessionId,
          ]
        )
      }
    }
    
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error saving keys:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function createKey(key: Key): Promise<void> {
  try {
    console.log('📝 [POSTGRES] Creating key in database:', {
      key: key.key,
      duration: key.duration,
      userId: key.userId || null,
      claimedAt: key.claimedAt || null,
      purchaseDate: key.purchaseDate
    })
    
    // Check if key already exists
    const existingKey = await getKeyByKeyString(key.key)
    if (existingKey) {
      console.warn(`⚠️ [POSTGRES] Key ${key.key} already exists!`)
      throw new Error(`Key ${key.key} already exists`)
    }
    
    const result = await pool.query(
      `INSERT INTO keys (
        user_id, key, duration, purchase_date, expires_at, 
        claimed_at, can_be_used_for_registration, purchased_by, 
        hwid, stripe_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        key.userId || null,
        key.key,
        key.duration,
        key.purchaseDate,
        key.expiresAt || null,
        key.claimedAt || null,
        key.canBeUsedForRegistration || false,
        key.purchasedBy || null,
        key.hwid || null,
        key.stripeSessionId || null,
      ]
    )
    
    const insertedId = result.rows[0]?.id
    console.log(`✅ [POSTGRES] Key created successfully with ID: ${insertedId}`)
    
    // Verify the key was actually inserted
    const verifyKey = await getKeyByKeyString(key.key)
    if (!verifyKey) {
      console.error(`❌ [POSTGRES] Key ${key.key} was not found after insertion!`)
      throw new Error('Key was not saved correctly')
    }
    console.log(`✅ [POSTGRES] Key verified in database: ${verifyKey.key}`)
    
  } catch (error: any) {
    console.error('❌ [POSTGRES] Error creating key:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      key: key.key
    })
    throw error
  }
}

export async function updateKey(key: Key): Promise<void> {
  if (!key.id) throw new Error('Key ID is required for update')
  
  try {
    await pool.query(
      `UPDATE keys SET 
        user_id = $1, 
        duration = $2, 
        purchase_date = $3, 
        expires_at = $4, 
        claimed_at = $5, 
        can_be_used_for_registration = $6, 
        purchased_by = $7, 
        hwid = $8, 
        stripe_session_id = $9
       WHERE id = $10`,
      [
        key.userId,
        key.duration,
        key.purchaseDate,
        key.expiresAt,
        key.claimedAt,
        key.canBeUsedForRegistration,
        key.purchasedBy,
        key.hwid,
        key.stripeSessionId,
        key.id,
      ]
    )
  } catch (error) {
    console.error('Error updating key:', error)
    throw error
  }
}

export async function deleteKey(keyId: number): Promise<void> {
  try {
    await pool.query('DELETE FROM keys WHERE id = $1', [keyId])
  } catch (error) {
    console.error('Error deleting key:', error)
    throw error
  }
}

export async function getKeyByKeyString(keyString: string): Promise<Key | null> {
  try {
    const result = await pool.query('SELECT * FROM keys WHERE key = $1', [keyString])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      key: row.key,
      duration: row.duration,
      purchaseDate: row.purchase_date,
      expiresAt: row.expires_at,
      claimedAt: row.claimed_at,
      canBeUsedForRegistration: row.can_be_used_for_registration,
      purchasedBy: row.purchased_by,
      hwid: row.hwid,
      stripeSessionId: row.stripe_session_id,
    }
  } catch (error) {
    console.error('Error getting key by string:', error)
    return null
  }
}

// Fermer la connexion proprement
export async function closePool() {
  await pool.end()
}

