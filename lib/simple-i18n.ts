// Simple i18n implementation to replace problematic i18next
// This avoids all the complex language detection that causes forEach errors

interface Translations {
  [key: string]: string
}

interface LanguageResources {
  [language: string]: {
    translation: Translations
  }
}

const resources: LanguageResources = {
  en: {
    translation: {
      // Common UI
      "loading": "Loading...",
      "error": "Error",
      "success": "Success",
      "cancel": "Cancel",
      "save": "Save",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "search": "Search",
      "filter": "Filter",
      "clear": "Clear",
      "refresh": "Refresh",
      "back": "Back",
      "next": "Next",
      "previous": "Previous",
      "close": "Close",
      "yes": "Yes",
      "no": "No",
      "ok": "OK",
      "confirm": "Confirm",
      "warning": "Warning",
      "info": "Info",
      "settings": "Settings",
      "profile": "Profile",
      "logout": "Logout",
      "login": "Login",
      "register": "Register",
      "home": "Home",
      "dashboard": "Dashboard",
      "statistics": "Statistics",
      "analytics": "Analytics",
      "reports": "Reports",
      "users": "Users",
      "products": "Products",
      "orders": "Orders",
      "payments": "Payments",
      "inventory": "Inventory",
      "warehouse": "Warehouse",
      "delivery": "Delivery",
      "tracking": "Tracking",
      "status": "Status",
      "date": "Date",
      "time": "Time",
      "amount": "Amount",
      "quantity": "Quantity",
      "total": "Total",
      "subtotal": "Subtotal",
      "tax": "Tax",
      "discount": "Discount",
      "price": "Price",
      "cost": "Cost",
      "profit": "Profit",
      "revenue": "Revenue",
      "expenses": "Expenses",
      "income": "Income",
      "balance": "Balance",
      "currency": "Currency",
      "language": "Language",
      "theme": "Theme",
      "dark": "Dark",
      "light": "Light",
      "auto": "Auto",
      "english": "English",
      "uzbek": "Uzbek",
      "russian": "Russian",
      
      // Expeditor Tracker specific translations
      "expeditorTracker": "Expeditor Tracker",
      "analyticsDashboard": "Analytics Dashboard",
      "dateRange": "Date Range",
      "advancedFilters": "Advanced Filters",
      "languageAndLocalization": "Language & Localization",
      "interfaceLanguage": "Interface Language",
      "defaultDateRange": "Default Date Range",
      "currentMonth": "Current Month",
      "lastWeek": "Last Week",
      "lastMonth": "Last Month",
      "customRange": "Custom Range",
    }
  },
  uz: {
    translation: {
      // Common UI
      "loading": "Yuklanmoqda...",
      "error": "Xatolik",
      "success": "Muvaffaqiyat",
      "cancel": "Bekor qilish",
      "save": "Saqlash",
      "delete": "O'chirish",
      "edit": "Tahrirlash",
      "add": "Qo'shish",
      "search": "Qidirish",
      "filter": "Filterlash",
      "clear": "Tozalash",
      "refresh": "Yangilash",
      "back": "Orqaga",
      "next": "Keyingi",
      "previous": "Oldingi",
      "close": "Yopish",
      "yes": "Ha",
      "no": "Yo'q",
      "ok": "OK",
      "confirm": "Tasdiqlash",
      "warning": "Ogohlantirish",
      "info": "Ma'lumot",
      "settings": "Sozlamalar",
      "profile": "Profil",
      "logout": "Chiqish",
      "login": "Kirish",
      "register": "Ro'yxatdan o'tish",
      "home": "Bosh sahifa",
      "dashboard": "Boshqaruv paneli",
      "statistics": "Statistika",
      "analytics": "Tahlil",
      "reports": "Hisobotlar",
      "users": "Foydalanuvchilar",
      "products": "Mahsulotlar",
      "orders": "Buyurtmalar",
      "payments": "To'lovlar",
      "inventory": "Inventar",
      "warehouse": "Ombor",
      "delivery": "Yetkazib berish",
      "tracking": "Kuzatish",
      "status": "Holat",
      "date": "Sana",
      "time": "Vaqt",
      "amount": "Miqdor",
      "quantity": "Soni",
      "total": "Jami",
      "subtotal": "Yig'indi",
      "tax": "Soliq",
      "discount": "Chegirma",
      "price": "Narx",
      "cost": "Xarajat",
      "profit": "Foyda",
      "revenue": "Daromad",
      "expenses": "Xarajatlar",
      "income": "Kirim",
      "balance": "Balans",
      "currency": "Valyuta",
      "language": "Til",
      "theme": "Mavzu",
      "dark": "Qorong'i",
      "light": "Yorug'",
      "auto": "Avto",
      "english": "Ingliz tili",
      "uzbek": "O'zbek tili",
      "russian": "Rus tili",
      
      // Expeditor Tracker specific translations
      "expeditorTracker": "Expeditor Tracker",
      "analyticsDashboard": "Analitika Dashboard",
      "dateRange": "Sana oralig'i",
      "advancedFilters": "Kengaytirilgan filterlar",
      "languageAndLocalization": "Til va lokalizatsiya",
      "interfaceLanguage": "Interfeys tili",
      "defaultDateRange": "Standart sana oralig'i",
      "currentMonth": "Joriy oy",
      "lastWeek": "O'tgan hafta",
      "lastMonth": "O'tgan oy",
      "customRange": "Maxsus oralik",
    }
  },
  ru: {
    translation: {
      // Common UI
      "loading": "Загрузка...",
      "error": "Ошибка",
      "success": "Успех",
      "cancel": "Отмена",
      "save": "Сохранить",
      "delete": "Удалить",
      "edit": "Редактировать",
      "add": "Добавить",
      "search": "Поиск",
      "filter": "Фильтр",
      "clear": "Очистить",
      "refresh": "Обновить",
      "back": "Назад",
      "next": "Далее",
      "previous": "Предыдущий",
      "close": "Закрыть",
      "yes": "Да",
      "no": "Нет",
      "ok": "OK",
      "confirm": "Подтвердить",
      "warning": "Предупреждение",
      "info": "Информация",
      "settings": "Настройки",
      "profile": "Профиль",
      "logout": "Выйти",
      "login": "Войти",
      "register": "Регистрация",
      "home": "Главная",
      "dashboard": "Панель управления",
      "statistics": "Статистика",
      "analytics": "Аналитика",
      "reports": "Отчеты",
      "users": "Пользователи",
      "products": "Продукты",
      "orders": "Заказы",
      "payments": "Платежи",
      "inventory": "Инвентарь",
      "warehouse": "Склад",
      "delivery": "Доставка",
      "tracking": "Отслеживание",
      "status": "Статус",
      "date": "Дата",
      "time": "Время",
      "amount": "Сумма",
      "quantity": "Количество",
      "total": "Итого",
      "subtotal": "Подытог",
      "tax": "Налог",
      "discount": "Скидка",
      "price": "Цена",
      "cost": "Стоимость",
      "profit": "Прибыль",
      "revenue": "Доход",
      "expenses": "Расходы",
      "income": "Доходы",
      "balance": "Баланс",
      "currency": "Валюта",
      "language": "Язык",
      "theme": "Тема",
      "dark": "Темная",
      "light": "Светлая",
      "auto": "Авто",
      "english": "Английский",
      "uzbek": "Узбекский",
      "russian": "Русский",
      
      // Expeditor Tracker specific translations
      "expeditorTracker": "Expeditor Tracker",
      "analyticsDashboard": "Панель аналитики",
      "dateRange": "Диапазон дат",
      "advancedFilters": "Расширенные фильтры",
      "languageAndLocalization": "Язык и локализация",
      "interfaceLanguage": "Язык интерфейса",
      "defaultDateRange": "Диапазон дат по умолчанию",
      "currentMonth": "Текущий месяц",
      "lastWeek": "Прошлая неделя",
      "lastMonth": "Прошлый месяц",
      "customRange": "Пользовательский диапазон",
    }
  },
}

class SimpleI18n {
  private currentLanguage: string = "en"
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.initializeLanguage()
  }

  private initializeLanguage() {
    try {
      if (typeof window !== "undefined") {
        const savedLang = localStorage.getItem("i18nextLng") || localStorage.getItem("language")
        if (savedLang && ["en", "uz", "ru"].includes(savedLang)) {
          this.currentLanguage = savedLang
        } else {
          this.currentLanguage = "en"
        }
      }
    } catch (error) {
      console.warn("[SimpleI18n] Failed to read saved language:", error)
      this.currentLanguage = "en"
    }
  }

  t(key: string, options?: any): string {
    const translation = resources[this.currentLanguage]?.translation[key] || 
                       resources.en.translation[key] || 
                       key
    
    // Simple interpolation
    if (options) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return options[variable] || match
      })
    }
    
    return translation
  }

  changeLanguage(lng: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (["en", "uz", "ru"].includes(lng)) {
          this.currentLanguage = lng
          
          // Save to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("i18nextLng", lng)
            localStorage.setItem("language", lng)
          }
          
          // Notify listeners
          this.listeners.forEach(listener => listener())
          
          console.log("[SimpleI18n] Language changed to:", lng)
        }
      } catch (error) {
        console.warn("[SimpleI18n] Language change failed:", error)
      }
      resolve()
    })
  }

  getLanguage(): string {
    return this.currentLanguage
  }

  onLanguageChanged(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  isInitialized(): boolean {
    return true
  }

  // Compatibility methods for i18next
  get language() {
    return this.currentLanguage
  }

  get isInitialized() {
    return true
  }
}

// Create singleton instance
const simpleI18n = new SimpleI18n()

export default simpleI18n

export const changeLanguage = (lng: string) => {
  return simpleI18n.changeLanguage(lng)
}

export const getCurrentLanguage = () => {
  return simpleI18n.getLanguage()
}

// Hook for React components
export const useTranslation = () => {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  
  React.useEffect(() => {
    const unsubscribe = simpleI18n.onLanguageChanged(() => {
      forceUpdate()
    })
    return unsubscribe
  }, [])
  
  return {
    t: simpleI18n.t.bind(simpleI18n),
    i18n: simpleI18n,
    changeLanguage: simpleI18n.changeLanguage.bind(simpleI18n),
  }
}

// Import React for the hook
import React from "react"
