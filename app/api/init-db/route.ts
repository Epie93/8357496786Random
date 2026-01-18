// Route d'initialisation de la base de données
// Appelée automatiquement au premier démarrage

import { NextResponse } from 'next/server'
import { initDatabase } from '@/lib/db-postgres'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ 
      message: 'Mode fichiers JSON (développement local)',
      database: false 
    })
  }

  try {
    await initDatabase()
    return NextResponse.json({ 
      message: 'Base de données initialisée avec succès',
      database: true 
    })
  } catch (error: any) {
    console.error('Erreur initialisation DB:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'initialisation',
        message: error.message,
        database: true 
      },
      { status: 500 }
    )
  }
}

