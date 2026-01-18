'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserKey {
  key: string
  duration: string
  purchaseDate: string
  claimedAt?: string
  expiresAt?: string
  activated?: boolean
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [keys, setKeys] = useState<UserKey[]>([])
  const [claimKeyInput, setClaimKeyInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [resetPasswordCountdown, setResetPasswordCountdown] = useState(0)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [timeRemaining, setTimeRemaining] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchKeys()
      setNewEmail(user.email || '')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (resetPasswordCountdown > 0) {
      const timer = setTimeout(() => {
        setResetPasswordCountdown(resetPasswordCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resetPasswordCountdown])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Calculate time remaining for each key
  useEffect(() => {
    const updateTimeRemaining = () => {
      const newTimeRemaining: {[key: string]: string} = {}
      
      keys.forEach(key => {
        if (key.expiresAt) {
          const now = new Date()
          const expiresAt = new Date(key.expiresAt)
          const diff = expiresAt.getTime() - now.getTime()
          
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)
            
            if (days > 0) {
              newTimeRemaining[key.key] = `${days}j ${hours}h ${minutes}m`
            } else if (hours > 0) {
              newTimeRemaining[key.key] = `${hours}h ${minutes}m ${seconds}s`
            } else if (minutes > 0) {
              newTimeRemaining[key.key] = `${minutes}m ${seconds}s`
            } else {
              newTimeRemaining[key.key] = `${seconds}s`
            }
          } else {
            newTimeRemaining[key.key] = 'Expired'
          }
        } else {
          newTimeRemaining[key.key] = 'Lifetime'
        }
      })
      
      setTimeRemaining(newTimeRemaining)
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)
    return () => clearInterval(interval)
  }, [keys])

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setKeys(data.keys || [])
      }
    } catch (error) {
      console.error('Error fetching keys:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas')
      setMessageType('error')
      return
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters')
      setMessageType('error')
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword })
      })

      if (response.ok) {
        setMessage('Password changed successfully')
        setMessageType('success')
        setShowResetPassword(false)
        setNewPassword('')
        setConfirmPassword('')
        setResetPasswordCountdown(300) // 5 minutes
      } else {
        setMessage('Error changing password')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Erreur lors de la modification du mot de passe')
      setMessageType('error')
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setMessage('Please enter a valid email address')
      setMessageType('error')
      return
    }

    try {
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newEmail })
      })

      if (response.ok) {
        setMessage('Email changed successfully')
        setMessageType('success')
        setShowChangeEmail(false)
        // Update local storage
        const userData = JSON.parse(localStorage.getItem('user') || '{}')
        userData.email = newEmail
        localStorage.setItem('user', JSON.stringify(userData))
      } else {
        setMessage('Error changing email')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Erreur lors de la modification de l\'email')
      setMessageType('error')
    }
  }

  const handleReactivateKey = async (key: string) => {
    try {
      const response = await fetch('/api/keys/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ key })
      })

      if (response.ok) {
        setMessage('Key reactivated successfully. Timer has been restarted.')
        setMessageType('success')
        fetchKeys()
      } else {
        setMessage('Error reactivating key')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Erreur lors de la réactivation de la clé')
      setMessageType('error')
    }
  }

  const handleDownloadLoader = () => {
    if (keys.length === 0) {
      setMessage('You must have an active key to download the loader')
      setMessageType('error')
      return
    }

    const loaderContent = `[EpieFiveM Cheat Loader]
Version: 1.0.0
Date: ${new Date().toISOString()}

Instructions:
1. Run this file as administrator
2. Follow the on-screen instructions
3. Enter your key when prompted

Pour toute assistance, contactez le support.`

    const blob = new Blob([loaderContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'EpieFiveM_Loader.exe'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClaimKey = async (keyToClaim?: string) => {
    const key = keyToClaim || claimKeyInput.trim()
    
    if (!key) {
      setMessage('Please enter a key')
      setMessageType('error')
      return
    }

    try {
      const response = await fetch('/api/user/claim-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ key })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Key claimed successfully! Timer has started.')
        setMessageType('success')
        setClaimKeyInput('')
        fetchKeys()
      } else {
        setMessage(data.error || 'Error claiming key')
        setMessageType('error')
      }
    } catch (error) {
        setMessage('Error claiming key')
      setMessageType('error')
    }
  }

  const handleRequestKey = async () => {
    try {
      const response = await fetch('/api/user/request-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setMessage('Key request sent! A ticket will be created for you.')
        setMessageType('success')
      } else {
        setMessage('Error requesting key')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Erreur lors de la demande de clé')
      setMessageType('error')
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse-slow">⏳</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-primary-darker via-primary-dark to-primary-darker">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-5xl font-black text-center mb-4 bg-gradient-to-r from-purple-300 via-pink-400 to-purple-500 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Bienvenue, {user?.email}
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
              : 'bg-red-500/20 border border-red-500/50 text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Account Settings */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Reset Password */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-purple-300">Reset Password</h2>
            {resetPasswordCountdown > 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-2">You can change your password in:</p>
                <div className="text-3xl font-bold text-purple-300">
                  {Math.floor(resetPasswordCountdown / 60)}:{(resetPasswordCountdown % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ) : (
              <>
                {!showResetPassword ? (
                  <button
                    onClick={() => setShowResetPassword(true)}
                    className="btn-primary w-full"
                  >
                    🔐 Reset Password
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field w-full"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field w-full"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleResetPassword} className="btn-primary flex-1">
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setShowResetPassword(false)
                          setNewPassword('')
                          setConfirmPassword('')
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Change Email */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-purple-300">Change Email</h2>
            {!showChangeEmail ? (
              <div>
                <p className="text-gray-400 mb-4">Current: {user?.email}</p>
                <button
                  onClick={() => setShowChangeEmail(true)}
                  className="btn-primary w-full"
                >
                  ✉️ Change Email
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="input-field w-full"
                    placeholder="new@email.com"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleChangeEmail} className="btn-primary flex-1">
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowChangeEmail(false)
                      setNewEmail(user?.email || '')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download Loader Section */}
        {keys.length > 0 && (
          <div className="card mb-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="text-6xl mb-4 animate-bounce">⬇️</div>
            <h2 className="text-2xl font-bold mb-4 text-purple-300">Download Loader</h2>
            <p className="text-gray-400 mb-6">
              Download the loader to use your key
            </p>
            <button
              onClick={handleDownloadLoader}
              className="btn-primary text-lg px-8 hover:scale-110 transition-transform"
            >
              📥 Download EpieFiveM Loader
            </button>
          </div>
        )}

        {/* Redem Key Section */}
        {keys.length === 0 && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4 text-purple-300">Redem key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Enter your key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={claimKeyInput}
                    onChange={(e) => {
                      // Allow the new format: Epie1d-XXXX-XXXX (up to 19 chars with dashes)
                      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                      // Don't reformat, just allow the format as-is
                      if (value.length > 19) value = value.substring(0, 19)
                      setClaimKeyInput(value)
                    }}
                    className="input-field flex-1 font-mono text-center tracking-widest"
                    placeholder="Epie1d-XXXX-XXXX"
                    maxLength={19}
                  />
                  <button
                    onClick={() => handleClaimKey()}
                    className="btn-primary px-6"
                  >
                    Redem
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Enter the key you received after your purchase
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Keys Section */}
        <div className="card">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">My Keys</h2>
          
          {keys.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔑</div>
              <p className="text-gray-400 mb-4">You have no active keys</p>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((userKey, index) => {
                const remaining = timeRemaining[userKey.key] || 'Calculating...'
                const isExpired = remaining === 'Expired'
                const isLifetime = remaining === 'Lifetime'

                return (
                  <div
                    key={index}
                    className="bg-primary-dark p-6 rounded-lg border border-purple/30 hover:border-purple/50 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-purple-300">
                            Key {userKey.duration}
                          </h3>
                          {isExpired && (
                            <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-300 rounded text-xs">
                              ⏰ Expired
                            </span>
                          )}
                          {isLifetime && (
                            <span className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-300 rounded text-xs">
                              ♾️ Lifetime
                            </span>
                          )}
                        </div>
                        
                        {/* Time Remaining Counter */}
                        {!isLifetime && (
                          <div className="mb-3">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                              isExpired 
                                ? 'bg-red-500/20 border border-red-500/50' 
                                : 'bg-purple-500/20 border border-purple-500/50'
                            }`}>
                              <span className="text-sm text-gray-400">Time remaining:</span>
                              <span className={`text-lg font-bold font-mono ${
                                isExpired ? 'text-red-300' : 'text-purple-300'
                              }`}>
                                {remaining}
                              </span>
                            </div>
                          </div>
                        )}

                        {userKey.claimedAt && (
                          <p className="text-gray-400 text-sm">
                            Claimed: {new Date(userKey.claimedAt).toLocaleDateString('fr-FR')} à {new Date(userKey.claimedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        {userKey.expiresAt && !isExpired && (
                          <p className="text-gray-400 text-sm">
                            Expires: {new Date(userKey.expiresAt).toLocaleDateString('fr-FR')} à {new Date(userKey.expiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  <div className="bg-gray-custom p-4 rounded-lg mb-4">
                    <label className="block text-sm font-medium mb-2 text-gray-400">
                      Your Key:
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-primary-darker p-3 rounded text-purple-300 font-mono break-all">
                        {userKey.key}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(userKey.key)
                          setMessage('Key copied to clipboard!')
                          setMessageType('success')
                        }}
                        className="btn-secondary px-4 py-2 text-sm hover:scale-105 transition-transform"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}