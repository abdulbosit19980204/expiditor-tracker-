import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      expeditorTracker: "Expeditor Tracker",
      statistics: "Statistics",
      home: "Home",

      // Main page
      selectExpeditor: "Select an expeditor to view checks",
      noChecksFound: "No checks found",
      tryAdjustingFilters: "Try adjusting the date range or filters",
      loadingChecks: "Loading checks...",
      loadingExpeditors: "Loading expeditors...",
      noExpeditorsFound: "No expeditors with checks found",
      tryChangingFilial: "Try changing the filial filter",

      // Filters
      dateRange: "Date Range",
      advancedFilters: "Advanced Filters",
      clearAllFilters: "Clear All Filters",
      searchExpeditors: "Search expeditors...",
      searchChecks: "Search checks...",

      // Filter options
      allFilials: "All Filials",
      allProjects: "All Projects",
      allWarehouses: "All Warehouses",
      allCities: "All Cities",
      allStatuses: "All Statuses",

      // Status
      delivered: "Delivered",
      pending: "Pending",
      failed: "Failed",

      // Statistics
      totalChecks: "Total Checks",
      totalSum: "Total Sum",
      today: "Today",
      successRate: "Success Rate",
      paymentMethods: "Payment Methods",
      topProjects: "Top Projects",
      topExpeditors: "Top Expeditors",
      topCities: "Top Cities",
      dailyStats: "Daily Statistics",

      // Payment methods
      cash: "Cash",
      uzcard: "UzCard",
      humo: "Humo",
      click: "Click",

      // Check details
      checks: "Checks",
      project: "Project",
      city: "City",
      kkm: "KKM",
      show: "Show",

      // Map
      mapPreviewUnavailable: "Map preview unavailable",
      willWorkInProduction: "Will work in production",
      failedToLoadMap: "Failed to load map",
      retry: "Retry",

      // Common
      loading: "Loading...",
      refresh: "Refresh",
      export: "Export",
      exportCSV: "Export CSV",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      open: "Open",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      view: "View",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
    },
  },
  uz: {
    translation: {
      // Navigation
      expeditorTracker: "Ekspeditor Kuzatuvchi",
      statistics: "Statistika",
      home: "Asosiy",

      // Main page
      selectExpeditor: "Cheklar ko'rish uchun ekspeditor tanlang",
      noChecksFound: "Cheklar topilmadi",
      tryAdjustingFilters: "Sana oralig'i yoki filtrlarni o'zgartiring",
      loadingChecks: "Cheklar yuklanmoqda...",
      loadingExpeditors: "Ekspeditorlar yuklanmoqda...",
      noExpeditorsFound: "Chekli ekspeditorlar topilmadi",
      tryChangingFilial: "Filial filtresini o'zgartiring",

      // Filters
      dateRange: "Sana Oralig'i",
      advancedFilters: "Kengaytirilgan Filtrlar",
      clearAllFilters: "Barcha Filtrlarni Tozalash",
      searchExpeditors: "Ekspeditorlarni qidirish...",
      searchChecks: "Cheklarni qidirish...",

      // Filter options
      allFilials: "Barcha Filiallar",
      allProjects: "Barcha Loyihalar",
      allWarehouses: "Barcha Omborlar",
      allCities: "Barcha Shaharlar",
      allStatuses: "Barcha Holatlar",

      // Status
      delivered: "Yetkazilgan",
      pending: "Kutilmoqda",
      failed: "Muvaffaqiyatsiz",

      // Statistics
      totalChecks: "Jami Cheklar",
      totalSum: "Jami Summa",
      today: "Bugun",
      successRate: "Muvaffaqiyat Darajasi",
      paymentMethods: "To'lov Usullari",
      topProjects: "Eng Yaxshi Loyihalar",
      topExpeditors: "Eng Yaxshi Ekspeditorlar",
      topCities: "Eng Yaxshi Shaharlar",
      dailyStats: "Kunlik Statistika",

      // Payment methods
      cash: "Naqd",
      uzcard: "UzCard",
      humo: "Humo",
      click: "Click",

      // Check details
      checks: "Cheklar",
      project: "Loyiha",
      city: "Shahar",
      kkm: "KKM",
      show: "Ko'rsatish",

      // Map
      mapPreviewUnavailable: "Xarita ko'rinishi mavjud emas",
      willWorkInProduction: "Ishlab chiqarishda ishlaydi",
      failedToLoadMap: "Xaritani yuklashda xatolik",
      retry: "Qayta urinish",

      // Common
      loading: "Yuklanmoqda...",
      refresh: "Yangilash",
      export: "Eksport",
      exportCSV: "CSV Eksport",
      save: "Saqlash",
      cancel: "Bekor qilish",
      close: "Yopish",
      open: "Ochish",
      search: "Qidirish",
      filter: "Filtr",
      sort: "Saralash",
      view: "Ko'rish",
      edit: "Tahrirlash",
      delete: "O'chirish",
      confirm: "Tasdiqlash",
      yes: "Ha",
      no: "Yo'q",
    },
  },
  ru: {
    translation: {
      // Navigation
      expeditorTracker: "Отслеживание Экспедиторов",
      statistics: "Статистика",
      home: "Главная",

      // Main page
      selectExpeditor: "Выберите экспедитора для просмотра чеков",
      noChecksFound: "Чеки не найдены",
      tryAdjustingFilters: "Попробуйте изменить диапазон дат или фильтры",
      loadingChecks: "Загрузка чеков...",
      loadingExpeditors: "Загрузка экспедиторов...",
      noExpeditorsFound: "Экспедиторы с чеками не найдены",
      tryChangingFilial: "Попробуйте изменить фильтр филиала",

      // Filters
      dateRange: "Диапазон Дат",
      advancedFilters: "Расширенные Фильтры",
      clearAllFilters: "Очистить Все Фильтры",
      searchExpeditors: "Поиск экспедиторов...",
      searchChecks: "Поиск чеков...",

      // Filter options
      allFilials: "Все Филиалы",
      allProjects: "Все Проекты",
      allWarehouses: "Все Склады",
      allCities: "Все Города",
      allStatuses: "Все Статусы",

      // Status
      delivered: "Доставлено",
      pending: "В Ожидании",
      failed: "Неудачно",

      // Statistics
      totalChecks: "Всего Чеков",
      totalSum: "Общая Сумма",
      today: "Сегодня",
      successRate: "Успешность",
      paymentMethods: "Способы Оплаты",
      topProjects: "Топ Проекты",
      topExpeditors: "Топ Экспедиторы",
      topCities: "Топ Города",
      dailyStats: "Ежедневная Статистика",

      // Payment methods
      cash: "Наличные",
      uzcard: "UzCard",
      humo: "Humo",
      click: "Click",

      // Check details
      checks: "Чеки",
      project: "Проект",
      city: "Город",
      kkm: "ККМ",
      show: "Показать",

      // Map
      mapPreviewUnavailable: "Предварительный просмотр карты недоступен",
      willWorkInProduction: "Будет работать в продакшене",
      failedToLoadMap: "Ошибка загрузки карты",
      retry: "Повторить",

      // Common
      loading: "Загрузка...",
      refresh: "Обновить",
      export: "Экспорт",
      exportCSV: "Экспорт CSV",
      save: "Сохранить",
      cancel: "Отмена",
      close: "Закрыть",
      open: "Открыть",
      search: "Поиск",
      filter: "Фильтр",
      sort: "Сортировка",
      view: "Просмотр",
      edit: "Редактировать",
      delete: "Удалить",
      confirm: "Подтвердить",
      yes: "Да",
      no: "Нет",
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    // Save language preference
    saveMissing: false,
  })

export default i18n

export const changeLanguage = (lng: string) => {
  if (typeof window !== "undefined" && i18n.isInitialized) {
    return i18n.changeLanguage(lng)
  }
  return Promise.resolve()
}

export const getCurrentLanguage = () => {
  if (typeof window !== "undefined" && i18n.isInitialized) {
    return i18n.language || "en"
  }
  return "en"
}
