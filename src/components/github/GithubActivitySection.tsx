import { useEffect, useRef, useState } from 'react'
import { ExternalLink, GitFork, Github, Star, Users } from 'lucide-react'
import { profile } from '../../data/profile'
import { repositories } from '../../data/github'
import { assetUrl } from '../../lib/assets'
import { getGithubLanguageColor, useGithubActivity } from '../../hooks/useGithubActivity'
import type { Lang, T } from '../../lib/i18n'
import SectionHeading from '../SectionHeading'

function timeAgo(date: string, lang: Lang) {
  const time = new Date(date).getTime()
  if (!Number.isFinite(time)) return ''
  const delta = Date.now() - time
  const absolute = Math.abs(delta)
  const direction = delta >= 0 ? -1 : 1
  const relative = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  if (absolute < 60_000) return relative.format(direction * Math.round(absolute / 1_000), 'second')
  if (absolute < 3_600_000) return relative.format(direction * Math.round(absolute / 60_000), 'minute')
  if (absolute < 86_400_000) return relative.format(direction * Math.round(absolute / 3_600_000), 'hour')
  if (absolute < 2_592_000_000) return relative.format(direction * Math.round(absolute / 86_400_000), 'day')
  if (absolute < 31_536_000_000) return relative.format(direction * Math.round(absolute / 2_592_000_000), 'month')
  return relative.format(direction * Math.round(absolute / 31_536_000_000), 'year')
}

function CountUp({ value, inView, lang }: { value: number; inView: boolean; lang: Lang }) {
  const [count, setCount] = useState(0)
  const frame = useRef(0)
  useEffect(() => {
    if (!inView) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCount(value); return }
    const duration = 900
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) frame.current = requestAnimationFrame(step)
      else setCount(value)
    }
    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
  }, [inView, value])
  return <span>{new Intl.NumberFormat(lang).format(count)}</span>
}

function StatCard({ icon, label, value, inView, lang }: { icon: React.ReactNode; label: string; value: number; inView: boolean; lang: Lang }) {
  return <article className="github-stat-card" aria-label={`${label}: ${new Intl.NumberFormat(lang).format(value)}`}>
    <div className="github-stat-icon">{icon}</div>
    <div><div className="github-stat-value"><CountUp value={value} inView={inView} lang={lang}/></div><div className="github-stat-label">{label}</div></div>
  </article>
}

export default function GithubActivitySection({ lang, t }: { lang: Lang; t: T }) {
  const { data, isLoading, isError, isFetching, errorKind, refetch } = useGithubActivity()
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { setInView(true); observer.disconnect() } }, { threshold: 0.25 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const showStaticFallback = !data && !isLoading
  const errorMessage = errorKind === 'rate-limit' ? t.github.rateLimited : data ? t.github.refreshFailed : t.github.unavailable

  return <section id="github" className="section-wrap section-block" ref={sectionRef} aria-label={t.sections.github} aria-busy={isLoading || isFetching}>
    <SectionHeading eyebrow={`[ SEC_08 // ${t.sections.github} ]`} title={t.github.title} subtitle={t.github.subtitle} />
    <span className="github-sr-only" role="status">{isLoading ? t.github.loading : isFetching ? t.github.refreshing : ''}</span>
    <div className="github-profile"><div className="github-avatar"><img loading="lazy" decoding="async" src={assetUrl('Profile.webp')} alt={`${profile.name} profile photo`} width={549} height={560}/></div><div><h3>{profile.name}</h3><span>{profile.github.replace('https://github.com/', '')}</span></div><a className="button button-outline" href={profile.github} target="_blank" rel="noreferrer"><Github size={16}/>{t.github.follow}<ExternalLink size={14}/></a></div>
    {isError && <div className="github-error" role="alert"><span>{errorMessage}</span><button className="button button-outline" disabled={isFetching} onClick={() => refetch()}>{t.github.retry}</button></div>}
    {showStaticFallback && <p className="github-static-note" role="status">{t.github.staticFallback}</p>}
    <div className="github-activity-grid" aria-busy={isLoading || isFetching}>
      <div className="github-stats-row">
        {isLoading && !data ? Array.from({ length: 4 }).map((_, index) => <div className="github-skeleton-card" key={index} aria-hidden="true"/>) : data && <>
          <StatCard icon={<Github size={18}/>} label={t.github.repos} value={data.user.public_repos} inView={inView} lang={lang}/>
          <StatCard icon={<Star size={18}/>} label={t.github.stars} value={data.totalStars} inView={inView} lang={lang}/>
          <StatCard icon={<GitFork size={18}/>} label={t.github.forks} value={data.totalForks} inView={inView} lang={lang}/>
          <StatCard icon={<Users size={18}/>} label={t.github.followers} value={data.user.followers} inView={inView} lang={lang}/>
        </>}
      </div>
      <div className="github-langs-card">
        <div className="github-card-head"><h3>{t.github.topLanguages}</h3></div>
        {isLoading && !data ? <div className="github-skeleton-bar" aria-hidden="true"/> : data && <div className="github-langs">
          {data.topLanguages.map(stat => <div className="github-lang-row" key={stat.name}><span className="github-lang-name"><i aria-hidden="true" style={{ background: stat.color }}/><span>{stat.name}</span></span><div className="github-lang-bar" role="progressbar" aria-label={stat.name} aria-valuenow={stat.percent} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${stat.percent}%`, background: stat.color }}/></div><span className="github-lang-pct">{stat.percent}%</span></div>)}
        </div>}
      </div>
    </div>
    <div className="github-latest-head"><h3>{t.github.bestRepos}</h3></div>
    <div className="github-latest-grid" aria-busy={isLoading || isFetching}>
      {isLoading && !data ? Array.from({ length: 6 }).map((_, index) => <div className="github-skeleton-repo" key={index} aria-hidden="true"/>) : showStaticFallback ? repositories.map(repo => <article className="github-repo-card github-repo-static" key={repo.name}>
        <div className="github-repo-head"><Github size={16}/><strong>{repo.name}</strong></div>
        <p>{repo.description}</p>
        <div className="github-repo-meta"><span className="github-repo-lang"><i aria-hidden="true" style={{ background: getGithubLanguageColor(repo.language) }}/>{repo.language}</span><span>{t.github.staticSource}</span></div>
      </article>) : data?.bestRepos.map(repo => <a className="github-repo-card" href={repo.html_url} target="_blank" rel="noreferrer" key={repo.id}><div className="github-repo-head"><Github size={16}/><strong>{repo.name}</strong><ExternalLink size={13}/></div><p>{repo.description || '—'}</p><div className="github-repo-meta"><span className="github-repo-lang">{repo.language && <i aria-hidden="true" style={{ background: getGithubLanguageColor(repo.language) }}/>}{repo.language || '—'}</span><span><Star size={12}/>{repo.stargazers_count}</span><span><GitFork size={12}/>{repo.forks_count}</span><time dateTime={repo.pushed_at}>{timeAgo(repo.pushed_at, lang)}</time></div><span className="github-sr-only">{t.github.newTab}</span></a>)}
    </div>
  </section>
}
