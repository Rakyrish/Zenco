'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, FileText, MessageSquare, ShoppingCart,
  Bot, BarChart3, Warehouse, Search, Settings, Users, ChevronLeft,
  ChevronRight, X, Zap,
} from 'lucide-react'

interface NavGroup {
  label: string
  items: NavItem[]
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Products', href: '/admin/products', icon: <Package size={18} /> },
      { label: 'Blog Posts', href: '/admin/blog', icon: <FileText size={18} /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Inquiries', href: '/admin/inquiries', icon: <MessageSquare size={18} /> },
      { label: 'Quote Requests', href: '/admin/quotes', icon: <ShoppingCart size={18} /> },
      { label: 'Chatbot Monitor', href: '/admin/chatbot', icon: <Bot size={18} /> },
      { label: 'Inventory', href: '/admin/inventory', icon: <Warehouse size={18} /> },
    ],
  },
  {
    label: 'Analytics & SEO',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={18} /> },
      { label: 'SEO Manager', href: '/admin/seo', icon: <Search size={18} /> },
      { label: 'Performance', href: '/admin/performance', icon: <Zap size={18} /> },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', href: '/admin/users', icon: <Users size={18} /> },
      { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
    ],
  },
]

interface AdminSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) =>
    href === '/admin/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed top-0 left-0 h-full z-50 flex flex-col',
          'bg-[#0C094D] dark:bg-[#111827] border-r border-white/10 dark:border-[#2f3b52]',
          'shadow-2xl shadow-[#0C094D]/15 dark:shadow-black/30',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[72px]' : 'w-64',
          // Mobile: transform-based show/hide
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/20">
            <Image src="/zencologo.jpeg" alt="Zenco Chemicals Ltd logo" fill sizes="44px" className="object-contain p-1" priority />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">Zenco Chemicals Ltd</p>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">Admin Dashboard</p>
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="lg:hidden ml-auto text-white/50 hover:text-white p-1"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6 scrollbar-thin">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onMobileClose}
                        title={collapsed ? item.label : undefined}
                        className={[
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                          'group relative',
                          active
                            ? 'bg-[#F26C0C] text-white shadow-lg shadow-[#F26C0C]/25 dark:shadow-[0_0_24px_rgba(255,140,42,0.32)]'
                            : 'text-white/65 hover:text-white hover:bg-white/10 dark:hover:bg-[#202b3f]',
                          collapsed ? 'justify-center' : '',
                        ].join(' ')}
                      >
                        <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-white/50 group-hover:text-white'}`}>
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {item.badge && !collapsed && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                        {/* Tooltip for collapsed */}
                        {collapsed && (
                          <span className="absolute left-full ml-3 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-white/10">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 w-full bg-[#F26C0C]/15 hover:bg-[#F26C0C]/25 border border-[#F26C0C]/30 text-[#F26C0C] text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Zap size={13} />
              Quick Add Product
            </Link>
          </div>
        )}

        {/* Collapse Toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-full py-3 border-t border-white/10 text-white/30 hover:text-white hover:bg-white/5 transition-colors text-xs gap-1.5 flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </aside>

      {/* Spacer to push content right (desktop) */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`} />
    </>
  )
}
