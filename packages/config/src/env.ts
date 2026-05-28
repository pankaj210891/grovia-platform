import { z } from 'zod'

type EnvInput = Record<string, string | undefined>

const boolFlag = (defaultOn = false) =>
  z
    .string()
    .default(defaultOn ? 'true' : 'false')
    .transform((v) => v === 'true' || v === '1')

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  // Database (required in production)
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Auth secrets — must be at least 32 chars
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  // Stripe (optional — feature-gated)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email / SMTP (optional — feature-gated)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@grovia.com'),

  // Tenant
  DEFAULT_TENANT_ID: z.string().default('default'),

  // Branding
  BRAND_NAME: z.string().default('Grovia'),
  BRAND_LOGO_URL: z.string().optional(),
  BRAND_FAVICON_URL: z.string().optional(),
  BRAND_PRIMARY_COLOR: z.string().default('#2563EB'),
  BRAND_ACCENT_COLOR: z.string().default('#7C3AED'),
  BRAND_SUPPORT_EMAIL: z.string().email().optional(),
  BRAND_SUPPORT_PHONE: z.string().optional(),

  // Locale
  DEFAULT_LOCALE: z.string().default('en-US'),
  DEFAULT_CURRENCY: z.string().length(3).default('USD'),
  DEFAULT_TIMEZONE: z.string().default('UTC'),

  // Feature flags
  FEATURE_MULTI_VENDOR: boolFlag(),
  FEATURE_GUEST_CHECKOUT: boolFlag(true),
  FEATURE_WISHLIST: boolFlag(true),
  FEATURE_REVIEWS: boolFlag(true),
  FEATURE_LOYALTY_POINTS: boolFlag(),
  FEATURE_STRIPE_CHECKOUT: boolFlag(),
  FEATURE_EMAIL_NOTIFICATIONS: boolFlag(),
  FEATURE_SMS_NOTIFICATIONS: boolFlag(),
  FEATURE_DARK_MODE: boolFlag(true),
  FEATURE_INTERNATIONAL_SHIPPING: boolFlag(),
})

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_STOREFRONT_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_ADMIN_URL: z.string().url().default('http://localhost:3002'),
  NEXT_PUBLIC_VENDOR_URL: z.string().url().default('http://localhost:3003'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type PublicEnv = z.infer<typeof publicEnvSchema>

function formatZodErrors(errors: Record<string, string[] | undefined>): string {
  return Object.entries(errors)
    .filter(([, msgs]) => msgs && msgs.length > 0)
    .map(([key, msgs]) => `  ${key}: ${msgs!.join(', ')}`)
    .join('\n')
}

export function validateServerEnv(env: EnvInput = process.env as EnvInput): ServerEnv {
  const result = serverEnvSchema.safeParse(env)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    throw new Error(`Invalid server environment variables:\n${formatZodErrors(errors)}`)
  }
  return result.data
}

export function validatePublicEnv(env: EnvInput = process.env as EnvInput): PublicEnv {
  const result = publicEnvSchema.safeParse(env)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    throw new Error(`Invalid public environment variables:\n${formatZodErrors(errors)}`)
  }
  return result.data
}
