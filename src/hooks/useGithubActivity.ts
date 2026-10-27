import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { GithubActivityData, GithubRepo, GithubUser, LanguageStat } from '../types/github'

const USER = 'mohammedbourass-youssef'
const CACHE_KEY = 'github-activity-v1'
const CACHE_TTL = 60 * 60 * 1000

const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Dart: '#00b4ab',
  Python: '#3572a5',
  Java: '#b07219',
  'C#': '#178600',
  PHP: '#4f5d95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Go: '#00add8',
  Rust: '#dea584',
  Kotlin: '#a97bff',
  Swift: '#f05138',
  SQL: '#e38c00',
  Shell: '#89e051',
}

function getColor(lang: string | null) {
  if (!lang) return 'var(--muted)'
  return languageColors[lang] || 'var(--accent)'
}

function readCache(): GithubActivityData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; data: GithubActivityData }
    if (Date.now() - parsed.ts > CACHE_TTL) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(data: GithubActivityData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // ignore quota errors
  }
}

async function fetchGithubActivity(signal: AbortSignal): Promise<GithubActivityData> {
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${USER}`, { signal, headers: { Accept: 'application/vnd.github+json' } }),
    fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, { signal, headers: { Accept: 'application/vnd.github+json' } }),
  ])
  if (!userRes.ok || !reposRes.ok) throw new Error('GitHub API request failed')
  const user = (await userRes.json()) as GithubUser
  const repos = (await reposRes.json()) as GithubRepo[]
  const nonFork = repos.filter(r => !r.fork)
  const totalStars = nonFork.reduce((sum, r) => sum + r.stargazers_count, 0)
  const totalForks = nonFork.reduce((sum, r) => sum + r.forks_count, 0)
  const langCounts: Record<string, number> = {}
  for (const repo of nonFork) {
    if (repo.language) langCounts[repo.language] = (langCounts[repo.language] || 0) + 1
  }
  const totalLang = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1
  const topLanguages: LanguageStat[] = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, percent: Math.round((count / totalLang) * 1000) / 10, color: getColor(name) }))
  const latestRepos = [...nonFork]
    .filter(r => r.name.toLowerCase() !== `${USER}.github.io` && !r.name.includes(USER))
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, 6)
  const data: GithubActivityData = { user, repos, totalStars, totalForks, nonForkCount: nonFork.length, topLanguages, latestRepos }
  writeCache(data)
  return data
}

export function useGithubActivity() {
  const cached = useRef<GithubActivityData | null>(readCache())
  const [cachedData] = useState<GithubActivityData | null>(cached.current)
  const query = useQuery({
    queryKey: ['github-activity', USER],
    queryFn: ({ signal }) => fetchGithubActivity(signal),
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL * 2,
    retry: 2,
    initialData: cachedData ?? undefined,
  })
  useEffect(() => {
    if (query.data && query.data !== cachedData) writeCache(query.data)
  }, [query.data, cachedData])
  const data = query.data ?? cachedData
  const isLoading = query.isLoading && !data
  const isError = query.isError && !data
  const isFetching = query.isFetching
  return useMemo(() => ({ data, isLoading, isError, isFetching, refetch: query.refetch }), [data, isLoading, isError, isFetching, query.refetch])
}
