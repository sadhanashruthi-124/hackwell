import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

interface User {
  id: number
  name: string
  email: string
  role: string
  institution_name?: string
  campus_name?: string
  location?: string
  student_population?: number
  onboarding_completed?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  setupInstitution: (data: any) => Promise<void>
  refreshProfile: () => Promise<void>
  logout: () => void
  isLoading: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
const AuthContext = createContext<AuthContextType | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = async () => {
    try {
      const res = await authAPI.me()
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored && token) {
      try {
        setUser(JSON.parse(stored))
        refreshProfile()
      } catch {
        logout()
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password)
    const data = res.data
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    const profileRes = await authAPI.me()
    localStorage.setItem('user', JSON.stringify(profileRes.data))
    setUser(profileRes.data)
  }

  const register = async (regData: any) => {
    const res = await authAPI.register(regData)
    const data = res.data
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    const profileRes = await authAPI.me()
    localStorage.setItem('user', JSON.stringify(profileRes.data))
    setUser(profileRes.data)
  }

  const setupInstitution = async (instData: any) => {
    const res = await authAPI.setupInstitution(instData)
    setUser(res.data)
    localStorage.setItem('user', JSON.stringify(res.data))
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, setupInstitution, refreshProfile, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
