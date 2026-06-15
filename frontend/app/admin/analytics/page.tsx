'use client'

/**
 * ─── Admin Analytics Dashboard ────────────────────────────────────────────────
 *
 * Fetches REAL data from Google Analytics 4 via the GA4 Data API.
 * Uses the internal /api/analytics/report route which authenticates
 * with a Service Account and calls the GA4 Data API.
 *
 * Sections:
 *  - Overview KPIs (users, sessions, page views, bounce rate)
 *  - Traffic trend (daily line chart)
 *  - Traffic Sources (channel breakdown)
 *  - Geographic distribution (countries)
 *  - Device breakdown (mobile / desktop / tablet)
 *  - Top Pages
 *  - Conversion Events (contact forms, quote requests)
 */

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp, Users, Eye, Clock, RefreshCw, Globe, Monitor, Smartphone,
  ArrowUpRight, AlertCircle, CheckCircle2, BarChart2, Zap, Activity,
  MessageSquare, FileText, Phone, Mail
} from 'lucide-react'
import { LineChart, BarChart, DonutChart } from '@/components/admin/charts/Charts'
import { useToast } from '@/lib/admin/hooks'
import { GA_ID } from '@/lib/analytics'
import type { GA4ReportData } from '@/app/api/analytics/report/route'

const TIMEFRAMES = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
]

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export default function AdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState('30d')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GA4ReportData | null>(null)
  const { success, error: toastError } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/report?period=${timeframe}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json: GA4ReportData = await res.json()
      setData(json)
      if (!json.using_mock) {
        success('Analytics Refreshed', `Loaded ${timeframe} GA4 data successfully.`)
      }
    } catch (err) {
      toastError('Failed to load analytics', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [timeframe]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData() }, [loadData])

  // ── Chart data transformations ────────────────────────────────────────────

  const trafficLineData = (data?.traffic_by_day || []).map(d => ({
    date: d.date,
    value: d.users,
  }))

  const topPagesBarData = (data?.top_pages || []).slice(0, 8).map(p => ({
    label: p.page.length > 30 ? `...${p.page.slice(-28)}` : p.page,
    value: p.views,
  }))

  const devicesDonutData = (data?.devices || []).map((d, i) => ({
    label: d.category.charAt(0).toUpperCase() + d.category.slice(1),
    value: d.sessions,
    color: ['#0C094D', '#F26C0C', '#10B981', '#3B82F6'][i % 4],
  }))

  const sourcesDonutData = (data?.traffic_sources || []).slice(0, 5).map((s, i) => ({
    label: s.channel,
    value: s.sessions,
    color: ['#0C094D', '#F26C0C', '#10B981', '#3B82F6', '#8B5CF6'][i % 5],
  }))

  const isConfigured = !data?.error || !data.using_mock

  return (
    <div className="space-y-6 max-w-[1600px]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="text-[#F26C0C]" size={22} />
            Google Analytics 4 Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time visitor data, traffic sources, conversions and engagement metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* GA4 Status badge */}
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${
            isConfigured
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`} />
            {isConfigured ? `GA4 Live · ${GA_ID}` : `GA4 · ${GA_ID} · Setup Required`}
          </div>

          <button
            onClick={loadData}
            className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="flex bg-gray-100 dark:bg-gray-850 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === tf.value
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Setup Required Alert */}
      {data?.error && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-400 text-sm">GA4 Data API Setup Required</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 leading-relaxed">{data.error}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-semibold">
              Steps: 1) Find your numeric Property ID in GA4 → Admin → Property Settings → Property ID<br />
              2) Add it to <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">GOOGLE_GA_PROPERTY_ID=</code> in your .env file<br />
              3) Share the GA4 property with the service account: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">finstar-inventory-sheets@finstar-495106.iam.gserviceaccount.com</code>
            </p>
          </div>
        </div>
      )}

      {/* ── Overview KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Users',
            value: (data?.total_users || 0).toLocaleString(),
            icon: <Users size={18} />,
            sub: `${(data?.new_users || 0).toLocaleString()} new users`,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/20',
          },
          {
            label: 'Active Users',
            value: (data?.active_users || 0).toLocaleString(),
            icon: <Activity size={18} />,
            sub: `${(data?.sessions || 0).toLocaleString()} sessions`,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-950/20',
          },
          {
            label: 'Page Views',
            value: (data?.page_views || 0).toLocaleString(),
            icon: <Eye size={18} />,
            sub: `${data?.bounce_rate || 0}% bounce rate`,
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-950/20',
          },
          {
            label: 'Avg Session',
            value: formatDuration(data?.avg_session_duration_seconds || 0),
            icon: <Clock size={18} />,
            sub: 'Average engagement time',
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-950/20',
          },
        ].map(card => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</span>
              <span className={`${card.color} ${card.bg} p-2 rounded-xl`}>{card.icon}</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
              {loading ? <span className="block w-20 h-7 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /> : card.value}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Conversion Events ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Contact Form Submissions',
            value: data?.contact_form_conversions || 0,
            icon: <MessageSquare size={16} className="text-[#0C094D]" />,
            event: 'contact_form_submitted',
          },
          {
            label: 'Quote Request Conversions',
            value: data?.quote_request_conversions || 0,
            icon: <FileText size={16} className="text-[#F26C0C]" />,
            event: 'quote_request_submitted',
          },
          {
            label: 'WhatsApp Clicks',
            value: data?.conversion_events.find(e => e.event === 'whatsapp_button_clicked')?.count || 0,
            icon: <Phone size={16} className="text-green-600" />,
            event: 'whatsapp_button_clicked',
          },
          {
            label: 'Quote Button Clicks',
            value: data?.conversion_events.find(e => e.event === 'quote_button_clicked')?.count || 0,
            icon: <Zap size={16} className="text-purple-600" />,
            event: 'quote_button_clicked',
          },
        ].map(card => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              {card.icon}
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">
              {loading ? <span className="block w-12 h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /> : card.value.toLocaleString()}
            </p>
            <p className="text-[10px] font-mono text-gray-400 mt-1">{card.event}</p>
          </div>
        ))}
      </div>

      {/* ── Daily Traffic Chart ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Daily User Traffic</h2>
            <p className="text-xs text-gray-400 mt-0.5">Unique users per day from Google Analytics 4</p>
          </div>
          {data && !data.using_mock && (
            <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 size={10} /> Live GA4 Data
            </span>
          )}
        </div>
        {loading ? (
          <div className="h-[150px] bg-gray-50 dark:bg-gray-800/40 rounded-2xl animate-pulse" />
        ) : trafficLineData.length > 0 ? (
          <LineChart data={trafficLineData} color="#F26C0C" height={150} showDots={false} />
        ) : (
          <div className="h-[150px] flex items-center justify-center text-xs text-gray-400">
            No traffic data available. Configure GOOGLE_GA_PROPERTY_ID to see live data.
          </div>
        )}
      </div>

      {/* ── Sources & Devices ─────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Traffic Sources */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Traffic Sources</h2>
          <p className="text-xs text-gray-400 mb-4">Where your visitors are coming from</p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : sourcesDonutData.length > 0 ? (
            <DonutChart
              data={sourcesDonutData}
              size={160}
              thickness={28}
              centerLabel="Sessions"
              centerValue={(data?.sessions || 0).toLocaleString()}
            />
          ) : (
            <div className="h-[160px] flex items-center justify-center text-xs text-gray-400">
              No source data available
            </div>
          )}
        </div>

        {/* Devices */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Device Categories</h2>
          <p className="text-xs text-gray-400 mb-4">Mobile vs desktop vs tablet breakdown</p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : devicesDonutData.length > 0 ? (
            <DonutChart
              data={devicesDonutData}
              size={160}
              thickness={28}
              centerLabel="Devices"
              centerValue={devicesDonutData.length}
            />
          ) : (
            <div className="h-[160px] flex items-center justify-center text-xs text-gray-400">
              No device data available
            </div>
          )}
        </div>
      </div>

      {/* ── Geographic Distribution ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-[#F26C0C]" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Top Countries</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (data?.countries || []).length > 0 ? (
          <div className="space-y-3">
            {(data?.countries || []).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-36 flex-shrink-0 truncate">{c.country}</span>
                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${c.percentage}%`,
                      background: i === 0 ? '#0C094D' : i === 1 ? '#F26C0C' : '#10B981',
                    }}
                  />
                </div>
                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 w-20 text-right tabular-nums">
                  {c.users.toLocaleString()} <span className="text-gray-400 font-normal">({c.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400">No geographic data available</div>
        )}
      </div>

      {/* ── Top Pages ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Most Visited Pages</h2>
            <p className="text-xs text-gray-400 mt-0.5">Page views ranked from Google Analytics 4</p>
          </div>
          <BarChart2 size={16} className="text-gray-300 dark:text-gray-700" />
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : (data?.top_pages || []).length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {(data?.top_pages || []).map((page, idx) => (
              <div key={idx} className="flex justify-between items-center px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-gray-800/10 transition-all text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-bold text-gray-300 dark:text-gray-700 w-4 flex-shrink-0">{idx + 1}</span>
                  <span className="font-mono text-gray-600 dark:text-gray-300 font-semibold truncate">{page.page}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <span className="text-gray-400 tabular-nums">{page.users.toLocaleString()} users</span>
                  <span className="font-extrabold text-[#0C094D] dark:text-[#F26C0C] font-mono tabular-nums">
                    {page.views.toLocaleString()} views
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-gray-400">
            No page data available. Configure GOOGLE_GA_PROPERTY_ID to see live data.
          </div>
        )}
      </div>

      {/* ── All Conversion Events Table ──────────────────────────────────── */}
      {(data?.conversion_events || []).length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Conversion Events</h2>
            <p className="text-xs text-gray-400 mt-0.5">Custom GA4 events fired from the Zenco website</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {(data?.conversion_events || []).map((evt, idx) => (
              <div key={idx} className="flex justify-between items-center px-5 py-3 hover:bg-gray-50/40 dark:hover:bg-gray-800/10 transition-all">
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{evt.event}</span>
                <span className="font-extrabold text-sm text-[#0C094D] dark:text-[#F26C0C] tabular-nums">{evt.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer info ──────────────────────────────────────────────────── */}
      <p className="text-[10px] text-gray-400 text-center pb-4">
        Measurement ID: <span className="font-mono font-bold">{GA_ID}</span> ·
        Data refreshed: {data?.generated_at ? new Date(data.generated_at).toLocaleString('en-KE') : '—'}
      </p>
    </div>
  )
}
