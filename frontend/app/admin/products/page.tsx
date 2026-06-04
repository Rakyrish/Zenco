'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Star, Package, Filter } from 'lucide-react'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import ConfirmModal from '@/components/admin/ui/ConfirmModal'
import Pagination from '@/components/admin/ui/Pagination'
import { useDebounce, useToast, useConfirm } from '@/lib/admin/hooks'
import { deleteProduct, getAdminProducts, updateProduct } from '@/lib/admin/api'
import type { AdminProduct } from '@/lib/admin/types'

const CATEGORIES = ['All', 'Water Treatment', 'Solvents & Thinners', 'Cleaning & Disinfection', 'Paints & Coatings']
const STATUSES = ['All', 'published', 'draft', 'archived']

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const dSearch = useDebounce(search)
  const { toasts: _, success, error: toastError } = useToast()
  const { confirmState, confirm, closeConfirm, handleConfirm } = useConfirm()

  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await getAdminProducts({ page })
        setProducts(data.results)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load products.')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [page])

  const filtered = products.filter(p => {
    const matchSearch = !dSearch || p.name.toLowerCase().includes(dSearch.toLowerCase()) || p.category_name.toLowerCase().includes(dSearch.toLowerCase())
    const matchCat = category === 'All' || p.category_name === category
    const matchStatus = status === 'All' || p.status === status
    return matchSearch && matchCat && matchStatus
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleDelete = (p: AdminProduct) => {
    confirm('Delete Product', `Are you sure you want to delete "${p.name}"? This action cannot be undone.`, async () => {
      try {
        await deleteProduct(p.id)
        setProducts(prev => prev.filter(x => x.id !== p.id))
        success('Product deleted', `"${p.name}" has been removed.`)
      } catch (err) {
        toastError('Delete failed', err instanceof Error ? err.message : 'Could not delete product.')
      }
    })
  }

  const handleToggleFeatured = async (p: AdminProduct) => {
    try {
      await updateProduct(p.id, { is_featured: !p.is_featured })
    } catch (err) {
      toastError('Update failed', err instanceof Error ? err.message : 'Could not update product.')
      return
    }
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_featured: !x.is_featured } : x))
    success(p.is_featured ? 'Removed from featured' : 'Marked as featured')
  }

  const availColor: Record<string, string> = {
    in_stock: 'text-green-600', limited: 'text-amber-600',
    out_of_stock: 'text-red-600', on_order: 'text-blue-600',
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{loading ? 'Loading products...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}</p>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search products by name or category…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 dark:text-white placeholder-gray-400 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Availability</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loadError ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-red-600">{loadError}</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center">
                  <Package size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No products found</p>
                </td></tr>
              ) : paginated.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0C094D]/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-full w-full rounded-xl object-cover" loading="lazy" />
                        ) : (
                          <Package size={16} className="text-[#0C094D]/40 dark:text-white/30" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.short_description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">{p.category_name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold ${availColor[p.availability] || 'text-gray-600'}`}>
                      {p.availability.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-bold tabular-nums ${p.stock_quantity <= p.reorder_level ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                      {p.stock_quantity}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">units</span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleToggleFeatured(p)} title={p.is_featured ? 'Remove featured' : 'Mark featured'}
                        className={`p-1.5 rounded-lg transition-colors ${p.is_featured ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
                        <Star size={15} fill={p.is_featured ? 'currentColor' : 'none'} />
                      </button>
                      <Link href={`/admin/products/${p.id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Edit size={15} />
                      </Link>
                      <button onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} totalCount={filtered.length} pageSize={PAGE_SIZE} />
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmState.open} title={confirmState.title} message={confirmState.message}
        onConfirm={handleConfirm} onCancel={closeConfirm} variant="danger"
      />
    </div>
  )
}
