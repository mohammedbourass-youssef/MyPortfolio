import { useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ExternalLink, Github, X, Youtube } from 'lucide-react'
import { projects, type Project } from '../data/projects'
import type { Lang, T } from '../lib/i18n'
import SectionHeading from './SectionHeading'

const categoryKeys: Record<string, string> = { all: 'all', backend: 'backend', web: 'web', mobile: 'mobile', desktop: 'desktop', early: 'early' }

function ProjectCard({ project, lang, t, onClick }: { project: Project; lang: Lang; t: T; onClick: () => void }) {
  const cat = project.category[0]
  const number = String(projects.findIndex(item => item.id === project.id) + 1).padStart(2, '0')
  return <button className="project-card project-card-animated" onClick={onClick}>
    <div className={`project-visual visual-${cat}`}>
      <span className="visual-grid" />
      <span className="visual-monogram">{project.title.split(' ').slice(0, 2).map(w => w[0]).join('')}</span>
      <span className={`status-badge ${project.status}`}>{t.projects[project.status === 'inProgress' ? 'inProgress' : project.status === 'live' ? 'liveStatus' : project.status]}</span>
    </div>
    <div className="project-card-content">
      <span className="project-code" dir="ltr">PROJECT_{number} // {project.id.replace(/-/g, '_').toUpperCase()}</span>
      <div className="project-title"><h3>{project.title}</h3><ArrowDownLeft size={17} /></div>
      <p>{project.summary[lang]}</p>
      <div className="project-stack" dir="ltr">{project.stack.slice(0, 4).map(s => <span key={s}>#{s.toUpperCase().replace(/\s+/g, '_')}</span>)}</div>
      <div className="project-links">{project.links?.github?.startsWith('http') && <Github size={14} />}{project.links?.live?.startsWith('http') && <ExternalLink size={14} />}{project.links?.video?.startsWith('http') && <Youtube size={14} />}</div>
    </div>
  </button>
}

function ProjectModal({ project, lang, t, onClose }: { project: Project; lang: Lang; t: T; onClose: () => void }) {
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = '' }
  }, [onClose])
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label={t.projects.close}><X size={19} /></button>
      <span className="eyebrow">{t.projects.details}</span>
      <h2 id="modal-title">{project.title}</h2>
      <p className="modal-summary">{project.description[lang]}</p>
      <h3>{t.projects.role}</h3>
      <p>{project.role}</p>
      <h3>{t.projects.highlights}</h3>
      <ul>{project.highlights.map(h => <li key={h}>{h}</li>)}</ul>
      <div className="chip-list modal-chips">{project.stack.map(s => <span className="chip" key={s}>{s}</span>)}</div>
      <div className="modal-links">
        {project.links?.github && <a className="button button-outline" href={project.links.github} target="_blank" rel="noopener noreferrer"><Github size={16} />{t.projects.github}</a>}
        {project.links?.live && <a className="button button-outline" href={project.links.live} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />{t.projects.live}</a>}
        {project.links?.video?.startsWith('http') && <a className="button button-outline" href={project.links.video} target="_blank" rel="noopener noreferrer"><Youtube size={15} />{t.projects.video}</a>}
      </div>
    </section>
  </div>
}

export default function ProjectsSection({ lang, t }: { lang: Lang; t: T }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Project | null>(null)
  const visibleProjects = useMemo(() => projects.filter(project => filter === 'all' || project.category.includes(filter)), [filter])
  return <>
    <SectionHeading eyebrow={`[ SEC_04 // ${t.sections.projects} ]`} title={t.projects.title} subtitle={t.projects.subtitle} />
    <div className="filter-tabs projects-filter" role="tablist">{Object.keys(categoryKeys).map(key =>
      <button role="tab" aria-selected={filter === key} className={filter === key ? 'active' : ''} key={key} onClick={() => setFilter(key)}>{t.projects[categoryKeys[key] as keyof typeof t.projects]}</button>
    )}</div>
    <div className="project-grid project-grid-animated">{visibleProjects.map(project =>
      <ProjectCard key={project.id} project={project} lang={lang} t={t} onClick={() => setSelected(project)} />
    )}</div>
    {selected && <ProjectModal project={selected} lang={lang} t={t} onClose={() => setSelected(null)} />}
  </>
}
