import type { LocaleConfig } from './types'
import type { ServerEnv } from './env'
import { validateServerEnv } from './env'

const DATE_FORMATS: Record<string, string> = {
  'en-US': 'MM/DD/YYYY',
  'en-CA': 'YYYY-MM-DD',
  'en-GB': 'DD/MM/YYYY',
  'en-AU': 'DD/MM/YYYY',
  'de-DE': 'DD.MM.YYYY',
  'de-AT': 'DD.MM.YYYY',
  'de-CH': 'DD.MM.YYYY',
  'fr-FR': 'DD/MM/YYYY',
  'fr-CA': 'YYYY-MM-DD',
  'es-ES': 'DD/MM/YYYY',
  'es-MX': 'DD/MM/YYYY',
  'pt-BR': 'DD/MM/YYYY',
  'pt-PT': 'DD/MM/YYYY',
  'it-IT': 'DD/MM/YYYY',
  'nl-NL': 'DD/MM/YYYY',
  'ru-RU': 'DD.MM.YYYY',
  'ja-JP': 'YYYY/MM/DD',
  'ko-KR': 'YYYY-MM-DD',
  'zh-CN': 'YYYY-MM-DD',
  'zh-TW': 'YYYY/MM/DD',
}

const TIME_FORMATS: Record<string, string> = {
  'en-US': 'h:mm A',
  'en-CA': 'HH:mm',
  'en-GB': 'HH:mm',
  'en-AU': 'h:mm A',
  'de-DE': 'HH:mm',
  'de-AT': 'HH:mm',
  'de-CH': 'HH:mm',
  'fr-FR': 'HH:mm',
  'fr-CA': 'HH:mm',
  'es-ES': 'HH:mm',
  'es-MX': 'HH:mm',
  'pt-BR': 'HH:mm',
  'pt-PT': 'HH:mm',
  'it-IT': 'HH:mm',
  'nl-NL': 'HH:mm',
  'ru-RU': 'HH:mm',
  'ja-JP': 'HH:mm',
  'ko-KR': 'HH:mm',
  'zh-CN': 'HH:mm',
  'zh-TW': 'HH:mm',
}

// Infer sensible defaults for locales not in the lookup tables.
// en-US is the only common locale using MDY and 12h by convention.
function inferDateFormat(locale: string): string {
  if (locale === 'en-US') return 'MM/DD/YYYY'
  const lang = locale.split('-')[0]
  if (lang === 'ja' || lang === 'ko' || lang === 'zh') return 'YYYY-MM-DD'
  return 'DD/MM/YYYY'
}

function inferTimeFormat(locale: string): string {
  return locale === 'en-US' || locale === 'en-AU' ? 'h:mm A' : 'HH:mm'
}

export function getDefaultLocale(env?: ServerEnv): LocaleConfig {
  const e = env ?? validateServerEnv()
  return {
    locale: e.DEFAULT_LOCALE,
    currency: e.DEFAULT_CURRENCY,
    timezone: e.DEFAULT_TIMEZONE,
    dateFormat: DATE_FORMATS[e.DEFAULT_LOCALE] ?? inferDateFormat(e.DEFAULT_LOCALE),
    timeFormat: TIME_FORMATS[e.DEFAULT_LOCALE] ?? inferTimeFormat(e.DEFAULT_LOCALE),
  }
}
