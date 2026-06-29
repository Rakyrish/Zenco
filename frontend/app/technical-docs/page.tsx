import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Shield, BookOpen, Beaker, FileCheck, ChevronRight, Download, Eye } from 'lucide-react'
import { getTechnicalDocuments } from '@/lib/api'
import type { TechDoc } from '@/lib/api'
import { SITE_CONFIG } from '@/lib/constants'
import { generatePageMetadata, breadcrumbSchema } from '@/lib/metadata'

export const revalidate = 3600

export const metadata: Metadata = generatePageMetadata({
  title: 'Technical Documents — Data Sheets, ISO Guides & Compliance References',
  description: `Access industrial chemical data sheets, GHS safety documents, ISO and KEBS compliance guides, and technical whitepapers from ${SITE_CONFIG.fullName}.`,
  path: '/technical-docs',
  keywords: [
    'chemical data sheets Kenya',
    'GHS SDS East Africa',
    'ISO 9001 guide chemical',
    'KEBS compliance chemical',
    'industrial chemical TDS',
    'water treatment technical guide',
  ],
})

const DOC_TYPE_FILTERS = [
  { key: '', label: 'All Documents', icon: FileText },
  { key: 'datasheet', label: 'Data Sheets', icon: Beaker },
  { key: 'iso_guide', label: 'ISO Guides', icon: Shield },
  { key: 'kebs_guide', label: 'KEBS Guides', icon: FileCheck },
  { key: 'whitepaper', label: 'Whitepapers', icon: BookOpen },
  { key: 'case_study', label: 'Case Studies', icon: BookOpen },
]

const DOC_TYPE_COLORS: Record<string, string> = {
  datasheet: 'bg-blue-50 text-blue-700 border-blue-200',
  iso_guide: 'bg-purple-50 text-purple-700 border-purple-200',
  kebs_guide: 'bg-orange-50 text-orange-700 border-orange-200',
  whitepaper: 'bg-teal-50 text-teal-700 border-teal-200',
  case_study: 'bg-green-50 text-green-700 border-green-200',
  iec_guide: 'bg-red-50 text-red-700 border-red-200',
}

function DocCard({ doc }: { doc: TechDoc }) {
  const badgeClass = DOC_TYPE_COLORS[doc.doc_type] || 'bg-gray-50 text-gray-600 border-gray-200'
  const formattedDate = new Date(doc.created_at).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 hover:border-[#F26C0C]/30 hover:shadow-lg transition-all duration-300 p-6 flex flex-col gap-4">
      {/* Type badge + date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${badgeClass}`}>
          <FileText size={11} />
          {doc.doc_type_display}
        </span>
        <span className="text-xs text-gray-400">{formattedDate}</span>
      </div>

      {/* Title */}
      <h2 className="text-base font-bold text-gray-900 leading-snug group-hover:text-[#0C094D] transition-colors">
        <Link href={`/technical-docs/${doc.slug}`} className="hover:underline underline-offset-2">
          {doc.title}
        </Link>
      </h2>

      {/* Standard code */}
      {doc.standard_code && (
        <p className="text-xs font-mono text-[#F26C0C] bg-[#F26C0C]/5 px-2.5 py-1 rounded-lg w-fit">
          {doc.standard_code}
        </p>
      )}

      {/* Excerpt */}
      <p className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-3">{doc.excerpt}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <Eye size={12} />
          {doc.view_count.toLocaleString()} views
        </span>
        <Link
          href={`/technical-docs/${doc.slug}`}
          className="flex items-center gap-1 text-xs font-semibold text-[#0C094D] hover:text-[#F26C0C] transition-colors"
        >
          Read Document <ChevronRight size={13} />
        </Link>
      </div>
    </article>
  )
}

export default async function TechnicalDocsPage({
  searchParams,
}: {
  searchParams: Promise<{ doc_type?: string; page?: string }>
}) {
  const params = await searchParams
  const docType = params.doc_type || ''
  const page = parseInt(params.page || '1', 10)

  let docs: TechDoc[] = []
  let totalCount = 0

  try {
    const data = await getTechnicalDocuments({ doc_type: docType || undefined, page })
    docs = data.results
    totalCount = data.count
  } catch (err) {
    console.error('Failed to fetch technical documents:', err)
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Technical Documents', href: '/technical-docs' },
  ]

  const totalPages = Math.ceil(totalCount / 16)

  return (
    <div className="min-h-screen bg-surface py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }}
      />

      <div className="container-xl px-4">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="section-tag">Technical Reference Library</span>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-4">
            Chemical Technical Documents
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Access product data sheets, safety data sheets, ISO &amp; KEBS compliance guides, and technical whitepapers curated by the {SITE_CONFIG.name} engineering team.
          </p>
        </div>

        {/* Filter tabs */}
        <nav className="flex flex-wrap gap-2 justify-center mb-10">
          {DOC_TYPE_FILTERS.map(({ key, label, icon: Icon }) => {
            const isActive = docType === key
            const href = key ? `/technical-docs?doc_type=${key}` : '/technical-docs'
            return (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  isActive
                    ? 'bg-[#0C094D] text-white border-[#0C094D] shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C094D]/30 hover:text-[#0C094D]'
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Stats row */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {totalCount > 0 ? `${totalCount} document${totalCount !== 1 ? 's' : ''} found` : 'No documents found'}
          </p>
          {docs.length > 0 && (
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
          )}
        </div>

        {/* Document Grid */}
        {docs.length === 0 ? (
          <div className="py-24 text-center">
            <FileText size={48} className="mx-auto text-gray-200 mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No documents available yet</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Our technical library is growing. Check back soon or{' '}
              <Link href="/contact" className="text-accent hover:underline">contact us</Link> for specific documentation.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {docs.map((doc) => (
              <DocCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {page > 1 && (
              <Link
                href={`/technical-docs?${new URLSearchParams({ ...(docType ? { doc_type: docType } : {}), page: String(page - 1) })}`}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:border-[#0C094D] hover:text-[#0C094D] transition-colors"
              >
                Previous
              </Link>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/technical-docs?${new URLSearchParams({ ...(docType ? { doc_type: docType } : {}), page: String(p) })}`}
                className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-all ${
                  p === page
                    ? 'bg-[#0C094D] text-white'
                    : 'border border-gray-200 text-gray-600 hover:border-[#0C094D] hover:text-[#0C094D]'
                }`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={`/technical-docs?${new URLSearchParams({ ...(docType ? { doc_type: docType } : {}), page: String(page + 1) })}`}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:border-[#0C094D] hover:text-[#0C094D] transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-[#0C094D] to-[#1a1760] rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Need a Specific Technical Document?</h2>
          <p className="text-white/70 mb-6 max-w-lg mx-auto text-sm">
            Can't find what you're looking for? Our technical team can provide custom data sheets, SDS, and compliance documentation for any chemical product.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contact" className="btn btn-white px-5 py-2.5 text-sm font-semibold rounded-xl">
              Contact Technical Team
            </Link>
            <Link href="/request-quote" className="btn bg-[#F26C0C] text-white px-5 py-2.5 text-sm font-semibold rounded-xl hover:bg-[#d45d0a] transition-colors">
              Request a Quote
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
