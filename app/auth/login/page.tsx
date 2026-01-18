'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'verify'>('credentials')
  const { login } = useAuth()
  const router = useRouter()

  // Étape 1 : Vérifier les identifiants et envoyer le code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // D'abord vérifier que les identifiants sont corrects
      const checkRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, checkOnly: true })
      })

      const checkData = await checkRes.json()

      if (!checkRes.ok) {
        setError(checkData.error || 'Email ou mot de passe incorrect')
        setIsLoading(false)
        return
      }

      // Identifiants corrects, envoyer le code
      const codeRes = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'login' })
      })

      const codeData = await codeRes.json()

      if (!codeRes.ok) {
        setError(codeData.error || 'Erreur lors de l\'envoi du code')
        setIsLoading(false)
        return
      }

      setSuccess('📧 Code envoyé à ' + email)
      setStep('verify')
    } catch (err) {
      setError('Erreur de connexion')
    }

    setIsLoading(false)
  }

  // Étape 2 : Vérifier le code et connecter
  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres')
      return
    }

    setIsLoading(true)

    try {
      // Vérifier le code
      const verifyRes = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, type: 'login' })
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        setError(verifyData.error || 'Code invalide')
        setIsLoading(false)
        return
      }

      // Code vérifié, connecter l'utilisateur
      const success = await login(email, password)
      
      if (success) {
        router.push('/dashboard')
      } else {
        setError('Erreur lors de la connexion')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }

    setIsLoading(false)
  }

  // Renvoyer le code
  const handleResendCode = async () => {
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'login' })
      })

      if (res.ok) {
        setSuccess('📧 Nouveau code envoyé !')
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="card">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
            {step === 'credentials' ? 'Connexion' : 'Vérification'}
          </h1>
          <p className="text-center text-gray-400 mb-8">
            {step === 'credentials' 
              ? 'Connecte-toi à ton compte' 
              : `Code envoyé à ${email}`
            }
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder="ton@email.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe</label>
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

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Vérification...' : '🔐 Se connecter'}
              </button>

              <div className="text-center">
                <Link 
                  href="/auth/reset-password" 
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Code de vérification</label>
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
                  Entre le code à 6 chiffres reçu par email
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold text-white text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Connexion...' : '✅ Vérifier et se connecter'}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials')
                    setVerificationCode('')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-600/50 transition-all"
                >
                  ← Retour
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-600/50 transition-all disabled:opacity-50"
                >
                  🔄 Renvoyer
                </button>
              </div>
            </form>
          )}

          <p className="text-center mt-6 text-gray-400">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-purple-300 hover:text-purple-200">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
