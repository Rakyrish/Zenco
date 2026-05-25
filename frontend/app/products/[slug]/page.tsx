'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, CheckCircle, ShieldAlert, Award, FileText, Globe } from 'lucide-react'
import { getProductBySlug } from '@/lib/api'
import type { ProductDetail } from '@/types'
import { productSchema } from '@/lib/metadata'
import { AVAILABILITY_LABELS } from '@/lib/constants'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'specs' | 'applications'>('specs')

  useEffect(() => {
    async function load() {
      try {
        const data = await getProductBySlug(slug)
        setProduct(data)
      } catch (err) {
        console.error('Failed to get product details.', err)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin text-accent text-3xl">⚗</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center flex-col px-4 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been discontinued.</p>
        <Link href="/products" className="btn-primary">Back to Catalog</Link>
      </div>
    )
  }

  const labelObj = AVAILABILITY_LABELS[product.availability] || { label: 'In Stock', color: 'text-green-600 bg-green-50' }

  return (
    <div className="min-h-screen bg-surface py-12">
      {/* Schema.org Product Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productSchema({
              name: product.name,
              description: product.short_description,
              slug: product.slug,
              availability: product.availability,
            })
          ),
        }}
      />

      <div className="container-xl px-4">
        {/* Navigation back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-accent mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>

        {/* Product core detail card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-card mb-12">
          {/* Graphic Side */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[300px] bg-gradient-hero rounded-2xl pattern-dots overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-accent/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10 text-center text-white px-6">
              <span className="text-6xl text-accent block mb-4">⚗</span>
              <p className="text-xl font-bold uppercase tracking-widest">{product.name}</p>
              <p className="text-xs text-white/50 mt-1 uppercase font-semibold">Standard Package: IBC 1000L / Tanker</p>
            </div>
          </div>

          {/* Details Side */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-bold text-accent bg-accent/5 px-3 py-1 rounded-md uppercase tracking-wider">
                {product.category_name}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md ${labelObj.color}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {labelObj.label}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-primary">{product.name}</h1>
            <p className="text-lg text-gray-500 leading-relaxed font-medium">{product.short_description}</p>
            
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

            {/* Regional Logistics */}
            <div className="border-t border-b border-gray-100 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-accent" />
                <span className="text-sm font-semibold text-primary">Regional Availability:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.regions_available.map(reg => (
                  <span key={reg} className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {reg}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/contact?type=quote&product=${encodeURIComponent(product.name)}`}
                className="flex-1 btn-primary btn-lg flex items-center justify-center gap-2 shadow-glow-accent"
              >
                <ShoppingBag size={20} />
                Request Volume Quote
              </Link>
              {product.datasheet && (
                <a
                  href={product.datasheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-card"
                >
                  <FileText size={20} />
                  Download Safety Datasheet
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic specification & application tabs */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-card">
          <div className="flex border-b border-gray-100 gap-6 mb-6">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-4 text-base font-bold transition-all relative ${
                activeTab === 'specs' ? 'text-accent border-b-2 border-accent' : 'text-gray-400 hover:text-primary'
              }`}
            >
              Technical Specifications
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-4 text-base font-bold transition-all relative ${
                activeTab === 'applications' ? 'text-accent border-b-2 border-accent' : 'text-gray-400 hover:text-primary'
              }`}
            >
              Applications & Usage
            </button>
          </div>

          {activeTab === 'specs' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center py-3 border-b border-gray-50 text-sm">
                  <span className="font-semibold text-gray-500">{key}</span>
                  <span className="text-primary font-bold">{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-4">
              {product.applications.map((app, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{app}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quality Safety Advisory */}
        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="font-bold text-amber-800 text-base mb-1">Industrial Safety Notice</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              This chemical is classified as hazardous. Appropriate personal protective equipment (PPE) including chemical-resistant gloves, respirators, and safety goggles must be worn during unloading, handling, and dilution operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
