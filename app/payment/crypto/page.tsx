'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

const cryptoAddresses = {
  bitcoin: 'bc1qcpnftrnfefcny4a7k2y3kwpjck9khex73ddkd4',
  solana: 'HxRkzd2G7M5BeTkRdLq19AuFTZDy785r7QFrCdLKNxu2',
  litecoin: 'ltc1q7x5r8ja3f6h7tf63t7s2mtgp8eqkwegu27zz2z'
}

const cryptoInfo = {
  bitcoin: {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    color: 'from-orange-500 to-yellow-500'
  },
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    icon: '◎',
    color: 'from-purple-500 to-pink-500'
  },
  litecoin: {
    name: 'Litecoin',
    symbol: 'LTC',
    icon: 'Ł',
    color: 'from-blue-400 to-gray-400'
  }
}

function CryptoPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(900) // 15 minutes

  const cryptoType = searchParams.get('crypto') as 'bitcoin' | 'solana' | 'litecoin' | null
  const planId = searchParams.get('plan')
  const price = searchParams.get('price')
  const currency = searchParams.get('currency')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!cryptoType || !planId || !price) {
      router.push('/shop')
      return
    }
  }, [cryptoType, planId, price, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [countdown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!cryptoType || !cryptoAddresses[cryptoType]) {
    return null
  }

  const address = cryptoAddresses[cryptoType]
  const info = cryptoInfo[cryptoType]
  const amount = price

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-primary-darker via-primary-dark to-primary-darker relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/shop" className="inline-block text-purple-300 hover:text-purple-200 mb-4 transition-colors">
            ← Back to Shop
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Crypto Payment
          </h1>
          <p className="text-gray-400">Send payment using {info.name}</p>
        </div>

        {/* Payment Card */}
        <div className="bg-gray-custom/50 backdrop-blur-sm border border-purple/20 rounded-2xl p-8 md:p-12 relative overflow-hidden group">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${info.color}`} />
          
          <div className="relative">
            {/* Crypto Header */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${info.color} mb-4 shadow-lg`}>
                <span className="text-4xl">{info.icon}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{info.name} Payment</h2>
              <p className="text-gray-400">Send exactly the amount below</p>
            </div>

            {/* Amount */}
            <div className="bg-primary-dark rounded-xl p-6 mb-6 border border-purple/20 text-center">
              <div className="text-sm text-gray-400 mb-2">Amount to Send</div>
              <div className="text-5xl font-black text-white mb-2">
                ${amount}
              </div>
              <div className="text-gray-400">
                Plan: {planId?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Send to this {info.name} address:
              </label>
              <div className="bg-primary-darker rounded-lg p-4 border border-purple/30 flex items-center gap-3">
                <code className="flex-1 text-purple-300 font-mono text-sm break-all">
                  {address}
                </code>
                <button
                  onClick={() => handleCopy(address)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    copied
                      ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                      : 'bg-purple/30 border border-purple/50 text-white hover:bg-purple/40'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Timer */}
            {countdown > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6 text-center">
                <div className="text-orange-300 font-semibold mb-1">⏰ Payment expires in</div>
                <div className="text-2xl font-bold text-orange-300 font-mono">{formatTime(countdown)}</div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-primary-dark rounded-xl p-6 border border-purple/20 mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📋</span>
                Instructions
              </h3>
              <ol className="space-y-2 text-gray-300 text-sm">
                <li className="flex gap-3">
                  <span className="text-purple-300 font-bold">1.</span>
                  <span>Copy the {info.name} address above</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-300 font-bold">2.</span>
                  <span>Open your {info.name} wallet</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-300 font-bold">3.</span>
                  <span>Send exactly <strong className="text-white">${amount}</strong> worth of {info.symbol}</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-300 font-bold">4.</span>
                  <span>Wait for confirmation (usually 5-15 minutes)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-300 font-bold">5.</span>
                  <span>Open a ticket on our website to receive your key</span>
                </li>
              </ol>
            </div>

            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-red-300 text-xl">⚠️</span>
                <div className="text-red-300 text-sm">
                  <strong>Important:</strong> Only send the exact amount shown above. Do not send more or less. 
                  Transactions cannot be reversed.
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/shop"
                className="flex-1 px-6 py-3 bg-gray-custom/50 border border-purple/20 rounded-lg text-center text-white hover:bg-gray-custom/70 transition-all"
              >
                Cancel
              </Link>
              <Link
                href="https://discord.gg/8x7PrHnA7z"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-center font-bold text-white hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
              >
                Open Ticket
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CryptoPayment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse-slow">⏳</div>
      </div>
    }>
      <CryptoPaymentContent />
    </Suspense>
  )
}

