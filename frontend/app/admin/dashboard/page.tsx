'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package, FileText, MessageSquare, ShoppingCart, Bot, AlertTriangle,
  TrendingUp, Clock, CheckCircle, Plus, ArrowRight, RefreshCw,
} from 'lucide-react'
import StatsCard from '@/components/admin/ui/StatsCard'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import { LineChart } from '@/components/admin/charts/Charts'
import { getAnalyticsOverview, getChatbotConversations, getDashboardStats, getInventory, getAdminInquiries } from '@/lib/admin/api'
import type { AnalyticsOverview, ChatbotConversation, DashboardStats, InventoryItem, AdminInquiry } from '@/lib/admin/types'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_products: 0, total_blog_posts: 0, total_inquiries: 0, total_quotes: 0,
    total_chatbot_chats: 0, low_stock_alerts: 0, new_inquiries_today: 0, resolved_today: 0,
  })
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([])
  const [chats, setChats] = useState<ChatbotConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadStats = async () => {
    try {
      const data = await getDashboardStats()
      setStats(data)
      const [traffic, stock, recentInquiries, recentChats] = await Promise.all([
        getAnalyticsOverview('30d').catch(() => null),
        getInventory({ low_stock: true }).catch(() => ({ results: [] })),
        getAdminInquiries({ page: 1 }).catch(() => ({ results: [] })),
        getChatbotConversations({ page: 1 }).catch(() => ({ results: [] })),
      ])
      setAnalytics(traffic)
      setInventory(stock.results)
      setInquiries(recentInquiries.results.slice(0, 4))
      setChats(recentChats.results.slice(0, 3))
    } catch {
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  const handleRefresh = () => { setRefreshing(true); loadStats() }

  const trafficData = (analytics?.traffic_by_day || []).slice(-14).map(d => ({
    date: d.date,
    value: d.visitors,
  }))

  const lowStock = inventory
  const recentInquiries = inquiries
  const recentChats = chats

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Welcome back — here&apos;s what&apos;s happening at Zenco.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard loading={loading} label="Total Products" value={stats.total_products} icon={<Package size={18} />} color="blue" trend={{ value: 5, label: 'vs last month' }} />
        <StatsCard loading={loading} label="Blog Posts" value={stats.total_blog_posts} icon={<FileText size={18} />} color="purple" />
        <StatsCard loading={loading} label="Inquiries" value={stats.total_inquiries} icon={<MessageSquare size={18} />} color="green" trend={{ value: 12 }} />
        <StatsCard loading={loading} label="Quote Requests" value={stats.total_quotes} icon={<ShoppingCart size={18} />} color="orange" />
        <StatsCard loading={loading} label="Chatbot Chats" value={stats.total_chatbot_chats} icon={<Bot size={18} />} color="amber" />
        <StatsCard loading={loading} label="Low Stock Items" value={stats.low_stock_alerts} icon={<AlertTriangle size={18} />} color="red" />
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'New Today', value: stats.new_inquiries_today, icon: <TrendingUp size={14} />, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'Resolved Today', value: stats.resolved_today, icon: <CheckCircle size={14} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Avg Response', value: '2.4h', icon: <Clock size={14} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Open Chats', value: chats.filter(c => !c.is_resolved).length, icon: <Bot size={14} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid — traffic + low stock */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Traffic Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">Website Traffic</h2>
              <p className="text-xs text-gray-400 mt-0.5">Visitors over the last 14 days</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">{(analytics?.total_visitors || 0).toLocaleString()}</p>
              <p className="text-xs text-green-600 font-semibold">+8.3% this month</p>
            </div>
          </div>
          <LineChart data={trafficData} color="#F26C0C" height={130} showDots={false} />
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" /> Low Stock Alerts
            </h2>
            <Link href="/admin/inventory" className="text-xs text-[#F26C0C] hover:underline font-semibold">View all</Link>
          </div>
          <div className="space-y-2.5">
            {lowStock.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-2 p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.product_name}</p>
                  <p className="text-[10px] text-gray-400">{item.category_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-extrabold ${item.stock_quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {item.stock_quantity} {item.unit}
                  </p>
                  <p className="text-[10px] text-gray-400">Min: {item.reorder_level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom grid — recent inquiries + chatbot */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Recent Inquiries</h2>
            <Link href="/admin/inquiries" className="flex items-center gap-1 text-xs text-[#F26C0C] hover:underline font-semibold">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentInquiries.map(inq => (
              <div key={inq.id} className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#0C094D]/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#0C094D] dark:text-white">
                  {inq.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{inq.full_name}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(inq.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{inq.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={inq.status} />
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{inq.inquiry_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-gray-50 dark:border-gray-800">
            <Link href="/admin/inquiries" className="text-xs text-gray-500 hover:text-[#F26C0C] transition-colors">
              View all {stats.total_inquiries} inquiries →
            </Link>
          </div>
        </div>

        {/* Recent Chatbot Conversations */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Bot size={15} className="text-[#F26C0C]" /> Chatbot Conversations
            </h2>
            <Link href="/admin/chatbot" className="flex items-center gap-1 text-xs text-[#F26C0C] hover:underline font-semibold">
              Monitor <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentChats.map(chat => (
              <div key={chat.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {chat.user_identifier || 'Anonymous visitor'}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={chat.is_resolved ? 'resolved' : 'new'} />
                    <span className="text-[10px] text-gray-400">{timeAgo(chat.last_message_at)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.first_message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{chat.message_count} messages</p>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-gray-50 dark:border-gray-800">
            <Link href="/admin/chatbot" className="text-xs text-gray-500 hover:text-[#F26C0C] transition-colors">
              View all {stats.total_chatbot_chats} conversations →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Add Product', href: '/admin/products/new', icon: <Package size={18} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Write Post', href: '/admin/blog/new', icon: <FileText size={18} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
            { label: 'View Inquiries', href: '/admin/inquiries', icon: <MessageSquare size={18} />, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
            { label: 'View Quotes', href: '/admin/quotes', icon: <ShoppingCart size={18} />, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
            { label: 'Analytics', href: '/admin/analytics', icon: <TrendingUp size={18} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Inventory', href: '/admin/inventory', icon: <AlertTriangle size={18} />, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
          ].map((a, i) => (
            <Link key={i} href={a.href} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color} group-hover:scale-110 transition-transform`}>{a.icon}</div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
