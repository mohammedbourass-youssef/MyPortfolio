import { testimonials } from '../data/testimonials'
import type { Lang, T } from '../lib/i18n'
import SectionHeading from './SectionHeading'

export default function TestimonialsSection({ lang, t }: { lang: Lang; t: T }) {
  if (!testimonials.length) return null
  return <section id="testimonials" className="section-wrap section-block">
    <SectionHeading eyebrow={`[ SEC_08A // ${t.testimonials.title} ]`} title={t.testimonials.title} subtitle={t.testimonials.subtitle} />
    <div className="content-grid">{testimonials.map(item => <blockquote className="content-card testimonial-card" key={item.id}>
      <p>{item.quote[lang]}</p>
      <footer><strong>{item.author}</strong>{item.role && <span>{item.role[lang]}</span>}{item.source && <a href={item.source} target="_blank" rel="noreferrer">{t.testimonials.source}</a>}</footer>
    </blockquote>)}</div>
  </section>
}
