'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus, Search, FileText, BookOpen, Shield, Eye, EyeOff,
  Trash2, Edit, ExternalLink, Download, RefreshCw, Loader2, Filter,
} from 'lucide-react'
import { getAdminTechnicalDocuments, deleteTechnicalDocument, updateTechnicalDocument } from '@/lib/admin/api'
import type { TechnicalDocument } from '@/lib/admin/types'
import ConfirmModal from '@/components/admin/ui/ConfirmModal'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import Pagination from '@/components/admin/ui/Pagination'

const DOC_TYPE_OPTS = [
  { value: '', label: 'All Types' },
  { value: 'datasheet', label: 'Data Sheets' },
  { value: 'iso_guide', label: 'ISO Guides' },
  { value: 'kebs_guide', label: 'KEBS Guides' },
  { value: 'whitepaper', label: 'Whitepapers' },
  { value: 'case_study', label: 'Case Studies' },
  { value: 'iec_guide', label: 'IEC Guides' },
]

const DOC_TYPE_ICONS: Record<string, React.ElementType> = {
  datasheet: FileText,
  iso_guide: Shield,
  kebs_guide: Shield,
  whitepaper: BookOpen,
  case_study: BookOpen,
  iec_guide: Shield,
}

export default function AdminTechnicalDocsPage() {
  const [docs, setDocs] = useState<TechnicalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [docType, setDocType] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<TechnicalDocument | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const PAGE_SIZE = 16

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminTechnicalDocuments({ search, doc_type: docType, page })
      setDocs(data.results)
      setTotalCount(data.count)
    } catch {
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [search, docType, page])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTechnicalDocument(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch { /* suppress */ } finally {
      setDeleting(false)
    }
  }

  const togglePublished = async (doc: TechnicalDocument) => {
    setToggling(doc.id)
    try {
      await updateTechnicalDocument(doc.id, { is_published: !doc.is_published })
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, is_published: !d.is_published } : d))
    } catch { /* suppress */ } finally {
      setToggling(null)
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Technical Documents Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalCount} document{totalCount !== 1 ? 's' : ''} in library</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/technical-docs/datasheets" className="flex items-center gap-2 border border-gray-200 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50">
            <FileText size={16} /> Product TDS
          </Link>
          <Link href="/admin/technical-docs/generate" className="flex items-center gap-2 border border-[#F26C0C]/30 text-[#F26C0C] text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-orange-50">
            Generate TDS
          </Link>
          <Link
            href="/admin/technical-docs/new"
            className="flex items-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> New Document
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search title, excerpt, standard code…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={docType}
            onChange={e => { setDocType(e.target.value); setPage(1) }}
            className="pl-8 pr-8 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 appearance-none"
          >
            {DOC_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-[#0C094D] hover:border-[#0C094D]/30 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading documents…</span>
          </div>
        ) : docs.length === 0 ? (
          <div className="py-20 text-center">
            <FileText size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No documents found</p>
            <p className="text-xs text-gray-400 mb-4">Run <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">python manage.py seed_technical_docs --publish</code> to populate</p>
            <Link href="/admin/technical-docs/new" className="text-sm font-semibold text-[#0C094D] hover:underline">
              Create your first document →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3.5">Document</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Type</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Standard</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Views</th>
                  <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {docs.map(doc => {
                  const Icon = DOC_TYPE_ICONS[doc.doc_type] || FileText
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-[#0C094D]/5 dark:bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon size={14} className="text-[#0C094D] dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">{doc.title}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-xs">{doc.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs font-semibold text-[#0C094D] dark:text-blue-300 bg-[#0C094D]/5 dark:bg-blue-400/10 px-2 py-1 rounded-lg">
                          {doc.doc_type_display}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {doc.standard_code ? (
                          <span className="text-xs font-mono text-[#F26C0C] bg-[#F26C0C]/5 px-2 py-1 rounded-lg">{doc.standard_code}</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Eye size={12} />
                          {(doc.view_count || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={doc.is_published ? 'published' : 'draft'} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/technical-docs/${doc.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View public page"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#0C094D] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                          {doc.pdf_file && (
                            <a
                              href={doc.pdf_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Download PDF"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => togglePublished(doc)}
                            disabled={toggling === doc.id}
                            title={doc.is_published ? 'Unpublish' : 'Publish'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              doc.is_published
                                ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                          >
                            {toggling === doc.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : doc.is_published ? <EyeOff size={14} /> : <Eye size={14} />
                            }
                          </button>
                          <Link
                            href={`/admin/technical-docs/${doc.id}/edit`}
                            title="Edit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#0C094D] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(doc)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPage={setPage}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Technical Document"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Document"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  )
}
