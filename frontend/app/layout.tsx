import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/constants'
import { organizationSchema, localBusinessSchema, websiteSchema } from '@/lib/metadata'
import ThemeProvider from '@/components/shared/ThemeProvider'
import PublicChrome from '@/components/layout/PublicChrome'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.fullName} | ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.fullName}`,
  },
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.defaultKeywords.join(', '),
  authors: [{ name: SITE_CONFIG.name, url: SITE_CONFIG.url }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'en-KE': SITE_CONFIG.url,
      'x-default': SITE_CONFIG.url,
    },
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.fullName,
    title: `${SITE_CONFIG.fullName} | ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.fullName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.fullName} | ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: [`${SITE_CONFIG.url}/og-image.png`],
    site: SITE_CONFIG.twitterHandle,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent theme flashing */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = stored || (prefersDark ? 'dark' : 'light');
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema()),
          }}
        />
        {/* WebSite SearchAction Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema()),
          }}
        />
        {/* Local Business Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema()),
          }}
        />
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={SITE_CONFIG.apiUrl} />
      </head>
      <body className="font-sans antialiased bg-surface text-gray-900 transition-colors duration-300 ease-in-out">
        <ThemeProvider>
          <PublicChrome>
            {children}
          </PublicChrome>
        </ThemeProvider>
      </body>
    </html>
  )
}
