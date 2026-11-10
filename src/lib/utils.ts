import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind klasslarini xavfsiz birlashtiradi (shadcn/ui konvensiyasi). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
