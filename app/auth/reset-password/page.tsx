'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'verify' | 'newPassword' | 'done'>('email')
  const router = useRouter()

  // Étape 1 : Envoyer le code de vérification
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !email.includes('@')) {
      setError('Veuillez entrer un email valide')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'reset-password' })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'envoi du code')
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

  // Étape 2 : Vérifier le code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, type: 'reset-password' })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Code invalide')
        setIsLoading(false)
        return
      }

      setSuccess('✅ Code vérifié !')
      setStep('newPassword')
    } catch (err) {
      setError('Erreur de connexion')
    }

    setIsLoading(false)
  }

  // Étape 3 : Changer le mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, code: verificationCode })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors du changement de mot de passe')
        setIsLoading(false)
        return
      }

      setStep('done')
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
        body: JSON.stringify({ email, type: 'reset-password' })
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
          {step === 'done' ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-green-400 mb-4">
                Mot de passe modifié !
              </h1>
              <p className="text-gray-400 mb-6">
                Ton mot de passe a été changé avec succès.
              </p>
              <Link 
                href="/auth/login"
                className="btn-primary inline-block"
              >
                Se connecter →
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                {step === 'email' && 'Mot de passe oublié'}
                {step === 'verify' && 'Vérification'}
                {step === 'newPassword' && 'Nouveau mot de passe'}
              </h1>
              <p className="text-center text-gray-400 mb-8">
                {step === 'email' && 'Entre ton email pour recevoir un code'}
                {step === 'verify' && `Code envoyé à ${email}`}
                {step === 'newPassword' && 'Choisis ton nouveau mot de passe'}
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

              {step === 'email' && (
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isLoading ? '⏳ Envoi...' : '📧 Envoyer le code'}
                  </button>
                </form>
              )}

              {step === 'verify' && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Code de vérification</label>
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
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold text-white disabled:opacity-50"
                  >
                    {isLoading ? '⏳ Vérification...' : '✅ Vérifier le code'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="flex-1 px-4 py-3 bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-600/50"
                    >
                      ← Retour
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-600/50 disabled:opacity-50"
                    >
                      🔄 Renvoyer
                    </button>
                  </div>
                </form>
              )}

              {step === 'newPassword' && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="input-field w-full"
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
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
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isLoading ? '⏳ Changement...' : '🔐 Changer le mot de passe'}
                  </button>
                </form>
              )}

              <p className="text-center mt-6 text-gray-400">
                <Link href="/auth/login" className="text-purple-300 hover:text-purple-200">
                  ← Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
