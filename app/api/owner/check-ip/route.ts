import { NextRequest, NextResponse } from 'next/server'

// IP autorisée pour la page owner - SEULEMENT cette IP
const ALLOWED_IP = '83.78.15.204'

// Mettre sur true pour permettre l'accès en localhost (pour les tests)
// En production (Render), seule l'IP autorisée aura accès
const ALLOW_LOCALHOST = true

export async function GET(request: NextRequest) {
  // Récupérer l'IP du client depuis plusieurs headers possibles
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
  const trueClientIp = request.headers.get('true-client-ip') // Akamai/Cloudflare
  
  // Priorité: CF > True-Client > X-Real-IP > X-Forwarded-For
  const clientIp = cfConnectingIp || trueClientIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown'
  
  // Vérifier si l'IP est autorisée
  const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost'
  const isAllowed = clientIp === ALLOWED_IP || (ALLOW_LOCALHOST && isLocalhost)
  
  // Ne pas logger l'IP autorisée pour la sécurité
  
  return NextResponse.json({
    allowed: isAllowed,
    ip: clientIp
  })
}
