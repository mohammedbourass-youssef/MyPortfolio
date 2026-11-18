import { profile } from '../data/profile'
import type { Lang } from './i18n'

export function assetUrl(file: string) {
  const relative = file.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${relative}`
}

export function cvUrl(lang: Lang) {
  return assetUrl(lang === 'fr' ? profile.cv.fr : profile.cv.en)
}

export function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const international = digits.startsWith('0') ? `212${digits.slice(1)}` : digits
  return `https://wa.me/${international}`
}

const emailDrafts: Record<Lang, { subject: string; body: string }> = {
  en: {
    subject: 'Portfolio inquiry',
    body: `Hello Mohammed,

I came across your portfolio and would like to discuss a project or opportunity.

Could you let me know your availability?

Thanks,
`,
  },
  fr: {
    subject: 'Demande via le portfolio',
    body: `Bonjour Mohammed,

J'ai découvert votre portfolio et j'aimerais discuter d'un projet ou d'une opportunité.

Pouvez-vous me dire quand vous êtes disponible ?

Merci,
`,
  },
  ar: {
    subject: 'استفسار عبر المعرض',
    body: `مرحباً محمد،

اطلعت على معرض أعمالك وأود مناقشة مشروع أو فرصة عمل.

هل يمكنك إخباري بمدى توفرك؟

شكراً،
`,
  },
}

export function emailHref(lang: Lang, subject?: string) {
  const draft = emailDrafts[lang]
  const finalSubject = subject || draft.subject
  return `mailto:${profile.email}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(draft.body)}`
}
