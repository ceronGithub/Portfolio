import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Strips forbidden characters from any user input field.
// Blocked: < > < > / ; [ ] { } ! # ^ * & ( )
const FORBIDDEN = /[<>\/;[\]{}!#^*&()]/g;
export function sanitize(value: string): string {
  return value.replace(FORBIDDEN, "");
}