// Client-side component directive
"use client"

import * as React from "react"

/**
 * Card Component System
 * 
 * A collection of components that work together to create card-based layouts.
 * Cards are commonly used to group related content in a visually appealing way.
 * 
 * Component Structure:
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title Here</CardTitle>
 *     <CardDescription>Description here</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Main content goes here
 *   </CardContent>
 * </Card>
 */

/**
 * Main Card Container
 * Provides the outer wrapper with background, padding, and shadow
 */
export function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  const baseClasses = "p-4 bg-white rounded-2xl shadow"
  return <div className={className ? `${baseClasses} ${className}` : baseClasses}>{children}</div>
}

/**
 * Card Header Section
 * Contains the title and description, positioned at the top of the card
 */
export function CardHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  const baseClasses = "mb-2 font-semibold"
  return <div className={className ? `${baseClasses} ${className}` : baseClasses}>{children}</div>
}

/**
 * Card Content Section
 * Contains the main body content of the card
 */
export function CardContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={className}>{children}</div>
}

/**
 * Card Description
 * Subtitle or description text, usually placed under the title
 */
export function CardDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  const baseClasses = "text-gray-500 text-sm"
  return <p className={className ? `${baseClasses} ${className}` : baseClasses}>{children}</p>
}

/**
 * Card Title
 * Main heading for the card content
 */
export function CardTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  const baseClasses = "text-lg font-bold"
  return <h2 className={className ? `${baseClasses} ${className}` : baseClasses}>{children}</h2>
}