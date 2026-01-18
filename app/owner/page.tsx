'use client'

import { useState, useEffect } from 'react'

interface Stats {
  totalPurchases: number
  totalUsers: number
  totalKeys: number
  activeKeys: number
  totalRevenue: number
  purchasesByDay: { [key: string]: number }
}

interface AccessCheck {
  allowed: boolean
  ip: string
}

interface Log {
  path: string
  method: string
  ip: string
  userAgent?: string
  timestamp: string
}

interface Admin {
  id: string
  username: string
  createdAt: string
}

interface Account {
  id: string
  email: string
  createdAt: string
  registrationIp: string
  lastLoginIp: string
  lastLoginAt: string | null
  banned: boolean
}

export default function OwnerPage() {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null)
  const [clientIp, setClientIp] = useState<string>('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'admins' | 'accounts'>('dashboard')
  const [newAdminUsername, setNewAdminUsername] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const res = await fetch('/api/owner/check-ip')
      const data: AccessCheck = await res.json()
      setIsAllowed(data.allowed)
      setClientIp(data.ip)
      
      if (data.allowed) {
        loadAllData()
      }
    } catch (error) {
      setIsAllowed(false)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async () => {
    await Promise.all([loadStats(), loadLogs(), loadAdmins(), loadAccounts()])
  }

  const loadStats = async () => {
    try {
      const res = await fetch('/api/owner/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/owner/logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  const loadAdmins = async () => {
    try {
      const res = await fetch('/api/owner/admins')
      if (res.ok) {
        const data = await res.json()
        setAdmins(data.admins)
      }
    } catch (error) {
      console.error('Failed to load admins:', error)
    }
  }

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/owner/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts)
      }
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
  }

  const createAdmin = async () => {
    if (!newAdminUsername || !newAdminPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    try {
      const res = await fetch('/api/owner/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newAdminUsername, password: newAdminPassword })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Admin créé avec succès' })
        setNewAdminUsername('')
        setNewAdminPassword('')
        loadAdmins()
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la création' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    }
  }

  const deleteAdmin = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet admin ?')) return

    try {
      const res = await fetch('/api/owner/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Admin supprimé' })
        loadAdmins()
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la suppression' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    }
  }

  const downloadLogs = () => {
    window.location.href = '/api/owner/logs/download'
  }

  const clearLogs = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tous les logs ?')) return

    try {
      const res = await fetch('/api/owner/logs', { method: 'DELETE' })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Logs supprimés' })
        setLogs([])
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    }
  }

  // Calculer la hauteur max pour le graphique
  const maxPurchases = stats ? Math.max(...Object.values(stats.purchasesByDay), 1) : 1

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Vérification de l'accès...</p>
        </div>
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-red-950 to-slate-950">
        <div className="text-center p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-red-500/30 max-w-md">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-3xl font-bold text-red-400 mb-4">Accès Refusé</h1>
          <p className="text-gray-400 mb-6">
            Cette page est réservée au propriétaire du site.
          </p>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-gray-500 text-sm">
              Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              🔐 Owner Panel
            </h1>
            <p className="text-gray-400 mt-2">
              Bienvenue, propriétaire
            </p>
          </div>
          <a href="/" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors">
            ← Retour au site
          </a>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-7xl mx-auto mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right hover:opacity-70">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex gap-2 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
          {(['dashboard', 'logs', 'admins', 'accounts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'dashboard' && '📊 Dashboard'}
              {tab === 'logs' && '📜 Logs'}
              {tab === 'admins' && '👥 Admins'}
              {tab === 'accounts' && '👤 Accounts'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-3xl font-bold text-white">{stats.totalPurchases}</div>
                <div className="text-purple-300 text-sm">Achats Total</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-blue-300 text-sm">Utilisateurs</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-xl rounded-xl p-6 border border-green-500/20">
                <div className="text-4xl mb-2">🔑</div>
                <div className="text-3xl font-bold text-white">{stats.totalKeys}</div>
                <div className="text-green-300 text-sm">Clés Total</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/20">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-3xl font-bold text-white">{stats.activeKeys}</div>
                <div className="text-cyan-300 text-sm">Clés Actives</div>
              </div>
              <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 backdrop-blur-xl rounded-xl p-6 border border-pink-500/20">
                <div className="text-4xl mb-2">💵</div>
                <div className="text-3xl font-bold text-white">${stats.totalRevenue}</div>
                <div className="text-pink-300 text-sm">Revenus Estimés</div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-6">📈 Achats - 7 derniers jours</h3>
              <div className="flex items-end justify-between gap-2 h-64">
                {Object.entries(stats.purchasesByDay).map(([date, count]) => (
                  <div key={date} className="flex-1 flex flex-col items-center">
                    <div className="text-white text-sm font-bold mb-2">{count}</div>
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg transition-all hover:opacity-80"
                      style={{ 
                        height: `${(count / maxPurchases) * 200}px`,
                        minHeight: count > 0 ? '20px' : '4px'
                      }}
                    />
                    <div className="text-gray-400 text-xs mt-2 transform -rotate-45 origin-top-left">
                      {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="p-4 border-b border-purple-500/20 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">📜 Logs des Requêtes ({logs.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadLogs}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                >
                  📥 Télécharger .txt
                </button>
                <button
                  onClick={clearLogs}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                >
                  🗑️ Vider les logs
                </button>
                <button
                  onClick={loadLogs}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
                >
                  🔄 Actualiser
                </button>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Aucun log pour le moment
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-purple-500/10 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-purple-300 text-sm">Timestamp</th>
                      <th className="text-left p-3 text-purple-300 text-sm">Method</th>
                      <th className="text-left p-3 text-purple-300 text-sm">Path</th>
                      <th className="text-left p-3 text-purple-300 text-sm">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={i} className="border-t border-purple-500/10 hover:bg-purple-500/5">
                        <td className="p-3 text-gray-400 text-sm font-mono">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            log.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                            log.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                            log.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="p-3 text-white text-sm font-mono">{log.path}</td>
                        <td className="p-3 text-yellow-400 text-sm font-mono">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            {/* Create Admin Form */}
            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4">➕ Create Admin</h3>
              <div className="flex gap-4 flex-wrap">
                <input
                  type="text"
                  placeholder="Username"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={createAdmin}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-medium transition-all"
                >
                  Create Admin
                </button>
              </div>
            </div>

            {/* Admins List */}
            <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-purple-500/20 overflow-hidden">
              <div className="p-4 border-b border-purple-500/20">
                <h3 className="text-xl font-bold text-white">👥 Admins List ({admins.length})</h3>
              </div>
              <div className="divide-y divide-purple-500/10">
                {admins.map((admin) => (
                  <div key={admin.id} className="p-4 flex items-center justify-between hover:bg-purple-500/5">
                    <div>
                      <div className="text-white font-medium">{admin.username}</div>
                      <div className="text-gray-500 text-sm">
                        Created {new Date(admin.createdAt).toLocaleDateString('en-US')}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAdmin(admin.id)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="p-4 border-b border-purple-500/20 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">👤 All Accounts ({accounts.length})</h3>
              <button
                onClick={loadAccounts}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {accounts.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No accounts yet
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-purple-500/10 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-purple-300 text-sm">Email</th>
                      <th className="text-left p-3 text-purple-300 text-sm">Registration IP</th>
                      <th className="text-left p-3 text-purple-300 text-sm">Last Login IP</th>
                      <th className="text-left p-3 text-purple-300 text-sm">Created</th>
                      <th className="text-left p-3 text-purple-300 text-sm">Last Login</th>
                      <th className="text-left p-3 text-purple-300 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-t border-purple-500/10 hover:bg-purple-500/5">
                        <td className="p-3 text-white text-sm">{account.email}</td>
                        <td className="p-3 text-yellow-400 text-sm font-mono">{account.registrationIp}</td>
                        <td className="p-3 text-cyan-400 text-sm font-mono">{account.lastLoginIp}</td>
                        <td className="p-3 text-gray-400 text-sm">
                          {new Date(account.createdAt).toLocaleDateString('en-US')}
                        </td>
                        <td className="p-3 text-gray-400 text-sm">
                          {account.lastLoginAt 
                            ? new Date(account.lastLoginAt).toLocaleString('en-US')
                            : 'Never'
                          }
                        </td>
                        <td className="p-3">
                          {account.banned ? (
                            <span className="px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-xs">
                              Banned
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded text-xs">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
