'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Loader2, CheckCircle, AlertCircle, Edit } from 'lucide-react'
import { generateDatasheetWithAI, getDatasheetOverview, getAdminProducts } from '@/lib/admin/api'
import type { ProductDataSheet, DatasheetOverview, AdminProduct } from '@/lib/admin/types'
import { useToast } from '@/lib/admin/hooks'

type Step = 'select' | 'review' | 'generating' | 'done' | 'error'

export default function GenerateDatasheetPage() {
  const [step, setStep] = useState<Step>('select')
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [overview, setOverview] = useState<DatasheetOverview | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [regenerate, setRegenerate] = useState(false)
  const [result, setResult] = useState<ProductDataSheet | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const { success, error } = useToast()

  useEffect(() => {
    Promise.all([
      getAdminProducts({ page: 1 }),
      getDatasheetOverview(),
    ]).then(([prodData, ov]) => {
      setProducts(prodData.results)
      setOverview(ov)
    }).catch(() => {})
  }, [])

  const selectedProduct = products.find(p => p.id === selectedId)
  const productsWithout = overview?.products_without || []
  const selectableProducts = regenerate
    ? products
    : products.filter(p => productsWithout.some(w => w.id === p.id))

  const handleGenerate = async () => {
    if (!selectedId) return
    setStep('generating')
    setErrorMsg('')
    try {
      const res = await generateDatasheetWithAI(selectedId, regenerate)
      if (res.status === 'success' && res.datasheet) {
        setResult(res.datasheet)
        setStep('done')
        success('Datasheet generated successfully')
      } else {
        setErrorMsg(res.error || 'Generation failed')
        setStep('error')
        error('Generation failed')
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Unexpected error')
      setStep('error')
      error('Generation failed')
    }
  }

  const estTokens = overview?.estimated_tokens_per_datasheet || 3500

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/technical-docs/datasheets" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Sparkles className="text-[#F26C0C]" size={22} />
            Generate Product Datasheet
          </h1>
          <p className="text-sm text-gray-500">AI-powered Technical Data Sheet from existing product data</p>
        </div>
      </div>

      {/* Step 1: Select product */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="font-bold">Step 1 — Select Product</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={regenerate} onChange={e => setRegenerate(e.target.checked)} />
          Regenerate mode (overwrite existing datasheet)
        </label>
        <select
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setStep('select') }}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="">Choose a product...</option>
          {selectableProducts.map(p => (
            <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Step 2: Review product info */}
      {selectedProduct && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-2 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-bold">Step 2 — Review Product Info</h2>
          <p><strong>Name:</strong> {selectedProduct.name}</p>
          <p><strong>Category:</strong> {selectedProduct.category_name || '—'}</p>
          <p><strong>Description:</strong> {selectedProduct.short_description || selectedProduct.description?.slice(0, 200)}</p>
          <p className="text-xs text-gray-500 mt-2">Estimated tokens: ~{estTokens.toLocaleString()}</p>
        </div>
      )}

      {/* Step 3: Generate */}
      {selectedId && step !== 'done' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="font-bold mb-4">Step 3 — Generate with AI</h2>
          {step === 'generating' ? (
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="animate-spin" size={20} />
              Generating TDS for {selectedProduct?.name}...
            </div>
          ) : step === 'error' ? (
            <div className="flex items-start gap-3 text-red-600">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Generation failed</p>
                <p className="text-sm mt-1">{errorMsg}</p>
                <button onClick={() => setStep('select')} className="mt-3 text-sm underline">Try again</button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0C094D] px-6 py-3 text-sm font-bold text-white hover:bg-[#1a1570]"
            >
              <Sparkles size={16} /> Generate with AI
            </button>
          )}
        </div>
      )}

      {/* Step 4 & 5: Success */}
      {step === 'done' && result && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-800 font-bold">
            <CheckCircle size={20} /> Datasheet generated (saved as draft)
          </div>
          <p className="text-sm"><strong>Title:</strong> {result.title}</p>
          <p className="text-sm"><strong>Version:</strong> {result.version}</p>
          <p className="text-sm"><strong>Tokens:</strong> {result.tokens_used?.toLocaleString()}</p>
          {result.validation_flags?.length > 0 && (
            <p className="text-sm text-amber-700">Validation flags: {result.validation_flags.join(', ')}</p>
          )}
          <div className="flex gap-3">
            <Link
              href={`/admin/technical-docs/datasheets/${result.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0C094D] px-4 py-2 text-sm font-bold text-white"
            >
              <Edit size={16} /> Review &amp; Edit
            </Link>
            <Link href="/admin/technical-docs/datasheets" className="rounded-xl border px-4 py-2 text-sm font-semibold">
              Back to list
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
