"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
    try {
      const loggedInUser = await BackendlessService.loginUser(email, password)
      setUser(loggedInUser)
      return loggedInUser
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const register = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }): Promise<MerchantUser> => {
    try {
      const registeredUser = await BackendlessService.registerUser(userData)
      setUser(registeredUser)
      return registeredUser
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await BackendlessService.logoutUser()
      setUser(null)
    } catch (error) {
      console.error("Logout failed:", error)
      throw error
    }
  }

  const updateUser = async (userData: Partial<MerchantUser>): Promise<MerchantUser> => {
    try {
      const updatedUser = await BackendlessService.updateUser(userData)
      setUser(updatedUser)
      return updatedUser
    } catch (error) {
      console.error("User update failed:", error)
      throw error
    }
  }

  const refreshUser = async (): Promise<void> => {
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
