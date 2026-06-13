'use client'

/**
 * ─── WebVitalsReporter ───────────────────────────────────────────────────────
 *
 * Reports Core Web Vitals to Google Analytics 4:
 *   - LCP  — Largest Contentful Paint
 *   - INP  — Interaction to Next Paint
 *   - CLS  — Cumulative Layout Shift
 *   - FCP  — First Contentful Paint
 *   - TTFB — Time to First Byte
 *
 * Uses the Next.js built-in useReportWebVitals hook (App Router compatible).
 */

import { useReportWebVitals } from 'next/web-vitals'
import { trackWebVitals } from '@/lib/analytics'

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Forward all metrics to GA4
    trackWebVitals({
      id: metric.id,
      name: metric.name as 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB',
      value: metric.value,
      rating: metric.rating as 'good' | 'needs-improvement' | 'poor',
      delta: metric.delta,
      navigationType: metric.navigationType ?? 'navigate',
    })
  })

  // This component renders nothing — it's purely a side-effect hook
  return null
}
