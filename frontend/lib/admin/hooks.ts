'use client'
// ─── Zenco Admin — Custom Hooks ───────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react'
import type { ToastMessage, ToastType } from './types'

// ── useAdminFetch ─────────────────────────────────────────────────────────
/** Generic data-fetching hook with loading, error, and refresh states */
export function useAdminFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, refresh: load }
}

// ── useDebounce ───────────────────────────────────────────────────────────
/** Debounce a value by a given delay (ms) */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── useToast ──────────────────────────────────────────────────────────────
/** Global toast notification manager */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const show = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const toast: ToastMessage = { id, type, title, message, duration }
    setToasts(prev => [...prev, toast])
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => show('success', title, message), [show])
  const error = useCallback((title: string, message?: string) => show('error', title, message), [show])
  const warning = useCallback((title: string, message?: string) => show('warning', title, message), [show])
  const info = useCallback((title: string, message?: string) => show('info', title, message), [show])

  return { toasts, show, dismiss, success, error, warning, info }
}

// ── useConfirm ────────────────────────────────────────────────────────────
/** Imperative confirmation dialog hook */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'warning'
  }>({ open: false, title: '', message: '', onConfirm: () => {} })

  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    variant?: 'danger' | 'warning',
  ) => {
    setState({ open: true, title, message, onConfirm, variant })
  }, [])

  const close = useCallback(() => {
    setState(prev => ({ ...prev, open: false }))
  }, [])

  const handleConfirm = useCallback(() => {
    state.onConfirm()
    close()
  }, [state, close])

  return { confirmState: state, confirm, closeConfirm: close, handleConfirm }
}

// ── usePagination ─────────────────────────────────────────────────────────
/** Simple pagination state manager */
export function usePagination(totalCount: number, pageSize = 20) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(totalCount / pageSize)

  const goTo = useCallback((p: number) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages])
  const next = useCallback(() => goTo(page + 1), [page, goTo])
  const prev = useCallback(() => goTo(page - 1), [page, goTo])

  return { page, totalPages, goTo, next, prev, hasNext: page < totalPages, hasPrev: page > 1 }
}

// ── useLocalStorage ───────────────────────────────────────────────────────
/** Persist state in localStorage */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch { return initialValue }
  })

  const set = useCallback((val: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val
      if (typeof window !== 'undefined') {
        try { window.localStorage.setItem(key, JSON.stringify(next)) } catch { /* */ }
      }
      return next
    })
  }, [key])

  return [value, set] as const
}

// ── useClickOutside ───────────────────────────────────────────────────────
/** Detect clicks outside a referenced element */
export function useClickOutside<T extends HTMLElement>(callback: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) callback()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [callback])
  return ref
}
