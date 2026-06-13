'use client'

/**
 * ─── GoogleAnalytics — Global GA4 Script Component ────────────────────────────
 *
 * Injects the gtag.js script once into the document (singleton pattern).
 * Tracks route changes in Next.js App Router via usePathname().
 *
 * Usage: Place inside <head> of root layout.tsx
 */

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { GA_ID, trackPageView } from '@/lib/analytics'

export default function GoogleAnalytics() {
  const pathname = usePathname()

  // Track page view on every client-side navigation (App Router)
  useEffect(() => {
    if (!GA_ID || !pathname) return
    trackPageView(pathname, document.title)
  }, [pathname])

  // Don't inject script if no GA_ID is configured
  if (!GA_ID) return null

  return (
    <>
      {/* Preconnect for performance — loaded before the script */}
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://www.google-analytics.com" />

      {/* Google tag (gtag.js) — afterInteractive avoids blocking hydration */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
        id="ga4-script"
      />

      {/* Inline configuration script */}
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Default consent — update after user grants permission if using CMP
            gtag('consent', 'default', {
              analytics_storage: 'granted'
            });

            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
              send_page_view: false,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  )
}
