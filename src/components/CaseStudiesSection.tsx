import { caseStudies } from '../data/caseStudies'
import type { Lang, T } from '../lib/i18n'
import SectionHeading from './SectionHeading'

export default function CaseStudiesSection({ lang, t }: { lang: Lang; t: T }) {
  if (!caseStudies.length) return null
  return <section id="case-studies" className="section-wrap section-block">
    <SectionHeading eyebrow={`[ SEC_04A // ${t.caseStudies.title} ]`} title={t.caseStudies.title} subtitle={t.caseStudies.subtitle} />
    <div className="content-grid">{caseStudies.map(study => <article className="content-card" key={study.id}>
      <span className="content-code" dir="ltr">{study.id}</span>
      <h3>{study.title}</h3>
      <p>{study.summary[lang]}</p>
      <h4>{t.caseStudies.problem}</h4>
      <p>{study.problem[lang]}</p>
      <h4>{t.caseStudies.solution}</h4>
      <p>{study.solution[lang]}</p>
      <h4>{t.caseStudies.outcome}</h4>
      <p>{study.outcome[lang]}</p>
      <div className="chip-list">{study.stack.map(item => <span className="chip" key={item}>{item}</span>)}</div>
    </article>)}</div>
  </section>
}
