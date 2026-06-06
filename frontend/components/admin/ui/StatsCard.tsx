import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'orange'
  trend?: { value: number; label?: string }
  suffix?: string
  loading?: boolean
  onClick?: () => void
}

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',   text: 'text-blue-600' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400', text: 'text-green-600' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400', text: 'text-amber-600' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',     icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',         text: 'text-red-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400', text: 'text-orange-600' },
}

export default function StatsCard({ label, value, icon, color = 'blue', trend, suffix, loading, onClick }: StatsCardProps) {
  const c = COLOR_MAP[color]

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-[#2f3b52] p-5 shadow-sm dark:shadow-card-dark animate-pulse">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="w-16 h-4 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="w-24 h-7 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="w-32 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={[
        'bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm',
        'dark:bg-[#1a2234] dark:border-[#2f3b52] dark:shadow-card-dark transition-all duration-300 ease-in-out',
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-[#3c4b66] hover:-translate-y-0.5 dark:hover:shadow-card-dark-hover' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            trend.value > 0 ? 'bg-green-50 text-green-600 dark:bg-green-900/20' :
            trend.value < 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
            'bg-gray-50 text-gray-500 dark:bg-gray-800'
          }`}>
            {trend.value > 0 ? <TrendingUp size={11} /> : trend.value < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span className="text-base font-semibold text-gray-400 ml-1">{suffix}</span>}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{label}</p>
        {trend?.label && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{trend.label}</p>
        )}
      </div>
    </div>
  )
}
