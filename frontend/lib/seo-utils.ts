/**
 * SEO & Internal Linking Utilities
 */

interface LinkSuggestion {
  text: string
  href: string
}

/**
 * Maps unstructured text suggestions to logical internal routes.
 * This maximizes the value of internal link equity (PR flow).
 */
export function mapSuggestionToRoute(suggestion: string): LinkSuggestion {
  const text = suggestion.trim()
  const lower = text.toLowerCase()

  // 1. Categories
  if (lower.includes('solvent') || lower.includes('thinner') || lower.includes('acetone') || lower.includes('alcohol')) {
    return { text, href: '/products?category=solvents-thinners' }
  }
  if (lower.includes('water') || lower.includes('coagulant') || lower.includes('flocculant') || lower.includes('chlorine') || lower.includes('treatment')) {
    return { text, href: '/products?category=water-treatment' }
  }
  if (lower.includes('clean') || lower.includes('detergent') || lower.includes('disinfect') || lower.includes('soap') || lower.includes('sanitiz')) {
    return { text, href: '/products?category=cleaning-disinfection' }
  }
  if (lower.includes('paint') || lower.includes('coat') || lower.includes('resin') || lower.includes('pigment')) {
    return { text, href: '/products?category=paints-coatings' }
  }

  // 2. Services
  if (lower.includes('bulk logistics') || lower.includes('transport') || lower.includes('delivery')) {
    return { text, href: '/services/bulk-logistics' }
  }
  if (lower.includes('custom formulation') || lower.includes('custom blend') || lower.includes('tailored concentration')) {
    return { text, href: '/services/custom-formulations' }
  }
  if (lower.includes('audit') || lower.includes('safety training') || lower.includes('storage review')) {
    return { text, href: '/services/onsite-audits' }
  }
  if (lower.includes('laboratory') || lower.includes('testing') || lower.includes('technical support')) {
    return { text, href: '/services/technical-support' }
  }
  if (lower.includes('service')) {
    return { text, href: '/services' }
  }

  // 3. Industries
  if (lower.includes('manufactur') || lower.includes('heavy industry') || lower.includes('factory')) {
    return { text, href: '/industries/manufacturing' }
  }
  if (lower.includes('food') || lower.includes('processing') || lower.includes('dairy') || lower.includes('beverage')) {
    return { text, href: '/industries/food-processing' }
  }
  if (lower.includes('agricult') || lower.includes('farm') || lower.includes('crop') || lower.includes('fertilizer')) {
    return { text, href: '/industries/agriculture' }
  }
  if (lower.includes('hospitality') || lower.includes('hotel') || lower.includes('laundry')) {
    return { text, href: '/industries/hospitality' }
  }
  if (lower.includes('health') || lower.includes('clinic') || lower.includes('hospital')) {
    return { text, href: '/industries/healthcare' }
  }
  if (lower.includes('pharmaceutical') || lower.includes('cosmetic')) {
    return { text, href: '/industries/pharmaceuticals' }
  }
  if (lower.includes('industry') || lower.includes('sector')) {
    return { text, href: '/industries' }
  }

  // 4. Static Pages
  if (lower.includes('about') || lower.includes('mission') || lower.includes('company') || lower.includes('quality')) {
    return { text, href: '/about' }
  }
  if (lower.includes('contact') || lower.includes('quote') || lower.includes('inquir') || lower.includes('sales') || lower.includes('call') || lower.includes('email')) {
    return { text, href: '/contact' }
  }
  if (lower.includes('faq') || lower.includes('question')) {
    return { text, href: '/faqs' }
  }
  if (lower.includes('blog') || lower.includes('article') || lower.includes('news') || lower.includes('insight')) {
    return { text, href: '/blog' }
  }

  // 5. Fallback Search
  return { text, href: `/products?search=${encodeURIComponent(text)}` }
}
