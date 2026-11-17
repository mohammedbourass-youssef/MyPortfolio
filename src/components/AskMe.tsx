import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MessageCircle, Send } from 'lucide-react'

type ChatMessage = { id: number; role: 'user' | 'assistant'; text: string }

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://portfolio-ai.srx-mbrs2004.workers.dev'
const MAX_LENGTH = 300
const MIN_INTERVAL = 3000
const TIMEOUT = 15000
const SUGGESTIONS = [
  'What is your tech stack?',
  'Which databases do you work with?',
  'Are you open to internships?',
  'How can I contact you?',
]
const ERRORS = {
  network: 'Network error. Please try again.',
  forbidden: '403 (service unavailable from this domain)',
  busy: 'Too many requests, try again in a minute',
  invalid: 'The service returned an empty or invalid reply. Please try again.',
  timeout: 'Request timed out. Please try again.',
  throttle: 'Please wait a moment before asking again.',
}

export default function AskMe() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const lastRequestRef = useRef(0)
  const mountedRef = useRef(true)
  const idRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ top: list.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [messages, loading])

  const nextId = () => ++idRef.current

  const addMessage = (role: ChatMessage['role'], text: string) => {
    setMessages(current => [...current, { id: nextId(), role, text }].slice(-10))
  }

  async function sendMessage(raw: string) {
    const message = raw.trim()
    if (!message || loading || abortRef.current) return
    if (message.length > MAX_LENGTH) {
      setError(`Please keep questions under ${MAX_LENGTH} characters.`)
      return
    }

    const now = Date.now()
    if (now - lastRequestRef.current < MIN_INTERVAL) {
      setError(ERRORS.throttle)
      return
    }

    setError(null)
    setInput('')
    lastRequestRef.current = now

    const controller = new AbortController()
    abortRef.current = controller
    timeoutRef.current = window.setTimeout(() => controller.abort(), TIMEOUT)
    addMessage('user', message)
    setLoading(true)

    let reply = ''
    try {
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      })

      if (response.status === 403) throw new Error('forbidden')
      if (response.status === 429 || response.status >= 500) throw new Error('busy')
      if (!response.ok) throw new Error('request')

      const data: unknown = await response.json()
      const candidate = data && typeof data === 'object' ? (data as { reply?: unknown }).reply : undefined
      if (typeof candidate !== 'string' || !candidate.trim()) throw new Error('invalid')
      reply = candidate.trim()
    } catch (cause) {
      if (!mountedRef.current) return
      if (controller.signal.aborted) reply = ERRORS.timeout
      else if (cause instanceof Error && cause.message === 'forbidden') reply = ERRORS.forbidden
      else if (cause instanceof Error && cause.message === 'busy') reply = ERRORS.busy
      else if (cause instanceof Error && cause.message === 'invalid') reply = ERRORS.invalid
      else reply = ERRORS.network
    } finally {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      abortRef.current = null
      if (mountedRef.current) setLoading(false)
    }

    if (mountedRef.current && reply) addMessage('assistant', reply)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(input)
  }

  return <section id="ask-me" className="section-wrap section-block">
    <div className="askme-card">
      <div className="section-heading askme-heading">
        <span className="eyebrow" dir="ltr"><MessageCircle size={13} aria-hidden="true" />[ SEC_01B // ASK_ME ]</span>
        <h2>Ask about me</h2>
        <p>Quick answers about my skills, studies and availability</p>
      </div>

      <div className="askme-suggestions" aria-label="Suggested questions">
        {SUGGESTIONS.map(question => <button
          className="askme-chip"
          key={question}
          type="button"
          disabled={loading}
          onClick={() => { setInput(question); void sendMessage(question) }}
        >{question}</button>)}
      </div>

      <div className="askme-messages" ref={listRef} aria-live="polite" aria-relevant="additions text">
        {messages.length === 0 && <p className="askme-empty">Ask a question to get started.</p>}
        {messages.map(message => <div className={`askme-message ${message.role}`} key={message.id}>
          <p>{message.text}</p>
        </div>)}
        {loading && <div className="askme-message assistant askme-typing" role="status">
          <span>Thinking...</span>
          <span className="askme-dots" aria-hidden="true"><i/><i/><i/></span>
        </div>}
      </div>

      {error && <p className="askme-error" role="alert">{error}</p>}

      <form className="askme-form" onSubmit={onSubmit}>
        <label className="askme-sr-only" htmlFor="askme-input">Ask a question about Mohammed</label>
        <input
          id="askme-input"
          className="askme-input"
          type="text"
          value={input}
          maxLength={MAX_LENGTH}
          placeholder="Type your question..."
          autoComplete="off"
          disabled={loading}
          onChange={event => { setInput(event.target.value); if (error) setError(null) }}
        />
        <button className="button button-primary askme-submit" type="submit" disabled={loading || !input.trim()}>
          <Send size={15} aria-hidden="true" />Send
        </button>
      </form>

      <div className="askme-meta" dir="ltr">
        <span>{input.length}/{MAX_LENGTH}</span>
        <span>LAST 5 EXCHANGES</span>
      </div>

      <p className="askme-note">AI-generated answers, may contain mistakes. For anything important, contact me directly.</p>
    </div>
  </section>
}
