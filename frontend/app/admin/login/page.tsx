'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, User, ShieldAlert, FlaskConical, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { adminLogin } from '@/lib/admin/api'
import { setAdminTokens } from '@/lib/admin/auth'

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type LoginData = z.infer<typeof loginSchema>

const FEATURES = [
  { icon: '📦', text: 'Full product catalog management' },
  { icon: '📝', text: 'Blog & content publishing' },
  { icon: '💬', text: 'Inquiry & quote tracking' },
  { icon: '📊', text: 'Real-time analytics dashboard' },
  { icon: '🤖', text: 'Chatbot conversation monitoring' },
  { icon: '🏭', text: 'Inventory & supplier management' },
]

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/admin/dashboard'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    setLoading(true)
    setError(null)
    try {
      const tokens = await adminLogin(data.username, data.password)
      setAdminTokens(tokens)
      router.push(from)
    } catch {
      setError('Invalid credentials or the admin API is unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0C094D] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F26C0C]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#F26C0C] rounded-xl flex items-center justify-center">
              <FlaskConical size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Zenco Systems</p>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Admin Control Center</p>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Manage your chemical<br />platform with precision.
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10">
            Complete administrative control over products, inquiries, analytics, and customer management.
          </p>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/70 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Zenco Systems Ltd. Industrial Chemical Division.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-[#0C094D] rounded-xl flex items-center justify-center">
              <FlaskConical size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Zenco Systems</p>
              <p className="text-gray-400 text-xs">Admin Panel</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-card">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Sign in to dashboard</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter your admin credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    {...register('username')}
                    placeholder="admin"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/30 dark:focus:ring-[#F26C0C]/30 focus:border-[#0C094D] dark:focus:border-[#F26C0C] transition-colors"
                  />
                </div>
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/30 dark:focus:ring-[#F26C0C]/30 focus:border-[#0C094D] dark:focus:border-[#F26C0C] transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3.5 rounded-xl border border-red-100 dark:border-red-900 text-xs">
                  <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Authenticate <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 text-center">
                Use a staff account created in the backend admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
