'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProductPublishingWorkspace from '@/components/admin/products/ProductPublishingWorkspace'
import { getAdminProductById } from '@/lib/admin/api'
import type { AdminProduct } from '@/lib/admin/types'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminProductById(id)
      .then(setProduct)
      .catch(() => router.push('/admin/products'))
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) {
    return <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Loading product editor...</div>
  }

  return product ? <ProductPublishingWorkspace product={product} /> : null
}
