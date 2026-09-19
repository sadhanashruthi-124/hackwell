import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

interface User {
  id: number
  name: string
  email: string
  role: string
  onboarding_complete: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<User>
  logout: () => void
  markOnboardingComplete: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        logout()
      }
    }
    setIsLoading(false)
  }, [])

  const _storeSession = (data: any, email?: string) => {
    const token = data.access_token
    localStorage.setItem('token', token)
    const userObj: User = {
      id: data.user_id,
      name: data.name,
      email: email || data.email || '',
      role: data.role,
      onboarding_complete: data.onboarding_complete ?? false,
    }
    localStorage.setItem('user', JSON.stringify(userObj))
    setToken(token)
    setUser(userObj)
    return userObj
  }

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authAPI.login(email, password)
    return _storeSession(res.data, email)
  }

  const register = async (name: string, email: string, password: string): Promise<User> => {
    const res = await authAPI.register(name, email, password)
    return _storeSession(res.data, email)
  }

  const markOnboardingComplete = async () => {
    await authAPI.completeOnboarding()
    if (user) {
      const updated = { ...user, onboarding_complete: true }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, markOnboardingComplete, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
