'use client'

import Link from 'next/link'
import { ArrowRight, Factory, Droplets, UtensilsCrossed, Pill, Sprout, Paintbrush, Shirt, Zap, CheckCircle } from 'lucide-react'

const industries = [
  {
    icon: Factory,
    title: 'Manufacturing & Heavy Industry',
    tagline: 'Basic raw materials, solvents, acids, and process chemicals.',
    desc: 'Supporting general manufacturing processes with volume supplies of essential raw materials, specialized solvents, reaction acids, pH buffers, and process catalysts.',
    solutions: ['Sulfuric Acid supply', 'Industrial solvents', 'Diluent blending', 'Effluent management'],
  },
  {
    icon: Droplets,
    title: 'Water Treatment & Purification',
    tagline: 'Municipal filtration, cooling systems, and effluent treatment.',
    desc: 'Delivering flocculants, coagulants, chlorination compounds, and scaling inhibitors to municipalities, water boards, power systems, and manufacturing sites.',
    solutions: ['Aluminum Sulfate', 'Sodium Hypochlorite', 'Polyelectrolytes', 'Descaling agents'],
  },
  {
    icon: UtensilsCrossed,
    title: 'Food Processing & Dairies',
    tagline: 'Food-grade sanitizers, additives, and CIP chemicals.',
    desc: 'Securing food-grade chemical sanitizers, preservative agents, clean-in-place (CIP) formulations, and chemical additives matching international food-safety norms.',
    solutions: ['Nitric Acid CIP grade', 'Caustic Soda micropearls', 'Hydrogen Peroxide food-grade', 'Preservative agents'],
  },
  {
    icon: Pill,
    title: 'Pharmaceuticals & Cosmetics',
    tagline: 'High-purity solvents, base oils, and raw ingredients.',
    desc: 'Supplying USP/BP grade inputs, active cosmetic bases, high-purity isopropyl alcohol, mineral oils, and stabilizers to regional pharma and cosmetic manufacturers.',
    solutions: ['Isopropyl Alcohol 99.9%', 'Glycerin USP grade', 'Propylene Glycol USP', 'Preservatives & Emulsifiers'],
  },
  {
    icon: Sprout,
    title: 'Agriculture & Horticulture',
    tagline: 'Fertilizer raw materials, pest control, and adjuvants.',
    desc: 'Delivering chemical bases for fertilizer production, foliar nutrients, wetting agents, greenhouse sanitation inputs, and agricultural spray adjuvants.',
    solutions: ['Phosphoric Acid foliar', 'Potassium Nitrate', 'Wetting agents', 'Greenhouse sanitizers'],
  },
  {
    icon: Paintbrush,
    title: 'Paints, Inks & Coatings',
    tagline: 'Solvents, binders, titanium dioxide, and thickeners.',
    desc: 'Supplying paint manufacturers with key solvents (Toluene, Ethyl Acetate, Xylene), organic binders, rheology modifiers, and pigment extenders.',
    solutions: ['Ethyl Acetate solvent', 'Xylene standard', 'Rheology thickeners', 'Antifoam agents'],
  },
]

export default function IndustriesPage() {
  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="container-xl px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-tag">Target Sectors</span>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-3">Industries We Serve</h1>
          <p className="text-gray-500 leading-relaxed">
            Zenco Systems Ltd supplies raw chemical solutions and engineering support customized to meet the strict quality benchmarks of diverse regional sectors.
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
                  href={`/contact?type=quote&industry=${encodeURIComponent(ind.title)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:text-accent transition-colors"
                >
                  Consult an Expert
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
