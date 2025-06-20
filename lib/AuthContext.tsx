"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { BackendlessService, type MerchantUser } from "@/lib/backendless"

interface AuthContextType {
  user: MerchantUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<MerchantUser>
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<MerchantUser>
  logout: () => Promise<void>
  updateUser: (userData: Partial<MerchantUser>) => Promise<MerchantUser>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MerchantUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    try {
      const currentUser = await BackendlessService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Failed to get current user:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<MerchantUser> => {
    const user = await BackendlessService.loginUser(email, password)
    setUser(user)
    return user
  }

  const register = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }): Promise<MerchantUser> => {
    const user = await BackendlessService.registerUser(userData)
    setUser(user)
    return user
  }

  const logout = async () => {
    await BackendlessService.logoutUser()
    setUser(null)
  }

  const updateUser = async (userData: Partial<MerchantUser>): Promise<MerchantUser> => {
    const updated = await BackendlessService.updateUser(userData)
    setUser(updated)
    return updated
  }

  const refreshUser = async () => {
    await checkCurrentUser()
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
