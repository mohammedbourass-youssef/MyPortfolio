import { useEffect, useRef, useState } from 'react'
import { ExternalLink, GitFork, Github, Star, Users } from 'lucide-react'
import { profile } from '../../data/profile'
import { assetUrl } from '../../lib/assets'
import { useGithubActivity } from '../../hooks/useGithubActivity'
import type { Lang, T } from '../../lib/i18n'
import SectionHeading from '../SectionHeading'

function timeAgo(date: string, lang: Lang) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  const units = lang === 'ar'
    ? { today: 'اليوم', day: 'يوم واحد', days: 'أيام', month: 'شهر واحد', months: 'أشهر', year: 'سنة واحدة', years: 'سنوات' }
    : lang === 'fr'
      ? { today: "Aujourd'hui", day: '1 jour', days: 'jours', month: '1 mois', months: 'mois', year: '1 an', years: 'ans' }
      : { today: 'Today', day: '1 day', days: 'days', month: '1 month', months: 'months', year: '1 year', years: 'years' }
  if (days < 1) return units.today
  if (days === 1) return units.day
  if (days < 30) return `${days} ${units.days}`
  const months = Math.floor(days / 30)
  if (months === 1) return units.month
  if (months < 12) return `${months} ${units.months}`
  const years = Math.floor(months / 12)
  return years === 1 ? units.year : `${years} ${units.years}`
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

export default function GithubActivitySection({ lang, t }: { lang: Lang; t: T }) {
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

  const labels = lang === 'ar'
    ? { repos: 'المستودعات العامة', stars: 'إجمالي النجوم', forks: 'إجمالي الفوركس', followers: 'المتابعون', topLanguages: 'أكثر اللغات استخداماً', bestRepos: 'أفضل المشاريع مفتوحة المصدر', retry: 'إعادة المحاولة', unavailable: 'تعذر تحميل إحصاءات GitHub المباشرة.', refreshFailed: 'تعذر تحديث أحدث البيانات.' }
    : lang === 'fr'
      ? { repos: 'Dépôts publics', stars: 'Étoiles totales', forks: 'Forks totaux', followers: 'Abonnés', topLanguages: 'Langages les plus utilisés', bestRepos: 'Meilleurs projets open source', retry: 'Réessayer', unavailable: 'Impossible de charger les statistiques GitHub en direct.', refreshFailed: 'Impossible d’actualiser les dernières données.' }
      : { repos: 'Public repos', stars: 'Total stars', forks: 'Total forks', followers: 'Followers', topLanguages: 'Top languages', bestRepos: 'Best open source', retry: 'Retry', unavailable: 'Unable to load live GitHub statistics.', refreshFailed: 'Failed to refresh latest data.' }

  return <section id="github" className="section-wrap section-block" ref={sectionRef} aria-label={t.sections.github}>
    <SectionHeading eyebrow={`[ SEC_08 // ${t.sections.github} ]`} title={t.github.title} subtitle={t.github.subtitle} />
    <div className="github-profile"><div className="github-avatar"><img loading="lazy" decoding="async" src={assetUrl('Profile.webp')} alt={`${profile.name} profile photo`} width={549} height={560}/></div><div><h3>{profile.name}</h3><span>{profile.github.replace('https://github.com/', '')}</span></div><a className="button button-outline" href={profile.github} target="_blank" rel="noreferrer"><Github size={16}/>{t.github.follow}<ExternalLink size={14}/></a></div>
    {!data && !isLoading && <div className="github-error"><span>{labels.unavailable}</span><button className="button button-outline" onClick={()=>refetch()}>{labels.retry}</button></div>}
    {isError && data && <div className="github-error"><span>{labels.refreshFailed}</span><button className="button button-outline" onClick={()=>refetch()}>{labels.retry}</button></div>}
    <div className="github-activity-grid">
      <div className="github-stats-row">
        {isLoading && !data ? Array.from({length:4}).map((_,i)=><div className="github-skeleton-card" key={i} aria-hidden/>) : data && <>
          <StatCard icon={<Github size={18}/>} label={labels.repos} value={data.user.public_repos} inView={inView} />
          <StatCard icon={<Star size={18}/>} label={labels.stars} value={data.totalStars} inView={inView} />
          <StatCard icon={<GitFork size={18}/>} label={labels.forks} value={data.totalForks} inView={inView} />
          <StatCard icon={<Users size={18}/>} label={labels.followers} value={data.user.followers} inView={inView} />
        </>}
      </div>
      <div className="github-langs-card">
        <div className="github-card-head"><h3>{labels.topLanguages}</h3></div>
        {isLoading && !data ? <div className="github-skeleton-bar" aria-hidden/> : data && <div className="github-langs">
          {data.topLanguages.map(langStat => <div className="github-lang-row" key={langStat.name}><span className="github-lang-name"><i style={{background:langStat.color}}/><span>{langStat.name}</span></span><div className="github-lang-bar"><div style={{width:`${langStat.percent}%`, background:langStat.color}}/></div><span className="github-lang-pct">{langStat.percent}%</span></div>)}
        </div>}
      </div>
    </div>
    <div className="github-latest-head"><h3>{labels.bestRepos}</h3></div>
    <div className="github-latest-grid">
      {isLoading && !data ? Array.from({length:6}).map((_,i)=><div className="github-skeleton-repo" key={i} aria-hidden/>) : data?.bestRepos.map(repo => <a className="github-repo-card" href={repo.html_url} target="_blank" rel="noreferrer" key={repo.id} aria-label={`Open ${repo.name} on GitHub`}><div className="github-repo-head"><Github size={16}/><strong>{repo.name}</strong><ExternalLink size={13}/></div><p>{repo.description || '—'}</p><div className="github-repo-meta"><span className="github-repo-lang">{repo.language && <i style={{background:getColor(repo.language)}}/>}{repo.language || '—'}</span><span><Star size={12}/>{repo.stargazers_count}</span><span><GitFork size={12}/>{repo.forks_count}</span><span className="github-repo-time">{timeAgo(repo.pushed_at, lang)}</span></div></a>)}
    </div>
  </section>
}

function getColor(lang: string | null) {
  if (!lang) return 'var(--muted)'
  const map: Record<string,string> = { TypeScript:'#3178c6', JavaScript:'#f1e05a', Dart:'#00b4ab', Python:'#3572a5', Java:'#b07219', 'C#':'#178600', PHP:'#4f5d95', HTML:'#e34c26', CSS:'#563d7c', Go:'#00add8', Rust:'#dea584', Kotlin:'#a97bff', Swift:'#f05138' }
  return map[lang] || 'var(--accent)'
}
