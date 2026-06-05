export type ServicePage = {
  slug: string
  title: string
  tagline: string
  description: string
  features: string[]
  relatedProductSearch: string
}

export type IndustryPage = {
  slug: string
  title: string
  tagline: string
  description: string
  solutions: string[]
  relatedProductSearch: string
}

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: 'bulk-logistics',
    title: 'Bulk Chemical Transport & Logistics',
    tagline: 'Safe, compliant, and timely delivery for industrial chemical buyers.',
    description: 'Specialized logistics support for bulk liquids, powders, hazardous materials, and recurring industrial supply programs.',
    features: ['Bulk delivery coordination', 'Packaging and dispatch planning', 'Regional route support', 'Sales-led delivery confirmation'],
    relatedProductSearch: 'bulk chemical supply',
  },
  {
    slug: 'custom-formulations',
    title: 'Custom Chemical Formulations',
    tagline: 'Tailored blends, concentrations, and chemical mixes for operating teams.',
    description: 'Formulation support for buyers who need custom dilution, concentration matching, or application-specific blends.',
    features: ['Custom blend scoping', 'Dilution guidance', 'Packaging recommendations', 'Technical consultation'],
    relatedProductSearch: 'formulation chemicals',
  },
  {
    slug: 'onsite-audits',
    title: 'On-Site Storage Audit & Training',
    tagline: 'Storage, handling, and safety guidance for chemical facilities.',
    description: 'Practical support for safer chemical storage, handling workflows, compatibility reviews, and team training.',
    features: ['Storage review', 'Handling guidance', 'Safety training', 'Compatibility checks'],
    relatedProductSearch: 'safety chemicals',
  },
  {
    slug: 'technical-support',
    title: 'Technical Support & Laboratory Testing',
    tagline: 'Product selection and technical support for industrial applications.',
    description: 'Technical consultation for product performance, application matching, quality concerns, and product alternatives.',
    features: ['Application guidance', 'Product comparison', 'Troubleshooting support', 'Alternative recommendations'],
    relatedProductSearch: 'laboratory chemicals',
  },
  {
    slug: 'water-treatment',
    title: 'Water Treatment Solutions',
    tagline: 'Chemical supply and guidance for treatment, sanitation, and process water.',
    description: 'Support for water treatment chemical selection, dosing discussions, availability checks, and quotation requests.',
    features: ['Coagulant guidance', 'Disinfection products', 'pH adjustment support', 'Bulk quotation support'],
    relatedProductSearch: 'water treatment',
  },
  {
    slug: 'industrial-cleaning',
    title: 'Industrial Cleaning Solutions',
    tagline: 'Cleaning, degreasing, and disinfection chemicals for commercial operations.',
    description: 'Product guidance for industrial cleaning, sanitation, surface preparation, and maintenance workflows.',
    features: ['Degreaser selection', 'Disinfection support', 'Solvent matching', 'Packaging advice'],
    relatedProductSearch: 'cleaning',
  },
  {
    slug: 'laboratory-solutions',
    title: 'Laboratory Solutions',
    tagline: 'Laboratory chemicals, reagents, and technical procurement support.',
    description: 'Assistance sourcing laboratory chemicals and matching buyers to available catalog products or procurement support.',
    features: ['Reagent sourcing', 'Specification review', 'Availability checks', 'Quotation assistance'],
    relatedProductSearch: 'laboratory',
  },
  {
    slug: 'safety-products',
    title: 'Safety Products',
    tagline: 'Safety, handling, and procurement guidance for chemical operations.',
    description: 'Support for chemical handling safety needs, PPE procurement conversations, and product availability checks.',
    features: ['PPE guidance', 'Handling support', 'Safety documentation', 'Sales escalation'],
    relatedProductSearch: 'safety',
  },
  {
    slug: 'chemical-supply',
    title: 'Chemical Supply',
    tagline: 'Reliable industrial chemical sourcing and quotation support.',
    description: 'General product sourcing, availability checks, quotation assistance, and procurement support for industrial buyers.',
    features: ['Catalog matching', 'Availability checks', 'Bulk quotation support', 'Procurement assistance'],
    relatedProductSearch: 'industrial chemical',
  },
]

export const INDUSTRY_PAGES: IndustryPage[] = [
  {
    slug: 'manufacturing',
    title: 'Manufacturing & Heavy Industry',
    tagline: 'Basic raw materials, solvents, acids, and process chemicals.',
    description: 'Chemical supply support for manufacturing operations, maintenance teams, and industrial procurement departments.',
    solutions: ['Industrial solvents', 'Process chemicals', 'Cleaning inputs', 'Effluent management'],
    relatedProductSearch: 'manufacturing',
  },
  {
    slug: 'water-treatment',
    title: 'Water Treatment',
    tagline: 'Municipal filtration, cooling systems, and effluent treatment.',
    description: 'Products and technical guidance for treatment plants, utilities, commercial facilities, and industrial process water.',
    solutions: ['Coagulants', 'Disinfection chemicals', 'pH correction', 'Descaling agents'],
    relatedProductSearch: 'water treatment',
  },
  {
    slug: 'food-processing',
    title: 'Food Processing',
    tagline: 'Food-grade sanitizers, additives, and CIP chemicals.',
    description: 'Chemical procurement support for food processors, dairies, sanitation teams, and CIP workflows.',
    solutions: ['CIP chemicals', 'Sanitizers', 'Preservative inputs', 'Cleaning chemicals'],
    relatedProductSearch: 'food processing',
  },
  {
    slug: 'agriculture',
    title: 'Agriculture',
    tagline: 'Fertilizer raw materials, pest control, and adjuvants.',
    description: 'Chemical supply support for farms, horticulture, greenhouse operators, and agricultural distributors.',
    solutions: ['Fertilizer inputs', 'Foliar nutrients', 'Wetting agents', 'Greenhouse sanitation'],
    relatedProductSearch: 'agriculture',
  },
  {
    slug: 'hospitality',
    title: 'Hospitality',
    tagline: 'Cleaning, sanitation, laundry, and facility maintenance chemicals.',
    description: 'Product guidance for hotels, institutions, kitchens, laundries, and facility maintenance teams.',
    solutions: ['Disinfectants', 'Detergents', 'Degreasers', 'Laundry chemicals'],
    relatedProductSearch: 'cleaning',
  },
  {
    slug: 'healthcare',
    title: 'Healthcare',
    tagline: 'Sanitation, disinfection, and institutional chemical procurement.',
    description: 'Support for healthcare facilities seeking cleaning, disinfection, and compliant chemical handling guidance.',
    solutions: ['Disinfection chemicals', 'Surface cleaning', 'Safety guidance', 'Procurement support'],
    relatedProductSearch: 'disinfection',
  },
  {
    slug: 'construction',
    title: 'Construction',
    tagline: 'Concrete, coatings, cleaning, and site-support chemicals.',
    description: 'Chemical supply support for construction sites, contractors, concrete works, and coatings applications.',
    solutions: ['Concrete additives', 'Coatings inputs', 'Cleaning chemicals', 'Dust suppression'],
    relatedProductSearch: 'construction',
  },
  {
    slug: 'pharmaceuticals',
    title: 'Pharmaceuticals & Cosmetics',
    tagline: 'High-purity solvents, base oils, and raw ingredients.',
    description: 'Procurement support for pharma, cosmetic, and personal-care manufacturers seeking reliable chemical inputs.',
    solutions: ['Solvents', 'Glycerin', 'Propylene glycol', 'Preservatives'],
    relatedProductSearch: 'pharmaceutical',
  },
  {
    slug: 'paints-coatings',
    title: 'Paints, Inks & Coatings',
    tagline: 'Solvents, binders, pigments, and thickeners.',
    description: 'Product guidance for coatings manufacturers, paint formulators, and industrial finishing teams.',
    solutions: ['Solvents', 'Binders', 'Rheology modifiers', 'Antifoam agents'],
    relatedProductSearch: 'coatings',
  },
]

export function serviceBySlug(slug: string) {
  return SERVICE_PAGES.find(service => service.slug === slug)
}

export function industryBySlug(slug: string) {
  return INDUSTRY_PAGES.find(industry => industry.slug === slug)
}
