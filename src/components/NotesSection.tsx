import { notes } from '../data/notes'
import type { Lang, T } from '../lib/i18n'
import SectionHeading from './SectionHeading'

export default function NotesSection({ lang, t }: { lang: Lang; t: T }) {
  if (!notes.length) return null
  return <section id="notes" className="section-wrap section-block">
    <SectionHeading eyebrow={`[ SEC_08B // ${t.notes.title} ]`} title={t.notes.title} subtitle={t.notes.subtitle} />
    <div className="content-grid">{notes.map(note => <article className="content-card note-card" key={note.id}>
      <span className="content-code" dir="ltr">{note.date}</span>
      <h3>{note.title}</h3>
      <p>{note.excerpt[lang]}</p>
      {note.url && <a className="text-link" href={note.url} target="_blank" rel="noreferrer">{t.notes.read}<span>↗</span></a>}
    </article>)}</div>
  </section>
}
