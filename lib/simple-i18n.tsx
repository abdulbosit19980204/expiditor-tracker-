"use client"

import React, { useCallback, useContext, useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"

// Define types
type Translation = {
  [key: string]: string | Translation
}

type Locale = "en" | "ru" | "uz"

type Translations = {
  [locale in Locale]: Translation
}

interface I18nContextProps {
  locale: Locale
  translations: Translation
  setLocale: (locale: Locale) => void
  t: (key: string, options?: Record<string, any>) => string
}

// Translation files
const translations: Translations = {
  en: {
    expeditorTracker: "Expeditor Tracker",
    analyticsDashboard: "Analytics Dashboard",
    comprehensiveAnalytics: "Comprehensive statistics and insights for expeditor performance",
    home: "Home",
    refresh: "Refresh",
    export: "Export",
    filters: "Filters",
    dateRange: "Date Range",
    allProjects: "All Projects",
    allWarehouses: "All Warehouses",
    allCities: "All Cities",
    allStatuses: "All Statuses",
    status: "Status",
    project: "Project",
    warehouse: "Warehouse",
    city: "City",
    totalChecks: "Total Checks",
    totalRevenue: "Total Revenue",
    successRate: "Success Rate",
    avgCheckValue: "Avg Check Value",
    paymentMethods: "Payment Methods",
    dailyCheckDistribution: "Daily Check Distribution",
    paymentMethodsDistribution: "Payment Methods Distribution",
    hourlyDistribution: "Hourly Distribution",
    topExpeditors: "Top Expeditors",
    topProjects: "Top Projects",
    topCities: "Top Cities",
    all: "All",
    cash: "Cash",
    uzcard: "UzCard",
    humo: "Humo",
    click: "Click",
    selectExpeditor: "Select an expeditor to view checks",
    checks: "Checks",
    searchChecks: "Search checks...",
    noChecksFound: "No checks found for the selected expeditor and filters.",
    tryAdjustingFilters: "Try adjusting the filters or selecting a different expeditor.",
    loadingChecks: "Loading checks...",
    loadingExpeditors: "Loading expeditors...",
    selectFilial: "Select Filial",
    allFilials: "All Filials",
    noExpeditorsFound: "No expeditors found for the selected filial.",
    tryChangingFilial: "Try changing the filial to see available expeditors.",
    expeditor: "Expeditor",
    searchExpeditors: "Search expeditors...",
    successfulDeliveries: "Successful Deliveries",
    allExpeditorChecks: "All Expeditor Checks",
    totalCheckValue: "Total Check Value",
    perCheckAverage: "Per Check Average",
    advancedFilters: "Advanced Filters",
    active: "active",
    clearAllFilters: "Clear All Filters",
    delivered: "Delivered",
    awaitingDelivery: "Awaiting Delivery",
    failed: "Failed",
    chartVisibilitySettings: "Chart Visibility Settings",
    filialPerformance: "Filial Performance",
    warehouseDistribution: "Warehouse Distribution",
    filial: "Filial",
  },
  ru: {
    expeditorTracker: "Трекер Экспедиторов",
    analyticsDashboard: "Панель Аналитики",
    comprehensiveAnalytics: "Всесторонняя статистика и аналитика для эффективности экспедиторов",
    home: "Главная",
    refresh: "Обновить",
    export: "Экспорт",
    filters: "Фильтры",
    dateRange: "Временной Диапазон",
    allProjects: "Все Проекты",
    allWarehouses: "Все Склады",
    allCities: "Все Города",
    allStatuses: "Все Статусы",
    status: "Статус",
    project: "Проект",
    warehouse: "Склад",
    city: "Город",
    totalChecks: "Всего Чеков",
    totalRevenue: "Общий Доход",
    successRate: "Успешность Доставки",
    avgCheckValue: "Средняя Сумма Чека",
    paymentMethods: "Методы Оплаты",
    dailyCheckDistribution: "Дневное Распределение Чеков",
    paymentMethodsDistribution: "Распределение Методов Оплаты",
    hourlyDistribution: "Почасовое Распределение",
    topExpeditors: "Лучшие Экспедиторы",
    topProjects: "Лучшие Проекты",
    topCities: "Лучшие Города",
    all: "Все",
    cash: "Наличные",
    uzcard: "UzCard",
    humo: "Humo",
    click: "Click",
    selectExpeditor: "Выберите экспедитора для просмотра чеков",
    checks: "Чек",
    searchChecks: "Поиск чеков...",
    noChecksFound: "Не найдено чеков для выбранного экспедитора и фильтров.",
    tryAdjustingFilters: "Попробуйте изменить фильтры или выберите другого экспедитора.",
    loadingChecks: "Загрузка чеков...",
    loadingExpeditors: "Загрузка экспедиторов...",
    selectFilial: "Выберите Филиал",
    allFilials: "Все Филиалы",
    noExpeditorsFound: "Не найдено экспедиторов для выбранного филиала.",
    tryChangingFilial: "Попробуйте изменить филиал, чтобы увидеть доступных экспедиторов.",
    expeditor: "Экспедитор",
    searchExpeditors: "Поиск экспедиторов...",
    successfulDeliveries: "Успешные Доставки",
    allExpeditorChecks: "Все Чеки Экспедитора",
    totalCheckValue: "Общая Стоимость Чеков",
    perCheckAverage: "Среднее на Чек",
    advancedFilters: "Расширенные Фильтры",
    active: "активный",
    clearAllFilters: "Очистить Все Фильтры",
    delivered: "Доставлено",
    awaitingDelivery: "В Ожидании Доставки",
    failed: "Неудачно",
    chartVisibilitySettings: "Настройки Видимости Графиков",
    filialPerformance: "Производительность Филиала",
    warehouseDistribution: "Распределение по Складам",
    filial: "Филиал",
  },
  uz: {
    expeditorTracker: "Ekspeditor kuzatuvchisi",
    analyticsDashboard: "Analitika paneli",
    comprehensiveAnalytics: "Ekspeditor samaradorligi uchun har tomonlama statistika va tahlil",
    home: "Bosh sahifa",
    refresh: "Yangilash",
    export: "Eksport",
    filters: "Filtrlar",
    dateRange: "Sana oralig'i",
    allProjects: "Barcha loyihalar",
    allWarehouses: "Barcha omborlar",
    allCities: "Barcha shaharlar",
    allStatuses: "Barcha holatlar",
    status: "Holat",
    project: "Loyiha",
    warehouse: "Ombor",
    city: "Shahar",
    totalChecks: "Jami cheklar",
    totalRevenue: "Jami daromad",
    successRate: "Yetkazib berish darajasi",
    avgCheckValue: "O'rtacha chek qiymati",
    paymentMethods: "To'lov usullari",
    dailyCheckDistribution: "Kunlik cheklarni taqsimlash",
    paymentMethodsDistribution: "To'lov usullarini taqsimlash",
    hourlyDistribution: "Soatlik taqsimlash",
    topExpeditors: "Eng yaxshi ekspeditorlar",
    topProjects: "Eng yaxshi loyihalar",
    topCities: "Eng yaxshi shaharlar",
    all: "Barcha",
    cash: "Naqd pul",
    uzcard: "UzCard",
    humo: "Humo",
    click: "Click",
    selectExpeditor: "Cheklarni ko'rish uchun ekspeditorni tanlang",
    checks: "Cheklar",
    searchChecks: "Cheklarni qidirish...",
    noChecksFound: "Tanlangan ekspeditor va filtrlar uchun cheklar topilmadi.",
    tryAdjustingFilters: "Filtrlarni sozlash yoki boshqa ekspeditorni tanlashga harakat qiling.",
    loadingChecks: "Cheklar yuklanmoqda...",
    loadingExpeditors: "Ekspeditorlar yuklanmoqda...",
    selectFilial: "Filialni tanlang",
    allFilials: "Barcha Filiallar",
    noExpeditorsFound: "Tanlangan filial uchun ekspeditorlar topilmadi.",
    tryChangingFilial: "Mavjud ekspeditorlarni ko'rish uchun filialni o'zgartirishga harakat qiling.",
    expeditor: "Ekspeditor",
    searchExpeditors: "Ekspeditorlarni qidirish...",
    successfulDeliveries: "Muvaffaqiyatli Yetkazib berishlar",
    allExpeditorChecks: "Ekspeditorning barcha cheklari",
    totalCheckValue: "Cheklarning umumiy qiymati",
    perCheckAverage: "Har bir chek uchun o'rtacha",
    advancedFilters: "Kengaytirilgan Filtrlar",
    active: "faol",
    clearAllFilters: "Barcha Filtrlarni O'chirish",
    delivered: "Yetkazildi",
    awaitingDelivery: "Yetkazilish kutilmoqda",
    failed: "Bajarilmadi",
    chartVisibilitySettings: "Grafik ko'rinish sozlamalari",
    filialPerformance: "Filialning ishlashi",
    warehouseDistribution: "Ombor bo'yicha taqsimot",
    filial: "Filial",
  },
}

const I18nContext = React.createContext<I18nContextProps | undefined>(undefined)

interface I18nProviderProps {
  children: React.ReactNode
  initialLocale?: Locale
}

export function I18nProvider({ children, initialLocale = "uz" }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Load locale from localStorage if available
    const savedLocale = localStorage.getItem("locale") as Locale | null
    if (savedLocale && ["en", "ru", "uz"].includes(savedLocale)) {
      setLocale(savedLocale)
    }
    setIsInitialized(true)
  }, [])

  const router = useRouter()

  // Translation function
  const t = useCallback(
    (key: string, options: Record<string, any> = {}) => {
      let translation = translations[locale][key] as string | undefined
      if (!translation) {
        console.warn(`Translation not found for key: ${key} in locale: ${locale}`)
        return key
      }

      // Replace variables in the translation
      Object.keys(options).forEach((optionKey) => {
        const regex = new RegExp(`\\{\\{\\s*${optionKey}\\s*\\}\\}`, "g")
        translation = translation!.replace(regex, options[optionKey])
      })

      return translation
    },
    [locale],
  )

  const setAppLocale = useCallback(
    (newLocale: Locale) => {
      setLocale(newLocale)
      if (typeof window !== "undefined") {
        localStorage.setItem("locale", newLocale)
      }
      router.refresh()
    },
    [router],
  )

  const value: I18nContextProps = useMemo(
    () => ({
      locale,
      translations: translations[locale],
      setLocale: setAppLocale,
      t,
    }),
    [locale, setAppLocale, t],
  )

  if (!isInitialized) {
    return null
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider")
  }
  return context
}

// Export types
export type { Locale, Translation, Translations }
