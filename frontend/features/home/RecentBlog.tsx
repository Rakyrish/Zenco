'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, User, Clock } from 'lucide-react'
import { getFeaturedBlogPosts } from '@/lib/api'
import type { BlogPost } from '@/types'
import { formatDate } from '@/lib/utils'

export default function RecentBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getFeaturedBlogPosts()
        setPosts(data.slice(0, 3))
      } catch (err) {
        console.error('Failed to load blog posts.', err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section className="section bg-surface">
      <div className="container-xl">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div>
            <span className="section-tag">Blog & Insights</span>
            <h2 className="section-title">Knowledge, Trends & Industry Insights</h2>
            <p className="section-subtitle mt-2">
              Stay updated with expert perspectives, chemical engineering tutorials, and safety news.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:underline mt-4 md:mt-0 group"
          >
            Read All Articles
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-80 border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map(post => (
              <article key={post.id} className="card-hover bg-white flex flex-col justify-between group">
                <div className="p-6">
                  {/* Category & Reading Time */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {post.category?.name || 'Chemicals'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock size={12} />
                      {post.reading_time} min read
                    </span>
                  </div>

                  {/* Title & Excerpt */}
                  <h3 className="text-xl font-bold text-primary mb-3 line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <User size={13} className="text-accent" />
                    <span>{post.author_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={13} />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
