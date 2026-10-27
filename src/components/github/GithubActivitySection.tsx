import { useEffect, useRef, useState } from 'react'
import { ExternalLink, GitFork, Github, Star, Users } from 'lucide-react'
import { useGithubActivity } from '../../hooks/useGithubActivity'
import type { Lang, T } from '../../lib/i18n'
import SectionHeading from '../SectionHeading'

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  if (months < 12) return `${months} months ago`
  const years = Math.floor(months / 12)
  return years === 1 ? '1 year ago' : `${years} years ago`
}

function CountUp({ value, inView }: { value: number; inView: boolean }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { setCount(value); return }
    const duration = 900
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(step)
      else setCount(value)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [inView, value])
  return <span>{count.toLocaleString()}</span>
}

function StatCard({ icon, label, value, inView }: { icon: React.ReactNode; label: string; value: number; inView: boolean }) {
  return <article className="github-stat-card" aria-label={`${label}: ${value}`}>
    <div className="github-stat-icon">{icon}</div>
    <div><div className="github-stat-value"><CountUp value={value} inView={inView} /></div><div className="github-stat-label">{label}</div></div>
  </article>
}

export default function GithubActivitySection({ lang }: { lang: Lang; t: T }) {
  const { data, isLoading, isError, refetch } = useGithubActivity()
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { setInView(true); observer.disconnect() } }, { threshold: 0.25 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  if (isError && !data) return null
  return <section id="github-activity" className="section-wrap section-block" ref={sectionRef} aria-label="GitHub Activity">
    <SectionHeading eyebrow={`[ SEC_08B // ${lang==='ar'?'???? GitHub':lang==='fr'?'Activit? GitHub':'GitHub Activity'} ]`} title={lang==='ar'?'????? ??? GitHub':lang==='fr'?'Mon activit? GitHub':'Live GitHub Activity'} subtitle={lang==='ar'?'???????? ??? ?? ????? GitHub':lang==='fr'?'Statistiques en direct depuis l\'API GitHub':'Live statistics from the GitHub API'} />
    <div className="github-activity-grid">
      <div className="github-stats-row">
        {isLoading && !data ? Array.from({length:4}).map((_,i)=><div className="github-skeleton-card" key={i} aria-hidden/>) : data && <>
          <StatCard icon={<Github size={18}/>} label={lang==='ar'?'???????? ????':lang==='fr'?'D?p?ts publics':'Public repos'} value={data.user.public_repos} inView={inView} />
          <StatCard icon={<Star size={18}/>} label={lang==='ar'?'???? ???????':lang==='fr'?'?toiles totales':'Total stars'} value={data.totalStars} inView={inView} />
          <StatCard icon={<GitFork size={18}/>} label={lang==='ar'?'?????? ???????':lang==='fr'?'Forks totaux':'Total forks'} value={data.totalForks} inView={inView} />
          <StatCard icon={<Users size={18}/>} label={lang==='ar'?'???????':lang==='fr'?'Abonn?s':'Followers'} value={data.user.followers} inView={inView} />
        </>}
      </div>
      <div className="github-langs-card">
        <div className="github-card-head"><h3>{lang==='ar'?'???? ?????? ?????????':lang==='fr'?'Langages les plus utilis?s':'Top languages'}</h3></div>
        {isLoading && !data ? <div className="github-skeleton-bar" aria-hidden/> : data && <div className="github-langs">
          {data.topLanguages.map(langStat => <div className="github-lang-row" key={langStat.name}><span className="github-lang-name"><i style={{background:langStat.color}}/><span>{langStat.name}</span></span><div className="github-lang-bar"><div style={{width:`${langStat.percent}%`, background:langStat.color}}/></div><span className="github-lang-pct">{langStat.percent}%</span></div>)}
        </div>}
      </div>
    </div>
    <div className="github-latest-head"><h3>{lang==='ar'?'???? ????????':lang==='fr'?'Derniers projets':'Latest projects'}</h3></div>
    <div className="github-latest-grid">
      {isLoading && !data ? Array.from({length:6}).map((_,i)=><div className="github-skeleton-repo" key={i} aria-hidden/>) : data?.latestRepos.map(repo => <a className="github-repo-card" href={repo.html_url} target="_blank" rel="noreferrer" key={repo.id} aria-label={`Open ${repo.name} on GitHub`}><div className="github-repo-head"><Github size={16}/><strong>{repo.name}</strong><ExternalLink size={13}/></div><p>{repo.description || '?'}</p><div className="github-repo-meta"><span className="github-repo-lang">{repo.language && <i style={{background:getColor(repo.language)}}/>}{repo.language || '?'}</span><span><Star size={12}/>{repo.stargazers_count}</span><span><GitFork size={12}/>{repo.forks_count}</span><span className="github-repo-time">{timeAgo(repo.pushed_at)}</span></div></a>)}
    </div>
    {isError && data && <div className="github-error"><span>Failed to refresh latest data.</span><button className="button button-outline" onClick={()=>refetch()}>{lang==='ar'?'????? ????????':lang==='fr'?'R?essayer':'Retry'}</button></div>}
    <div className="github-view-all"><a className="button button-primary" href="https://github.com/mohammedbourass-youssef" target="_blank" rel="noreferrer"><Github size={16}/>{lang==='ar'?'??? ??? GitHub':lang==='fr'?'Voir sur GitHub':'View on GitHub'}<ExternalLink size={14}/></a></div>
  </section>
}

function getColor(lang: string | null) {
  if (!lang) return 'var(--muted)'
  const map: Record<string,string> = { TypeScript:'#3178c6', JavaScript:'#f1e05a', Dart:'#00b4ab', Python:'#3572a5', Java:'#b07219', 'C#':'#178600', PHP:'#4f5d95', HTML:'#e34c26', CSS:'#563d7c', Go:'#00add8', Rust:'#dea584', Kotlin:'#a97bff', Swift:'#f05138' }
  return map[lang] || 'var(--accent)'
}
