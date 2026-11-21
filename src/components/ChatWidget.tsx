import { useEffect, useRef, useState } from "react";
import { translations, type Lang, type T } from "../lib/i18n";

const API = "https://portfolio-ai.srx-mbrs2004.workers.dev";
const ASSISTANT_NAME = "ASK AYUT";
const CONTACT_CHIP = "Contact";
const CONTACT_CHIP_TEXT = "How can I contact him?";
const ERROR_FORBIDDEN = "The assistant is only available on mohammedbourass.me.";
const ERROR_RATE_LIMIT = "Too many questions, please wait a minute.";
const ERROR_NETWORK = "I couldn't reach the assistant. Please try again.";
const ERROR_NO_ANSWER = "I couldn't find an answer. Please try again.";
const SPEECH_KEY = "cw-speech-bubble";
const GMAIL_COMPOSE_PATTERN = /mail\.google\.com\/mail/i;
const MOBILE_MAILTO_URL = "mailto:srx.mbrs2004@gmail.com?subject=Portfolio%20contact&body=Hi%20Mohammed%2C";

type ChatLink = { label: string; url: string };
type LinkKind = "email" | "whatsapp" | "telegram" | "linkedin" | "link";
type Msg = { role: "user" | "bot"; text: string; links?: ChatLink[]; link?: ChatLink; greeting?: boolean; error?: boolean };
type HistoryMessage = { role: "user" | "assistant"; content: string };

const SR: any =
  typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

function withAssistantName(text: string) {
  return text.replace(/\{assistant\}/g, ASSISTANT_NAME);
}

function detectVisitorLang(fallback: Lang): Lang {
  if (typeof navigator === "undefined") return fallback;
  const value = navigator.language.toLowerCase();
  if (value.startsWith("fr")) return "fr";
  if (value.startsWith("ar")) return "ar";
  return "en";
}

function isAllowedLinkUrl(url: string) {
  return /^https:\/\//i.test(url) || /^mailto:/i.test(url);
}

function normalizeLinks(raw: unknown, fallbackLabel: string): ChatLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((candidate): candidate is Record<string, unknown> => Boolean(candidate) && typeof candidate === "object")
    .map((candidate) => ({
      label: typeof candidate.label === "string" && candidate.label.trim() ? candidate.label.trim().slice(0, 80) : fallbackLabel,
      url: typeof candidate.url === "string" ? candidate.url : "",
    }))
    .filter((link) => isAllowedLinkUrl(link.url));
}

function getLinkKind(link: ChatLink): LinkKind {
  const value = link.url.toLowerCase();
  if (/^mailto:/i.test(value) || GMAIL_COMPOSE_PATTERN.test(value)) return "email";
  if (/wa\.me/i.test(value)) return "whatsapp";
  if (/t\.me/i.test(value)) return "telegram";
  if (/linkedin\.com/i.test(value)) return "linkedin";
  return "link";
}

function LinkIcon({ kind }: { kind: LinkKind }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "email") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
  if (kind === "whatsapp") return <svg {...common}><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" /><path d="M9 11h.01M15 11h.01M9 15c1.3 1.5 4.7 1.5 6 0" /></svg>;
  if (kind === "telegram") return <svg {...common}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>;
  if (kind === "linkedin") return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="3" /><text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" stroke="none">in</text></svg>;
  return <svg {...common}><path d="M10.5 13.5a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" /><path d="M13.5 10.5a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></svg>;
}

function ChatLinkButton({ link, isMobile }: { link: ChatLink; isMobile: boolean }) {
  const kind = getLinkKind(link);
  const url = isMobile && GMAIL_COMPOSE_PATTERN.test(link.url) ? MOBILE_MAILTO_URL : link.url;
  const external = /^https:\/\//i.test(url);
  return (
    <a
      className={`cw-link ${kind}`}
      href={url}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      download={/\.pdf$/i.test(url)}
    >
      <LinkIcon kind={kind} />
      <span>{link.label}</span>
    </a>
  );
}

function ChatLinkRow({ links, isMobile }: { links: ChatLink[]; isMobile: boolean }) {
  return <div className="cw-links">{links.map((link, index) => <ChatLinkButton key={`${link.url}-${index}`} link={link} isMobile={isMobile} />)}</div>;
}

export default function ChatWidget(props: { lang: Lang; t: T }) {
  const visitorLang = detectVisitorLang(props.lang);
  const chatT = translations[visitorLang];
  const locale = visitorLang === "ar" ? "ar-MA" : visitorLang === "fr" ? "fr-FR" : "en-US";
  const speechDir = visitorLang === "ar" ? "rtl" : "ltr";
  const greeting = withAssistantName(chatT.chat.greeting);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ role: "bot", text: greeting, greeting: true }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(() => new Date());
  const [speechVisible, setSpeechVisible] = useState(false);
  const [launcherPulse, setLauncherPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const lastSent = useRef(0);
  const openedRef = useRef(false);
  const started = msgs.some((message) => message.role === "user");

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    setMsgs((current) => current.some((message) => message.role === "user")
      ? current
      : [{ role: "bot", text: greeting, greeting: true }]);
  }, [greeting]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (open || openedRef.current) return;
    try { if (sessionStorage.getItem(SPEECH_KEY)) return; } catch {}
    const timer = window.setTimeout(() => {
      if (openedRef.current) return;
      setSpeechVisible(true);
      setLauncherPulse(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (!speechVisible) return;
    const timer = window.setTimeout(dismissSpeech, 12000);
    return () => window.clearTimeout(timer);
  }, [speechVisible]);
  useEffect(() => {
    if (!launcherPulse) return;
    const timer = window.setTimeout(() => setLauncherPulse(false), 800);
    return () => window.clearTimeout(timer);
  }, [launcherPulse]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function dismissSpeech() {
    setSpeechVisible(false);
    setLauncherPulse(false);
    try { sessionStorage.setItem(SPEECH_KEY, "1"); } catch {}
  }

  function closeChat() {
    setOpen(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  }

  function openChat() {
    openedRef.current = true;
    setSpeechVisible(false);
    setLauncherPulse(false);
    try { sessionStorage.setItem(SPEECH_KEY, "1"); } catch {}
    setOpen(true);
  }

  function restart() {
    setMsgs([{ role: "bot", text: greeting, greeting: true }]);
    setTime(new Date());
    setInput("");
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || loading || Date.now() - lastSent.current < 3000) return;
    lastSent.current = Date.now();

    const history: HistoryMessage[] = msgs
      .filter((message) => !message.greeting && !message.error)
      .slice(-5)
      .map((message) => ({
        role: message.role === "bot" ? "assistant" : "user",
        content: message.text.slice(0, 300),
      }));
    const messages: HistoryMessage[] = [...history, { role: "user", content: text.slice(0, 300) }];

    setMsgs((current) => [...current.slice(-19), { role: "user", text }]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });
      let payload: Record<string, unknown> | null = null;
      try {
        const parsed = await response.json();
        if (parsed && typeof parsed === "object") payload = parsed as Record<string, unknown>;
      } catch {}
      if (response.status === 400) throw new Error(chatT.chat.errors.invalid);
      if (response.status === 403) throw new Error(ERROR_FORBIDDEN);
      if (response.status === 429) {
        const workerReply = typeof payload?.reply === "string" ? payload.reply.trim() : "";
        throw new Error(workerReply || ERROR_RATE_LIMIT);
      }
      if (!response.ok) throw new Error(chatT.chat.errors.server);
      const reply = typeof payload?.reply === "string" ? payload.reply.trim() : "";
      if (!reply) throw new Error(ERROR_NO_ANSWER);
      const links = normalizeLinks(payload?.links, chatT.common.download);
      const legacyLinks = links.length ? [] : normalizeLinks(payload?.link ? [payload.link] : [], chatT.common.download);
      const allLinks = [...links, ...legacyLinks];
      setMsgs((current) => [...current, { role: "bot", text: reply, links: allLinks.length ? allLinks : undefined }]);
    } catch (error) {
      const name = error instanceof Error ? error.name : (error as { name?: string } | null)?.name;
      const message = error instanceof Error ? error.message : "";
      const errorText = name === "AbortError" || error instanceof TypeError
        ? ERROR_NETWORK
        : message || chatT.chat.errors.server;
      setMsgs((current) => [...current, { role: "bot", text: errorText, error: true }]);
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }

  function listen() {
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = locale;
    recognition.onresult = (event: any) => setInput(String(event.results[0][0].transcript).slice(0, 300));
    recognition.start();
  }

  return (
    <>
      <style>{css}</style>

      {!open && (
        <div className="cw-launch-wrap">
          {speechVisible && (
            <div className="cw-speech" role="status" dir={speechDir}>
              <button type="button" className="cw-speech-main" onClick={openChat}>
                <span className="cw-speech-text">{`${chatT.chat.speech.line1}\n${chatT.chat.speech.line2}`}</span>
              </button>
              <button
                type="button"
                className="cw-speech-close"
                aria-label={chatT.chat.a11y.dismiss}
                onClick={(event) => { event.stopPropagation(); dismissSpeech(); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
              <span className="cw-speech-tail" aria-hidden="true" />
            </div>
          )}
          <button
            ref={launcherRef}
            type="button"
            className={`cw-launcher${launcherPulse ? " pulse" : ""}`}
            aria-label={withAssistantName(chatT.chat.a11y.open)}
            onClick={openChat}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      )}

      {open && (
        <section className="cw-panel" role="dialog" aria-label={withAssistantName(chatT.chat.a11y.panel)}>
          <header className="cw-head">
            <span className="cw-avatar">AY</span>
            <div className="cw-title-wrap">
              <strong className="cw-title">{withAssistantName(chatT.chat.title)}</strong>
              <span className="cw-status" aria-hidden="true" />
            </div>
            <button type="button" className="cw-icon" aria-label={chatT.chat.a11y.restart} onClick={restart}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
            </button>
            <button type="button" className="cw-icon" aria-label={chatT.chat.a11y.close} onClick={closeChat}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </header>

          <p className="cw-notice">
            {chatT.chat.notice}{" "}
            <a href="#contact" onClick={() => setOpen(false)}>{chatT.chat.noticeLink}</a>.
          </p>

          <div className="cw-msgs" aria-live="polite">
            <div className="cw-time">
              {chatT.chat.today} {time.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
            </div>
            {msgs.map((message, index) => (
              <div key={index} className={`cw-row ${message.role}`} dir="auto">
                {message.role === "bot" && <span className="cw-assistant-name">{ASSISTANT_NAME}</span>}
                <div className={`cw-bubble ${message.role}`} dir="auto">{message.text}</div>
                {(message.links?.length || message.link) && (
                  <ChatLinkRow links={message.links?.length ? message.links : [message.link as ChatLink]} isMobile={isMobile} />
                )}
              </div>
            ))}
            {!started && (
              <div className="cw-chips">
                {chatT.chat.chips.map((chip) => (
                  <button key={chip} type="button" className="cw-chip" onClick={() => send(chip === CONTACT_CHIP ? CONTACT_CHIP_TEXT : chip)}>{chip}</button>
                ))}
              </div>
            )}
            {loading && (
              <div className="cw-row bot" role="status" aria-label={chatT.chat.a11y.thinking} dir="auto">
                <div className="cw-bubble bot cw-dots"><i /><i /><i /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="cw-input" onSubmit={(event) => { event.preventDefault(); send(input); }}>
            <input
              ref={inputRef}
              value={input}
              maxLength={300}
              onChange={(event) => setInput(event.target.value)}
              placeholder={chatT.chat.placeholder}
              aria-label={chatT.chat.a11y.question}
              disabled={loading}
              dir="auto"
            />
            {input.length > 250 && <span className="cw-count">{input.length}/300</span>}
            {SR && (
              <button type="button" className="cw-icon" aria-label={chatT.chat.a11y.voice} onClick={listen}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></svg>
              </button>
            )}
            <button type="submit" className="cw-send" aria-label={chatT.chat.a11y.send} disabled={loading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
        </section>
      )}
    </>
  );
}

const css = `
.cw-launch-wrap{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.cw-launcher{width:58px;height:58px;border-radius:50%;border:0;background:#2dd4bf;color:#04201c;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.4);transition:transform .2s,box-shadow .2s}
.cw-launcher:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 14px 34px rgba(45,212,191,.28)}
.cw-launcher.pulse{animation:cw-launcher-pulse .8s ease-out 1}
@keyframes cw-launcher-pulse{0%{box-shadow:0 10px 28px rgba(0,0,0,.4)}45%{box-shadow:0 0 0 12px rgba(45,212,191,.22),0 14px 34px rgba(0,0,0,.45)}100%{box-shadow:0 10px 28px rgba(0,0,0,.4)}}
.cw-speech{position:relative;width:max-content;max-width:min(280px,calc(100vw - 48px));border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--text);box-shadow:var(--shadow);animation:cw-speech-in .55s cubic-bezier(.2,.8,.3,1.2) both}
.cw-speech-main{display:block;width:100%;padding:13px 34px 13px 14px;border:0;background:transparent;color:inherit;text-align:start;cursor:pointer;font:500 14px/1.5 Inter,Cairo,sans-serif}
.cw-speech[dir=rtl] .cw-speech-main{padding:13px 14px 13px 34px;text-align:right}
.cw-speech-text{display:block;white-space:pre-line}
.cw-speech-close{position:absolute;top:7px;inset-inline-end:7px;width:22px;height:22px;display:grid;place-items:center;padding:0;border:1px solid var(--line);border-radius:50%;background:var(--surface-2);color:var(--muted);cursor:pointer}
.cw-speech-close:hover{color:var(--accent);border-color:var(--accent)}
.cw-speech-tail{position:absolute;right:22px;bottom:-7px;width:13px;height:13px;background:var(--surface);border-right:1px solid var(--line);border-bottom:1px solid var(--line);transform:rotate(45deg)}
.cw-speech button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@keyframes cw-speech-in{0%{opacity:0;transform:translateY(16px) scale(.96)}55%{opacity:1;transform:translateY(-5px) scale(1.02)}78%{transform:translateY(2px) scale(.99)}100%{opacity:1;transform:none}}
.cw-panel{position:fixed;right:16px;bottom:16px;z-index:9999;width:380px;max-height:640px;height:min(640px,calc(100dvh - 32px));display:flex;flex-direction:column;background:#11141b;color:#e8ecf3;border:1px solid rgba(255,255,255,.1);border-radius:24px;box-shadow:0 24px 70px rgba(0,0,0,.55);overflow:hidden;animation:cw-pop .22s ease;font-family:inherit}
.cw-head{display:flex;align-items:center;gap:10px;padding:14px 14px 12px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
.cw-avatar{width:36px;height:36px;border-radius:50%;background:#2dd4bf;color:#04201c;display:grid;place-items:center;font-weight:700;font-size:13px;flex:none}
.cw-title-wrap{flex:1;min-width:0;display:flex;align-items:center;gap:8px}
.cw-title{flex:1;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cw-status{width:7px;height:7px;border-radius:50%;background:#2dd4bf;box-shadow:0 0 0 3px rgba(45,212,191,.16);flex:none}
.cw-icon{background:none;border:0;color:#aab3c2;cursor:pointer;padding:6px;border-radius:8px;display:grid;place-items:center;flex:none}
.cw-icon:hover{color:#fff;background:rgba(255,255,255,.08)}
.cw-notice{margin:0;padding:10px 16px;font-size:12px;line-height:1.45;color:#a2abbb;border-bottom:1px solid rgba(255,255,255,.06)}
.cw-notice a{color:#a2abbb;text-decoration:underline}
.cw-notice a:hover{color:#2dd4bf}
.cw-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.cw-time{text-align:center;font-size:12px;color:#8b95a7;margin-bottom:4px}
.cw-row{display:flex;flex-direction:column;gap:6px;max-width:85%}
.cw-row.user{align-self:flex-end;align-items:flex-end}
.cw-row.bot{align-self:flex-start;align-items:flex-start}
.cw-row[dir=rtl].user{align-self:flex-start;align-items:flex-start}
.cw-row[dir=rtl].bot{align-self:flex-end;align-items:flex-end}
.cw-assistant-name{font-size:11px;line-height:1.2;color:#a2abbb;font-weight:600;margin-bottom:-2px}
.cw-bubble{padding:10px 14px;border-radius:16px;font-size:15px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
.cw-bubble.bot{background:#1b2130;border:1px solid rgba(255,255,255,.07)}
.cw-bubble.user{background:#2dd4bf;color:#04201c}
.cw-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.cw-row[dir=rtl] .cw-links{justify-content:flex-end}
.cw-link{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:#fff;color:#111;text-decoration:none;border:1px solid transparent;border-radius:999px;padding:8px 14px;font-size:14px;font-weight:600;transition:background .18s,border-color .18s,transform .18s}
.cw-link svg{flex:none}
.cw-link:hover{transform:translateY(-1px)}
.cw-link:focus-visible{outline:2px solid #2dd4bf;outline-offset:2px}
.cw-link.whatsapp{background:rgba(37,211,102,.14);color:#b8f7cd;border-color:rgba(37,211,102,.32)}
.cw-link.telegram{background:rgba(56,178,236,.14);color:#bfe9ff;border-color:rgba(56,178,236,.32)}
.cw-link.email{background:rgba(167,139,250,.14);color:#ddd3ff;border-color:rgba(167,139,250,.32)}
.cw-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
.cw-chip{background:transparent;color:#e8ecf3;border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:8px 14px;font-size:14px;cursor:pointer;transition:background .18s,border-color .18s}
.cw-chip:hover{background:rgba(45,212,191,.12);border-color:#2dd4bf}
.cw-dots{display:flex;gap:5px;padding:14px}
.cw-dots i{width:7px;height:7px;border-radius:50%;background:#8b95a7;animation:cw-blink 1.2s infinite}
.cw-dots i:nth-child(2){animation-delay:.2s}.cw-dots i:nth-child(3){animation-delay:.4s}
.cw-input{display:flex;align-items:center;gap:6px;margin:10px 14px 14px;padding:8px 8px 8px 16px;background:#1b2130;border:1px solid rgba(255,255,255,.1);border-radius:999px}
.cw-input:focus-within{border-color:#2dd4bf}
.cw-input input{flex:1;min-width:0;background:none;border:0;outline:none;color:inherit;font-size:15px}
.cw-count{font-size:11px;color:#8b95a7}
.cw-send{width:36px;height:36px;border-radius:50%;border:0;background:#2dd4bf;color:#04201c;display:grid;place-items:center;cursor:pointer;flex:none}
.cw-send:disabled{opacity:.4;cursor:default}
.cw-panel button:focus-visible,.cw-launcher:focus-visible{outline:2px solid #fff;outline-offset:2px}
@keyframes cw-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes cw-blink{0%,80%,100%{opacity:.25}40%{opacity:1}}
@media (max-width:480px){.cw-panel{right:12px;left:12px;bottom:12px;width:auto;height:calc(100dvh - 24px);max-height:none}.cw-launch-wrap{right:12px;bottom:12px;gap:12px}.cw-speech{max-width:calc(100vw - 48px)}}
@media (prefers-reduced-motion:reduce){.cw-panel,.cw-speech,.cw-launcher,.cw-launcher.pulse,.cw-chip{animation:none;transition:none}.cw-dots i{animation:none}}
`;
