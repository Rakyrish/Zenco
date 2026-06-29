import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Download, Clock, Eye, FileText, ChevronRight, Shield, BookOpen } from 'lucide-react'
import { getTechnicalDocumentBySlug, getAllTechnicalDocuments } from '@/lib/api'
import type { TechDocDetail } from '@/lib/api'
import { SITE_CONFIG } from '@/lib/constants'
import { breadcrumbSchema } from '@/lib/metadata'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const docs = await getAllTechnicalDocuments()
    return docs.map((d) => ({ slug: d.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const doc = await getTechnicalDocumentBySlug(slug)
    return {
      title: `${doc.meta_title || doc.title} | ${SITE_CONFIG.fullName}`,
      description: doc.meta_description || doc.excerpt,
      openGraph: {
        title: doc.meta_title || doc.title,
        description: doc.meta_description || doc.excerpt,
        url: `${SITE_CONFIG.url}/technical-docs/${doc.slug}`,
        type: 'article',
      },
    }
  } catch {
    return { title: 'Technical Document | Zenco Chemicals' }
  }
}

const DOC_TYPE_ICONS: Record<string, typeof FileText> = {
  datasheet: FileText,
  iso_guide: Shield,
  kebs_guide: Shield,
  whitepaper: BookOpen,
  case_study: BookOpen,
  iec_guide: Shield,
}

function techArticleSchema(doc: TechDocDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: doc.title,
    description: doc.excerpt,
    url: `${SITE_CONFIG.url}/technical-docs/${doc.slug}`,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.fullName,
      url: SITE_CONFIG.url,
    },
    datePublished: doc.created_at,
    dateModified: doc.updated_at,
    proficiencyLevel: 'Expert',
    dependencies: doc.standard_code || undefined,
  }
}

export default async function TechnicalDocDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let doc: TechDocDetail
  try {
    doc = await getTechnicalDocumentBySlug(slug)
  } catch {
    notFound()
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Technical Documents', href: '/technical-docs' },
    { name: doc.title, href: `/technical-docs/${doc.slug}` },
  ]

  const DocIcon = DOC_TYPE_ICONS[doc.doc_type] || FileText

  const formattedDate = new Date(doc.created_at).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const updatedDate = new Date(doc.updated_at).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-surface py-10">
      {/* Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema(doc)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }}
      />

      <div className="container-xl px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/technical-docs" className="hover:text-accent transition-colors">Technical Documents</Link>
          <ChevronRight size={12} />
          <span className="text-gray-600 truncate max-w-[200px]">{doc.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
          {/* Main Content */}
          <div>
            {/* Header Card */}
            <div className="bg-gradient-to-br from-[#0C094D] to-[#1a1760] text-white rounded-2xl p-8 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DocIcon size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-lg">
                      {doc.doc_type_display}
                    </span>
                    {doc.standard_code && (
                      <span className="text-xs font-mono bg-[#F26C0C]/20 text-[#f2a15d] px-2.5 py-1 rounded-lg">
                        {doc.standard_code}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl md:text-3xl font-bold leading-tight mb-3">{doc.title}</h1>
                  <p className="text-white/70 text-sm leading-relaxed">{doc.excerpt}</p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-6 pt-5 border-t border-white/10 text-xs text-white/60 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  Published {formattedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  Updated {updatedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={12} />
                  {doc.view_count.toLocaleString()} views
                </span>
              </div>
            </div>

            {/* Body content */}
            <div
              className="prose prose-gray max-w-none
                prose-headings:text-[#0C094D] prose-headings:font-bold
                prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base
                prose-a:text-[#F26C0C] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 prose-code:text-[#0C094D]
                prose-table:text-sm prose-th:bg-gray-50 prose-th:font-semibold
                prose-details:bg-gray-50 prose-details:rounded-xl prose-details:p-4
                prose-summary:font-semibold prose-summary:cursor-pointer"
              dangerouslySetInnerHTML={{ __html: doc.body_html }}
            />

            {/* Back link */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              <Link
                href="/technical-docs"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#0C094D] transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Technical Documents
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            {/* Download CTA */}
            {doc.pdf_file ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Download PDF</h3>
                <a
                  href={doc.pdf_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#F26C0C] text-white text-sm font-semibold rounded-xl hover:bg-[#d45d0a] transition-colors justify-center"
                >
                  <Download size={15} />
                  Download PDF
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-2">Request This Document</h3>
                <p className="text-xs text-gray-500 mb-3">Get a PDF version or request a custom variation of this document.</p>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#0C094D] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1760] transition-colors justify-center"
                >
                  Contact Technical Team
                </Link>
              </div>
            )}

            {/* Standard Reference */}
            {doc.standard_code && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Shield size={15} className="text-[#F26C0C]" />
                  Referenced Standard
                </h3>
                <p className="text-sm font-mono text-[#0C094D] bg-[#0C094D]/5 rounded-xl px-3 py-2">
                  {doc.standard_code}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-[#F26C0C] to-[#d45d0a] rounded-2xl p-5 text-white">
              <h3 className="text-sm font-bold mb-2">Need This Chemical?</h3>
              <p className="text-xs text-white/80 mb-4 leading-relaxed">
                Request a quotation for chemicals and specialty products referenced in this document.
              </p>
              <Link
                href="/request-quote"
                className="block w-full text-center px-4 py-2.5 bg-white text-[#F26C0C] text-xs font-bold rounded-xl hover:bg-white/90 transition-colors"
              >
                Request a Quote
              </Link>
            </div>

            {/* Back to docs */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Browse More</h3>
              <div className="space-y-1.5">
                <Link href="/technical-docs" className="flex items-center justify-between text-xs text-gray-600 hover:text-[#0C094D] py-1.5 transition-colors">
                  <span>All Documents</span><ChevronRight size={12} />
                </Link>
                <Link href="/technical-docs?doc_type=datasheet" className="flex items-center justify-between text-xs text-gray-600 hover:text-[#0C094D] py-1.5 transition-colors">
                  <span>Product Data Sheets</span><ChevronRight size={12} />
                </Link>
                <Link href="/technical-docs?doc_type=iso_guide" className="flex items-center justify-between text-xs text-gray-600 hover:text-[#0C094D] py-1.5 transition-colors">
                  <span>ISO Standard Guides</span><ChevronRight size={12} />
                </Link>
                <Link href="/technical-docs?doc_type=kebs_guide" className="flex items-center justify-between text-xs text-gray-600 hover:text-[#0C094D] py-1.5 transition-colors">
                  <span>KEBS Compliance Guides</span><ChevronRight size={12} />
                </Link>
                <Link href="/blog" className="flex items-center justify-between text-xs text-gray-600 hover:text-[#0C094D] py-1.5 transition-colors">
                  <span>Technical Blog</span><ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
