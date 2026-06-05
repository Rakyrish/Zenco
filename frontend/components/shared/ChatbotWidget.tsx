'use client'

/**
 * Zenco Systems Ltd – Unified Contact & AI Assistant Hub
 * A premium floating contact widget redesigned to match the user's mockup.
 *
 * Layout:
 * - FAB Icon: Orange circle with a white message bubble with three dots, plus a transparent dark ring border.
 * - Home Screen: A beautiful menu listing the 4 vertical cards (WhatsApp, Call Us, Email, AI Assistant) with custom badges:
 *   - WhatsApp card: Green icon, "RECOMMENDED" badge.
 *   - Call Us card: Blue icon, phone number subtitle, "DIRECT" badge.
 *   - Email card: Purple icon, email address subtitle.
 *   - AI Assistant card: Orange robot icon, product guidance subtitle.
 * - Sub-Views: Inner views (AI Chat, WhatsApp, Call Details, Inquiry Form) with a slick Back Arrow button to return to the Home Menu.
 *
 * Features:
 * - Full Dark/Light mode support.
 * - Clean Next.js, TypeScript type safety.
 * - Persistent chat state, Nairobi local time status, inquiry form integration.
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
} from 'react'
import {
  Bot,
  X,
  Send,
  MessageSquare,
  MessageSquareMore, // Three-dot bubble icon from mockup
  Phone,
  RefreshCw,
  ChevronDown,
  Zap,
  Mail,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  User,
  Building,
  ArrowLeft,
  Package,
  Bell,
} from 'lucide-react'
import {
  getChatSessionId,
  sendChatMessage,
  loadChatMessages,
  saveChatMessages,
  makeMessage,
  clearChatSession,
  type ChatMessage,
  type ChatAction,
  type ChatProduct,
} from '@/lib/chatbot'
import { AVAILABILITY_LABELS, SITE_CONFIG } from '@/lib/constants'
import { submitInquiry } from '@/lib/api'
import { mediaUrl } from '@/lib/utils'

// ─── Constants & Configurations ──────────────────────────────────────────────

const WHATSAPP_NUMBER = SITE_CONFIG.whatsapp.replace(/\D/g, '')
const PHONE_NUMBER = SITE_CONFIG.phone
const COMPANY_EMAIL = SITE_CONFIG.email

const QUICK_PROMPTS = [
  { label: '💧 Water Treatment', text: 'What water treatment chemicals do you supply?' },
  { label: '🧪 Get a Quote', text: 'I need a quotation for industrial chemicals.' },
  { label: '🏭 Industrial Solvents', text: 'What industrial solvents and thinners do you have?' },
  { label: '📞 Talk to Sales', text: 'I need to speak with a sales representative.' },
]

const WELCOME_MESSAGE = makeMessage(
  'assistant',
  `👋 Hello! I'm **Zara**, your AI assistant.\n\nI can help you with:\n• Product specifications\n• Custom bulk quotes\n• Availability & delivery\n\nWhat can I assist you with today?`,
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeChatText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/www\.\S+/g, '')
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '')
    .replace(/(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function parseMarkdown(text: string): string {
  return sanitizeChatText(text)
    .replace(/\*\/(.+?)\*\//g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br />')
    .replace(/•\s/g, '<span class="text-[#F26C0C] mr-1">•</span>')
}

function getBusinessStatus(): { isOpen: boolean; message: string } {
  try {
    const now = new Date()
    const eatTime = new Date(now.toLocaleString('en-US', { timeZone: SITE_CONFIG.timeZone }))
    const day = eatTime.getDay()
    const hours = eatTime.getHours()
    const minutes = eatTime.getMinutes()
    const currentTimeVal = hours * 60 + minutes

    if (day === 0) {
      return { isOpen: false, message: 'Closed · Opens Mon 8 AM' }
    }

    if (day >= 1 && day <= 5) {
      if (currentTimeVal >= 480 && currentTimeVal < 1020) {
        return { isOpen: true, message: 'Open Now · Closes at 5 PM' }
      }
      return { isOpen: false, message: 'Closed · Opens tomorrow 8 AM' }
    }

    if (day === 6) {
      if (currentTimeVal >= 540 && currentTimeVal < 780) {
        return { isOpen: true, message: 'Open Now · Closes at 1 PM' }
      }
      return { isOpen: false, message: 'Closed · Opens Mon 8 AM' }
    }
  } catch (e) {
    // ignore
  }
  return { isOpen: true, message: 'Open Now · Mon-Sat Desk' }
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 max-w-[80%]">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#F26C0C] to-orange-400 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function productIsOutOfStock(product: ChatProduct) {
  return product.availability === 'out_of_stock' || product.stock_quantity === 0
}

function ProductMiniCard({ product }: { product: ChatProduct }) {
  const label = productIsOutOfStock(product)
    ? AVAILABILITY_LABELS.out_of_stock
    : AVAILABILITY_LABELS[product.availability] || AVAILABILITY_LABELS.in_stock
  const image = product.image ? mediaUrl(product.image) : ''

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-850">
      <div className="flex gap-3 p-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
          {image ? (
            <img src={image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Package size={22} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-extrabold text-gray-950 dark:text-white">{product.name}</p>
          <p className="mt-1 truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {product.category || 'Product catalog'}
          </p>
          <span className={`mt-2 inline-flex rounded-md px-2 py-1 text-[10px] font-black ${label.color}`}>
            {label.label}
          </span>
        </div>
      </div>
      {product.short_description && (
        <p className="border-t border-gray-100 px-3 py-2 text-[11px] leading-relaxed text-gray-500 line-clamp-2 dark:border-gray-700 dark:text-gray-400">
          {product.short_description}
        </p>
      )}
    </div>
  )
}

function actionHref(action: ChatAction, product?: ChatProduct) {
  const productName = product?.name || 'product inquiry'
  const encodedProduct = encodeURIComponent(productName)

  switch (action) {
    case 'view_product':
      return product?.slug ? `/products/${product.slug}` : '/products'
    case 'request_quote':
      return `/contact?type=quote${product ? `&product=${encodedProduct}` : ''}`
    case 'request_product':
    case 'notify_me':
      return `/contact?type=product${product ? `&product=${encodedProduct}` : ''}`
    case 'whatsapp_sales': {
      const text = encodeURIComponent(`Hello ${SITE_CONFIG.name}, I need assistance with ${productName}.`)
      return WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${text}` : `/contact?type=quote${product ? `&product=${encodedProduct}` : ''}`
    }
    case 'call_sales':
      return PHONE_NUMBER ? `tel:${PHONE_NUMBER}` : '/contact'
    case 'email_sales':
      return COMPANY_EMAIL ? `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(`${SITE_CONFIG.name} sales inquiry`)}` : '/contact'
    default:
      return '/contact'
  }
}

function actionMeta(action: ChatAction) {
  switch (action) {
    case 'view_product':
      return { label: 'View Product', icon: Package, className: 'bg-primary text-white hover:bg-primary-600' }
    case 'request_quote':
      return { label: 'Request Quote', icon: Send, className: 'bg-accent text-white hover:bg-orange-600' }
    case 'whatsapp_sales':
      return { label: 'WhatsApp Sales Team', icon: MessageSquareMore, className: 'bg-green-600 text-white hover:bg-green-700' }
    case 'call_sales':
      return { label: 'Call Sales', icon: Phone, className: 'bg-blue-600 text-white hover:bg-blue-700' }
    case 'email_sales':
      return { label: 'Email Sales Team', icon: Mail, className: 'bg-violet-600 text-white hover:bg-violet-700' }
    case 'notify_me':
      return { label: 'Notify Me', icon: Bell, className: 'bg-amber-500 text-white hover:bg-amber-600' }
    case 'request_product':
      return { label: 'Request Product', icon: Package, className: 'bg-primary text-white hover:bg-primary-600' }
    default:
      return { label: 'Contact Sales', icon: MessageSquare, className: 'bg-primary text-white hover:bg-primary-600' }
  }
}

function ChatActions({ actions, product }: { actions: ChatAction[]; product?: ChatProduct }) {
  if (!actions.length) return null

  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {actions.map(action => {
        const meta = actionMeta(action)
        const Icon = meta.icon
        const external = action === 'whatsapp_sales' || action === 'call_sales' || action === 'email_sales'

        return (
          <a
            key={action}
            href={actionHref(action, product)}
            target={external && action === 'whatsapp_sales' ? '_blank' : undefined}
            rel={external && action === 'whatsapp_sales' ? 'noopener noreferrer' : undefined}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[11px] font-black transition ${meta.className}`}
          >
            <Icon size={14} />
            <span>{meta.label}</span>
          </a>
        )
      })}
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse ml-auto' : 'mr-auto'} max-w-[90%]`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#F26C0C] to-orange-400 flex items-center justify-center flex-shrink-0 shadow-sm self-end mb-1">
          <Bot size={14} className="text-white" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-[#0C094D] to-indigo-750 text-white rounded-br-sm'
              : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
          }`}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
        />
        {!isUser && (
          <>
            {!!msg.products?.length && (
              <div className="space-y-2">
                {msg.products.slice(0, 2).map(product => (
                  <ProductMiniCard key={product.id || product.slug} product={product} />
                ))}
              </div>
            )}
            <ChatActions actions={msg.actions || []} product={msg.products?.[0]} />
          </>
        )}
        <span className={`text-[10px] text-gray-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {time}
        </span>
      </div>
    </div>
  )
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

type ViewType = 'home' | 'ai' | 'whatsapp' | 'call' | 'email'

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<ViewType>('home')
  
  // AI Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // WhatsApp Tab States
  const [whatsappDept, setWhatsappDept] = useState<'sales' | 'support'>('sales')
  const [whatsappMsg, setWhatsappMsg] = useState('')

  // Call Tab States
  const [businessHours, setBusinessHours] = useState({ isOpen: true, message: '' })

  // Email / Inquiry Tab States
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formType, setFormType] = useState<'general' | 'product' | 'quote' | 'partnership' | 'technical'>('general')
  const [formMsg, setFormMsg] = useState('')
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Initialise ────────────────────────────────────────────────────────────
  useEffect(() => {
    const sid = getChatSessionId()
    setSessionId(sid)
    const stored = loadChatMessages()
    if (stored.length > 0) {
      setMessages(stored)
      setHasInteracted(true)
    } else {
      setMessages([WELCOME_MESSAGE])
    }

    setBusinessHours(getBusinessStatus())
    const interval = setInterval(() => {
      setBusinessHours(getBusinessStatus())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // ── Auto Scroll ───────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => {
    if (isOpen && view === 'ai') {
      setTimeout(() => scrollToBottom(false), 50)
    }
  }, [isOpen, view, scrollToBottom])

  useEffect(() => {
    if (messages.length > 0 && isOpen && view === 'ai') {
      scrollToBottom()
    }
  }, [messages, isOpen, view, scrollToBottom])

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current
    if (!el) return
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(fromBottom > 80)
  }, [])

  // ── Open / Close Panel ───────────────────────────────────────────────────
  const handleOpen = () => {
    setIsOpen(true)
    setUnreadCount(0)
    if (view === 'ai') {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  // ── Send AI Chat Message ──────────────────────────────────────────────────
  const handleSendChat = useCallback(async (text?: string) => {
    const msg = (text ?? chatInput).trim()
    if (!msg || isChatLoading) return

    setChatInput('')
    setHasInteracted(true)

    const userMsg = makeMessage('user', msg)
    setMessages(prev => {
      const next = [...prev, userMsg]
      saveChatMessages(next)
      return next
    })
    setIsChatLoading(true)

    try {
      const response = await sendChatMessage(sessionId, msg)
      if (response.session_id && response.session_id !== sessionId) {
        setSessionId(response.session_id)
      }

      const assistantMsg = makeMessage('assistant', response.reply, null, {
        actions: response.actions || [],
        products: response.products || [],
        product_slug: response.product_slug,
        product_id: response.product_id,
      })
      setMessages(prev => {
        const next = [...prev, assistantMsg]
        saveChatMessages(next)
        return next
      })

      if (!isOpen) {
        setUnreadCount(n => n + 1)
      }
    } catch {
      const errorMsg = makeMessage(
        'assistant',
        'I am having trouble connecting right now. Please use the sales contact options below and our team will assist you.',
        null,
        { actions: ['whatsapp_sales', 'call_sales', 'email_sales'] },
      )
      setMessages(prev => {
        const next = [...prev, errorMsg]
        saveChatMessages(next)
        return next
      })
    } finally {
      setIsChatLoading(false)
    }
  }, [chatInput, isChatLoading, messages, sessionId, isOpen])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendChat()
    }
  }

  const handleResetChat = () => {
    clearChatSession()
    const newSid = getChatSessionId()
    setSessionId(newSid)
    setMessages([WELCOME_MESSAGE])
    setHasInteracted(false)
    setChatInput('')
  }

  // ── WhatsApp Direct launcher ──────────────────────────────────────────────
  const handleLaunchWhatsApp = () => {
    const defaultText = whatsappDept === 'sales'
      ? `Hello ${SITE_CONFIG.name} Sales, I would like to inquire about chemical procurement.`
      : `Hello ${SITE_CONFIG.name} Support, I have a technical or service inquiry.`
    const text = encodeURIComponent(whatsappMsg.trim() || defaultText)
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
    window.open(url, '_blank')
  }

  // ── Lead Inquiry submission ───────────────────────────────────────────────
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim() || !formMsg.trim()) {
      setFormError('Please fill in Name, Email, and Message.')
      return
    }

    setIsFormSubmitting(true)
    setFormError('')

    try {
      await submitInquiry({
        full_name: formName,
        email: formEmail,
        phone: formPhone,
        company: formCompany,
        inquiry_type: formType,
        message: formMsg,
      })

      setFormSuccess(true)
      setFormName('')
      setFormEmail('')
      setFormPhone('')
      setFormCompany('')
      setFormMsg('')
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit inquiry. Please try again.')
    } finally {
      setIsFormSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── FAB Button: Circular Orange with white three-dot bubble ─────── */}
      <button
        id="chatbot-fab"
        onClick={isOpen ? handleClose : handleOpen}
        aria-label={isOpen ? 'Close contact panel' : 'Open contact panel'}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-700 scale-90'
            : 'bg-[#F26C0C] hover:scale-110 ring-8 ring-orange-500/10 hover:shadow-[#F26C0C]/40'
        }`}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping bg-[#F26C0C]/20 pointer-events-none" />
        )}

        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageSquareMore size={26} className="text-white" />
        )}

        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#F26C0C] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ── Unified Opened Panel ────────────────────────────────────────── */}
      <div
        id="chatbot-panel"
        className={`fixed z-50 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }
        inset-0 sm:inset-auto
        sm:bottom-24 sm:right-6
        sm:w-[400px] sm:h-[590px]
        flex flex-col
        `}
      >
        <div className="flex flex-col h-full sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/25 bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60">
          
          {/* Header Bar */}
          <div className="px-5 py-4 border-b border-gray-150 dark:border-gray-800 flex justify-between items-center bg-[#0C094D] text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              {view !== 'home' && (
                <button
                  onClick={() => setView('home')}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Back to menu"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  {view === 'home' ? 'Contact Hub' : view === 'ai' ? 'AI Zara Assistant' : view === 'whatsapp' ? 'WhatsApp Direct' : view === 'call' ? 'Zenco Call Desk' : 'Chemical Inquiry Form'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${businessHours.isOpen ? 'bg-green-400' : 'bg-amber-400'}`} />
                  <p className="text-[10px] text-white/80 font-medium leading-none">
                    {businessHours.message}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body Panels */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-[#F8FAFC] dark:bg-gray-950">

            {/* ── A. Home Menu Screen (Mockup Layout) ────────────────────── */}
            {view === 'home' && (
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                  Select how you would like to reach Zenco desk:
                </p>

                <div className="flex flex-col gap-3.5">
                  {/* WhatsApp Card */}
                  <div
                    onClick={() => setView('whatsapp')}
                    className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-green-50 dark:bg-green-950/20 text-[#25D366] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone size={22} className="rotate-0" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">WhatsApp</h4>
                        <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                          Quick response for pricing, quotations, and follow-up
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase bg-emerald-500 text-white px-2.5 py-0.5 rounded-full select-none shrink-0 tracking-wider">
                      RECOMMENDED
                    </span>
                  </div>

                  {/* Call Us Card */}
                  <div
                    onClick={() => setView('call')}
                    className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/20 text-[#0066FF] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone size={21} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Call Us</h4>
                        <p className="text-[11px] text-gray-450 dark:text-gray-400 font-mono mt-0.5">
                          {PHONE_NUMBER}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase bg-[#00A859] text-white px-2.5 py-0.5 rounded-full select-none shrink-0 tracking-wider">
                      DIRECT
                    </span>
                  </div>

                  {/* Email Card */}
                  <div
                    onClick={() => setView('email')}
                    className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                  >
                    <div className="w-11 h-11 bg-purple-50 dark:bg-purple-950/20 text-[#7C3AED] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail size={21} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Email</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                        {COMPANY_EMAIL}
                      </p>
                    </div>
                  </div>

                  {/* AI Assistant Card */}
                  <div
                    onClick={() => setView('ai')}
                    className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                  >
                    <div className="w-11 h-11 bg-orange-50 dark:bg-orange-950/20 text-[#F26C0C] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bot size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">AI Assistant</h4>
                      <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                        Product guidance, quotation prep, and category discovery
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ── B. AI Chat View ─────────────────────────────────────────── */}
            {view === 'ai' && (
              <div className="flex flex-col h-full bg-white dark:bg-gray-905">
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scroll-smooth"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  {isChatLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>

                {showScrollBtn && (
                  <button
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-24 right-5 w-8 h-8 bg-white dark:bg-gray-850 shadow border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-500"
                  >
                    <ChevronDown size={16} />
                  </button>
                )}

                {hasInteracted && (
                  <div className="px-4 py-1.5 flex justify-end bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-850">
                    <button
                      onClick={handleResetChat}
                      className="text-[10px] text-gray-400 hover:text-indigo-500 flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw size={9} /> Reset Chat
                    </button>
                  </div>
                )}

                {!hasInteracted && (
                  <div className="px-3 pb-2 flex gap-1.5 flex-wrap border-t border-gray-100 dark:border-gray-850 pt-2 flex-shrink-0">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => handleSendChat(p.text)}
                        disabled={isChatLoading}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-[#0C094D] dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-100 dark:border-indigo-800 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-850 flex-shrink-0">
                  <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <textarea
                      ref={inputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Zara AI about industrial chemicals..."
                      rows={1}
                      disabled={isChatLoading}
                      className="flex-1 resize-none bg-transparent text-[13px] text-gray-800 dark:text-gray-200 outline-none max-h-24 leading-relaxed"
                    />
                    <button
                      onClick={() => handleSendChat()}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0C094D] to-indigo-650 flex items-center justify-center text-white disabled:opacity-40"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── C. WhatsApp Routing View ────────────────────────────────── */}
            {view === 'whatsapp' && (
              <div className="p-5 space-y-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-2xl p-5 text-center">
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-950/20 text-[#25D366] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone size={24} className="rotate-0" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-950 dark:text-white">Start a Live Chat</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Connect directly with our chemical sales desk or support desk in real-time.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Choose Desk
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setWhatsappDept('sales')}
                        className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                          whatsappDept === 'sales'
                            ? 'bg-[#0C094D] border-[#0C094D] text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-650'
                        }`}
                      >
                        💼 Chemical Sales
                      </button>
                      <button
                        type="button"
                        onClick={() => setWhatsappDept('support')}
                        className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                          whatsappDept === 'support'
                            ? 'bg-[#0C094D] border-[#0C094D] text-white'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-650'
                        }`}
                      >
                        🛠️ Technical Support
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Your Message
                    </label>
                    <textarea
                      value={whatsappMsg}
                      onChange={(e) => setWhatsappMsg(e.target.value)}
                      placeholder={
                        whatsappDept === 'sales'
                          ? 'I need a chemical quotation...'
                          : 'I need technical assistance with...'
                      }
                      rows={3}
                      className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none text-gray-800 dark:text-white resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleLaunchWhatsApp}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Phone size={15} />
                    <span>Launch WhatsApp Chat</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── D. Call Details View ────────────────────────────────────── */}
            {view === 'call' && (
              <div className="p-5 space-y-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-[#0066FF] flex items-center justify-center flex-shrink-0">
                      <Phone size={19} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Direct desk Hotline</p>
                      <a href={`tel:${PHONE_NUMBER}`} className="text-sm font-extrabold text-gray-900 dark:text-white hover:text-[#0066FF]">
                        Tap to call sales desk
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-[#F26C0C] flex items-center justify-center flex-shrink-0">
                      <Clock size={19} />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200">Business Hours (EAT)</p>
                      <p className="text-gray-500 dark:text-gray-400">{SITE_CONFIG.openingHours}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <MapPin size={19} />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200">Main Office</p>
                      <p className="text-gray-550 dark:text-gray-400">
                        {SITE_CONFIG.address.street}, {SITE_CONFIG.address.city}, {SITE_CONFIG.address.country}
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${PHONE_NUMBER}`}
                  className="w-full bg-gradient-to-r from-[#0C094D] to-indigo-750 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Phone size={15} />
                  <span>Call Hotline Now</span>
                </a>
              </div>
            )}

            {/* ── E. Inquiry capture Form View ─────────────────────────────── */}
            {view === 'email' && (
              <div className="p-5">
                {formSuccess ? (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-150 dark:border-green-800/30 rounded-2xl p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-green-800 dark:text-green-300">Inquiry Submitted!</h4>
                    <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                      Thank you for contacting Zenco desk. Our commercial team will check your details and reply via email within 24 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormSuccess(false)}
                      className="mt-2 text-xs font-bold text-[#0C094D] dark:text-indigo-300 underline"
                    >
                      Submit another inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-405" />
                          <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl pl-8 pr-2 py-2 outline-none dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-1">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-405" />
                          <input
                            type="email"
                            required
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            placeholder="john@company.com"
                            className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl pl-8 pr-2 py-2 outline-none dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-455 uppercase tracking-wider mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="+254..."
                          className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-455 uppercase tracking-wider mb-1">
                          Company
                        </label>
                        <div className="relative">
                          <Building size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-405" />
                          <input
                            type="text"
                            value={formCompany}
                            onChange={(e) => setFormCompany(e.target.value)}
                            placeholder="Zenco Ltd"
                            className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-255 dark:border-gray-700 rounded-xl pl-8 pr-2 py-2 outline-none dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-455 uppercase tracking-wider mb-1">
                        Inquiry Nature
                      </label>
                      <select
                        value={formType}
                        onChange={(e: any) => setFormType(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 outline-none dark:text-white"
                      >
                        <option value="general">General Corporate Inquiry</option>
                        <option value="product">Specific Product Availability</option>
                        <option value="quote">Request a Bulk Quote</option>
                        <option value="partnership">Distributor / Partnership</option>
                        <option value="technical">Chemical Technical Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-455 uppercase tracking-wider mb-1">
                        Message Details *
                      </label>
                      <textarea
                        required
                        value={formMsg}
                        onChange={(e) => setFormMsg(e.target.value)}
                        placeholder="Detail your chemical specifications, volume needs..."
                        rows={3}
                        className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 outline-none resize-none dark:text-white"
                      />
                    </div>

                    {formError && (
                      <div className="flex items-center gap-2 text-[11px] text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-150 p-2.5 rounded-xl">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isFormSubmitting}
                      className="w-full bg-[#0C094D] hover:bg-[#070533] text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50"
                    >
                      {isFormSubmitting ? 'Submitting request...' : 'Send Inquiry Message'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Mobile Overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 sm:hidden"
          onClick={handleClose}
        />
      )}
    </>
  )
}
