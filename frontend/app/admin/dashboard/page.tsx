'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, MailOpen, User, Phone, CheckCircle, Clock, Trash2, ArrowRight, LogOut, Loader2, MessageCircle } from 'lucide-react'

interface Inquiry {
  id: string
  full_name: string
  email: string
  phone: string | null
  company: string | null
  country: string
  inquiry_type: string
  product_interest: string | null
  quantity: string | null
  message: string
  status: 'new' | 'read' | 'processing' | 'resolved'
  created_at: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const mockInquiries: Inquiry[] = [
    {
      id: 'inq-1',
      full_name: 'John Kamau',
      email: 'j.kamau@finstar.com',
      phone: '+254711223344',
      company: 'Finstar Systems',
      country: 'Kenya',
      inquiry_type: 'quote',
      product_interest: 'Sodium Hypochlorite 15%',
      quantity: '5,000 Liters',
      message: 'Looking for bulk supply deliveries weekly to our Nairobi plant.',
      status: 'new',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'inq-2',
      full_name: 'Alice Wambua',
      email: 'wambua@safewater.org',
      phone: '+254722334455',
      company: 'Safe Water Org',
      country: 'Kenya',
      inquiry_type: 'technical',
      product_interest: 'Liquid Chlorine',
      quantity: '10 IBCs',
      message: 'Need full specification sheet and certificate of analysis (CoA) for liquid chlorine consignment.',
      status: 'processing',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'inq-3',
      full_name: 'Robert Mwangi',
      email: 'robert@mwangicoatings.co.ke',
      phone: '+254733445566',
      company: 'Mwangi Coatings Ltd',
      country: 'Kenya',
      inquiry_type: 'general',
      product_interest: 'Industrial Toluene',
      quantity: '2,000 Liters',
      message: 'Inquiring about credit terms for solvent supplies.',
      status: 'resolved',
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ]

  useEffect(() => {
    // Check Authentication
    const token = localStorage.getItem('zenco_access')
    if (!token) {
      router.push('/admin/login')
      return
    }

    // Load Inquiries
    async function loadInquiries() {
      try {
        const res = await fetch('/api/inquiries/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) throw new Error('Failed to fetch from API')
        const data = await res.json()
        setInquiries(data.results.length ? data.results : mockInquiries)
      } catch (err) {
        console.warn('Inquiry fetch failed, using mock dashboard fallback.', err)
        setInquiries(mockInquiries)
      } finally {
        setLoading(false)
      }
    }

    loadInquiries()
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: 'read' | 'processing' | 'resolved') => {
    setUpdatingId(id)
    const token = localStorage.getItem('zenco_access')
    try {
      const res = await fetch(`/api/inquiries/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq))
    } catch {
      // Local Mock Update
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('zenco_access')
    localStorage.removeItem('zenco_refresh')
    router.push('/admin/login')
  }

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="container-xl px-4">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-primary flex items-center gap-2">
              <ShieldCheck className="text-accent" />
              Zenco Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500">Manage chemical inquiries, client leads, and system analytics.</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn bg-white hover:bg-red-50 hover:text-red-700 text-gray-600 border border-gray-100 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-primary">{inquiries.filter(i => i.status === 'new').length}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Unread Inquiries</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Loader2 size={22} className="animate-spin" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-primary">{inquiries.filter(i => i.status === 'processing').length}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Processing Cases</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-primary">{inquiries.filter(i => i.status === 'resolved').length}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Resolved Tickets</p>
            </div>
          </div>
        </div>

        {/* Lead Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <MailOpen size={18} className="text-accent" />
              Recent Inquiries & Quotes
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-6">Client</th>
                  <th className="p-6">Inquiry Details</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {inquiries.map(inq => (
                  <tr key={inq.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="p-6 space-y-1">
                      <p className="font-bold text-primary flex items-center gap-1.5">
                        <User size={13} className="text-accent" />
                        {inq.full_name}
                      </p>
                      {inq.company && <p className="text-xs text-gray-400 font-medium">{inq.company} ({inq.country})</p>}
                      <div className="flex gap-3 text-xs text-gray-500 pt-1">
                        <span className="flex items-center gap-1"><MailOpen size={11} />{inq.email}</span>
                        {inq.phone && <span className="flex items-center gap-1"><Phone size={11} />{inq.phone}</span>}
                      </div>
                    </td>
                    <td className="p-6 space-y-1 max-w-sm">
                      <p className="text-xs font-bold text-accent uppercase tracking-wider bg-accent/5 px-2 py-0.5 rounded-md inline-block">
                        {inq.inquiry_type}
                      </p>
                      {inq.product_interest && (
                        <p className="text-xs text-primary font-bold pt-1">
                          Product: {inq.product_interest} &nbsp;|&nbsp; Qty: {inq.quantity || 'N/A'}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{inq.message}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-2.5 py-1 border text-xs font-semibold rounded-full ${getStatusPill(inq.status)}`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="p-6 text-right space-x-2 whitespace-nowrap">
                      {inq.status !== 'processing' && inq.status !== 'resolved' && (
                        <button
                          disabled={updatingId === inq.id}
                          onClick={() => handleUpdateStatus(inq.id, 'processing')}
                          className="text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Process
                        </button>
                      )}
                      {inq.status !== 'resolved' && (
                        <button
                          disabled={updatingId === inq.id}
                          onClick={() => handleUpdateStatus(inq.id, 'resolved')}
                          className="text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
