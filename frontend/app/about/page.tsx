import type { Metadata } from 'next'
import Link from 'next/link'
import { Award, ShieldCheck, HeartHandshake, Eye, Target, Users, Map, CheckCircle } from 'lucide-react'
import { CERTIFICATIONS, SITE_CONFIG } from '@/lib/constants'
import { generatePageMetadata, breadcrumbSchema } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: `About Us | ${SITE_CONFIG.fullName}`,
  description: `Learn about ${SITE_CONFIG.fullName}, a leading chemical supplier in Kenya and East Africa. Our mission, quality controls, and compliance standards.`,
  path: '/about',
  keywords: ['about zenco systems', 'chemical supplier Kenya', 'industrial chemical supply East Africa', 'chemical quality control'],
})

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
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
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-tag">About {SITE_CONFIG.name}</span>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-3">{SITE_CONFIG.division} {SITE_CONFIG.serviceArea}</h1>
          <p className="text-gray-500 leading-relaxed">
            {SITE_CONFIG.name} is a premium industrial partner, distributing high-grade raw chemicals and technical solutions for manufacturing systems.
          </p>
        </div>

        {/* Vision & Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-card flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              <Target size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary mb-2">Our Mission</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                To source, secure, and deliver the highest purity chemical materials to industries across {SITE_CONFIG.serviceArea}, fostering regional growth through standard-compliance and supply reliability.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-card flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              <Eye size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary mb-2">Our Vision</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                To be the reference point for industrial safety, eco-conscious distribution, and technical formulation innovation in the {SITE_CONFIG.serviceArea} chemical supply sector.
              </p>
            </div>
          </div>
        </div>

        {/* Experience details & certifications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Uncompromising Quality Controls</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              At {SITE_CONFIG.name}, quality control starts at the source. We establish long-term distribution partnerships only with manufacturers.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Once chemicals arrive at our {SITE_CONFIG.address.city} hub, they undergo standardized chemical analysis (density, pH, active compound percentage, viscosity) within our quality control laboratory before customer dispatch.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-accent" />
                <span className="text-sm font-semibold text-primary">Expert Engineers</span>
              </div>
              <div className="flex items-center gap-2">
                <Map size={18} className="text-accent" />
                <span className="text-sm font-semibold text-primary">{SITE_CONFIG.serviceArea} Reach</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-gradient-hero rounded-3xl p-8 text-white pattern-dots border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/20 rounded-full blur-[80px]" />
            <h3 className="font-bold text-lg mb-6">Our Certifications & Compliance</h3>
            <div className="space-y-4">
              {CERTIFICATIONS.map(cert => (
                <div
                  key={cert}
                  className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm font-semibold">{cert}</span>
                  <CheckCircle size={16} className="text-accent" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-card">
          <h2 className="text-2xl font-bold text-primary text-center mb-8">Our Core Operating Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <ShieldCheck size={22} />
              </div>
              <h3 className="font-bold text-primary text-lg">Safety First</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Adhering strictly to international handling, transport, and safety standards for all volatile and hazardous raw chemical materials.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <HeartHandshake size={22} />
              </div>
              <h3 className="font-bold text-primary text-lg">Client Partnership</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Building multi-year relationships with manufacturing firms by securing consistent, year-round inventory levels to avoid supply-chain shocks.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <Award size={22} />
              </div>
              <h3 className="font-bold text-primary text-lg">Constant Integrity</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ensuring precise concentrations, honest weights, transparent pricing, and zero product dilution across our entire inventory.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
