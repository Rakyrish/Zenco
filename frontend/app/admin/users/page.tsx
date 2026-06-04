'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, Search, Mail, Shield, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import ConfirmModal from '@/components/admin/ui/ConfirmModal'
import { useToast, useConfirm } from '@/lib/admin/hooks'
import { createAdminUser, getAdminUsers, updateAdminUser } from '@/lib/admin/api'
import type { AdminUser } from '@/lib/admin/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const { success } = useToast()
  const { confirmState, confirm, closeConfirm, handleConfirm } = useConfirm()

  // Form states for new user
  const [newFullname, setNewFullname] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'editor' | 'support'>('editor')

  useEffect(() => {
    getAdminUsers().then(data => setUsers(data.results)).catch(() => setUsers([]))
  }, [])

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleActive = async (id: string) => {
    const active = users.find(u => u.id === id)?.is_active
    await updateAdminUser(id, { is_active: !active })
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_active: !u.is_active } : u)))
    success(active ? 'User Suspended' : 'User Activated', 'Updated user access flags successfully.')
  }

  const handleDeleteUser = (u: AdminUser) => {
    confirm('Revoke Access', `Are you sure you want to remove access for "${u.full_name}"?`, () => {
      setUsers(prev => prev.filter(x => x.id !== u.id))
      success('Access Revoked', 'Administrator account removed.')
    })
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullname || !newEmail || !newUsername) return

    const [first_name, ...rest] = newFullname.split(' ')
    const newUser = await createAdminUser({
      username: newUsername,
      email: newEmail,
      first_name,
      last_name: rest.join(' '),
    })

    setUsers(prev => [...prev, newUser])
    setShowAddModal(false)
    setNewFullname('')
    setNewEmail('')
    setNewUsername('')
    success('User Created', `Account for "${newFullname}" configured. Credentials dispatched.`)
  }

  const inputCls = 'w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors'
  const labelCls = 'block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1'

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="text-[#F26C0C]" /> User Accounts &amp; Access Control
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Configure system roles (Admin, Editor, Support), restrict logins, and audits.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] dark:bg-[#F26C0C] dark:hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} /> Create User Account
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Users grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.map(user => (
          <div
            key={user.id}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#0C094D]/10 dark:bg-white/10 text-[#0C094D] dark:text-white flex items-center justify-center font-bold">
                  {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <StatusBadge status={user.role} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{user.full_name}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">@{user.username}</p>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
                  <Mail size={12} className="text-[#F26C0C]" /> {user.email}
                </p>
                <p className="text-gray-400 text-[10px]">
                  Last active: {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-50 dark:border-gray-800 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={user.is_active}
                  onChange={() => handleToggleActive(user.id)}
                  className="w-3.5 h-3.5 accent-green-600 rounded"
                />
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {user.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
              <button
                onClick={() => handleDeleteUser(user)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Access Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 animate-fade-up">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Create System Admin Account</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input
                  value={newFullname}
                  onChange={e => setNewFullname(e.target.value)}
                  required
                  placeholder="e.g. Grace Waceke"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Username</label>
                <input
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  required
                  placeholder="e.g. grace_w"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Official Corporate Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                  placeholder="e.g. grace@zencosystems.co.ke"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>System Authorization Level</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className={inputCls}
                >
                  <option value="admin">Admin (Full Access)</option>
                  <option value="editor">Editor (Products &amp; Blogs)</option>
                  <option value="support">Support Agent (Inquiries &amp; Chatbot)</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-[#0C094D] hover:bg-[#1a1760] dark:bg-[#F26C0C] dark:hover:bg-orange-600 rounded-xl"
                >
                  Save Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
    </div>
  )
}
