'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Eye, Package, Plus, Minus, Upload } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getAdminCategories, getAdminProductById, updateProduct } from '@/lib/admin/api'
import type { AdminProductCategory, ProductFormData } from '@/lib/admin/types'

const schema = z.object({
  name: z.string().min(2, 'Required'),
  slug: z.string().min(2, 'Required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  short_description: z.string().min(10, 'Min 10 characters'),
  description: z.string().min(20, 'Min 20 characters'),
  category: z.string().min(1, 'Select a category'),
  packaging: z.string().min(2, 'Required'),
  availability: z.enum(['in_stock', 'limited', 'out_of_stock', 'on_order']),
  stock_quantity: z.coerce.number().min(0),
  reorder_level: z.coerce.number().min(0),
  is_featured: z.boolean(),
  status: z.enum(['published', 'draft', 'archived']),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const TABS = ['General', 'Specifications', 'Inventory', 'SEO']

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [activeTab, setActiveTab] = useState('General')
  const [saving, setSaving] = useState(false)
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }])
  const [applications, setApplications] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [categories, setCategories] = useState<AdminProductCategory[]>([])

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    // Attempt load
    const load = async () => {
      try {
        const [prod, cats] = await Promise.all([
          getAdminProductById(id),
          getAdminCategories().catch(() => []),
        ])
        setCategories(cats)
        reset({
          name: prod.name,
          slug: prod.slug,
          short_description: prod.short_description,
          description: prod.description || '',
          category: prod.category,
          packaging: prod.packaging || '25L Drums',
          availability: prod.availability as any,
          stock_quantity: prod.stock_quantity,
          reorder_level: prod.reorder_level || 10,
          is_featured: prod.is_featured,
          status: prod.status as any,
          seo_title: prod.seo_title || prod.name,
          seo_description: prod.seo_description || prod.short_description,
        })
        if (prod.specifications) {
          setSpecs(Object.entries(prod.specifications).map(([key, value]) => ({ key, value })))
        }
        if (prod.applications) {
          setApplications(prod.applications.join('\n'))
        }
      } catch (err) {
        console.error('Failed to load product', err)
        router.push('/admin/products')
      }
    }
    load()
  }, [id, reset, router])

  const nameVal = watch('name')
  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const payload: ProductFormData = {
      ...data,
      slug: data.slug || autoSlug(data.name),
      specifications: Object.fromEntries(specs.filter(s => s.key && s.value).map(s => [s.key, s.value])),
      applications: applications.split('\n').map(a => a.trim()).filter(Boolean),
      regions_available: ['Kenya'],
      price_per_unit: null,
      seo_title: data.seo_title || data.name,
      seo_description: data.seo_description || data.short_description,
    }
    try {
      await updateProduct(id, payload)
      router.push('/admin/products')
    } catch (err) {
      console.error('Failed to update product', err)
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors'
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'
  const errCls = 'text-xs text-red-500 mt-1'

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-0.5">Modify the fields below to update catalog data</p>
        </div>
        <div className="flex gap-2">
          <button form="product-form" type="submit" disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0C094D] hover:bg-[#1a1760] rounded-xl transition-colors disabled:opacity-60">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
            Save Changes
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

      <form id="product-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
          
          {activeTab === 'General' && (
            <>
              {/* Image upload */}
              <div>
                <label className={labelCls}>Product Image</label>
                <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-[#F26C0C]/50 transition-colors cursor-pointer group">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-32 mx-auto object-cover rounded-lg" />
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto">
                        <Upload size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Update image</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Product Name *</label>
                  <input {...register('name')} placeholder="Product Name" className={inputCls} />
                  {errors.name && <p className={errCls}>{errors.name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Slug *</label>
                  <input {...register('slug')} className={inputCls} />
                  {errors.slug && <p className={errCls}>{errors.slug.message}</p>}
                </div>
              </div>

              <div>
                <label className={labelCls}>Short Description *</label>
                <input {...register('short_description')} className={inputCls} />
                {errors.short_description && <p className={errCls}>{errors.short_description.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Full Description *</label>
                <textarea {...register('description')} rows={5} className={`${inputCls} resize-none`} />
                {errors.description && <p className={errCls}>{errors.description.message}</p>}
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Category *</label>
                  <select {...register('category')} className={inputCls}>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Packaging *</label>
                  <input {...register('packaging')} className={inputCls} />
                  {errors.packaging && <p className={errCls}>{errors.packaging.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Availability *</label>
                  <select {...register('availability')} className={inputCls}>
                    <option value="in_stock">In Stock</option>
                    <option value="limited">Limited Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="on_order">Available on Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Applications</label>
                <textarea value={applications} onChange={e => setApplications(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" {...register('is_featured')} id="is_featured" className="w-4 h-4 accent-[#F26C0C]" />
                <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">Feature this product on the homepage</label>
              </div>
            </>
          )}

          {activeTab === 'Specifications' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Edit technical specifications details.</p>
              <div className="space-y-3">
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-3">
                    <input value={spec.key} onChange={e => setSpecs(prev => prev.map((s, j) => j === i ? { ...s, key: e.target.value } : s))}
                      placeholder="Property" className={`${inputCls} flex-1`} />
                    <input value={spec.value} onChange={e => setSpecs(prev => prev.map((s, j) => j === i ? { ...s, value: e.target.value } : s))}
                      placeholder="Value" className={`${inputCls} flex-1`} />
                    <button type="button" onClick={() => setSpecs(prev => prev.filter((_, j) => j !== i))}
                      className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Minus size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setSpecs(prev => [...prev, { key: '', value: '' }])}
                className="flex items-center gap-2 text-sm text-[#F26C0C] font-semibold hover:underline">
                <Plus size={15} /> Add specification
              </button>
            </div>
          )}

          {activeTab === 'Inventory' && (
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Stock Quantity</label>
                <input type="number" {...register('stock_quantity')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Reorder Level</label>
                <input type="number" {...register('reorder_level')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select {...register('status')} className={inputCls}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'SEO' && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>SEO Title</label>
                <input {...register('seo_title')} maxLength={60} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Meta Description</label>
                <textarea {...register('seo_description')} rows={3} maxLength={160} className={`${inputCls} resize-none`} />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
