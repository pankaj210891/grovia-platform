// Types
export type {
  ApiConfig,
  AppConfig,
  AuthConfig,
  BrandingConfig,
  DatabaseConfig,
  EmailConfig,
  Environment,
  FeatureFlags,
  LocaleConfig,
  StripeConfig,
  TenantConfig,
} from './types'

// Config loader
export { getConfig, getTenantConfig, resetConfig } from './config'

// Subsystems
export { getDefaultBranding } from './branding'
export { getDefaultLocale } from './locale'
export { getDefaultFeatureFlags, isFeatureEnabled } from './feature-flags'

// Env validation (server-only — do not import in client components)
export {
  serverEnvSchema,
  publicEnvSchema,
  validateServerEnv,
  validatePublicEnv,
} from './env'
export type { PublicEnv, ServerEnv } from './env'
