'use client'

import { useEffect, useState } from 'react'
import {
  Search, Mail, Phone, Building2, Globe, Calendar, CheckCircle2,
  AlertCircle, Clock, FileText, Reply, ArrowRight, Trash2, Filter,
  RotateCcw, TrendingUp, CheckCircle, AlertTriangle, ShieldCheck
} from 'lucide-react'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import ConfirmModal from '@/components/admin/ui/ConfirmModal'
import Pagination from '@/components/admin/ui/Pagination'
import StatsCard from '@/components/admin/ui/StatsCard'
import { LineChart } from '@/components/admin/charts/Charts'
import { useDebounce, useToast } from '@/lib/admin/hooks'
import {
  getAdminInquiries,
  updateInquiryStatus,
  replyToInquiry,
  deleteInquiry,
  getInquiryStats
} from '@/lib/admin/api'
import type { AdminInquiry, InquiryStats } from '@/lib/admin/types'

const STATUS_FILTERS = ['All', 'new', 'in_progress', 'replied', 'quotation_sent', 'closed']
const TYPE_FILTERS = [
  { value: 'All', label: 'All Types' },
  { value: 'quote', label: 'Quote Request' },
  { value: 'product', label: 'Product Inquiry' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'product_info', label: 'Product Info Request' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'technical', label: 'Technical Support' }
]

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([])
  const [stats, setStats] = useState<InquiryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filters State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [productFilter, setProductFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  // Detail & Action States
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Delete State
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const dSearch = useDebounce(search)
  const dProduct = useDebounce(productFilter)
  const dCountry = useDebounce(countryFilter)
  const { success, error: toastError } = useToast()

  // Load Inquiries
  const loadInquiries = async () => {
    setLoading(true)
    try {
      const res = await getAdminInquiries({
        search: dSearch || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
        inquiry_type: typeFilter === 'All' ? undefined : typeFilter,
        product_name: dProduct || undefined,
        country: dCountry || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
      })
      setInquiries(res.results)
      setTotalCount(res.count)
    } catch (err) {
      toastError('Load failed', err instanceof Error ? err.message : 'Could not fetch inquiries.')
    } finally {
      setLoading(false)
    }
  }

  // Load Stats
  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const data = await getInquiryStats()
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadInquiries()
  }, [dSearch, statusFilter, typeFilter, dProduct, dCountry, startDate, endDate, page])

  useEffect(() => {
    loadStats()
  }, [])

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setTypeFilter('All')
    setProductFilter('')
    setCountryFilter('')
    setStartDate('')
    setEndDate('')
    setPage(1)
    success('Filters Reset', 'All search filters cleared.')
  }

  // Update Status
  const handleUpdateStatus = async (id: string, newStatus: AdminInquiry['status']) => {
    try {
      const updated = await updateInquiryStatus(id, newStatus)
      setInquiries(prev => prev.map(inq => (inq.id === id ? updated : inq)))
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(updated)
      }
      success('Status Updated', `Inquiry status changed to ${newStatus}`)
      loadStats()
    } catch (err) {
      toastError('Update failed', err instanceof Error ? err.message : 'Could not update status.')
    }
  }

  // Save Internal Notes
  const handleSaveNotes = async () => {
    if (!selectedInquiry) return
    setSavingNotes(true)
    try {
      const updated = await updateInquiryStatus(selectedInquiry.id, selectedInquiry.status, adminNotes)
      setInquiries(prev => prev.map(inq => (inq.id === selectedInquiry.id ? updated : inq)))
      setSelectedInquiry(updated)
      success('Notes Saved', 'Internal administrator notes updated.')
    } catch (err) {
      toastError('Failed to save notes', err instanceof Error ? err.message : 'Could not save notes.')
    } finally {
      setSavingNotes(false)
    }
  }

  // Send Reply Email via Resend
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInquiry || !replyMessage.trim()) return
    setSendingReply(true)
    try {
      const res = await replyToInquiry(selectedInquiry.id, replyMessage)
      setInquiries(prev =>
        prev.map(inq =>
          inq.id === selectedInquiry.id
            ? {
                ...inq,
                status: res.status as AdminInquiry['status'],
                replied_at: res.replied_at,
                admin_notes: res.admin_notes,
              }
            : inq
        )
      )
      success('Reply Dispatched', `Email response sent successfully to ${selectedInquiry.email}`)
      setReplyMessage('')
      setSelectedInquiry(null)
      loadStats()
    } catch (err) {
      toastError('Reply failed', err instanceof Error ? err.message : 'Could not deliver email response.')
    } finally {
      setSendingReply(false)
    }
  }

  // Delete Inquiry
  const handleDeleteInquiry = async () => {
    if (!inquiryToDelete) return
    setIsDeleting(true)
    try {
      await deleteInquiry(inquiryToDelete)
      setInquiries(prev => prev.filter(inq => inq.id !== inquiryToDelete))
      if (selectedInquiry?.id === inquiryToDelete) {
        setSelectedInquiry(null)
      }
      success('Inquiry Deleted', 'The inquiry has been permanently removed.')
      setInquiryToDelete(null)
      loadStats()
    } catch (err) {
      toastError('Delete failed', err instanceof Error ? err.message : 'Could not delete inquiry.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenDetail = (inq: AdminInquiry) => {
    setSelectedInquiry(inq)
    setAdminNotes(inq.admin_notes || '')
    setReplyMessage('')
  }

  const chartData = (stats?.monthly_trends || []).map(t => ({
    date: t.month,
    value: t.count
  }))

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            Inquiry Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            View, filter, delete, and reply to client inquiries and quote requests using automated workflows.
          </p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          loading={statsLoading}
          label="Total Inquiries"
          value={stats?.total_inquiries || 0}
          icon={<Mail size={18} />}
          color="blue"
        />
        <StatsCard
          loading={statsLoading}
          label="New Inquiries"
          value={stats?.new_inquiries || 0}
          icon={<AlertCircle size={18} />}
          color="orange"
        />
        <StatsCard
          loading={statsLoading}
          label="Replied"
          value={stats?.replied_inquiries || 0}
          icon={<CheckCircle2 size={18} />}
          color="green"
        />
        <StatsCard
          loading={statsLoading}
          label="Quote Requests"
          value={stats?.quote_requests || 0}
          icon={<TrendingUp size={18} />}
          color="purple"
        />
        <StatsCard
          loading={statsLoading}
          label="Product Inquiries"
          value={stats?.product_inquiries || 0}
          icon={<FileText size={18} />}
          color="amber"
        />
      </div>

      {/* Monthly trends chart & Email health analytics */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Inquiry Submission Trends</h2>
          <div className="h-[140px]">
            {chartData.length > 0 ? (
              <LineChart data={chartData} color="#0C094D" height={130} showDots={true} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No trend data available for this year</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Email Delivery Health</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Conversion Rate</span>
                  <span className="text-[#0C094D] dark:text-[#F26C0C]">{stats?.conversion_rate || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: `${stats?.conversion_rate || 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Resend Notification Rate</span>
                  <span className="text-[#0C094D] dark:text-[#F26C0C]">{stats?.email_delivery_success_rate || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${stats?.email_delivery_success_rate || 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Auto-Reply Success Rate</span>
                  <span className="text-[#0C094D] dark:text-[#F26C0C]">{stats?.autoreply_success_rate || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats?.autoreply_success_rate || 0}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-[10px] text-green-600 font-semibold bg-green-50/50 dark:bg-green-950/10 p-2 rounded-xl">
            <ShieldCheck size={14} /> Resend API connection status: ACTIVE
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Filter size={12} /> Advanced Search &amp; Filters
          </h2>
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-gray-400 hover:text-[#F26C0C] transition-colors flex items-center gap-1"
          >
            <RotateCcw size={12} /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Main search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name, email, message..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 dark:text-white transition-colors"
            />
          </div>

          {/* Product Filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={productFilter}
              onChange={e => { setProductFilter(e.target.value); setPage(1) }}
              placeholder="Filter by product name..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 dark:text-white transition-colors"
            />
          </div>

          {/* Country filter */}
          <div className="relative">
            <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={countryFilter}
              onChange={e => { setCountryFilter(e.target.value); setPage(1) }}
              placeholder="Filter by country (e.g. Kenya)..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 dark:text-white transition-colors"
            />
          </div>

          {/* Type Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Type:</span>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
              className="text-xs bg-transparent font-semibold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-full"
            >
              {TYPE_FILTERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 border-t border-gray-100 dark:border-gray-800/60">
          {/* Status selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="text-xs bg-transparent font-semibold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-full"
            >
              {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.toUpperCase().replace('_', ' ')}</option>)}
            </select>
          </div>

          {/* Date range start */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase flex-shrink-0">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1) }}
              className="text-xs bg-transparent font-semibold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-full"
            />
          </div>

          {/* Date range end */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-[10px] font-bold text-gray-400 uppercase flex-shrink-0">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1) }}
              className="text-xs bg-transparent font-semibold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-full"
            />
          </div>
        </div>
      </div>

      {/* Inquiries Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <span className="w-8 h-8 border-4 border-[#0C094D]/30 border-t-[#0C094D] rounded-full animate-spin inline-block" />
            <p className="text-xs text-gray-400 mt-2">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-16 text-center shadow-sm">
            <Mail size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No inquiries match your criteria</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the filters or modifying your search query.</p>
          </div>
        ) : (
          inquiries.map(inq => (
            <div
              key={inq.id}
              onClick={() => handleOpenDetail(inq)}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer transition-all flex flex-col justify-between ${
                inq.status === 'new' ? 'border-l-4 border-l-[#F26C0C] border-gray-100 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{inq.full_name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-extrabold text-[#0C094D] dark:text-[#F26C0C] uppercase tracking-wider">{inq.ticket_number}</span>
                      {inq.company && <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest truncate max-w-[120px]">· {inq.company}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold flex-shrink-0">
                    {new Date(inq.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge status={inq.status} />
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {inq.inquiry_type}
                  </span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {inq.message}
                </p>

                {(inq.product_interest || inq.product_name) && (
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-xs border border-gray-100 dark:border-gray-800">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                      Product: <span className="font-extrabold text-[#0C094D] dark:text-[#F26C0C]">{inq.product_interest || inq.product_name}</span>
                    </p>
                    {inq.quantity && <p className="text-[10px] text-gray-400 mt-0.5">Quantity: {inq.quantity}</p>}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-4 pt-3 text-[10px] text-gray-400 font-medium">
                <span className="truncate max-w-[140px]">{inq.email}</span>
                <span className="flex items-center gap-1 text-[#F26C0C] hover:underline font-bold">
                  Review &amp; Reply <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <Pagination page={page} totalPages={totalPages} onPage={setPage} totalCount={totalCount} pageSize={PAGE_SIZE} />
        </div>
      )}

      {/* Details & Interactive Action Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedInquiry(null)} />
          
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl max-w-4xl w-full p-6 lg:p-8 animate-fade-up max-h-[90vh] overflow-y-auto grid lg:grid-cols-5 gap-6">
            
            {/* Left side: details */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{selectedInquiry.full_name}</h2>
                    <span className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedInquiry.inquiry_type}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-[#F26C0C] mt-1">{selectedInquiry.ticket_number}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Submitted on {new Date(selectedInquiry.created_at).toLocaleString('en-KE')}
                  </p>
                </div>
              </div>

              {/* Status pills control */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update Inquiry Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.filter(s => s !== 'All').map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedInquiry.id, st as AdminInquiry['status'])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedInquiry.status === st
                          ? 'bg-[#0C094D] text-white border-transparent'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {st.toUpperCase().replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact info grid */}
              <div className="grid sm:grid-cols-2 gap-4 text-xs bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60">
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                  <Mail size={14} className="text-[#F26C0C]" />
                  <a href={`mailto:${selectedInquiry.email}`} className="hover:underline font-medium">{selectedInquiry.email}</a>
                </div>
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                  <Phone size={14} className="text-[#F26C0C]" />
                  {selectedInquiry.phone ? (
                    <a href={`tel:${selectedInquiry.phone}`} className="hover:underline font-medium">{selectedInquiry.phone}</a>
                  ) : (
                    <span className="text-gray-400 italic">No phone provided</span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                  <Building2 size={14} className="text-[#F26C0C]" />
                  <span>Company: <span className="font-semibold">{selectedInquiry.company || 'Not Provided'}</span></span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                  <Globe size={14} className="text-[#F26C0C]" />
                  <span>Origin: <span className="font-semibold">{selectedInquiry.country}</span></span>
                </div>
              </div>

              {/* Message content */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inquiry Message</p>
                <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {selectedInquiry.message}
                  </p>
                </div>
              </div>

              {(selectedInquiry.product_interest || selectedInquiry.product_name) && (
                <div className="bg-[#F26C0C]/5 border border-[#F26C0C]/20 rounded-2xl p-4 space-y-1">
                  <p className="text-[10px] font-bold text-[#F26C0C] uppercase tracking-wider">Interested Product Specs</p>
                  <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200">{selectedInquiry.product_interest || selectedInquiry.product_name}</p>
                  {selectedInquiry.quantity && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Requested Volume: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedInquiry.quantity}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right side: Actions (Internal Notes & Reply) */}
            <div className="lg:col-span-2 space-y-6 lg:border-l lg:border-gray-100 lg:dark:border-gray-800 lg:pl-6 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Internal Notes */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Internal Notes</p>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder="Record processing stages, callbacks, followups..."
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors resize-none"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 disabled:opacity-50 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 rounded-xl transition-colors"
                  >
                    {savingNotes ? 'Saving...' : 'Save Internal Notes'}
                  </button>
                </div>

                {/* Direct email response */}
                <form onSubmit={handleSendReply} className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Reply size={14} className="text-[#F26C0C]" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Send Client Email Response</p>
                  </div>
                  <textarea
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    rows={6}
                    required
                    placeholder={`Hi ${selectedInquiry.full_name.split(' ')[0]},\n\nThank you for reaching out to Zenco Systems Ltd...\n\nKind Regards,\nZenco Sales Team`}
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply}
                    className="w-full bg-[#F26C0C] hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
                  >
                    {sendingReply ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Send Official Email Response</>
                    )}
                  </button>
                </form>
              </div>

              {/* Danger Zone: Delete inquiry */}
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6">
                <button
                  onClick={() => setInquiryToDelete(selectedInquiry.id)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!inquiryToDelete}
        title="Delete Customer Inquiry"
        message="Are you sure you want to permanently delete this inquiry? This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Permanently'}
        variant="danger"
        onConfirm={handleDeleteInquiry}
        onCancel={() => setInquiryToDelete(null)}
      />
    </div>
  )
}
