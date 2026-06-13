/**
 * ─── Zenco Systems — Google Analytics 4 Utility Library ──────────────────────
 *
 * Reusable TypeScript helpers for tracking:
 *  - Page views (App Router compatible)
 *  - Custom events (lead gen, downloads, product engagement)
 *  - Contact & quote form submissions
 *  - Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
 *
 * Measurement ID: G-8Y7DM8PE44  (read from NEXT_PUBLIC_GA_ID)
 */

// ─── GA4 Measurement ID ───────────────────────────────────────────────────────

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ''

// ─── TypeScript Types ────────────────────────────────────────────────────────

type GTagCommand = 'config' | 'event' | 'js' | 'set' | 'consent'

interface GTagEventParams {
  [key: string]: string | number | boolean | undefined | null
}

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: (command: GTagCommand, target: string, params?: GTagEventParams) => void
    dataLayer: unknown[]
  }
}

// ─── Guard: only fire if GA is loaded & not in development ───────────────────

function isGAReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    !!GA_ID
  )
}

// ─── Page View ────────────────────────────────────────────────────────────────

/**
 * Track a page view. Called automatically by GoogleAnalytics component on route change.
 * @param url   - Full URL path (e.g. '/products/sodium-hypochlorite')
 * @param title - Document title
 */
export function trackPageView(url: string, title?: string): void {
  if (!isGAReady()) return
  window.gtag('config', GA_ID, {
    page_path: url,
    page_title: title || document.title,
    page_location: window.location.href,
  })
}

// ─── Generic Event ────────────────────────────────────────────────────────────

/**
 * Fire a generic GA4 custom event.
 * @param eventName - GA4 event name (snake_case recommended)
 * @param params    - Optional event parameters
 */
export function trackEvent(eventName: string, params?: GTagEventParams): void {
  if (!isGAReady()) return
  window.gtag('event', eventName, params)
}

// ─── Lead Generation Events ──────────────────────────────────────────────────

export type LeadType =
  | 'quote_button_clicked'
  | 'contact_button_clicked'
  | 'whatsapp_button_clicked'
  | 'call_button_clicked'
  | 'email_button_clicked'

/**
 * Track a lead generation interaction (button clicks that initiate contact).
 */
export function trackLead(
  type: LeadType,
  params?: { product_name?: string; page?: string; source?: string }
): void {
  trackEvent('generate_lead', {
    lead_type: type,
    product_name: params?.product_name || undefined,
    page: params?.page || (typeof window !== 'undefined' ? window.location.pathname : undefined),
    source: params?.source || undefined,
  })

  // Also fire the specific named event for granular GA4 reports
  trackEvent(type, {
    product_name: params?.product_name || undefined,
    page: params?.page || (typeof window !== 'undefined' ? window.location.pathname : undefined),
  })
}

// ─── Contact Form Submission ──────────────────────────────────────────────────

export type ContactSubmissionType =
  | 'contact_form_submitted'
  | 'quote_request_submitted'
  | 'inquiry_submitted'

/**
 * Track a contact / inquiry form submission.
 */
export function trackContactSubmission(
  type: ContactSubmissionType,
  params?: {
    product_name?: string
    inquiry_type?: string
    company?: string
    country?: string
  }
): void {
  trackEvent(type, {
    product_name: params?.product_name || undefined,
    inquiry_type: params?.inquiry_type || undefined,
    company: params?.company || undefined,
    country: params?.country || undefined,
  })

  // GA4 recommended conversion event
  trackEvent('conversion', {
    send_to: GA_ID,
    event_category: 'contact',
    event_label: type,
  })
}

// ─── Product Engagement ───────────────────────────────────────────────────────

/**
 * Track a product page view.
 */
export function trackProductView(
  slug: string,
  name: string,
  category?: string
): void {
  trackEvent('product_viewed', {
    product_slug: slug,
    product_name: name,
    category: category || undefined,
  })

  // GA4 ecommerce-style view_item event (for future GA4 ecommerce reporting)
  trackEvent('view_item', {
    item_id: slug,
    item_name: name,
    item_category: category || undefined,
  })
}

/**
 * Track a product search query.
 */
export function trackProductSearch(query: string, results_count?: number): void {
  trackEvent('product_search', {
    search_term: query,
    results_count: results_count ?? undefined,
  })

  // GA4 recommended search event
  trackEvent('search', { search_term: query })
}

// ─── Download Events ─────────────────────────────────────────────────────────

export type DownloadType =
  | 'sds'             // Safety Data Sheet
  | 'tds'             // Technical Data Sheet
  | 'brochure'
  | 'datasheet'
  | 'certificate'
  | 'other'

/**
 * Track a document download.
 */
export function trackDownload(
  fileName: string,
  fileType: DownloadType,
  productName?: string
): void {
  trackEvent('file_download', {
    file_name: fileName,
    file_type: fileType,
    product_name: productName || undefined,
    link_text: `${fileType.toUpperCase()} Download`,
  })

  // Specific named events for granular reporting
  const eventMap: Record<DownloadType, string> = {
    sds: 'sds_download',
    tds: 'tds_download',
    brochure: 'brochure_download',
    datasheet: 'datasheet_download',
    certificate: 'certificate_download',
    other: 'document_download',
  }
  trackEvent(eventMap[fileType], {
    file_name: fileName,
    product_name: productName || undefined,
  })
}

// ─── Core Web Vitals → GA4 ───────────────────────────────────────────────────

export interface WebVitalMetric {
  id: string
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: string
}

/**
 * Send Web Vitals metrics to GA4.
 * Called from the Next.js `reportWebVitals` export or a `useReportWebVitals` hook.
 */
export function trackWebVitals(metric: WebVitalMetric): void {
  if (!isGAReady()) return
  window.gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true,
    metric_rating: metric.rating,
    metric_delta: Math.round(metric.delta),
    metric_navigation_type: metric.navigationType,
  })
}

// ─── Consent Management ──────────────────────────────────────────────────────

/**
 * Update GA4 consent state. Call this after user grants/denies cookie consent.
 */
export function updateConsent(granted: boolean): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  } as GTagEventParams)
}
