"use client"

import * as React from "react"

export function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const baseClasses = "p-5 sm:p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50"
  return <div className={className ? `${baseClasses} ${className}` : baseClasses}>{children}</div>
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const baseClasses = "mb-4"
  return <div className={className ? `${baseClasses} ${className}` : baseClasses}>{children}</div>
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const baseClasses = "text-slate-500 text-sm mt-1"
  return <p className={className ? `${baseClasses} ${className}` : baseClasses}>{children}</p>
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const baseClasses = "text-xl sm:text-2xl font-semibold text-slate-900"
  return <h2 className={className ? `${baseClasses} ${className}` : baseClasses}>{children}</h2>
}
