import { getDefaultBranding } from './branding'
import { getDefaultFeatureFlags } from './feature-flags'
import { getDefaultLocale } from './locale'
import { validateServerEnv, validatePublicEnv } from './env'
import type { AppConfig, TenantConfig } from './types'

let _config: AppConfig | undefined

export function getConfig(): AppConfig {
  if (_config) return _config

  const env = validateServerEnv()
  const publicEnv = validatePublicEnv()

  const stripe =
    env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET
      ? { secretKey: env.STRIPE_SECRET_KEY, webhookSecret: env.STRIPE_WEBHOOK_SECRET }
      : undefined

  const email = env.SMTP_HOST
    ? {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER ?? '',
        password: env.SMTP_PASS ?? '',
        from: env.EMAIL_FROM,
      }
    : undefined

  _config = {
    env: env.NODE_ENV,
    api: {
      url: publicEnv.NEXT_PUBLIC_API_URL,
      port: env.PORT,
    },
    database: {
      mongoUri: env.MONGODB_URI,
      redisUrl: env.REDIS_URL,
    },
    auth: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTokenExpiry: env.JWT_ACCESS_EXPIRY,
      refreshTokenExpiry: env.JWT_REFRESH_EXPIRY,
    },
    stripe,
    email,
    defaultTenantId: env.DEFAULT_TENANT_ID,
    branding: getDefaultBranding(env),
    locale: getDefaultLocale(env),
    features: getDefaultFeatureFlags(env),
  }

  return _config
}

// Phase 0: returns env-backed single-tenant config.
// Phase 7+: fetch overrides from DB per tenantId.
export function getTenantConfig(tenantId?: string): TenantConfig {
  const config = getConfig()
  return {
    tenantId: tenantId ?? config.defaultTenantId,
    branding: config.branding,
    features: config.features,
    locale: config.locale,
  }
}

// Call in tests to clear the cached singleton between test cases.
export function resetConfig(): void {
  _config = undefined
}
