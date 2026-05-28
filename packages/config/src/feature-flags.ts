import type { FeatureFlags } from './types'
import type { ServerEnv } from './env'
import { validateServerEnv } from './env'

export function getDefaultFeatureFlags(env?: ServerEnv): FeatureFlags {
  const e = env ?? validateServerEnv()
  return {
    multiVendor: e.FEATURE_MULTI_VENDOR,
    guestCheckout: e.FEATURE_GUEST_CHECKOUT,
    wishlist: e.FEATURE_WISHLIST,
    reviews: e.FEATURE_REVIEWS,
    loyaltyPoints: e.FEATURE_LOYALTY_POINTS,
    stripeCheckout: e.FEATURE_STRIPE_CHECKOUT,
    emailNotifications: e.FEATURE_EMAIL_NOTIFICATIONS,
    smsNotifications: e.FEATURE_SMS_NOTIFICATIONS,
    darkMode: e.FEATURE_DARK_MODE,
    internationalShipping: e.FEATURE_INTERNATIONAL_SHIPPING,
  }
}

export function isFeatureEnabled(
  flag: keyof FeatureFlags,
  overrides?: Partial<FeatureFlags>,
  env?: ServerEnv
): boolean {
  if (overrides) {
    const val = overrides[flag]
    if (val !== undefined) return val
  }
  return getDefaultFeatureFlags(env)[flag]
}
