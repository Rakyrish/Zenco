/**
 * Zenco Systems Ltd – Chatbot API Client
 * Handles session management, message storage and API calls.
 * All OpenAI calls go through the backend — NO API keys are exposed here.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000/api'
const SESSION_KEY = 'zenco_chat_session_id'
const MESSAGES_KEY = 'zenco_chat_messages'
const MAX_LOCAL_MESSAGES = 50

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  escalation_link?: string | null
}

export interface ChatResponse {
  session_id: string
  reply: string
  escalation_link: string | null
  lead_intent: boolean
}

// ─── Session helpers ──────────────────────────────────────────────────────────

function generateSessionId(): string {
  return `z-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getChatSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId()
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = generateSessionId()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function clearChatSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(MESSAGES_KEY)
}

// ─── Message persistence ──────────────────────────────────────────────────────

export function saveChatMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return
  try {
    const toSave = messages.slice(-MAX_LOCAL_MESSAGES)
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(toSave))
  } catch {
    // Storage full — skip
  }
}

export function loadChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MESSAGES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
  } catch {
    return []
  }
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  sessionId: string,
  message: string,
  sourcePage?: string,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/ai/chatbot/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      source_page: sourcePage || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    }),
  })

  if (!res.ok) {
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}))
      return {
        session_id: sessionId,
        reply: data.reply || 'Too many messages. Please wait a moment and try again.',
        escalation_link: null,
        lead_intent: false,
      }
    }
    throw new Error(`Chat API error: ${res.status}`)
  }

  return res.json() as Promise<ChatResponse>
}

// ─── Message factory ──────────────────────────────────────────────────────────

export function makeMessage(
  role: 'user' | 'assistant',
  content: string,
  escalation_link?: string | null,
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    content,
    timestamp: Date.now(),
    escalation_link,
  }
}
