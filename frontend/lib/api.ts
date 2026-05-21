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

const BASE_URL = SITE_CONFIG.apiUrl

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  cache: RequestCache = 'default',
  revalidate?: number,
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
  const data = await fetchAPI<PaginatedResponse<Category>>(
    '/products/categories/',
    {},
    'force-cache',
    3600,
  )
  return data.results
}

export async function getProducts(params?: {
  category?: string
  search?: string
  page?: number
  featured?: boolean
}): Promise<PaginatedResponse<ProductListItem>> {
  const query = new URLSearchParams()
  if (params?.category) query.set('category__slug', params.category)
  if (params?.search) query.set('search', params.search)
  if (params?.page) query.set('page', String(params.page))
  if (params?.featured) query.set('is_featured', 'true')

  return fetchAPI<PaginatedResponse<ProductListItem>>(
    `/products/?${query}`,
    {},
    'no-store',
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
  const data = await fetchAPI<PaginatedResponse<Service>>(
    '/services/',
    {},
    'force-cache',
    3600,
  )
  return data.results
}

export async function getServiceBySlug(slug: string): Promise<Service> {
  return fetchAPI<Service>(`/services/${slug}/`, {}, 'force-cache', 3600)
}

// ─── Industries ───────────────────────────────────────────────────────────

export async function getIndustries(): Promise<Industry[]> {
  const data = await fetchAPI<PaginatedResponse<Industry>>(
    '/industries/',
    {},
    'force-cache',
    3600,
  )
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

  return fetchAPI<PaginatedResponse<BlogPost>>(
    `/blog/?${query}`,
    {},
    'no-store',
  )
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail> {
  return fetchAPI<BlogPostDetail>(`/blog/${slug}/`, {}, 'no-store')
}

export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  return fetchAPI<BlogPost[]>('/blog/featured/', {}, 'force-cache', 600)
}

// ─── Testimonials ─────────────────────────────────────────────────────────

export async function getTestimonials(): Promise<Testimonial[]> {
  const data = await fetchAPI<PaginatedResponse<Testimonial>>(
    '/testimonials/',
    {},
    'force-cache',
    7200,
  )
  return data.results
}

// ─── Partners ─────────────────────────────────────────────────────────────

export async function getPartners(): Promise<Partner[]> {
  const data = await fetchAPI<PaginatedResponse<Partner>>(
    '/partners/',
    {},
    'force-cache',
    7200,
  )
  return data.results
}

// ─── Inquiries ────────────────────────────────────────────────────────────

export async function submitInquiry(data: InquiryFormData): Promise<{ message: string }> {
  return fetchAPI<{ message: string }>('/inquiries/', {
    method: 'POST',
    body: JSON.stringify(data),
  }, 'no-store')
}
