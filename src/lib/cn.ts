import clsx, { type ClassValue } from "clsx";

/** Conditional className composition. The one allowed "utility" — explicitly named. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
