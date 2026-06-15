/**
 * ─── GA4 Data API — Server Route ─────────────────────────────────────────────
 *
 * GET /api/analytics/report?period=30d
 *
 * Fetches real data from Google Analytics 4 Data API using a Service Account.
 * Returns structured JSON for the Admin Analytics Dashboard.
 *
 * Required Environment Variables:
 *   GOOGLE_GA_PROPERTY_ID    — Numeric GA4 property ID (e.g. "123456789")
 *   GOOGLE_SERVICE_ACCOUNT_JSON — Full service account JSON (already in .env)
 *
 * The service account must be added as a viewer to the GA4 property:
 *   GA4 → Admin → Property Access Management → Add user
 */

import { NextRequest, NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

// Always render server-side — never statically pre-generate (credentials not available at build)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GA4ReportData {
  period: string
  generated_at: string
  // Overview
  total_users: number
  new_users: number
  active_users: number
  sessions: number
  page_views: number
  bounce_rate: number
  avg_session_duration_seconds: number
  // Breakdowns
  traffic_by_day: { date: string; users: number; sessions: number }[]
  top_pages: { page: string; views: number; users: number }[]
  traffic_sources: { channel: string; sessions: number; percentage: number }[]
  countries: { country: string; users: number; percentage: number }[]
  devices: { category: string; sessions: number; percentage: number }[]
  // Conversions
  conversion_events: { event: string; count: number }[]
  contact_form_conversions: number
  quote_request_conversions: number
  // Status
  error?: string
  using_mock: boolean
}

const PERIOD_MAP: Record<string, string> = {
  '7d': '7daysAgo',
  '30d': '30daysAgo',
  '90d': '90daysAgo',
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30d'
  const startDate = PERIOD_MAP[period] || '30daysAgo'

  const propertyId = process.env.GOOGLE_GA_PROPERTY_ID
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  // ── Graceful fallback if not configured ──────────────────────────────────
  if (!propertyId || !serviceAccountJson) {
    return NextResponse.json<GA4ReportData>(
      buildUnconfiguredResponse(period),
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  }

  try {
    // Parse service account credentials
    const credentials = JSON.parse(serviceAccountJson)

    // Initialise GA4 Data API client
    const analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    })

    const property = `properties/${propertyId}`

    // ── Run all reports in parallel ──────────────────────────────────────
    const [
      overviewResponse,
      dailyResponse,
      topPagesResponse,
      sourcesResponse,
      countriesResponse,
      devicesResponse,
      conversionsResponse,
    ] = await Promise.all([
      // 1. Overview metrics
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),

      // 2. Daily traffic (for line chart)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      }),

      // 3. Top pages
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),

      // 4. Traffic sources (channels)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),

      // 5. Countries
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        limit: 10,
      }),

      // 6. Devices
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),

      // 7. Conversion events (custom events we fire from the app)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: [
                'contact_form_submitted',
                'quote_request_submitted',
                'inquiry_submitted',
                'whatsapp_button_clicked',
                'call_button_clicked',
                'quote_button_clicked',
              ],
            },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
    ])

    // ── Parse Overview ───────────────────────────────────────────────────
    const overviewRow = overviewResponse[0].rows?.[0]
    const totalUsers = parseInt(overviewRow?.metricValues?.[0]?.value || '0')
    const newUsers = parseInt(overviewRow?.metricValues?.[1]?.value || '0')
    const activeUsers = parseInt(overviewRow?.metricValues?.[2]?.value || '0')
    const sessions = parseInt(overviewRow?.metricValues?.[3]?.value || '0')
    const pageViews = parseInt(overviewRow?.metricValues?.[4]?.value || '0')
    const bounceRate = parseFloat(overviewRow?.metricValues?.[5]?.value || '0')
    const avgSessionDuration = parseFloat(overviewRow?.metricValues?.[6]?.value || '0')

    // ── Parse Daily Traffic ───────────────────────────────────────────────
    const trafficByDay = (dailyResponse[0].rows || []).map(row => ({
      date: formatDate(row.dimensionValues?.[0]?.value || ''),
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
    }))

    // ── Parse Top Pages ──────────────────────────────────────────────────
    const topPages = (topPagesResponse[0].rows || []).map(row => ({
      page: row.dimensionValues?.[0]?.value || '/',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
    }))

    // ── Parse Traffic Sources ────────────────────────────────────────────
    const totalSessions = (sourcesResponse[0].rows || []).reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'), 0
    )
    const trafficSources = (sourcesResponse[0].rows || []).map(row => {
      const count = parseInt(row.metricValues?.[0]?.value || '0')
      return {
        channel: row.dimensionValues?.[0]?.value || 'Unknown',
        sessions: count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      }
    })

    // ── Parse Countries ──────────────────────────────────────────────────
    const totalCountryUsers = (countriesResponse[0].rows || []).reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'), 0
    )
    const countries = (countriesResponse[0].rows || []).map(row => {
      const count = parseInt(row.metricValues?.[0]?.value || '0')
      return {
        country: row.dimensionValues?.[0]?.value || 'Unknown',
        users: count,
        percentage: totalCountryUsers > 0 ? Math.round((count / totalCountryUsers) * 100) : 0,
      }
    })

    // ── Parse Devices ────────────────────────────────────────────────────
    const totalDeviceSessions = (devicesResponse[0].rows || []).reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'), 0
    )
    const devices = (devicesResponse[0].rows || []).map(row => {
      const count = parseInt(row.metricValues?.[0]?.value || '0')
      return {
        category: row.dimensionValues?.[0]?.value || 'Unknown',
        sessions: count,
        percentage: totalDeviceSessions > 0 ? Math.round((count / totalDeviceSessions) * 100) : 0,
      }
    })

    // ── Parse Conversion Events ──────────────────────────────────────────
    const conversionEvents = (conversionsResponse[0].rows || []).map(row => ({
      event: row.dimensionValues?.[0]?.value || '',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
    }))

    const contactFormConversions = conversionEvents
      .filter(e => e.event === 'contact_form_submitted' || e.event === 'inquiry_submitted')
      .reduce((s, e) => s + e.count, 0)

    const quoteConversions = conversionEvents
      .filter(e => e.event === 'quote_request_submitted' || e.event === 'quote_button_clicked')
      .reduce((s, e) => s + e.count, 0)

    const responseData: GA4ReportData = {
      period,
      generated_at: new Date().toISOString(),
      total_users: totalUsers,
      new_users: newUsers,
      active_users: activeUsers,
      sessions,
      page_views: pageViews,
      bounce_rate: Math.round(bounceRate * 100) / 100,
      avg_session_duration_seconds: Math.round(avgSessionDuration),
      traffic_by_day: trafficByDay,
      top_pages: topPages,
      traffic_sources: trafficSources,
      countries,
      devices,
      conversion_events: conversionEvents,
      contact_form_conversions: contactFormConversions,
      quote_request_conversions: quoteConversions,
      using_mock: false,
    }

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[GA4 Data API] Error:', errorMsg)

    return NextResponse.json<GA4ReportData>(
      {
        ...buildUnconfiguredResponse(period),
        error: `GA4 Data API error: ${errorMsg}`,
        using_mock: true,
      },
      { status: 200 }
    )
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(raw: string): string {
  // GA4 returns dates as YYYYMMDD → convert to YYYY-MM-DD
  if (raw.length === 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return raw
}

function buildUnconfiguredResponse(period: string): GA4ReportData {
  return {
    period,
    generated_at: new Date().toISOString(),
    total_users: 0,
    new_users: 0,
    active_users: 0,
    sessions: 0,
    page_views: 0,
    bounce_rate: 0,
    avg_session_duration_seconds: 0,
    traffic_by_day: [],
    top_pages: [],
    traffic_sources: [],
    countries: [],
    devices: [],
    conversion_events: [],
    contact_form_conversions: 0,
    quote_request_conversions: 0,
    error: !process.env.GOOGLE_GA_PROPERTY_ID
      ? 'GOOGLE_GA_PROPERTY_ID is not set. Add your numeric GA4 Property ID to .env to enable live data.'
      : undefined,
    using_mock: true,
  }
}
