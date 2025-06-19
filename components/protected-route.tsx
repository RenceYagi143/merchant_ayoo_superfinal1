"use client"

import type React from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowIncompleteOnboarding?: boolean
}

export function ProtectedRoute({ children, allowIncompleteOnboarding = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Only redirect if user is definitely not authenticated
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If no user and not loading, don't render anything (will redirect)
  if (!user) {
    return null
  }

  // If user exists, always render children
  // Let individual pages handle onboarding checks if needed
  return <>{children}</>
}
