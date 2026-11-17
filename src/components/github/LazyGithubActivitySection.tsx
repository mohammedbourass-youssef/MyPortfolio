import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Lang, T } from '../../lib/i18n'
import GithubActivitySection from './GithubActivitySection'

const queryClient = new QueryClient()

export default function LazyGithubActivitySection({ lang, t }: { lang: Lang; t: T }) {
  return <QueryClientProvider client={queryClient}><GithubActivitySection lang={lang} t={t} /></QueryClientProvider>
}
