"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Home, 
  MapPin, 
  Filter, 
  Search, 
  BarChart3, 
  RefreshCw, 
  Send, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
  Smartphone,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"

export default function QollanmaPage() {
  const { user } = useAuth()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['intro', 'basics']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-12">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Foydalanuvchilar Qo'llanmasi
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Expeditor Tracker tizimini qanday ishlatishni o'rganing
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => toggleSection('basics')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Asosiy Funksiyalar
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => toggleSection('filters')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-green-600" />
                  Filtrlash va Qidiruv
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => toggleSection('statistics')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Statistika va Analitika
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Introduction */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  Proyekt Nima?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('intro')}
                >
                  {expandedSections.has('intro') ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('intro') && (
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Expeditor Tracker</strong> - bu yetkazib berish xodimlarini (ekspeditorlar) va ularning ishlarini kuzatish, tahlil qilish va boshqarish tizimi.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Xaritada Kuzatish</h4>
                      <p className="text-sm text-gray-600">Barcha yetkazib berishlar joylashuvini xaritada ko'ring</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Statistika va Tahlil</h4>
                      <p className="text-sm text-gray-600">Batafsil statistika va hisobotlar oling</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                    <Filter className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Kengaytirilgan Filtrlash</h4>
                      <p className="text-sm text-gray-600">Sana, loyiha, shahar va boshqalar bo'yicha filtrlash</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Real Vaqtda Yangilanish</h4>
                      <p className="text-sm text-gray-600">Ma'lumotlar real vaqtda yangilanadi</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Basics */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Asosiy Funksiyalar
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('basics')}
                >
                  {expandedSections.has('basics') ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('basics') && (
              <CardContent className="space-y-6">
                {/* Xarita */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">1. Xarita (Map)</h3>
                  </div>
                  <div className="pl-7 space-y-2">
                    <p className="text-gray-700">
                      Asosiy sahifada markazda katta xarita ko'rinadi. Xaritada rangli nuqtalar (markerlar) - bu checklar (yetkazib berishlar).
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Yashil = Muvaffaqiyatli
                      </Badge>
                      <Badge className="bg-red-500 text-white">
                        <XCircle className="h-3 w-3 mr-1" />
                        Qizil = Muammo
                      </Badge>
                      <Badge className="bg-yellow-500 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        Sariq = Kutayotgan
                      </Badge>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg mt-3">
                      <p className="text-sm text-gray-700">
                        <strong>Nima qilish kerak:</strong> Marker ustiga bosing - check haqida batafsil ma'lumot ko'rinadi. Xaritani surib ko'ring (zoom in/out).
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Ekspeditorlar */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900">2. Ekspeditorlar Ro'yxati</h3>
                  </div>
                  <div className="pl-7 space-y-2">
                    <p className="text-gray-700">
                      Barcha ekspeditorlar ro'yxati ko'rinadi. Har bir ekspeditor yonida:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Ism</li>
                      <li>Bugungi checklar soni</li>
                      <li>Jami checklar soni</li>
                      <li>Rasm (agar bor bo'lsa)</li>
                    </ul>
                    <div className="bg-green-50 p-4 rounded-lg mt-3">
                      <p className="text-sm text-gray-700">
                        <strong>Nima qilish kerak:</strong> Ekspeditor ustiga bosing - uning checklari ko'rinadi. Qidiruv bo'limida ism yozib qidiring.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Checklar */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <h3 className="text-xl font-semibold text-gray-900">3. Checklar Ro'yxati</h3>
                  </div>
                  <div className="pl-7 space-y-2">
                    <p className="text-gray-700">
                      Tanlangan ekspeditorning barcha checklari ko'rinadi. Har bir checkda:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Check ID (raqam)</li>
                      <li>Mijoz ismi</li>
                      <li>Manzil</li>
                      <li>Vaqt</li>
                      <li>Summa</li>
                      <li>Status (muvaffaqiyatli/noto'g'ri)</li>
                    </ul>
                    <div className="bg-purple-50 p-4 rounded-lg mt-3">
                      <p className="text-sm text-gray-700">
                        <strong>Nima qilish kerak:</strong> Check ustiga bosing - batafsil ma'lumot ochiladi. Qidiruv bo'limida check ID yozib qidiring.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Statistika */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <h3 className="text-xl font-semibold text-gray-900">4. Statistika Paneli</h3>
                  </div>
                  <div className="pl-7 space-y-2">
                    <p className="text-gray-700">
                      Statistika panelida quyidagi ma'lumotlar ko'rinadi:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Jami checklar soni</li>
                      <li>Jami summa</li>
                      <li>To'lov usullari bo'yicha taqsimot (Naqd, UzCard, Humo, Click)</li>
                      <li>Muvaffaqiyat darajasi (%)</li>
                    </ul>
                    <div className="bg-orange-50 p-4 rounded-lg mt-3">
                      <p className="text-sm text-gray-700">
                        <strong>Nima qilish kerak:</strong> Statistika tugmasini bosing (yoki avtomatik ochiladi). Ma'lumotlarni ko'ring va tahlil qiling.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-green-600" />
                  Filtrlash va Qidiruv
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('filters')}
                >
                  {expandedSections.has('filters') ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('filters') && (
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Filtrlash tugmasini bosib, quyidagi filtrlardan foydalaning:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Sana Oralig'i
                    </h4>
                    <p className="text-sm text-gray-700">
                      "From" (dan) va "To" (gacha) - boshlanish va tugash sanalarini tanlang. Kalendardan tanlash mumkin.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Loyiha (Project)
                    </h4>
                    <p className="text-sm text-gray-700">
                      Dropdown dan loyihani tanlang yoki "All" (Hammasi) ni tanlang.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Ombor (Sklad)
                    </h4>
                    <p className="text-sm text-gray-700">
                      Dropdown dan omborni tanlang yoki "All" ni tanlang.
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Shahar (City)
                    </h4>
                    <p className="text-sm text-gray-700">
                      Dropdown dan shaharni tanlang yoki "All" ni tanlang.
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Status
                    </h4>
                    <p className="text-sm text-gray-700">
                      Delivered (Yetkazilgan), Failed (Noto'g'ri), Pending (Kutayotgan) yoki "All" ni tanlang.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Qidiruv
                    </h4>
                    <p className="text-sm text-gray-700">
                      Check ID yoki mijoz ismini yozing. Avtomatik qidiriladi.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Qanday ishlatish:</strong> Filtrlarni to'ldiring → "Apply" (Qo'llash) tugmasini bosing → Natijalar yangilanadi. Filtrlarni tozalash uchun "Clear" (Tozalash) tugmasini bosing.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Statistics */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Statistika va Analitika
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('statistics')}
                >
                  {expandedSections.has('statistics') ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('statistics') && (
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Asosiy Statistika</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Asosiy sahifada statistika paneli mavjud. Yoki "Statistics" tugmasini bosing.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                      <li>Jami checklar soni</li>
                      <li>Jami summa</li>
                      <li>Muvaffaqiyat darajasi (%)</li>
                      <li>To'lov usullari bo'yicha taqsimot</li>
                      <li>Eng yaxshi ekspeditorlar</li>
                      <li>Eng yaxshi loyihalar</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Kengaytirilgan Analitika</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Yuqoridagi "Analytics" tugmasini bosing yoki "Enhanced Analytics" ni tanlang.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                      <li>Grafiklar va diagrammalar</li>
                      <li>Trendlar</li>
                      <li>Tahlillar</li>
                      <li>Export qilish imkoniyati</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Violation Analytics (Buzilishlar Analitikasi)</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      "Violation Analytics" tugmasini bosing.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                      <li>Muammoli checklar</li>
                      <li>Bir xil joydagi buzilishlar</li>
                      <li>Buzilishlar statistikasi</li>
                      <li>Tahlillar</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Check Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Check Haqida Batafsil Ma'lumot
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('check-details')}
                >
                  {expandedSections.has('check-details') ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('check-details') && (
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Check ustiga bosganingizda modal oyna ochiladi va quyidagi ma'lumotlar ko'rinadi:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">Check ID</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Mijoz ismi va manzili</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-700">Yetkazib berilgan vaqt</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">Jami summa</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">To'lov usullari (Naqd, UzCard, Humo, Click)</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-700">GPS koordinatalar</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Nima qilish kerak:</strong> Ma'lumotlarni ko'ring → "Close" (Yopish) tugmasini bosing. Yoki xaritada ko'rsatish uchun "Show on Map" tugmasini bosing.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Update Data */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                  Ma'lumotlarni Yangilash
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('update')}
                >
                  {expandedSections.has('update') ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('update') && (
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Ma'lumotlarni yangilash uchun:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Yuqoridagi "Refresh" (🔄) tugmasini bosing</li>
                  <li>Yoki "Update Data" tugmasini bosing</li>
                  <li>Progress bar ko'rinadi</li>
                  <li>Ma'lumotlar yangilanadi</li>
                </ol>
                <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Eslatma:</strong> Yangilanish bir necha soniya davom etishi mumkin. Katta ma'lumotlar bo'lsa, uzoqroq vaqt olishi mumkin.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Mobile */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  Mobil Qurilmalarda Ishlatish
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('mobile')}
                >
                  {expandedSections.has('mobile') ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('mobile') && (
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Telegram WebApp</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Telegram bot orqali kirish</li>
                    <li>Yoki brauzerda ochish</li>
                    <li>Interfeys mobil uchun moslashtirilgan</li>
                  </ol>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Mobil Brauzer</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Saytga kirish</li>
                    <li>Interfeys avtomatik moslashadi</li>
                    <li>Barcha funksiyalar ishlaydi</li>
                  </ol>
                </div>
              </CardContent>
            )}
          </Card>

          {/* FAQ */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-orange-600" />
                  Tez-tez Beriladigan Savollar
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('faq')}
                >
                  {expandedSections.has('faq') ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('faq') && (
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Q: Check nima?</h4>
                    <p className="text-sm text-gray-700">
                      <strong>A:</strong> Check - bu yetkazib berish (delivery). Har bir buyurtma bir check hisoblanadi.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Q: Ekspeditor nima?</h4>
                    <p className="text-sm text-gray-700">
                      <strong>A:</strong> Ekspeditor - yetkazib berish xodimi. Ular buyurtmalarni mijozlarga yetkazib beradi.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Q: Xaritada nuqtalar ko'rinmayapti?</h4>
                    <p className="text-sm text-gray-700">
                      <strong>A:</strong> Filtrlarni tekshiring. Ekspeditor tanlanganligini tekshiring. Sana oralig'ini tekshiring.
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Q: Ma'lumotlar yangilanmayapti?</h4>
                    <p className="text-sm text-gray-700">
                      <strong>A:</strong> "Refresh" tugmasini bosing. Yoki "Update Data" tugmasini bosing. Bir necha soniya kuting.
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Q: Statistika ko'rinmayapti?</h4>
                    <p className="text-sm text-gray-700">
                      <strong>A:</strong> "Statistics" tugmasini bosing. Yoki statistika panelini oching. Filtrlarni tekshiring.
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tips */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Foydalanish Tavsiyalari
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('tips')}
                >
                  {expandedSections.has('tips') ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.has('tips') && (
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">✅ Filtrlarni saqlang</h4>
                    <p className="text-sm text-gray-700">
                      Filtrlarni to'ldiring. Tizim avtomatik saqlaydi. Keyingi safar avtomatik yuklanadi.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">✅ Ekspeditorni tanlang</h4>
                    <p className="text-sm text-gray-700">
                      Ekspeditor ustiga bosing. Faqat uning checklari ko'rinadi. Xaritada faqat uning checklari ko'rsatiladi.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">✅ Xaritadan foydalaning</h4>
                    <p className="text-sm text-gray-700">
                      Marker ustiga bosing. Batafsil ma'lumot ko'ring. Xaritada harakatlaning.
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">✅ Statistikadan foydalaning</h4>
                    <p className="text-sm text-gray-700">
                      Statistika panelini oching. Ma'lumotlarni tahlil qiling. Hisobotlar tayyorlang.
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link href="/">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Home className="h-5 w-5 mr-2" />
                Asosiy Sahifaga Qaytish
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

