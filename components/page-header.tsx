'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  RefreshCw,
  Home,
  LogOut,
  User,
  ArrowUp,
  Download,
  ArrowLeft,
  AlertTriangle,
  BarChart3,
  ListChecks,
  Calendar,
  MapPin,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/hooks/use-toast'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: 'violation' | 'analytics' | 'tasks' | 'stats' | 'map'
  showRefresh?: boolean
  showExport?: boolean
  showBack?: boolean
  onRefresh?: () => void
  onExport?: () => void
  customActions?: React.ReactNode
}

const iconMap = {
  violation: AlertTriangle,
  analytics: BarChart3,
  tasks: ListChecks,
  stats: Calendar,
  map: MapPin,
}

export function PageHeader({
  title,
  description,
  icon = 'analytics',
  showRefresh = true,
  showExport = false,
  showBack = false,
  onRefresh,
  onExport,
  customActions,
}: PageHeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const Icon = iconMap[icon]

  // Scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (onRefresh) {
        await onRefresh()
      } else {
        window.location.reload()
      }
      toast({
        title: 'Yangilandi',
        description: 'Ma\'lumotlar yangilandi',
      })
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Yangilashda xatolik yuz berdi',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
      toast({
        title: 'Tizimdan chiqildi',
        description: 'Muvaffaqiyatli chiqildi',
      })
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Chiqishda xatolik',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-red-500 rounded-xl shadow-md">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="text-sm text-gray-600">{description}</p>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* User Info Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-gray-100"
                    title={user?.username || 'User'}
                  >
                    <User className="h-5 w-5 text-gray-700" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Custom Actions */}
              {customActions}

              {/* Back Button */}
              {showBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="h-10 w-10 hover:bg-gray-100"
                  title="Orqaga"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-700" />
                </Button>
              )}

              {/* Refresh Button */}
              {showRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-10 w-10 hover:bg-gray-100"
                  title="Yangilash"
                >
                  <RefreshCw className={`h-5 w-5 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}

              {/* Export Button */}
              {showExport && onExport && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExport}
                  className="h-10 w-10 hover:bg-gray-100"
                  title="Eksport"
                >
                  <Download className="h-5 w-5 text-gray-700" />
                </Button>
              )}

              {/* Home Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="h-10 w-10 hover:bg-gray-100"
                title="Bosh sahifa"
              >
                <Home className="h-5 w-5 text-gray-700" />
              </Button>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-10 w-10 hover:bg-red-50"
                title="Chiqish"
              >
                <LogOut className="h-5 w-5 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg bg-gray-900 hover:bg-gray-800 z-50"
          title="Yuqoriga"
        >
          <ArrowUp className="h-5 w-5 text-white" />
        </Button>
      )}
    </>
  )
}













