import type { LocaleConfig } from './types'

const DATE_FORMATS: Record<string, string> = {
  'en-US': 'MM/DD/YYYY',
  'en-GB': 'DD/MM/YYYY',
  'de-DE': 'DD.MM.YYYY',
  'fr-FR': 'DD/MM/YYYY',
  'ja-JP': 'YYYY/MM/DD',
  'zh-CN': 'YYYY-MM-DD',
}

const TIME_FORMATS: Record<string, string> = {
  'en-US': 'h:mm A',
  'en-GB': 'HH:mm',
  'de-DE': 'HH:mm',
  'fr-FR': 'HH:mm',
  'ja-JP': 'HH:mm',
  'zh-CN': 'HH:mm',
}

export function getDefaultLocale(): LocaleConfig {
  const locale = process.env['DEFAULT_LOCALE'] ?? 'en-US'
  return {
    locale,
    currency: process.env['DEFAULT_CURRENCY'] ?? 'USD',
    timezone: process.env['DEFAULT_TIMEZONE'] ?? 'UTC',
    dateFormat: DATE_FORMATS[locale] ?? 'MM/DD/YYYY',
    timeFormat: TIME_FORMATS[locale] ?? 'HH:mm',
  }
}
