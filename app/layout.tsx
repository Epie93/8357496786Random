import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import SnowEffect from '@/components/SnowEffect'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'Epie FiveM - Official Store',
  description: 'FiveM cheat software - Buy your keys now',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ position: 'relative' }}>
        <SnowEffect />
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="min-h-screen relative" style={{ zIndex: 10, position: 'relative' }}>
              {children}
            </main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
