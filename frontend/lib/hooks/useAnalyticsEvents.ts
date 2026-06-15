/**
 * ─── useAnalyticsEvents — Analytics Event Tracking Hook ──────────────────────
 *
 * Provides ready-to-use event tracking callbacks for components.
 * Memoised with useCallback to prevent unnecessary re-renders.
 *
 * Usage:
 *   const { trackWhatsAppClick, trackQuoteClick } = useAnalyticsEvents()
 *   <button onClick={() => trackWhatsAppClick('Sodium Hypochlorite')}>
 */

import { useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  trackLead,
  trackDownload,
  trackContactSubmission,
  trackProductView,
  trackProductSearch,
  trackEvent,
  type LeadType,
  type DownloadType,
  type ContactSubmissionType,
} from '@/lib/analytics'

export function useAnalyticsEvents() {
  const pathname = usePathname()

  // ── Lead Generation ────────────────────────────────────────────────────────

  const trackQuoteClick = useCallback(
    (productName?: string) => {
      trackLead('quote_button_clicked', { product_name: productName, page: pathname })
    },
    [pathname]
  )

  const trackContactClick = useCallback(
    (source?: string) => {
      trackLead('contact_button_clicked', { page: pathname, source })
    },
    [pathname]
  )

  const trackWhatsAppClick = useCallback(
    (productName?: string) => {
      trackLead('whatsapp_button_clicked', { product_name: productName, page: pathname })
    },
    [pathname]
  )

  const trackCallClick = useCallback(
    (productName?: string) => {
      trackLead('call_button_clicked', { product_name: productName, page: pathname })
    },
    [pathname]
  )

  const trackEmailClick = useCallback(
    (source?: string) => {
      trackLead('email_button_clicked', { page: pathname, source })
    },
    [pathname]
  )

  // ── Downloads ─────────────────────────────────────────────────────────────

  const trackSdsDownload = useCallback(
    (fileName: string, productName?: string) => {
      trackDownload(fileName, 'sds', productName)
    },
    []
  )

  const trackTdsDownload = useCallback(
    (fileName: string, productName?: string) => {
      trackDownload(fileName, 'tds', productName)
    },
    []
  )

  const trackBrochureDownload = useCallback(
    (fileName: string, productName?: string) => {
      trackDownload(fileName, 'brochure', productName)
    },
    []
  )

  const trackProductDatasheet = useCallback(
    (fileName: string, productName?: string) => {
      trackDownload(fileName, 'datasheet', productName)
    },
    []
  )

  // ── Form Submissions ──────────────────────────────────────────────────────

  const trackInquirySubmit = useCallback(
    (params?: { product_name?: string; inquiry_type?: string; company?: string; country?: string }) => {
      trackContactSubmission('inquiry_submitted', params)
    },
    []
  )

  const trackQuoteSubmit = useCallback(
    (params?: { product_name?: string; company?: string; country?: string }) => {
      trackContactSubmission('quote_request_submitted', params)
    },
    []
  )

  const trackContactFormSubmit = useCallback(
    (params?: { inquiry_type?: string }) => {
      trackContactSubmission('contact_form_submitted', params)
    },
    []
  )

  // ── Product Engagement ────────────────────────────────────────────────────

  const trackProductPageView = useCallback(
    (slug: string, name: string, category?: string) => {
      trackProductView(slug, name, category)
    },
    []
  )

  const trackSearch = useCallback(
    (query: string, resultsCount?: number) => {
      trackProductSearch(query, resultsCount)
    },
    []
  )

  return {
    // Lead generation
    trackQuoteClick,
    trackContactClick,
    trackWhatsAppClick,
    trackCallClick,
    trackEmailClick,

    // Downloads
    trackSdsDownload,
    trackTdsDownload,
    trackBrochureDownload,
    trackProductDatasheet,

    // Form submissions
    trackInquirySubmit,
    trackQuoteSubmit,
    trackContactFormSubmit,

    // Product
    trackProductPageView,
    trackSearch,

    // Raw access for custom events
    trackEvent,
  }
}
