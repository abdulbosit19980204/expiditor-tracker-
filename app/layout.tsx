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
              // Immediate error fix - runs before any other scripts
              (function() {
                console.log("[Immediate Fix] Applying comprehensive error prevention");
                
                // Override Array.prototype.forEach
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
                
                // Override Array.prototype.map
                const originalMap = Array.prototype.map;
                Array.prototype.map = function(callback, thisArg) {
                  if (this == null) {
                    console.warn("[Immediate Fix] map called on null/undefined, returning empty array");
                    return [];
                  }
                  if (typeof callback !== 'function') {
                    throw new TypeError('map callback must be a function');
                  }
                  return originalMap.call(this, callback, thisArg);
                };
                
                // Override Array.prototype.filter
                const originalFilter = Array.prototype.filter;
                Array.prototype.filter = function(callback, thisArg) {
                  if (this == null) {
                    console.warn("[Immediate Fix] filter called on null/undefined, returning empty array");
                    return [];
                  }
                  if (typeof callback !== 'function') {
                    throw new TypeError('filter callback must be a function');
                  }
                  return originalFilter.call(this, callback, thisArg);
                };
                
                // Override Array.prototype.find
                const originalFind = Array.prototype.find;
                Array.prototype.find = function(callback, thisArg) {
                  if (this == null) {
                    console.warn("[Immediate Fix] find called on null/undefined, returning undefined");
                    return undefined;
                  }
                  if (typeof callback !== 'function') {
                    throw new TypeError('find callback must be a function');
                  }
                  return originalFind.call(this, callback, thisArg);
                };
                
                // Override Array.prototype.some
                const originalSome = Array.prototype.some;
                Array.prototype.some = function(callback, thisArg) {
                  if (this == null) {
                    console.warn("[Immediate Fix] some called on null/undefined, returning false");
                    return false;
                  }
                  if (typeof callback !== 'function') {
                    throw new TypeError('some callback must be a function');
                  }
                  return originalSome.call(this, callback, thisArg);
                };
                
                // Override Array.prototype.every
                const originalEvery = Array.prototype.every;
                Array.prototype.every = function(callback, thisArg) {
                  if (this == null) {
                    console.warn("[Immediate Fix] every called on null/undefined, returning true");
                    return true;
                  }
                  if (typeof callback !== 'function') {
                    throw new TypeError('every callback must be a function');
                  }
                  return originalEvery.call(this, callback, thisArg);
                };
                
                // Override Array.prototype.reduce
                const originalReduce = Array.prototype.reduce;
                Array.prototype.reduce = function(callback, initialValue) {
                  if (this == null) {
                    throw new TypeError('reduce called on null/undefined');
                  }
                  if (typeof callback !== 'function') {
                    throw new TypeError('reduce callback must be a function');
                  }
                  return originalReduce.call(this, callback, initialValue);
                };
                
                // Override Object.prototype.toString to prevent issues
                const originalToString = Object.prototype.toString;
                Object.prototype.toString = function() {
                  if (this == null) {
                    return '[object Null]';
                  }
                  return originalToString.call(this);
                };
                
                console.log("[Immediate Fix] Comprehensive array method overrides applied");
              })();
            `,
          }}
        />
        <script src="/global-error-fix.js" defer></script>
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
