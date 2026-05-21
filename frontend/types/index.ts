// ─── Product Types ────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  image: string | null
  sort_order: number
  seo_title: string
  seo_description: string
  product_count: number
  is_active: boolean
}

export interface ProductListItem {
  id: string
  name: string
  slug: string
  short_description: string
  category: string
  category_name: string
  category_slug: string
  image: string | null
  availability: 'in_stock' | 'limited' | 'out_of_stock' | 'on_order'
  is_featured: boolean
  regions_available: string[]
}

export interface ProductDetail extends ProductListItem {
  description: string
  category: Category
  specifications: Record<string, string>
  applications: string[]
  gallery: string[]
  datasheet: string | null
  seo_title: string
  seo_description: string
  schema_data: Record<string, unknown>
  related_products: ProductListItem[]
  created_at: string
  updated_at: string
}

// ─── Blog Types ──────────────────────────────────────────────────────────

export interface BlogCategory {
  id: number
  name: string
  slug: string
  description: string
  color: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: BlogCategory | null
  featured_image: string | null
  tags: string[]
  reading_time: number
  is_featured: boolean
  published_at: string
  author_name: string
}

export interface BlogPostDetail extends BlogPost {
  content: string
  og_image: string | null
  seo_title: string
  seo_description: string
  canonical_url: string
  views_count: number
  updated_at: string
}

// ─── Service Types ───────────────────────────────────────────────────────

export interface Service {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  short_description: string
  icon: string
  image: string | null
  features: string[]
  industries_served: string[]
  is_featured: boolean
  sort_order: number
  seo_title: string
  seo_description: string
}

// ─── Industry Types ──────────────────────────────────────────────────────

export interface Industry {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  short_description: string
  icon: string
  hero_image: string | null
  challenges: string[]
  solutions: string[]
  relevant_products: string[]
  sort_order: number
  seo_title: string
  seo_description: string
}

// ─── Testimonial Types ───────────────────────────────────────────────────

export interface Testimonial {
  id: string
  author_name: string
  author_role: string
  company: string
  company_logo: string | null
  text: string
  rating: number
  industry: string
  is_featured: boolean
}

// ─── Partner Types ───────────────────────────────────────────────────────

export interface Partner {
  id: string
  name: string
  logo: string
  url: string
  partner_type: 'supplier' | 'distributor' | 'certification' | 'association' | 'client'
  description: string
  sort_order: number
}

// ─── Inquiry Types ───────────────────────────────────────────────────────

export type InquiryType = 'general' | 'product' | 'quote' | 'partnership' | 'technical' | 'complaint'

export interface InquiryFormData {
  full_name: string
  email: string
  phone?: string
  company?: string
  country?: string
  inquiry_type: InquiryType
  product_interest?: string
  quantity?: string
  message: string
}

// ─── API Response Types ──────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ─── Navigation Types ────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  description?: string
  icon?: string
  children?: NavItem[]
}

export interface MegaMenuColumn {
  heading: string
  items: NavItem[]
}
