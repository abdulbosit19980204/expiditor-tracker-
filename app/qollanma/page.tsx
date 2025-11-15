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
import { useLanguage } from "@/lib/language-context"

export default function QollanmaPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
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
              {t('user_guide_title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('user_guide_subtitle')}
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => toggleSection('basics')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  {t('basic_functions')}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => toggleSection('filters')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-green-600" />
                  {t('filtering_and_search')}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => toggleSection('statistics')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  {t('statistics_and_analytics')}
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
                  {t('what_is_project')}
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
                  <strong>{t('expeditor_tracker')}</strong> - {t('user_guide_subtitle').toLowerCase()}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{t('map_tracking')}</h4>
                      <p className="text-sm text-gray-600">{t('map_tracking')} - {t('statistics_and_analysis').toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{t('statistics_and_analysis')}</h4>
                      <p className="text-sm text-gray-600">{t('statistics_and_analysis')} - {t('statistics_and_analysis').toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                    <Filter className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{t('advanced_filtering')}</h4>
                      <p className="text-sm text-gray-600">{t('advanced_filtering')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{t('real_time_updates')}</h4>
                      <p className="text-sm text-gray-600">{t('real_time_updates')}</p>
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
                  {t('basic_functions')}
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
                    <h3 className="text-xl font-semibold text-gray-900">1. {t('map_section')}</h3>
                  </div>
                  <div className="pl-7 space-y-2">
                    <p className="text-gray-700">
                      {t('map_description')}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('green_successful')}
                      </Badge>
                      <Badge className="bg-red-500 text-white">
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('red_problem')}
                      </Badge>
                      <Badge className="bg-yellow-500 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        {t('yellow_pending')}
                      </Badge>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg mt-3">
                      <p className="text-sm text-gray-700">
                        <strong>{t('what_to_do')}</strong> {t('map_what_to_do')}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Ekspeditorlar */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900">2. {t('expeditors_list')}</h3>
                  </div>
                  <div className="pl-7 space-y-2">
                    <p className="text-gray-700">
                      {t('expeditors_list_desc')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Ism</li>
                      <li>Bugungi checklar soni</li>
                      <li>Jami checklar soni</li>
                      <li>Rasm (agar bor bo'lsa)</li>
                    </ul>
                    <div className="bg-green-50 p-4 rounded-lg mt-3">
                      <p className="text-sm text-gray-700">
                        <strong>{t('what_to_do')}</strong> {t('expeditors_what_to_do')}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Checklar */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <h3 className="text-xl font-semibold text-gray-900">3. {t('checks_list')}</h3>
                  </div>
                  <div className="pl-7 space-y-2">
                    <p className="text-gray-700">
                      {t('checks_list_desc')}
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
                        <strong>{t('what_to_do')}</strong> {t('checks_what_to_do')}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Statistika */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <h3 className="text-xl font-semibold text-gray-900">4. {t('statistics_panel')}</h3>
                  </div>
                  <div className="pl-7 space-y-2">
                    <p className="text-gray-700">
                      {t('statistics_panel_desc')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Jami checklar soni</li>
                      <li>Jami summa</li>
                      <li>To'lov usullari bo'yicha taqsimot (Naqd, UzCard, Humo, Click)</li>
                      <li>Muvaffaqiyat darajasi (%)</li>
                    </ul>
                    <div className="bg-orange-50 p-4 rounded-lg mt-3">
                      <p className="text-sm text-gray-700">
                        <strong>{t('what_to_do')}</strong> {t('statistics_what_to_do')}
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
                  {t('filtering_and_search')}
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
                  {t('filter_description')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('date_range_filter')}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {t('date_range_desc')}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t('project_filter')}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {t('project_filter_desc')}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('warehouse_filter')}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {t('warehouse_filter_desc')}
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t('city_filter')}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {t('city_filter_desc')}
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {t('status_filter')}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {t('status_filter_desc')}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      {t('search_filter')}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {t('search_filter_desc')}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>{t('how_to_use')}</strong> {t('how_to_use_filters')}
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
                  {t('statistics_and_analytics')}
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
                    <h4 className="font-semibold text-gray-900 mb-2">{t('main_statistics')}</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      {t('main_statistics_desc')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                      <li>{t('total_checks')}</li>
                      <li>{t('total_amount')}</li>
                      <li>{t('success_rate_percent')}</li>
                      <li>{t('payment_methods')}</li>
                      <li>{t('top_expeditors')}</li>
                      <li>{t('top_projects')}</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('enhanced_analytics')}</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      {t('enhanced_analytics_desc')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                      <li>{t('enhanced_analytics_items').split(', ')[0]}</li>
                      <li>{t('enhanced_analytics_items').split(', ')[1]}</li>
                      <li>{t('enhanced_analytics_items').split(', ')[2]}</li>
                      <li>{t('enhanced_analytics_items').split(', ')[3]}</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('violation_analytics_title')}</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      {t('violation_analytics_desc')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                      <li>{t('violation_analytics_items').split(', ')[0]}</li>
                      <li>{t('violation_analytics_items').split(', ')[1]}</li>
                      <li>{t('violation_analytics_items').split(', ')[2]}</li>
                      <li>{t('violation_analytics_items').split(', ')[3]}</li>
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
                  {t('check_details_title')}
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
                  {t('check_details_desc')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">{t('check_id')}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{t('client_name_address')}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-700">{t('delivery_time')}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">{t('total_amount')}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{t('payment_methods_detail')}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-700">{t('gps_coordinates')}</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>{t('what_to_do')}</strong> {t('check_details_what_to_do')}
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
                  {t('update_data_title')}
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
                  {t('update_data_desc')}
                </p>
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {t('update_data_steps')}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>{t('update_data_note')}</strong>
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
                  {t('mobile_usage')}
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
                  <h4 className="font-semibold text-gray-900 mb-2">{t('telegram_webapp')}</h4>
                  <p className="text-sm text-gray-700">
                    {t('telegram_webapp_desc')}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{t('mobile_browser')}</h4>
                  <p className="text-sm text-gray-700">
                    {t('mobile_browser_desc')}
                  </p>
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
                  {t('faq_title')}
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
                    <h4 className="font-semibold text-gray-900 mb-2">{t('what_is_check')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('check_answer')}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('what_is_expeditor')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('expeditor_answer')}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('map_no_points')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('map_no_points_answer')}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('data_not_updating')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('data_not_updating_answer')}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{t('stats_not_showing')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('stats_not_showing_answer')}
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
                  {t('tips_title')}
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
                    <h4 className="font-semibold text-gray-900 mb-2">✅ {t('save_filters')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('save_filters_desc')}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">✅ {t('select_expeditor')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('select_expeditor_desc')}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">✅ {t('use_map')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('use_map_desc')}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">✅ {t('use_statistics')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('use_statistics_desc')}
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
                {t('back_to_home')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

