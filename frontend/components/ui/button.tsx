// Client-side component directive
"use client"

import * as React from "react"

/**
 * Custom Button Component
 * 
 * A reusable button component with consistent styling across the app.
 * Uses Tailwind CSS classes for styling and supports all standard button props.
 * 
 * Features:
 * - Multiple variants (default, outline, ghost)
 * - Multiple sizes (default, sm, lg)
 * - Smooth transitions
 * - Accepts all standard HTML button attributes
 * - Allows custom className overrides
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function Button({ children, variant = "default", size = "default", className, ...props }: ButtonProps) {
  let baseClasses = "rounded-xl transition-colors font-medium"
  
  // Size variants
  if (size === "sm") {
    baseClasses += " px-3 py-1.5 text-sm"
  } else if (size === "lg") {
    baseClasses += " px-6 py-3 text-lg"
  } else {
    baseClasses += " px-4 py-2"
  }
  
  // Variant styles
  let variantClasses = ""
  if (variant === "outline") {
    variantClasses = "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
  } else if (variant === "ghost") {
    variantClasses = "text-gray-600 hover:bg-gray-100 bg-transparent"
  } else {
    variantClasses = "bg-blue-600 text-white hover:bg-blue-700"
  }
  
  const finalClasses = `${baseClasses} ${variantClasses} ${className || ""}`
  
  return (
    <button
      {...props}
      className={finalClasses}
    >
      {children}
    </button>
  )
}