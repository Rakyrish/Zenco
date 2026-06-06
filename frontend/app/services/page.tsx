import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Settings, Truck, HelpCircle, HardHat, ShieldCheck, CheckCircle } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { SERVICE_PAGES } from '@/lib/navigation-content'
import { generatePageMetadata, breadcrumbSchema } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: `Value-Added Chemical Services & Technical Support`,
  description: `From custom formulations and storage safety audits to bulk logistics and laboratory analysis, explore Zenco Systems' professional services for manufacturing and utility teams.`,
  path: '/services',
  keywords: [
    'custom chemical formulation service',
    'chemical storage audit',
    'bulk logistics and delivery Kenya',
    'water treatment dosing support',
    'chemical analysis and testing',
  ],
})

const iconBySlug = {
  'bulk-logistics': Truck,
  'custom-formulations': Settings,
  'onsite-audits': HardHat,
  'technical-support': HelpCircle,
} as const

const services = SERVICE_PAGES.slice(0, 4).map(service => ({
  ...service,
  desc: service.description,
  icon: iconBySlug[service.slug as keyof typeof iconBySlug] || HelpCircle,
}))

export default function ServicesPage() {
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
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
          <span className="section-tag">{SITE_CONFIG.name} Services</span>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-3">Value-Added Solutions</h1>
          <p className="text-gray-500 leading-relaxed">
            Beyond distribution, we provide full technical support, compliance expertise, and high-capacity logistics to streamline manufacturing setups.
          </p>
        </div>

        {/* Services List */}
        <div className="space-y-12 mb-16">
          {services.map((serv, idx) => {
            const Icon = serv.icon
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12 shadow-card grid grid-cols-1 lg:grid-cols-12 gap-8 items-start hover:border-accent/15 transition-all duration-300 group"
              >
                {/* Left info column */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors duration-300">
                    <Icon size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-primary group-hover:text-accent transition-colors">
                      {serv.title}
                    </h2>
                    <p className="text-accent text-xs font-semibold uppercase tracking-wider mt-1">{serv.tagline}</p>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{serv.desc}</p>
                  
                  <Link
                    href={`/contact?type=technical&service=${encodeURIComponent(serv.title)}`}
                    className="inline-flex items-center gap-2 btn-primary"
                  >
                    Request Technical Help
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href={`/services/${serv.slug}`}
                    className="ml-3 inline-flex items-center gap-2 rounded-md border border-zinc-200 px-4 py-3 text-sm font-black text-primary hover:border-accent hover:text-accent"
                  >
                    View Service Details
                    <ArrowRight size={16} />
                  </Link>
                </div>

                {/* Right features column */}
                <div className="lg:col-span-5 bg-surface rounded-2xl p-6 border border-gray-50">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-accent" />
                    Key Deliverables
                  </h3>
                  <ul className="space-y-3">
                    {serv.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                        <CheckCircle size={14} className="text-accent flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
