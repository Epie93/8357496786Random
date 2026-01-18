import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Log la requête (seulement pour les pages principales, pas les assets)
  const path = request.nextUrl.pathname
  
  // Ignorer les fichiers statiques et les API internes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.includes('.') ||
    path.startsWith('/api/owner')
  ) {
    return response
  }

  // Récupérer l'IP du client
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
  
  // Envoyer le log de manière asynchrone (ne pas bloquer la requête)
  const logData = {
    path,
    method: request.method,
    ip: clientIp,
    userAgent: request.headers.get('user-agent') || 'N/A',
    timestamp: new Date().toISOString()
  }

  // Logger en arrière-plan via edge runtime fetch
  try {
    const baseUrl = request.nextUrl.origin
    fetch(`${baseUrl}/api/owner/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {})
  } catch {
    // Ignorer les erreurs de log
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
