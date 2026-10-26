import { useEffect, useRef, type CSSProperties } from 'react'
import type { Lang, T } from '../lib/i18n'

const quoteWords = [
  { text: 'Most' }, { text: 'good' }, { text: 'programmers' }, { text: 'do' }, { text: 'programming' }, { text: 'not' }, { text: 'because' }, { text: 'they' }, { text: 'expect' }, { text: 'to' }, { text: 'get' }, { text: 'paid', style: 'quote-struck' }, { text: 'or' }, { text: 'get' }, { text: 'adulation', style: 'quote-struck' }, { text: 'by' }, { text: 'the' }, { text: 'public,' }, { text: 'but' }, { text: 'because' }, { text: 'it' }, { text: 'is' }, { text: 'fun', style: 'quote-fun' }, { text: 'to' }, { text: 'program.' }
]

export default function QuoteSection({ lang, t }: { lang: Lang; t: T }) {
  const sectionRef = useRef<HTMLElement>(null)
  const markRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      section.classList.add('is-active')
      return
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .4)) {
        section.classList.add('is-active')
        observer.disconnect()
      }
    }, { threshold: [.4] })
    observer.observe(section)
    const parallax = () => {
      const bounds = section.getBoundingClientRect()
      const offset = (bounds.top + bounds.height / 2 - window.innerHeight / 2) * -.025
      markRef.current?.style.setProperty('--quote-parallax', `${offset}px`)
    }
    window.addEventListener('scroll', parallax, { passive: true })
    parallax()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', parallax)
    }
  }, [])

  return <section className="quote-section" ref={sectionRef}>
    <div className="quote-content">
      <span className="quote-eyebrow" dir="ltr">[ SEC_06 // PHILOSOPHY ]</span>
      <div className="quote-mark-parallax" aria-hidden="true"><span className="quote-mark" ref={markRef}>“</span></div>
      <blockquote className="quote-english" dir="ltr" aria-label={t.quote.text}>
        <p className="quote-text" aria-hidden="true">{quoteWords.map((part, index) =>
          <span key={`${part.text}-${index}`} className={`quote-word ${part.style || ''}`} style={{ '--word-index': index } as CSSProperties}>{part.text}</span>
        )}</p>
      </blockquote>
      {lang !== 'en' && <p className="quote-translation" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{lang === 'fr' ? t.quote.fr : t.quote.ar}</p>}
      <div className="quote-attribution" dir="ltr"><span className="quote-rule" /><cite>— {t.quote.author}</cite></div>
    </div>
  </section>
}
