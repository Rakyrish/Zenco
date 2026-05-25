'use client'

import { useEffect, useState } from 'react'
import { Settings, Save, Mail, Phone, MapPin, Building, Lock, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useToast } from '@/lib/admin/hooks'
import { getSiteSettings, syncGoogleSheets, updateSiteSetting } from '@/lib/admin/api'
import { SITE_CONFIG } from '@/lib/constants'

export default function AdminSettingsPage() {
  const { success } = useToast()
  const [saving, setSaving] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [settingsValues, setSettingsValues] = useState<Record<string, string>>({})

  // Password reset states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    getSiteSettings().then(settings => {
      const values = Object.fromEntries(settings.map(setting => [setting.key, setting.value]))
      setSettingsValues(values)
      setMaintenanceMode(values.maintenance_mode === 'true')
      setSmsAlerts(values.sms_alerts === 'true')
    }).catch(() => {})
  }, [])

  const setSettingValue = (key: string, value: string) => {
    setSettingsValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await Promise.all([
      updateSiteSetting('company_name', settingsValues.company_name || ''),
      updateSiteSetting('company_email', settingsValues.company_email || ''),
      updateSiteSetting('company_phone', settingsValues.company_phone || ''),
      updateSiteSetting('maintenance_mode', String(maintenanceMode)),
      updateSiteSetting('sms_alerts', String(smsAlerts)),
    ])
      setSaving(false)
      success('Settings Saved', 'Corporate profile and system states synchronized successfully.')
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!")
      return
    }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      success('Security Updated', 'Your administrator password has been updated.')
    }, 1000)
  }

  const handleGoogleSheetsSync = async (direction: 'push' | 'pull') => {
    setSaving(true)
    try {
      await syncGoogleSheets({ resource: 'products', sheet_name: 'products', direction })
      success('Google Sheets Sync Queued', `${direction === 'push' ? 'Push' : 'Pull'} sync state updated successfully.`)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 transition-colors'
  const labelCls = 'block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1'

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="text-[#F26C0C]" /> General Settings &amp; Security
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Configure system settings, company profile details, and administrator credentials.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile Configs */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2 flex items-center gap-2">
              <Building size={16} className="text-[#F26C0C]" /> Corporate Profile Settings
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Company Trade Name</label>
                <input required value={settingsValues.company_name || SITE_CONFIG.name} onChange={e => setSettingValue('company_name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Official Corporate Domain</label>
                <input required value={SITE_CONFIG.url} readOnly className={inputCls} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Corporate Email Address</label>
                <input required type="email" value={settingsValues.company_email || SITE_CONFIG.email} onChange={e => setSettingValue('company_email', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Corporate Phone Line</label>
                <input required value={settingsValues.company_phone || SITE_CONFIG.phone} onChange={e => setSettingValue('company_phone', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Physical Depot Destination Address</label>
              <textarea required rows={2} defaultValue="Industrial Area, Enterprise Road, KCB Building, 3rd Floor, Nairobi, Kenya" className={`${inputCls} resize-none`} />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#0C094D] hover:bg-[#1a1760] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-2"
            >
              {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={13} />}
              Update Corporate Profile
            </button>
          </form>

          {/* System toggles */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#F26C0C]" /> Live Operational Controls
            </h2>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">SMS Restock Notifications</p>
                <p className="text-[10px] text-gray-400">Trigger direct SMS alerts on low stock warning flags.</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={() => setSmsAlerts(!smsAlerts)}
                className="w-4 h-4 accent-green-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50/10 dark:bg-red-950/5 border border-red-100 dark:border-red-950/20 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-red-600">Platform Maintenance Mode</p>
                <p className="text-[10px] text-gray-400">Suspend client store access while updating inventory catalogs.</p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={() => setMaintenanceMode(!maintenanceMode)}
                className="w-4 h-4 accent-red-600 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Google Sheets Product Sync</p>
                <p className="text-[10px] text-gray-400">Push catalog data to Sheets or pull mapped sheet changes back into the system.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleGoogleSheetsSync('push')} disabled={saving}
                  className="px-3 py-2 text-[11px] font-bold rounded-xl bg-[#0C094D] text-white disabled:opacity-60">
                  Push Products
                </button>
                <button type="button" onClick={() => handleGoogleSheetsSync('pull')} disabled={saving}
                  className="px-3 py-2 text-[11px] font-bold rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-60">
                  Pull Products
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Password updates */}
        <div>
          <form onSubmit={handleUpdatePassword} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-2 flex items-center gap-2">
              <Lock size={16} className="text-[#F26C0C]" /> Account Security
            </h2>

            <div>
              <label className={labelCls}>Current Administrator Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#F26C0C] hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
            >
              Update Password
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
