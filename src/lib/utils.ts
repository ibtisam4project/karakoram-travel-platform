import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency strictly in Pakistani Rupees (PKR)
 * Format: "PKR 45,000"
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount == null) return "PKR 0"
  return `PKR ${amount.toLocaleString("en-PK")}`
}

/**
 * Validates Pakistani mobile phone numbers (+92 3XX XXXXXXX or 03XXXXXXXXX)
 */
export function validatePakistaniPhone(phone: string): boolean {
  const sanitized = phone.replace(/[\s-]/g, "")
  const regex = /^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/
  return regex.test(sanitized)
}
