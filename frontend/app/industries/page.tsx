import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Factory, Droplets, UtensilsCrossed, Pill, Sprout, Paintbrush, Shirt, Zap, CheckCircle } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { INDUSTRY_PAGES } from '@/lib/navigation-content'
import { generatePageMetadata, breadcrumbSchema } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: `Target Industrial Sectors & Chemical Solutions`,
  description: `Find chemical products and engineering solutions tailored for heavy manufacturing, water treatment plants, food processing, agriculture, and hospitality in ${SITE_CONFIG.serviceArea}.`,
  path: '/industries',
  keywords: [
    'chemical solutions by industry',
    'manufacturing raw materials Kenya',
    'water treatment solutions',
    'food processing sanitizers',
    'agricultural fertilizer ingredients',
  ],
})

const iconBySlug = {
  manufacturing: Factory,
  'water-treatment': Droplets,
  'food-processing': UtensilsCrossed,
  agriculture: Sprout,
  hospitality: Shirt,
  healthcare: Pill,
  construction: Zap,
  pharmaceuticals: Pill,
  'paints-coatings': Paintbrush,
} as const

const industries = INDUSTRY_PAGES.map(industry => ({
  ...industry,
  desc: industry.description,
  icon: iconBySlug[industry.slug as keyof typeof iconBySlug] || Factory,
}))

export default function IndustriesPage() {
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Industries', href: '/industries' },
  ]

  return (
    <div className="min-h-screen bg-surface py-12">
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(breadcrumbs)),
        }}
      />
      <div className="container-xl px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-tag">Target Sectors</span>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-3">Industries We Serve</h1>
          <p className="text-gray-500 leading-relaxed">
            {SITE_CONFIG.name} supplies raw chemical solutions and engineering support customized to meet the strict quality benchmarks of diverse regional sectors.
          </p>
        </div>

        {/* Industries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {industries.map((ind, idx) => {
            const Icon = ind.icon
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-gray-100 p-8 shadow-card hover:shadow-card-hover hover:border-accent/15 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:bg-accent/10 group-hover:text-accent transition-colors duration-300">
                    <Icon size={22} />
                  </div>
                  <h2 className="text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                    {ind.title}
                  </h2>
                  <p className="text-accent text-xs font-semibold uppercase tracking-wider mb-4">{ind.tagline}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-6">{ind.desc}</p>
                  
                  {/* Solutions list */}
                  <div className="space-y-2 border-t border-gray-50 pt-4 mb-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Core Solutions supplied:</p>
                    <ul className="grid grid-cols-1 gap-1.5">
                      {ind.solutions.map((sol, sIdx) => (
                        <li key={sIdx} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle size={12} className="text-accent flex-shrink-0" />
                          <span>{sol}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href={`/industries/${ind.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:text-accent transition-colors"
                >
                  View Industry Solutions
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
