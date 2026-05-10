import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: Date | string, fmt = 'EEE, d MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM yyyy');
}

export function countNights(checkIn: Date, checkOut: Date): number {
  return differenceInDays(checkOut, checkIn);
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? 's' : ''}`;
}

// Star rating display
export function getStarRating(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}
