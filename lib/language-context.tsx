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
    'all_filials': 'Barcha filiallar',
    'all_projects': 'Barcha loyihalar',
    'all_warehouses': 'Barcha omborlar',
    'all_cities': 'Barcha shaharlar',
    'all_statuses': 'Barcha holatlar',
    'check_pattern_analysis': 'Check naqshlarini tahlil qilish - Vaqt oynalari va geografik klasterlar',
    'logout': 'Chiqish',
    'real_time_analysis_fraud_detection': 'Real vaqt tahlili va fraud aniqlash',
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
    'all_filials': 'Все филиалы',
    'all_projects': 'Все проекты',
    'all_warehouses': 'Все склады',
    'all_cities': 'Все города',
    'all_statuses': 'Все статусы',
    'check_pattern_analysis': 'Анализ паттернов чеков - Временные окна и географические кластеры',
    'logout': 'Выйти',
    'real_time_analysis_fraud_detection': 'Анализ в реальном времени и обнаружение мошенничества',
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
    'all_filials': 'All Filials',
    'all_projects': 'All Projects',
    'all_warehouses': 'All Warehouses',
    'all_cities': 'All Cities',
    'all_statuses': 'All Statuses',
    'check_pattern_analysis': 'Check pattern analysis - Time windows and geographic clusters',
    'logout': 'Logout',
    'real_time_analysis_fraud_detection': 'Real-time analysis and fraud detection',
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
