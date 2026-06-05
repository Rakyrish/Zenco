'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, Linkedin, Facebook, Instagram, ArrowRight, ChevronRight, MessageCircle } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { FaTiktok } from "react-icons/fa";
import Logo from '@/components/shared/Logo'
import { getCategories } from '@/lib/api'
import type { Category } from '@/types'
import { whatsappHref } from '@/components/products/product-helpers'

export default function Footer() {
  const year = new Date().getFullYear()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  return (
    <footer className="bg-[#08080c] text-white/70" aria-label="Site footer">
      {/* Newsletter Strip */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="container-xl px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-white font-bold text-xl mb-1">Stay Updated with Industry Insights</h2>
              <p className="text-sm text-white/60">
                Get the latest chemical industry news and product updates.
              </p>
            </div>
            <form
              className="flex w-full md:w-auto gap-2"
              onSubmit={e => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20
                           text-white placeholder:text-white/40 text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-white/15 transition-all"
                required
              />
              <button
                type="submit"
                className="btn bg-accent hover:bg-accent-500 text-white px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:shadow-glow-accent flex-shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Logo textClassName="text-white" />
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              {SITE_CONFIG.description}
            </p>

            {/* Contact */}
            <div className="space-y-3 mb-6">
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="flex items-center gap-3 text-sm hover:text-accent transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Phone size={14} className="text-accent" />
                </div>
                {SITE_CONFIG.phone}
              </a>
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="flex items-center gap-3 text-sm hover:text-accent transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Mail size={14} className="text-accent" />
                </div>
                {SITE_CONFIG.email}
              </a>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} className="text-accent" />
                </div>
                <span>
                  {SITE_CONFIG.address.street},<br />
                  {SITE_CONFIG.address.city}, {SITE_CONFIG.address.country}
                </span>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              {SITE_CONFIG.social.linkedin && (
                <a
                  href={SITE_CONFIG.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center hover:bg-accent hover:text-white transition-all"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={16} />
                </a>
              )}
              {SITE_CONFIG.social.facebook && (
                <a
                  href={SITE_CONFIG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center hover:bg-accent hover:text-white transition-all"
                  aria-label="Facebook"
                >
                  <Facebook size={16} />
                </a>
              )}
              {SITE_CONFIG.social.tiktok && (
                <a
                  href={SITE_CONFIG.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center hover:bg-accent hover:text-white transition-all"
                  aria-label="TikTok"
                >
                  <FaTiktok size={16} />
                </a>
              )}
              {SITE_CONFIG.social.instagram && (
                <a
                  href={SITE_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center hover:bg-accent hover:text-white transition-all"
                  aria-label="Instagram"
                >
                  <Instagram size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">
              Product Categories
            </h3>
            <ul className="space-y-2.5">
              {categories.slice(0, 8).map(cat => (
                <li key={cat.slug}>
                  <Link
                    href={`/products/category/${cat.slug}`}
                    className="flex items-center gap-2 text-sm hover:text-accent transition-colors group"
                  >
                    <ChevronRight
                      size={14}
                      className="text-accent/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                    />
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Products', href: '/products' },
                { label: 'Our Services', href: '/services' },
                { label: 'Industries Served', href: '/industries' },
                { label: 'Blog & Insights', href: '/blog' },
                { label: 'FAQs', href: '/faqs' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Request a Quote', href: '/contact?type=quote' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm hover:text-accent transition-colors group"
                  >
                    <ChevronRight
                      size={14}
                      className="text-accent/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Certifications */}
          <div>
            <div className=" bg-accent/10 border border-accent/20 rounded-xl p-4">
              <p className="text-white font-semibold text-sm mb-1">Need Help?</p>
              <p className="text-white/60 text-xs mb-3">
                Our team is ready to assist you with any chemical requirements.
              </p>
              <Link
                href="/contact"
                className="flex items-center gap-2 text-accent text-xs font-semibold hover:underline"
              >
                Contact Us <ArrowRight size={12} />
              </Link>
              <a
                href={whatsappHref(undefined, 'footer inquiry')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-green-400 text-xs font-semibold hover:underline"
              >
                <MessageCircle size={12} />
                WhatsApp Sales
              </a>
            </div>

          </div>


        </div>
      </div>


      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © {year} {SITE_CONFIG.fullName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/45">
            <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-accent transition-colors">Terms & Conditions</Link>
            <a href="/sitemap.xml" className="hover:text-accent transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
