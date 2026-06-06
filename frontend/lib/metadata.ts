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

  return {
    title: `${title} | ${SITE_CONFIG.fullName}`,
    description,
    keywords: [...SITE_CONFIG.defaultKeywords, ...keywords].join(', '),
    authors: [{ name: SITE_CONFIG.name, url: SITE_CONFIG.url }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
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
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      url,
      siteName: SITE_CONFIG.fullName,
      type: type === 'product' ? 'website' : type,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} - ${SITE_CONFIG.name}`,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      images: [ogImage],
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
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
      areaServed: SITE_CONFIG.serviceArea,
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
      SITE_CONFIG.social.instagram,
      SITE_CONFIG.social.tiktok,
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
    priceRange: SITE_CONFIG.currency,
    currenciesAccepted: SITE_CONFIG.acceptedCurrencies,
    openingHours: SITE_CONFIG.openingHours,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressCountry: SITE_CONFIG.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.coordinates.latitude,
      longitude: SITE_CONFIG.coordinates.longitude,
    },
  }
}

export function productSchema(product: {
  name: string
  description: string
  image?: string
  slug: string
  availability?: string
  sku?: string
  mpn?: string
  category_name?: string
  specifications?: Record<string, string>
}) {
  const specProperties = product.specifications
    ? Object.entries(product.specifications).map(([key, value]) => ({
        '@type': 'PropertyValue',
        name: key,
        value: value,
      }))
    : []

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    url: `${SITE_CONFIG.url}/products/${product.slug}`,
    image: product.image || `${SITE_CONFIG.url}/og-image.png`,
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    sku: product.sku || `ZNC-${product.slug.toUpperCase().slice(0, 8)}`,
    mpn: product.mpn || `MPN-${product.slug.toUpperCase().slice(0, 8)}`,
    category: product.category_name || 'Industrial Chemicals',
    ...(specProperties.length > 0 && { additionalProperty: specProperties }),
    offers: {
      '@type': 'Offer',
      price: '0.00', // quote required
      priceCurrency: SITE_CONFIG.currency,
      priceValidUntil: '2027-12-31',
      availability:
        product.availability === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${SITE_CONFIG.url}/products/${product.slug}`,
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

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function collectionPageSchema(name: string, description: string, path: string, items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${SITE_CONFIG.url}${path}`,
    mainEntity: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    },
  }
}
