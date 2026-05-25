import { NextResponse } from 'next/server'
import { SITE_CONFIG } from '@/lib/constants'

export function GET() {
  return NextResponse.json(
    {
      name: SITE_CONFIG.fullName,
      short_name: SITE_CONFIG.name,
      description: SITE_CONFIG.description,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0C094D',
      icons: [
        {
          src: '/favicon.ico',
          sizes: 'any',
          type: 'image/x-icon',
        },
      ],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  )
}
