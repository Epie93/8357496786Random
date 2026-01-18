// Script d'initialisation de la base de données
// Appelé au démarrage de l'application si DATABASE_URL est défini

import { initDatabase } from './db-postgres'

let dbInitialized = false

export async function ensureDatabaseInitialized() {
  if (!process.env.DATABASE_URL) {
    console.log('📁 Mode fichiers JSON (développement local)')
    return
  }

  if (dbInitialized) {
    return
  }

  try {
    await initDatabase()
    dbInitialized = true
    console.log('✅ Base de données PostgreSQL initialisée')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error)
    // Ne pas bloquer le démarrage, mais logger l'erreur
  }
}

// Initialiser au chargement du module
if (process.env.DATABASE_URL) {
  ensureDatabaseInitialized().catch(console.error)
}

