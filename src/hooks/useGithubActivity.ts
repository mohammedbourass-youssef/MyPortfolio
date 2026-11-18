import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { GithubActivityData, GithubRepo, GithubUser, LanguageStat } from '../types/github'
import { bestRepositoryNames } from '../data/github'

const USER = 'mohammedbourass-youssef'
const CACHE_KEY = 'github-activity-v2'
const CACHE_TTL = 60 * 60 * 1000

type GithubErrorKind = 'rate-limit' | 'unavailable'

class GithubRequestError extends Error {
  kind: GithubErrorKind
  retryable: boolean

  constructor(kind: GithubErrorKind, message: string, retryable: boolean) {
    super(message)
    this.name = 'GithubRequestError'
    this.kind = kind
    this.retryable = retryable
  }
}

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

export function getGithubLanguageColor(language: string | null) {
  if (!language) return 'var(--muted)'
  return languageColors[language] || 'var(--accent)'
}

function repoScore(repo: GithubRepo, now: number) {
  const ageDays = (now - new Date(repo.pushed_at).getTime()) / 86400000
  const recency = ageDays <= 90 ? 6 : ageDays <= 365 ? 3 : 0
  const documentation = (repo.description?.trim().length ?? 0) >= 20 ? 3 : 0
  const topics = Math.min(repo.topics?.length ?? 0, 3)
  const popularity = repo.stargazers_count * 10 + repo.forks_count * 5
  return popularity + recency + documentation + topics
}

function rankRepos(repos: GithubRepo[]) {
  const now = Date.now()
  return [...repos]
    .map(repo => {
      const featuredRank = bestRepositoryNames.indexOf(repo.name)
      return { repo, featuredRank: featuredRank === -1 ? bestRepositoryNames.length : featuredRank, score: repoScore(repo, now) }
    })
    .sort((a, b) => a.featuredRank - b.featuredRank || b.score - a.score || new Date(b.repo.pushed_at).getTime() - new Date(a.repo.pushed_at).getTime())
    .map(({ repo }) => repo)
}

function isActivityData(value: unknown): value is GithubActivityData {
  if (!value || typeof value !== 'object') return false
  const data = value as GithubActivityData
  return Boolean(
    data.user &&
    typeof data.user.public_repos === 'number' &&
    typeof data.user.followers === 'number' &&
    typeof data.totalStars === 'number' &&
    typeof data.totalForks === 'number' &&
    typeof data.nonForkCount === 'number' &&
    Array.isArray(data.topLanguages) &&
    Array.isArray(data.bestRepos)
  )
}

function readCache(): { ts: number; data: GithubActivityData } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; data: unknown }
    if (typeof parsed.ts !== 'number' || Date.now() - parsed.ts > CACHE_TTL || !isActivityData(parsed.data)) return null
    return { ts: parsed.ts, data: parsed.data }
  } catch {
    return null
  }
}

function writeCache(data: GithubActivityData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    return
  }
}

async function requestJson<T>(url: string, signal: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    })
  } catch {
    throw new GithubRequestError('unavailable', 'Network request failed', true)
  }
  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    const rateLimited = response.status === 429 || remaining === '0'
    throw new GithubRequestError(
      rateLimited ? 'rate-limit' : 'unavailable',
      `GitHub API request failed (${response.status})`,
      response.status >= 500 || response.status === 429
    )
  }
  try {
    return await response.json() as T
  } catch {
    throw new GithubRequestError('unavailable', 'Invalid GitHub response', false)
  }
}

async function fetchGithubActivity(signal: AbortSignal): Promise<GithubActivityData> {
  const [user, repos] = await Promise.all([
    requestJson<GithubUser>(`https://api.github.com/users/${USER}`, signal),
    requestJson<GithubRepo[]>(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, signal),
  ])
  if (!Array.isArray(repos)) throw new GithubRequestError('unavailable', 'Invalid repository response', false)
  const nonFork = repos.filter(repo => !repo.fork)
  const totalStars = nonFork.reduce((sum, repo) => sum + repo.stargazers_count, 0)
  const totalForks = nonFork.reduce((sum, repo) => sum + repo.forks_count, 0)
  const langCounts: Record<string, number> = {}
  for (const repo of nonFork) {
    if (repo.language) langCounts[repo.language] = (langCounts[repo.language] || 0) + 1
  }
  const totalLang = Object.values(langCounts).reduce((sum, count) => sum + count, 0) || 1
  const topLanguages: LanguageStat[] = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, percent: Math.round((count / totalLang) * 1000) / 10, color: getGithubLanguageColor(name) }))
  const data: GithubActivityData = {
    user,
    totalStars,
    totalForks,
    nonForkCount: nonFork.length,
    topLanguages,
    bestRepos: rankRepos(nonFork.filter(repo => !repo.archived && repo.name.toLowerCase() !== `${USER}.github.io` && !repo.name.includes(USER))).slice(0, 6),
  }
  writeCache(data)
  return data
}

export function useGithubActivity() {
  const [cached] = useState(readCache)
  const query = useQuery({
    queryKey: ['github-activity', USER],
    queryFn: ({ signal }) => fetchGithubActivity(signal),
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL * 2,
    retry: (failureCount, error) => failureCount < 2 && (error as GithubRequestError).retryable !== false,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.ts,
  })
  const data = query.data
  const error = query.error as GithubRequestError | null
  return useMemo(() => ({
    data,
    isLoading: query.isLoading && !data,
    isError: query.isError,
    isFetching: query.isFetching,
    errorKind: error?.kind ?? 'unavailable',
    refetch: query.refetch,
  }), [data, query.isLoading, query.isError, query.isFetching, error?.kind, query.refetch])
}
