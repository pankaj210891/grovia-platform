# packages/config — Verification Report

## Critical (FIXED)

### C-1: `isFeatureEnabled` returns `undefined` cast as `boolean`
**File:** `src/feature-flags.ts`
**Root cause:** `flag in overrides` is `true` even when `overrides[flag]` is `undefined`
(Partial allows explicit-undefined keys). The old `as boolean` cast silently lied at runtime.
**Fix:** Check `val !== undefined` explicitly before returning; fall through to default otherwise.
**Status:** FIXED ✓

### C-2: `getConfig()` accepted empty-string JWT secrets and empty DB URIs
**File:** `src/config.ts`
**Root cause:** Raw `process.env` reads with `?? ''` fallbacks bypassed `validateServerEnv()`.
Empty `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` mean tokens can be trivially forged.
Empty `MONGODB_URI` / `REDIS_URL` fail silently at connection time rather than at startup.
**Fix:** `getConfig()` now calls `validateServerEnv()` as its single source of env parsing.
The Zod schema enforces `min(1)` on DB URIs and `min(32)` on JWT secrets — missing vars
throw with a clear message at startup rather than producing a broken silent config.
**Status:** FIXED ✓

### C-3: `AppConfig.env` set via unsafe `as` cast
**File:** `src/config.ts`
**Root cause:** `(env['NODE_ENV'] ?? 'development') as AppConfig['env']` bypassed the
`Environment` enum — any arbitrary string was silently accepted.
**Fix:** Resolved by C-2; `env.NODE_ENV` is now the Zod-validated `z.enum(...)` result,
TypeScript infers the correct `Environment` type without a cast.
**Status:** FIXED ✓ (resolved as part of C-2)

---

## Regressions

None. `tsc --noEmit` passes cleanly. No other packages in the monorepo currently import
`@grovia/config`, so the behaviour change in `getConfig()` (throws on missing required vars
instead of returning empty strings) has zero blast radius at this stage.

---

## Remaining High / Medium

### H-1: `branding.ts`, `locale.ts`, `feature-flags.ts` read `process.env` directly
These subsystems are not routed through `validateServerEnv()`. They have safe hardcoded
defaults so they do not pose a runtime safety risk, but they're a second code path for
env-var reading that can drift from the Zod schema over time.
**Recommendation:** In a future pass, drive them from a shared validated-env result rather
than raw `process.env`.

### H-2: `NEXT_PUBLIC_API_URL` not in `serverEnvSchema`
`getConfig()` still reads `process.env['NEXT_PUBLIC_API_URL']` directly (public-prefixed vars
live in `publicEnvSchema`, not `serverEnvSchema`). This is architecturally correct but means
the public URL has no validation at startup.
**Recommendation:** Call `validatePublicEnv()` alongside `validateServerEnv()` in a top-level
bootstrap helper, or add `NEXT_PUBLIC_API_URL` to `serverEnvSchema` as an optional override.
