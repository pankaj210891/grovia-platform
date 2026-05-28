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
**Status:** FIXED ✓

All three subsystems now accept `env?: ServerEnv`. When called without an argument they
fall back to `validateServerEnv()`. `getConfig()` passes the already-validated `env` down
to each subsystem, so there is only one `validateServerEnv()` call per `getConfig()` invocation.

Social URL fields (`BRAND_TWITTER_URL`, `BRAND_INSTAGRAM_URL`, `BRAND_FACEBOOK_URL`) were
added to `serverEnvSchema` with `z.string().url().optional()` so `branding.ts` social-links
logic is fully schema-backed.

### H-2: `NEXT_PUBLIC_API_URL` not in `serverEnvSchema`
**Status:** FIXED ✓

`getConfig()` now calls `validatePublicEnv()` alongside `validateServerEnv()`. The API URL
is read from the Zod-validated `publicEnv.NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)
instead of raw `process.env`.

---

## Regressions After H-1 / H-2 Fixes

None found.

- `tsc --noEmit` passes cleanly.
- All signature changes are backwards-compatible (new parameters are optional).
- `getConfig()` now throws on invalid public env vars in addition to server env vars;
  all public vars have defaults so this has no impact on existing callers.
- No other packages in the monorepo currently import `@grovia/config`.

---

## Low Issues

### L-1: `BRAND_LOGO_URL` / `BRAND_FAVICON_URL` missing URL format validation
**File:** `src/env.ts`
**Root cause:** Both fields used `z.string().optional()` without `.url()`, unlike the social link
fields (`BRAND_TWITTER_URL` etc.) which already had `.url()` validation. Invalid URL strings
would be silently accepted and forwarded to consumers (e.g., `<img src>` tags).
**Fix:** Added `.url()` to both fields — now consistent with social link validation.
**Status:** FIXED ✓

### L-2: `EMAIL_FROM` default hardcoded `grovia.com` brand — white-label violation
**File:** `src/env.ts`, `src/types.ts`
**Root cause:** `EMAIL_FROM` had `default('noreply@grovia.com')` baked into the Zod schema.
Every operator config silently inherited a Grovia-branded sender address, violating the
platform's white-label architecture principle.
**Fix:** `EMAIL_FROM` is now `z.string().email().optional()`. `EmailConfig.from` changed to
`from?: string`. Operators must explicitly set `EMAIL_FROM` when SMTP is enabled, which is
the correct behaviour for a white-label platform.
**Status:** FIXED ✓

### L-3: Social links condition used `??` chain — semantically misleading
**File:** `src/branding.ts`
**Root cause:** `e.BRAND_TWITTER_URL ?? e.BRAND_INSTAGRAM_URL ?? e.BRAND_FACEBOOK_URL` was
used as the truthiness check for creating the `socialLinks` object. This worked at runtime
(all values are string or undefined, never `null`/`0`/`''`), but `??` reads as "use first
non-nullish value" rather than "any value is present".
**Fix:** Changed to `||` which clearly communicates "any of these is truthy".
**Status:** FIXED ✓

### L-4: `locale.ts` date/time fallback was US-centric and table was too narrow
**File:** `src/locale.ts`
**Root cause:** Unknown locales fell back to `'MM/DD/YYYY'` (US MDY format) regardless of
language. A white-label operator setting `DEFAULT_LOCALE=fr-BE` would silently get US-style
dates. The lookup tables covered only 6 locales.
**Fix:**
- Expanded `DATE_FORMATS` to 20 locales and `TIME_FORMATS` to 20 locales covering major
  regional variants.
- Added `inferDateFormat` / `inferTimeFormat` helpers: for unknown locales, infer format
  from BCP 47 language tag (CJK → ISO `YYYY-MM-DD`; `en-US`/`en-AU` → 12h MDY; all others
  → `DD/MM/YYYY` / 24h). This is the correct international default rather than US format.
**Status:** FIXED ✓

---

## Regressions After LOW Fixes

None.

- `tsc --noEmit` passes cleanly after all four LOW fixes.
- All signature changes are backwards-compatible (`EmailConfig.from` widened to optional,
  which is a non-breaking type relaxation for consumers).
- `BRAND_LOGO_URL`/`BRAND_FAVICON_URL` callers supplying invalid URLs now get a startup
  error rather than silent bad data — intentional tightening, zero blast radius since no
  packages currently import `@grovia/config`.
- `EMAIL_FROM` removal of default: operators not currently setting `EMAIL_FROM` will have
  `config.email?.from === undefined`. Since `email` is already optional and no downstream
  packages consume it yet, blast radius is zero.
