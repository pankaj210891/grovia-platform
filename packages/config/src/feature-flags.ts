import type { FeatureFlags } from './types'

function readBoolFlag(key: string, defaultValue: boolean): boolean {
  const v = process.env[key]
  if (v === undefined || v === '') return defaultValue
  return v === 'true' || v === '1'
}

export function getDefaultFeatureFlags(): FeatureFlags {
  return {
    multiVendor: readBoolFlag('FEATURE_MULTI_VENDOR', false),
    guestCheckout: readBoolFlag('FEATURE_GUEST_CHECKOUT', true),
    wishlist: readBoolFlag('FEATURE_WISHLIST', true),
    reviews: readBoolFlag('FEATURE_REVIEWS', true),
    loyaltyPoints: readBoolFlag('FEATURE_LOYALTY_POINTS', false),
    stripeCheckout: readBoolFlag('FEATURE_STRIPE_CHECKOUT', false),
    emailNotifications: readBoolFlag('FEATURE_EMAIL_NOTIFICATIONS', false),
    smsNotifications: readBoolFlag('FEATURE_SMS_NOTIFICATIONS', false),
    darkMode: readBoolFlag('FEATURE_DARK_MODE', true),
    internationalShipping: readBoolFlag('FEATURE_INTERNATIONAL_SHIPPING', false),
  }
}

export function isFeatureEnabled(
  flag: keyof FeatureFlags,
  overrides?: Partial<FeatureFlags>
): boolean {
  if (overrides) {
    const val = overrides[flag]
    if (val !== undefined) return val
  }
  return getDefaultFeatureFlags()[flag]
}
