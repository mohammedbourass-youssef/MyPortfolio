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
