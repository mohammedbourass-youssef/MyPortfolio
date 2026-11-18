import type { Localized } from './timeline'

export type Testimonial = {
  id: string
  quote: Localized
  author: string
  role?: Localized
  source?: string
}

export const testimonials: Testimonial[] = []
