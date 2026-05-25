function requiredPublicEnv(key: string, fallback = '') {
  return process.env[key] || fallback
}

export const appConfig = {
  siteUrl: requiredPublicEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, ''),
  apiUrl: requiredPublicEnv('NEXT_PUBLIC_API_URL', 'http://localhost:8000/api').replace(/\/$/, ''),
  whatsappNumber: requiredPublicEnv('NEXT_PUBLIC_WHATSAPP_NUMBER'),
  phoneNumber: requiredPublicEnv('NEXT_PUBLIC_PHONE_NUMBER'),
  companyEmail: requiredPublicEnv('NEXT_PUBLIC_COMPANY_EMAIL', 'info@zenithcoltd.com'),
  googleMapsEmbedKey: requiredPublicEnv('NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY'),
} as const

