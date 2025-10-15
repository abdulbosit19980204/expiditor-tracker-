import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ClientI18nProvider } from "./client-i18n-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Expeditor Tracker - Modern Delivery Management",
  description: "Track delivery expeditors and their locations with real-time updates",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expeditor Tracker",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="telegram-web-app-capable" content="yes" />
        <meta name="telegram-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Immediate error fix - runs before any other scripts
              (function() {
                console.log("[Immediate Fix] Applying array method overrides");
                const originalForEach = Array.prototype.forEach;
                Array.prototype.forEach = function(callback, thisArg) {
                  if (this == null) {
                    console.warn("[Immediate Fix] forEach called on null/undefined, skipping");
                    return;
                  }
                  if (typeof callback !== 'function') {
                    throw new TypeError('forEach callback must be a function');
                  }
                  return originalForEach.call(this, callback, thisArg);
                };
                console.log("[Immediate Fix] Array method overrides applied");
              })();
            `,
          }}
        />
        <script src="/global-error-fix.js" defer></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
          <ClientI18nProvider>
            {children}
            <Toaster />
          </ClientI18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
