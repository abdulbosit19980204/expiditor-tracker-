"use client"

import React, { memo } from "react"

interface SmoothTransitionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

// Smooth fade in transition (CSS-based for React 19 compatibility)
export const FadeIn = memo<SmoothTransitionProps>(({ children, className, delay = 0 }) => {
  return (
    <div
      className={`transition-all duration-300 ease-out opacity-0 animate-fade-in ${className || ''}`}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {children}
    </div>
  )
})

FadeIn.displayName = "FadeIn"

// Smooth slide in transition (CSS-based for React 19 compatibility)
export const SlideIn = memo<SmoothTransitionProps>(({ children, className, delay = 0 }) => {
  return (
    <div
      className={`transition-all duration-400 ease-out opacity-0 transform -translate-x-4 animate-slide-in ${className || ''}`}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {children}
    </div>
  )
})

SlideIn.displayName = "SlideIn"

// Scale in transition for cards (CSS-based for React 19 compatibility)
export const ScaleIn = memo<SmoothTransitionProps>(({ children, className, delay = 0 }) => {
  return (
    <div
      className={`transition-all duration-300 ease-out opacity-0 transform scale-95 animate-scale-in ${className || ''}`}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {children}
    </div>
  )
})

ScaleIn.displayName = "ScaleIn"

// Staggered animation for lists (CSS-based for React 19 compatibility)
export const StaggeredList = memo<{
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}>(({ children, className, staggerDelay = 0.1 }) => {
  return (
    <div className={`staggered-list ${className || ''}`}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="staggered-item opacity-0 transform translate-y-4 transition-all duration-300 ease-out"
          style={{ 
            animationDelay: `${index * staggerDelay * 1000}ms`,
            animationFillMode: 'forwards',
            animationName: 'fadeInUp'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
})

StaggeredList.displayName = "StaggeredList"

// Individual item for staggered lists
export const StaggeredItem = memo<{
  children: React.ReactNode
  className?: string
}>(({ children, className }) => {
  return (
    <div className={`transition-all duration-300 ease-out ${className || ''}`}>
      {children}
    </div>
  )
})

StaggeredItem.displayName = "StaggeredItem"

// Loading skeleton with animation (CSS-based for React 19 compatibility)
export const LoadingSkeleton = memo<{
  className?: string
  lines?: number
}>(({ className, lines = 3 }) => {
  return (
    <div className={`animate-pulse ${className || ''}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2 animate-skeleton-pulse"
          style={{ 
            animationDelay: `${index * 100}ms`,
            animationDuration: '1.5s',
            animationIterationCount: 'infinite'
          }}
        />
      ))}
    </div>
  )
})

LoadingSkeleton.displayName = "LoadingSkeleton"

// Smooth chart transition (CSS-based for React 19 compatibility)
export const ChartTransition = memo<{
  children: React.ReactNode
  className?: string
  dataLength?: number
}>(({ children, className, dataLength = 0 }) => {
  return (
    <div
      key={dataLength} // Re-animate when data changes
      className={`transition-all duration-400 ease-in-out opacity-0 transform scale-95 animate-chart-in ${className || ''}`}
      style={{ animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  )
})

ChartTransition.displayName = "ChartTransition"

// Hover animations for interactive elements (CSS-based for React 19 compatibility)
export const HoverScale = memo<{
  children: React.ReactNode
  className?: string
  scale?: number
}>(({ children, className, scale = 1.02 }) => {
  return (
    <div
      className={`transition-transform duration-200 ease-out hover:scale-105 ${className || ''}`}
      style={{ '--hover-scale': scale } as React.CSSProperties}
    >
      {children}
    </div>
  )
})

HoverScale.displayName = "HoverScale"

// Smooth page transitions (CSS-based for React 19 compatibility)
export const PageTransition = memo<{
  children: React.ReactNode
  className?: string
}>(({ children, className }) => {
  return (
    <div
      className={`transition-all duration-500 ease-in-out opacity-0 transform translate-y-4 animate-page-in ${className || ''}`}
      style={{ animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  )
})

PageTransition.displayName = "PageTransition"