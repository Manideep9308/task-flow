
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string = ""): string {
  if (!name || typeof name !== 'string') return "";
  const parts = name.trim().split(' ');
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (parts.length > 1) {
    const firstInitial = parts[0][0] || "";
    const lastInitial = parts[parts.length - 1][0] || "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
