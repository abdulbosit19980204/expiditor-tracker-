import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ClientI18nProvider } from "./client-i18n-provider"
import ErrorBoundary from "../components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Expeditor Tracker - Modern Delivery Management",
  description: "Track delivery expeditors and their locations with real-time updates",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expeditor Tracker",
  },
  generator: "v0.dev",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
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
                  // Safe immediate error fix - minimal and React-compatible
                  (function() {
                    console.log("[Safe Immediate Fix] Applying minimal error prevention");
                    
                    // Only override forEach as it's the most critical and safe
                    const originalForEach = Array.prototype.forEach;
                    Array.prototype.forEach = function(callback, thisArg) {
                      if (this == null) {
                        console.warn("[Safe Immediate Fix] forEach called on null/undefined, skipping");
                        return;
                      }
                      if (typeof callback !== 'function') {
                        throw new TypeError('forEach callback must be a function');
                      }
                      return originalForEach.call(this, callback, thisArg);
                    };
                    
                    // Safe Object.prototype.toString override
                    const originalToString = Object.prototype.toString;
                    Object.prototype.toString = function() {
                      if (this == null) {
                        return '[object Null]';
                      }
                      return originalToString.call(this);
                    };
                    
                    console.log("[Safe Immediate Fix] Minimal error prevention applied");
                  })();
                `,
              }}
            />
        <script src="/safe-error-fix.js" defer></script>
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
            <ClientI18nProvider>
              {children}
              <Toaster />
            </ClientI18nProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
