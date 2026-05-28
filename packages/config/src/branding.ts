import type { BrandingConfig } from './types'
import type { ServerEnv } from './env'
import { validateServerEnv } from './env'

export function getDefaultBranding(env?: ServerEnv): BrandingConfig {
  const e = env ?? validateServerEnv()
  return {
    name: e.BRAND_NAME,
    logoUrl: e.BRAND_LOGO_URL,
    faviconUrl: e.BRAND_FAVICON_URL,
    primaryColor: e.BRAND_PRIMARY_COLOR,
    accentColor: e.BRAND_ACCENT_COLOR,
    supportEmail: e.BRAND_SUPPORT_EMAIL,
    supportPhone: e.BRAND_SUPPORT_PHONE,
    socialLinks:
      e.BRAND_TWITTER_URL || e.BRAND_INSTAGRAM_URL || e.BRAND_FACEBOOK_URL
        ? {
            twitter: e.BRAND_TWITTER_URL,
            instagram: e.BRAND_INSTAGRAM_URL,
            facebook: e.BRAND_FACEBOOK_URL,
          }
        : undefined,
  }
}
