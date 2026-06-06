import type { NextConfig } from 'next'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

const rootEnvPath = path.resolve(process.cwd(), '..', '.env')

function readRootEnvValue(key: string) {
  if (!existsSync(rootEnvPath)) return ''

  const line = readFileSync(rootEnvPath, 'utf8')
    .split(/\r?\n/)
    .find(entry => entry.startsWith(`${key}=`))

  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') || ''
}

function publicEnv(publicKey: string, rootKey = publicKey) {
  return readRootEnvValue(rootKey) || process.env[publicKey] || ''
}

const apiUrl = publicEnv('NEXT_PUBLIC_API_URL').replace(/\/$/, '')
const mediaUrl = new URL(apiUrl.replace(/\/api\/?$/, ''))
const apiOrigin = mediaUrl.origin
const allowedDevOrigins = (readRootEnvValue('NEXT_ALLOWED_DEV_ORIGINS') || process.env.NEXT_ALLOWED_DEV_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  // Strict mode for better DX
  reactStrictMode: true,
  allowedDevOrigins,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_SITE_URL: publicEnv('NEXT_PUBLIC_SITE_URL', 'SITE_URL'),
    NEXT_PUBLIC_COMPANY_NAME: publicEnv('NEXT_PUBLIC_COMPANY_NAME', 'COMPANY_NAME'),
    NEXT_PUBLIC_COMPANY_DIVISION: publicEnv('NEXT_PUBLIC_COMPANY_DIVISION', 'COMPANY_DIVISION'),
    NEXT_PUBLIC_COMPANY_FULL_NAME: publicEnv('NEXT_PUBLIC_COMPANY_FULL_NAME', 'COMPANY_FULL_NAME'),
    NEXT_PUBLIC_COMPANY_TAGLINE: publicEnv('NEXT_PUBLIC_COMPANY_TAGLINE', 'COMPANY_TAGLINE'),
    NEXT_PUBLIC_COMPANY_DESCRIPTION: publicEnv('NEXT_PUBLIC_COMPANY_DESCRIPTION', 'COMPANY_DESCRIPTION'),
    NEXT_PUBLIC_PHONE_NUMBER: publicEnv('NEXT_PUBLIC_PHONE_NUMBER', 'COMPANY_PHONE_NUMBER'),
    NEXT_PUBLIC_WHATSAPP_NUMBER: publicEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', 'COMPANY_WHATSAPP_NUMBER'),
    NEXT_PUBLIC_COMPANY_EMAIL: publicEnv('NEXT_PUBLIC_COMPANY_EMAIL', 'COMPANY_EMAIL'),
    NEXT_PUBLIC_COMPANY_STREET_ADDRESS: publicEnv('NEXT_PUBLIC_COMPANY_STREET_ADDRESS', 'COMPANY_STREET_ADDRESS'),
    NEXT_PUBLIC_COMPANY_CITY: publicEnv('NEXT_PUBLIC_COMPANY_CITY', 'COMPANY_CITY'),
    NEXT_PUBLIC_COMPANY_COUNTRY: publicEnv('NEXT_PUBLIC_COMPANY_COUNTRY', 'COMPANY_COUNTRY'),
    NEXT_PUBLIC_COMPANY_POSTAL_CODE: publicEnv('NEXT_PUBLIC_COMPANY_POSTAL_CODE', 'COMPANY_POSTAL_CODE'),
    NEXT_PUBLIC_COMPANY_OPENING_HOURS: publicEnv('NEXT_PUBLIC_COMPANY_OPENING_HOURS', 'COMPANY_OPENING_HOURS'),
    NEXT_PUBLIC_SERVICE_AREA: publicEnv('NEXT_PUBLIC_SERVICE_AREA', 'SERVICE_AREA'),
    NEXT_PUBLIC_LOCALE: publicEnv('NEXT_PUBLIC_LOCALE', 'SITE_LOCALE'),
    NEXT_PUBLIC_TIME_ZONE: publicEnv('NEXT_PUBLIC_TIME_ZONE', 'SITE_TIME_ZONE'),
    NEXT_PUBLIC_CURRENCY: publicEnv('NEXT_PUBLIC_CURRENCY', 'SITE_CURRENCY'),
    NEXT_PUBLIC_ACCEPTED_CURRENCIES: publicEnv('NEXT_PUBLIC_ACCEPTED_CURRENCIES', 'ACCEPTED_CURRENCIES'),
    NEXT_PUBLIC_COMPANY_LATITUDE: publicEnv('NEXT_PUBLIC_COMPANY_LATITUDE', 'COMPANY_LATITUDE'),
    NEXT_PUBLIC_COMPANY_LONGITUDE: publicEnv('NEXT_PUBLIC_COMPANY_LONGITUDE', 'COMPANY_LONGITUDE'),
    NEXT_PUBLIC_GOOGLE_MAPS_PLACE_QUERY: publicEnv('NEXT_PUBLIC_GOOGLE_MAPS_PLACE_QUERY', 'GOOGLE_MAPS_PLACE_QUERY'),
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: publicEnv('NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY', 'GOOGLE_MAPS_EMBED_KEY'),
    NEXT_PUBLIC_LINKEDIN_URL: publicEnv('NEXT_PUBLIC_LINKEDIN_URL', 'LINKEDIN_URL'),
    NEXT_PUBLIC_INSTAGRAM_URL: publicEnv('NEXT_PUBLIC_INSTAGRAM_URL', 'INSTAGRAM_URL'),
    NEXT_PUBLIC_FACEBOOK_URL: publicEnv('NEXT_PUBLIC_FACEBOOK_URL', 'FACEBOOK_URL'),
    NEXT_PUBLIC_TIKTOK_URL: publicEnv('NEXT_PUBLIC_TIKTOK_URL', 'TIKTOK_URL'),
    NEXT_PUBLIC_TWITTER_URL: publicEnv('NEXT_PUBLIC_TWITTER_URL', 'TWITTER_URL'),
    NEXT_PUBLIC_TWITTER_HANDLE: publicEnv('NEXT_PUBLIC_TWITTER_HANDLE', 'TWITTER_HANDLE'),
    NEXT_PUBLIC_DEFAULT_KEYWORDS: publicEnv('NEXT_PUBLIC_DEFAULT_KEYWORDS', 'DEFAULT_KEYWORDS'),
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: mediaUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: mediaUrl.hostname,
        port: mediaUrl.port,
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security & performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              `connect-src 'self' ${apiOrigin}`,
              "frame-src https://www.google.com https://maps.google.com",
            ].join('; '),
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },

  // Rewrites to proxy API calls in development
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: `${apiUrl.replace(/\/$/, '')}/:path*`,
          },
        ]
      : []
  },

  // Bundle analysis (set ANALYZE=true to enable)
  ...(process.env.ANALYZE === 'true' && {
    webpack(config: any) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(new BundleAnalyzerPlugin({ analyzerMode: 'static' }))
      return config
    },
  }),
}

export default nextConfig
