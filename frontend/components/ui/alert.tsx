"use client"

import * as React from "react"

interface AlertProps {
  children: React.ReactNode
  variant?: "default" | "destructive"
  className?: string
}

export function Alert({ children, variant = "default", className }: AlertProps) {
  let classes = "p-3 border rounded-lg "
  
  if (variant === "destructive") {
    classes += "bg-red-100 border-red-300 "
  } else {
    classes += "bg-yellow-100 border-yellow-300 "
  }
  
  if (className) {
    classes += className
  }
  
  return <div className={classes.trim()}>{children}</div>
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-700">{children}</p>
}