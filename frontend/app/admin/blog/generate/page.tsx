'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Sparkles, CheckCircle, AlertCircle, Loader2,
  Eye, Edit, BarChart2, FileText, Clock, RefreshCw,
} from 'lucide-react'
import { generateBlogWithAI, getBlogGenerationLogs } from '@/lib/admin/api'
import type { AdminBlogPost, BlogGenerationLog, AIBlogGenerationResult } from '@/lib/admin/types'
import { useToast } from '@/lib/admin/hooks'
import { useEffect } from 'react'

const SUGGESTED_TOPICS = [
  'Water treatment chemicals for municipal supply in Kenya: coagulation and disinfection',
  'Cooling tower Legionella prevention: chemical dosing and risk management guide',
  'GHS SDS labelling requirements for chemical importers in East Africa',
  'Boiler water treatment: scale inhibitors and oxygen scavengers explained',
  'NEMA effluent discharge compliance for agro-processing plants in Kenya',
  'Choosing the right industrial cleaner for CIP (Clean-in-Place) systems',
  'Phosphate removal from wastewater using iron coagulants: a technical guide',
  'Iron and manganese removal from borehole water: treatment options',
  'ISO 14001 environmental management for chemical warehousing operations',
  'Understanding REACH compliance for chemical importers in East Africa',
]

type Step = 'idle' | 'generating' | 'success' | 'error'

interface QualityBreakdown {
  total_score: number
  pass_publish: boolean
  pass_save: boolean
  breakdown: Record<string, number>
  details: string[]
  feedback: string
}

export default function AiBlogGeneratePage() {
  const [topic, setTopic] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [result, setResult] = useState<AdminBlogPost | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [logs, setLogs] = useState<BlogGenerationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  const { success, error } = useToast()

  useEffect(() => {
    getBlogGenerationLogs({ page: 1 })
      .then((d) => setLogs(d.results.slice(0, 8)))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false))
  }, [])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setStep('generating')
    setErrorMsg('')
    setResult(null)

    try {
      const res: AIBlogGenerationResult = await generateBlogWithAI(topic.trim())
      if (res.status === 'success' && res.post) {
        setResult(res.post)
        setStep('success')
        success('Blog generated successfully!')
        // Refresh logs
        getBlogGenerationLogs({ page: 1 })
          .then((d) => setLogs(d.results.slice(0, 8)))
          .catch(() => {})
      } else {
        setErrorMsg(res.error || 'Generation failed. Check generation logs.')
        setStep('error')
        error('Generation failed')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected error occurred.')
      setStep('error')
      error('Generation failed')
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors resize-none'

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/blog" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={22} className="text-[#F26C0C]" />
            AI Blog Generator
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate expert-level technical blog posts using GPT-4.1-mini with quality scoring and auto-save.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Generation Panel */}
        <div className="space-y-5">
          {/* Topic Input */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Blog Topic / Brief
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              placeholder="e.g. Water treatment chemicals for municipal supply in Kenya: coagulation and disinfection stages..."
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Be specific — mention the target audience (plant engineers, procurement managers), sector, and relevant standards (ISO, KEBS, NEMA).
            </p>

            {/* Suggested Topics */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Quick-select suggestions:</p>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {SUGGESTED_TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    type="button"
                    className={`text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                      topic === t
                        ? 'border-[#F26C0C] bg-[#F26C0C]/5 text-[#F26C0C] font-semibold'
                        : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-[#0C094D]/30 hover:text-[#0C094D]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={step === 'generating' || !topic.trim()}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#0C094D] hover:bg-[#1a1760] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            {step === 'generating' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating — this may take 30–60 seconds…
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Blog Post with AI
              </>
            )}
          </button>

          {/* Progress indicator */}
          {step === 'generating' && (
            <div className="bg-[#0C094D]/5 rounded-xl p-4 border border-[#0C094D]/10">
              <p className="text-xs font-semibold text-[#0C094D] mb-2">Generation in progress:</p>
              <div className="space-y-1.5 text-xs text-gray-500">
                <p className="flex items-center gap-2"><CheckCircle size={12} className="text-green-500" /> Sending topic to GPT-4.1-mini</p>
                <p className="flex items-center gap-2"><Loader2 size={12} className="animate-spin text-[#F26C0C]" /> Writing 1,600–2,400 word article with HTML headings, FAQs, and links</p>
                <p className="flex items-center gap-2 text-gray-300"><Clock size={12} /> Running Content Quality Engine (100-point scoring)</p>
                <p className="flex items-center gap-2 text-gray-300"><Clock size={12} /> Saving to database and logging generation metadata</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Generation Failed</p>
                  <p className="text-xs text-red-600 dark:text-red-300">{errorMsg}</p>
                </div>
              </div>
              <button
                onClick={() => setStep('idle')}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
              >
                <RefreshCw size={12} /> Try Again
              </button>
            </div>
          )}

          {/* Success Result */}
          {step === 'success' && result && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-800 dark:text-green-300">Post Generated Successfully!</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    Status: <strong>{result.status}</strong> • Quality Score: <strong>{result.quality_score}/100</strong>
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-green-100 dark:border-green-800">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{result.title}</p>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{result.excerpt}</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.tags?.slice(0, 4).map((tag) => (
                    <span key={tag.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-lg">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quality score bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Content Quality Score</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    result.quality_score >= 80 ? 'bg-green-100 text-green-700' :
                    result.quality_score >= 65 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {result.quality_score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      result.quality_score >= 80 ? 'bg-green-500' :
                      result.quality_score >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.quality_score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {result.quality_score >= 80 ? '✅ Ready to publish' : result.quality_score >= 65 ? '⚠️ Saved as draft — needs improvement before publishing' : '❌ Below save threshold'}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Link
                  href={`/admin/blog/${result.id}/edit`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0C094D] text-white text-xs font-semibold rounded-xl hover:bg-[#1a1760] transition-colors"
                >
                  <Edit size={13} /> Edit Post
                </Link>
                <a
                  href={`/blog/${result.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Eye size={13} /> Preview
                </a>
                <button
                  onClick={() => { setStep('idle'); setTopic('') }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#F26C0C]/10 text-[#F26C0C] text-xs font-semibold rounded-xl hover:bg-[#F26C0C]/20 transition-colors"
                >
                  <Sparkles size={13} /> Generate Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Generation Logs & Info */}
        <div className="space-y-5">
          {/* Quality Rules Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <BarChart2 size={15} className="text-[#F26C0C]" />
              Quality Scoring Rules
            </h2>
            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              {[
                { label: 'Heading Structure (H2s, H3s)', pts: 10 },
                { label: 'FAQ Quality (5+ answers, 50+ words each)', pts: 10 },
                { label: 'Internal Links (3+ valid links)', pts: 15 },
                { label: 'External Authority Links', pts: 10 },
                { label: 'Metadata Quality (title/desc length)', pts: 10 },
                { label: 'Word Count (1,500–2,800 words)', pts: 5 },
                { label: 'OpenAI: Grammar + Readability + Accuracy', pts: 40 },
              ].map(({ label, pts }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span>{label}</span>
                  <span className="font-bold text-[#0C094D] dark:text-white">{pts}pts</span>
                </div>
              ))}
              <div className="pt-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" /><span>Save requires ≥ 65 points</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" /><span>Publish requires ≥ 80 points</span></div>
              </div>
            </div>
          </div>

          {/* Recent Generation Logs */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <FileText size={15} className="text-[#F26C0C]" />
              Recent Generation Logs
            </h2>
            {logsLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                <Loader2 size={12} className="animate-spin" /> Loading…
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No generation logs yet. Generate your first post above!</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`text-xs p-3 rounded-xl border ${
                      log.status === 'success'
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-semibold ${log.status === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {log.status === 'success' ? '✅' : '❌'} {log.status}
                      </span>
                      <span className="text-gray-400 font-mono">{log.quality_score}/100</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{log.topic_used}</p>
                    <div className="flex items-center justify-between mt-1.5 text-gray-400">
                      <span>{log.triggered_by}</span>
                      <span>{new Date(log.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/admin/blog"
              className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#0C094D] dark:text-blue-400 hover:underline"
            >
              View All Blog Posts →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
