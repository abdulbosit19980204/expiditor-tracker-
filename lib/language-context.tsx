"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

export type Language = 'uz' | 'ru' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation keys
const translations = {
  uz: {
    // Main page
    'expeditor_tracker': 'Ekspeditor Kuzatuvchi',
    'update_data': 'Ma\'lumotlarni yangilash',
    'last_update': 'Oxirgi yangilanish',
    'date_range': 'Sana oralig\'i',
    'today': 'Bugun',
    'selected': 'Tanlangan',
    'filter': 'Filter',
    'search_expeditors': 'Ekspeditorlarni qidirish...',
    'no_expeditors_found': 'Ekspeditorlar topilmadi',
    'try_changing_filter': 'Filterni o\'zgartirib ko\'ring',
    'checks': 'Cheklar',
    'uzs': 'UZS',
    'filial': 'Filial',
    'phone': 'Telefon',
    'transport': 'Transport',
    'status': 'Holat',
    'project': 'Loyiha',
    'warehouse': 'Ombor',
    'city': 'Shahar',
    'all_projects': 'Barcha loyihalar',
    'all_warehouses': 'Barcha omborlar',
    'all_cities': 'Barcha shaharlar',
    'all_statuses': 'Barcha holatlar',
    'clear_all_filters': 'Barcha filterlarni tozalash',
    'active_filters': 'Faol filterlar',
    'daily_routes': 'Kunlik yo\'nalishlar',
    'statistics': 'Statistika',
    'total_checks': 'Jami cheklar',
    'total_amount': 'Jami summa',
    'unique_expeditors': 'Nozik ekspeditorlar',
    'average_checks': 'O\'rtacha cheklar',
    'show_stats': 'Statistikani ko\'rsatish',
    'hide_stats': 'Statistikani yashirish',
    'language': 'Til',
    'select_expeditor_to_view_checks': 'Cheklarni ko\'rish uchun ekspeditor tanlang',
    'loading_checks': 'Cheklar yuklanmoqda...',
    'no_checks_found': 'Cheklar topilmadi',
    'try_adjusting_filters': 'Sana oralig\'i yoki filterlarni o\'zgartiring',
    'loading_expeditors': 'Ekspeditorlar yuklanmoqda...',
    'success_rate': 'Muvaffaqiyat darajasi',
    'payment_methods': 'To\'lov usullari',
    'cash': 'Naqd pul',
    'uzcard': 'UzCard',
    'humo': 'Humo',
    'click': 'Click',
    'enhanced_analytics_dashboard': 'Kengaytirilgan Analytics Dashboard',
    'main_dashboard': 'Asosiy Dashboard',
    'telegram_contact_dev': 'Telegram (Dev bilan aloqa)',
    'analytics_violations': 'Analytics va Buzilishlar',
    'enhanced_analytics': 'Kengaytirilgan Analytics',
    'violation_analytics': 'Buzilish Analytics',
    'same_location_violations': 'Bir xil joy buzilishlari',
    'buzilishlar_nazorati': 'Buzilishlar Nazorati',
    'tasks_management': 'Vazifalar boshqaruvi',
    'yandex_tokens': 'Yandex Tokens',
    'check_pattern_analysis': 'Check naqshlarini tahlil qilish - Vaqt oynalari va geografik klasterlar',
    'logout': 'Chiqish',
    'real_time_analysis_fraud_detection': 'Real vaqt tahlili va fraud aniqlash',
    'comprehensive_statistics_insights': 'Kengaytirilgan statistika va ekspeditor ishlashi uchun tahlil',
    'export_all': 'Hammasini eksport qilish',
    'refresh': 'Yangilash',
    'advanced_filters': 'Kengaytirilgan filterlar',
    'active': 'faol',
    'visible': 'ko\'rinadi',
    'delivered': 'Yetkazilgan',
    'failed': 'Muvaffaqiyatsiz',
    'pending': 'Kutilmoqda',
    'all_expeditor_checks': 'Barcha ekspeditor cheklari',
    'successfully_delivered': 'Muvaffaqiyatli yetkazilgan',
    'failed_deliveries': 'Muvaffaqiyatsiz yetkazishlar',
    'awaiting_delivery': 'Yetkazishni kutmoqda',
    'total_check_value': 'Jami check qiymati',
    'average_check': 'O\'rtacha check',
    'per_check_average': 'Har bir check uchun o\'rtacha',
    'delivery_success_rate': 'Yetkazish muvaffaqiyat darajasi',
    'todays_checks': 'Bugungi cheklar',
    'top_expeditors': 'Eng yaxshi ekspeditorlar',
    'top_projects': 'Eng yaxshi loyihalar',
    'top_cities': 'Eng yaxshi shaharlar',
    'total_sum_uzs': 'Jami summa (UZS)',
    'average_check_sum_uzs': 'O\'rtacha check summasi (UZS)',
    'success_rate_percent': 'Muvaffaqiyat darajasi (%)',
    'export': 'Eksport qilish',
    'daily_check_distribution': 'Kunlik check taqsimoti',
    'top_expeditors_by_check_count': 'Eng yaxshi ekspeditorlar (check soni bo\'yicha)',
    'top_projects_by_check_count': 'Eng yaxshi loyihalar (check soni bo\'yicha)',
    'top_cities_by_check_count': 'Eng yaxshi shaharlar (check soni bo\'yicha)',
    'chart_visibility_settings': 'Chart ko\'rinish sozlamalari',
    'dailyStats': 'Kunlik statistika',
    'hourlyStats': 'Soatlik statistika',
    'topExpeditors': 'Eng yaxshi ekspeditorlar',
    'topProjects': 'Eng yaxshi loyihalar',
    'topCities': 'Eng yaxshi shaharlar',
    'paymentMethods': 'To\'lov usullari',
    'loading_enhanced_statistics_page': 'Kengaytirilgan statistika sahifasi yuklanmoqda...',
  },
  ru: {
    // Main page
    'expeditor_tracker': 'Трекер Экспедиторов',
    'update_data': 'Обновить данные',
    'last_update': 'Последнее обновление',
    'date_range': 'Диапазон дат',
    'today': 'Сегодня',
    'selected': 'Выбрано',
    'filter': 'Фильтр',
    'search_expeditors': 'Поиск экспедиторов...',
    'no_expeditors_found': 'Экспедиторы не найдены',
    'try_changing_filter': 'Попробуйте изменить фильтр',
    'checks': 'Чеки',
    'uzs': 'UZS',
    'filial': 'Филиал',
    'phone': 'Телефон',
    'transport': 'Транспорт',
    'status': 'Статус',
    'project': 'Проект',
    'warehouse': 'Склад',
    'city': 'Город',
    'all_projects': 'Все проекты',
    'all_warehouses': 'Все склады',
    'all_cities': 'Все города',
    'all_statuses': 'Все статусы',
    'clear_all_filters': 'Очистить все фильтры',
    'active_filters': 'Активные фильтры',
    'daily_routes': 'Ежедневные маршруты',
    'statistics': 'Статистика',
    'total_checks': 'Всего чеков',
    'total_amount': 'Общая сумма',
    'unique_expeditors': 'Уникальные экспедиторы',
    'average_checks': 'Средние чеки',
    'show_stats': 'Показать статистику',
    'hide_stats': 'Скрыть статистику',
    'language': 'Язык',
    'select_expeditor_to_view_checks': 'Выберите экспедитора для просмотра чеков',
    'loading_checks': 'Загрузка чеков...',
    'no_checks_found': 'Чеки не найдены',
    'try_adjusting_filters': 'Попробуйте изменить диапазон дат или фильтры',
    'loading_expeditors': 'Загрузка экспедиторов...',
    'success_rate': 'Уровень успеха',
    'payment_methods': 'Способы оплаты',
    'cash': 'Наличные',
    'uzcard': 'UzCard',
    'humo': 'Humo',
    'click': 'Click',
    'enhanced_analytics_dashboard': 'Расширенная аналитическая панель',
    'main_dashboard': 'Главная панель',
    'telegram_contact_dev': 'Telegram (Связаться с разработчиком)',
    'analytics_violations': 'Аналитика и нарушения',
    'enhanced_analytics': 'Расширенная аналитика',
    'violation_analytics': 'Аналитика нарушений',
    'same_location_violations': 'Нарушения в одном месте',
    'buzilishlar_nazorati': 'Контроль нарушений',
    'tasks_management': 'Управление задачами',
    'yandex_tokens': 'Yandex токены',
    'check_pattern_analysis': 'Анализ паттернов чеков - Временные окна и географические кластеры',
    'logout': 'Выйти',
    'real_time_analysis_fraud_detection': 'Анализ в реальном времени и обнаружение мошенничества',
    'comprehensive_statistics_insights': 'Комплексная статистика и аналитика производительности экспедиторов',
    'export_all': 'Экспорт всего',
    'refresh': 'Обновить',
    'advanced_filters': 'Расширенные фильтры',
    'active': 'активно',
    'visible': 'видимо',
    'delivered': 'Доставлено',
    'failed': 'Неудачно',
    'pending': 'В ожидании',
    'all_expeditor_checks': 'Все чеки экспедиторов',
    'successfully_delivered': 'Успешно доставлено',
    'failed_deliveries': 'Неудачные доставки',
    'awaiting_delivery': 'Ожидает доставки',
    'total_check_value': 'Общая стоимость чеков',
    'average_check': 'Средний чек',
    'per_check_average': 'Среднее за чек',
    'delivery_success_rate': 'Уровень успеха доставки',
    'todays_checks': 'Чеки сегодня',
    'top_expeditors': 'Топ экспедиторы',
    'top_projects': 'Топ проекты',
    'top_cities': 'Топ города',
    'total_sum_uzs': 'Общая сумма (UZS)',
    'average_check_sum_uzs': 'Средняя сумма чека (UZS)',
    'success_rate_percent': 'Уровень успеха (%)',
    'export': 'Экспорт',
    'daily_check_distribution': 'Ежедневное распределение чеков',
    'top_expeditors_by_check_count': 'Топ экспедиторы (по количеству чеков)',
    'top_projects_by_check_count': 'Топ проекты (по количеству чеков)',
    'top_cities_by_check_count': 'Топ города (по количеству чеков)',
    'chart_visibility_settings': 'Настройки видимости графиков',
    'dailyStats': 'Ежедневная статистика',
    'hourlyStats': 'Почасовая статистика',
    'topExpeditors': 'Топ экспедиторы',
    'topProjects': 'Топ проекты',
    'topCities': 'Топ города',
    'paymentMethods': 'Способы оплаты',
    'loading_enhanced_statistics_page': 'Загрузка расширенной страницы статистики...',
  },
  en: {
    // Main page
    'expeditor_tracker': 'Expeditor Tracker',
    'update_data': 'Update Data',
    'last_update': 'Last Update',
    'date_range': 'Date Range',
    'today': 'Today',
    'selected': 'Selected',
    'filter': 'Filter',
    'search_expeditors': 'Search expeditors...',
    'no_expeditors_found': 'No expeditors found',
    'try_changing_filter': 'Try changing the filter',
    'checks': 'Checks',
    'uzs': 'UZS',
    'filial': 'Branch',
    'phone': 'Phone',
    'transport': 'Transport',
    'status': 'Status',
    'project': 'Project',
    'warehouse': 'Warehouse',
    'city': 'City',
    'all_projects': 'All Projects',
    'all_warehouses': 'All Warehouses',
    'all_cities': 'All Cities',
    'all_statuses': 'All Statuses',
    'clear_all_filters': 'Clear All Filters',
    'active_filters': 'Active Filters',
    'daily_routes': 'Daily Routes',
    'statistics': 'Statistics',
    'total_checks': 'Total Checks',
    'total_amount': 'Total Amount',
    'unique_expeditors': 'Unique Expeditors',
    'average_checks': 'Average Checks',
    'show_stats': 'Show Statistics',
    'hide_stats': 'Hide Statistics',
    'language': 'Language',
    'select_expeditor_to_view_checks': 'Select an expeditor to view checks',
    'loading_checks': 'Loading checks...',
    'no_checks_found': 'No checks found',
    'try_adjusting_filters': 'Try adjusting the date range or filters',
    'loading_expeditors': 'Loading expeditors...',
    'success_rate': 'Success Rate',
    'payment_methods': 'Payment Methods',
    'cash': 'Cash',
    'uzcard': 'UzCard',
    'humo': 'Humo',
    'click': 'Click',
    'enhanced_analytics_dashboard': 'Enhanced Analytics Dashboard',
    'main_dashboard': 'Main Dashboard',
    'telegram_contact_dev': 'Telegram (Contact Dev)',
    'analytics_violations': 'Analytics & Violations',
    'enhanced_analytics': 'Enhanced Analytics',
    'violation_analytics': 'Violation Analytics',
    'same_location_violations': 'Same Location Violations',
    'buzilishlar_nazorati': 'Violations Control',
    'tasks_management': 'Tasks Management',
    'yandex_tokens': 'Yandex Tokens',
    'check_pattern_analysis': 'Check pattern analysis - Time windows and geographic clusters',
    'logout': 'Logout',
    'real_time_analysis_fraud_detection': 'Real-time analysis and fraud detection',
    'comprehensive_statistics_insights': 'Comprehensive statistics and insights for expeditor performance',
    'export_all': 'Export All',
    'refresh': 'Refresh',
    'advanced_filters': 'Advanced Filters',
    'active': 'active',
    'visible': 'visible',
    'delivered': 'Delivered',
    'failed': 'Failed',
    'pending': 'Pending',
    'all_expeditor_checks': 'All expeditor checks',
    'successfully_delivered': 'Successfully delivered',
    'failed_deliveries': 'Failed deliveries',
    'awaiting_delivery': 'Awaiting delivery',
    'total_check_value': 'Total check value',
    'average_check': 'Average Check',
    'per_check_average': 'Per check average',
    'delivery_success_rate': 'Delivery success rate',
    'todays_checks': 'Today\'s Checks',
    'top_expeditors': 'Top Expeditors',
    'top_projects': 'Top Projects',
    'top_cities': 'Top Cities',
    'total_sum_uzs': 'Total Sum (UZS)',
    'average_check_sum_uzs': 'Average Check Sum (UZS)',
    'success_rate_percent': 'Success Rate (%)',
    'export': 'Export',
    'daily_check_distribution': 'Daily Check Distribution',
    'top_expeditors_by_check_count': 'Top Expeditors by Check Count',
    'top_projects_by_check_count': 'Top Projects by Check Count',
    'top_cities_by_check_count': 'Top Cities by Check Count',
    'chart_visibility_settings': 'Chart Visibility Settings',
    'dailyStats': 'Daily Stats',
    'hourlyStats': 'Hourly Stats',
    'topExpeditors': 'Top Expeditors',
    'topProjects': 'Top Projects',
    'topCities': 'Top Cities',
    'paymentMethods': 'Payment Methods',
    'loading_enhanced_statistics_page': 'Loading enhanced statistics page...',
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('uz')

  // Load saved language from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedLanguage = localStorage.getItem('user_language') as Language
      if (savedLanguage && ['uz', 'ru', 'en'].includes(savedLanguage)) {
        setLanguage(savedLanguage)
      }
    } catch (error) {
      console.error('Error loading saved language:', error)
    }
  }, [])

  // Save language to localStorage
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user_language', lang)
      } catch (error) {
        console.error('Error saving language:', error)
      }
    }
  }

  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
