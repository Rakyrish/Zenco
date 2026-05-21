'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck, Award, Zap } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-hero overflow-hidden py-24 px-4 pattern-dots">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-128 h-128 bg-primary-light/40 rounded-full blur-[160px] animate-pulse-glow animate-delay-300" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-transparent pattern-grid opacity-30 pointer-events-none" />

      <div className="container-xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-xs uppercase tracking-wider animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
            Leading Industrial Chemical Supplier
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-display-lg font-bold text-white leading-tight tracking-tight text-balance animate-fade-up animate-delay-100">
            Enterprise-Grade Chemical Solutions for <span className="text-accent underline decoration-accent/30 decoration-wavy underline-offset-8">East Africa</span>
          </h1>

          <p className="text-lg text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-up animate-delay-200">
            Zenco Systems Ltd supplies premium raw chemical materials, specialized water treatment, and tailor-made chemical solutions for manufacturing industries.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2 animate-fade-up animate-delay-300">
            <Link href="/products" className="btn-primary btn-lg w-full sm:w-auto">
              Explore Products
              <ArrowRight size={18} />
            </Link>
            <Link href="/contact?type=quote" className="btn-secondary btn-lg w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm">
              Request a Quote
            </Link>
          </div>

          {/* Bullet features */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 animate-fade-up animate-delay-400">
            <div className="flex items-center gap-2.5 text-white/90">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <ShieldCheck size={16} />
              </div>
              <span className="text-sm font-semibold">KEBS Certified</span>
            </div>
            <div className="flex items-center gap-2.5 text-white/90">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Award size={16} />
              </div>
              <span className="text-sm font-semibold">ISO 9001:2015</span>
            </div>
            <div className="flex items-center gap-2.5 text-white/90">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Zap size={16} />
              </div>
              <span className="text-sm font-semibold">Bulk Logistics</span>
            </div>
          </div>
        </div>

        {/* Right Graphic Panel (Glassmorphism & Stats card) */}
        <div className="lg:col-span-5 relative flex justify-center items-center animate-fade-up animate-delay-200">
          <div className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-white/5 to-white/15 border border-white/10 p-8 flex flex-col justify-between shadow-2xl backdrop-blur-md overflow-hidden group">
            {/* Visual element inside card */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors duration-500" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-accent text-xs font-bold uppercase tracking-widest">Premium Service</span>
                <h3 className="text-white text-xl font-bold mt-1">Zenco Quality Standards</h3>
              </div>
              <span className="text-2xl text-accent">⚗</span>
            </div>

            {/* Decorative Laboratory Graphic or similar using pure CSS */}
            <div className="my-8 flex justify-center items-center h-48 relative">
              <div className="absolute w-40 h-40 border border-white/10 rounded-full animate-spin-slow flex items-center justify-center">
                <div className="w-32 h-32 border border-accent/20 rounded-full border-dashed" />
              </div>
              <div className="absolute w-24 h-24 bg-gradient-radial from-accent/30 to-transparent rounded-full animate-pulse-glow" />
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-display font-extrabold text-white">99.9%</span>
                <span className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Purity Guaranteed</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex justify-between items-center text-white/80">
              <div>
                <p className="text-xs text-white/40 uppercase font-semibold">Deliveries</p>
                <p className="text-sm font-bold">24-48h Regionwide</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40 uppercase font-semibold">Support</p>
                <p className="text-sm font-bold">24/7 Dedicated Reps</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
