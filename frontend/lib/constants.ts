// ─── Zenco Systems Constants ──────────────────────────────────────────────

export const SITE_CONFIG = {
  name: 'Zenco Systems Ltd',
  division: 'Chemical Division',
  fullName: 'Zenco Systems Ltd – Chemical Division',
  tagline: 'Industrial Chemical Solutions for East Africa',
  description:
    'Zenco Systems Ltd is a trusted supplier of industrial chemicals, water treatment chemicals, solvents, and specialty chemicals across Kenya and East Africa.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://zencosystems.co.ke',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  email: 'info@zencosystems.co.ke',
  phone: '+254 700 000 000',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+254700000000',
  address: {
    street: 'Industrial Area, Off Mombasa Road',
    city: 'Nairobi',
    country: 'Kenya',
    postalCode: '00610',
  },
  social: {
    linkedin: 'https://linkedin.com/company/zenco-systems',
    twitter: 'https://twitter.com/zencosystems',
    facebook: 'https://facebook.com/zencosystems',
    youtube: '',
  },
  openingHours: 'Mon–Fri: 8:00 AM – 5:00 PM | Sat: 9:00 AM – 1:00 PM',
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.808!2d36.8219!3d-1.2921!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMTcnMzEuNiJTIDM2wrA0OSczMS42IkU!5e0!3m2!1sen!2ske!4v1234567890',
} as const

export const BRAND = {
  primary: '#0C094D',
  accent: '#F26C0C',
  dark: '#0A0920',
} as const

export const PRODUCT_CATEGORIES = [
  { name: 'Water Treatment', slug: 'water-treatment', icon: 'Droplets' },
  { name: 'Solvents & Thinners', slug: 'solvents-thinners', icon: 'FlaskConical' },
  { name: 'Cleaning & Disinfection', slug: 'cleaning-disinfection', icon: 'Sparkles' },
  { name: 'Paints & Coatings', slug: 'paints-coatings', icon: 'Paintbrush' },
  { name: 'Agricultural Chemicals', slug: 'agricultural-chemicals', icon: 'Sprout' },
  { name: 'Coolants & Thermoregulation', slug: 'coolants-thermoregulation', icon: 'Thermometer' },
  { name: 'Preservation Chemicals', slug: 'preservation-chemicals', icon: 'Shield' },
  { name: 'Pharma & Cosmetics', slug: 'pharmaceuticals-cosmetics', icon: 'Pill' },
] as const

export const INDUSTRIES = [
  { name: 'Manufacturing', slug: 'manufacturing', icon: 'Factory' },
  { name: 'Water Treatment', slug: 'water-treatment', icon: 'Droplets' },
  { name: 'Food Processing', slug: 'food-processing', icon: 'UtensilsCrossed' },
  { name: 'Pharmaceuticals', slug: 'pharmaceuticals', icon: 'Pill' },
  { name: 'Agriculture', slug: 'agriculture', icon: 'Sprout' },
  { name: 'Paints & Coatings', slug: 'paints-coatings', icon: 'Paintbrush' },
  { name: 'Textiles', slug: 'textiles', icon: 'Shirt' },
  { name: 'Oil & Gas', slug: 'oil-gas', icon: 'Zap' },
] as const

export const COMPANY_STATS = [
  { value: '500+', label: 'Products Available', icon: 'Package' },
  { value: '15+', label: 'Years of Experience', icon: 'Calendar' },
  { value: '1000+', label: 'Happy Clients', icon: 'Users' },
  { value: '8', label: 'East African Countries', icon: 'Globe' },
] as const

export const CERTIFICATIONS = [
  'ISO 9001:2015',
  'Kenya Bureau of Standards (KEBS)',
  'NEMA Approved',
  'Pharmacy & Poisons Board',
] as const

export const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'product', label: 'Product Inquiry' },
  { value: 'quote', label: 'Request a Quote' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'technical', label: 'Technical Support' },
] as const

export const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  in_stock:    { label: 'In Stock',        color: 'text-green-600 bg-green-50' },
  limited:     { label: 'Limited Stock',   color: 'text-amber-600 bg-amber-50' },
  out_of_stock:{ label: 'Out of Stock',    color: 'text-red-600 bg-red-50' },
  on_order:    { label: 'Available on Order', color: 'text-blue-600 bg-blue-50' },
}

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  {
    label: 'Products',
    href: '/products',
    hasMega: true,
  },
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Chemical Solutions', href: '/services/chemical-solutions' },
      { label: 'Industrial Systems', href: '/services/industrial-systems' },
      { label: 'Consultation', href: '/services/consultation' },
      { label: 'Technical Support', href: '/services/technical-support' },
    ],
  },
  {
    label: 'Industries',
    href: '/industries',
    children: [
      { label: 'Manufacturing', href: '/industries/manufacturing' },
      { label: 'Water Treatment', href: '/industries/water-treatment' },
      { label: 'Food Processing', href: '/industries/food-processing' },
      { label: 'Pharmaceuticals', href: '/industries/pharmaceuticals' },
      { label: 'Agriculture', href: '/industries/agriculture' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const
