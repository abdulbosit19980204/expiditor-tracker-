'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">404 - Sahifa topilmadi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            Qidirilayotgan sahifa mavjud emas yoki o'chirilgan.
          </p>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Bosh sahifa
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Orqaga
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
