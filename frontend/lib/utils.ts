import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { appConfig } from '@/lib/config'

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a date string to human readable */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  })
}

/** Truncate text to N characters */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

/** Get initials from a name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Build full media URL */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '/images/placeholder.jpg'
  if (path.startsWith('http')) return path
  const base = appConfig.apiUrl.replace(/\/api\/?$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Format number with locale */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-KE').format(n)
}

/** Slugify a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Debounce a function */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/** Get WhatsApp chat URL */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const encoded = message ? encodeURIComponent(message) : ''
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}${encoded ? `?text=${encoded}` : ''}`
}

/** Star rating array */
export function getStarArray(rating: number): Array<'full' | 'empty'> {
  return Array.from({ length: 5 }, (_, i) => (i < rating ? 'full' : 'empty'))
}
