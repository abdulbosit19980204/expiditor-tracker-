import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

const resources = {
  en: {
    translation: {
      // Navigation
      home: "Home",
      statistics: "Statistics",
      enhancedStatistics: "Enhanced Statistics",

      // Expeditor Tracker
      expeditorTracker: "Expeditor Tracker",
      searchExpeditors: "Search expeditors...",
      selectExpeditor: "Select an expeditor to view their checks",
      noExpeditors: "No expeditors found",
      noExpeditorsFound: "No expeditors with checks found",
      tryChangingFilial: "Try changing the filial filter",
      loadingExpeditors: "Loading expeditors...",

      // Filters
      filters: "Filters",
      advancedFilters: "Advanced Filters",
      dateRange: "Date Range",
      filial: "Filial",
      allFilials: "All Filials",
      allProjects: "All Projects",
      allWarehouses: "All Warehouses",
      allCities: "All Cities",
      status: "Status",
      allStatuses: "All Statuses",
      delivered: "Delivered",
      pending: "Pending",
      failed: "Failed",
      clearAllFilters: "Clear All Filters",

      // Statistics
      totalChecks: "Total Checks",
      totalSum: "Total Sum",
      avgCheckSum: "Avg Check",
      successRate: "Success Rate",

      // Actions
      refresh: "Refresh",
      export: "Export",
      loading: "Loading...",
      loadingChecks: "Loading checks...",
      show: "Show",

      // Check Details
      checkDetails: "Check Details",
      receiptId: "Receipt ID",
      client: "Client",
      phone: "Phone",
      address: "Address",
      paymentMethod: "Payment Method",
      project: "Project",
      warehouse: "Warehouse",
      city: "City",
      checks: "Checks",
      searchChecks: "Search checks...",
      noChecksFound: "No checks found",
      tryAdjustingFilters: "Try adjusting filters",

      // Payment Methods
      cash: "Cash",
      uzcard: "UzCard",
      humo: "Humo",
      click: "Click",

      // Settings
      settings: "Settings",
      general: "General",
      appearance: "Appearance",
      filters: "Filters",
      data: "Data",
      language: "Language",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      save: "Save",
      cancel: "Cancel",
      reset: "Reset",
      export: "Export",
      import: "Import",
      resetSettings: "Reset Settings",
      exportSettings: "Export Settings",
      importSettings: "Import Settings",

      // Common
      loadingApplication: "Loading application...",
      openStats: "Open Stats",
    },
  },
  uz: {
    translation: {
      // Navigation
      home: "Bosh sahifa",
      statistics: "Statistika",
      enhancedStatistics: "Kengaytirilgan Statistika",

      // Expeditor Tracker
      expeditorTracker: "Ekspeditor Kuzatuvi",
      searchExpeditors: "Ekspeditorlarni qidirish...",
      selectExpeditor: "Cheklar uchun ekspeditorni tanlang",
      noExpeditors: "Ekspeditorlar topilmadi",
      noExpeditorsFound: "Cheklar bilan ekspeditorlar topilmadi",
      tryChangingFilial: "Filial filterini o'zgartirishga harakat qiling",
      loadingExpeditors: "Ekspeditorlar yuklanmoqda...",

      // Filters
      filters: "Filterlar",
      advancedFilters: "Kengaytirilgan Filterlar",
      dateRange: "Sana oralig'i",
      filial: "Filial",
      allFilials: "Barcha filiallar",
      allProjects: "Barcha loyihalar",
      allWarehouses: "Barcha omborlar",
      allCities: "Barcha shaharlar",
      status: "Holat",
      allStatuses: "Barcha holatlar",
      delivered: "Yetkazildi",
      pending: "Kutilmoqda",
      failed: "Muvaffaqiyatsiz",
      clearAllFilters: "Barcha filterlarni tozalash",

      // Statistics
      totalChecks: "Jami cheklar",
      totalSum: "Jami summa",
      avgCheckSum: "O'rtacha chek",
      successRate: "Muvaffaqiyat darajasi",

      // Actions
      refresh: "Yangilash",
      export: "Eksport",
      loading: "Yuklanmoqda...",
      loadingChecks: "Cheklar yuklanmoqda...",
      show: "Ko'rsatish",

      // Check Details
      checkDetails: "Chek tafsilotlari",
      receiptId: "Chek ID",
      client: "Mijoz",
      phone: "Telefon",
      address: "Manzil",
      paymentMethod: "To'lov usuli",
      project: "Loyiha",
      warehouse: "Ombor",
      city: "Shahar",
      checks: "Cheklar",
      searchChecks: "Cheklarni qidirish...",
      noChecksFound: "Cheklar topilmadi",
      tryAdjustingFilters: "Filterlarni sozlashga harakat qiling",

      // Payment Methods
      cash: "Naqd",
      uzcard: "UzCard",
      humo: "Humo",
      click: "Click",

      // Settings
      settings: "Sozlamalar",
      general: "Umumiy",
      appearance: "Ko'rinish",
      filters: "Filterlar",
      data: "Ma'lumotlar",
      language: "Til",
      theme: "Mavzu",
      light: "Yorug'",
      dark: "Qorong'u",
      system: "Tizim",
      save: "Saqlash",
      cancel: "Bekor qilish",
      reset: "Qayta o'rnatish",
      export: "Eksport",
      import: "Import",
      resetSettings: "Sozlamalarni qayta o'rnatish",
      exportSettings: "Sozlamalarni eksport qilish",
      importSettings: "Sozlamalarni import qilish",

      // Common
      loadingApplication: "Ilova yuklanmoqda...",
      openStats: "Statistikani ochish",
    },
  },
  ru: {
    translation: {
      // Navigation
      home: "Главная",
      statistics: "Статистика",
      enhancedStatistics: "Расширенная Статистика",

      // Expeditor Tracker
      expeditorTracker: "Отслеживание экспедиторов",
      searchExpeditors: "Поиск экспедиторов...",
      selectExpeditor: "Выберите экспедитора для просмотра чеков",
      noExpeditors: "Экспедиторы не найдены",
      noExpeditorsFound: "Экспедиторы с чеками не найдены",
      tryChangingFilial: "Попробуйте изменить фильтр филиала",
      loadingExpeditors: "Загрузка экспедиторов...",

      // Filters
      filters: "Фильтры",
      advancedFilters: "Расширенные Фильтры",
      dateRange: "Диапазон дат",
      filial: "Филиал",
      allFilials: "Все филиалы",
      allProjects: "Все проекты",
      allWarehouses: "Все склады",
      allCities: "Все города",
      status: "Статус",
      allStatuses: "Все статусы",
      delivered: "Доставлено",
      pending: "В ожидании",
      failed: "Не удалось",
      clearAllFilters: "Очистить все фильтры",

      // Statistics
      totalChecks: "Всего чеков",
      totalSum: "Общая сумма",
      avgCheckSum: "Средний чек",
      successRate: "Процент успеха",

      // Actions
      refresh: "Обновить",
      export: "Экспорт",
      loading: "Загрузка...",
      loadingChecks: "Загрузка чеков...",
      show: "Показать",

      // Check Details
      checkDetails: "Детали чека",
      receiptId: "ID чека",
      client: "Клиент",
      phone: "Телефон",
      address: "Адрес",
      paymentMethod: "Способ оплаты",
      project: "Проект",
      warehouse: "Склад",
      city: "Город",
      checks: "Чеки",
      searchChecks: "Поиск чеков...",
      noChecksFound: "Чеки не найдены",
      tryAdjustingFilters: "Попробуйте настроить фильтры",

      // Payment Methods
      cash: "Наличные",
      uzcard: "UzCard",
      humo: "Humo",
      click: "Click",

      // Settings
      settings: "Настройки",
      general: "Общие",
      appearance: "Внешний вид",
      filters: "Фильтры",
      data: "Данные",
      language: "Язык",
      theme: "Тема",
      light: "Светлая",
      dark: "Темная",
      system: "Системная",
      save: "Сохранить",
      cancel: "Отмена",
      reset: "Сброс",
      export: "Экспорт",
      import: "Импорт",
      resetSettings: "Сбросить настройки",
      exportSettings: "Экспорт настроек",
      importSettings: "Импорт настроек",

      // Common
      loadingApplication: "Загрузка приложения...",
      openStats: "Открыть статистику",
    },
  },
}

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    lng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  })

export default i18n
