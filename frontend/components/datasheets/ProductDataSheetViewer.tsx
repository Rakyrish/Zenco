'use client'

import Link from 'next/link'
import { Mail, Send, ShieldCheck, FileText, Printer } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import { GhsPictogramList } from '@/components/datasheets/ghs-pictograms'
import { SITE_CONFIG } from '@/lib/constants'
import type { ProductDataSheetDetail } from '@/lib/api'
import type { ProductListItem } from '@/types'

function toProductListItem(p: ProductDataSheetDetail['related_products'][0]): ProductListItem {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    short_description: p.short_description,
    category: p.category_slug,
    category_name: p.category_name,
    category_slug: p.category_slug,
    image: p.image,
    availability: 'in_stock',
    is_featured: false,
    regions_available: [],
    created_at: '',
    updated_at: '',
  }
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    return value
  }
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b-2 border-primary/80 pb-1.5 print:border-gray-700">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-primary text-[11px] font-black text-white print:bg-gray-800">
        {number}
      </span>
      <h2 className="text-[13px] font-black uppercase tracking-widest text-primary print:text-gray-900">
        {title}
      </h2>
    </div>
  )
}

function PropTable({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data || {}).filter(([, v]) => v != null && v !== '')
  if (!entries.length)
    return <p className="text-[11px] italic text-zinc-500">Consult product label or SDS.</p>
  return (
    <table className="w-full border-collapse text-[11px]">
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key} className="border-b border-zinc-200 last:border-b-0 print:border-gray-300">
            <td className="w-[38%] py-1.5 pr-3 font-semibold capitalize text-zinc-700 print:text-gray-800">
              {key.replace(/_/g, ' ')}
            </td>
            <td className="py-1.5 text-zinc-600 print:text-gray-700">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function ProductDataSheetViewer({ datasheet }: { datasheet: ProductDataSheetDetail }) {
  const product = datasheet.product
  const health = (datasheet.health_safety || {}) as Record<string, any>
  const performance = (datasheet.performance_data || {}) as Record<string, any>
  const storage = (datasheet.storage_handling || {}) as Record<string, any>
  const packaging = (datasheet.packaging_info || {}) as Record<string, any>

  return (
    <div className="datasheet-viewer">

      {/* ── Print / share bar (hidden on print) ──────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-xs text-zinc-500">
          Technical Data Sheet · Version <strong>{datasheet.version}</strong> · Issued {formatDate(datasheet.issue_date)}
        </p>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          <Printer size={14} />
          Print / Save PDF
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
           PDF-STYLE DOCUMENT PAPER
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="
          relative mx-auto w-full max-w-[860px] select-none
          rounded-sm bg-white shadow-[0_4px_32px_rgba(0,0,0,0.18)]
          ring-1 ring-black/[0.06]
          print:shadow-none print:ring-0
        "
        style={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}
      >
        {/* Fold / corner crease decoration */}
        <span
          className="pointer-events-none absolute right-0 top-0 z-10 h-8 w-8 print:hidden"
          aria-hidden
          style={{
            background: 'linear-gradient(225deg, #e4e4e7 50%, transparent 50%)',
            boxShadow: '-2px 2px 4px rgba(0,0,0,0.08)',
          }}
        />

        {/* ── Document top colour band ──────────────────────────────────── */}
        <div className="h-[6px] w-full rounded-t-sm bg-gradient-to-r from-primary via-[#1a1570] to-accent print:bg-gray-900" />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="border-b border-zinc-200 bg-gradient-to-br from-primary to-[#1a1570] px-8 py-6 print:border-gray-400 print:bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-orange-300 print:text-gray-500">
                Technical Data Sheet
              </p>
              <h1 className="mt-1 text-xl font-black leading-tight text-white print:text-gray-900 md:text-2xl">
                {product.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/70 print:text-gray-600">
                <span>Zenco Chemicals Ltd</span>
                {product.sku && <span>Code: {product.sku}</span>}
                {product.category_name && <span>Category: {product.category_name}</span>}
              </div>
            </div>
            {/* Document meta box */}
            <div className="shrink-0 rounded border border-white/20 bg-white/10 px-4 py-3 text-right text-[10px] text-white/80 print:border-gray-300 print:bg-gray-50 print:text-gray-700">
              <div className="mb-1 font-bold">DOC REFERENCE</div>
              <div>Version: {datasheet.version}</div>
              <div>Issue: {formatDate(datasheet.issue_date)}</div>
              <div>Revised: {formatDate(datasheet.revision_date)}</div>
              <div className="mt-1 text-[9px] uppercase tracking-wide text-white/50 print:text-gray-400">
                CONFIDENTIAL — VIEW ONLY
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="space-y-7 px-8 py-8 print:space-y-5 print:px-6 print:py-5">

          {/* 1. Product Description */}
          <section>
            <SectionHeading number="1" title="Product Description" />
            <div
              className="prose prose-sm max-w-none text-[12px] leading-relaxed text-zinc-700 print:text-gray-800"
              dangerouslySetInnerHTML={{ __html: datasheet.product_description }}
            />
          </section>

          {/* 2. Chemical Composition */}
          <section>
            <SectionHeading number="2" title="Chemical Composition" />
            {(datasheet.chemical_composition || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-zinc-100 print:bg-gray-100">
                      <th className="border border-zinc-300 px-3 py-2 text-left font-bold text-zinc-700 print:border-gray-400">Component</th>
                      <th className="border border-zinc-300 px-3 py-2 text-left font-bold text-zinc-700 print:border-gray-400">CAS Number</th>
                      <th className="border border-zinc-300 px-3 py-2 text-left font-bold text-zinc-700 print:border-gray-400">% w/w</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasheet.chemical_composition.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/60 print:bg-gray-50'}>
                        <td className="border border-zinc-200 px-3 py-1.5 print:border-gray-300">{row.component}</td>
                        <td className="border border-zinc-200 px-3 py-1.5 font-mono text-[10px] print:border-gray-300">{row.cas_number}</td>
                        <td className="border border-zinc-200 px-3 py-1.5 print:border-gray-300">{row.percentage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] italic text-zinc-500">Composition data available on request.</p>
            )}
          </section>

          {/* 3. Physical & Chemical Properties */}
          <section>
            <SectionHeading number="3" title="Physical & Chemical Properties" />
            <PropTable data={datasheet.physical_properties as Record<string, unknown>} />
          </section>

          {/* 4. Performance Data */}
          <section>
            <SectionHeading number="4" title="Performance Data & Dosage" />
            <PropTable data={performance} />
          </section>

          {/* 5. Applications */}
          <section>
            <SectionHeading number="5" title="Applications & Industries" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Applications</p>
                <ul className="space-y-1 text-[11px] text-zinc-700 print:text-gray-800">
                  {(datasheet.applications || []).map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Industries Served</p>
                <div className="flex flex-wrap gap-1.5">
                  {(datasheet.industries_served || []).map(industry => (
                    <span
                      key={industry}
                      className="rounded border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary print:border-gray-300 print:bg-gray-50 print:text-gray-700"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 6. Health & Safety */}
          <section>
            <SectionHeading number="6" title="Health & Safety (GHS)" />
            <GhsPictogramList codes={(health.ghs_pictograms as string[]) || []} />
            <div className="mt-4 space-y-3 text-[11px] text-zinc-700 print:text-gray-800">
              {health.signal_word && (
                <p>
                  <strong>Signal Word: </strong>
                  <span className="rounded bg-red-100 px-2 py-0.5 font-black uppercase text-red-700 print:bg-transparent">
                    {String(health.signal_word)}
                  </span>
                </p>
              )}
              {health.ghs_hazard_class && (
                <p><strong>Hazard Class: </strong>{String(health.ghs_hazard_class)}</p>
              )}
              {Array.isArray(health.hazard_statements) && (
                <div>
                  <p className="font-semibold">Hazard Statements:</p>
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {(health.hazard_statements as string[]).map(h => (
                      <li key={h} className="flex items-start gap-1.5">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-red-500" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(health.ppe_required) && (
                <div>
                  <p className="font-semibold">PPE Required:</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(health.ppe_required as string[]).map(ppe => (
                      <span key={ppe} className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] print:border-gray-300">
                        <ShieldCheck size={10} className="text-primary" /> {ppe}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {['first_aid_skin', 'first_aid_eyes', 'first_aid_ingestion'].map(key =>
                health[key] ? (
                  <details key={key} className="rounded border border-zinc-200 p-3 print:border-gray-300">
                    <summary className="cursor-pointer font-semibold capitalize">{key.replace(/_/g, ' ')}</summary>
                    <p className="mt-2 text-zinc-600 print:text-gray-700">{String(health[key])}</p>
                  </details>
                ) : null
              )}
            </div>
          </section>

          {/* 7. Storage & Handling */}
          <section>
            <SectionHeading number="7" title="Storage & Handling" />
            <PropTable data={storage} />
          </section>

          {/* 8. Packaging & Transport */}
          <section>
            <SectionHeading number="8" title="Packaging & Transport" />
            {Array.isArray(packaging.available_sizes) && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(packaging.available_sizes as string[]).map(size => (
                  <span key={size} className="rounded border border-zinc-300 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-semibold print:border-gray-300">
                    {size}
                  </span>
                ))}
              </div>
            )}
            <PropTable data={Object.fromEntries(Object.entries(packaging).filter(([k]) => k !== 'available_sizes'))} />
          </section>

          {/* 9. Standards & Compliance */}
          <section>
            <SectionHeading number="9" title="Standards & Compliance" />
            {(datasheet.certifications || []).length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {datasheet.certifications.map(cert => (
                  <span key={cert} className="rounded bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 print:bg-transparent print:border print:border-gray-300">
                    ✓ {cert}
                  </span>
                ))}
              </div>
            )}
            {(datasheet.standards_compliance || []).length > 0 && (
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-zinc-100 print:bg-gray-100">
                    <th className="border border-zinc-300 px-3 py-2 text-left font-bold print:border-gray-400">Standard</th>
                    <th className="border border-zinc-300 px-3 py-2 text-left font-bold print:border-gray-400">Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {datasheet.standards_compliance.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/60'}>
                      <td className="border border-zinc-200 px-3 py-1.5 font-semibold print:border-gray-300">{row.standard}</td>
                      <td className="border border-zinc-200 px-3 py-1.5 print:border-gray-300">{row.scope}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* 10. FAQ — selectable text */}
          <section className="select-text">
            <SectionHeading number="10" title="Frequently Asked Questions" />
            <div className="space-y-2">
              {(datasheet.faq || []).map((item, i) => (
                <details key={i} className="rounded border border-zinc-200 bg-zinc-50/50 p-3.5 print:border-gray-300">
                  <summary className="cursor-pointer text-[11px] font-bold text-zinc-800">{item.question}</summary>
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 print:text-gray-700">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* ── Bottom colour band ─────────────────────────────────────────── */}
          <div className="h-px w-full bg-gradient-to-r from-primary via-accent to-primary print:bg-gray-400" />

          {/* Disclaimer */}
          <section className="text-[9.5px] leading-relaxed text-zinc-500 print:text-gray-500">
            <span className="font-bold uppercase tracking-wide text-zinc-600 print:text-gray-700">Disclaimer — </span>
            This technical data sheet is provided for informational purposes only.
            Always refer to the product label and Safety Data Sheet (SDS) before use.
            Zenco Chemicals Ltd reserves the right to modify specifications without prior notice.
            Last revised: {formatDate(datasheet.revision_date)}.
          </section>

        </div>{/* /body */}

        {/* ── Document footer bar ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-8 py-3 text-[9px] text-zinc-400 print:border-gray-300 print:bg-white">
          <span className="font-semibold uppercase tracking-wider">Zenco Chemicals Ltd — {SITE_CONFIG.url}</span>
          <span>TDS-{product.sku || product.slug.toUpperCase()} · v{datasheet.version} · {formatDate(datasheet.revision_date)}</span>
          <span className="hidden md:inline">FOR TECHNICAL REFERENCE ONLY</span>
        </div>

        {/* Bottom colour band */}
        <div className="h-[4px] w-full rounded-b-sm bg-gradient-to-r from-primary via-accent to-primary print:bg-gray-800" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
           LEAD CAPTURE — hidden on print
      ══════════════════════════════════════════════════════════════════ */}
      <div className="mx-auto mt-8 max-w-[860px] print:hidden">
        <div className="rounded-2xl border-2 border-dashed border-accent/40 bg-orange-50 p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-accent" />
          <h3 className="text-xl font-extrabold text-primary">Want a downloadable copy of this datasheet?</h3>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-600">
            Contact our technical team and we will send you the full official PDF directly to your inbox.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/contact?ref=datasheet&product=${encodeURIComponent(product.slug)}`}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-extrabold text-white hover:bg-orange-600"
            >
              <Send size={16} />
              Request PDF Datasheet
            </Link>
            <Link
              href={`/contact?type=technical&product=${encodeURIComponent(product.name)}`}
              className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-white px-5 py-3 text-sm font-extrabold text-primary hover:bg-primary hover:text-white"
            >
              <Mail size={16} />
              Contact Technical Team
            </Link>
          </div>
        </div>
      </div>

      {/* Related products */}
      {datasheet.related_products?.length > 0 && (
        <section className="mx-auto mt-12 max-w-[860px] print:hidden">
          <h2 className="mb-6 text-xl font-extrabold text-primary">Related Products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {datasheet.related_products.map(p => (
              <ProductCard key={p.id} product={toProductListItem(p)} />
            ))}
          </div>
        </section>
      )}

      {/* Related resources */}
      {(datasheet.related_blogs?.length > 0 || datasheet.related_docs?.length > 0) && (
        <section className="mx-auto mt-12 max-w-[860px] print:hidden">
          <h2 className="mb-6 text-xl font-extrabold text-primary">Related Resources</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {datasheet.related_blogs?.map(b => (
              <Link key={b.slug} href={`/blog/${b.slug}`} className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-primary/30">
                <p className="text-xs font-bold uppercase text-accent">Blog</p>
                <p className="mt-1 font-bold text-primary">{b.title}</p>
                <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{b.excerpt}</p>
              </Link>
            ))}
            {datasheet.related_docs?.map(d => (
              <Link key={d.slug} href={`/technical-docs/${d.slug}`} className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-primary/30">
                <p className="text-xs font-bold uppercase text-accent">Technical Doc</p>
                <p className="mt-1 font-bold text-primary">{d.title}</p>
                <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{d.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {datasheet.related_products_text && (
        <section className="mx-auto mt-8 max-w-[860px] rounded-xl bg-zinc-50 p-6 text-sm text-zinc-700 print:hidden">
          <p>{datasheet.related_products_text}</p>
        </section>
      )}
    </div>
  )
}
