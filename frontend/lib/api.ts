import { SITE_CONFIG } from '@/lib/constants'
import type {
  PaginatedResponse,
  Category,
  ProductListItem,
  ProductDetail,
  Service,
  Industry,
  BlogPost,
  BlogPostDetail,
  Testimonial,
  Partner,
  InquiryFormData,
} from '@/types'

function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || SITE_CONFIG.apiUrl
  }
  return SITE_CONFIG.apiUrl
}

function getExtraHeaders(): Record<string, string> {
  // When running server-side via internal Docker URL, spoof the Host header
  // so Django's ALLOWED_HOSTS check passes
  if (typeof window === 'undefined' && process.env.INTERNAL_API_URL) {
    return { Host: 'zencochemicals.com' }
  }
  return {}
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  cache: RequestCache = 'default',
  revalidate?: number,
): Promise<T> {
  const BASE_URL = getBaseUrl()
  const url = `${BASE_URL}${endpoint}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getExtraHeaders(),
      ...options.headers,
    },
    cache,
    ...(revalidate !== undefined ? { next: { revalidate } } : {}),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API error ${res.status}: ${error}`)
  }

  return res.json() as Promise<T>
}

// ─── Products ─────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const data = await fetchAPI<PaginatedResponse<Category>>('/products/categories/?page_size=1000', {}, 'force-cache', 3600)
  return data.results
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  return fetchAPI<Category>(`/products/categories/${slug}/`, {}, 'force-cache', 1800)
}

export async function getProducts(params?: {
  category?: string
  search?: string
  page?: number
  featured?: boolean
  availability?: string
  ordering?: string
  cache?: RequestCache
  revalidate?: number
}): Promise<PaginatedResponse<ProductListItem>> {
  const query = new URLSearchParams()
  if (params?.category) query.set('category__slug', params.category)
  if (params?.search) query.set('search', params.search)
  if (params?.page) query.set('page', String(params.page))
  if (params?.featured) query.set('is_featured', 'true')
  if (params?.availability) query.set('availability', params.availability)
  if (params?.ordering) query.set('ordering', params.ordering)

  return fetchAPI<PaginatedResponse<ProductListItem>>(
    `/products/?${query}`,
    {},
    params?.cache || 'force-cache',
    params?.revalidate ?? 60,
  )
}

export async function getFeaturedProducts(): Promise<ProductListItem[]> {
  return fetchAPI<ProductListItem[]>('/products/featured/', {}, 'force-cache', 1800)
}

export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  return fetchAPI<ProductDetail>(`/products/${slug}/`, {}, 'force-cache', 900)
}

// ─── Services ─────────────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  const data = await fetchAPI<PaginatedResponse<Service>>('/services/', {}, 'force-cache', 3600)
  return data.results
}

export async function getServiceBySlug(slug: string): Promise<Service> {
  return fetchAPI<Service>(`/services/${slug}/`, {}, 'force-cache', 3600)
}

// ─── Industries ───────────────────────────────────────────────────────────

export async function getIndustries(): Promise<Industry[]> {
  const data = await fetchAPI<PaginatedResponse<Industry>>('/industries/', {}, 'force-cache', 3600)
  return data.results
}

export async function getIndustryBySlug(slug: string): Promise<Industry> {
  return fetchAPI<Industry>(`/industries/${slug}/`, {}, 'force-cache', 3600)
}

// ─── Blog ─────────────────────────────────────────────────────────────────

export async function getBlogPosts(params?: {
  category?: string
  page?: number
  featured?: boolean
}): Promise<PaginatedResponse<BlogPost>> {
  const query = new URLSearchParams()
  if (params?.category) query.set('category__slug', params.category)
  if (params?.page) query.set('page', String(params.page))
  if (params?.featured) query.set('is_featured', 'true')

  return fetchAPI<PaginatedResponse<BlogPost>>(`/blog/?${query}`, {}, 'force-cache', 60)
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail> {
  return fetchAPI<BlogPostDetail>(`/blog/${slug}/`, {}, 'force-cache', 60)
}

export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  return fetchAPI<BlogPost[]>('/blog/featured/', {}, 'force-cache', 600)
}

// ─── Testimonials ─────────────────────────────────────────────────────────

export async function getTestimonials(): Promise<Testimonial[]> {
  const data = await fetchAPI<PaginatedResponse<Testimonial>>('/testimonials/', {}, 'force-cache', 7200)
  return data.results
}

// ─── Partners ─────────────────────────────────────────────────────────────

export async function getPartners(): Promise<Partner[]> {
  const data = await fetchAPI<PaginatedResponse<Partner>>('/partners/', {}, 'force-cache', 7200)
  return data.results
}

// ─── Inquiries ────────────────────────────────────────────────────────────

export async function submitInquiry(data: InquiryFormData): Promise<{ message: string }> {
  return fetchAPI<{ message: string }>('/inquiries/', { method: 'POST', body: JSON.stringify(data) }, 'no-store')
}

export async function trackWhatsAppClick(data: {
  page_url?: string
  source?: string
  message?: string
  product_slug?: string
}): Promise<{ message: string }> {
  return fetchAPI<{ message: string }>('/analytics/whatsapp-click/', { method: 'POST', body: JSON.stringify(data) }, 'no-store')
}

// ─── Sitemap Pagination Helpers ───────────────────────────────────────────

export async function getAllProducts(): Promise<ProductListItem[]> {
  const all: ProductListItem[] = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    try {
      const data = await getProducts({ page, cache: 'no-store' })
      all.push(...data.results)
      hasMore = Boolean(data.next)
      page++
    } catch {
      hasMore = false
    }
  }
  return all
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const all: BlogPost[] = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    try {
      const data = await getBlogPosts({ page })
      all.push(...data.results)
      hasMore = Boolean(data.next)
      page++
    } catch {
      hasMore = false
    }
  }
  return all
}

// ─── Technical Documents ──────────────────────────────────────────────────

export async function getTechnicalDocuments(params?: {
  doc_type?: string
  search?: string
  page?: number
}): Promise<{ count: number; next: string | null; previous: string | null; results: TechDoc[] }> {
  const query = new URLSearchParams()
  if (params?.doc_type) query.set('doc_type', params.doc_type)
  if (params?.search)   query.set('search', params.search)
  if (params?.page)     query.set('page', String(params.page))
  return fetchAPI(`/blog/technical-docs/?${query}`, {}, 'force-cache', 3600)
}

export async function getTechnicalDocumentBySlug(slug: string): Promise<TechDocDetail> {
  return fetchAPI<TechDocDetail>(`/blog/technical-docs/${slug}/`, {}, 'force-cache', 3600)
}

export async function getAllTechnicalDocuments(): Promise<TechDoc[]> {
  const all: TechDoc[] = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    try {
      const data = await getTechnicalDocuments({ page })
      all.push(...data.results)
      hasMore = Boolean(data.next)
      page++
    } catch {
      hasMore = false
    }
  }
  return all
}

// Inline local types (avoids needing to update global types.ts for public pages)
export type TechDoc = {
  id: string
  title: string
  slug: string
  doc_type: string
  doc_type_display: string
  standard_code: string
  excerpt: string
  is_published: boolean
  created_at: string
  updated_at: string
  view_count: number
}

export type TechDocDetail = TechDoc & {
  body_html: string
  pdf_file?: string | null
  meta_title: string
  meta_description: string
}

// ─── Product Data Sheets (AI TDS) ─────────────────────────────────────────

export type ProductDataSheetDetail = {
  id: number
  title: string
  slug: string
  version: string
  issue_date: string
  revision_date: string
  meta_title: string
  meta_description: string
  product_description: string
  chemical_composition: { component: string; cas_number: string; percentage: string }[]
  physical_properties: Record<string, string>
  performance_data: Record<string, unknown>
  applications: string[]
  industries_served: string[]
  health_safety: Record<string, unknown>
  storage_handling: Record<string, unknown>
  packaging_info: Record<string, unknown>
  standards_compliance: { standard: string; scope: string }[]
  certifications: string[]
  faq: { question: string; answer: string }[]
  related_products_text: string
  product: {
    id: string
    name: string
    slug: string
    sku: string
    short_description: string
    image: string | null
    category_name: string
    category_slug: string
  }
  related_products: ProductListItem[]
  related_blogs: { title: string; slug: string; excerpt: string }[]
  related_docs: { title: string; slug: string; doc_type: string; excerpt: string }[]
  view_count: number
  updated_at: string
}

export type ProductDataSheetSitemapEntry = {
  product_slug: string
  updated_at: string
}

export async function getProductDataSheet(productSlug: string): Promise<ProductDataSheetDetail> {
  return fetchAPI<ProductDataSheetDetail>(`/datasheets/${productSlug}/`, {}, 'force-cache', 7200)
}

export async function trackDatasheetView(productSlug: string): Promise<void> {
  const BASE_URL = getBaseUrl()
  await fetch(`${BASE_URL}/datasheets/${productSlug}/view/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getExtraHeaders(),
    },
  })
}

export async function getAllPublishedDatasheets(): Promise<ProductDataSheetSitemapEntry[]> {
  try {
    return await fetchAPI<ProductDataSheetSitemapEntry[]>('/datasheets/sitemap/', {}, 'force-cache', 3600)
  } catch {
    return []
  }
}

