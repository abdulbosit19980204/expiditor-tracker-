"use client"

import React, { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SmoothTransitionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

// Smooth fade in transition
export const FadeIn = memo<SmoothTransitionProps>(({ children, className, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

FadeIn.displayName = "FadeIn"

// Smooth slide in transition
export const SlideIn = memo<SmoothTransitionProps>(({ children, className, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

SlideIn.displayName = "SlideIn"

// Scale in transition for cards
export const ScaleIn = memo<SmoothTransitionProps>(({ children, className, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

ScaleIn.displayName = "ScaleIn"

// Staggered animation for lists
export const StaggeredList = memo<{
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}>(({ children, className, staggerDelay = 0.1 }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

StaggeredList.displayName = "StaggeredList"

// Individual item for staggered lists
export const StaggeredItem = memo<{
  children: React.ReactNode
  className?: string
}>(({ children, className }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

StaggeredItem.displayName = "StaggeredItem"

// Loading skeleton with animation
export const LoadingSkeleton = memo<{
  className?: string
  lines?: number
}>(({ className, lines = 3 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            delay: index * 0.1 
          }}
          className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"
        />
      ))}
    </div>
  )
})

LoadingSkeleton.displayName = "LoadingSkeleton"

// Smooth chart transition
export const ChartTransition = memo<{
  children: React.ReactNode
  className?: string
  dataLength?: number
}>(({ children, className, dataLength = 0 }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={dataLength} // Re-animate when data changes
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
})

ChartTransition.displayName = "ChartTransition"

// Hover animations for interactive elements
export const HoverScale = memo<{
  children: React.ReactNode
  className?: string
  scale?: number
}>(({ children, className, scale = 1.02 }) => {
  return (
    <motion.div
      whileHover={{ scale }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

HoverScale.displayName = "HoverScale"

// Smooth page transitions
export const PageTransition = memo<{
  children: React.ReactNode
  className?: string
}>(({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

PageTransition.displayName = "PageTransition"
