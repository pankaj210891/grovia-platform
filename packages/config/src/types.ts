export type Environment = 'development' | 'staging' | 'production' | 'test'

export interface FeatureFlags {
  multiVendor: boolean
  guestCheckout: boolean
  wishlist: boolean
  reviews: boolean
  loyaltyPoints: boolean
  stripeCheckout: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  darkMode: boolean
  internationalShipping: boolean
}

export interface BrandingConfig {
  name: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor: string
  accentColor: string
  supportEmail?: string
  supportPhone?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    facebook?: string
  }
}

export interface LocaleConfig {
  locale: string
  currency: string
  timezone: string
  dateFormat: string
  timeFormat: string
}

export interface ApiConfig {
  url: string
  port: number
}

export interface DatabaseConfig {
  mongoUri: string
  redisUrl: string
}

export interface AuthConfig {
  accessSecret: string
  refreshSecret: string
  accessTokenExpiry: string
  refreshTokenExpiry: string
}

export interface StripeConfig {
  secretKey: string
  webhookSecret: string
}

export interface EmailConfig {
  host: string
  port: number
  user: string
  password: string
  from: string
}

export interface TenantConfig {
  tenantId: string
  branding: BrandingConfig
  features: FeatureFlags
  locale: LocaleConfig
  domain?: string
  customCss?: string
}

export interface AppConfig {
  env: Environment
  api: ApiConfig
  database: DatabaseConfig
  auth: AuthConfig
  stripe?: StripeConfig
  email?: EmailConfig
  defaultTenantId: string
  branding: BrandingConfig
  locale: LocaleConfig
  features: FeatureFlags
}
