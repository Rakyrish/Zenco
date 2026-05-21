'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, User, Clock, Search, BookOpen } from 'lucide-react'
import { getBlogPosts } from '@/lib/api'
import type { BlogPost } from '@/types'
import { formatDate } from '@/lib/utils'

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const mockPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Modern Wastewater Treatment: Choosing the Right Flocculants',
      slug: 'choosing-right-flocculants-wastewater',
      excerpt: 'Wastewater purification efficiency depends entirely on polymer weight and charge. Learn how to optimize dosage rates.',
      category: { id: 1, name: 'Water Treatment', slug: 'water-treatment', description: '', color: 'blue' },
      featured_image: null,
      tags: ['Water Treatment', 'Chemicals'],
      reading_time: 5,
      is_featured: true,
      published_at: new Date().toISOString(),
      author_name: 'Dr. Arthur Otieno',
    },
    {
      id: '2',
      title: 'Safety Guidelines for Storing Volatile Solvents in Industrial Areas',
      slug: 'safe-storage-volatile-solvents',
      excerpt: 'Understand flashpoints, vapor suppression, and safety containment measures required by NEMA guidelines.',
      category: { id: 2, name: 'Safety & Compliance', slug: 'safety-compliance', description: '', color: 'red' },
      featured_image: null,
      tags: ['Safety', 'Solvents'],
      reading_time: 7,
      is_featured: false,
      published_at: new Date().toISOString(),
      author_name: 'Eng. Julius Wekesa',
    },
    {
      id: '3',
      title: 'The Shift Towards Eco-Friendly Industrial Cleaning Agents',
      slug: 'eco-friendly-industrial-cleaning-agents',
      excerpt: 'Why regional manufacturers are choosing biodegradable surfactants to align with corporate ESG goals.',
      category: { id: 3, name: 'Sustainability', slug: 'sustainability', description: '', color: 'green' },
      featured_image: null,
      tags: ['ESG', 'Cleaning'],
      reading_time: 4,
      is_featured: false,
      published_at: new Date().toISOString(),
      author_name: 'Mary Mutua',
    },
  ]

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getBlogPosts()
        setPosts(data.results.length ? data.results : mockPosts)
      } catch (err) {
        console.error('Failed to load blog posts, using mock fallback.', err)
        setPosts(mockPosts)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="container-xl px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-tag">Zenco Insights</span>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-3">Blog & Industry News</h1>
          <p className="text-gray-500 leading-relaxed">
            Read professional insights, engineering calculators, NEMA safety guidelines, and updates from the Zenco Systems technical team.
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between mb-12 max-w-4xl mx-auto">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles by title, keywords or topic…"
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-80 border border-gray-100" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-xl mx-auto shadow-card">
            <BookOpen size={48} className="text-accent mx-auto mb-4 animate-float" />
            <h2 className="text-xl font-bold text-primary mb-2">No Articles Found</h2>
            <p className="text-xs text-gray-500 mb-6">
              We couldn't find any blog posts matching your search query. Try typing another keyword.
            </p>
            <button onClick={() => setSearch('')} className="btn-primary">
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredPosts.map(post => (
              <article key={post.id} className="card-hover bg-white flex flex-col justify-between group">
                <div className="p-6">
                  {/* Category & Time */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {post.category?.name || 'Chemicals'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock size={12} />
                      {post.reading_time} min read
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-primary mb-3 line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                </div>

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
    </div>
  )
}
