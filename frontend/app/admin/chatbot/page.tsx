'use client'

import { useEffect, useState } from 'react'
import { Bot, Search, Calendar, MessageSquare, AlertCircle, CheckCircle2, ChevronRight, User, Cpu, Download, ArrowLeft } from 'lucide-react'
import StatusBadge from '@/components/admin/ui/StatusBadge'
import Pagination from '@/components/admin/ui/Pagination'
import { useDebounce, useToast } from '@/lib/admin/hooks'
import { getChatbotConversations, resolveChatbotConversation } from '@/lib/admin/api'
import type { ChatbotConversation } from '@/lib/admin/types'

const RESOLVE_FILTERS = ['All', 'unresolved', 'resolved']

export default function AdminChatbotPage() {
  const [conversations, setConversations] = useState<ChatbotConversation[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  // Modal / Chat Detail viewer
  const [selectedChat, setSelectedChat] = useState<ChatbotConversation | null>(null)

  const dSearch = useDebounce(search)
  const { success } = useToast()

  useEffect(() => {
    getChatbotConversations().then(data => setConversations(data.results)).catch(() => setConversations([]))
  }, [])

  const filtered = conversations.filter(c => {
    const matchSearch =
      !dSearch ||
      (c.user_identifier && c.user_identifier.toLowerCase().includes(dSearch.toLowerCase())) ||
      c.first_message.toLowerCase().includes(dSearch.toLowerCase()) ||
      c.messages.some(m => m.content.toLowerCase().includes(dSearch.toLowerCase()))

    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'resolved' && c.is_resolved) ||
      (statusFilter === 'unresolved' && !c.is_resolved)

    return matchSearch && matchStatus
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleResolveChat = async (id: string) => {
    await resolveChatbotConversation(id)
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, is_resolved: true } : c))
    )
    if (selectedChat?.id === id) {
      setSelectedChat(prev => prev ? { ...prev, is_resolved: true } : null)
    }
    success('Conversation Resolved', 'Conversation marked as resolved.')
  }

  const handleExportChats = () => {
    const content = filtered.map(c => {
      const chatLogs = c.messages.map(m => `[${m.role.toUpperCase()} - ${new Date(m.timestamp).toLocaleTimeString()}]: ${m.content}`).join('\n')
      return `SESSION ID: ${c.session_id}\nUSER ID: ${c.user_identifier || 'Anonymous'}\nSTATUS: ${c.is_resolved ? 'RESOLVED' : 'UNRESOLVED'}\n\nCHAT TIMELINE:\n${chatLogs}\n=========================================\n`
    }).join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Zenco_Chatbot_Logs_${new Date().toISOString().slice(0, 10)}.txt`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    success('Export Successful', 'Downloaded chatbot matched transcripts.')
  }

  // Quick aggregates
  const totalChats = conversations.length
  const unresolvedChats = conversations.filter(c => !c.is_resolved).length
  const resolvedChats = conversations.filter(c => c.is_resolved).length
  const resolutionRate = totalChats ? Math.round((resolvedChats / totalChats) * 100) : 0

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="text-[#F26C0C]" /> Chatbot Monitoring
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor client-chatbot sessions, track questions, and resolve unresolved leads.
          </p>
        </div>
        <button
          onClick={handleExportChats}
          className="flex items-center gap-2 bg-[#0C094D] hover:bg-[#1a1760] dark:bg-[#F26C0C] dark:hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors self-start sm:self-auto shadow-sm"
        >
          <Download size={16} /> Export transcripts
        </button>
      </div>

      {/* Quick Analytics Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-[#F26C0C] flex items-center justify-center flex-shrink-0">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">{totalChats}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Conversations</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">{unresolvedChats}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Unresolved Conversations</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">{resolutionRate}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Resolution Rate</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Left column: search, filters, list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search transcripts..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C094D]/20 dark:text-white placeholder-gray-400"
              />
            </div>
            
            <div className="flex gap-1.5 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
              {RESOLVE_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => { setStatusFilter(f); setPage(1) }}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                    statusFilter === f
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="space-y-3">
            {paginated.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-10 text-center shadow-sm">
                <Bot size={28} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">No sessions match filters</p>
              </div>
            ) : (
              paginated.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedChat(c)}
                  className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all ${
                    selectedChat?.id === c.id ? 'border-[#F26C0C]' : 'border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                      {c.user_identifier || 'Anonymous Guest'}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                    {c.first_message}
                  </p>
                  <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800 mt-3 pt-2 text-[10px] text-gray-400">
                    <span>{c.message_count} messages</span>
                    <StatusBadge status={c.is_resolved ? 'resolved' : 'new'} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 shadow-sm">
              <Pagination page={page} totalPages={totalPages} onPage={setPage} totalCount={filtered.length} pageSize={PAGE_SIZE} />
            </div>
          )}
        </div>

        {/* Right column: Interactive Transcript / View Thread */}
        <div className="lg:col-span-3">
          {selectedChat ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 lg:p-6 shadow-sm h-full flex flex-col justify-between min-h-[500px]">
              
              {/* Transcript Header */}
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    Session Log: {selectedChat.user_identifier || 'Anonymous Guest'}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-mono">ID: {selectedChat.session_id}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!selectedChat.is_resolved && (
                    <button
                      onClick={() => handleResolveChat(selectedChat.id)}
                      className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      Resolve Case
                    </button>
                  )}
                  <StatusBadge status={selectedChat.is_resolved ? 'resolved' : 'new'} />
                </div>
              </div>

              {/* Chat Thread Scroller */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[400px] scrollbar-thin">
                {selectedChat.messages.map(m => (
                  <div
                    key={m.id}
                    className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                      m.role === 'user' ? 'bg-[#0C094D]' : 'bg-[#F26C0C]'
                    }`}>
                      {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                    </div>
                    <div>
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                          : 'bg-[#F26C0C]/10 dark:bg-orange-950/20 text-[#0C094D] dark:text-orange-400 border border-[#F26C0C]/10'
                      }`}>
                        {m.content}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 block px-1">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Thread Info Footer */}
              <div className="border-t border-gray-50 dark:border-gray-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-gray-400">
                  Timeline duration: {new Date(selectedChat.last_message_at).toLocaleDateString()}
                </span>
                {!selectedChat.is_resolved && (
                  <div className="flex items-center gap-1 text-red-500 font-semibold bg-red-50 dark:bg-red-950/10 px-2.5 py-1 rounded-xl self-start sm:self-auto">
                    <AlertCircle size={12} /> Unresolved conversation lead
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-16 text-center shadow-sm h-full flex flex-col items-center justify-center min-h-[500px]">
              <Bot size={48} className="text-gray-300 dark:text-gray-700 mb-3 animate-bounce" />
              <h3 className="text-sm font-bold text-gray-850 dark:text-gray-200">No conversation selected</h3>
              <p className="text-xs text-gray-400 mt-1">Select an active chatbot session from the sidebar to review logs.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
