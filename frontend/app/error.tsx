'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled app-level error:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-surface px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-6">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-4xl font-extrabold text-primary mb-2">Something Went Wrong</h1>
      <p className="text-sm text-gray-500 max-w-md mb-8">
        We encountered a critical runtime error. Our engineering team has been notified.
      </p>
      <button
        onClick={() => reset()}
        className="btn-primary flex items-center gap-2"
      >
        <RotateCcw size={16} />
        Try Again
      </button>
    </div>
  )
}
