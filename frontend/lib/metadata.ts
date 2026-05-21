import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/constants'

interface MetadataOptions {
  title: string
  description: string
  path?: string
  image?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  keywords?: string[]
  noIndex?: boolean
}

export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  keywords = [],
  noIndex = false,
}: MetadataOptions): Metadata {
  const url = `${SITE_CONFIG.url}${path}`
  const ogImage = image || `${SITE_CONFIG.url}/og-image.png`

  const defaultKeywords = [
    'industrial chemicals Kenya',
    'chemical supplier East Africa',
    'water treatment chemicals Nairobi',
    'solvents Kenya',
    'industrial chemicals supplier',
    'Zenco Systems Ltd',
  ]

  return {
    title: `${title} | Zenco Systems Ltd – Chemical Division`,
    description,
    keywords: [...defaultKeywords, ...keywords].join(', '),
    authors: [{ name: 'Zenco Systems Ltd', url: SITE_CONFIG.url }],
    creator: 'Zenco Systems Ltd',
    publisher: 'Zenco Systems Ltd',
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
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
      title: `${title} | Zenco Systems Ltd`,
      description,
      url,
      siteName: SITE_CONFIG.fullName,
      type,
      locale: 'en_KE',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} – Zenco Systems Ltd`,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Zenco Systems Ltd`,
      description,
      images: [ogImage],
      site: '@zencosystems',
      creator: '@zencosystems',
    },
  }
}

// ─── Structured Data / Schema.org ─────────────────────────────────────────

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.fullName,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    description: SITE_CONFIG.description,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE_CONFIG.phone,
      contactType: 'customer service',
      areaServed: 'East Africa',
      availableLanguage: 'English',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressCountry: SITE_CONFIG.address.country,
      postalCode: SITE_CONFIG.address.postalCode,
    },
    sameAs: [
      SITE_CONFIG.social.linkedin,
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.twitter,
    ].filter(Boolean),
  }
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_CONFIG.fullName,
    url: SITE_CONFIG.url,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    description: SITE_CONFIG.description,
    priceRange: 'KES',
    currenciesAccepted: 'KES, USD',
    openingHours: 'Mo-Fr 08:00-17:00',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressCountry: 'KE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '-1.2921',
      longitude: '36.8219',
    },
  }
}

export function productSchema(product: {
  name: string
  description: string
  image?: string
  slug: string
  availability?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    url: `${SITE_CONFIG.url}/products/${product.slug}`,
    image: product.image || `${SITE_CONFIG.url}/og-image.png`,
    brand: {
      '@type': 'Brand',
      name: 'Zenco Systems Ltd',
    },
    offers: {
      '@type': 'Offer',
      availability:
        product.availability === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      priceCurrency: 'KES',
      seller: {
        '@type': 'Organization',
        name: SITE_CONFIG.fullName,
      },
    },
  }
}

export function breadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.href}`,
    })),
  }
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function articleSchema(post: {
  title: string
  excerpt: string
  slug: string
  image?: string
  publishedAt: string
  updatedAt: string
  authorName: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_CONFIG.url}/blog/${post.slug}`,
    image: post.image || `${SITE_CONFIG.url}/og-image.png`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.fullName,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
  }
}
