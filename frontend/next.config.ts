import type { NextConfig } from 'next'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
const mediaUrl = new URL(apiUrl.replace(/\/api\/?$/, ''))
const apiOrigin = mediaUrl.origin
const allowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
const rootEnvPath = path.resolve(process.cwd(), '..', '.env')

function readRootEnvValue(key: string) {
  if (!existsSync(rootEnvPath)) return ''

  const line = readFileSync(rootEnvPath, 'utf8')
    .split(/\r?\n/)
    .find(entry => entry.startsWith(`${key}=`))

  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') || ''
}

const companyPhoneNumber =
  readRootEnvValue('COMPANY_PHONE_NUMBER') ||
  process.env.COMPANY_PHONE_NUMBER ||
  process.env.NEXT_PUBLIC_PHONE_NUMBER ||
  ''
const companyEmail =
  readRootEnvValue('COMPANY_EMAIL') ||
  process.env.COMPANY_EMAIL ||
  process.env.NEXT_PUBLIC_COMPANY_EMAIL ||
  ''

const nextConfig: NextConfig = {
  // Strict mode for better DX
  reactStrictMode: true,
  allowedDevOrigins,
  env: {
    NEXT_PUBLIC_PHONE_NUMBER: companyPhoneNumber,
    NEXT_PUBLIC_COMPANY_EMAIL: companyEmail,
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
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
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
