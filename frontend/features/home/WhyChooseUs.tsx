'use client'

import { ShieldCheck, Truck, Sparkles, HeartHandshake, Award, Activity } from 'lucide-react'

const features = [
  {
    icon: ShieldCheck,
    title: 'Strict Quality Compliance',
    desc: 'All our products are strictly tested, and international safety standards.',
  },
  {
    icon: Sparkles,
    title: 'High Chemical Purity',
    desc: 'We source raw materials directly from premium global manufacturers to guarantee optimal purity profiles.',
  },
  {
    icon: Truck,
    title: 'Reliable Regional Delivery',
    desc: 'Equipped with a specialized bulk tanker fleet for safe chemical transport across East Africa.',
  },
 
  {
    icon: Award,
    title: 'Technical Consultation',
    desc: 'Expert chemical engineers assist with product formulation, dilution calculations, and application trials.',
  },
 
]

export default function WhyChooseUs() {
  return (
    <section className="section bg-gradient-hero relative overflow-hidden text-white pattern-dots">
      {/* Glow elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container-xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-tag text-accent">Value Proposition</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Setting the Benchmark in Chemical Distribution
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Zenco Systems partners with industrial developers to achieve maximum efficiency, safe storage, and precise formulations.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, i) => {
            const Icon = feat.icon
            return (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent mb-5 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{feat.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
