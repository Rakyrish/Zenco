'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Phone, Mail, Search, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SITE_CONFIG, NAV_LINKS, AVAILABILITY_LABELS } from '@/lib/constants'
import MobileMenu from './MobileMenu'
import Logo from '@/components/shared/Logo'
import ThemeToggle from '@/components/shared/ThemeToggle'
import { getCategories, getProducts } from '@/lib/api'
import type { Category, ProductListItem } from '@/types'
import { whatsappHref } from '@/components/products/product-helpers'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaMenu, setMegaMenu] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductListItem[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const pathname = usePathname()
  const megaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      try {
        const data = await getProducts({ search: searchQuery.trim() })
        setSearchResults(data.results.slice(0, 6))
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 180)
    return () => window.clearTimeout(timer)
  }, [searchOpen, searchQuery])

  useEffect(() => {
    setMobileOpen(false)
    setMegaMenu(null)
  }, [pathname])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMegaMenu(null)
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* Top Bar */}
      <div className="hidden lg:block bg-primary text-white/80 text-xs py-2 border-b border-white/10">
        <div className="container-xl flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <a
              href={`tel:${SITE_CONFIG.phone}`}
              className="flex items-center gap-1.5 hover:text-accent transition-colors"
            >
              <Phone size={12} />
              <span>{SITE_CONFIG.phone}</span>
            </a>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="flex items-center gap-1.5 hover:text-accent transition-colors"
            >
              <Mail size={12} />
              <span>{SITE_CONFIG.email}</span>
            </a>
          </div>
          <div className="flex items-center gap-4 text-white/60">
            <span>{SITE_CONFIG.openingHours}</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300 w-full',
          scrolled
            ? 'navbar-scrolled'
            : 'bg-primary/95 backdrop-blur-sm border-b border-white/10',
        )}
      >
        <div className="container-xl px-4">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
              <Logo />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1" ref={megaRef}>
              {NAV_LINKS.map(link => (
                <div key={link.label} className="relative group">
                  {(link as any).hasMega ? (

                    <button
                      className={cn(
                        'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium',
                        'text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150',
                        isActive(link.href) && 'text-accent',
                      )}
                      onMouseEnter={() => setMegaMenu('products')}
                      onMouseLeave={() => setMegaMenu(null)}
                      aria-haspopup="true"
                      aria-expanded={megaMenu === 'products'}
                    >
                      {link.label}
                      <ChevronDown
                        size={14}
                        className={cn(
                          'transition-transform duration-200',
                          megaMenu === 'products' && 'rotate-180',
                        )}
                      />
                    </button>
                  ) : (link as any).children ? (
                    <div className="relative group/sub">
                      <button
                        className={cn(
                          'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium',
                          'text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150',
                          isActive(link.href) && 'text-accent',
                        )}
                      >
                        {link.label}
                        <ChevronDown size={14} className="transition-transform duration-200 group-hover/sub:rotate-180" />
                      </button>
                      {/* Dropdown */}
                      <div className="absolute top-full left-0 pt-2 hidden group-hover/sub:block">
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[200px]">
                          {(link as any).children.map((child: any) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:text-accent hover:bg-accent/5 transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        'text-white/80 hover:text-white hover:bg-white/10 transition-all duration-150',
                        isActive(link.href) && 'text-accent',
                      )}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}

              {/* Products Mega Menu */}
              {megaMenu === 'products' && (
                <div
                  className="absolute top-full left-0 right-0 mt-0 bg-white shadow-2xl border-t-2 border-accent z-50"
                  onMouseEnter={() => setMegaMenu('products')}
                  onMouseLeave={() => setMegaMenu(null)}
                >
                  <div className="container-xl px-4 py-8">
                    <div className="grid grid-cols-4 gap-6">
                      {/* Categories */}
                      <div className="col-span-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                          Product Categories
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {categories.slice(0, 9).map(cat => (
                            <Link
                              key={cat.slug}
                              href={`/products/category/${cat.slug}`}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/5 hover:border-accent/20 border border-transparent transition-all group/item"
                            >
                              <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover/item:bg-accent/10 transition-colors">
                                <span className="text-primary text-base">⚗</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700 group-hover/item:text-accent transition-colors">
                                {cat.name}
                                <span className="ml-1 text-xs text-gray-400">({cat.product_count})</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* CTA Column */}
                      <div className="bg-gradient-hero rounded-2xl p-6 text-white pattern-dots">
                        <p className="font-bold text-base mb-2">Need a Quote?</p>
                        <p className="text-white/70 text-sm mb-4">
                          Get competitive pricing for bulk chemical orders across East Africa.
                        </p>
                        <Link
                          href="/contact?type=quote"
                          className="inline-flex items-center gap-2 bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-accent-500 transition-colors w-full justify-center"
                        >
                          Request Quote
                        </Link>
                        <a
                          href={whatsappHref(undefined, 'header mega menu inquiry')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                        >
                          <MessageCircle size={15} />
                          WhatsApp Sales
                        </a>
                        <Link
                          href="/products"
                          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mt-3 transition-colors"
                        >
                          View All Products →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Get Quote CTA */}
              <Link
                href="/contact"
                className="hidden sm:inline-flex btn-primary btn text-xs px-4 py-2.5"
              >
                Get a Quote
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="py-3 border-t border-white/10 animate-fade-in">
              <form
                onSubmit={e => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
                  }
                }}
                className="relative"
              >
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  autoFocus
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products, chemicals, categories…"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-white/15 transition-all"
                />
              </form>
              <div className="mt-3 rounded-lg border border-white/10 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
                <div className="border-b border-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Instant product search
                </div>
                {searchQuery.trim().length < 2 ? (
                  <p className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">Search by product name, category, chemical use, or application.</p>
                ) : searchLoading ? (
                  <p className="px-4 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Searching catalog...</p>
                ) : searchResults.length ? (
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                      >
                        <Link href={`/products/${product.slug}`} onClick={() => setSearchOpen(false)} className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} width={48} height={48} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">Z</div>
                          )}
                        </Link>
                        <Link href={`/products/${product.slug}`} onClick={() => setSearchOpen(false)} className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-950 dark:text-white">{product.name}</p>
                          <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                            {product.category_name || 'Product catalog'} · {(AVAILABILITY_LABELS[product.availability] || AVAILABILITY_LABELS.in_stock).label}
                          </p>
                        </Link>
                        <a
                          href={whatsappHref(product, 'header search result inquiry')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-700"
                          aria-label={`Ask on WhatsApp about ${product.name}`}
                        >
                          <MessageCircle size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">No matching products yet. Try a category or application.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
