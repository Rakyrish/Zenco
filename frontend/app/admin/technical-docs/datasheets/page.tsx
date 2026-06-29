'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, FileText, Eye, Edit, Trash2, Download, RefreshCw,
  Loader2, AlertTriangle, BarChart2, BookOpen, ExternalLink,
} from 'lucide-react'
import {
  getDatasheetOverview,
  getAdminProductDataSheets,
  deleteProductDataSheet,
  publishProductDataSheet,
  unpublishProductDataSheet,
  regenerateDatasheet,
  bulkGenerateDatasheets,
  getBulkDatasheetStatus,
  downloadDatasheetPdf,
} from '@/lib/admin/api'
import type { ProductDataSheet, DatasheetOverview } from '@/lib/admin/types'
import ConfirmModal from '@/components/admin/ui/ConfirmModal'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import Pagination from '@/components/admin/ui/Pagination'
import { useToast } from '@/lib/admin/hooks'

const STATUS_OPTS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

export default function AdminDatasheetsPage() {
  const [overview, setOverview] = useState<DatasheetOverview | null>(null)
  const [sheets, setSheets] = useState<ProductDataSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<ProductDataSheet | null>(null)
  const [bulkTaskId, setBulkTaskId] = useState<string | null>(null)
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)
  const { success, error } = useToast()
  const PAGE_SIZE = 12

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ov, data] = await Promise.all([
        getDatasheetOverview(),
        getAdminProductDataSheets({ search, status, page }),
      ])
      setOverview(ov)
      setSheets(data.results)
      setTotalCount(data.count)
    } catch {
      setSheets([])
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    if (!bulkTaskId) return
    const interval = setInterval(async () => {
      try {
        const st = await getBulkDatasheetStatus(bulkTaskId)
        if (st.state === 'PROGRESS' && st.current && st.total) {
          setBulkProgress({ current: st.current, total: st.total })
        }
        if (st.state === 'SUCCESS' || st.state === 'FAILURE') {
          setBulkTaskId(null)
          setBulkProgress(null)
          load()
          success(st.state === 'SUCCESS' ? 'Bulk generation complete' : 'Bulk generation finished with errors')
        }
      } catch { /* ignore */ }
    }, 2000)
    return () => clearInterval(interval)
  }, [bulkTaskId, load, success])

  const handleBulkGenerate = async () => {
    try {
      const res = await bulkGenerateDatasheets()
      setBulkTaskId(res.task_id)
      success('Bulk generation started')
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : 'Bulk generation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProductDataSheet(deleteTarget.id)
      setDeleteTarget(null)
      load()
      success('Datasheet deleted')
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const togglePublish = async (sheet: ProductDataSheet) => {
    setActionId(sheet.id)
    try {
      if (sheet.status === 'published') {
        await unpublishProductDataSheet(sheet.id)
      } else {
        await publishProductDataSheet(sheet.id)
      }
      load()
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : 'Status update failed')
    } finally {
      setActionId(null)
    }
  }

  const handleRegenerate = async (sheet: ProductDataSheet) => {
    setActionId(sheet.id)
    try {
      await regenerateDatasheet(sheet.id)
      success('Datasheet regenerated')
      load()
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : 'Regeneration failed')
    } finally {
      setActionId(null)
    }
  }

  const pct = bulkProgress ? Math.round((bulkProgress.current / bulkProgress.total) * 100) : 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Product Data Sheets</h1>
          <p className="text-sm text-gray-500 mt-1">AI-generated Technical Data Sheets linked to products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/technical-docs" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <BookOpen size={16} /> Library Docs
          </Link>
          <Link href="/admin/technical-docs/generate" className="inline-flex items-center gap-2 rounded-xl bg-[#0C094D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a1570]">
            <Sparkles size={16} /> Generate Datasheet
          </Link>
        </div>
      </div>

      {overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Total Products', overview.total_products],
            ['Generated', overview.datasheets_generated],
            ['Published', overview.datasheets_published],
            ['Without TDS', overview.products_without_datasheet],
            ['Total Views', overview.total_datasheet_views],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {overview && overview.products_without_datasheet > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex flex-wrap items-start gap-4">
            <AlertTriangle className="text-amber-600 shrink-0" size={22} />
            <div className="flex-1">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                {overview.products_without_datasheet} product(s) do not have a Technical Data Sheet yet.
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Estimated ~{overview.estimated_tokens_per_datasheet.toLocaleString()} tokens per datasheet.
                Total tokens used so far: {overview.total_tokens_used.toLocaleString()}.
              </p>
              {bulkProgress ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">
                    Generating: {bulkProgress.current} / {bulkProgress.total} complete
                  </p>
                  <div className="h-2 rounded-full bg-amber-200 overflow-hidden">
                    <div className="h-full bg-amber-600 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleBulkGenerate}
                  disabled={!!bulkTaskId}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {bulkTaskId ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generate All Datasheets with AI
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search product or title..."
          className="flex-1 min-w-[200px] rounded-xl border border-gray-200 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
        >
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : sheets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p>No datasheets yet. Generate one to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Product</th>
                <th className="px-4 py-3 text-left font-bold">Version</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">Views</th>
                <th className="px-4 py-3 text-left font-bold">Flags</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map(sheet => (
                <tr key={sheet.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{sheet.product_name}</p>
                    <p className="text-xs text-gray-500">{sheet.product_sku || sheet.product_slug}</p>
                  </td>
                  <td className="px-4 py-3">v{sheet.version}</td>
                  <td className="px-4 py-3"><StatusBadge status={sheet.status} /></td>
                  <td className="px-4 py-3">{sheet.view_count}</td>
                  <td className="px-4 py-3">
                    {sheet.validation_flags?.length ? (
                      <span className="text-xs text-amber-600">{sheet.validation_flags.length} flag(s)</span>
                    ) : (
                      <span className="text-xs text-green-600">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end flex-wrap gap-1">
                      {sheet.status === 'published' && (
                        <a href={`/products/${sheet.product_slug}/datasheet`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100" title="View">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      <Link href={`/admin/technical-docs/datasheets/${sheet.id}/edit`} className="p-2 rounded-lg hover:bg-gray-100" title="Edit">
                        <Edit size={15} />
                      </Link>
                      <button onClick={() => togglePublish(sheet)} disabled={actionId === sheet.id} className="p-2 rounded-lg hover:bg-gray-100" title={sheet.status === 'published' ? 'Unpublish' : 'Publish'}>
                        {actionId === sheet.id ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => handleRegenerate(sheet)} disabled={actionId === sheet.id} className="p-2 rounded-lg hover:bg-gray-100" title="Regenerate">
                        <RefreshCw size={15} />
                      </button>
                      <button
                        onClick={() => downloadDatasheetPdf(sheet.id, `TDS_${sheet.product_name.replace(/\s/g, '_')}_v${sheet.version}.pdf`).catch(e => error(e.message))}
                        className="p-2 rounded-lg hover:bg-gray-100"
                        title="Download PDF"
                      >
                        <Download size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(sheet)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPage={setPage}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Datasheet"
        message={`Delete TDS for "${deleteTarget?.product_name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
