'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { User } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  const logout = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, setUser, logout, loading }}>{children}</AuthContext.Provider>
}
