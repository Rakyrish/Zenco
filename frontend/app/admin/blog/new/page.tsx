'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Upload, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createBlogPost } from '@/lib/admin/api'
import type { BlogFormData } from '@/lib/admin/types'
import { SITE_CONFIG } from '@/lib/constants'

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().min(3, 'Required').regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
  excerpt: z.string().min(20, 'Min 20 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  category: z.string().optional(),
  is_featured: z.boolean(),
  status: z.enum(['published', 'draft', 'scheduled']),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const TABS = ['Content', 'Settings', 'SEO']

export default function NewBlogPostPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('Content')
  const [saving, setSaving] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft', is_featured: false },
  })

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const payload: BlogFormData = {
      ...data,
      tags,
      seo_title: data.seo_title || data.title,
      seo_description: data.seo_description || data.excerpt,
    }
    try {
      await createBlogPost(payload)
      router.push('/admin/blog')
    } catch {
      router.push('/admin/blog')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors'
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">New Blog Post</h1>
          <p className="text-sm text-gray-500 mt-0.5">Write and publish a new article</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition-colors">
            <Save size={15} /> Save Draft
          </button>
          <button form="blog-form" type="submit" disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0C094D] hover:bg-[#1a1760] rounded-xl transition-colors disabled:opacity-60">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Eye size={15} />}
            Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 text-sm font-semibold py-2 px-3 rounded-lg transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      <form id="blog-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
          {activeTab === 'Content' && (
            <>
              <div>
                <label className={labelCls}>Post Title *</label>
                <input {...register('title')} placeholder="e.g. Safe Handling of Industrial Chemicals" className={`${inputCls} text-lg font-semibold`} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Slug *</label>
                <input {...register('slug')} placeholder="safe-handling-industrial-chemicals" className={inputCls} />
                {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Excerpt / Summary *</label>
                <textarea {...register('excerpt')} rows={2} placeholder="Brief summary shown in blog listings…" className={`${inputCls} resize-none`} />
                {errors.excerpt && <p className="text-xs text-red-500 mt-1">{errors.excerpt.message}</p>}
              </div>
              {/* Featured image */}
              <div>
                <label className={labelCls}>Featured Image</label>
                <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-[#F26C0C]/50 transition-colors cursor-pointer group">
                  {imagePreview
                    ? <img src={imagePreview} alt="Preview" className="h-40 mx-auto object-cover rounded-lg" />
                    : <div className="space-y-2">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto">
                          <Upload size={20} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">Upload featured image</p>
                      </div>
                  }
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setImagePreview(URL.createObjectURL(f)) }} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              {/* Content */}
              <div>
                <label className={labelCls}>Content * <span className="text-gray-400 font-normal text-xs">(Markdown supported)</span></label>
                <textarea {...register('content')} rows={16} placeholder="# Heading&#10;&#10;Write your article content here. Markdown is supported.&#10;&#10;## Section Title&#10;&#10;Your paragraph text…" className={`${inputCls} resize-y font-mono text-sm leading-relaxed`} />
                {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>}
              </div>
            </>
          )}

          {activeTab === 'Settings' && (
            <>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Category</label>
                  <select {...register('category')} className={inputCls}>
                    <option value="">Uncategorised</option>
                    <option value="1">Safety</option>
                    <option value="2">Water Treatment</option>
                    <option value="3">Solvents</option>
                    <option value="4">Industry News</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select {...register('status')} className={inputCls}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
              {/* Tags */}
              <div>
                <label className={labelCls}>Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 bg-[#0C094D]/10 dark:bg-white/10 text-[#0C094D] dark:text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                      {tag}
                      <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-[#0C094D]/40 hover:text-red-500 dark:text-white/40 transition-colors">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="Type a tag and press Enter" className={`${inputCls} flex-1`} />
                  <button type="button" onClick={addTag} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" {...register('is_featured')} id="is_featured" className="w-4 h-4 accent-[#F26C0C]" />
                <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">Feature this post on the blog homepage</label>
              </div>
            </>
          )}

          {activeTab === 'SEO' && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>SEO Title <span className="text-gray-400 font-normal">(60 chars)</span></label>
                <input {...register('seo_title')} maxLength={60} placeholder={watch('title') || 'Post title'} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Meta Description <span className="text-gray-400 font-normal">(160 chars)</span></label>
                <textarea {...register('seo_description')} rows={3} maxLength={160} placeholder={watch('excerpt') || 'Post excerpt'} className={`${inputCls} resize-none`} />
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Search Preview</p>
                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">{watch('seo_title') || watch('title') || 'Post Title'} | Zenco Blog</p>
                <p className="text-xs text-green-700 dark:text-green-500">{SITE_CONFIG.url}/blog/{watch('slug') || 'post-slug'}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{watch('seo_description') || watch('excerpt') || 'Meta description…'}</p>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
