'use client'

import { useEffect, useState } from 'react'
import { Globe, Save, HelpCircle, Plus, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/lib/admin/hooks'
import { auditSeo, getSeoPages, updateSeoPage } from '@/lib/admin/api'
import { SITE_CONFIG } from '@/lib/constants'
import type { SeoPageMeta } from '@/lib/admin/types'

const seoSchema = z.object({
  site_title: z.string().min(5, 'Required'),
  site_description: z.string().min(20, 'Required'),
  keywords: z.string().optional(),
  og_image: z.string().optional(),
  robots_txt: z.string().optional(),
  sitemap_url: z.string().url('Must be a valid URL'),
  google_analytics_id: z.string().optional(),
})

type SEOData = z.infer<typeof seoSchema>

export default function AdminSEOPage() {
  const { success } = useToast()
  const [saving, setSaving] = useState(false)
  const [keywordChips, setKeywordChips] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [pages, setPages] = useState<SeoPageMeta[]>([])
  const [recommendations, setRecommendations] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<SEOData>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      site_title: `${SITE_CONFIG.name} | Industrial Chemical Solutions`,
      site_description: SITE_CONFIG.description,
      sitemap_url: `${SITE_CONFIG.url}/sitemap.xml`,
      google_analytics_id: process.env.NEXT_PUBLIC_GA_ID || '',
      robots_txt: `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${SITE_CONFIG.url}/sitemap.xml`,
    },
  })

  useEffect(() => {
    getSeoPages().then(setPages).catch(() => setPages([]))
  }, [])

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase()
    if (kw && !keywordChips.includes(kw)) {
      setKeywordChips(prev => [...prev, kw])
    }
    setKeywordInput('')
  }

  const removeKeyword = (kw: string) => {
    setKeywordChips(prev => prev.filter(x => x !== kw))
  }

  const onSubmit = async (data: SEOData) => {
    setSaving(true)
    await updateSeoPage('home', {
      seo_title: data.site_title,
      seo_description: data.site_description,
      keywords: keywordChips,
    })
    setSaving(false)
    success('SEO Settings Saved', 'Metadata configurations, robots.txt, and sitemap registers updated.')
  }

  const runAudit = async () => {
    setSaving(true)
    try {
      const result = await auditSeo({ site: SITE_CONFIG.url, pages })
      setRecommendations(result.recommendations)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors'
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="text-[#F26C0C]" /> Search Engine Optimisation (SEO)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Optimize site titles, search crawler robots instructions, and track sitemaps.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={runAudit} disabled={saving}
            className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <HelpCircle size={16} /> AI Audit
          </button>
          <button
            form="seo-form"
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Settings
          </button>
        </div>
      </div>

      <form id="seo-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* General Meta Configurations */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2">
            General Search Settings
          </h2>

          <div>
            <label className={labelCls}>Global Site Title Tag *</label>
            <input {...register('site_title')} className={inputCls} />
            {errors.site_title && <p className="text-xs text-red-500 mt-1">{errors.site_title.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Global Meta Description *</label>
            <textarea {...register('site_description')} rows={4} className={`${inputCls} resize-none`} />
            {errors.site_description && <p className="text-xs text-red-500 mt-1">{errors.site_description.message}</p>}
          </div>

          {/* Keywords */}
          <div>
            <label className={labelCls}>Meta Keywords</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {keywordChips.map(kw => (
                <span key={kw} className="flex items-center gap-1.5 bg-[#0C094D]/10 dark:bg-white/10 text-[#0C094D] dark:text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {kw}
                  <button type="button" onClick={() => removeKeyword(kw)} className="text-[#0C094D]/40 hover:text-red-500 dark:text-white/40">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
                placeholder="Enter keywords..."
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={addKeyword}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Crawler Instructions robots.txt & sitemap */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2">
            Crawlers &amp; Sitemaps
          </h2>

          <div>
            <label className={labelCls}>Sitemap URL *</label>
            <input {...register('sitemap_url')} className={inputCls} />
            {errors.sitemap_url && <p className="text-xs text-red-500 mt-1">{errors.sitemap_url.message}</p>}
          </div>

          <div>
            <label className={labelCls}>robots.txt content</label>
            <textarea {...register('robots_txt')} rows={5} className={`${inputCls} font-mono text-xs`} />
          </div>
        </div>

        {/* Tracking Integration */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2">
            Tracking Integrations
          </h2>

          <div>
            <label className={labelCls}>Google Analytics Tracking ID (Gtag)</label>
            <input {...register('google_analytics_id')} placeholder="e.g. G-XXXXXXX" className={inputCls} />
          </div>
        </div>

      </form>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Indexed SEO Pages</h2>
        {pages.map(page => (
          <div key={page.id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{page.page_label}</p>
                <p className="text-xs text-gray-500">{page.page_path}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${page.index ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {page.index ? 'INDEX' : 'NOINDEX'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{page.seo_title}</p>
          </div>
        ))}
        {recommendations && (
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-gray-700 dark:text-gray-200">{recommendations}</pre>
        )}
      </div>
    </div>
  )
}
