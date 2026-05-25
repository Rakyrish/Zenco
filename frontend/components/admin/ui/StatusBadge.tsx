type StatusVariant = 'new' | 'read' | 'processing' | 'resolved' | 'closed' |
  'published' | 'draft' | 'scheduled' | 'archived' |
  'pending' | 'reviewing' | 'quoted' | 'accepted' | 'rejected' | 'expired' |
  'in_stock' | 'limited' | 'out_of_stock' | 'on_order' |
  'low' | 'normal' | 'high' | 'urgent' |
  'admin' | 'editor' | 'support' |
  'active' | 'inactive' | string

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

const STATUS_STYLES: Record<string, string> = {
  // Inquiry statuses
  new:        'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900',
  read:       'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900',
  processing: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900',
  resolved:   'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900',
  closed:     'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  // Blog/Product statuses
  published:  'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900',
  draft:      'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  scheduled:  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  archived:   'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500',
  // Quote statuses
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  reviewing:  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  quoted:     'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400',
  accepted:   'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  rejected:   'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  expired:    'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  // Inventory
  in_stock:     'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  limited:      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  out_of_stock: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  on_order:     'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  // Priority
  low:    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  normal: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  high:   'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  urgent: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  // Roles
  admin:   'bg-[#0C094D]/10 text-[#0C094D] border-[#0C094D]/20 dark:bg-primary-900/30 dark:text-primary-300',
  editor:  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  support: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400',
  // Generic
  active:   'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-gray-50 text-gray-500 border-gray-200',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New', read: 'Read', processing: 'Processing', resolved: 'Resolved', closed: 'Closed',
  published: 'Published', draft: 'Draft', scheduled: 'Scheduled', archived: 'Archived',
  pending: 'Pending', reviewing: 'Reviewing', quoted: 'Quoted', accepted: 'Accepted',
  rejected: 'Rejected', expired: 'Expired',
  in_stock: 'In Stock', limited: 'Limited', out_of_stock: 'Out of Stock', on_order: 'On Order',
  low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent',
  admin: 'Admin', editor: 'Editor', support: 'Support',
  active: 'Active', inactive: 'Inactive',
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] || 'bg-gray-50 text-gray-600 border-gray-200'
  const label = STATUS_LABELS[status] || status.replace(/_/g, ' ')
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles} ${className}`}>
      {label}
    </span>
  )
}
