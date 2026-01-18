'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const automaticFeedbacks = [
  { id: 1, rating: 5, username: "Fundz", date: "8d ago" },
  { id: 2, rating: 5, username: "NAKTORツ", date: "30d ago" },
  { id: 3, rating: 5, username: "Nullexツ", date: "15d ago" },
  { id: 4, rating: 5, username: "Razzer", date: "22d ago" },
  { id: 5, rating: 5, username: "Shadow", date: "45d ago" },
  { id: 6, rating: 5, username: "Swimz", date: "12d ago" },
  { id: 7, rating: 5, username: "Pleptoz", date: "30d ago" },
  { id: 8, rating: 5, username: "Nullix", date: "5d ago" },
  { id: 9, rating: 5, username: "Vogue", date: "18d ago" },
]

export default function Home() {
  const [gradientPosition, setGradientPosition] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPosition(prev => (prev + 1) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Top Scrolling Banner */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white py-2.5 overflow-hidden" style={{ zIndex: 9999 }}>
        <div className="flex gap-12 animate-scroll-banner whitespace-nowrap">
          <div className="flex items-center gap-2 px-4">
            <span className="text-lg">💬</span>
            <span className="font-semibold">24/7 Support</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <span className="text-lg">⚡</span>
            <span className="font-semibold">Fast Delivery</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <span className="text-lg">🔒</span>
            <span className="font-semibold">100% Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm opacity-80">💳 Visa • Mastercard • Amex</span>
          </div>
          <div className="flex items-center gap-1 px-4 text-sm opacity-80">
            <span>Powered by</span>
            <span className="font-bold">Stripe</span>
          </div>
          {/* Duplicate for seamless loop */}
          <div className="flex items-center gap-2 px-4">
            <span className="text-lg">💬</span>
            <span className="font-semibold">24/7 Support</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <span className="text-lg">⚡</span>
            <span className="font-semibold">Fast Delivery</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <span className="text-lg">🔒</span>
            <span className="font-semibold">100% Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm opacity-80">💳 Visa • Mastercard • Amex</span>
          </div>
          <div className="flex items-center gap-1 px-4 text-sm opacity-80">
            <span>Powered by</span>
            <span className="font-bold">Stripe</span>
          </div>
          {/* Triple duplicate for wider screens */}
          <div className="flex items-center gap-2 px-4">
            <span className="text-lg">💬</span>
            <span className="font-semibold">24/7 Support</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <span className="text-lg">⚡</span>
            <span className="font-semibold">Fast Delivery</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <span className="text-lg">🔒</span>
            <span className="font-semibold">100% Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm opacity-80">💳 Visa • Mastercard • Amex</span>
          </div>
          <div className="flex items-center gap-1 px-4 text-sm opacity-80">
            <span>Powered by</span>
            <span className="font-bold">Stripe</span>
          </div>
        </div>
      </div>

      {/* Animated Background with Grid */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-darker via-primary-dark to-[#1a0a2e]" style={{ zIndex: 0, marginTop: '40px' }}>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(${gradientPosition}deg, rgba(147, 51, 234, 0.1) 0%, rgba(124, 58, 237, 0.1) 50%, rgba(109, 40, 217, 0.1) 100%)`,
            backgroundSize: '200% 200%',
            animation: 'gradientShift 15s ease infinite'
          }}
        />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23933aea' fillOpacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple/10 animate-float"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: (Math.random() * 10 + 15) + 's'
            }}
          />
        ))}
      </div>

      {/* Subtle glow effects */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 md:py-32" style={{ zIndex: 10 }}>
        <div className="max-w-6xl mx-auto">
          {/* Community Banner */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-slide-up">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-primary-darker animate-pulse-slow shadow-lg shadow-purple-500/50"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <a 
              href="https://discord.gg/8x7PrHnA7z" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm hover:bg-red-500/30 transition-colors cursor-pointer flex items-center gap-2 hover:scale-105"
            >
              <span>💬</span>
              Join our community
            </a>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
              <span className="text-white drop-shadow-2xl">Dominate every server.</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-gradient drop-shadow-2xl">
                Stay undetected.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
              Private, performance-focused cheat with frequent updates and strong anti-detection.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-slide-up animation-delay-400">
            <Link 
              href="/shop"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                Get access now <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>
            <Link 
              href="/shop"
              className="px-8 py-4 bg-gray-custom/50 border border-purple/30 rounded-lg font-semibold text-white text-lg hover:bg-gray-custom/70 hover:border-purple/50 transition-all duration-300 hover:scale-105"
            >
              View Prices
            </Link>
          </div>

          {/* Automatic Feedback Section */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
              Automatic Feedback
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {automaticFeedbacks.map((feedback, index) => (
                <div
                  key={feedback.id}
                  className="card hover:border-purple/80 group animate-slide-up relative overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-colors" />
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {feedback.username.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-semibold text-sm">{feedback.username}</span>
                            <span className="text-green-400 text-xs">✓</span>
                          </div>
                          <span className="text-gray-500 text-xs">{feedback.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(feedback.rating)].map((_, i) => (
                        <span
                          key={i}
                          className="text-yellow-400 text-lg animate-pulse-slow"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            <div className="card text-center group hover:scale-105 transition-transform duration-300 animate-slide-up animation-delay-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
                <h3 className="text-2xl font-bold mb-3 text-purple-300">Performance</h3>
                <p className="text-gray-400">
                  Advanced cheat built for maximum performance
                </p>
              </div>
            </div>
            <div className="card text-center group hover:scale-105 transition-transform duration-300 animate-slide-up animation-delay-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔒</div>
                <h3 className="text-2xl font-bold mb-3 text-purple-300">Undetected</h3>
                <p className="text-gray-400">
                  Full protection with frequent updates
                </p>
              </div>
            </div>
            <div className="card text-center group hover:scale-105 transition-transform duration-300 animate-slide-up animation-delay-1000 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🚀</div>
                <h3 className="text-2xl font-bold mb-3 text-purple-300">Fast Setup</h3>
                <p className="text-gray-400">
                  Simple installation and instant setup
                </p>
              </div>
            </div>
          </div>

          {/* Cheat Features Section */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
              Powerful Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <div className="card text-center group hover:scale-105 transition-transform duration-300 animate-slide-up relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">👻</div>
                  <h3 className="text-2xl font-bold mb-3 text-purple-300">Noclip</h3>
                  <p className="text-gray-400">
                    Walk through walls and obstacles
                  </p>
                </div>
              </div>
              <div className="card text-center group hover:scale-105 transition-transform duration-300 animate-slide-up relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🛡️</div>
                  <h3 className="text-2xl font-bold mb-3 text-purple-300">Godmode</h3>
                  <p className="text-gray-400">
                    Become invincible to all damage
                  </p>
                </div>
              </div>
              <div className="card text-center group hover:scale-105 transition-transform duration-300 animate-slide-up relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">✨</div>
                  <h3 className="text-2xl font-bold mb-3 text-purple-300">MagicBullet</h3>
                  <p className="text-gray-400">
                    Perfect accuracy with auto-aim
                  </p>
                </div>
              </div>
              <div className="card text-center group hover:scale-105 transition-transform duration-300 animate-slide-up relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎯</div>
                  <h3 className="text-2xl font-bold mb-3 text-purple-300">Triggerbot</h3>
                  <p className="text-gray-400">
                    Automatic shooting when target is in crosshair
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}