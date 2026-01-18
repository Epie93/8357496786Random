'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const plans = [
  { id: '1-day', label: '1 Day', price: 4, currency: 'USD' },
  { id: '1-week', label: '1 Week', price: 9, currency: 'USD' },
  { id: '1-month', label: '1 Month', price: 17, currency: 'USD' },
  { id: 'lifetime', label: 'Lifetime', price: 30, currency: 'USD' }
]

export default function Shop() {
  const { addItem } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState('1-month')
  const [selectedPlatform, setSelectedPlatform] = useState('windows')
  const [email, setEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'crypto' | null>(null)
  const [showCryptoModal, setShowCryptoModal] = useState(false)
  const [imageError, setImageError] = useState(false)

  const selectedPlanData = plans.find(p => p.id === selectedPlan) || plans[2]

  const handlePurchase = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!email) {
      alert('Please enter your email address')
      return
    }

    if (selectedPaymentMethod === 'crypto') {
      setShowCryptoModal(true)
      return
    }

    if (selectedPaymentMethod === 'card') {
      // Rediriger directement vers Stripe Checkout
      try {
        const response = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            planId: selectedPlan,
            email: email
          })
        })

        const data = await response.json()

        if (response.ok && data.url) {
          // Rediriger vers Stripe Checkout
          window.location.href = data.url
        } else {
          alert(data.error || 'Erreur lors de la création de la session de paiement')
        }
      } catch (error) {
        console.error('Checkout error:', error)
        alert('Error processing. Please try again.')
      }
      return
    }

    // Fallback vers le panier si aucune méthode de paiement n'est sélectionnée
    const cartItem = {
      id: selectedPlan,
      name: `EpieFiveM ${selectedPlanData.label}`,
      duration: selectedPlanData.label,
      price: selectedPlanData.price,
      currency: selectedPlanData.currency
    }

    addItem(cartItem)
    router.push('/cart')
  }

  const handleCryptoSelection = (crypto: 'bitcoin' | 'solana' | 'litecoin') => {
    const planId = selectedPlan
    const planPrice = selectedPlanData.price
    const planCurrency = selectedPlanData.currency
    
    // Rediriger vers la page de paiement crypto
    router.push(`/payment/crypto?crypto=${crypto}&plan=${planId}&price=${planPrice}&currency=${planCurrency}&email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-b from-primary-darker via-primary-dark to-primary-darker relative overflow-hidden">
      {/* Subtle animated background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-purple-300 transition-colors">Home</Link> / <Link href="/shop" className="hover:text-purple-300 transition-colors">Catalog</Link> / EpieFiveM {selectedPlanData.label}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Product Info */}
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              EpieFiveM {selectedPlanData.label}
            </h1>
            <p className="text-gray-400 text-lg mb-6">
              Advanced toolkit with stable performance, clean UX, and effortless setup.
            </p>

            {/* Reviews & Stats */}
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl animate-pulse-slow" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
                  ))}
                </div>
                <span className="text-white font-semibold">4.9 (80 reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="font-bold text-purple-300">125+</span>
                <span>users</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span>🔒</span>
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span>🕐</span>
                <span>Updated {new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            {/* Logo Product Visual - Replacing the chart */}
            <div className="bg-gray-custom/50 backdrop-blur-sm border border-purple/20 rounded-xl p-8 mb-8 relative overflow-hidden group">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Updated date */}
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <span>🕐</span>
                  <span>Updated {new Date().toISOString().split('T')[0]}</span>
                </div>

                {/* Product Visual - Product Image */}
                <div className="flex justify-center items-center my-8">
                  <div className="relative group/image w-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg blur-xl opacity-50 animate-pulse-slow" />
                    <div className="relative transition-all duration-500 hover:scale-105 flex justify-center">
                      {!imageError ? (
                        <img
                          src="/epiefivem-product-box.png"
                          alt="EpieFiveM FiveM Menu Product Box"
                          className="rounded-lg shadow-2xl object-contain w-full max-w-full h-auto"
                          style={{ maxHeight: '600px' }}
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="w-full max-w-[600px] aspect-[3/4] rounded-lg shadow-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex flex-col items-center justify-center p-8 border-2 border-purple-400">
                          <div className="text-center">
                            <div className="text-6xl mb-4">📦</div>
                            <div className="text-3xl font-black text-white mb-2">EPIEFIVEM</div>
                            <div className="text-lg text-white/80 mb-4">FiveM Menu</div>
                            <div className="text-sm text-white/60 mt-4 p-4 bg-black/30 rounded">
                              Placez votre image produit dans:<br />
                              <code className="text-purple-300">public/epiefivem-product-box.png</code>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User count below logo */}
                <div className="text-center mt-6">
                  <div className="text-3xl font-black text-purple-300 mb-1">125+</div>
                  <div className="text-gray-400 text-sm">active users</div>
                </div>
              </div>
            </div>

            {/* Why you'll love it */}
            <div className="bg-gray-custom/50 backdrop-blur-sm border border-purple/20 rounded-xl p-6 relative overflow-hidden group mb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">✅</span>
                  <h3 className="text-xl font-bold text-white">Why you'll love it</h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2 group/item hover:text-white transition-colors">
                    <span className="text-purple-400 mt-1 group-hover/item:scale-125 transition-transform">•</span>
                    <span>Advanced performance cheat</span>
                  </li>
                  <li className="flex items-start gap-2 group/item hover:text-white transition-colors">
                    <span className="text-purple-400 mt-1 group-hover/item:scale-125 transition-transform">•</span>
                    <span>Undetected by anti-cheat systems</span>
                  </li>
                  <li className="flex items-start gap-2 group/item hover:text-white transition-colors">
                    <span className="text-purple-400 mt-1 group-hover/item:scale-125 transition-transform">•</span>
                    <span>Regular updates and support</span>
                  </li>
                  <li className="flex items-start gap-2 group/item hover:text-white transition-colors">
                    <span className="text-purple-400 mt-1 group-hover/item:scale-125 transition-transform">•</span>
                    <span>Easy setup and configuration</span>
                  </li>
                  <li className="flex items-start gap-2 group/item hover:text-white transition-colors">
                    <span className="text-purple-400 mt-1 group-hover/item:scale-125 transition-transform">•</span>
                    <span>Clean and intuitive interface</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Features Grid */}
            <div className="bg-gray-custom/50 backdrop-blur-sm border border-purple/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -ml-16 -mb-16" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">⚡</span>
                  <h3 className="text-xl font-bold text-white">Features Included</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Godmode', icon: '🛡️', desc: 'Invincibility' },
                    { name: 'Silent Aim', icon: '🎯', desc: 'Hidden aimbot' },
                    { name: 'Magic Bullet', icon: '💫', desc: 'Instant hit' },
                    { name: 'Streamproof', icon: '📺', desc: 'OBS safe' },
                    { name: 'ESP', icon: '👁️', desc: 'See players' },
                    { name: 'Aimbot', icon: '🔫', desc: 'Auto aim' },
                    { name: 'Triggerbot', icon: '⚡', desc: 'Auto shoot' },
                    { name: 'Give Weapon', icon: '🗡️', desc: 'Spawn guns' },
                    { name: 'Run Speed', icon: '🏃', desc: 'Speed boost' },
                    { name: 'Car Modifier', icon: '🚗', desc: 'Vehicle mods' },
                    { name: 'Noclip', icon: '🦅', desc: 'Fly mode' },
                  ].map((feature, index) => (
                    <div
                      key={feature.name}
                      className="bg-primary-darker/50 border border-purple/20 rounded-lg p-3 hover:border-purple/50 hover:bg-purple/10 transition-all duration-300 group/feature cursor-default"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg group-hover/feature:scale-125 transition-transform">{feature.icon}</span>
                        <span className="font-semibold text-white text-sm">{feature.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 group-hover/feature:text-gray-400 transition-colors">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Options */}
          <div>
            <div className="bg-gray-custom/50 backdrop-blur-sm border border-purple/20 rounded-xl p-8 sticky top-24 relative overflow-hidden group">
              {/* Subtle glow effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                {/* Price */}
                <div className="mb-8">
                  <div className="text-5xl font-black text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    ${selectedPlanData.price}
                  </div>
                  <div className="text-sm text-gray-400">One-time payment</div>
                </div>

                {/* Choose Plan */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Choose Plan</label>
                  <div className="grid grid-cols-2 gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300 relative overflow-hidden group/plan ${
                          selectedPlan === plan.id
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                            : 'bg-gray-custom/50 border border-purple/20 text-gray-300 hover:border-purple/40 hover:bg-gray-custom/70'
                        }`}
                      >
                        {selectedPlan === plan.id && (
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover/plan:opacity-100 transition-opacity" />
                        )}
                        <span className="relative z-10">{plan.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compatible Platforms */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Compatible Platforms</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedPlatform('windows')}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                        selectedPlatform === 'windows'
                          ? 'bg-purple/30 border-2 border-purple text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gray-custom/50 border border-purple/20 text-gray-300 hover:border-purple/40'
                      }`}
                    >
                      Windows 10/11
                    </button>
                    <button
                      onClick={() => setSelectedPlatform('amd-intel')}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                        selectedPlatform === 'amd-intel'
                          ? 'bg-purple/30 border-2 border-purple text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gray-custom/50 border border-purple/20 text-gray-300 hover:border-purple/40'
                      }`}
                    >
                      AMD & Intel
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-gray-custom/50 border border-purple/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/50 transition-all hover:border-purple/50"
                  />
                </div>

                {/* Coupon Code */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Coupon Code</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full bg-gray-custom/50 border border-purple/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/50 transition-all hover:border-purple/50"
                  />
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Payment Method</label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setSelectedPaymentMethod('card')}
                      className={`flex-1 border rounded-lg px-4 py-3 transition-all ${
                        selectedPaymentMethod === 'card'
                          ? 'bg-purple/30 border-purple text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gray-custom/50 border-purple/20 text-gray-300 hover:border-purple/40 hover:bg-gray-custom/70'
                      }`}
                    >
                      💳 Card
                    </button>
                    <button 
                      onClick={() => setSelectedPaymentMethod('crypto')}
                      className={`flex-1 border rounded-lg px-4 py-3 transition-all ${
                        selectedPaymentMethod === 'crypto'
                          ? 'bg-purple/30 border-purple text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gray-custom/50 border-purple/20 text-gray-300 hover:border-purple/40 hover:bg-gray-custom/70'
                      }`}
                    >
                      💰 Crypto
                    </button>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white text-lg hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 relative overflow-hidden group/purchase"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover/purchase:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Purchase Now
                    <span className="group-hover/purchase:translate-x-1 transition-transform">→</span>
                  </span>
                </button>

                {!user && (
                  <p className="text-sm text-gray-400 text-center mt-4">
                    <Link href="/auth/login" className="text-purple-300 hover:text-purple-200">Sign in</Link> or <Link href="/auth/register" className="text-purple-300 hover:text-purple-200">create an account</Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crypto Selection Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCryptoModal(false)}>
          <div 
            className="bg-gradient-to-br from-primary-dark via-primary-dark to-primary-darker border border-purple/30 rounded-2xl p-8 max-w-md w-full relative overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600" />
            
            <div className="relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Choose Cryptocurrency</h2>
                <button
                  onClick={() => setShowCryptoModal(false)}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleCryptoSelection('bitcoin')}
                  className="w-full bg-gray-custom/50 border border-purple/20 rounded-lg px-6 py-4 text-left hover:border-purple/50 hover:bg-gray-custom/70 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">₿</div>
                    <div className="flex-1">
                      <div className="font-bold text-white group-hover:text-purple-300 transition-colors">Bitcoin</div>
                      <div className="text-sm text-gray-400">BTC</div>
                    </div>
                    <span className="text-purple-300 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>

                <button
                  onClick={() => handleCryptoSelection('solana')}
                  className="w-full bg-gray-custom/50 border border-purple/20 rounded-lg px-6 py-4 text-left hover:border-purple/50 hover:bg-gray-custom/70 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">◎</div>
                    <div className="flex-1">
                      <div className="font-bold text-white group-hover:text-purple-300 transition-colors">Solana</div>
                      <div className="text-sm text-gray-400">SOL</div>
                    </div>
                    <span className="text-purple-300 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>

                <button
                  onClick={() => handleCryptoSelection('litecoin')}
                  className="w-full bg-gray-custom/50 border border-purple/20 rounded-lg px-6 py-4 text-left hover:border-purple/50 hover:bg-gray-custom/70 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">Ł</div>
                    <div className="flex-1">
                      <div className="font-bold text-white group-hover:text-purple-300 transition-colors">Litecoin</div>
                      <div className="text-sm text-gray-400">LTC</div>
                    </div>
                    <span className="text-purple-300 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}