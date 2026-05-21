'use client'

import Link from 'next/link'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-surface px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6 animate-float">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-4xl font-extrabold text-primary mb-2">Page Not Found</h1>
      <p className="text-sm text-gray-500 max-w-md mb-8">
        The page you are trying to access does not exist, has been removed, or the address was entered incorrectly.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="btn-primary flex items-center gap-2">
          <RotateCcw size={16} />
          Back to Home Page
        </Link>
        <Link href="/products" className="btn-secondary">
          Browse Catalog
        </Link>
      </div>
    </div>
  )
}
