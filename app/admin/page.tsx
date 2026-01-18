'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  createdAt: string
  banned?: boolean
}

interface Key {
  userId?: string
  key: string
  duration: string
  purchaseDate: string
  expiresAt?: string
  hwid?: string
  claimedAt?: string
}

export default function Admin() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [users, setUsers] = useState<User[]>([])
  const [keys, setKeys] = useState<Key[]>([])
  const [selectedDuration, setSelectedDuration] = useState('1 mois')
  const [keyCount, setKeyCount] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'used'>('all')
  const [filterDuration, setFilterDuration] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'keys' | 'users'>('keys')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
      const interval = setInterval(fetchData, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        setError('Invalid credentials')
      }
    } catch (error) {
      setError('Connection error')
    }
  }

  const fetchData = async () => {
    try {
      console.log('🔄 [FRONTEND] Fetching data...')
      const [usersRes, keysRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/keys')
      ])
      
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        console.log('✅ [FRONTEND] Fetched users:', usersData.users?.length || 0)
        setUsers(usersData.users || [])
      } else {
        console.error('❌ [FRONTEND] Failed to fetch users:', usersRes.status)
      }
      
      if (keysRes.ok) {
        const keysData = await keysRes.json()
        const fetchedKeys = keysData.keys || []
        console.log('✅ [FRONTEND] Fetched keys:', fetchedKeys.length)
        console.log('📊 [FRONTEND] Keys data:', fetchedKeys)
        
        // Merge with existing keys to avoid losing newly added ones
        setKeys(prevKeys => {
          const existingKeyStrings = prevKeys.map(k => k.key)
          const newKeysFromServer = fetchedKeys.filter((k: Key) => !existingKeyStrings.includes(k.key))
          const merged = [...prevKeys, ...newKeysFromServer]
          
          // Also update existing keys with server data
          const updated = merged.map(key => {
            const serverKey = fetchedKeys.find((k: Key) => k.key === key.key)
            return serverKey || key
          })
          
          console.log(`✅ [FRONTEND] State merged: ${prevKeys.length} -> ${updated.length} keys`)
          return updated
        })
      } else {
        const errorData = await keysRes.json().catch(() => ({}))
        console.error('❌ [FRONTEND] Failed to fetch keys:', keysRes.status, errorData)
      }
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error fetching data:', error)
      console.error('Error details:', error.message, error.stack)
    }
  }

  const generateKeys = async () => {
    setIsGenerating(true)
    setSuccess('')
    setError('')
    
    try {
      console.log('🚀 Starting key generation...', { count: keyCount, duration: selectedDuration })
      
      const response = await fetch('/api/admin/generate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: keyCount, duration: selectedDuration })
      })

      const data = await response.json()
      console.log('📦 Generate keys response:', data)

      if (response.ok && data.keys && data.keys.length > 0) {
        console.log(`✅ [FRONTEND] ${data.count} keys generated successfully!`)
        console.log('📦 [FRONTEND] Response data:', data)
        
        // Reset filters to show all keys
        setFilterStatus('all')
        setFilterDuration('all')
        setSearchTerm('')
        
        // Add new keys directly to state for immediate display
        const newKeysToAdd = data.keys.map((k: any) => ({
          key: k.key,
          duration: k.duration,
          purchaseDate: k.purchaseDate,
          expiresAt: k.expiresAt,
          claimedAt: k.claimedAt,
          userId: k.userId,
          hwid: k.hwid,
          canBeUsedForRegistration: k.canBeUsedForRegistration
        }))
        
        console.log('📝 [FRONTEND] Adding keys directly to state:', newKeysToAdd.length)
        console.log('📝 [FRONTEND] New keys to add:', newKeysToAdd)
        
        setKeys(prevKeys => {
          console.log('📊 [FRONTEND] Previous keys count:', prevKeys.length)
          // Avoid duplicates by checking if key already exists
          const existingKeys = prevKeys.map(k => k.key)
          const uniqueNewKeys = newKeysToAdd.filter((k: Key) => !existingKeys.includes(k.key))
          console.log('📊 [FRONTEND] Unique new keys:', uniqueNewKeys.length)
          const updated = [...uniqueNewKeys, ...prevKeys]
          console.log(`📊 [FRONTEND] State updated: ${prevKeys.length} -> ${updated.length} keys`)
          console.log('📊 [FRONTEND] Updated keys:', updated.map(k => k.key))
          return updated
        })
        
        // Also fetch from database to ensure sync (but wait longer)
        setTimeout(async () => {
          console.log('🔄 [FRONTEND] Syncing with database after 1 second...')
          await fetchData()
        }, 1000)
        
        setSuccess(`${data.count} key(s) generated successfully!`)
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const errorMsg = data.error || data.details || 'Error generating keys'
        setError(errorMsg)
        console.error('❌ [FRONTEND] Generate keys error:', data)
      }
    } catch (error: any) {
      console.error('❌ Generate keys exception:', error)
      setError(error.message || 'Error generating keys')
    } finally {
      setIsGenerating(false)
    }
  }

  const resetHWID = async (key: string) => {
    if (!confirm('Reset HWID for this key?')) return

    try {
      const response = await fetch('/api/admin/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })

      if (response.ok) {
        await fetchData()
        setSuccess('HWID reset successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Error resetting HWID')
      }
    } catch (error) {
        setError('Error resetting HWID')
    }
  }

  const banUser = async (userId: string) => {
    if (!confirm('Ban this user?')) return

    try {
      const response = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        await fetchData()
        setSuccess('User banned successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Error banning user')
      }
    } catch (error) {
        setError('Error banning user')
    }
  }

  const unbanUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/unban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        await fetchData()
        setSuccess('User unbanned successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Error unbanning user')
      }
    } catch (error) {
        setError('Error unbanning user')
    }
  }

  const deleteKey = async (key: string) => {
    if (!confirm('Delete this key?')) return

    try {
      const response = await fetch('/api/admin/delete-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })

      if (response.ok) {
        await fetchData()
        setSuccess('Key deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Error deleting key')
      }
    } catch (error) {
        setError('Error deleting key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
    setTimeout(() => setSuccess(''), 2000)
  }

  // Statistics
  const stats = {
    totalKeys: keys.length,
    readyKeys: keys.filter(k => !k.userId && !k.claimedAt).length,
    usedKeys: keys.filter(k => k.userId && k.claimedAt).length,
    totalUsers: users.length,
    bannedUsers: users.filter(u => u.banned).length,
    activeUsers: users.filter(u => !u.banned).length
  }

  // Filter keys
  const filteredKeys = keys.filter(key => {
    const matchesSearch = key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (key.userId && users.find(u => u.id === key.userId)?.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'ready' && !key.userId && !key.claimedAt) ||
                         (filterStatus === 'used' && key.userId && key.claimedAt)
    const matchesDuration = filterDuration === 'all' || key.duration === filterDuration
    const matches = matchesSearch && matchesStatus && matchesDuration
    
    // Debug log for filtering
    if (!matches && keys.length > 0) {
      console.log(`🔍 [FRONTEND] Key ${key.key} filtered out:`, {
        matchesSearch,
        matchesStatus,
        matchesDuration,
        filterStatus,
        filterDuration,
        searchTerm,
        hasUserId: !!key.userId,
        hasClaimedAt: !!key.claimedAt
      })
    }
    
    return matches
  })
  
  // Debug log for filtered keys
  useEffect(() => {
    console.log('📊 [FRONTEND] Keys state:', {
      totalKeys: keys.length,
      filteredKeys: filteredKeys.length,
      filterStatus,
      filterDuration,
      searchTerm,
      keys: keys.map(k => ({ key: k.key, duration: k.duration, userId: k.userId, claimedAt: k.claimedAt }))
    })
  }, [keys, filteredKeys, filterStatus, filterDuration, searchTerm])

  // Filter users
  const filteredUsers = users.filter(user => {
    const userKeys = keys.filter(k => k.userId === user.id)
    return userKeys.length > 0 && 
           (user.email.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm === '')
  })

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center bg-gradient-to-b from-primary-darker via-primary-dark to-primary-darker relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-md w-full relative z-10">
          <div className="card border-purple/40 backdrop-blur-xl animate-slide-up">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🔐</div>
              <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-300 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-gray-400">Administrator login</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4 animate-slide-up">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="input-field w-full"
                  placeholder="Enter username"
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
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Login →
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-b from-primary-darker via-primary-dark to-primary-darker relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-300 via-pink-400 to-purple-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Key and user management</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="btn-secondary px-6"
          >
            🔓 Logout
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-6 animate-slide-up">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 animate-slide-up">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="card text-center hover:scale-105 transition-transform duration-300 animate-slide-up">
            <div className="text-3xl mb-2">🔑</div>
            <div className="text-2xl font-bold text-white">{stats.totalKeys}</div>
            <div className="text-sm text-gray-400">Total Keys</div>
          </div>
          <div className="card text-center hover:scale-105 transition-transform duration-300 animate-slide-up animation-delay-100">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-400">{stats.readyKeys}</div>
            <div className="text-sm text-gray-400">Ready</div>
          </div>
          <div className="card text-center hover:scale-105 transition-transform duration-300 animate-slide-up animation-delay-200">
            <div className="text-3xl mb-2">🔒</div>
            <div className="text-2xl font-bold text-purple-400">{stats.usedKeys}</div>
            <div className="text-sm text-gray-400">Used</div>
          </div>
          <div className="card text-center hover:scale-105 transition-transform duration-300 animate-slide-up animation-delay-300">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-sm text-gray-400">Users</div>
          </div>
          <div className="card text-center hover:scale-105 transition-transform duration-300 animate-slide-up animation-delay-400">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-400">{stats.activeUsers}</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="card text-center hover:scale-105 transition-transform duration-300 animate-slide-up animation-delay-500">
            <div className="text-3xl mb-2">🚫</div>
            <div className="text-2xl font-bold text-red-400">{stats.bannedUsers}</div>
            <div className="text-sm text-gray-400">Banned</div>
          </div>
        </div>

        {/* Generate Keys Section */}
        <div className="card mb-8 relative overflow-hidden group animate-slide-up">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-50 group-hover:opacity-100 transition-opacity" />
          <h2 className="text-2xl font-bold mb-4 text-purple-300 flex items-center gap-2">
            <span>⚡</span> Generate Keys
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Duration</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="input-field w-full"
              >
                <option value="1 jour">1 Day</option>
                <option value="1 semaine">1 Week</option>
                <option value="1 mois">1 Month</option>
                <option value="À vie">Lifetime</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Count</label>
              <input
                type="number"
                value={keyCount}
                onChange={(e) => setKeyCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="input-field w-full"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button 
                onClick={generateKeys} 
                disabled={isGenerating}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group/btn"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isGenerating ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>✨</span> Generate Keys
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'keys'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-gray-custom/50 border border-purple/20 text-gray-300 hover:border-purple/40'
            }`}
          >
            🔑 All Keys ({stats.totalKeys})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-gray-custom/50 border border-purple/20 text-gray-300 hover:border-purple/40'
            }`}
          >
            👥 Users with Keys ({filteredUsers.length})
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">🔍 Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by key or email..."
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'ready' | 'used')}
                className="input-field w-full"
              >
                <option value="all">All Status</option>
                <option value="ready">Ready</option>
                <option value="used">Used</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Duration</label>
              <select
                value={filterDuration}
                onChange={(e) => setFilterDuration(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Durations</option>
                <option value="1 jour">1 Day</option>
                <option value="1 semaine">1 Week</option>
                <option value="1 mois">1 Month</option>
                <option value="À vie">Lifetime</option>
              </select>
            </div>
          </div>
        </div>

        {/* Keys Tab */}
        {activeTab === 'keys' && (
          <div className="card animate-slide-up">
            <h2 className="text-2xl font-bold mb-4 text-purple-300">All Keys</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredKeys.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-5xl mb-4">🔑</div>
                  <p>No keys found</p>
                </div>
              ) : (
                filteredKeys.map((key, index) => {
                  const isUsed = !!key.userId && !!key.claimedAt
                  const isReady = !key.userId && !key.claimedAt
                  const user = isUsed ? users.find(u => u.id === key.userId) : null
                  const isExpired = key.expiresAt ? new Date(key.expiresAt) < new Date() : false

                  return (
                    <div
                      key={key.key}
                      className="bg-primary-dark p-4 rounded-lg border border-purple/30 hover:border-purple/50 transition-all duration-300 hover:scale-[1.01] animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <code className="text-purple-300 font-mono text-sm break-all">{key.key}</code>
                            <button
                              onClick={() => copyToClipboard(key.key)}
                              className="text-gray-400 hover:text-purple-300 transition-colors text-xs"
                              title="Copy"
                            >
                              📋
                            </button>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              isUsed 
                                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300' 
                                : 'bg-green-500/20 border border-green-500/50 text-green-300'
                            }`}>
                              {isUsed ? '🔒 Used' : '✅ Ready'}
                            </span>
                            {isExpired && isUsed && (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 border border-red-500/50 text-red-300">
                                ⏰ Expired
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <span>Duration: <span className="text-white">{key.duration}</span></span>
                            {user && (
                              <span>User: <span className="text-purple-300">{user.email}</span></span>
                            )}
                            {key.claimedAt && (
                              <span>Claimed: <span className="text-white">{new Date(key.claimedAt).toLocaleDateString('fr-FR')}</span></span>
                            )}
                            {key.expiresAt && (
                              <span>Expires: <span className="text-white">{new Date(key.expiresAt).toLocaleDateString('fr-FR')}</span></span>
                            )}
                            {isReady && (
                              <span className="text-green-400">⏳ Timer not started</span>
                            )}
                            {key.hwid && (
                              <span className="text-xs">HWID: <code className="text-yellow-300">{key.hwid}</code></span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {key.hwid && (
                            <button
                              onClick={() => resetHWID(key.key)}
                              className="px-3 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 rounded hover:bg-yellow-500/30 transition-all text-sm"
                              title="Reset HWID"
                            >
                              🔄
                            </button>
                          )}
                          <button
                            onClick={() => deleteKey(key.key)}
                            className="px-3 py-2 bg-red-500/20 border border-red-500/50 text-red-300 rounded hover:bg-red-500/30 transition-all text-sm"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card animate-slide-up">
            <h2 className="text-2xl font-bold mb-4 text-purple-300">Users with Keys</h2>
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-5xl mb-4">👥</div>
                  <p>No users with keys</p>
                </div>
              ) : (
                filteredUsers.map((user, index) => {
                  const userKeys = keys.filter(k => k.userId === user.id)
                  
                  return (
                    <div
                      key={user.id}
                      className="bg-primary-dark p-6 rounded-lg border border-purple/30 hover:border-purple/50 transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {user.email}
                            {user.banned && (
                              <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-300 rounded text-xs">
                                BANNED
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Joined: {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {user.banned ? (
                          <button
                            onClick={() => unbanUser(user.id)}
                            className="px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded hover:bg-green-500/30 transition-all"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => banUser(user.id)}
                            className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-300 rounded hover:bg-red-500/30 transition-all"
                          >
                            Ban
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {userKeys.map(key => (
                          <div key={key.key} className="bg-gray-custom p-3 rounded flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-purple-300 font-mono text-sm break-all">{key.key}</code>
                                <button
                                  onClick={() => copyToClipboard(key.key)}
                                  className="text-gray-400 hover:text-purple-300 transition-colors text-xs"
                                >
                                  📋
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                                <span>Duration: <span className="text-white">{key.duration}</span></span>
                                {key.expiresAt && (
                                  <span>Expires: <span className="text-white">{new Date(key.expiresAt).toLocaleDateString()}</span></span>
                                )}
                                {key.hwid && (
                                  <span>HWID: <code className="text-yellow-300">{key.hwid}</code></span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              {key.hwid && (
                                <button
                                  onClick={() => resetHWID(key.key)}
                                  className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 rounded text-xs hover:bg-yellow-500/30 transition-all"
                                  title="Reset HWID"
                                >
                                  🔄
                                </button>
                              )}
                              <button
                                onClick={() => deleteKey(key.key)}
                                className="px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-300 rounded text-xs hover:bg-red-500/30 transition-all"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}