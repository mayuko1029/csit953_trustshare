"use client"

import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function Button({
  children,
  variant = "default",
  size = "default",
  className,
  ...props
}: ButtonProps) {
  let baseClasses =
    "inline-flex items-center justify-center rounded-xl transition-colors font-medium disabled:opacity-50 disabled:pointer-events-none"

  if (size === "sm") {
    baseClasses += " px-3 py-1.5 text-sm"
  } else if (size === "lg") {
    baseClasses += " px-6 py-3 text-lg"
  } else {
    baseClasses += " px-4 py-2"
  }

  let variantClasses = ""
  if (variant === "outline") {
    variantClasses =
      "border-2 border-blue-600 text-blue-700 hover:bg-blue-50 bg-transparent"
  } else if (variant === "ghost") {
    variantClasses = "text-slate-600 hover:bg-slate-100 bg-transparent"
  } else {
    variantClasses =
      "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-md shadow-blue-600/20"
  }

  return (
    <button {...props} className={`${baseClasses} ${variantClasses} ${className || ""}`}>
      {children}
    </button>
  )
}
