import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { faqSchema, generatePageMetadata } from '@/lib/metadata'

const faqs = [
  {
    question: 'How do I request a chemical quotation?',
    answer: 'Use the quote form and include the product name, quantity, packaging preference, delivery location, and any technical requirements.',
  },
  {
    question: 'Can I search products by category?',
    answer: 'Yes. Browse product categories from the catalog or use site search to find matching products and categories.',
  },
  {
    question: 'Do you support bulk chemical supply?',
    answer: 'Yes. The bulk logistics service supports recurring supply, packaging coordination, and dispatch planning for industrial buyers.',
  },
  {
    question: 'What happens if a product is not listed?',
    answer: 'Contact the sales team with the product name or specification so they can confirm availability or suggest an alternative.',
  },
]

export const metadata = generatePageMetadata({
  title: 'Frequently Asked Questions',
  description: 'Answers about quotes, product search, categories, services, delivery, and technical support.',
  path: '/faqs',
})

export default function FaqsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />
      <div className="container-xl px-4">
        <div className="max-w-3xl">
          <p className="section-tag">Support</p>
          <h1 className="mt-3 text-4xl font-black text-primary md:text-5xl">Frequently Asked Questions</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600">
            Quick answers for product discovery, quotations, categories, services, and technical requests.
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          {faqs.map(faq => (
            <details key={faq.question} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-black text-primary">{faq.question}</summary>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{faq.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/products" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-black text-white hover:bg-primary-600">
            Browse Products
            <ArrowRight size={15} />
          </Link>
          <Link href="/contact?type=quote" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-5 text-sm font-black text-primary hover:border-accent">
            Request a Quote
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </main>
  )
}
