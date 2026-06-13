// ─── Zenco Admin — API Service Layer ─────────────────────────────────────
import { SITE_CONFIG } from '@/lib/constants'
import { getAdminToken, getRefreshToken, setAdminTokens, clearAdminTokens } from './auth'
import type {
  AdminPaginatedResponse, AdminProduct, ProductFormData, AdminBlogPost,
  BlogFormData, AdminInquiry, AdminQuote, ChatbotConversation,
  InventoryItem, Supplier, AnalyticsOverview, TopContent, ConversionStats,
  SeoPageMeta, SiteSetting, DashboardStats, AdminUser, AuthTokens,
  AdminProductCategory, AdminBlogCategory, MonitoringOverview, InquiryStats,
} from './types'

const BASE_URL = SITE_CONFIG.apiUrl

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────

async function adminFetch<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getAdminToken()
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken()
    if (refreshed) return adminFetch<T>(endpoint, options, false)
    clearAdminTokens()
    if (typeof window !== 'undefined') window.location.href = '/admin/login'
    throw new Error('Session expired.')
  }

  if (!res.ok) {
    let msg = `API Error ${res.status}`
    try {
      const b = await res.json()
      msg = b.detail || b.message || Object.entries(b).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`).join(' | ') || msg
    } catch { /* */ }
    throw new Error(msg)
  }

  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

async function adminUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getAdminToken()
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false
  try {
    const res = await fetch(`${BASE_URL}/accounts/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) return false
    setAdminTokens(await res.json() as AuthTokens)
    return true
  } catch { return false }
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export async function adminLogin(username: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${BASE_URL}/accounts/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('Invalid credentials.')
  return res.json() as Promise<AuthTokens>
}

export async function getAdminProfile(): Promise<AdminUser> {
  return adminFetch<AdminUser>('/accounts/me/')
}

// ─── Dashboard ────────────────────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  return adminFetch<DashboardStats>('/admin/dashboard/stats/')
}

// ─── Products ─────────────────────────────────────────────────────────────
export async function getAdminProducts(p?: { search?: string; category?: string; status?: string; page?: number }): Promise<AdminPaginatedResponse<AdminProduct>> {
  const q = new URLSearchParams()
  if (p?.search)   q.set('search', p.search)
  if (p?.category) q.set('category__slug', p.category)
  if (p?.status)   q.set('status', p.status)
  if (p?.page)     q.set('page', String(p.page))
  return adminFetch<AdminPaginatedResponse<AdminProduct>>(`/products/admin/?${q}`)
}

export async function getAdminProductById(id: string): Promise<AdminProduct> {
  return adminFetch<AdminProduct>(`/products/admin/${id}/`)
}

export async function createProduct(data: ProductFormData): Promise<AdminProduct> {
  return adminFetch<AdminProduct>('/products/admin/', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateProduct(id: string, data: Partial<ProductFormData>): Promise<AdminProduct> {
  return adminFetch<AdminProduct>(`/products/admin/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteProduct(id: string): Promise<void> {
  return adminFetch<void>(`/products/admin/${id}/`, { method: 'DELETE' })
}

export async function uploadProductImage(productId: string, file: File): Promise<{ image: string }> {
  const form = new FormData(); form.append('image', file)
  return adminUpload<{ image: string }>(`/products/admin/${productId}/upload-image/`, form)
}

export async function importProductImage(productId: string, imageUrl: string): Promise<{ image: string }> {
  return adminFetch<{ image: string }>(`/products/admin/${productId}/import-image/`, {
    method: 'POST',
    body: JSON.stringify({ image_url: imageUrl }),
  })
}

export async function getAdminCategories(): Promise<AdminProductCategory[]> {
  const data = await adminFetch<AdminPaginatedResponse<AdminProductCategory>>('/products/categories/')
  return data.results
}

export async function createProductCategory(data: {
  name: string
  slug?: string
  description?: string
  seo_title?: string
  seo_description?: string
}): Promise<AdminProductCategory> {
  return adminFetch<AdminProductCategory>('/products/categories/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Blog ─────────────────────────────────────────────────────────────────
export async function getAdminBlogPosts(p?: { search?: string; status?: string; page?: number }): Promise<AdminPaginatedResponse<AdminBlogPost>> {
  const q = new URLSearchParams()
  if (p?.search) q.set('search', p.search)
  if (p?.status) q.set('status', p.status)
  if (p?.page)   q.set('page', String(p.page))
  return adminFetch<AdminPaginatedResponse<AdminBlogPost>>(`/blog/admin/?${q}`)
}

export async function getAdminBlogPostById(id: string): Promise<AdminBlogPost> {
  return adminFetch<AdminBlogPost>(`/blog/admin/${id}/`)
}

export async function createBlogPost(data: BlogFormData): Promise<AdminBlogPost> {
  return adminFetch<AdminBlogPost>('/blog/admin/', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateBlogPost(id: string, data: Partial<BlogFormData>): Promise<AdminBlogPost> {
  return adminFetch<AdminBlogPost>(`/blog/admin/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteBlogPost(id: string): Promise<void> {
  return adminFetch<void>(`/blog/admin/${id}/`, { method: 'DELETE' })
}

export async function getAdminBlogCategories(): Promise<AdminBlogCategory[]> {
  const data = await adminFetch<AdminPaginatedResponse<AdminBlogCategory>>('/blog/categories/')
  return data.results
}

// ─── Inquiries ────────────────────────────────────────────────────────────
export async function getAdminInquiries(p?: {
  search?: string
  status?: string
  inquiry_type?: string
  product_name?: string
  country?: string
  start_date?: string
  end_date?: string
  page?: number
}): Promise<AdminPaginatedResponse<AdminInquiry>> {
  const q = new URLSearchParams()
  if (p?.search) q.set('search', p.search)
  if (p?.status) q.set('status', p.status)
  if (p?.inquiry_type) q.set('inquiry_type', p.inquiry_type)
  if (p?.product_name) q.set('product_name', p.product_name)
  if (p?.country) q.set('country', p.country)
  if (p?.start_date) q.set('start_date', p.start_date)
  if (p?.end_date) q.set('end_date', p.end_date)
  if (p?.page) q.set('page', String(p.page))
  return adminFetch<AdminPaginatedResponse<AdminInquiry>>(`/inquiries/admin/?${q}`)
}

export async function updateInquiryStatus(id: string, status: string, admin_notes?: string): Promise<AdminInquiry> {
  return adminFetch<AdminInquiry>(`/inquiries/admin/${id}/`, { method: 'PATCH', body: JSON.stringify({ status, ...(admin_notes ? { admin_notes } : {}) }) })
}

export async function deleteInquiry(id: string): Promise<void> {
  return adminFetch<void>(`/inquiries/admin/${id}/`, { method: 'DELETE' })
}

export async function replyToInquiry(id: string, message: string): Promise<{ message: string; status: string; replied_at: string; admin_notes: string }> {
  return adminFetch<{ message: string; status: string; replied_at: string; admin_notes: string }>(`/inquiries/admin/${id}/reply/`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export async function getInquiryStats(): Promise<InquiryStats> {
  return adminFetch<InquiryStats>('/inquiries/admin/stats/')
}

// ─── Quotes ───────────────────────────────────────────────────────────────
export async function getAdminQuotes(p?: { search?: string; status?: string; page?: number }): Promise<AdminPaginatedResponse<AdminQuote>> {
  const q = new URLSearchParams()
  if (p?.search) q.set('search', p.search)
  if (p?.status) q.set('status', p.status)
  if (p?.page)   q.set('page', String(p.page))
  q.set('inquiry_type', 'quote')
  const data = await adminFetch<AdminPaginatedResponse<AdminInquiry>>(`/inquiries/admin/?${q}`)
  return {
    ...data,
    results: data.results.map(inq => ({
      id: inq.id,
      reference_number: `ZQ-${inq.id.slice(0, 8).toUpperCase()}`,
      full_name: inq.full_name,
      email: inq.email,
      phone: inq.phone,
      company: inq.company,
      country: inq.country,
      items: [{ product_name: inq.product_interest || 'General quote', quantity: inq.quantity || '', unit: '' }],
      status: inq.status === 'new' ? 'pending' : inq.status === 'processing' ? 'reviewing' : inq.status === 'resolved' ? 'quoted' : 'rejected',
      priority: 'normal',
      currency: 'KES',
      admin_notes: inq.admin_notes,
      created_at: inq.created_at,
      updated_at: inq.updated_at,
    })),
  }
}

export async function updateQuoteStatus(id: string, status: string, admin_notes?: string): Promise<AdminQuote> {
  const inquiryStatus = status === 'pending' ? 'new' : status === 'reviewing' ? 'processing' : status === 'quoted' || status === 'accepted' ? 'resolved' : 'closed'
  const inq = await adminFetch<AdminInquiry>(`/inquiries/admin/${id}/`, { method: 'PATCH', body: JSON.stringify({ status: inquiryStatus, ...(admin_notes ? { admin_notes } : {}) }) })
  return {
    id: inq.id,
    reference_number: `ZQ-${inq.id.slice(0, 8).toUpperCase()}`,
    full_name: inq.full_name,
    email: inq.email,
    phone: inq.phone,
    company: inq.company,
    country: inq.country,
    items: [{ product_name: inq.product_interest || 'General quote', quantity: inq.quantity || '', unit: '' }],
    status: status as AdminQuote['status'],
    priority: 'normal',
    currency: 'KES',
    admin_notes: inq.admin_notes,
    created_at: inq.created_at,
    updated_at: inq.updated_at,
  }
}

// ─── Chatbot ──────────────────────────────────────────────────────────────
export async function getChatbotConversations(p?: { search?: string; is_resolved?: boolean; page?: number }): Promise<AdminPaginatedResponse<ChatbotConversation>> {
  const q = new URLSearchParams()
  if (p?.search)      q.set('search', p.search)
  if (p?.is_resolved !== undefined) q.set('is_resolved', String(p.is_resolved))
  if (p?.page)        q.set('page', String(p.page))
  return adminFetch<AdminPaginatedResponse<ChatbotConversation>>(`/chatbot/conversations/?${q}`)
}

export async function resolveChatbotConversation(id: string): Promise<void> {
  return adminFetch<void>(`/chatbot/conversations/${id}/resolve/`, { method: 'POST' })
}

// ─── Inventory ────────────────────────────────────────────────────────────
export async function getInventory(p?: { search?: string; low_stock?: boolean; page?: number }): Promise<AdminPaginatedResponse<InventoryItem>> {
  const q = new URLSearchParams()
  if (p?.search)    q.set('search', p.search)
  if (p?.low_stock) q.set('low_stock', 'true')
  if (p?.page)      q.set('page', String(p.page))
  return adminFetch<AdminPaginatedResponse<InventoryItem>>(`/inventory/?${q}`)
}

export async function updateInventoryStock(id: string, quantity: number): Promise<InventoryItem> {
  return adminFetch<InventoryItem>(`/inventory/${id}/`, { method: 'PATCH', body: JSON.stringify({ stock_quantity: quantity }) })
}

export async function getSuppliers(): Promise<AdminPaginatedResponse<Supplier>> {
  return adminFetch<AdminPaginatedResponse<Supplier>>('/inventory/suppliers/')
}

// ─── Analytics ────────────────────────────────────────────────────────────
export async function getAnalyticsOverview(period?: '7d' | '30d' | '90d'): Promise<AnalyticsOverview> {
  return adminFetch<AnalyticsOverview>(`/analytics/overview/?period=${period || '30d'}`)
}

export async function getTopProducts(): Promise<TopContent[]> {
  return adminFetch<TopContent[]>('/analytics/top-products/')
}

export async function getTopBlogPosts(): Promise<TopContent[]> {
  return adminFetch<TopContent[]>('/analytics/top-blog-posts/')
}

export async function getConversionStats(): Promise<ConversionStats> {
  return adminFetch<ConversionStats>('/analytics/conversions/')
}

export async function getMonitoringOverview(): Promise<MonitoringOverview> {
  return adminFetch<MonitoringOverview>('/admin/monitoring/overview/')
}

// ─── SEO ──────────────────────────────────────────────────────────────────
export async function getSeoPages(): Promise<SeoPageMeta[]> {
  return adminFetch<SeoPageMeta[]>('/seo/pages/')
}

export async function updateSeoPage(id: string, data: Partial<SeoPageMeta>): Promise<SeoPageMeta> {
  return adminFetch<SeoPageMeta>(`/seo/pages/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
}

// ─── Settings ─────────────────────────────────────────────────────────────
export async function getSiteSettings(): Promise<SiteSetting[]> {
  return adminFetch<SiteSetting[]>('/settings/')
}

export async function updateSiteSetting(key: string, value: string): Promise<SiteSetting> {
  return adminFetch<SiteSetting>(`/settings/${key}/`, { method: 'PATCH', body: JSON.stringify({ value }) })
}

// ─── Users ────────────────────────────────────────────────────────────────
export async function getAdminUsers(): Promise<AdminPaginatedResponse<AdminUser>> {
  return adminFetch<AdminPaginatedResponse<AdminUser>>('/accounts/admin/users/')
}

export async function updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
  return adminFetch<AdminUser>(`/accounts/admin/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function createAdminUser(data: Pick<AdminUser, 'username' | 'email'> & { first_name?: string; last_name?: string }): Promise<AdminUser> {
  return adminFetch<AdminUser>('/accounts/admin/users/', { method: 'POST', body: JSON.stringify(data) })
}

// ─── AI Assistants ───────────────────────────────────────────────────────
export async function generateProductContent(data: { image_url?: string; image?: File; prompt?: string }): Promise<{ content: string }> {
  if (data.image) {
    const form = new FormData()
    form.append('image', data.image)
    if (data.prompt) form.append('prompt', data.prompt)
    if (data.image_url) form.append('image_url', data.image_url)
    return adminUpload<{ content: string }>('/ai/product-content/', form)
  }
  return adminFetch<{ content: string }>('/ai/product-content/', { method: 'POST', body: JSON.stringify(data) })
}

export async function auditSeo(data: Record<string, unknown>): Promise<{ recommendations: string }> {
  return adminFetch<{ recommendations: string }>('/ai/seo-audit/', { method: 'POST', body: JSON.stringify(data) })
}

export async function auditWebsiteHealth(data: Record<string, unknown>): Promise<{ recommendations: string }> {
  return adminFetch<{ recommendations: string }>('/ai/website-health/', { method: 'POST', body: JSON.stringify(data) })
}

export async function getPerformanceSnapshots(): Promise<AdminPaginatedResponse<Record<string, unknown>>> {
  return adminFetch<AdminPaginatedResponse<Record<string, unknown>>>('/performance/snapshots/')
}

export async function getWhatsAppAnalytics(): Promise<{ total_clicks: number; clicks_by_day: { date: string; clicks: number }[] }> {
  return adminFetch<{ total_clicks: number; clicks_by_day: { date: string; clicks: number }[] }>('/analytics/whatsapp/')
}

export async function syncGoogleSheets(data: { resource: string; sheet_name?: string; spreadsheet_id?: string; direction?: 'push' | 'pull' }) {
  return adminFetch<Record<string, unknown>>('/integrations/google-sheets/sync/', { method: 'POST', body: JSON.stringify(data) })
}
