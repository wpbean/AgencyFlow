import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Normalizes an empty/undefined string to null, for storing optional text columns. */
export function emptyToNull(value: string | undefined | null): string | null {
  return value ? value : null;
}
