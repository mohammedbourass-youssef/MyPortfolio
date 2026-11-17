import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { MessageCircle, Mic, RotateCcw, Send, Sparkles, X } from 'lucide-react'

type ResponseLink = { label: string; url: string }
type ChatMessage = { id: number; role: 'assistant' | 'user'; text: string; link?: ResponseLink }
type SpeechResultLike = { 0: { transcript: string } }
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechResultLike>; resultIndex: number }
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://portfolio-ai.srx-mbrs2004.workers.dev'
const USING_DEFAULT_API = !import.meta.env.VITE_AI_API_URL
const MAX_LENGTH = 300
const MIN_INTERVAL = 3000
const TIMEOUT = 15000
const HINT_KEY = 'chat-widget-hint-seen'
const GREETING = "Hi there, I'm here to help! Ask me anything about Mohammed's skills, projects or availability."
const QUICK_REPLIES = ['Explore projects', 'Tech stack', 'Download your CV', 'Are you open to internships?', 'Contact']
const ERRORS = {
  network: "I couldn't reach the assistant. Please try again.",
  forbidden: 'The assistant is only available on mohammedbourass.me.',
  limited: 'Too many questions, please wait a minute.',
  server: 'Something went wrong on my side.',
  empty: "I didn't get an answer. Please try again.",
  long: `Please keep your question under ${MAX_LENGTH} characters.`,
  throttle: 'Please wait a few seconds before asking again.',
}

function todayLabel() {
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date())
  return `Today ${time.replace(/\s?(AM|PM)/gi, value => value.toLowerCase())}`
}

function isCvLink(link: ResponseLink) {
  return /cv|resume|résumé|D_ENGLISH|CV_FRENSH/i.test(`${link.label} ${link.url}`)
}

function renderPlainText(text: string): ReactNode[] {
  return text.split(/(\bhttps?:\/\/[^\s<>"']+)/gi).map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return part
    const clean = part.replace(/[.,!?;:)\]]+$/, '')
    const tail = part.slice(clean.length)
    try {
      const url = new URL(clean)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return part
      return <Fragment key={index}><a href={url.href} target="_blank" rel="noopener noreferrer">{clean}</a>{tail}</Fragment>
    } catch {
      return part
    }
  })
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [stamp, setStamp] = useState(() => todayLabel())
  const [activeLink, setActiveLink] = useState<(ResponseLink & { messageId: number }) | null>(null)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [listening, setListening] = useState(false)

  const idRef = useRef(0)
  const requestRef = useRef(0)
  const lastRequestRef = useRef(0)
  const inflightRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const addMessage = useCallback((role: ChatMessage['role'], text: string, link?: ResponseLink) => {
    const id = ++idRef.current
    setMessages(current => [...current, { id, role, text, link }].slice(-20))
    return id
  }, [])

  const greeting = useCallback(() => {
    requestRef.current += 1
    if (abortRef.current) abortRef.current.abort()
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    abortRef.current = null
    inflightRef.current = false
    lastRequestRef.current = 0
    setLoading(false)
    setInput('')
    setActiveLink(null)
    setStamp(todayLabel())
    setMessages([{ id: ++idRef.current, role: 'assistant', text: GREETING }])
  }, [])

  useEffect(() => {
    mountedRef.current = true
    greeting()
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [greeting])

  useEffect(() => {
    let seen = false
    try { seen = sessionStorage.getItem(HINT_KEY) === '1' } catch {}
    if (seen) return
    const timer = window.setTimeout(() => setHintVisible(true), 4000)
    return () => window.clearTimeout(timer)
  }, [])

  const dismissHint = useCallback(() => {
    setHintVisible(false)
    try { sessionStorage.setItem(HINT_KEY, '1') } catch {}
  }, [])

  const closeChat = useCallback(() => {
    setOpen(false)
    window.setTimeout(() => launcherRef.current?.focus(), 0)
  }, [])

  const openChat = useCallback(() => {
    dismissHint()
    setOpen(true)
  }, [dismissHint])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeChat()
        return
      }
      if (event.key !== 'Tab' || !window.matchMedia('(max-width: 479px)').matches || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(element => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, closeChat])

  useEffect(() => {
    if (!open) return
    const list = listRef.current
    if (!list) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ top: list.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [messages, loading, open])

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Recognition) return
    setVoiceSupported(true)
    const recognition = new Recognition()
    recognition.lang = navigator.language || 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = event => {
      let transcript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const alternative = event.results[index]?.[0]
        if (alternative) transcript += alternative.transcript
      }
      const value = transcript.trim().slice(0, MAX_LENGTH)
      if (value) setInput(current => `${current} ${value}`.trim().slice(0, MAX_LENGTH))
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try { recognition.stop() } catch {}
      recognitionRef.current = null
    }
  }, [])

  const toggleVoice = () => {
    const recognition = recognitionRef.current
    if (!recognition) return
    if (listening) {
      try { recognition.stop() } catch {}
      setListening(false)
      return
    }
    try {
      recognition.lang = navigator.language || 'en-US'
      recognition.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }

  const sendMessage = useCallback(async (raw: string) => {
    const text = raw.trim()
    if (!text || loading || inflightRef.current) return

    if (text.length > MAX_LENGTH) {
      addMessage('assistant', ERRORS.long)
      return
    }

    const now = Date.now()
    if (now - lastRequestRef.current < MIN_INTERVAL) {
      addMessage('assistant', ERRORS.throttle)
      return
    }

    lastRequestRef.current = now
    setInput('')
    setActiveLink(null)

    const requestId = ++requestRef.current
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT)
    abortRef.current = controller
    timeoutRef.current = timeoutId
    inflightRef.current = true
    addMessage('user', text)
    setLoading(true)

    let reply = ''
    let link: ResponseLink | null = null
    try {
      if (USING_DEFAULT_API && window.location.hostname !== 'mohammedbourass.me') throw new Error('forbidden')

      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      })

      if (response.status === 403) throw new Error('forbidden')
      if (response.status === 429) throw new Error('limited')
      if (response.status >= 500) throw new Error('server')
      if (!response.ok) throw new Error('network')

      const data: unknown = await response.json()
      const record = data && typeof data === 'object' ? data as { reply?: unknown; link?: unknown } : null
      const candidate = record?.reply
      if (typeof candidate !== 'string' || !candidate.trim()) throw new Error('empty')
      reply = candidate.trim()

      const rawLink = record?.link
      if (rawLink && typeof rawLink === 'object') {
        const value = rawLink as { label?: unknown; url?: unknown }
        if (typeof value.label === 'string' && typeof value.url === 'string') {
          try {
            const parsed = new URL(value.url)
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') link = { label: value.label, url: parsed.href }
          } catch {}
        }
      }
    } catch (cause) {
      if (requestId !== requestRef.current || !mountedRef.current) return
      if (cause instanceof Error && cause.message === 'forbidden') reply = ERRORS.forbidden
      else if (cause instanceof Error && cause.message === 'limited') reply = ERRORS.limited
      else if (cause instanceof Error && cause.message === 'server') reply = ERRORS.server
      else if (cause instanceof Error && cause.message === 'empty') reply = ERRORS.empty
      else reply = ERRORS.network
    } finally {
      if (timeoutRef.current === timeoutId) {
        window.clearTimeout(timeoutId)
        timeoutRef.current = null
      }
      if (abortRef.current === controller) {
        abortRef.current = null
        inflightRef.current = false
        if (mountedRef.current) setLoading(false)
      }
    }

    if (requestId !== requestRef.current || !mountedRef.current || !reply) return
    const messageId = addMessage('assistant', reply, link ?? undefined)
    if (link) setActiveLink({ ...link, messageId })
  }, [addMessage, loading])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(input)
  }

  const hasUserMessage = messages.some(message => message.role === 'user')

  return <>
    {hintVisible && !open && <button className="chat-hint" type="button" onClick={dismissHint}>
      <span className="chat-hint-dot" />Ask me about Mohammed
    </button>}

    <button ref={launcherRef} className="chat-launcher" type="button" aria-label="Open chat with Mohammed's assistant" onClick={openChat}>
      <MessageCircle size={23} aria-hidden="true" />
    </button>

    <div ref={panelRef} className={`chat-panel${open ? ' open' : ''}`} role="dialog" aria-label="Mohammed's Assistant" aria-hidden={!open}>
      <header className="chat-header">
        <span className="chat-avatar" aria-hidden="true"><Sparkles size={17} /></span>
        <div className="chat-identity"><strong>Mohammed's Assistant</strong><span>Ask about skills, projects or availability</span></div>
        <button className="chat-icon-button" type="button" aria-label="Restart conversation" onClick={greeting}><RotateCcw size={16} /></button>
        <button className="chat-icon-button" type="button" aria-label="Close chat" onClick={closeChat}><X size={18} /></button>
      </header>

      <p className="chat-notice">This is an AI-powered assistant. Answers may contain mistakes. For anything important, <a href="#contact" onClick={closeChat}>contact Mohammed directly</a>.</p>

      <div className="chat-messages" ref={listRef} aria-live="polite" aria-relevant="additions text">
        <p className="chat-timestamp">{stamp}</p>
        {messages.map(message => <Fragment key={message.id}>
          <div className={`chat-row ${message.role}`}>
            <div className={`chat-bubble ${message.role}`} dir="auto">{renderPlainText(message.text)}</div>
          </div>
          {activeLink?.messageId === message.id && <div className={`chat-row ${message.role}`}>
            <a className={`chat-link${isCvLink(activeLink) ? ' download' : ''}`} href={activeLink.url} target="_blank" rel="noopener noreferrer" {...(isCvLink(activeLink) ? { download: '' } : {})}>
              {activeLink.label}
            </a>
          </div>}
        </Fragment>)}
        {loading && <div className="chat-row assistant">
          <div className="chat-bubble assistant chat-typing" role="status" aria-label="Thinking">
            <i/><i/><i/>
          </div>
        </div>}
      </div>

      {!hasUserMessage && <div className="chat-quick" aria-label="Suggested questions">
        {QUICK_REPLIES.map(question => <button className="chat-quick-chip" type="button" key={question} onClick={() => { void sendMessage(question) }}>{question}</button>)}
      </div>}

      <form className="chat-composer" onSubmit={onSubmit}>
        {voiceSupported && <button className="chat-icon-button chat-mic" type="button" aria-label={listening ? 'Stop voice input' : 'Start voice input'} aria-pressed={listening} onClick={toggleVoice}><Mic size={16} /></button>}
        <label className="chat-sr-only" htmlFor="chat-input">Message Mohammed's assistant</label>
        <input
          id="chat-input"
          ref={inputRef}
          className="chat-input"
          type="text"
          value={input}
          maxLength={MAX_LENGTH}
          placeholder="Ask anything"
          autoComplete="off"
          disabled={loading}
          onChange={event => setInput(event.target.value)}
        />
        {input.length >= MAX_LENGTH - 40 && <span className="chat-counter" dir="ltr">{input.length}/{MAX_LENGTH}</span>}
        <button className="chat-send" type="submit" aria-label="Send message" disabled={loading || !input.trim()}><Send size={16} aria-hidden="true" /></button>
      </form>
    </div>
  </>
}
