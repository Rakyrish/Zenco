'use client'

import Link from 'next/link'
import { ArrowRight, Settings, Truck, HelpCircle, HardHat, ShieldCheck, CheckCircle } from 'lucide-react'

const services = [
  {
    icon: Truck,
    title: 'Bulk Chemical Transport & Logistics',
    tagline: 'Safe, Compliant, and Timely Delivery Across East Africa',
    desc: 'Zenco Systems owns and operates a specialized logistics fleet optimized for bulk liquids, hazardous chemicals, and specialized powders. All vehicles are NEMA approved and driven by ADR-certified chemical handling logistics professionals.',
    features: [
      'ADR-compliant tanker configurations.',
      'GPS real-time shipment route tracking.',
      'Customs clearance handling for regional transit (Uganda, Tanzania, Rwanda).',
      'Emergency response protocols in coordination with local safety councils.',
    ],
  },
  {
    icon: Settings,
    title: 'Custom blending & Formulations',
    tagline: 'Tailored Densities, Concentrations, and Chemical Mixes',
    desc: 'Our modern in-house chemical formulation facility allows chemical engineers to blend products to exact client specifications. We assist with active ingredient concentration ratios, solvent blends, and color additives.',
    features: [
      'Viscosity and pH adjustments to client limits.',
      'Standard batch analysis certificates (CoA) provided.',
      'Flexible packaging solutions: IBCs, 200L drums, or tanker loads.',
      'Confidentiality and IP protection for custom formulations.',
    ],
  },
  {
    icon: HardHat,
    title: 'Safety Compliance & Audits',
    tagline: 'Facility Preparedness, NEMA Compliance, and Employee Training',
    desc: 'Protecting your workforce and environment is paramount. Zenco Systems chemical safety experts provide onsite storage audits, compatibility charts, spill management advice, and custom chemical handler certification courses.',
    features: [
      'NEMA and OSH safety standard compliance evaluations.',
      'Comprehensive MSDS sheets database updates.',
      'Emergency spill-kit training & safety drills.',
      'Chemical segregation and compatibility reviews.',
    ],
  },
  {
    icon: HelpCircle,
    title: 'Quality Testing & Support',
    tagline: 'Analytical Verification and Laboratory Optimization',
    desc: 'Not sure why a formulation is underperforming? Our laboratory provides full testing services for chemical purity, dilution curves, stability studies, and contamination verification.',
    features: [
      'Fully equipped chemical testing laboratory.',
      'Dilution curve assessments for wastewater flocculants.',
      'Active content titration analysis.',
      'Corrosion and compatibility trials.',
    ],
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="container-xl px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-tag">Zenco Services</span>
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
