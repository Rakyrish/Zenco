'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import {
  createProduct,
  createProductCategory,
  generateProductContent,
  getAdminCategories,
  importProductImage,
  updateProduct,
  uploadProductImage,
} from '@/lib/admin/api'
import type { AdminProduct, AdminProductCategory, ProductFormData } from '@/lib/admin/types'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

type GeneratedMeta = {
  benefits?: string[]
  features?: string[]
  faq_section?: { question: string; answer: string }[] | string[]
  industries_served?: string[]
  internal_linking_suggestions?: string[]
  seo_keywords?: string[]
  image_alt_text?: string
  opengraph_description?: string
  schema_friendly_content?: Record<string, unknown>
  safety_considerations?: string[]
  category_suggestions?: string[]
}

type Draft = ProductFormData & {
  image_alt_text: string
}

const emptyDraft: Draft = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  category: null,
  packaging: '',
  price_per_unit: null,
  availability: 'in_stock',
  stock_quantity: 0,
  reorder_level: 10,
  is_featured: false,
  status: 'draft',
  specifications: {},
  applications: [],
  regions_available: ['Kenya', 'East Africa'],
  seo_title: '',
  seo_description: '',
  image_alt_text: '',
  schema_data: {},
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function limit(value: string, max: number) {
  return value.length > max ? value.slice(0, max).replace(/\s+\S*$/, '').trim() : value
}

function lines(value?: string[]) {
  return (value || []).join('\n')
}

function splitLines(value: string) {
  return value.split('\n').map(item => item.trim()).filter(Boolean)
}

function categoryPresetDescription(name: string) {
  return `${name} supplied by Zenco Chemicals Ltd for industrial, commercial, and institutional buyers across Kenya and East Africa.`
}

function calculateSeoScore(draft: Draft, meta: GeneratedMeta, hasImage: boolean) {
  const checks = [
    draft.seo_title.length >= 35 && draft.seo_title.length <= 70,
    draft.seo_description.length >= 120 && draft.seo_description.length <= 160,
    draft.slug.length > 4 && draft.slug.length < 80,
    draft.description.length >= 450,
    draft.short_description.length >= 50,
    Object.keys(draft.specifications).length >= 3,
    draft.applications.length >= 3,
    (meta.features || []).length >= 3,
    (meta.benefits || []).length >= 3,
    (meta.faq_section || []).length >= 3,
    (meta.seo_keywords || []).length >= 5,
    Boolean(draft.image_alt_text),
    hasImage,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function seoSuggestions(draft: Draft, meta: GeneratedMeta, hasImage: boolean) {
  return [
    !hasImage && 'Add a product image before publishing.',
    draft.seo_title.length < 35 && 'SEO title is too short for competitive search snippets.',
    draft.seo_title.length > 70 && 'SEO title is too long and may be truncated.',
    draft.seo_description.length < 120 && 'Meta description needs a stronger CTR-focused summary.',
    draft.seo_description.length > 160 && 'Meta description is too long.',
    !draft.image_alt_text && 'Add descriptive image alt text.',
    (meta.faq_section || []).length < 3 && 'Add at least three FAQ entries for rich snippet coverage.',
    (meta.seo_keywords || []).length < 5 && 'Add primary and secondary SEO keywords.',
    draft.applications.length < 3 && 'Add more applications and use cases.',
  ].filter(Boolean) as string[]
}

export default function ProductPublishingWorkspace({ product }: { product?: AdminProduct }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [meta, setMeta] = useState<GeneratedMeta>({})
  const [categories, setCategories] = useState<AdminProductCategory[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [urlState, setUrlState] = useState<'idle' | 'loading' | 'valid' | 'error'>('idle')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [categoryModal, setCategoryModal] = useState(false)
  const [categoryDraft, setCategoryDraft] = useState({ name: '', slug: '', description: '', seo_title: '', seo_description: '' })

  useEffect(() => {
    getAdminCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!product) return
    const schema = product.schema_data || {}
    setDraft({
      ...emptyDraft,
      ...product,
      category: product.category || null,
      image_alt_text: String(schema.image_alt_text || ''),
      schema_data: schema,
    })
    setPreview(product.image)
    setMeta({
      benefits: schema.benefits as string[] | undefined,
      features: schema.features as string[] | undefined,
      faq_section: schema.faq_section as GeneratedMeta['faq_section'],
      industries_served: schema.industries_served as string[] | undefined,
      internal_linking_suggestions: schema.internal_linking_suggestions as string[] | undefined,
      seo_keywords: schema.seo_keywords as string[] | undefined,
      image_alt_text: String(schema.image_alt_text || ''),
      opengraph_description: String(schema.opengraph_description || ''),
    })
  }, [product])

  useEffect(() => {
    if (!imageUrl) {
      setUrlState('idle')
      if (!imageFile && !product?.image) setPreview(null)
      return
    }
    setUrlState('loading')
    setPreview(imageUrl)
  }, [imageUrl, imageFile, product?.image])

  const score = useMemo(() => calculateSeoScore(draft, meta, Boolean(preview || product?.image)), [draft, meta, preview, product?.image])
  const suggestions = useMemo(() => seoSuggestions(draft, meta, Boolean(preview || product?.image)), [draft, meta, preview, product?.image])

  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  const chooseCategoryPreset = (name: string) => {
    const existing = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      setField('category', existing.id)
      return
    }

    const slug = slugify(name)
    setCategoryDraft({
      name,
      slug,
      description: categoryPresetDescription(name),
      seo_title: `${name} Supplier Kenya`,
      seo_description: `${name} supplied by Zenco Chemicals Ltd across Kenya and East Africa.`,
    })
    setCategoryModal(true)
  }

  const applyGenerated = (generated: any) => {
    const productName = generated.product_name || generated.name || draft.name
    const nextMeta: GeneratedMeta = {
      benefits: generated.benefits || [],
      features: generated.features || [],
      faq_section: generated.faq_section || [],
      industries_served: generated.industries_served || [],
      internal_linking_suggestions: generated.internal_linking_suggestions || [],
      seo_keywords: generated.seo_keywords || [],
      image_alt_text: generated.image_alt_text || '',
      opengraph_description: generated.opengraph_description || '',
      schema_friendly_content: generated.schema_friendly_content || {},
      safety_considerations: generated.safety_considerations || [],
      category_suggestions: generated.category_suggestions || [],
    }
    setMeta(nextMeta)
    setDraft(prev => ({
      ...prev,
      name: limit(productName, 255),
      slug: slugify(generated.url_slug || generated.slug || generated.slug_suggestions?.[0] || productName),
      short_description: limit(generated.short_description || generated.product_summary || prev.short_description, 300),
      description: generated.long_description || generated.full_product_description || prev.description,
      seo_title: limit(generated.seo_title || productName, 70),
      seo_description: limit(generated.seo_meta_description || generated.meta_description || prev.seo_description, 160),
      specifications: generated.technical_specifications || prev.specifications,
      applications: generated.applications || prev.applications,
      packaging: generated.packaging || prev.packaging || 'Confirm packaging',
      image_alt_text: generated.image_alt_text || prev.image_alt_text,
      schema_data: { ...prev.schema_data, ...nextMeta, ai_generated_at: new Date().toISOString() },
    }))
  }

  const generate = async () => {
    if (!imageFile && !imageUrl) {
      setMessage('Upload an image or paste a direct image URL first.')
      return
    }
    setGenerating(true)
    setMessage('')
    try {
      const result = await generateProductContent({ image: imageFile || undefined, image_url: imageFile ? undefined : imageUrl })
      applyGenerated(JSON.parse(result.content))
      setMessage('AI product profile generated. Review, refine, then publish.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const saveCategory = async () => {
    const created = await createProductCategory({
      ...categoryDraft,
      slug: categoryDraft.slug || slugify(categoryDraft.name),
    })
    setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    setField('category', created.id)
    setCategoryModal(false)
    setCategoryDraft({ name: '', slug: '', description: '', seo_title: '', seo_description: '' })
  }

  const save = async (status: 'draft' | 'published') => {
    setSaving(true)
    setMessage('')
    try {
      const payload: ProductFormData = {
        ...draft,
        status,
        name: limit(draft.name, 255),
        slug: slugify(draft.slug || draft.name),
        short_description: limit(draft.short_description, 300),
        seo_title: limit(draft.seo_title || draft.name, 70),
        seo_description: limit(draft.seo_description || draft.short_description, 160),
        schema_data: {
          ...(draft.schema_data || {}),
          ...meta,
          image_alt_text: draft.image_alt_text,
          seo_score: score,
        },
      }
      const saved = product ? await updateProduct(product.id, payload) : await createProduct(payload)
      if (imageFile) await uploadProductImage(saved.id, imageFile)
      if (!imageFile && imageUrl) await importProductImage(saved.id, imageUrl)
      router.push('/admin/products')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save product.')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-950 placeholder:text-gray-500 focus:border-[#0C094D] focus:outline-none focus:ring-2 focus:ring-[#0C094D]/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-[#F26C0C]'
  const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300'

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white">{product ? 'Edit Product' : 'AI Product Publisher'}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Image-first product creation with SEO validation and Cloudinary-ready media.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => save('draft')} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
            <Save size={16} /> Draft
          </button>
          <button onClick={() => save('published')} disabled={saving || score < 55} className="inline-flex items-center gap-2 rounded-lg bg-[#0C094D] px-4 py-2 text-sm font-bold text-white hover:bg-[#17135f] disabled:opacity-50 dark:bg-[#F26C0C] dark:hover:bg-orange-600">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Publish
          </button>
        </div>
      </div>

      {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">{message}</div>}

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)_320px]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-gray-950 dark:text-white"><ImageIcon size={16} /> Product Image</h2>
            <label className="relative flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center hover:border-[#F26C0C] dark:border-gray-700 dark:bg-gray-900">
              {preview ? (
                <img src={preview} alt={draft.image_alt_text || 'Product preview'} onLoad={() => setUrlState(imageUrl ? 'valid' : 'idle')} onError={() => setUrlState('error')} className="max-h-56 w-full rounded-md object-contain" />
              ) : (
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <Upload className="mx-auto" size={24} />
                  <p className="text-sm font-bold">Upload product image</p>
                  <p className="text-xs">PNG, JPG, or WebP</p>
                </div>
              )}
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0" onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                setImageFile(file)
                setImageUrl('')
                setPreview(URL.createObjectURL(file))
              }} />
            </label>
            <div className="mt-3">
              <label className={label}>Or paste direct image URL</label>
              <input value={imageUrl} onChange={e => { setImageFile(null); setImageUrl(e.target.value) }} placeholder="https://example.com/product.jpg" className={input} />
              <p className={`mt-2 text-xs font-semibold ${urlState === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {urlState === 'loading' && 'Validating image URL...'}
                {urlState === 'valid' && 'Image URL validated. It will be imported to Cloudinary on save.'}
                {urlState === 'error' && 'This image URL could not be loaded.'}
                {urlState === 'idle' && 'The preview appears as soon as a URL is entered.'}
              </p>
            </div>
            <button onClick={generate} disabled={generating || urlState === 'error'} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#F26C0C] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-orange-600 disabled:opacity-60">
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate Product
            </button>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-gray-950 dark:text-white"><Search size={16} /> SEO Score</h2>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-[#0C094D] dark:text-[#F26C0C]">{score}</span>
              <span className="pb-1 text-sm font-bold text-gray-500">/100</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-[#F26C0C]" style={{ width: `${score}%` }} />
            </div>
            <div className="mt-3 space-y-2">
              {suggestions.slice(0, 5).map(item => <p key={item} className="text-xs text-gray-600 dark:text-gray-300">{item}</p>)}
              {!suggestions.length && <p className="text-xs font-semibold text-green-700 dark:text-green-400">SEO checks look publication-ready.</p>}
            </div>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950 md:grid-cols-2">
            <div>
              <label className={label}>Product Name</label>
              <input value={draft.name} onChange={e => { setField('name', e.target.value); if (!draft.slug) setField('slug', slugify(e.target.value)) }} className={input} />
            </div>
            <div>
              <label className={label}>SEO Slug</label>
              <input value={draft.slug} onChange={e => setField('slug', slugify(e.target.value))} className={input} />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Product Summary</label>
              <input value={draft.short_description} onChange={e => setField('short_description', e.target.value)} className={input} />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Full Product Description</label>
              <textarea value={draft.description} onChange={e => setField('description', e.target.value)} rows={8} className={`${input} resize-y`} />
            </div>
          </section>

          <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950 md:grid-cols-2">
            <TextList title="Features" value={lines(meta.features)} onChange={value => setMeta(prev => ({ ...prev, features: splitLines(value) }))} inputClass={input} />
            <TextList title="Benefits" value={lines(meta.benefits)} onChange={value => setMeta(prev => ({ ...prev, benefits: splitLines(value) }))} inputClass={input} />
            <TextList title="Applications" value={lines(draft.applications)} onChange={value => setField('applications', splitLines(value))} inputClass={input} />
            <TextList title="Industries Served" value={lines(meta.industries_served)} onChange={value => setMeta(prev => ({ ...prev, industries_served: splitLines(value) }))} inputClass={input} />
            <KeyValueEditor specs={draft.specifications} setSpecs={specifications => setField('specifications', specifications)} inputClass={input} />
            <TextList title="FAQ" value={(meta.faq_section || []).map(item => typeof item === 'string' ? item : `${item.question}\n${item.answer}`).join('\n\n')} onChange={value => setMeta(prev => ({ ...prev, faq_section: splitLines(value) }))} inputClass={input} />
          </section>

          <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950 md:grid-cols-2">
            <div>
              <label className={label}>SEO Title</label>
              <input value={draft.seo_title} onChange={e => setField('seo_title', e.target.value)} className={input} maxLength={70} />
            </div>
            <div>
              <label className={label}>SEO Keywords</label>
              <input value={(meta.seo_keywords || []).join(', ')} onChange={e => setMeta(prev => ({ ...prev, seo_keywords: e.target.value.split(',').map(v => v.trim()).filter(Boolean) }))} className={input} />
            </div>
            <div>
              <label className={label}>Meta Description</label>
              <textarea value={draft.seo_description} onChange={e => setField('seo_description', e.target.value)} rows={3} className={`${input} resize-none`} maxLength={160} />
            </div>
            <div>
              <label className={label}>Image Alt Text</label>
              <textarea value={draft.image_alt_text} onChange={e => setField('image_alt_text', e.target.value)} rows={3} className={`${input} resize-none`} />
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-3 text-sm font-extrabold text-gray-950 dark:text-white">Publishing</h2>
            <label className={label}>Category</label>
            <div className="flex gap-2">
              <select value={draft.category || ''} onChange={e => setField('category', e.target.value || null)} className={input}>
                <option value="">No category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <button onClick={() => setCategoryModal(true)} className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800" aria-label="Create category">
                <Plus size={18} />
              </button>
            </div>
            <div className="mt-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Recommended category options</p>
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_CATEGORIES.map(cat => {
                  const existing = categories.find(item => item.name.toLowerCase() === cat.name.toLowerCase())
                  const active = existing?.id === draft.category
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => chooseCategoryPreset(cat.name)}
                      className={`rounded-md border px-2.5 py-1.5 text-[11px] font-bold transition ${
                        active
                          ? 'border-[#F26C0C] bg-[#F26C0C] text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#F26C0C] hover:text-[#F26C0C] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                      title={existing ? 'Select existing category' : 'Create this category'}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Pick a preset or use the + button to add a custom category.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Status</label>
                <select value={draft.status} onChange={e => setField('status', e.target.value as Draft['status'])} className={input}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className={label}>Availability</label>
                <select value={draft.availability} onChange={e => setField('availability', e.target.value as Draft['availability'])} className={input}>
                  <option value="in_stock">In stock</option>
                  <option value="limited">Limited</option>
                  <option value="out_of_stock">Out of stock</option>
                  <option value="on_order">On order</option>
                </select>
              </div>
              <div>
                <label className={label}>Packaging</label>
                <input value={draft.packaging} onChange={e => setField('packaging', e.target.value)} className={input} />
              </div>
              <div>
                <label className={label}>Stock</label>
                <input type="number" value={draft.stock_quantity} onChange={e => setField('stock_quantity', Number(e.target.value))} className={input} />
              </div>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
              <input type="checkbox" checked={draft.is_featured} onChange={e => setField('is_featured', e.target.checked)} className="h-4 w-4 accent-[#F26C0C]" />
              Featured product
            </label>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-3 text-sm font-extrabold text-gray-950 dark:text-white">Internal Links</h2>
            <div className="space-y-2">
              {(meta.internal_linking_suggestions || meta.category_suggestions || []).map(item => (
                <span key={item} className="block rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">{item}</span>
              ))}
              {!(meta.internal_linking_suggestions || meta.category_suggestions || []).length && <p className="text-xs text-gray-500 dark:text-gray-400">AI suggestions will appear after generation.</p>}
            </div>
          </section>
        </aside>
      </div>

      {categoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-950 dark:text-white">Create Category</h2>
              <button onClick={() => setCategoryModal(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
            </div>
            <div className="mb-4">
              <label className={label}>Use category option</label>
              <select
                value={PRODUCT_CATEGORIES.some(cat => cat.name === categoryDraft.name) ? categoryDraft.name : ''}
                onChange={e => {
                  const name = e.target.value
                  if (!name) return
                  setCategoryDraft({
                    name,
                    slug: slugify(name),
                    description: categoryPresetDescription(name),
                    seo_title: `${name} Supplier Kenya`,
                    seo_description: `${name} supplied by Zenco Chemicals Ltd across Kenya and East Africa.`,
                  })
                }}
                className={input}
              >
                <option value="">Custom category</option>
                {PRODUCT_CATEGORIES.map(cat => <option key={cat.slug} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              {(['name', 'slug', 'description', 'seo_title', 'seo_description'] as const).map(key => (
                <div key={key}>
                  <label className={label}>{key.replaceAll('_', ' ')}</label>
                  <input value={categoryDraft[key]} onChange={e => setCategoryDraft(prev => ({ ...prev, [key]: key === 'slug' ? slugify(e.target.value) : e.target.value }))} className={input} />
                </div>
              ))}
            </div>
            <button onClick={saveCategory} disabled={!categoryDraft.name} className="mt-5 w-full rounded-lg bg-[#0C094D] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-[#F26C0C]">Add Category</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TextList({ title, value, onChange, inputClass }: { title: string; value: string; onChange: (value: string) => void; inputClass: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">{title}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={6} className={`${inputClass} resize-y`} />
    </div>
  )
}

function KeyValueEditor({ specs, setSpecs, inputClass }: { specs: Record<string, string>; setSpecs: (specs: Record<string, string>) => void; inputClass: string }) {
  const rows = Object.entries(specs).length ? Object.entries(specs) : [['', '']]
  return (
    <div className="md:col-span-2">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">Technical Specifications</label>
      <div className="space-y-2">
        {rows.map(([key, value], index) => (
          <div key={`${key}-${index}`} className="grid gap-2 md:grid-cols-2">
            <input value={key} placeholder="Property" onChange={e => {
              const next = [...rows]
              next[index] = [e.target.value, value]
              setSpecs(Object.fromEntries(next.filter(([k, v]) => k || v)))
            }} className={inputClass} />
            <input value={value} placeholder="Value" onChange={e => {
              const next = [...rows]
              next[index] = [key, e.target.value]
              setSpecs(Object.fromEntries(next.filter(([k, v]) => k || v)))
            }} className={inputClass} />
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setSpecs({ ...specs, '': '' })} className="mt-2 text-xs font-bold text-[#F26C0C]">Add specification</button>
    </div>
  )
}
