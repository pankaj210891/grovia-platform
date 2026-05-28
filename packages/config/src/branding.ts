import type { BrandingConfig } from './types'

const env = (key: string): string | undefined => process.env[key]

export function getDefaultBranding(): BrandingConfig {
  return {
    name: env('BRAND_NAME') ?? 'Grovia',
    logoUrl: env('BRAND_LOGO_URL'),
    faviconUrl: env('BRAND_FAVICON_URL'),
    primaryColor: env('BRAND_PRIMARY_COLOR') ?? '#2563EB',
    accentColor: env('BRAND_ACCENT_COLOR') ?? '#7C3AED',
    supportEmail: env('BRAND_SUPPORT_EMAIL'),
    supportPhone: env('BRAND_SUPPORT_PHONE'),
  }
}
