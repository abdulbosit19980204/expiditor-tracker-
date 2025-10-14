import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

const resources = {
  en: {
    translation: {
      // Navigation
      home: "Home",
      statistics: "Statistics",

      // Expeditor Tracker
      expeditorTracker: "Expeditor Tracker",
      searchExpeditors: "Search expeditors...",
      selectExpeditor: "Select an expeditor to view their checks",
      noExpeditors: "No expeditors found",

      // Filters
      filters: "Filters",
      dateRange: "Date Range",
      filial: "Filial",
      allFilials: "All Filials",
      status: "Status",
      allStatuses: "All Statuses",
      delivered: "Delivered",
      pending: "Pending",
      failed: "Failed",

      // Statistics
      totalChecks: "Total Checks",
      totalSum: "Total Sum",
      avgCheckSum: "Avg Check",
      successRate: "Success Rate",

      // Actions
      refresh: "Refresh",
      export: "Export",
      loading: "Loading...",

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
    },
  },
  uz: {
    translation: {
      // Navigation
      home: "Bosh sahifa",
      statistics: "Statistika",

      // Expeditor Tracker
      expeditorTracker: "Ekspeditor Kuzatuvi",
      searchExpeditors: "Ekspeditorlarni qidirish...",
      selectExpeditor: "Cheklar uchun ekspeditorni tanlang",
      noExpeditors: "Ekspeditorlar topilmadi",

      // Filters
      filters: "Filterlar",
      dateRange: "Sana oralig'i",
      filial: "Filial",
      allFilials: "Barcha filiallar",
      status: "Holat",
      allStatuses: "Barcha holatlar",
      delivered: "Yetkazildi",
      pending: "Kutilmoqda",
      failed: "Muvaffaqiyatsiz",

      // Statistics
      totalChecks: "Jami cheklar",
      totalSum: "Jami summa",
      avgCheckSum: "O'rtacha chek",
      successRate: "Muvaffaqiyat darajasi",

      // Actions
      refresh: "Yangilash",
      export: "Eksport",
      loading: "Yuklanmoqda...",

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
    },
  },
  ru: {
    translation: {
      // Navigation
      home: "Главная",
      statistics: "Статистика",

      // Expeditor Tracker
      expeditorTracker: "Отслеживание экспедиторов",
      searchExpeditors: "Поиск экспедиторов...",
      selectExpeditor: "Выберите экспедитора для просмотра чеков",
      noExpeditors: "Экспедиторы не найдены",

      // Filters
      filters: "Фильтры",
      dateRange: "Диапазон дат",
      filial: "Филиал",
      allFilials: "Все филиалы",
      status: "Статус",
      allStatuses: "Все статусы",
      delivered: "Доставлено",
      pending: "В ожидании",
      failed: "Не удалось",

      // Statistics
      totalChecks: "Всего чеков",
      totalSum: "Общая сумма",
      avgCheckSum: "Средний чек",
      successRate: "Процент успеха",

      // Actions
      refresh: "Обновить",
      export: "Экспорт",
      loading: "Загрузка...",

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
    },
  },
}

// Only initialize in browser environment
if (typeof window !== "undefined") {
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
}

export default i18n
