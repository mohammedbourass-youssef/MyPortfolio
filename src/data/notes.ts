import type { Localized } from './timeline'

export type Note = {
  id: string
  title: string
  excerpt: Localized
  date: string
  url?: string
}

export const notes: Note[] = []
