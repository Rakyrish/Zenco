import { appConfig } from '@/lib/config'

// ─── Zenco Systems Constants ──────────────────────────────────────────────

export const SITE_CONFIG = {
  name: appConfig.companyName,
  division: appConfig.companyDivision,
  fullName: appConfig.companyFullName || [appConfig.companyName, appConfig.companyDivision].filter(Boolean).join(' - '),
  tagline: appConfig.companyTagline,
  description: appConfig.companyDescription,
  url: appConfig.siteUrl,
  apiUrl: appConfig.apiUrl,
  email: appConfig.companyEmail,
  phone: appConfig.phoneNumber,
  whatsapp: appConfig.whatsappNumber,
  address: {
    street: appConfig.streetAddress,
    city: appConfig.city,
    country: appConfig.country,
    postalCode: appConfig.postalCode,
  },
  social: {
    linkedin: appConfig.linkedinUrl,
    instagram: appConfig.instagramUrl,
    facebook: appConfig.facebookUrl,
    tiktok: appConfig.tiktokUrl,
    twitter: appConfig.twitterUrl,

  },
  openingHours: appConfig.openingHours,
  serviceArea: appConfig.serviceArea,
  locale: appConfig.locale,
  timeZone: appConfig.timeZone,
  currency: appConfig.currency,
  acceptedCurrencies: appConfig.acceptedCurrencies,
  coordinates: {
    latitude: appConfig.latitude,
    longitude: appConfig.longitude,
  },
  twitterHandle: appConfig.twitterHandle,
  defaultKeywords: appConfig.defaultKeywords
    .split(',')
    .map(keyword => keyword.trim())
    .filter(Boolean),
  mapEmbed: appConfig.googleMapsEmbedKey && appConfig.googleMapsPlaceQuery
    ? `https://www.google.com/maps/embed/v1/place?key=${appConfig.googleMapsEmbedKey}&q=${encodeURIComponent(appConfig.googleMapsPlaceQuery)}`
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
  'Aware sourcing standards',
  'Safety data sheet documentation',
] as const



export const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'product', label: 'Product Inquiry' },
  { value: 'quote', label: 'Request a Quote' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'technical', label: 'Technical Support' },
] as const

export const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: 'text-green-600 ring-1 ring-green-200' },
  limited: { label: 'Limited Stock', color: 'text-amber-600 bg-amber-50' },
  out_of_stock: { label: 'Out of Stock', color: 'text-red-600 ring-1 ring-red-200' },
  on_order: { label: 'Available on Order', color: 'text-blue-600 bg-blue-50' },
}

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  {
    label: 'Products',
    href: '/products',
    hasMega: true,
  },
  // {
  //   label: 'Services',
  //   href: '/services',
  //   children: [
  //     { label: 'Water Treatment', href: '/services/water-treatment' },
  //     { label: 'Industrial Cleaning', href: '/services/industrial-cleaning' },
  //     { label: 'Laboratory Solutions', href: '/services/laboratory-solutions' },
  //     { label: 'Safety Products', href: '/services/safety-products' },
  //     { label: 'Chemical Supply', href: '/services/chemical-supply' },
  //   ],
  // },
  // {
  //   label: 'Industries',
  //   href: '/industries',
  //   children: [
  //     { label: 'Manufacturing', href: '/industries/manufacturing' },
  //     { label: 'Food Processing', href: '/industries/food-processing' },
  //     { label: 'Water Treatment', href: '/industries/water-treatment' },
  //     { label: 'Agriculture', href: '/industries/agriculture' },
  //     { label: 'Hospitality', href: '/industries/hospitality' },
  //     { label: 'Healthcare', href: '/industries/healthcare' },
  //     { label: 'Construction', href: '/industries/construction' },
  //   ],
  // },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const
