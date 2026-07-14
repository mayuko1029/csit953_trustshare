// Utility libraries for CSS class manipulation
import { clsx, type ClassValue } from "clsx"  // Conditional class names
import { twMerge } from "tailwind-merge"       // Tailwind class merging

/**
 * Class Name Utility Function (cn)
 * 
 * Combines and merges CSS class names intelligently, especially useful for:
 * 1. Conditional classes based on state
 * 2. Merging default classes with override classes
 * 3. Resolving Tailwind CSS class conflicts
 * 
 * Examples:
 * cn("bg-red-500", "bg-blue-500") → "bg-blue-500" (blue wins)
 * cn("p-4", { "bg-red-500": isError }) → "p-4 bg-red-500" (if isError is true)
 * cn("text-sm", undefined, "font-bold") → "text-sm font-bold" (ignores undefined)
 * 
 * @param inputs - Array of class names, objects, or conditional expressions
 * @returns Merged and deduplicated class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}