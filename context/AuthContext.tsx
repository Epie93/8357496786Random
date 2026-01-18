'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  keys?: string[]
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, activationKey?: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for session cookie on mount
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Important: include cookies
        })
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated && data.user) {
            setUser(data.user)
            // Also store in localStorage for backward compatibility
            localStorage.setItem('user', JSON.stringify(data.user))
          } else {
            // No valid session, clear localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } else {
          // No valid session, clear localStorage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        // Cookie is set automatically by the server (HTTP-only, secure)
        // Store user data in localStorage for backward compatibility
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const register = async (email: string, password: string, activationKey?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ email, password, activationKey }),
      })

      if (response.ok) {
        const data = await response.json()
        // Cookie is set automatically by the server (HTTP-only, secure)
        // Store user data in localStorage for backward compatibility
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Register error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      // Call logout API to clear cookie
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' // Important: include cookies
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
