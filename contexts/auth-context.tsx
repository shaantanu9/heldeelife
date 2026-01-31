'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  email: string | null
  name: string | null
  role: 'user' | 'admin'
  image?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role || 'user',
        image: session.user.image,
      })
    } else {
      setUser(null)
    }
  }, [session])

  const isLoading = status === 'loading'
  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
      }}
    >
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









