'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import Logo from './Logo'

export default function Navbar() {
  const { itemCount } = useCart()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-gray-custom/50 backdrop-blur-xl border-b border-purple/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Fast Delivery, 24/7 Support & Secure Payment Badges */}
          <div className="hidden lg:flex items-center gap-3 ml-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-sm">
              <span className="text-lg">⚡</span>
              <span className="font-semibold text-purple-300">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-sm">
              <span className="text-lg">🎧</span>
              <span className="font-semibold text-purple-300">24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-sm">
              <span className="text-lg">🔒</span>
              <span className="font-semibold text-purple-300">Secure Payment</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="hover:text-purple-300 transition-colors font-medium">
              Home
            </Link>
            <Link href="/shop" className="hover:text-purple-300 transition-colors font-medium">
              Prices
            </Link>
            
            {user ? (
              <>
                <Link href="/dashboard" className="hover:text-purple-300 transition-colors font-medium">
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="px-4 py-2 bg-gray-custom/50 border border-purple/30 rounded-lg hover:bg-gray-custom/70 hover:border-purple/50 transition-all duration-300 text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-purple-300 transition-colors font-medium">
                  Login
                </Link>
                <Link 
                  href="/auth/register" 
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 text-sm"
                >
                  Get Started →
                </Link>
              </>
            )}

            <a 
              href="https://discord.gg/8x7PrHnA7z" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 hover:border-indigo-500/70 transition-all duration-300 text-sm font-medium flex items-center gap-2"
              title="Join our Discord"
            >
              <span>💬</span>
              Discord
            </a>

            <Link href="/cart" className="relative">
              <span className="text-2xl hover:scale-110 transition-transform duration-300">🛒</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse-slow">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white hover:text-purple-300 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 animate-slide-up border-t border-purple/20">
            <Link href="/" className="block hover:text-purple-300 transition-colors font-medium">Home</Link>
            <Link href="/shop" className="block hover:text-purple-300 transition-colors font-medium">Prices</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block hover:text-purple-300 transition-colors font-medium">Dashboard</Link>
                <button onClick={logout} className="btn-secondary w-full">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block hover:text-purple-300 transition-colors font-medium">Login</Link>
                <Link href="/auth/register" className="btn-primary block text-center w-full">Get Started →</Link>
              </>
            )}
            <a 
              href="https://discord.gg/8x7PrHnA7z" 
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 bg-indigo-500/20 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 transition-all text-center font-medium"
            >
              💬 Join Discord
            </a>
            <Link href="/cart" className="block">
              Cart ({itemCount})
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}