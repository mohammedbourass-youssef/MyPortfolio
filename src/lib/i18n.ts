import en from '../i18n/en.json'
import fr from '../i18n/fr.json'
import ar from '../i18n/ar.json'

export type Lang = 'en' | 'fr' | 'ar'
export type T = typeof en

export const translations: Record<Lang, T> = { en, fr, ar }
