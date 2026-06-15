// ─── Zenco Admin Dashboard — Type Definitions ────────────────────────────

// ── Auth ──────────────────────────────────────────────────────────────────

export type AdminRole = 'admin' | 'editor' | 'support'

export interface AdminUser {
  id: string
  username: string
  email: string
  full_name: string
  role: AdminRole
  avatar?: string | null
  last_login?: string
  is_active: boolean
  date_joined: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_products: number
  total_blog_posts: number
  total_inquiries: number
  total_quotes: number
  total_chatbot_chats: number
  low_stock_alerts: number
  new_inquiries_today: number
  resolved_today: number
}

export interface ActivityItem {
  id: string
  type: 'inquiry' | 'quote' | 'blog' | 'product' | 'chat' | 'user'
  title: string
  description: string
  timestamp: string
  icon?: string
}

export interface TrafficData {
  date: string
  visitors: number
  page_views: number
  new_users: number
}

// ── Products ──────────────────────────────────────────────────────────────

export type ProductStatus = 'published' | 'draft' | 'archived'
export type AvailabilityStatus = 'in_stock' | 'limited' | 'out_of_stock' | 'on_order'

export interface AdminProductCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  image?: string | null
  sort_order: number
  is_active: boolean
  product_count: number
  seo_title: string
  seo_description: string
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  short_description: string
  description: string
  category: string | null
  category_name: string
  category_slug: string
  image: string | null
  gallery: string[]
  specifications: Record<string, string>
  applications: string[]
  packaging: string
  price_per_unit?: number | null
  price_currency?: string
  availability: AvailabilityStatus
  stock_quantity: number
  reorder_level: number
  is_featured: boolean
  status: ProductStatus
  regions_available: string[]
  seo_title: string
  seo_description: string
  schema_data?: Record<string, unknown>
  datasheet?: string | null
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  name: string
  slug: string
  short_description: string
  description: string
  category: string | null
  packaging: string
  price_per_unit?: number | null
  availability: AvailabilityStatus
  stock_quantity: number
  reorder_level: number
  is_featured: boolean
  status: ProductStatus
  specifications: Record<string, string>
  applications: string[]
  regions_available: string[]
  seo_title: string
  seo_description: string
  schema_data?: Record<string, unknown>
}

// ── Blog ──────────────────────────────────────────────────────────────────

export type BlogStatus = 'published' | 'draft' | 'scheduled'

export interface AdminBlogCategory {
  id: number
  name: string
  slug: string
  color: string
}

export interface AdminBlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: AdminBlogCategory | null
  featured_image: string | null
  og_image?: string | null
  tags: string[]
  reading_time: number
  is_featured: boolean
  status: BlogStatus
  author_name: string
  author_id: string
  published_at: string | null
  scheduled_at?: string | null
  seo_title: string
  seo_description: string
  canonical_url?: string
  views_count: number
  created_at: string
  updated_at: string
}

export interface BlogFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  category?: string
  tags: string[]
  is_featured: boolean
  status: BlogStatus
  published_at?: string | null
  seo_title: string
  seo_description: string
}

// ── Inquiries ─────────────────────────────────────────────────────────────

export type InquiryStatus = 'new' | 'in_progress' | 'replied' | 'quotation_sent' | 'closed'
export type InquiryType = 'quote' | 'product' | 'general' | 'consultation' | 'product_info' | 'partnership' | 'technical'

export interface AdminInquiry {
  id: string
  ticket_number?: string
  full_name: string
  email: string
  phone?: string | null
  company?: string | null
  country: string
  inquiry_type: InquiryType
  product_name?: string | null
  product_interest?: string | null
  name?: string
  quantity?: string | null
  message: string
  status: InquiryStatus
  admin_notes?: string
  replied_at?: string | null
  notification_sent?: boolean
  autoreply_sent?: boolean
  error_log?: string
  created_at: string
  updated_at: string
}

// ── Quotes ────────────────────────────────────────────────────────────────

export type QuoteStatus = 'pending' | 'reviewing' | 'quoted' | 'accepted' | 'rejected' | 'expired'
export type QuotePriority = 'low' | 'normal' | 'high' | 'urgent'

export interface QuoteItem {
  product_name: string
  product_id?: string
  quantity: string
  unit: string
  notes?: string
}

export interface AdminQuote {
  id: string
  reference_number: string
  full_name: string
  email: string
  phone?: string | null
  company?: string | null
  country: string
  items: QuoteItem[]
  delivery_address?: string
  delivery_date?: string | null
  special_requirements?: string
  status: QuoteStatus
  priority: QuotePriority
  quoted_amount?: number | null
  currency: string
  admin_notes?: string
  created_at: string
  updated_at: string
}

// ── Chatbot ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatbotConversation {
  id: string
  session_id: string
  user_identifier?: string | null
  messages: ChatMessage[]
  message_count: number
  is_resolved: boolean
  first_message: string
  last_message_at: string
  created_at: string
  // Lead / escalation tracking (new fields)
  lead_intent: boolean
  product_interest: string
  escalated_to_whatsapp: boolean
}

// ── Inventory ─────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string
  product_id: string
  product_name: string
  product_sku?: string
  category_name: string
  stock_quantity: number
  reorder_level: number
  unit: string
  supplier_name?: string
  last_restocked?: string | null
  cost_per_unit?: number | null
  is_low_stock: boolean
}

export interface Supplier {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string
  address?: string
  country: string
  products_supplied: string[]
  lead_time_days: number
  is_active: boolean
  created_at: string
}

// ── Analytics ─────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  period: string
  total_visitors: number
  total_page_views: number
  bounce_rate: number
  avg_session_duration: string
  new_users: number
  returning_users: number
  traffic_by_day: TrafficData[]
}

export interface TopContent {
  id: string
  title: string
  slug: string
  views: number
  category?: string
}

export interface ConversionStats {
  total_inquiries: number
  total_quotes: number
  quote_conversion_rate: number
  inquiry_to_quote_rate: number
  avg_response_time_hours: number
}

// ── Monitoring ───────────────────────────────────────────────────────────

export interface MonitoringNamedValue {
  label: string
  value: number
}

export interface MonitoringRecommendation {
  severity: 'info' | 'warning' | 'critical'
  message: string
  count?: number
}

export interface MonitoringOverview {
  generated_at: string
  data_sources: string[]
  website_overview: {
    total_website_visitors: number | null
    active_users_right_now: number | null
    visitors_today: number | null
    visitors_this_week: number | null
    visitors_this_month: number | null
    returning_visitors: number | null
    new_visitors: number | null
    average_session_duration: string | null
    bounce_rate: number | null
    top_landing_pages: MonitoringNamedValue[]
    most_viewed_pages: Array<{ label: string; path: string; value: number }>
    exit_pages: MonitoringNamedValue[]
    user_flow_analysis: string | null
  }
  seo: {
    score: number | null
    page_score: number | null
    product_score: number | null
    blog_score: number | null
    category_score: number | null
    issues: Record<string, number>
    recommendations: MonitoringRecommendation[]
    robots_txt_health: string | null
    sitemap_coverage: string | null
    structured_data: string | null
    broken_links: string | null
    redirect_chains: string | null
  }
  performance: {
    latest_snapshot_at: string | null
    performance_score: number | null
    accessibility_score: number | null
    best_practices_score: number | null
    seo_score: number | null
    largest_contentful_paint: number | null
    first_contentful_paint: number | null
    interaction_to_next_paint: number | null
    cumulative_layout_shift: number | null
    time_to_first_byte: number | null
    mobile_metrics: Record<string, unknown> | null
    desktop_metrics: Record<string, unknown> | null
    historical_trends: Record<string, unknown>[]
  }
  errors: { message: string; [key: string]: unknown }
  api_health: { endpoints: unknown[]; uptime_percentage: number | null; message: string }
  inventory: {
    total_inventory_value: number | null
    available_stock: number | null
    out_of_stock_products: number
    low_stock_products: number
    negative_inventory: number
    fast_moving_products: MonitoringNamedValue[]
    slow_moving_products: MonitoringNamedValue[]
    supplier_performance: Array<{ supplier: string; product_count: number }>
    inventory_turnover_rate: number | null
    google_sheets_sync: {
      status: string | null
      resource: string | null
      sheet_name: string | null
      last_pull_at: string | null
      last_push_at: string | null
      message: string
    }
  }
  crm: {
    leads_generated: number
    quote_requests: number
    contact_form_submissions: number
    product_inquiries: number
    whatsapp_clicks: number
    phone_clicks: number | null
    email_clicks: number | null
    chatbot_conversations: number
    lead_sources: MonitoringNamedValue[]
    top_regions: MonitoringNamedValue[]
    most_requested_chemicals: MonitoringNamedValue[]
  }
  ai: { message: string; [key: string]: unknown }
  chatbot: {
    conversations: number
    conversations_today: number
    unresolved_conversations: number
    most_asked_questions: MonitoringNamedValue[]
    failed_responses: number | null
    escalated_conversations: number
    product_requests: MonitoringNamedValue[]
    customer_satisfaction_ratings: number | null
  }
  security: { message: string; [key: string]: unknown }
  business_intelligence: {
    revenue_trends: unknown
    quote_trends: Record<string, number>
    lead_trends: Record<string, number>
    inventory_trends: unknown
    product_trends: unknown
    search_trends: unknown
    customer_trends: unknown
  }
}

// ── SEO ───────────────────────────────────────────────────────────────────

export interface SeoPageMeta {
  id: string
  page_path: string
  page_label: string
  seo_title: string
  seo_description: string
  og_title?: string
  og_description?: string
  og_image?: string | null
  canonical_url?: string
  index: boolean
  follow: boolean
  keywords?: string[]
  schema_type?: string
  last_updated: string
}

// ── Settings ──────────────────────────────────────────────────────────────

export interface SiteSetting {
  id: string
  key: string
  label: string
  value: string
  type: 'text' | 'email' | 'url' | 'boolean' | 'number' | 'textarea'
  group: string
  description?: string
}

// ── Pagination ────────────────────────────────────────────────────────────

export interface AdminPaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ── Table Column Definition ───────────────────────────────────────────────

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: unknown, row: T) => React.ReactNode
}

// ── Toast ─────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export interface InquiryStats {
  total_inquiries: number
  new_inquiries: number
  replied_inquiries: number
  quote_requests: number
  product_inquiries: number
  monthly_trends: { month: string; count: number }[]
  conversion_rate: number
  most_requested_products: { name: string; count: number }[]
  inquiry_sources: { source: string; count: number }[]
  email_delivery_success_rate: number
  autoreply_success_rate: number
}
