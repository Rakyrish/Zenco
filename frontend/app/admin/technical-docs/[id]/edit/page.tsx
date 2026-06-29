'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, ExternalLink, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getTechnicalDocumentBySlug, updateTechnicalDocument } from '@/lib/admin/api'
import type { TechnicalDocument } from '@/lib/admin/types'

const schema = z.object({
  title: z.string().min(5),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  doc_type: z.string().min(1, 'Required'),
  standard_code: z.string().optional(),
  excerpt: z.string().min(20),
  body_html: z.string().min(50),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
  is_published: z.boolean(),
})
type FormData = z.infer<typeof schema>

const DOC_TYPE_OPTS = [
  { value: 'datasheet', label: 'Product Data Sheet' },
  { value: 'iso_guide', label: 'ISO Standard Guide' },
  { value: 'kebs_guide', label: 'KEBS Compliance Guide' },
  { value: 'whitepaper', label: 'Whitepaper' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'iec_guide', label: 'IEC Guide' },
]

const TABS = ['Content', 'SEO & Meta']

export default function EditTechnicalDocPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [activeTab, setActiveTab] = useState('Content')
  const [saving, setSaving] = useState(false)
  const [docSlug, setDocSlug] = useState('')

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_published: false },
  })

  useEffect(() => {
    const load = async () => {
      try {
        // For edit, we fetch by slug — but we have an id. We need to adapt.
        // The admin API uses /blog/technical-docs/admin/{id}/ 
        // For now use the public slug endpoint via a different approach
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog/technical-docs/${id}/`, {
          headers: { Authorization: `Token ${localStorage.getItem('adminToken') || ''}` }
        })
        if (!resp.ok) throw new Error('Not found')
        const doc: TechnicalDocument = await resp.json()
        setDocSlug(doc.slug)
        reset({
          title: doc.title,
          slug: doc.slug,
          doc_type: doc.doc_type,
          standard_code: doc.standard_code || '',
          excerpt: doc.excerpt,
          body_html: doc.body_html || '',
          meta_title: doc.meta_title || '',
          meta_description: doc.meta_description || '',
          is_published: doc.is_published,
        })
      } catch {
        router.push('/admin/technical-docs')
      }
    }
    load()
  }, [id, reset, router])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateTechnicalDocument(id, data as any)
      router.push('/admin/technical-docs')
    } catch (err) {
      console.error('Failed to update', err)
    } finally {
      setSaving(false)
    }
  }

  const titleVal = watch('title')
  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors'
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/admin/technical-docs" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white truncate">
            {titleVal || 'Edit Technical Document'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">ID: {id}</p>
        </div>
        <div className="flex gap-2">
          {docSlug && (
            <a
              href={`/technical-docs/${docSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:border-[#0C094D]/30 hover:text-[#0C094D] transition-colors"
            >
              <ExternalLink size={14} /> Preview
            </a>
          )}
          <button
            form="doc-form"
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0C094D] hover:bg-[#1a1760] rounded-xl transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-sm font-semibold py-2 px-3 rounded-lg transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form id="doc-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">

          {activeTab === 'Content' && (
            <>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Document Title *</label>
                  <input {...register('title')} className={inputCls} />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Slug *</label>
                  <input {...register('slug')} className={inputCls} />
                  {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Document Type *</label>
                  <select {...register('doc_type')} className={inputCls}>
                    {DOC_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Standard / Reference Code</label>
                  <input {...register('standard_code')} placeholder="e.g. ISO 9001:2015" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Excerpt / Summary *</label>
                <textarea {...register('excerpt')} rows={3} className={`${inputCls} resize-none`} />
                {errors.excerpt && <p className="text-xs text-red-500 mt-1">{errors.excerpt.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Body HTML *</label>
                <textarea
                  {...register('body_html')}
                  rows={22}
                  className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
                  placeholder="<h2>Section heading</h2><p>Content...</p>"
                />
                {errors.body_html && <p className="text-xs text-red-500 mt-1">{errors.body_html.message}</p>}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-50 dark:border-gray-800">
                <input
                  type="checkbox"
                  {...register('is_published')}
                  id="is_published"
                  className="w-4 h-4 accent-[#F26C0C]"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Published — visible on public <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">/technical-docs</code> listing
                </label>
              </div>
            </>
          )}

          {activeTab === 'SEO & Meta' && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Meta Title <span className="text-gray-400 font-normal">(max 70 chars)</span></label>
                <input {...register('meta_title')} maxLength={70} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Meta Description <span className="text-gray-400 font-normal">(max 160 chars)</span></label>
                <textarea {...register('meta_description')} rows={3} maxLength={160} className={`${inputCls} resize-none`} />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">TechArticle Schema</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  This document is automatically wrapped in <code>@type: TechArticle</code> structured data on the public page, including <code>headline</code>, <code>description</code>, <code>datePublished</code>, <code>dateModified</code>, and <code>proficiencyLevel: Expert</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
