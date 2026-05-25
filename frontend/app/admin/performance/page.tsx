'use client'

import { useEffect, useState } from 'react'
import { Activity, Gauge, RefreshCw, Zap } from 'lucide-react'
import { auditWebsiteHealth, getPerformanceSnapshots } from '@/lib/admin/api'
import { SITE_CONFIG } from '@/lib/constants'

interface Snapshot {
  id?: string
  page_path?: string
  performance_score?: number
  seo_score?: number
  accessibility_score?: number
  best_practices_score?: number
  largest_contentful_paint?: number
  first_contentful_paint?: number
  interaction_to_next_paint?: number
  cumulative_layout_shift?: number
  server_response_time?: number
  image_optimization_status?: string
  caching_status?: string
}

export default function AdminPerformancePage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [recommendations, setRecommendations] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getPerformanceSnapshots().then(data => setSnapshots(data.results as Snapshot[])).catch(() => setSnapshots([]))
  }, [])

  const latest = snapshots[0] || {}

  const runHealthAudit = async () => {
    setLoading(true)
    try {
      const result = await auditWebsiteHealth({ site: SITE_CONFIG.url, latest_snapshot: latest })
      setRecommendations(result.recommendations)
    } finally {
      setLoading(false)
    }
  }

  const scoreCards = [
    ['Performance', latest.performance_score || 0],
    ['SEO', latest.seo_score || 0],
    ['Accessibility', latest.accessibility_score || 0],
    ['Best Practices', latest.best_practices_score || 0],
  ]

  const vitals = [
    ['LCP', `${latest.largest_contentful_paint || 0}s`],
    ['FCP', `${latest.first_contentful_paint || 0}s`],
    ['INP', `${latest.interaction_to_next_paint || 0}ms`],
    ['CLS', latest.cumulative_layout_shift || 0],
    ['Server Response', `${latest.server_response_time || 0}ms`],
    ['Images', latest.image_optimization_status || 'unknown'],
    ['Caching', latest.caching_status || 'unknown'],
  ]

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="text-[#F26C0C]" /> Website Health Monitor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Review Core Web Vitals, technical health, and AI recommendations.
          </p>
        </div>
        <button onClick={runHealthAudit} disabled={loading}
          className="flex items-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          AI Health Audit
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {scoreCards.map(([label, score]) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
              <Gauge size={16} className="text-[#F26C0C]" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-3">{score}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Activity size={16} className="text-[#F26C0C]" /> Core Web Vitals
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {vitals.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {recommendations && (
        <pre className="whitespace-pre-wrap text-xs bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl text-gray-700 dark:text-gray-200">{recommendations}</pre>
      )}
    </div>
  )
}
