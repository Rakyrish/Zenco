'use client'

import { useEffect, useState } from 'react'
import { Search, FileText, Download, Briefcase, Plus, User, Phone, Mail, Building, MapPin, Calendar, DollarSign, Send, ArrowRight } from 'lucide-react'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import Pagination from '@/components/admin/ui/Pagination'
import { useDebounce, useToast } from '@/lib/admin/hooks'
import { getAdminQuotes, updateQuoteStatus } from '@/lib/admin/api'
import type { AdminQuote } from '@/lib/admin/types'

const STATUS_FILTERS = ['All', 'pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'expired']
const PRIORITY_FILTERS = ['All', 'low', 'normal', 'high', 'urgent']

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<AdminQuote[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  // Interactive Panel details
  const [selectedQuote, setSelectedQuote] = useState<AdminQuote | null>(null)
  const [quoteAmount, setQuoteAmount] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [submittingQuote, setSubmittingQuote] = useState(false)

  const dSearch = useDebounce(search)
  const { success } = useToast()

  useEffect(() => {
    getAdminQuotes().then(data => setQuotes(data.results)).catch(() => setQuotes([]))
  }, [])

  const filtered = quotes.filter(q => {
    const matchSearch =
      !dSearch ||
      q.full_name.toLowerCase().includes(dSearch.toLowerCase()) ||
      q.company?.toLowerCase().includes(dSearch.toLowerCase()) ||
      q.reference_number.toLowerCase().includes(dSearch.toLowerCase()) ||
      q.items.some(item => item.product_name.toLowerCase().includes(dSearch.toLowerCase()))

    const matchStatus = statusFilter === 'All' || q.status === statusFilter
    const matchPriority = priorityFilter === 'All' || q.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleUpdateStatus = async (id: string, status: 'pending' | 'reviewing' | 'quoted' | 'accepted' | 'rejected' | 'expired') => {
    await updateQuoteStatus(id, status)
    setQuotes(prev => prev.map(q => (q.id === id ? { ...q, status, updated_at: new Date().toISOString() } : q)))
    if (selectedQuote?.id === id) {
      setSelectedQuote(prev => prev ? { ...prev, status } : null)
    }
    success('Status Updated', `Quote request status changed to ${status}`)
  }

  const handleSendOfficialQuote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuote || !quoteAmount) return
    setSubmittingQuote(true)

    setTimeout(() => {
      setQuotes(prev =>
        prev.map(q =>
          q.id === selectedQuote.id
            ? {
                ...q,
                status: 'quoted',
                quoted_amount: parseFloat(quoteAmount),
                admin_notes: adminNotes,
                updated_at: new Date().toISOString(),
              }
            : q
        )
      )
      success('Quote Sent', `Official quote of ${selectedQuote.currency} ${parseFloat(quoteAmount).toLocaleString()} dispatched to ${selectedQuote.email}`)
      setSubmittingQuote(false)
      setSelectedQuote(null)
      setQuoteAmount('')
    }, 1000)
  }

  const handleExportCSV = () => {
    // Standard client CSV building
    const headers = ['Reference', 'Client', 'Email', 'Company', 'Status', 'Priority', 'Amount', 'Submitted At']
    const rows = filtered.map(q => [
      q.reference_number,
      q.full_name,
      q.email,
      q.company || 'N/A',
      q.status,
      q.priority,
      q.quoted_amount ? `${q.currency} ${q.quoted_amount}` : 'N/A',
      new Date(q.created_at).toLocaleDateString(),
    ])

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Zenco_Quotes_Export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    success('CSV Exported', 'Downloaded matched quote records directly.')
  }

  const handleOpenDetail = (q: AdminQuote) => {
    setSelectedQuote(q)
    setAdminNotes(q.admin_notes || '')
    setQuoteAmount(q.quoted_amount ? String(q.quoted_amount) : '')
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Quote Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filtered.length} total quote requests · {quotes.filter(q => q.status === 'pending').length} pending review
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] dark:bg-[#F26C0C] dark:hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors self-start sm:self-auto shadow-sm"
        >
          <Download size={16} /> Export Quotes (CSV)
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by quote ref, client name, company or product..."
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
                {STATUS_FILTERS.map(sf => <option key={sf} value={sf}>{sf === 'All' ? 'All Statuses' : sf.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-400 uppercase">Priority:</span>
              <select
                value={priorityFilter}
                onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
                className="text-xs bg-transparent font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                {PRIORITY_FILTERS.map(pf => <option key={pf} value={pf}>{pf === 'All' ? 'All Priorities' : pf.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Quote Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/35 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <th className="p-4">Ref &amp; Date</th>
                <th className="p-4">Client Details</th>
                <th className="p-4">Requested Chemical Products</th>
                <th className="p-4">Status &amp; Priority</th>
                <th className="p-4 text-right">Quoted Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-400">
                    <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No quote requests found</p>
                  </td>
                </tr>
              ) : (
                paginated.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="p-4">
                      <span className="font-extrabold text-[#0C094D] dark:text-[#F26C0C] font-mono text-xs">{q.reference_number}</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(q.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800 dark:text-gray-200">{q.full_name}</p>
                      {q.company && <p className="text-[10px] text-gray-400 font-semibold">{q.company}</p>}
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="space-y-1">
                        {q.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-850 p-1.5 rounded-lg">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{item.product_name}</span>
                            <span className="font-extrabold text-[#0C094D] dark:text-orange-400 font-mono text-[10px]">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div><StatusBadge status={q.status} /></div>
                      <div><StatusBadge status={q.priority} /></div>
                    </td>
                    <td className="p-4 text-right font-extrabold text-gray-900 dark:text-white font-mono">
                      {q.quoted_amount ? `${q.currency} ${q.quoted_amount.toLocaleString()}` : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(q)}
                        className="text-xs font-bold text-[#F26C0C] bg-orange-50 dark:bg-orange-950/20 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Block */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} totalCount={filtered.length} pageSize={PAGE_SIZE} />
          </div>
        )}
      </div>

      {/* Quote Details & Replying Dialog Drawer */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedQuote(null)} />

          <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl max-w-4xl w-full p-6 lg:p-8 animate-fade-up max-h-[90vh] overflow-y-auto grid lg:grid-cols-5 gap-6">
            
            {/* Left side: specs and details */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white font-mono">{selectedQuote.reference_number}</h2>
                    <StatusBadge status={selectedQuote.status} />
                    <StatusBadge status={selectedQuote.priority} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Requested on {new Date(selectedQuote.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Status pills control */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Administrative Quote Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'expired'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedQuote.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedQuote.status === st
                          ? 'bg-[#0C094D] text-white border-transparent'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {st.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Info details block */}
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                  <User size={14} className="text-[#F26C0C]" />
                  <span className="font-semibold">{selectedQuote.full_name}</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                  <Mail size={14} className="text-[#F26C0C]" />
                  <a href={`mailto:${selectedQuote.email}`} className="hover:underline font-medium">{selectedQuote.email}</a>
                </div>
                {selectedQuote.phone && (
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                    <Phone size={14} className="text-[#F26C0C]" />
                    <a href={`tel:${selectedQuote.phone}`} className="hover:underline font-medium">{selectedQuote.phone}</a>
                  </div>
                )}
                {selectedQuote.company && (
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                    <Building size={14} className="text-[#F26C0C]" />
                    <span className="font-semibold">{selectedQuote.company} ({selectedQuote.country})</span>
                  </div>
                )}
                {selectedQuote.delivery_address && (
                  <div className="col-span-2 flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                    <MapPin size={14} className="text-[#F26C0C]" />
                    <span>Delivery destination: <span className="font-semibold">{selectedQuote.delivery_address}</span></span>
                  </div>
                )}
              </div>

              {/* Quote Products Requested */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Requested Chemicals Products List</p>
                <div className="space-y-2">
                  {selectedQuote.items.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200">{item.product_name}</p>
                        {item.notes && <p className="text-[11px] text-gray-400 italic mt-0.5">Notes: {item.notes}</p>}
                      </div>
                      <span className="bg-[#0C094D]/10 dark:bg-orange-950/20 text-[#0C094D] dark:text-orange-400 font-mono font-bold text-xs px-3 py-1.5 rounded-xl">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuote.special_requirements && (
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Client Special Requirements</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{selectedQuote.special_requirements}</p>
                </div>
              )}
            </div>

            {/* Right side: administrative operations */}
            <div className="lg:col-span-2 space-y-6 lg:border-l lg:border-gray-100 lg:dark:border-gray-800 lg:pl-6">
              <form onSubmit={handleSendOfficialQuote} className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dispatch Official Commercial Quote</p>

                {/* Amount input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Quoted Value ({selectedQuote.currency})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">{selectedQuote.currency}</span>
                    <input
                      type="number"
                      required
                      value={quoteAmount}
                      onChange={e => setQuoteAmount(e.target.value)}
                      placeholder="e.g. 150000"
                      className="w-full pl-12 pr-4 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors"
                    />
                  </div>
                </div>

                {/* Admin notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Administrative Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={6}
                    placeholder="Enter dispatch notes, cargo specifications, shipping margins..."
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="w-full bg-[#F26C0C] hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
                >
                  {submittingQuote ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={13} /> Send Official Quote Document
                    </>
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
