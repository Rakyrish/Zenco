import { appConfig } from '@/lib/config'

// ─── Zenco Systems Constants ──────────────────────────────────────────────

export const SITE_CONFIG = {
  name: 'Zenco Systems Ltd',
  division: 'Chemical Division',
  fullName: 'Zenco Systems Ltd – Chemical Division',
  tagline: 'Industrial Chemical Solutions for East Africa',
  description:
    'Zenco Systems Ltd is a trusted supplier of industrial chemicals, water treatment chemicals, solvents, and specialty chemicals across Kenya and East Africa.',
  url: appConfig.siteUrl,
  apiUrl: appConfig.apiUrl,
  email: appConfig.companyEmail,
  phone: appConfig.phoneNumber,
  whatsapp: appConfig.whatsappNumber,
  address: {
    street: 'Industrial Area, Enterprise Road, KCB Building',
    city: 'Nairobi',
    country: 'Kenya',
    postalCode: '00400',
  },
  social: {
    linkedin: 'https://www.linkedin.com/in/zenco-systems-ltd-368245366',
    instagram: 'https://www.instagram.com/zencosystemsltd?igsh=aHJoZjIzNjF1czQy',
    facebook: 'https://www.facebook.com/profile.php?id=61584593930779',
    tiktok: 'https://www.tiktok.com/@zencosystemsltd?_r=1&_t=ZS-96a0tdIdXiK',
    twitter: '',

  },
  openingHours: 'Mon–Fri: 8:00 AM – 5:00 PM | Sat: 9:00 AM – 1:00 PM',
  mapEmbed: appConfig.googleMapsEmbedKey
    ? `https://www.google.com/maps/embed/v1/place?key=${appConfig.googleMapsEmbedKey}&q=Zenco%20Systems%20Ltd%20Nairobi`
    : '',
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
  { value: '1000+', label: 'Products Available', icon: 'Package' },
  { value: '500+', label: 'Happy Clients', icon: 'Users' },
] as const

export const CERTIFICATIONS = [
  'KEBS Compliance',
  'ISO 9001:2015 Supplier Standards',
  'GMP-Aligned Handling',
  'MSDS Documentation',
] as const


export const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'product', label: 'Product Inquiry' },
  { value: 'quote', label: 'Request a Quote' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'technical', label: 'Technical Support' },
] as const

export const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: 'text-green-600 bg-green-50' },
  limited: { label: 'Limited Stock', color: 'text-amber-600 bg-amber-50' },
  out_of_stock: { label: 'Out of Stock', color: 'text-red-600 bg-red-50' },
  on_order: { label: 'Available on Order', color: 'text-blue-600 bg-blue-50' },
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
