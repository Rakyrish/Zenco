'use client'

import { Package, Calendar, Users, Globe } from 'lucide-react'
import { COMPANY_STATS } from '@/lib/constants'

const iconMap: Record<string, any> = {
  Package: Package,
  Calendar: Calendar,
  Users: Users,
  Globe: Globe,
}

export default function StatsSection() {
  return (
    <section className="bg-white py-12 border-b border-gray-100 shadow-sm relative z-20 -mt-10 max-w-6xl mx-auto rounded-2xl px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {COMPANY_STATS.map((stat, i) => {
          const Icon = iconMap[stat.icon] || Package
          return (
            <div key={i} className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left group">
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-accent/15 group-hover:text-accent transition-all duration-300">
                <Icon size={24} className="transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-display font-extrabold text-primary group-hover:text-accent transition-colors">
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-gray-500 font-medium">
                  {stat.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
