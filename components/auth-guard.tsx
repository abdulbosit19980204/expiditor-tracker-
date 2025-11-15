"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
  requireApproval?: boolean
  adminOnly?: boolean
}

export function AuthGuard({ children, requireApproval = true, adminOnly = false }: AuthGuardProps) {
  const { isAuthenticated, isApproved, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register"]
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (isLoading) return

    // If it's a public route, allow access
    if (isPublicRoute) {
      // If user is already authenticated and approved, redirect to dashboard
      if (isAuthenticated && isApproved) {
        router.push("/")
      }
      return
    }

    // For protected routes
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (requireApproval && !isApproved) {
      router.push("/login?message=pending_approval")
      return
    }

    if (adminOnly && !user?.is_staff && !user?.is_superuser) {
      router.push("/login?message=admin_required")
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isApproved, isLoading, isPublicRoute, requireApproval, adminOnly, user?.is_staff, user?.is_superuser, pathname])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // For public routes, show content if not authenticated
  if (isPublicRoute && !isAuthenticated) {
    return <>{children}</>
  }

  // For protected routes, show content if authenticated and approved
  if (isAuthenticated && (!requireApproval || isApproved)) {
    if (adminOnly && !user?.is_staff && !user?.is_superuser) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </div>
        </div>
      )
    }
    return <>{children}</>
  }

  // Show nothing while redirecting
  return null
}



