import { useEffect, useRef, useState } from "react";

const API = "https://portfolio-ai.srx-mbrs2004.workers.dev";
const CHIPS = ["Explore projects", "Tech stack", "Download your CV", "Are you open to internships?", "Contact"];
const GREETING = "Hi there, I'm here to help! Ask me anything about Mohammed's skills, projects or availability.";

type Msg = { role: "user" | "bot"; text: string; link?: { label: string; url: string } };

const SR: any =
  typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(() => new Date());
  const [hint, setHint] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSent = useRef(0);
  const started = msgs.some((m) => m.role === "user");

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    try { if (sessionStorage.getItem("chat-hint")) return; } catch {}
    const t = setTimeout(() => setHint(true), 4000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function dismissHint() {
    setHint(false);
    try { sessionStorage.setItem("chat-hint", "1"); } catch {}
  }

  function restart() {
    setMsgs([{ role: "bot", text: GREETING }]);
    setTime(new Date());
    setInput("");
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || loading) return;
    if (Date.now() - lastSent.current < 3000) return;
    lastSent.current = Date.now();

    setMsgs((m) => [...m.slice(-19), { role: "user", text }]);
    setInput("");
    setLoading(true);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: ctrl.signal,
      });
      if (r.status === 403) throw new Error("The assistant is only available on mohammedbourass.me.");
      if (r.status === 429) throw new Error("Too many questions, please wait a minute.");
      if (!r.ok) throw new Error("Something went wrong on my side.");
      const data = await r.json();
      if (!data?.reply) throw new Error("I couldn't find an answer. Please try again.");
      setMsgs((m) => [...m, { role: "bot", text: data.reply, link: data.link }]);
    } catch (e: any) {
      const msg = e?.name === "AbortError" || e instanceof TypeError
        ? "I couldn't reach the assistant. Please try again."
        : e.message;
      setMsgs((m) => [...m, { role: "bot", text: msg }]);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  function listen() {
    if (!SR) return;
    const rec = new SR();
    rec.lang = navigator.language;
    rec.onresult = (e: any) => setInput(String(e.results[0][0].transcript).slice(0, 300));
    rec.start();
  }

  return (
    <>
      <style>{css}</style>

      {!open && (
        <div className="cw-launch-wrap">
          {hint && (
            <button type="button" className="cw-hint" onClick={() => { dismissHint(); setOpen(true); }}>
              Ask me about Mohammed
            </button>
          )}
          <button
            type="button"
            className="cw-launcher"
            aria-label="Open chat with Mohammed's assistant"
            onClick={() => { dismissHint(); setOpen(true); }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      )}

      {open && (
        <section className="cw-panel" role="dialog" aria-label="Chat with Mohammed's assistant">
          <header className="cw-head">
            <span className="cw-avatar">MB</span>
            <strong className="cw-title">Mohammed's Assistant</strong>
            <button type="button" className="cw-icon" aria-label="Restart conversation" onClick={restart}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
            </button>
            <button type="button" className="cw-icon" aria-label="Close chat" onClick={() => setOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </header>

          <p className="cw-notice">
            This is an AI-powered assistant. Answers may contain mistakes. For anything important,{" "}
            <a href="#contact" onClick={() => setOpen(false)}>contact Mohammed directly</a>.
          </p>

          <div className="cw-msgs" aria-live="polite">
            <div className="cw-time">
              Today {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            {msgs.map((m, i) => (
              <div key={i} className={`cw-row ${m.role}`}>
                <div className={`cw-bubble ${m.role}`} dir="auto">{m.text}</div>
                {m.link && (
                  <a className="cw-link" href={m.link.url} target="_blank" rel="noopener noreferrer" download>
                    {m.link.label}
                  </a>
                )}
              </div>
            ))}
            {!started && (
              <div className="cw-chips">
                {CHIPS.map((c) => (
                  <button key={c} type="button" className="cw-chip" onClick={() => send(c)}>{c}</button>
                ))}
              </div>
            )}
            {loading && (
              <div className="cw-row bot"><div className="cw-bubble bot cw-dots"><i /><i /><i /></div></div>
            )}
            <div ref={endRef} />
          </div>

          <form className="cw-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input
              ref={inputRef}
              value={input}
              maxLength={300}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything"
              aria-label="Your question"
              disabled={loading}
              dir="auto"
            />
            {input.length > 250 && <span className="cw-count">{input.length}/300</span>}
            {SR && (
              <button type="button" className="cw-icon" aria-label="Voice input" onClick={listen}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></svg>
              </button>
            )}
            <button type="submit" className="cw-send" aria-label="Send" disabled={loading || !input.trim()}>
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
.cw-launcher{width:58px;height:58px;border-radius:50%;border:0;background:#2dd4bf;color:#04201c;display:grid;place-items:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:transform .2s}
.cw-launcher:hover{transform:scale(1.06)}
.cw-hint{background:#fff;color:#111;border:0;border-radius:14px;padding:8px 14px;font-size:14px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25);animation:cw-pop .3s ease}
.cw-panel{position:fixed;right:16px;bottom:16px;z-index:9999;width:380px;max-height:640px;height:min(640px,calc(100dvh - 32px));display:flex;flex-direction:column;background:#11141b;color:#e8ecf3;border:1px solid rgba(255,255,255,.08);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden;animation:cw-pop .22s ease;font-family:inherit}
.cw-head{display:flex;align-items:center;gap:10px;padding:14px 14px 12px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
.cw-avatar{width:36px;height:36px;border-radius:50%;background:#2dd4bf;color:#04201c;display:grid;place-items:center;font-weight:700;font-size:13px}
.cw-title{flex:1;font-size:17px}
.cw-icon{background:none;border:0;color:#aab3c2;cursor:pointer;padding:6px;border-radius:8px;display:grid;place-items:center}
.cw-icon:hover{color:#fff;background:rgba(255,255,255,.08)}
.cw-notice{margin:0;padding:10px 16px;font-size:12px;line-height:1.45;color:#8b95a7;border-bottom:1px solid rgba(255,255,255,.06)}
.cw-notice a{color:#8b95a7;text-decoration:underline}
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
.cw-chip{background:transparent;color:#e8ecf3;border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:8px 14px;font-size:14px;cursor:pointer}
.cw-chip:hover{background:rgba(255,255,255,.08)}
.cw-dots{display:flex;gap:5px;padding:14px}
.cw-dots i{width:7px;height:7px;border-radius:50%;background:#8b95a7;animation:cw-blink 1.2s infinite}
.cw-dots i:nth-child(2){animation-delay:.2s}.cw-dots i:nth-child(3){animation-delay:.4s}
.cw-input{display:flex;align-items:center;gap:6px;margin:10px 14px 14px;padding:8px 8px 8px 16px;background:#1b2130;border:1px solid rgba(255,255,255,.1);border-radius:999px}
.cw-input input{flex:1;min-width:0;background:none;border:0;outline:none;color:inherit;font-size:15px}
.cw-input:focus-within{border-color:#2dd4bf}
.cw-count{font-size:11px;color:#8b95a7}
.cw-send{width:36px;height:36px;border-radius:50%;border:0;background:#2dd4bf;color:#04201c;display:grid;place-items:center;cursor:pointer}
.cw-send:disabled{opacity:.4;cursor:default}
.cw-panel button:focus-visible,.cw-launcher:focus-visible{outline:2px solid #fff;outline-offset:2px}
@keyframes cw-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes cw-blink{0%,80%,100%{opacity:.25}40%{opacity:1}}
@media (max-width:480px){.cw-panel{right:12px;left:12px;bottom:12px;width:auto;height:calc(100dvh - 24px);max-height:none}}
@media (prefers-reduced-motion:reduce){.cw-panel,.cw-hint,.cw-launcher{animation:none;transition:none}.cw-dots i{animation:none}}
`;
