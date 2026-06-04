export const appConfig = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, ''),
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  phoneNumber: process.env.NEXT_PUBLIC_PHONE_NUMBER || '',
  companyEmail: process.env.NEXT_PUBLIC_COMPANY_EMAIL || '',
  googleMapsEmbedKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || '',
} as const
