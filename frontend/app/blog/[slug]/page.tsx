'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, User, Clock, CheckCircle } from 'lucide-react'
import { getBlogPostBySlug } from '@/lib/api'
import type { BlogPostDetail } from '@/types'
import { articleSchema } from '@/lib/metadata'
import { formatDate } from '@/lib/utils'

export default function BlogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [post, setPost] = useState<BlogPostDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getBlogPostBySlug(slug)
        setPost(data)
      } catch (err) {
        console.error('Failed to get article details.', err)
        setPost(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin text-accent text-3xl">⚗</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center flex-col px-4 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Article Not Found</h1>
        <p className="text-gray-500 mb-6">The blog post you are looking for has been archived or does not exist.</p>
        <Link href="/blog" className="btn-primary">Back to Blog</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      {/* Schema.org Article Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleSchema({
              title: post.title,
              excerpt: post.excerpt,
              slug: post.slug,
              publishedAt: post.published_at,
              updatedAt: post.updated_at,
              authorName: post.author_name,
            })
          ),
        }}
      />

      <div className="container-xl px-4">
        {/* Navigation back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-accent mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>

        {/* Article Layout */}
        <article className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 p-6 md:p-12 shadow-card">
          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-8 text-xs md:text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="text-[10px] md:text-xs font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-md uppercase tracking-wider">
                {post.category?.name || 'Chemicals'}
              </span>
              <div className="flex items-center gap-1.5 font-medium">
                <User size={14} className="text-accent" />
                <span>{post.author_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>{formatDate(post.published_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>{post.reading_time} min read</span>
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed font-medium italic border-l-4 border-accent pl-4 mb-8">
            {post.excerpt}
          </p>

          {/* Content Block */}
          <div
            className="prose prose-primary max-w-none prose-sm md:prose-base space-y-6 text-gray-600 leading-relaxed
                       prose-headings:text-primary prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-3
                       prose-h2:text-2xl prose-h3:text-xl
                       prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
                       prose-li:mb-1
                       prose-strong:text-primary prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-8 mt-12">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>

        {/* CTA Strip */}
        <div className="max-w-4xl mx-auto bg-gradient-hero rounded-3xl p-8 text-white mt-12 pattern-dots flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl border border-white/10">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-lg">Need Wastewater Optimization?</h4>
            <p className="text-xs text-white/70">
              Schedule a jar test at your treatment plant with our chemical engineers.
            </p>
          </div>
          <Link
            href="/contact?type=technical"
            className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-glow-accent"
          >
            Contact Technical Team
            <CheckCircle size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
