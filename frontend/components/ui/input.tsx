// Client-side component directive
"use client"

import * as React from "react"

/**
 * Custom Input Component
 * 
 * A reusable input field component with consistent styling.
 * Provides a clean, modern appearance with focus states.
 * 
 * Features:
 * - Consistent border and rounded corners
 * - Blue focus ring when active
 * - Full width by default
 * - Supports all standard HTML input attributes
 * 
 * Usage:
 * - Text inputs: type="text", placeholder="Enter text"
 * - File inputs: type="file", accept=".pdf,.jpg"
 * - Any other input type with appropriate props
 * 
 * @param props - All standard HTML input attributes (type, placeholder, onChange, etc.)
 */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props} // Spread all passed props (type, value, onChange, etc.)
      className={`border border-gray-300 rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ""}`}
    />
  )
}