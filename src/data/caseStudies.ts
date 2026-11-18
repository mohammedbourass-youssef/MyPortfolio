import type { Localized } from './timeline'

export type CaseStudy = {
  id: string
  title: string
  summary: Localized
  problem: Localized
  solution: Localized
  outcome: Localized
  stack: string[]
}

export const caseStudies: CaseStudy[] = []
