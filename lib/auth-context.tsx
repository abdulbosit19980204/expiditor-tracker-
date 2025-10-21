"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  department: string
  position: string
  is_approved: boolean
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isApproved: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuthStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!token && !!user
  const isApproved = user?.is_approved || false

  const checkAuthStatus = async () => {
    try {
      const storedToken = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("user_data")

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))

        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/auth/status/`, {
          headers: {
            Authorization: `Token ${storedToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.is_authenticated && data.is_approved) {
            // Token is valid and user is approved
            return
          }
        }

        // Token is invalid or user not approved
        logout()
      }
    } catch (error) {
      console.error("Auth status check failed:", error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("user_data", JSON.stringify(data.user))
        setToken(data.token)
        setUser(data.user)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setToken(null)
    setUser(null)
    router.push("/login")
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    isApproved,
    login,
    logout,
    checkAuthStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}



