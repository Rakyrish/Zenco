'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, BarChart3, Bot, Database, Gauge, LineChart as LineIcon,
  PackageSearch, RefreshCw, SearchCheck, ShieldAlert, Signal, Sparkles,
} from 'lucide-react'
import { BarChart } from '@/components/admin/charts/Charts'
import { getMonitoringOverview } from '@/lib/admin/api'
import type { MonitoringNamedValue, MonitoringOverview } from '@/lib/admin/types'

const noData = 'No Data Available'

function formatValue(value: number | string | null | undefined, suffix = '') {
  if (value === null || value === undefined || value === '') return noData
  if (typeof value === 'number') return `${value.toLocaleString()}${suffix}`
  return value
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return noData
  return `KES ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatTime(value: string | null | undefined) {
  if (!value) return noData
  return new Date(value).toLocaleString()
}

function MetricCard({
  label,
  value,
  icon,
  tone = 'blue',
}: {
  label: string
  value: number | string | null | undefined
  icon: React.ReactNode
  tone?: 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'slate'
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 min-h-8 text-xl font-extrabold leading-tight text-gray-900 dark:text-white">
        {formatValue(value)}
      </p>
    </div>
  )
}

function Panel({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0C094D] text-white dark:bg-[#F26C0C]">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function EmptyBlock({ label = noData }: { label?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-xs font-semibold text-gray-400 dark:border-gray-800 dark:bg-gray-950/40">
      {label}
    </div>
  )
}

function SimpleList({ rows }: { rows: MonitoringNamedValue[] }) {
  if (!rows.length) return <EmptyBlock />
  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
          <span className="truncate font-semibold text-gray-700 dark:text-gray-300">{row.label}</span>
          <span className="shrink-0 font-extrabold tabular-nums text-[#0C094D] dark:text-[#F26C0C]">{row.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminMonitoringPage() {
  const [overview, setOverview] = useState<MonitoringOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOverview = async () => {
    setLoading(true)
    setError('')
    try {
      setOverview(await getMonitoringOverview())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load monitoring data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOverview() }, [])

  const leadChart = useMemo(() => (
    overview?.crm.lead_sources.map(row => ({ label: row.label, value: row.value, color: '#0C094D' })) || []
  ), [overview])

  const regionChart = useMemo(() => (
    overview?.crm.top_regions.map(row => ({ label: row.label, value: row.value, color: '#10B981' })) || []
  ), [overview])

  if (loading && !overview) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-gray-500 dark:text-gray-300">
          <RefreshCw className="animate-spin text-[#F26C0C]" size={18} />
          Loading monitoring center...
        </div>
      </div>
    )
  }

  if (error || !overview) {
    return (
      <div className="max-w-[900px] rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        {error || 'Unable to load monitoring data.'}
      </div>
    )
  }

  return (
    <div className="max-w-[1700px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900 dark:text-white">
            <Signal className="text-[#F26C0C]" /> Website Operations Center
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Real admin monitoring from connected platform data. Unsupported telemetry is marked as unavailable.
          </p>
        </div>
        <button
          onClick={loadOverview}
          className="flex items-center gap-2 rounded-xl bg-[#0C094D] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a1760]"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        Data sources: {overview.data_sources.join(', ')}. Metrics without instrumentation show {noData}.
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <MetricCard label="Visitors" value={overview.website_overview.total_website_visitors} icon={<Activity size={16} />} tone="slate" />
        <MetricCard label="Leads" value={overview.crm.leads_generated} icon={<LineIcon size={16} />} tone="green" />
        <MetricCard label="Quotes" value={overview.crm.quote_requests} icon={<BarChart3 size={16} />} tone="orange" />
        <MetricCard label="Low Stock" value={overview.inventory.low_stock_products} icon={<PackageSearch size={16} />} tone="red" />
        <MetricCard label="SEO Score" value={overview.seo.score === null ? null : `${overview.seo.score}%`} icon={<SearchCheck size={16} />} tone="blue" />
        <MetricCard label="Open Chats" value={overview.chatbot.unresolved_conversations} icon={<Bot size={16} />} tone="purple" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Website Overview" subtitle="Visitor/session metrics require analytics instrumentation." icon={<Activity size={17} />}>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Active Now" value={overview.website_overview.active_users_right_now} icon={<Signal size={15} />} tone="slate" />
            <MetricCard label="Today" value={overview.website_overview.visitors_today} icon={<Activity size={15} />} tone="slate" />
            <MetricCard label="This Week" value={overview.website_overview.visitors_this_week} icon={<Activity size={15} />} tone="slate" />
            <MetricCard label="Bounce Rate" value={overview.website_overview.bounce_rate === null ? null : `${overview.website_overview.bounce_rate}%`} icon={<Gauge size={15} />} tone="slate" />
          </div>
        </Panel>

        <Panel title="CRM Monitoring" subtitle="Lead and conversion activity from inquiries, WhatsApp clicks, and chatbot conversations." icon={<LineIcon size={17} />}>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Product Inquiries" value={overview.crm.product_inquiries} icon={<PackageSearch size={15} />} tone="green" />
            <MetricCard label="WhatsApp Clicks" value={overview.crm.whatsapp_clicks} icon={<Activity size={15} />} tone="green" />
            <MetricCard label="Phone Clicks" value={overview.crm.phone_clicks} icon={<Activity size={15} />} tone="slate" />
            <MetricCard label="Email Clicks" value={overview.crm.email_clicks} icon={<Activity size={15} />} tone="slate" />
          </div>
        </Panel>

        <Panel title="Inventory Monitoring" subtitle="Stock and supplier data from product inventory fields." icon={<PackageSearch size={17} />}>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Inventory Value" value={formatCurrency(overview.inventory.total_inventory_value)} icon={<Database size={15} />} tone="orange" />
            <MetricCard label="Available Stock" value={overview.inventory.available_stock} icon={<PackageSearch size={15} />} tone="green" />
            <MetricCard label="Out of Stock" value={overview.inventory.out_of_stock_products} icon={<AlertTriangle size={15} />} tone="red" />
            <MetricCard label="Turnover Rate" value={overview.inventory.inventory_turnover_rate} icon={<Gauge size={15} />} tone="slate" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="SEO Monitoring" subtitle="Scores are calculated from stored page, product, blog, and category metadata." icon={<SearchCheck size={17} />}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Pages" value={overview.seo.page_score === null ? null : `${overview.seo.page_score}%`} icon={<SearchCheck size={15} />} tone="blue" />
            <MetricCard label="Products" value={overview.seo.product_score === null ? null : `${overview.seo.product_score}%`} icon={<SearchCheck size={15} />} tone="blue" />
            <MetricCard label="Blog" value={overview.seo.blog_score === null ? null : `${overview.seo.blog_score}%`} icon={<SearchCheck size={15} />} tone="blue" />
            <MetricCard label="Categories" value={overview.seo.category_score === null ? null : `${overview.seo.category_score}%`} icon={<SearchCheck size={15} />} tone="blue" />
          </div>
          <div className="mt-4 space-y-2">
            {overview.seo.recommendations.length ? overview.seo.recommendations.map(item => (
              <div key={item.message} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-xs dark:bg-gray-800">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{item.message}</span>
                <span className="font-extrabold text-[#F26C0C]">{item.count}</span>
              </div>
            )) : <EmptyBlock label="No SEO issues detected from available metadata." />}
          </div>
        </Panel>

        <Panel title="Performance Monitoring" subtitle="Uses stored performance snapshots only. Lighthouse/PageSpeed runs are not faked." icon={<Gauge size={17} />}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Performance" value={overview.performance.performance_score} icon={<Gauge size={15} />} tone="orange" />
            <MetricCard label="Accessibility" value={overview.performance.accessibility_score} icon={<Gauge size={15} />} tone="green" />
            <MetricCard label="Best Practices" value={overview.performance.best_practices_score} icon={<Gauge size={15} />} tone="blue" />
            <MetricCard label="SEO" value={overview.performance.seo_score} icon={<Gauge size={15} />} tone="purple" />
            <MetricCard label="LCP" value={overview.performance.largest_contentful_paint} icon={<Activity size={15} />} tone="slate" />
            <MetricCard label="FCP" value={overview.performance.first_contentful_paint} icon={<Activity size={15} />} tone="slate" />
            <MetricCard label="INP" value={overview.performance.interaction_to_next_paint} icon={<Activity size={15} />} tone="slate" />
            <MetricCard label="TTFB" value={overview.performance.time_to_first_byte} icon={<Activity size={15} />} tone="slate" />
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Latest snapshot: {formatTime(overview.performance.latest_snapshot_at)}</p>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Lead Sources" icon={<BarChart3 size={17} />}>
          {leadChart.length ? <BarChart data={leadChart} horizontal color="#0C094D" /> : <EmptyBlock />}
        </Panel>
        <Panel title="Top Regions" icon={<BarChart3 size={17} />}>
          {regionChart.length ? <BarChart data={regionChart} horizontal color="#10B981" /> : <EmptyBlock />}
        </Panel>
        <Panel title="Most Requested Chemicals" icon={<PackageSearch size={17} />}>
          <SimpleList rows={overview.crm.most_requested_chemicals} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Chatbot Analytics" subtitle="Conversation, escalation, and product-interest data from chatbot tables." icon={<Bot size={17} />}>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Conversations" value={overview.chatbot.conversations} icon={<Bot size={15} />} tone="purple" />
            <MetricCard label="Today" value={overview.chatbot.conversations_today} icon={<Bot size={15} />} tone="purple" />
            <MetricCard label="Escalated" value={overview.chatbot.escalated_conversations} icon={<AlertTriangle size={15} />} tone="orange" />
            <MetricCard label="Failed Responses" value={overview.chatbot.failed_responses} icon={<AlertTriangle size={15} />} tone="slate" />
          </div>
        </Panel>

        <Panel title="API & Error Health" subtitle="Endpoint uptime and error logs need dedicated request/error instrumentation." icon={<ShieldAlert size={17} />}>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="API Uptime" value={overview.api_health.uptime_percentage} icon={<Signal size={15} />} tone="slate" />
            <MetricCard label="Tracked Errors" value={overview.errors.error_count as number | null | undefined} icon={<AlertTriangle size={15} />} tone="slate" />
          </div>
          <EmptyBlock label="No API/error telemetry has been recorded yet." />
        </Panel>

        <Panel title="AI & Security" subtitle="OpenAI usage and security events require secure server-side logging." icon={<Sparkles size={17} />}>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="AI Requests" value={overview.ai.total_requests as number | null | undefined} icon={<Sparkles size={15} />} tone="slate" />
            <MetricCard label="Failed Logins" value={overview.security.failed_login_attempts as number | null | undefined} icon={<ShieldAlert size={15} />} tone="slate" />
          </div>
          <EmptyBlock label="No AI/security telemetry has been recorded yet." />
        </Panel>
      </div>

      <Panel title="Business Intelligence" subtitle="Quote and lead trends are real; revenue, search, inventory movement, and customer trends need additional tracking sources." icon={<BarChart3 size={17} />}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <MetricCard label="Quotes Today" value={overview.business_intelligence.quote_trends.today} icon={<BarChart3 size={15} />} tone="orange" />
          <MetricCard label="Quotes 7 Days" value={overview.business_intelligence.quote_trends.last_7_days} icon={<BarChart3 size={15} />} tone="orange" />
          <MetricCard label="Quotes 30 Days" value={overview.business_intelligence.quote_trends.last_30_days} icon={<BarChart3 size={15} />} tone="orange" />
          <MetricCard label="Leads Today" value={overview.business_intelligence.lead_trends.today} icon={<LineIcon size={15} />} tone="green" />
          <MetricCard label="Leads 7 Days" value={overview.business_intelligence.lead_trends.last_7_days} icon={<LineIcon size={15} />} tone="green" />
          <MetricCard label="Leads 30 Days" value={overview.business_intelligence.lead_trends.last_30_days} icon={<LineIcon size={15} />} tone="green" />
        </div>
      </Panel>
    </div>
  )
}
