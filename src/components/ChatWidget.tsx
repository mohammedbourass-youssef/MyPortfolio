import { useEffect, useRef, useState } from "react";
import type { Lang, T } from "../lib/i18n";

const API = "https://portfolio-ai.srx-mbrs2004.workers.dev";
const SPEECH_KEY = "cw-speech-bubble";

type Msg = { role: "user" | "bot"; text: string; link?: { label: string; url: string } };

const SR: any =
  typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

export default function ChatWidget({ lang, t }: { lang: Lang; t: T }) {
  const locale = lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-FR" : "en-US";
  const speechDir = lang === "ar" ? "rtl" : "ltr";
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: t.chat.greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(() => new Date());
  const [speechVisible, setSpeechVisible] = useState(false);
  const [launcherPulse, setLauncherPulse] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const lastSent = useRef(0);
  const openedRef = useRef(false);
  const started = msgs.some((message) => message.role === "user");

  useEffect(() => {
    setMsgs((current) => current.some((message) => message.role === "user")
      ? current
      : [{ role: "bot", text: t.chat.greeting }]);
  }, [lang, t.chat.greeting]);

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
    setMsgs([{ role: "bot", text: t.chat.greeting }]);
    setTime(new Date());
    setInput("");
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || loading || Date.now() - lastSent.current < 3000) return;
    lastSent.current = Date.now();

    setMsgs((current) => [...current.slice(-19), { role: "user", text }]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      if (response.status === 400) throw new Error(t.chat.errors.invalid);
      if (response.status === 403) throw new Error(t.chat.errors.forbidden);
      if (response.status === 429) throw new Error(t.chat.errors.rateLimit);
      if (!response.ok) throw new Error(t.chat.errors.server);
      const data = await response.json();
      if (!data?.reply) throw new Error(t.chat.errors.noAnswer);
      const rawLink = data.link;
      const link = rawLink && typeof rawLink.url === "string" && /^https?:\/\//i.test(rawLink.url)
        ? { label: typeof rawLink.label === "string" ? rawLink.label : t.common.download, url: rawLink.url }
        : undefined;
      setMsgs((current) => [...current, { role: "bot", text: data.reply, link }]);
    } catch (error) {
      const name = error instanceof Error ? error.name : (error as { name?: string } | null)?.name;
      const message = error instanceof Error ? error.message : "";
      const text = name === "AbortError" || error instanceof TypeError
        ? t.chat.errors.network
        : message || t.chat.errors.server;
      setMsgs((current) => [...current, { role: "bot", text }]);
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
                <span className="cw-speech-text">{`${t.chat.speech.line1}\n${t.chat.speech.line2}`}</span>
              </button>
              <button
                type="button"
                className="cw-speech-close"
                aria-label={t.chat.a11y.dismiss}
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
            aria-label={t.chat.a11y.open}
            onClick={openChat}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      )}

      {open && (
        <section className="cw-panel" role="dialog" aria-label={t.chat.a11y.panel}>
          <header className="cw-head">
            <span className="cw-avatar">MB</span>
            <div className="cw-title-wrap">
              <strong className="cw-title">{t.chat.title}</strong>
              <span className="cw-status" aria-hidden="true" />
            </div>
            <button type="button" className="cw-icon" aria-label={t.chat.a11y.restart} onClick={restart}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
            </button>
            <button type="button" className="cw-icon" aria-label={t.chat.a11y.close} onClick={closeChat}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </header>

          <p className="cw-notice">
            {t.chat.notice}{" "}
            <a href="#contact" onClick={() => setOpen(false)}>{t.chat.noticeLink}</a>.
          </p>

          <div className="cw-msgs" aria-live="polite">
            <div className="cw-time">
              {t.chat.today} {time.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
            </div>
            {msgs.map((message, index) => (
              <div key={index} className={`cw-row ${message.role}`}>
                <div className={`cw-bubble ${message.role}`} dir="auto">{message.text}</div>
                {message.link && (
                  <a className="cw-link" href={message.link.url} target="_blank" rel="noopener noreferrer" download>
                    {message.link.label}
                  </a>
                )}
              </div>
            ))}
            {!started && (
              <div className="cw-chips">
                {t.chat.chips.map((chip) => (
                  <button key={chip} type="button" className="cw-chip" onClick={() => send(chip)}>{chip}</button>
                ))}
              </div>
            )}
            {loading && (
              <div className="cw-row bot" role="status" aria-label={t.chat.a11y.thinking}>
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
              placeholder={t.chat.placeholder}
              aria-label={t.chat.a11y.question}
              disabled={loading}
              dir="auto"
            />
            {input.length > 250 && <span className="cw-count">{input.length}/300</span>}
            {SR && (
              <button type="button" className="cw-icon" aria-label={t.chat.a11y.voice} onClick={listen}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></svg>
              </button>
            )}
            <button type="submit" className="cw-send" aria-label={t.chat.a11y.send} disabled={loading || !input.trim()}>
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
.cw-bubble{padding:10px 14px;border-radius:16px;font-size:15px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
.cw-bubble.bot{background:#1b2130;border:1px solid rgba(255,255,255,.07)}
.cw-bubble.user{background:#2dd4bf;color:#04201c}
.cw-link{display:inline-block;background:#fff;color:#111;text-decoration:none;border-radius:999px;padding:8px 16px;font-size:14px;font-weight:600}
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
