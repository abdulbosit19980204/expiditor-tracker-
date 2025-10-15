import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from "../components/error-boundary"
import simpleI18n from "@/lib/simple-i18n"

const inter = Inter({ subsets: ["latin"] })

const { I18nProvider } = simpleI18n

export const metadata: Metadata = {
  title: "Expeditor Tracker",
  description: "Track and manage expeditor deliveries",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <I18nProvider initialLocale="uz">{children}</I18nProvider>
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
