'use client'

import { useEffect, useState } from 'react'
import { Calendar, TrendingUp, Users, Eye, Clock, Download, RefreshCw } from 'lucide-react'
import { LineChart, BarChart, DonutChart } from '@/components/admin/charts/Charts'
import { useToast } from '@/lib/admin/hooks'
import { getAnalyticsOverview, getConversionStats, getTopProducts } from '@/lib/admin/api'
import type { AnalyticsOverview, ConversionStats, TopContent } from '@/lib/admin/types'

const TIMEFRAMES = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
]

export default function AdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState('30d')
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [topProducts, setTopProducts] = useState<TopContent[]>([])
  const [conversions, setConversions] = useState<ConversionStats | null>(null)
  const { success } = useToast()

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const [overview, products, conversionData] = await Promise.all([
        getAnalyticsOverview(timeframe as '7d' | '30d' | '90d'),
        getTopProducts(),
        getConversionStats(),
      ])
      setAnalytics(overview)
      setTopProducts(products)
      setConversions(conversionData)
      success('Analytics Refreshed', 'Retrieved latest real-time web statistics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { handleRefresh() }, [timeframe])

  const trafficData = (analytics?.traffic_by_day || []).map(d => ({
    date: d.date,
    value: d.visitors,
  }))

  const topPagesData = topProducts.map(p => ({
    label: `/products/${p.slug}`,
    value: p.views,
  }))


  const leadsDonutData = [
    { label: 'General', value: 34, color: '#0C094D' },
    { label: 'Product Specific', value: 45, color: '#F26C0C' },
    { label: 'Bulk Quote', value: 21, color: '#10B981' },
    { label: 'Partnership', value: 12, color: '#8B5CF6' },
  ]

  const originsBarData = [
    { label: 'Nairobi', value: 680, color: '#0C094D' },
    { label: 'Mombasa', value: 420, color: '#F26C0C' },
    { label: 'Kisumu', value: 190, color: '#10B981' },
    { label: 'Nakuru', value: 140, color: '#3B82F6' },
    { label: 'Eldoret', value: 95, color: '#8B5CF6' },
  ]

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="text-[#F26C0C]" /> Web Analytics &amp; Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor real-time platform statistics, traffic flows, leads, and popular landing products.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex bg-gray-150 dark:bg-gray-850 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
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

      {/* Main Aggregates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unique Visitors</span>
            <Users size={16} className="text-[#0C094D] dark:text-[#F26C0C]" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
            {(analytics?.total_visitors || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
            <span className="bg-green-50 px-1.5 py-0.5 rounded-lg">+12.4% vs last period</span>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Page Views</span>
            <Eye size={16} className="text-[#0C094D] dark:text-[#F26C0C]" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
            {(analytics?.total_page_views || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
            <span className="bg-green-50 px-1.5 py-0.5 rounded-lg">+8.2% page engagement</span>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Session Length</span>
            <Clock size={16} className="text-[#0C094D] dark:text-[#F26C0C]" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
            {analytics?.avg_session_duration || '0m 00s'}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold">
            Industry standard average: 2.5m
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Leads Conversion</span>
            <TrendingUp size={16} className="text-[#0C094D] dark:text-[#F26C0C]" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
            {conversions?.quote_conversion_rate || 0}%
          </p>

          <p className="text-[10px] text-[#F26C0C] font-semibold flex items-center gap-1">
            <span className="bg-orange-50 px-1.5 py-0.5 rounded-lg">High interest quote inquiries</span>
          </p>
        </div>
      </div>

      {/* Traffic Line Chart Over Time */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Active Traffic Analytics Flow</h2>
            <p className="text-xs text-gray-400 mt-0.5">Visitor distribution logs mapped daily</p>
          </div>
        </div>
        <LineChart data={trafficData} color="#F26C0C" height={150} showDots={true} />
      </div>

      {/* Donut & Bar Charts Details Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Inquiry Classification (Donut) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Inquiry Type Segmentation</h2>
            <p className="text-xs text-gray-400 mt-0.5">Commercial vs information customer segments</p>
          </div>
          <div className="flex items-center justify-center py-2">
            <DonutChart data={leadsDonutData} size={150} thickness={24} centerLabel="Leads" centerValue={112} />
          </div>
        </div>

        {/* Lead Origins (Horizontal Bar Chart) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Top Geographic Regions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Registered leads mapped across major industrial centers</p>
          </div>
          <BarChart data={originsBarData} horizontal={true} color="#0C094D" />
        </div>

      </div>

      {/* Landing page hits details list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Most Active Chemical Pages &amp; Products</h2>
          <p className="text-xs text-gray-400 mt-0.5">Page hit metrics mapped via organic user search paths</p>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {topPagesData.map((page, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 hover:bg-gray-50/40 dark:hover:bg-gray-800/10 transition-all text-xs">
              <span className="font-mono text-gray-600 dark:text-gray-300 font-semibold">{page.label}</span>
              <span className="font-extrabold text-[#0C094D] dark:text-[#F26C0C] font-mono">{page.value.toLocaleString()} views</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
