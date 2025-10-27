'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { 
  Home, 
  BarChart3, 
  AlertTriangle, 
  Clock,
  Settings,
  X,
  Menu,
  ChevronRight,
  ArrowLeftRight,
  RefreshCw,
  Filter,
  Send,
  LogOut,
  MapPin,
  Shield,
  User,
  Loader2,
  ChevronLeft,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

interface NavigationItem {
  name: string
  href: string
  icon: any
  badge?: string
}

interface AppNavigationProps {
  onUpdateClick?: () => void
  isUpdating?: boolean
  lastUpdatedAt?: string
  updateMessage?: string
  updateProgress?: number
}

export function AppNavigation({ 
  onUpdateClick, 
  isUpdating = false,
  lastUpdatedAt,
  updateMessage,
  updateProgress = 0
}: AppNavigationProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr')
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null)
  const [togglePosition, setTogglePosition] = useState({ top: 50, right: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showStats, setShowStats] = useState(false)

  // Load direction and position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nav_direction')
    if (saved === 'ltr' || saved === 'rtl') {
      setDirection(saved)
    }
    
    const savedPosition = localStorage.getItem('nav_toggle_position')
    if (savedPosition) {
      setTogglePosition(JSON.parse(savedPosition))
    }
  }, [])

  // Save direction to localStorage
  const toggleDirection = () => {
    const newDirection = direction === 'rtl' ? 'ltr' : 'rtl'
    setDirection(newDirection)
    localStorage.setItem('nav_direction', newDirection)
  }

  // Close on outside click
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('.navigation-sidebar') && !target.closest('.navigation-toggle')) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newTop = e.clientY - dragOffset.y
      const newRight = window.innerWidth - e.clientX - dragOffset.x
      
      setTogglePosition({
        top: Math.max(10, Math.min(window.innerHeight - 60, newTop)),
        right: Math.max(10, Math.min(window.innerWidth - 60, newRight))
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      localStorage.setItem('nav_toggle_position', JSON.stringify(togglePosition))
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, togglePosition])

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const touch = e.touches[0]
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    })
  }

  useEffect(() => {
    if (!isDragging) return

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const newTop = touch.clientY - dragOffset.y
      const newRight = window.innerWidth - touch.clientX - dragOffset.x
      
      setTogglePosition({
        top: Math.max(10, Math.min(window.innerHeight - 60, newTop)),
        right: Math.max(10, Math.min(window.innerWidth - 60, newRight))
      })
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      localStorage.setItem('nav_toggle_position', JSON.stringify(togglePosition))
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, dragOffset, togglePosition])

  const handleTelegramContact = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"
      const response = await fetch(`${API_BASE_URL}/telegram/target/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.open(data.url, '_blank')
        } else {
          window.open('https://t.me/', '_blank')
        }
      } else {
        window.open('https://t.me/', '_blank')
      }
    } catch (error) {
      console.error('Failed to get telegram target:', error)
      window.open('https://t.me/', '_blank')
    }
  }

  const navigationItems: NavigationItem[] = [
    {
      name: t('main_dashboard'),
      href: '/',
      icon: Home,
    },
    {
      name: 'Cheklar',
      href: '/checklar',
      icon: Clock,
      badge: 'NEW',
    },
    {
      name: t('telegram_contact_dev'),
      href: '#',
      icon: Send,
      badge: undefined,
    },
    {
      name: t('analytics_violations'),
      href: '#',
      icon: BarChart3,
      badge: 'NEW',
      submenu: [
        {
          name: t('enhanced_analytics'),
          href: '/enhanced-stats',
          icon: BarChart3,
        },
        {
          name: t('violation_analytics'),
          href: '/violation-analytics',
          icon: AlertTriangle,
        },
        {
          name: t('same_location_violations'),
          href: '/same-location-violations',
          icon: MapPin,
          badge: 'NEW'
        },
        {
          name: t('buzilishlar_nazorati'),
          href: '/buzilishlar',
          icon: Shield,
          badge: 'NEW'
        },
      ]
    },
    {
      name: t('tasks_management'),
      href: '/tasks',
      icon: Clock,
    },
    ...(user?.is_superuser ? [
      {
        name: t('user_analytics'),
        href: '/admin/user-analytics',
        icon: Users,
        badge: 'NEW'
      },
      {
        name: t('yandex_tokens'),
        href: '/yandex-tokens',
        icon: Settings,
      },
    ] : []),
  ]

  if (!user) return null

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <>
      {/* Draggable Toggle Button - Ko'k rang */}
      <div 
        className="navigation-toggle fixed z-[9999] cursor-move"
        style={{ 
          top: `${togglePosition.top}px`, 
          right: `${togglePosition.right}px`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-12 w-12 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-2 border-blue-300 transition-all ${
            isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'
          }`}
          title="Drag to move • Click to open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`navigation-sidebar fixed top-0 bottom-0 w-80 bg-gradient-to-br from-slate-50 to-gray-100 shadow-2xl z-[9998] transition-transform duration-300 ease-in-out ${
          direction === 'ltr'
            ? `left-0 border-r border-gray-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `right-0 border-l border-gray-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-300 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
                  <p className="text-xs text-gray-500">{user?.username}</p>
                </div>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                {direction === 'ltr' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Update Button */}
              {onUpdateClick && (
                <div className="space-y-2">
                  <Button
                    onClick={onUpdateClick}
                    disabled={isUpdating}
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-xs">{updateMessage || 'Updating...'}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        <span>Update Data</span>
                      </>
                    )}
                  </Button>
                  {lastUpdatedAt && !isUpdating && (
                    <p className="text-xs text-gray-500 text-center">
                      Last: {formatDateTime(lastUpdatedAt)}
                    </p>
                  )}
                  {isUpdating && updateProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${updateProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Quick Actions Row removed per request */}
            </div>
            
            {/* Direction Toggle */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">
                    {direction === 'ltr' ? 'L→R' : 'R→L'}
                  </span>
                </div>
                <Switch
                  checked={direction === 'rtl'}
                  onCheckedChange={toggleDirection}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {direction === 'ltr' ? 'Left to Right (Default)' : 'Right to Left'}
              </p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">{t('language')}</span>
              <div className="flex items-center gap-1">
                {[
                  { code: 'uz', flag: '🇺🇿', name: 'UZ' },
                  { code: 'ru', flag: '🇷🇺', name: 'RU' },
                  { code: 'en', flag: '🇺🇸', name: 'EN' }
                ].map((lang) => (
                  <Button
                    key={lang.code}
                    variant={language === lang.code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage(lang.code as any)}
                    className={`h-7 w-7 p-0 text-xs ${
                      language === lang.code 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                    title={lang.name}
                  >
                    {lang.flag}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                // Special handling for Telegram contact
                if (item.name === 'Telegram (Contact Dev)') {
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        handleTelegramContact()
                        setIsOpen(false)
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-gray-700 hover:bg-white hover:shadow-sm w-full text-left"
                    >
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="flex-1 text-sm">{item.name}</span>
                      {item.badge && (
                        <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                      {direction === 'ltr' ? (
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 rotate-180 text-gray-400" />
                      )}
                    </button>
                  )
                }

                // Handle submenu items
                if (item.submenu) {
                  const isSubmenuExpanded = expandedSubmenu === item.name
                  const hasActiveSubmenu = item.submenu.some(subItem => pathname === subItem.href)
                  
                  return (
                    <div key={item.href}>
                      <button
                        onClick={() => setExpandedSubmenu(isSubmenuExpanded ? null : item.name)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left ${
                          hasActiveSubmenu
                            ? 'bg-blue-100 text-blue-700 font-medium border border-blue-200'
                            : 'text-gray-700 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${hasActiveSubmenu ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className="flex-1 text-sm">{item.name}</span>
                        {item.badge && (
                          <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                          isSubmenuExpanded ? 'rotate-90' : ''
                        }`} />
                      </button>
                      
                      {isSubmenuExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu.map((subItem) => {
                            const isSubActive = pathname === subItem.href
                            const SubIcon = subItem.icon
                            
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                  isSubActive
                                    ? 'bg-blue-100 text-blue-700 font-medium border border-blue-200'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <SubIcon className={`h-3.5 w-3.5 ${isSubActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="flex-1 text-xs">{subItem.name}</span>
                                {subItem.badge && (
                                  <Badge className="bg-green-500 text-white text-[9px] px-1 py-0">
                                    {subItem.badge}
                                  </Badge>
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 font-medium border border-blue-200'
                        : 'text-gray-700 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="flex-1 text-sm">{item.name}</span>
                    {item.badge && (
                      <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                        {item.badge}
                      </Badge>
                    )}
                    {direction === 'ltr' ? (
                      <ChevronRight className={`h-3.5 w-3.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronRight className={`h-3.5 w-3.5 rotate-180 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <Button
              onClick={logout}
              variant="outline"
              className="w-full justify-center text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <div className="text-[10px] text-gray-400 text-center mt-3">
              <p className="font-medium">Expeditor Tracker v1.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

