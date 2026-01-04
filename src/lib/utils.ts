import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import i18n from "./i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenUuid(uuid: string) {
  return uuid.replace("-", "").slice(0, 10);
}

export function formatCurrency(
  amount: number,
  locale = i18n.language,
  currency = "EGP",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
}

export function formatDate(dateString: string | Date, locale = i18n.language) {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
