'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Eye } from 'lucide-react'
import {
  getAdminProductDataSheetById,
  updateProductDataSheet,
  publishProductDataSheet,
} from '@/lib/admin/api'
import type { ProductDataSheet } from '@/lib/admin/types'
import { useToast } from '@/lib/admin/hooks'

export default function EditDatasheetPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const [sheet, setSheet] = useState<ProductDataSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    meta_title: '',
    meta_description: '',
    product_description: '',
    related_products_text: '',
    status: 'draft' as ProductDataSheet['status'],
  })
  const [jsonFields, setJsonFields] = useState<Record<string, string>>({})
  const { success, error } = useToast()

  useEffect(() => {
    getAdminProductDataSheetById(id)
      .then(data => {
        setSheet(data)
        setForm({
          title: data.title,
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          product_description: data.product_description || '',
          related_products_text: data.related_products_text || '',
          status: data.status,
        })
        setJsonFields({
          chemical_composition: JSON.stringify(data.chemical_composition || [], null, 2),
          physical_properties: JSON.stringify(data.physical_properties || {}, null, 2),
          performance_data: JSON.stringify(data.performance_data || {}, null, 2),
          applications: JSON.stringify(data.applications || [], null, 2),
          industries_served: JSON.stringify(data.industries_served || [], null, 2),
          health_safety: JSON.stringify(data.health_safety || {}, null, 2),
          storage_handling: JSON.stringify(data.storage_handling || {}, null, 2),
          packaging_info: JSON.stringify(data.packaging_info || {}, null, 2),
          standards_compliance: JSON.stringify(data.standards_compliance || [], null, 2),
          certifications: JSON.stringify(data.certifications || [], null, 2),
          faq: JSON.stringify(data.faq || [], null, 2),
        })
      })
      .catch(() => error('Failed to load datasheet'))
      .finally(() => setLoading(false))
  }, [id, error])

  const parseJson = (key: string) => {
    try {
      return JSON.parse(jsonFields[key] || '{}')
    } catch {
      throw new Error(`Invalid JSON in ${key}`)
    }
  }

  const handleSave = async (publish = false) => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        chemical_composition: parseJson('chemical_composition'),
        physical_properties: parseJson('physical_properties'),
        performance_data: parseJson('performance_data'),
        applications: parseJson('applications'),
        industries_served: parseJson('industries_served'),
        health_safety: parseJson('health_safety'),
        storage_handling: parseJson('storage_handling'),
        packaging_info: parseJson('packaging_info'),
        standards_compliance: parseJson('standards_compliance'),
        certifications: parseJson('certifications'),
        faq: parseJson('faq'),
        status: publish ? 'published' as const : form.status,
        is_public: publish ? true : undefined,
      }
      await updateProductDataSheet(id, payload)
      if (publish) await publishProductDataSheet(id)
      success(publish ? 'Saved & published' : 'Saved as draft')
      router.push('/admin/technical-docs/datasheets')
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800'

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  if (!sheet) {
    return <p className="text-center text-gray-500 py-20">Datasheet not found.</p>
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/technical-docs/datasheets" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold">Edit TDS — {sheet.product_name}</h1>
          <p className="text-sm text-gray-500">Version {sheet.version} · {sheet.validation_flags?.length || 0} validation flag(s)</p>
        </div>
        {sheet.status === 'published' && (
          <a href={`/products/${sheet.product_slug}/datasheet`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0C094D]">
            <Eye size={16} /> Preview
          </a>
        )}
      </div>

      <div className="grid gap-4">
        {(['title', 'meta_title', 'meta_description'] as const).map(field => (
          <label key={field} className="block">
            <span className="text-xs font-bold uppercase text-gray-500">{field.replace(/_/g, ' ')}</span>
            <input
              className={`${inputCls} mt-1`}
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            />
          </label>
        ))}
        <label className="block">
          <span className="text-xs font-bold uppercase text-gray-500">Product Description (HTML)</span>
          <textarea
            className={`${inputCls} mt-1 min-h-[120px]`}
            value={form.product_description}
            onChange={e => setForm(f => ({ ...f, product_description: e.target.value }))}
          />
        </label>
        {Object.keys(jsonFields).map(key => (
          <label key={key} className="block">
            <span className="text-xs font-bold uppercase text-gray-500">{key.replace(/_/g, ' ')} (JSON)</span>
            <textarea
              className={`${inputCls} mt-1 min-h-[100px] font-mono text-xs`}
              value={jsonFields[key]}
              onChange={e => setJsonFields(j => ({ ...j, [key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="block">
          <span className="text-xs font-bold uppercase text-gray-500">Related Products Text</span>
          <textarea
            className={`${inputCls} mt-1 min-h-[80px]`}
            value={form.related_products_text}
            onChange={e => setForm(f => ({ ...f, related_products_text: e.target.value }))}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save as Draft
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0C094D] px-5 py-2.5 text-sm font-bold text-white"
        >
          Save &amp; Publish
        </button>
      </div>
    </div>
  )
}
