'use client'

import { useEffect, useState } from 'react'
import { Search, Mail, Phone, Building2, Globe, Calendar, CheckCircle2, AlertCircle, Clock, FileText, Reply, ArrowRight } from 'lucide-react'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import ConfirmModal from '@/components/admin/ui/ConfirmModal'
import Pagination from '@/components/admin/ui/Pagination'
import { useDebounce, useToast } from '@/lib/admin/hooks'
import { getAdminInquiries, updateInquiryStatus } from '@/lib/admin/api'
import type { AdminInquiry } from '@/lib/admin/types'

const STATUS_FILTERS = ['All', 'new', 'processing', 'resolved', 'closed']
const TYPE_FILTERS = ['All', 'general', 'product', 'quote', 'partnership', 'technical', 'complaint']

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  // Detail Modal & Reply State
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const dSearch = useDebounce(search)
  const { success, error: toastError } = useToast()

  useEffect(() => {
    getAdminInquiries().then(data => setInquiries(data.results)).catch(() => setInquiries([]))
  }, [])

  const filtered = inquiries.filter(inq => {
    const matchSearch =
      !dSearch ||
      inq.full_name.toLowerCase().includes(dSearch.toLowerCase()) ||
      inq.email.toLowerCase().includes(dSearch.toLowerCase()) ||
      (inq.company && inq.company.toLowerCase().includes(dSearch.toLowerCase())) ||
      (inq.product_interest && inq.product_interest.toLowerCase().includes(dSearch.toLowerCase()))
    
    const matchStatus = statusFilter === 'All' || inq.status === statusFilter
    const matchType = typeFilter === 'All' || inq.inquiry_type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleUpdateStatus = async (id: string, newStatus: 'new' | 'processing' | 'resolved' | 'closed') => {
    try {
      const updated = await updateInquiryStatus(id, newStatus)
      setInquiries(prev => prev.map(inq => (inq.id === id ? updated : inq)))
      if (selectedInquiry?.id === id) setSelectedInquiry(updated)
      success('Status Updated', `Inquiry status changed to ${newStatus}`)
    } catch (err) {
      toastError('Update failed', err instanceof Error ? err.message : 'Could not update inquiry.')
    }
  }

  const handleSaveNotes = () => {
    if (!selectedInquiry) return
    setInquiries(prev =>
      prev.map(inq => (inq.id === selectedInquiry.id ? { ...inq, admin_notes: adminNotes, updated_at: new Date().toISOString() } : inq))
    )
    success('Notes Saved', 'Internal administrator notes updated successfully.')
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInquiry || !replyMessage.trim()) return
    setSendingReply(true)
    
    // Simulate API delay
    setTimeout(() => {
      setInquiries(prev =>
        prev.map(inq =>
          inq.id === selectedInquiry.id
            ? {
                ...inq,
                status: 'resolved',
                replied_at: new Date().toISOString(),
                admin_notes: `${inq.admin_notes || ''}\n[Reply sent on ${new Date().toLocaleDateString()}]: ${replyMessage}`.trim(),
                updated_at: new Date().toISOString(),
              }
            : inq
        )
      )
      
      success('Reply Dispatched', `Email response sent directly to ${selectedInquiry.email}`)
      setReplyMessage('')
      setSendingReply(false)
      setSelectedInquiry(null)
    }, 1000)
  }

  const handleOpenDetail = (inq: AdminInquiry) => {
    setSelectedInquiry(inq)
    setAdminNotes(inq.admin_notes || '')
    setReplyMessage('')
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Customer Inquiries</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filtered.length} inquiries matched · {inquiries.filter(i => i.status === 'new').length} unread
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by client name, email, company or product..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 dark:text-white placeholder-gray-400 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-400 uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="text-xs bg-transparent font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-400 uppercase">Type:</span>
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                className="text-xs bg-transparent font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                {TYPE_FILTERS.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiries Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginated.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-16 text-center shadow-sm">
            <Mail size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No inquiries found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          paginated.map(inq => (
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
                    {inq.company && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{inq.company}</p>}
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold flex-shrink-0">
                    {new Date(inq.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge status={inq.status} />
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {inq.inquiry_type}
                  </span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {inq.message}
                </p>

                {inq.product_interest && (
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2 text-xs">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                      Product: <span className="font-extrabold text-[#0C094D] dark:text-[#F26C0C]">{inq.product_interest}</span>
                    </p>
                    {inq.quantity && <p className="text-[10px] text-gray-400 mt-0.5">Quantity: {inq.quantity}</p>}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-4 pt-3 text-[10px] text-gray-400 font-medium">
                <span className="truncate max-w-[150px]">{inq.email}</span>
                <span className="flex items-center gap-1 text-[#F26C0C] hover:underline font-bold">
                  Review &amp; Reply <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <Pagination page={page} totalPages={totalPages} onPage={setPage} totalCount={filtered.length} pageSize={PAGE_SIZE} />
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
                    <span className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedInquiry.inquiry_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Submitted on {new Date(selectedInquiry.created_at).toLocaleString('en-KE')}
                  </p>
                </div>
              </div>

              {/* Status pills control */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update Inquiry Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'processing', 'resolved', 'closed'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedInquiry.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedInquiry.status === st
                          ? 'bg-[#0C094D] text-white border-transparent'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {st.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact info grid */}
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                  <Mail size={14} className="text-[#F26C0C]" />
                  <a href={`mailto:${selectedInquiry.email}`} className="hover:underline font-medium">{selectedInquiry.email}</a>
                </div>
                {selectedInquiry.phone && (
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                    <Phone size={14} className="text-[#F26C0C]" />
                    <a href={`tel:${selectedInquiry.phone}`} className="hover:underline font-medium">{selectedInquiry.phone}</a>
                  </div>
                )}
                {selectedInquiry.company && (
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                    <Building2 size={14} className="text-[#F26C0C]" />
                    <span className="font-semibold">{selectedInquiry.company}</span>
                  </div>
                )}
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

              {selectedInquiry.product_interest && (
                <div className="bg-[#F26C0C]/5 border border-[#F26C0C]/20 rounded-2xl p-4 space-y-1">
                  <p className="text-[10px] font-bold text-[#F26C0C] uppercase tracking-wider">Interested Product Specs</p>
                  <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200">{selectedInquiry.product_interest}</p>
                  {selectedInquiry.quantity && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Requested Volume: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedInquiry.quantity}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right side: Actions (Internal Notes & Reply) */}
            <div className="lg:col-span-2 space-y-6 lg:border-l lg:border-gray-100 lg:dark:border-gray-800 lg:pl-6">
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
                  className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 rounded-xl transition-colors"
                >
                  Save Internal Notes
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
          </div>
        </div>
      )}
    </div>
  )
}
