'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [activationKey, setActivationKey] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const { register } = useAuth()
  const router = useRouter()

  // Step 1: Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'register' })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error sending code')
        setIsLoading(false)
        return
      }

      setSuccess('📧 Code sent to ' + email)
      setStep('verify')
    } catch (err) {
      setError('Connection error')
    }

    setIsLoading(false)
  }

  // Step 2: Verify code and create account
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setIsLoading(true)

    try {
      // Verify the code
      const verifyRes = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, type: 'register' })
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        setError(verifyData.error || 'Invalid code')
        setIsLoading(false)
        return
      }

      // Code verified, create account
      const success = await register(email, password, activationKey || '')
      
      if (success) {
        router.push('/dashboard')
      } else {
        setError('Error creating account')
      }
    } catch (err) {
      setError('Connection error')
    }

    setIsLoading(false)
  }

  // Resend code
  const handleResendCode = async () => {
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'register' })
      })

      if (res.ok) {
        setSuccess('📧 New code sent!')
      } else {
        const data = await res.json()
        setError(data.error || 'Error sending code')
      }
    } catch (err) {
      setError('Connection error')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-darker via-primary-dark to-[#1a0a2e] opacity-50" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="card border-purple/40 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-300 via-pink-400 to-purple-500 bg-clip-text text-transparent">
              {step === 'form' ? 'Create Account' : 'Verification'}
            </h1>
            <p className="text-gray-400">
              {step === 'form' 
                ? 'Join our community' 
                : `Code sent to ${email}`
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4 animate-slide-up">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-4 animate-slide-up">
              {success}
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed relative group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? '⏳ Sending...' : '📧 Get Verification Code'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="input-field w-full text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  disabled={isLoading}
                  maxLength={6}
                />
                <p className="text-gray-500 text-sm mt-2 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold text-white text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed relative group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? '⏳ Verifying...' : '✅ Verify & Create Account'}
                </span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 px-4 py-3 bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-600/50 transition-all"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-600/50 transition-all disabled:opacity-50"
                >
                  🔄 Resend
                </button>
              </div>
            </form>
          )}

          <p className="text-center mt-6 text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-300 hover:text-purple-200 font-medium">
              Sign In
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-purple/20">
            <a 
              href="https://discord.gg/8x7PrHnA7z" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-6 py-3 bg-indigo-500/20 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 hover:border-indigo-500/70 transition-all duration-300 text-center font-medium flex items-center justify-center gap-2"
            >
              <span>💬</span>
              Join our Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
