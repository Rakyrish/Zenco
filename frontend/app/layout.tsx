import type { Metadata } from 'next'
import { Inter, Alice } from 'next/font/google'
import { SITE_CONFIG } from '@/lib/constants'
import { organizationSchema, localBusinessSchema } from '@/lib/metadata'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ChatbotWidget from '@/components/shared/ChatbotWidget'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const alice = Alice({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-alice',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.fullName} | Industrial Chemical Supplier in Kenya`,
    template: `%s | Zenco Systems Ltd – Chemical Division`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    'industrial chemicals Kenya',
    'chemical supplier Nairobi',
    'water treatment chemicals East Africa',
    'solvents Kenya',
    'paints coatings Kenya',
    'agricultural chemicals Kenya',
    'industrial cleaning chemicals',
    'Zenco Systems Ltd',
    'chemical division Kenya',
    'bulk chemicals supplier',
  ].join(', '),
  authors: [{ name: 'Zenco Systems Ltd', url: SITE_CONFIG.url }],
  creator: 'Zenco Systems Ltd',
  publisher: 'Zenco Systems Ltd',
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
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.fullName,
    title: `${SITE_CONFIG.fullName} | Industrial Chemical Supplier`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Zenco Systems Ltd – Chemical Division',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.fullName} | Industrial Chemicals`,
    description: SITE_CONFIG.description,
    images: [`${SITE_CONFIG.url}/og-image.png`],
    site: '@zencosystems',
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
    <html lang="en" className={`${inter.variable} ${alice.variable}`}>
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
      <body className="font-sans antialiased bg-surface dark:bg-[#070619] text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <Header />
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        <Footer />
        <ChatbotWidget />
      </body>
    </html>
  )
}
