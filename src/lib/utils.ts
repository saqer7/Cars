import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return "0 ILS"
  const val = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(val)) return "0 ILS"
  return `${Math.round(val)} ILS`
}
