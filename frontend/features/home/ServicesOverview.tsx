'use client'

import Link from 'next/link'
import { ArrowRight, Settings, Truck, HelpCircle, HardHat } from 'lucide-react'
import { SERVICE_PAGES } from '@/lib/navigation-content'

const serviceIcons = {
  'bulk-logistics': Truck,
  'custom-formulations': Settings,
  'onsite-audits': HardHat,
  'technical-support': HelpCircle,
} as const

const services = SERVICE_PAGES.filter(service =>
  ['bulk-logistics', 'custom-formulations', 'onsite-audits', 'technical-support'].includes(service.slug)
).map(service => ({
  ...service,
  desc: service.description,
  href: `/services/${service.slug}`,
  icon: serviceIcons[service.slug as keyof typeof serviceIcons] || HelpCircle,
}))

export default function ServicesOverview() {
  return (
    <section className="section bg-white">
      <div className="container-xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-tag">Our Services</span>
          <h2 className="section-title">Value-Added Services for Industrial Success</h2>
          <p className="section-subtitle mt-2 mx-auto">
            Beyond chemical distribution, we provide engineering support, logistics capability, and safety training to ensure operational efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((serv, i) => {
            const Icon = serv.icon
            return (
              <div
                key={i}
                className="card border border-gray-100 p-8 flex flex-col md:flex-row gap-6 hover:shadow-card-hover hover:border-accent/10 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-accent/10 group-hover:text-accent transition-colors duration-300">
                  <Icon size={26} />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors mb-2">
                      {serv.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                      {serv.desc}
                    </p>
                  </div>
                  <Link
                    href={serv.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:text-accent transition-colors"
                  >
                    Learn More
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
