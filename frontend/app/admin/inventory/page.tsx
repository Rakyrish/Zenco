'use client'

import { useEffect, useState } from 'react'
import { Package, Search, Plus, Minus, Check, RefreshCw, AlertTriangle, ArrowUpRight } from 'lucide-react'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import Pagination from '@/components/admin/ui/Pagination'
import { useDebounce, useToast } from '@/lib/admin/hooks'
import { getInventory, updateInventoryStock } from '@/lib/admin/api'
import type { InventoryItem } from '@/lib/admin/types'

const CATEGORIES = ['All', 'Water Treatment', 'Solvents & Thinners', 'Cleaning & Disinfection', 'Paints & Coatings']
const FILTER_STOCK_LEVELS = ['All', 'low', 'normal', 'out_of_stock']

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [stockFilter, setStockFilter] = useState('All')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  // Buffer state to hold edits before saving
  const [edits, setEdits] = useState<Record<string, { stock_quantity: number; reorder_level: number }>>({})

  const dSearch = useDebounce(search)
  const { success } = useToast()

  useEffect(() => {
    getInventory().then(data => setInventory(data.results)).catch(() => setInventory([]))
  }, [])

  const filtered = inventory.filter(item => {
    const matchSearch =
      !dSearch ||
      item.product_name.toLowerCase().includes(dSearch.toLowerCase()) ||
      (item.product_sku && item.product_sku.toLowerCase().includes(dSearch.toLowerCase()))


    const matchCat = categoryFilter === 'All' || item.category_name === categoryFilter

    const matchLevel =
      stockFilter === 'All' ||
      (stockFilter === 'low' && item.is_low_stock && item.stock_quantity > 0) ||
      (stockFilter === 'out_of_stock' && item.stock_quantity === 0) ||
      (stockFilter === 'normal' && !item.is_low_stock && item.stock_quantity > 0)

    return matchSearch && matchCat && matchLevel
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleStockChange = (id: string, delta: number) => {
    const current = edits[id] || {
      stock_quantity: inventory.find(i => i.id === id)?.stock_quantity || 0,
      reorder_level: inventory.find(i => i.id === id)?.reorder_level || 0,
    }
    const newQty = Math.max(0, current.stock_quantity + delta)
    setEdits(prev => ({
      ...prev,
      [id]: { ...current, stock_quantity: newQty },
    }))
  }

  const handleReorderLevelChange = (id: string, val: string) => {
    const parsed = parseInt(val) || 0
    const current = edits[id] || {
      stock_quantity: inventory.find(i => i.id === id)?.stock_quantity || 0,
      reorder_level: inventory.find(i => i.id === id)?.reorder_level || 0,
    }
    setEdits(prev => ({
      ...prev,
      [id]: { ...current, reorder_level: Math.max(0, parsed) },
    }))
  }

  const handleSaveItem = async (id: string) => {
    const edit = edits[id]
    if (!edit) return

    await updateInventoryStock(id, edit.stock_quantity)
    setInventory(prev =>
      prev.map(item => {
        if (item.id === id) {
          const isLow = edit.stock_quantity <= edit.reorder_level
          return {
            ...item,
            stock_quantity: edit.stock_quantity,
            reorder_level: edit.reorder_level,
            is_low_stock: isLow,
            status: edit.stock_quantity === 0 ? 'out_of_stock' : isLow ? 'limited' : 'in_stock',
            last_updated: new Date().toISOString(),
          }
        }
        return item
      })
    )

    setEdits(prev => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
    success('Inventory Updated', 'Stock counts and warning thresholds saved successfully.')
  }

  const handleBatchSaveAll = () => {
    const keys = Object.keys(edits)
    if (!keys.length) return

    setInventory(prev =>
      prev.map(item => {
        const edit = edits[item.id]
        if (edit) {
          const isLow = edit.stock_quantity <= edit.reorder_level
          return {
            ...item,
            stock_quantity: edit.stock_quantity,
            reorder_level: edit.reorder_level,
            is_low_stock: isLow,
            status: edit.stock_quantity === 0 ? 'out_of_stock' : isLow ? 'limited' : 'in_stock',
            last_updated: new Date().toISOString(),
          }
        }
        return item
      })
    )
    setEdits({})
    success('Batch Save Complete', 'All changes to inventory have been published.')
  }

  const pendingEditsCount = Object.keys(edits).length

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="text-[#F26C0C]" /> Inventory &amp; Stock
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage chemical reserves, adjust volume thresholds, and trigger restock flags.
          </p>
        </div>
        {pendingEditsCount > 0 && (
          <button
            onClick={handleBatchSaveAll}
            className="flex items-center gap-2 bg-[#F26C0C] hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Check size={16} /> Save All Pending Edits ({pendingEditsCount})
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by SKU, product name..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 dark:text-white placeholder-gray-400 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-400 uppercase">Category:</span>
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
                className="text-xs bg-transparent font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-400 uppercase">Alert Level:</span>
              <select
                value={stockFilter}
                onChange={e => { setStockFilter(e.target.value); setPage(1) }}
                className="text-xs bg-transparent font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                {FILTER_STOCK_LEVELS.map(fl => (
                  <option key={fl} value={fl}>
                    {fl === 'All' ? 'All stock levels' : fl === 'low' ? 'Low Stock Warning' : fl === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/35 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <th className="p-4">SKU / CHEMICAL NAME</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4">STOCK STATUS</th>
                <th className="p-4 text-center">QUANTITY LEVEL</th>
                <th className="p-4 text-center">REORDER ALERT THRESHOLD</th>
                <th className="p-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-400">
                    <AlertTriangle size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No stock items found</p>
                  </td>
                </tr>
              ) : (
                paginated.map(item => {
                  const isModified = !!edits[item.id]
                  const editedQty = isModified ? edits[item.id].stock_quantity : item.stock_quantity
                  const editedThreshold = isModified ? edits[item.id].reorder_level : item.reorder_level
                  const isLow = editedQty <= editedThreshold

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-colors ${
                        isLow ? 'bg-red-50/10 dark:bg-red-950/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <span className="font-extrabold text-[#0C094D] dark:text-[#F26C0C] font-mono text-xs">{item.product_sku}</span>

                        <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{item.product_name}</p>
                      </td>
                      <td className="p-4 text-xs font-semibold text-gray-500">{item.category_name}</td>
                      <td className="p-4">
                        <StatusBadge status={editedQty === 0 ? 'out_of_stock' : isLow ? 'limited' : 'in_stock'} />
                      </td>
                      
                      {/* Quantity control */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStockChange(item.id, -10)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <span className={`w-14 text-center font-extrabold text-sm ${isModified ? 'text-[#F26C0C]' : 'text-gray-900 dark:text-white'}`}>
                            {editedQty}
                          </span>
                          <button
                            onClick={() => handleStockChange(item.id, 10)}
                            className="p-1 text-gray-400 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase">{item.unit}</span>
                        </div>
                      </td>

                      {/* Threshold limit */}
                      <td className="p-4">
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            value={editedThreshold}
                            onChange={e => handleReorderLevelChange(item.id, e.target.value)}
                            className={`w-16 px-2 py-1 text-xs text-center bg-gray-50 dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0C094D]/30 dark:text-white font-mono ${
                              isModified ? 'border-[#F26C0C]' : 'border-gray-200 dark:border-gray-700'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Action save single */}
                      <td className="p-4 text-right">
                        {isModified ? (
                          <button
                            onClick={() => handleSaveItem(item.id)}
                            className="text-[11px] font-bold text-white bg-green-600 px-2.5 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Apply
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium">Synced</span>
                        )}
                      </td>

                    </tr>
                  )
                })
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

    </div>
  )
}
