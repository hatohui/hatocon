import { QUOTES } from "@/config/app";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function durationLabel(start: Date, end: Date) {
  const days = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return days === 1 ? "1 day" : `${days} days`;
}

export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
