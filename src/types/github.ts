export interface GithubUser {
  login: string
  avatar_url: string
  html_url: string
  public_repos: number
  followers: number
  following: number
  created_at: string
}

export interface GithubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  pushed_at: string
  fork: boolean
  topics?: string[]
}

export interface LanguageStat {
  name: string
  count: number
  percent: number
  color: string
}

export interface GithubActivityData {
  user: GithubUser
  repos: GithubRepo[]
  totalStars: number
  totalForks: number
  nonForkCount: number
  topLanguages: LanguageStat[]
  latestRepos: GithubRepo[]
}
