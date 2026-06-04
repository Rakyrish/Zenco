'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, FileText, Star } from 'lucide-react'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import ConfirmModal from '@/components/admin/ui/ConfirmModal'
import Pagination from '@/components/admin/ui/Pagination'
import { useDebounce, useToast, useConfirm } from '@/lib/admin/hooks'
import { deleteBlogPost, getAdminBlogPosts, updateBlogPost } from '@/lib/admin/api'
import type { AdminBlogPost } from '@/lib/admin/types'

const STATUSES = ['All', 'published', 'draft', 'scheduled']

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const dSearch = useDebounce(search)
  const { success } = useToast()
  const { confirmState, confirm, closeConfirm, handleConfirm } = useConfirm()

  useEffect(() => {
    getAdminBlogPosts().then(data => setPosts(data.results)).catch(() => setPosts([]))
  }, [])

  const filtered = posts.filter(p => {
    const matchSearch = !dSearch || p.title.toLowerCase().includes(dSearch.toLowerCase()) || p.author_name.toLowerCase().includes(dSearch.toLowerCase())
    const matchStatus = status === 'All' || p.status === status
    return matchSearch && matchStatus
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleDelete = (p: AdminBlogPost) => {
    confirm('Delete Post', `Delete "${p.title}"? This action cannot be undone.`, async () => {
      await deleteBlogPost(p.id)
      setPosts(prev => prev.filter(x => x.id !== p.id))
      success('Post deleted')
    })
  }

  const handleToggleStatus = async (p: AdminBlogPost) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published'
    await updateBlogPost(p.id, { status: newStatus })
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, status: newStatus } : x))
    success(newStatus === 'published' ? 'Post published' : 'Post unpublished')
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} post{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/blog/new" className="flex items-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={16} /> New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search posts by title or author…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 dark:text-white placeholder-gray-400 transition-colors" />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${status === s ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Post</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Views</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Published</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No posts found</p>
                </td></tr>
              ) : paginated.map(post => (
                <tr key={post.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[280px]">{post.title}</p>
                        <p className="text-xs text-gray-400">{post.reading_time} min read · {post.tags.slice(0, 2).join(', ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {post.category ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                        <span className="w-2 h-2 rounded-full" style={{ background: post.category.color }} />
                        {post.category.name}
                      </span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{post.author_name}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                    {post.views_count.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">{formatDate(post.published_at)}</td>
                  <td className="px-5 py-4"><StatusBadge status={post.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleToggleStatus(post)} title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                        className={`p-1.5 rounded-lg transition-colors ${post.status === 'published' ? 'text-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100' : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                        {post.status === 'published' ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <Link href={`/admin/blog/${post.id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Edit size={15} />
                      </Link>
                      <button onClick={() => handleDelete(post)}
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

      <ConfirmModal open={confirmState.open} title={confirmState.title} message={confirmState.message}
        onConfirm={handleConfirm} onCancel={closeConfirm} variant="danger" />
    </div>
  )
}
