'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck, Award, Globe, Beaker } from 'lucide-react'



const STATS = [
  { value: '1000+', sub: 'Products', color: 'text-accent' },
  { value: '99.9%', sub: 'Purity', color: 'text-white' },
  { value: '500+', sub: 'Client', color: 'text-accent' },
]

export default function HeroSection() {
  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-gradient-hero py-24 px-4 pattern-dots"
      aria-label="Zenico Chemicals hero banner"
    >
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-128 h-128 bg-primary-light/40 rounded-full blur-[160px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '1s' }} />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 pointer-events-none pattern-grid opacity-20" />

      <div className="container-xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* ── Left Content ── */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/25 bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
            Premier Chemical Distributor — East Africa
          </div>

          {/* Main headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-display-lg text-white leading-tight tracking-tight animate-fade-up animate-delay-100">
            Enterprise-Grade Chemical Solutions for{' '}
            <span className="text-accent underline decoration-accent/30 decoration-wavy underline-offset-8">
              East Africa
            </span>
          </h1>

          <p className="text-lg text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-up animate-delay-200">
            Zenco Systems delivers high-purity industrial chemicals, laboratory reagents,
            water treatment compounds, and bulk specialty chemicals across Kenya and East Africa —
            with rigorous quality guarantees and rapid logistics.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up animate-delay-300">
            <Link href="/products" className="btn-primary btn-lg w-full sm:w-auto">
              Explore Chemical Catalog
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/contact?type=quote"
              className="btn btn-lg w-full sm:w-auto bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm"
            >
              Request a Quote
            </Link>
          </div>

     
        </div>

        {/* ── Right Visual Panel ── */}
        <div className="lg:col-span-5 flex justify-center items-center animate-fade-up animate-delay-200">
          <div className="relative w-full max-w-md">
            {/* Main glass card */}
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-8 shadow-2xl overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-accent text-xs font-bold uppercase tracking-widest mb-1">Chemical Profile</p>
                  <h3 className="text-white font-display text-xl font-bold">Zenco Premium Grade</h3>
                </div>
                <span className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-xl">⚗</span>
              </div>

              {/* Rotating chemical visual */}
              <div className="relative flex justify-center items-center my-4 h-44">
                <div className="absolute w-40 h-40 border border-accent rounded-full animate-spin-slow" />
                <div className="absolute w-28 h-28 border border-whiterounded-full border-dashed animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '12s' }} />
                <div className="absolute w-16 h-16 rounded-full bg-accent/20 blur-lg animate-pulse-glow" />
                <div className="relative text-center z-10">
                  <span className="font-display text-3xl font-bold text-white">99.9%</span>
                  <p className="text-[10px] text-accent/80 uppercase tracking-widest font-bold mt-1">Purity Assured</p>
                </div>
                {/* Orbiting dot */}
                <div className="absolute w-40 h-40 rounded-full animate-spin-slow">
                  <div className="absolute top-0 left-1/2 -translate-x-1/4 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent shadow-md shadow-accent" />
                </div>
              </div>

              {/* Bottom stats */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/8">
                {STATS.map(s => (
                  <div key={s.sub} className="text-center">
                    <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating tags */}
            <div className="absolute -top-4 -left-4 bg-accent/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg animate-float">
               Approved
            </div>
            <div className="absolute -bottom-4 -right-4 bg-primary/90 backdrop-blur-sm text-accent text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border border-accent/30 shadow-lg animate-float" style={{ animationDelay: '1.2s' }}>
              Bulk Supply Ready
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-fade-in">
        <span className="text-[10px] uppercase text-accent tracking-widest font-semibold">Explore below</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </section>
  )
}
