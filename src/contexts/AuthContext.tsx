'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'ADMIN' | 'TEAM_MANAGER' | 'PLAYER' | 'UMPIRE'
  isVerified: boolean
  managedTeams?: Array<{
    id: string
    name: string
    shortName: string
    area: string
    isVerified: boolean
  }>
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

interface RegisterData {
  name: string
  email: string
  phone?: string
  role: 'TEAM_MANAGER' | 'PLAYER'
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session on mount
    const storedUser = localStorage.getItem('streetcricket_user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        // Use setTimeout to avoid calling setState synchronously
        setTimeout(() => setUser(parsedUser), 0)
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('streetcricket_user')
      }
    }
    // Use setTimeout to avoid calling setState synchronously
    setTimeout(() => setIsLoading(false), 0)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        localStorage.setItem('streetcricket_user', JSON.stringify(data.user))
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (response.ok) {
        setUser(responseData.user)
        localStorage.setItem('streetcricket_user', JSON.stringify(responseData.user))
        return { success: true }
      } else {
        return { success: false, error: responseData.error }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('streetcricket_user')
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